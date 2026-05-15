import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

function maskKey(key: string) {
  if (key.length <= 8) {
    return "********";
  }

  return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
}

export async function GET(_req: NextRequest) {
  try {
    const { profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!profile.gemini_api_key) {
      return NextResponse.json({ hasKey: false, maskedKey: null });
    }

    return NextResponse.json({
      hasKey: true,
      maskedKey: maskKey(profile.gemini_api_key),
    });
  } catch (error) {
    console.error("API Key GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { geminiApiKey } = body;

    if (typeof geminiApiKey !== "string") {
      return NextResponse.json({ error: "Invalid API Key format" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update({ gemini_api_key: geminiApiKey })
      .eq("id", profile.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "API 키가 저장되었습니다." });
  } catch (error) {
    console.error("API Key POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
