import { NextRequest, NextResponse } from "next/server";
import {
  analyzeProductImage,
  generateCautionNotice,
  generateComparisonTableData,
  generateHookingCopy,
  generateReviewSummary,
  generateSellingPoints,
  generateStorageTips,
  generateSummaryCardData,
} from "@/lib/ai/gemini";
import { getAuthenticatedContext } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userGeminiKey = profile.gemini_api_key || undefined;

    if (!userGeminiKey) {
      return NextResponse.json({ error: "NO_API_KEY" }, { status: 403 });
    }

    const { action, productName, description, imageBase64, imageAnalysis, rowCount } =
      await request.json();

    let result: string;

    switch (action) {
      case "review-summary":
        result = await generateReviewSummary(productName, description, userGeminiKey);
        break;
      case "caution-notice":
        result = await generateCautionNotice(productName, userGeminiKey);
        break;
      case "analyze-image":
        if (!imageBase64) {
          return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }
        result = await analyzeProductImage(imageBase64, userGeminiKey);
        break;
      case "hooking-copy":
        if (!productName) {
          return NextResponse.json(
            { error: "Product name is required" },
            { status: 400 },
          );
        }
        result = await generateHookingCopy(productName, imageAnalysis || "", userGeminiKey);
        break;
      case "selling-points":
        if (!productName) {
          return NextResponse.json(
            { error: "Product name is required" },
            { status: 400 },
          );
        }
        result = await generateSellingPoints(productName, imageAnalysis || "", userGeminiKey);
        break;
      case "storage-tips":
        if (!productName) {
          return NextResponse.json(
            { error: "Product name is required" },
            { status: 400 },
          );
        }
        result = await generateStorageTips(productName, userGeminiKey);
        break;
      case "comparison-table":
        result = await generateComparisonTableData(productName, rowCount || 3, userGeminiKey);
        break;
      case "summary-card":
        result = await generateSummaryCardData(productName, userGeminiKey);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";

    if (message === "QUOTA_EXCEEDED") {
      return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 429 });
    }
    if (message === "NO_API_KEY") {
      return NextResponse.json({ error: "NO_API_KEY" }, { status: 403 });
    }
    if (message === "INVALID_API_KEY") {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    if (message === "GEMINI_OVERLOADED") {
      return NextResponse.json({ error: "Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
    }
    if (message === "GEMINI_API_ERROR") {
      return NextResponse.json({ error: "AI 서비스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
