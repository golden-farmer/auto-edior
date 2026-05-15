import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { prompt, referenceImage } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "프롬프트가 필요합니다." }, { status: 400 });
    }

    const { profile } = await getAuthenticatedContext();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const finalApiKey = profile.gemini_api_key;

    if (!finalApiKey) {
      return NextResponse.json({ error: "NO_API_KEY" }, { status: 403 });
    }

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];

    if (referenceImage) {
      const match = referenceImage.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${finalApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      if (
        res.status === 429 ||
        data.error?.code === 429 ||
        data.error?.message?.toLowerCase().includes("quota")
      ) {
        return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 429 });
      }
      if (
        data.error?.message?.includes("API_KEY_INVALID") ||
        data.error?.message?.includes("API key not valid")
      ) {
        return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
      }
      if (
        res.status === 503 ||
        data.error?.message?.includes("UNAVAILABLE") ||
        data.error?.message?.includes("high demand")
      ) {
        return NextResponse.json(
          { error: "Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요." },
          { status: 503 },
        );
      }
      throw new Error(data.error?.message || "이미지 생성 실패");
    }

    const responseParts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find((part: { inlineData?: object }) => part.inlineData);
    const base64Image = imagePart?.inlineData?.data;

    if (!base64Image) {
      throw new Error(`이미지 데이터 누락. 응답값: ${JSON.stringify(data).substring(0, 800)}`);
    }

    return NextResponse.json({ base64Image }, { status: 200 });
  } catch (error: unknown) {
    console.error("썸네일 이미지 생성 오류:", error);
    const message = error instanceof Error ? error.message : "이미지 생성 중 오류가 발생했습니다.";

    if (message.includes("429") || message.includes("QUOTA_EXCEEDED") || message.toLowerCase().includes("quota")) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 429 });
    }
    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    if (message.includes("503") || message.includes("UNAVAILABLE") || message.includes("high demand")) {
      return NextResponse.json(
        { error: "Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
