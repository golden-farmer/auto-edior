// @ts-nocheck
import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { profile } = await getAuthenticatedContext();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages } = await req.json();

    const companyName = profile.company_name || "고객님";
    const apiKey = profile.gemini_api_key;

    if (!apiKey) {
      return NextResponse.json({ error: "NO_API_KEY" }, { status: 403 });
    }

    const systemPrompt = `You are an expert Customer Service (CS) Agent for a fresh fruit store on Coupang. You must strictly adhere to all the rules below without exception.

# 1. INITIALIZATION & GREETING
- Once the company name is provided, create a warm, professional custom greeting in Korean incorporating the company name to use for all subsequent customer interactions.
The company name for this session is: **${companyName}**

# 2. INQUIRY HANDLING & DAMAGE PROTOCOL (CRITICAL)
- **Context Awareness:** You MUST review the entire conversation history above. If the customer has ALREADY provided the Coupang Order Number, DO NOT ask for it again.
- **Order Number:** If the Coupang Order Number has not yet been provided, politely ask for it first to track the inquiry.
- **Damage Claim Handling (Coupang API Restriction):** For ANY rot/damage reports, ALWAYS assume that the customer HAS ALREADY submitted the requested photos to the CS system. However, since you (the AI system) cannot directly view photos uploaded to Coupang's attachment system, you MUST ALWAYS ask the customer to manually state the damage scope.

# 3. CORE CS POLICIES
- 7-Day Limit applies to all quality complaints.
- Under 50% damage: partial refund.
- 50% or more damage: full refund.
- Refunds for damaged goods are only processed via direct bank transfer.
- Subjective taste or size complaints are not refundable.

# 4. RESPONSE STYLE
- Always respond in Korean.
- Start with empathy.
- Explain next steps clearly.`;

    const contents = messages.map((message: any) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      if (
        response.status === 429 ||
        errText.includes("Resource has been exhausted") ||
        errText.toLowerCase().includes("quota")
      ) {
        return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 429 });
      }
      if (errText.includes("API_KEY_INVALID") || errText.includes("API key not valid")) {
        return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
      }
      if (
        response.status === 503 ||
        errText.includes("UNAVAILABLE") ||
        errText.includes("high demand")
      ) {
        return NextResponse.json(
          { error: "Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Failed to generate AI response" }, { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Error connecting to Gemini:", error);
    if (
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.toLowerCase().includes("quota")
    ) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED" }, { status: 429 });
    }
    if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("API key not valid")) {
      return NextResponse.json({ error: "INVALID_API_KEY" }, { status: 401 });
    }
    if (
      error?.message?.includes("503") ||
      error?.message?.includes("UNAVAILABLE") ||
      error?.message?.includes("high demand")
    ) {
      return NextResponse.json(
        { error: "Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
