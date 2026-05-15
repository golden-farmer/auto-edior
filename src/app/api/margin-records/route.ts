import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("margin_records")
      .select("*")
      .eq("user_id", profile.id)
      .order("month", { ascending: false })
      .order("tab_name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ records: data ?? [] }, { status: 200 });
  } catch (error: unknown) {
    console.error("[GET_MARGIN_RECORDS]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month, tabName, data } = await req.json();

    if (!month || !tabName || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: record, error } = await supabase
      .from("margin_records")
      .upsert(
        {
          user_id: profile.id,
          month,
          tab_name: tabName,
          data,
        },
        { onConflict: "user_id,month,tab_name" },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ record }, { status: 200 });
  } catch (error: unknown) {
    console.error("[POST_MARGIN_RECORD]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const tabName = url.searchParams.get("tabName");

    if (!month || !tabName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("margin_records")
      .delete()
      .eq("user_id", profile.id)
      .eq("month", month)
      .eq("tab_name", tabName);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[DELETE_MARGIN_RECORD]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month, oldTabName, newTabName } = await req.json();

    if (!month || !oldTabName || !newTabName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("margin_records")
      .update({ tab_name: newTabName })
      .eq("user_id", profile.id)
      .eq("month", month)
      .eq("tab_name", oldTabName);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[PATCH_MARGIN_RECORD]", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
