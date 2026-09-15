import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSite1Access, type AppProfile } from "@/lib/auth-shared";

const isDevAuthBypass =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
const devProfile: AppProfile = {
  id: "dev-user",
  email: "dev@localhost",
  name: "Dev User",
  image: null,
  company_name: "Dev Company",
  gemini_api_key: null,
  role: "ADMIN",
  status: "APPROVED",
  plan_type: "paid",
  app_access: "site1",
  upgraded_at: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

export async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();

  if (isDevAuthBypass) {
    return { supabase, user: null, profile: devProfile };
  }

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
    profile: hasSite1Access(profile ?? null) ? profile ?? null : null,
  };
}
