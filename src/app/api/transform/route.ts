import { NextRequest, NextResponse } from 'next/server';
import { transformImage } from '@/lib/ai/stability';

export async function POST(request: NextRequest) {
    try {
        const { imageBase64, prompt } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const transformedImage = await transformImage(imageBase64, prompt);

        // Stateless: Image is returned immediately and not stored
        return NextResponse.json({
            transformedImage,
            message: 'Image transformed successfully'
        });
    } catch (error) {
        console.error('Transform API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
