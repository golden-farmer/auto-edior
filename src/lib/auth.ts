import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "USER" | "ADMIN";
export type AppUserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AppProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  company_name: string | null;
  gemini_api_key: string | null;
  role: AppRole;
  status: AppUserStatus;
  created_at: string;
  updated_at: string;
};

export async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null as AppProfile | null };
  }

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

  return {
    supabase,
    user,
    profile: profile ?? null,
  };
}
