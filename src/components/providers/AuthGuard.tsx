"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { hasSite1Access } from "@/lib/auth-shared";

const PUBLIC_PATHS = ["/login", "/auth/callback"];
const EXEMPT_PATHS = ["/pending", "/access-denied"];
const isDevAuthBypass =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isDevAuthBypass) {
      return;
    }

    if (status === "loading") {
      return;
    }

    const isApiRoute = pathname.startsWith("/api");
    const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
    const isExemptPath = EXEMPT_PATHS.some((path) =>
      pathname.startsWith(path),
    );

    if (status === "unauthenticated") {
      if (!isPublicPath && !isApiRoute) {
        router.push("/login");
      }
      return;
    }

    const isApproved = profile?.status === "APPROVED";
    const canAccessSite1 = isApproved && hasSite1Access(profile);

    if (canAccessSite1) {
      if (pathname === "/login" || pathname === "/pending" || pathname === "/access-denied") {
        router.push("/dashboard");
      }
      return;
    }

    if (!isExemptPath && !isApiRoute) {
      router.push(isApproved ? "/access-denied" : "/pending");
    }
  }, [pathname, profile, router, status]);

  if (isDevAuthBypass) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated" && pathname !== "/login") {
    return null;
  }

  if (
    status === "authenticated" &&
    (profile?.status !== "APPROVED" || !hasSite1Access(profile))
  ) {
    const allowedPath = profile?.status === "APPROVED" ? "/access-denied" : "/pending";
    if (pathname !== allowedPath) {
      return null;
    }
  }

  return <>{children}</>;
}
