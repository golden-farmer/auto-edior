import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuthenticatedContext } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { ingredient, category, customPrompt } = await request.json();

    if (!ingredient || !category) {
      return NextResponse.json(
        { error: "식재료와 카테고리를 모두 입력해주세요." },
        { status: 400 },
      );
    }

    const { profile } = await getAuthenticatedContext();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const finalApiKey = profile.gemini_api_key;

    if (!finalApiKey) {
      return NextResponse.json({ error: "NO_API_KEY" }, { status: 403 });
    }

    const genAI = new GoogleGenerativeAI(finalApiKey);

    const systemInstruction = `당신은 쿠팡 최상위 판매자의 상세페이지 및 썸네일용 비주얼 프롬프트를 만드는 푸드 디렉터입니다.
입력된 식재료의 특성을 분석하여, 소비자의 식감을 자극하는 '맛있어 보이는 상태'를 극사실적으로 묘사한 이미지 생성용 영어 프롬프트를 작성해주세요.

[이미지 생성 가이드라인]
공통 구도: 식재료를 정사각형 1:1 비율의 매크로로 크게 보여주세요. 텍스트나 로고는 넣지 말고 배경은 단순화하되 식재료와 어울리는 자연스러운 무드를 유지해주세요.
카테고리별 강조:
1. 과일: 반으로 자른 단면 위주. 과즙이 흐르거나 빛에 반사되는 질감을 강조.
2. 잎채소: 아삭한 결, 수분감, 선명한 조직 표현을 강조.
3. 구황작물: 따뜻한 김과 포근한 속살, rustic한 배경을 강조.
기술 표현: 8K resolution, ultra-detailed, photorealistic, food photography, side lighting, shallow depth of field, cinematic lighting.

결과물은 오직 영어 프롬프트 문장만 출력하세요.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    let prompt = `카테고리: ${category}\n식재료명: ${ingredient}`;
    if (customPrompt && customPrompt.trim() !== "") {
      prompt += `\n추가 연출 요구사항: ${customPrompt.trim()}`;
    }
    prompt += "\n\n위 정보를 바탕으로 이미지 생성용 영어 프롬프트를 만들어줘.";

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ prompt: responseText.trim() }, { status: 200 });
  } catch (error: unknown) {
    console.error("썸네일 프롬프트 생성 오류:", error);
    const message = error instanceof Error ? error.message : "프롬프트 생성 중 오류가 발생했습니다.";

    if (
      message.includes("429") ||
      message.includes("QUOTA_EXCEEDED") ||
      message.toLowerCase().includes("quota") ||
      message.includes("Resource has been exhausted")
    ) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 429 });
    }
    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    if (
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("high demand")
    ) {
      return NextResponse.json(
        { error: "Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
