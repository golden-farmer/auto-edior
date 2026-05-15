import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

export async function GET() {
  const { profile } = await getAuthenticatedContext();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ companyName: profile.company_name || "" });
}

export async function PUT(req: Request) {
  const { supabase, profile } = await getAuthenticatedContext();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { companyName } = await req.json();
    const { data, error } = await supabase
      .from("users")
      .update({ company_name: companyName ?? null })
      .eq("id", profile.id)
      .select("company_name")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ companyName: data.company_name || "" });
  } catch (error) {
    console.error("Error updating company name:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
