import { NextRequest, NextResponse } from 'next/server';
import {
    generateReviewSummary,
    generateCautionNotice,
    analyzeProductImage,
    generateHookingCopy,
    generateSellingPoints,
    generateStorageTips
} from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const { action, productName, description, imageBase64, imageAnalysis } = await request.json();

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
            case 'hooking-copy':
                if (!productName) {
                    return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
                }
                result = await generateHookingCopy(productName, imageAnalysis || '');
                break;
            case 'selling-points':
                if (!productName) {
                    return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
                }
                result = await generateSellingPoints(productName, imageAnalysis || '');
                break;
            case 'storage-tips':
                if (!productName) {
                    return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
                }
                result = await generateStorageTips(productName);
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
