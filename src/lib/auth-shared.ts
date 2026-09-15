export type AppRole = "USER" | "ADMIN";
export type AppUserStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type AppPlanType = "free" | "paid";
export type AppAccess = "site1" | "site2" | "both";

export type AppProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  company_name: string | null;
  gemini_api_key: string | null;
  role: AppRole;
  status: AppUserStatus;
  plan_type?: AppPlanType | null;
  app_access?: AppAccess | null;
  upgraded_at?: string | null;
  created_at: string;
  updated_at: string;
};

export function hasSite1Access(profile: Pick<AppProfile, "app_access" | "plan_type"> | null) {
  if (!profile) {
    return false;
  }

  const appAccess = profile.app_access ?? "site1";
  return appAccess === "site1" || appAccess === "both";
}

export function shouldConvertExpiredSite2UserToSite1(profile: AppProfile | null) {
  return (
    profile?.status === "EXPIRED" &&
    profile.plan_type === "free" &&
    profile.app_access === "site2"
  );
}
