// Stability AI SDXL client for Img2Img transformation

const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image';

// Denoising strength 0.35 for copyright avoidance while maintaining image quality
const DEFAULT_DENOISING_STRENGTH = 0.35;

interface StabilityResponse {
    artifacts: Array<{
        base64: string;
        seed: number;
        finishReason: string;
    }>;
}

export async function transformImage(
    imageBase64: string,
    prompt: string = '고품질 과일 상품 사진, 전문 푸드 포토그래피, 선명하고 생동감 있는 색상',
    denoisingStrength: number = DEFAULT_DENOISING_STRENGTH
): Promise<string> {
    const apiKey = process.env.STABILITY_AI_API_KEY;
    if (!apiKey) throw new Error('STABILITY_AI_API_KEY is not set');

    // Convert base64 to blob
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('init_image', blob, 'image.png');
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', String(1 - denoisingStrength)); // Stability uses image_strength (inverse of denoising)
    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1');
    formData.append('cfg_scale', '7');
    formData.append('samples', '1');
    formData.append('steps', '30');

    const response = await fetch(STABILITY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stability AI error: ${error}`);
    }

    const data: StabilityResponse = await response.json();
    return data.artifacts?.[0]?.base64 || '';
}

export async function batchTransformImages(
    images: string[],
    onProgress?: (current: number, total: number) => void
): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < images.length; i++) {
        const transformed = await transformImage(images[i]);
        results.push(transformed);
        onProgress?.(i + 1, images.length);
    }

    return results;
}
