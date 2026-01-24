import { NextRequest, NextResponse } from 'next/server';
import { generateReviewSummary, generateCautionNotice, analyzeProductImage } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const { action, productName, description, imageBase64 } = await request.json();

        let result: string;

        switch (action) {
            case 'review-summary':
                result = await generateReviewSummary(productName, description);
                break;
            case 'caution-notice':
                result = await generateCautionNotice(productName);
                break;
            case 'analyze-image':
                if (!imageBase64) {
                    return NextResponse.json({ error: 'Image is required' }, { status: 400 });
                }
                result = await analyzeProductImage(imageBase64);
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ result });
    } catch (error) {
        console.error('Gemini API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
