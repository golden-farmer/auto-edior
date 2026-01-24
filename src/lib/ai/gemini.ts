// Gemini AI client for text generation and vision analysis

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

export async function generateReviewSummary(productName: string, description: string): Promise<string> {
    const prompt = `당신은 과일 상품의 리뷰 요약 전문가입니다. 
다음 과일 상품에 대해 긍정적이고 신뢰성 있는 리뷰 요약을 작성해주세요.
상품명: ${productName}
상품 설명: ${description}

요약은 3~4문장으로 작성하고, 신선함, 맛, 품질에 대해 언급해주세요.`;

    const response = await callGemini(prompt);
    return response;
}

export async function generateCautionNotice(productName: string): Promise<string> {
    const prompt = `당신은 과일 상품 주의사항 전문가입니다.
다음 과일 상품에 대해 일반적인 주의사항을 작성해주세요.
상품명: ${productName}

주의사항은 3~5개 항목으로 작성하고, 보관법, 섭취 시 주의점, 알레르기 등을 포함해주세요.
각 항목은 "• " 로 시작해주세요.`;

    const response = await callGemini(prompt);
    return response;
}

export async function analyzeProductImage(imageBase64: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: '이 과일 이미지를 분석해서 색상, 신선도, 크기, 특징을 간단히 설명해주세요.' },
                    { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
                ]
            }]
        })
    });

    const data: GeminiResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data: GeminiResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
