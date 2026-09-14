"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

const PUBLIC_PATHS = ["/login", "/auth/callback"];
const APPROVAL_EXEMPT_PATHS = ["/pending"];
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
    const isApprovalExempt = APPROVAL_EXEMPT_PATHS.some((path) =>
      pathname.startsWith(path),
    );

    if (status === "unauthenticated") {
      if (!isPublicPath && !isApiRoute) {
        router.push("/login");
      }
      return;
    }

    if (profile?.status === "APPROVED") {
      if (pathname === "/login" || pathname === "/pending") {
        router.push("/dashboard");
      }
      return;
    }

    if (!isApprovalExempt && !isApiRoute) {
      router.push("/pending");
    }
  }, [pathname, profile?.status, router, status]);

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

  if (status === "authenticated" && profile?.status !== "APPROVED") {
    if (pathname !== "/pending") {
      return null;
    }
  }

  return <>{children}</>;
}
