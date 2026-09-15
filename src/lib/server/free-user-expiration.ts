import type { SupabaseClient } from "@supabase/supabase-js";

const FREE_USERS_EXPIRATION_KEY = "free_users_expiration";

type FreeUsersExpirationSetting = {
  expiresAt?: string;
};

export type FreeUsersExpirationStatus = {
  expiresAt: string | null;
  pendingCount: number;
};

function getEligibleFreeUsersQuery(supabase: SupabaseClient) {
  return supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("plan_type", "free")
    .eq("app_access", "site2")
    .neq("role", "ADMIN")
    .in("status", ["PENDING", "APPROVED"]);
}

export async function applyDueFreeUserExpiration(supabase: SupabaseClient) {
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", FREE_USERS_EXPIRATION_KEY)
    .maybeSingle<{ value: FreeUsersExpirationSetting | null }>();

  const expiresAt = setting?.value?.expiresAt ?? null;

  if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) {
    return;
  }

  await supabase
    .from("users")
    .update({ status: "EXPIRED" })
    .eq("plan_type", "free")
    .eq("app_access", "site2")
    .neq("role", "ADMIN")
    .in("status", ["PENDING", "APPROVED"]);

  await supabase
    .from("app_settings")
    .update({ value: {} })
    .eq("key", FREE_USERS_EXPIRATION_KEY);
}

export async function getFreeUsersExpirationStatus(
  supabase: SupabaseClient,
): Promise<FreeUsersExpirationStatus> {
  await applyDueFreeUserExpiration(supabase);

  const { data: setting, error: settingError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", FREE_USERS_EXPIRATION_KEY)
    .maybeSingle<{ value: FreeUsersExpirationSetting | null }>();

  if (settingError) {
    throw settingError;
  }

  const { count, error: countError } = await getEligibleFreeUsersQuery(supabase);

  if (countError) {
    throw countError;
  }

  return {
    expiresAt: setting?.value?.expiresAt ?? null,
    pendingCount: count ?? 0,
  };
}

export async function setFreeUsersExpiration(
  supabase: SupabaseClient,
  expiresAt: string,
): Promise<FreeUsersExpirationStatus> {
  const parsedTime = new Date(expiresAt).getTime();

  if (!Number.isFinite(parsedTime)) {
    throw new Error("Invalid expiration date.");
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(
      {
        key: FREE_USERS_EXPIRATION_KEY,
        value: { expiresAt: new Date(parsedTime).toISOString() },
      },
      { onConflict: "key" },
    );

  if (error) {
    throw error;
  }

  return getFreeUsersExpirationStatus(supabase);
}
