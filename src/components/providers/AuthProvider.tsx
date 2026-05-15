"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppProfile } from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AppProfile | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function upsertAndLoadProfile(user: User) {
  const supabase = createClient();

  let { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<AppProfile>();

  if (!profile && user.email) {
    const { data: createdProfile } = await supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name ?? null,
          image: user.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single<AppProfile>();

    profile = createdProfile;
  }

  return profile ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const syncSession = async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }

    setUser(nextSession.user);
    const nextProfile = await upsertAndLoadProfile(nextSession.user);
    setProfile(nextProfile);
    setStatus("authenticated");
  };

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    status,
    refreshProfile: async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      setProfile(await upsertAndLoadProfile(user));
    },
    signOut: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
