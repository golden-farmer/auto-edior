// Gemini AI client for text generation and vision analysis

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
    }>;
}

// 1. 상단 후킹 문구 생성
export async function generateHookingCopy(fruitName: string, imageAnalysis: string): Promise<string> {
    const prompt = `[System Role] 너는 10년 차 이커머스 전문 카피라이터이자 과일 소싱 전문가야. 클릭을 부르는 '감성적'이면서도 '사실 기반'의 후킹 문구를 작성해 줘.

[Instruction] 입력된 {과일_이름}과 사진 분석 정보를 바탕으로 다음 조건에 맞춰 문구를 작성해.

톤앤매너: 산지직송의 신선함과 신뢰감이 느껴지는 정갈한 톤.
형식: 한 줄의 짧고 강렬한 문장. (영어 사용 절대 금지)
제약: 공백 포함 15자 이내. 최대한 간결하게 핵심만 전달.

예시: "농장에서 갓 수확한 압도적인 달콤함", "지금껏 알던 맛과는 다른 품격"

[Input] 
과일 이름: ${fruitName}
분석 데이터: ${imageAnalysis}

[Output] 한 줄의 짧은 한국어 후킹 문구만 출력해. 다른 설명 없이 데이터만.`;

    return await callGemini(prompt);
}

// 2. 소구점(Selling Point) 3종 생성
export async function generateSellingPoints(fruitName: string, imageAnalysis: string): Promise<string> {
    const prompt = `[System Role] 너는 쿠팡 로켓프레시 베스트셀러 제조기야. 고객이 고민 없이 장바구니에 담게 만드는 3단계 설득 문구를 작성해.

[Instruction] 다음 3가지 영역에 맞춰 소구점을 도출해 줘.

1. 맛과 당도: 압도적 달콤함이나 식감을 강조. (영어 금지)
2. 신선도와 산지: 수확 당일 발송이나 최적의 재배 환경.
3. 안전과 신뢰: 철저한 선별과 품질 보증.

[Input]
과일 이름: ${fruitName}
분석 데이터: ${imageAnalysis}

[Output Format]
소구점 1: [제목] / [상세설명 1줄]
소구점 2: [제목] / [상세설명 1줄]
소구점 3: [제목] / [상세설명 1줄]

[Constraint] 제목은 8자 이내, 상세설명은 15자 이내로 최대한 짧고 간결하게 한국어로만 작성할 것. 포맷 그대로 출력해.`;

    return await callGemini(prompt);
}

// 3. 품종별 주의사항 및 보관 팁
export async function generateStorageTips(fruitName: string): Promise<string> {
    const prompt = `[System Role] 너는 과일 품질 관리사(QC)야. 소비자가 과일을 가장 맛있게 오래 먹을 수 있는 가이드를 제공해.

[Instruction] ${fruitName}의 특성에 맞춰 다음 내용을 포함해 줘.

1. 보관법: 냉장/실온 여부 및 적정 온도.
2. 맛있게 먹는 법: 후숙 필요 여부나 세척 팁.
3. 주의사항: 신선식품 특성상 발생할 수 있는 자연스러운 현상 (예: 사과의 멍, 포도의 하얀 가루 등).

[Output] 3~4개의 불렛포인트 형태로 간결하게 작성. 각 항목은 "• " 로 시작해.`;

    return await callGemini(prompt);
}

