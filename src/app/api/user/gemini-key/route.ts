import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

export async function GET() {
  const { profile } = await getAuthenticatedContext();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ geminiApiKey: profile.gemini_api_key || "" });
}

export async function PUT(req: Request) {
  const { supabase, profile } = await getAuthenticatedContext();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { geminiApiKey } = await req.json();
    const { error } = await supabase
      .from("users")
      .update({ gemini_api_key: geminiApiKey ?? null })
      .eq("id", profile.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating Gemini API Key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
