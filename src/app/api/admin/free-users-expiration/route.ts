import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getFreeUsersExpirationStatus,
  setFreeUsersExpiration,
} from "@/lib/server/free-user-expiration";

async function requireAdmin() {
  const { profile } = await getAuthenticatedContext();

  if (!profile || profile.role !== "ADMIN") {
    return null;
  }

  return profile;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const status = await getFreeUsersExpirationStatus(supabase);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to load free users expiration", error);
    return NextResponse.json(
      { error: "Failed to load free users expiration" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const expiresAt = String(body.expiresAt || "");

    if (!expiresAt) {
      return NextResponse.json(
        { error: "Expiration date is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const status = await setFreeUsersExpiration(supabase, expiresAt);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to save free users expiration", error);
    return NextResponse.json(
      { error: "Failed to save free users expiration" },
      { status: 500 },
    );
  }
}