export async function generateReviewSummary(productName: string, description: string): Promise<string> {
    const prompt = `[System Role] 너는 이커머스 실구매 고객들의 리뷰를 분석하고 핵심만 요약하는 '현명한 구매 가이드'야. 

[Instruction] 실제 고객이 쓴 것처럼 생생하고 친근한 어투(해요체)를 사용해서 ${productName}의 리뷰 3종을 작성해줘. 

[Condition]
1. 칭찬 일색의 딱딱한 홍보 문구가 아니라, "먹어보니 ~해서 좋았어요", "포장이 ~해서 안심됐어요" 같은 실구매자 느낌이 나야 해.
2. 각 리뷰는 서로 다른 포인트(맛, 포장, 신선도 등)를 강조해줘.
3. 각 리뷰는 제목(10자 이내)과 본문(30자 이내)으로 구성해줘.

[Output Format]
리뷰 1: [제목] / [본문]
리뷰 2: [제목] / [본문]
리뷰 3: [제목] / [본문]

[Input]
상품명: ${productName}
상품 설명: ${description}

[Output] 포맷에 맞춰 3개의 리뷰만 출력해.`;

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

export async function generateComparisonTableData(fruitName: string, rowCount: number): Promise<string> {
    const prompt = `[System Role] 너는 연 매출 100억 이상의 성과를 내는 프리미엄 신선식품 전문 MD이자 카피라이터야. 
    [Instruction] ${fruitName}을 주제로 총 ${rowCount}개의 압도적인 비교 항목을 작성해줘. 
    단순한 비교가 아니라, 타사 제품을 압도하는 구체적이고 전문적인 '럭셔리' 카피를 사용해.
    
    [Writing Rules]
    - "프리미엄급", "좋음" 같은 평범한 단어 사용 금지.
    - 대신 "상위 1% 정규품", "비파괴 당도 선별", "산지 직결 저온 물류" 같은 전문 용어 사용.
    - 영어 단어 절대 사용 금지 (Brix 대신 '브릭스' 또는 '당도' 사용).
    - 최대한 간결하고 강렬한 한국어 카피 위주로 작성.

    [Output Format]
    항목 1: [비교제목] | [우리 제품] | [일반 제품]
    ... (총 ${rowCount}개)

    [Constraint] 
    - 비교 제목은 4자 이내 (예: 당도, 선별, 산지, 신선도, 포장)
    - 우리 제품 특징은 12자 이내 (한국어로만 간결하게)
    - 일반 제품 특징은 12자 이내
    - 파이프(|) 기호로 구분. 다른 설명 없이 데이터만 출력.
    
    [Input] 과일 이름: ${fruitName}`;

    return await callGemini(prompt);
}

export async function generateSummaryCardData(fruitName: string): Promise<string> {
    const prompt = `[System Role] 너는 명품 과일 브랜드의 기획실장이야. 
    [Instruction] ${fruitName}의 핵심 가치 3가지를 '전문성'과 '데이터'가 돋보이게 선정해줘.
    
    [Writing Rules]
    - 영어 표현 전면 배제 (BRIX, GRADE, ORIGIN 등 절대 사용 금지).
    - 모든 용어는 한국어 전문 용어로 대체 (예: 당도, 등급, 원산지).
    - 최대한 간결하고 압축적인 문구로 핵심만 전달.
    
    [Output Format]
    지표 1: [항목명] | [구체적 값] | [강조문구]
    지표 2: [항목명] | [구체적 값] | [강조문구]
    지표 3: [항목명] | [구체적 값] | [강조문구]

    [Constraint]
    - 항목명: 8자 이내 한국어 (예: 당도 선별, 수확 일자, 정밀 품질)
    - 값: 12자 이내 구체적인 데이터 (예: 15브릭스 이상, 새벽 수확, 상위 1% 제품)
    - 강조문구: 10자 이내 한국어 (예: 당도 보장, 신선함 유지, 품질 검수)
    - 영어 사용 절대 금지. 파이프(|) 기호로 구분. 데이터만 출력.
    
    [Input] 과일 이름: ${fruitName}`;

    return await callGemini(prompt);
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
    if (!apiKey) {
        console.error('SERVER ERROR: GEMINI_API_KEY is not set');
        throw new Error('GEMINI_API_KEY is not set');
    }

    console.log('--- CALLING GEMINI API ---');
    console.log('Prompt head:', prompt.substring(0, 50) + '...');

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`GEMINI API ERROR (${response.status}):`, errText);
            return '';
        }

        const data: GeminiResponse = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!result) {
            console.warn('GEMINI API WARNING: Received empty result. Data:', JSON.stringify(data));
        } else {
            console.log('Gemini Success. Result length:', result.length);
        }

        return result;
    } catch (error) {
        console.error('FETCH ERROR calling Gemini:', error);
        return '';
    }
}
