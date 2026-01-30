// Image stitching and ZIP generation utilities

// Image stitching and ZIP generation utilities

const MAX_IMAGE_HEIGHT = 3000; // Reduced to 3000 to ensure <20MB file size at 780px width
const IMAGE_WIDTH = 780; // Coupang Standard Width

export interface StitchResult {
    images: string[]; // Base64 images
    needsZip: boolean;
    totalHeight: number;
}

export interface CaptureOptions {
    titleFont?: string;
    bodyFont?: string;
    textScale?: number;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
}

/**
 * stitchModuleImages
 * REVERTED to Module-by-Module capture for maximum stability (User Request).
 * 
 * Key Features:
 * 1. Capture each module individually (Avoids large canvas crashes).
 * 2. INJECTS style variables into each module (Fixes font/color/size issues).
 * 3. Stitches them together into chunks of MAX_IMAGE_HEIGHT.
 */
export async function stitchModuleImages(
    moduleElements: HTMLElement[],
    onProgress?: (current: number, total: number) => void,
    options?: CaptureOptions
): Promise<StitchResult> {
    const { toPng } = await import('html-to-image');

    // Capture each module as image
    const moduleImages: { dataUrl: string; height: number }[] = [];

    // Construct the re-injection styles.
    // This is CRITICAL. Without this, individual modules lose their context styles.
    const styleVariables = options ? {
        '--font-title': `'${options.titleFont}', sans-serif`,
        '--font-body': `'${options.bodyFont}', sans-serif`,
        '--text-scale': options.textScale?.toString() || '1',
        '--color-primary': options.primaryColor || '#2E7D32',
        '--color-secondary': options.secondaryColor || '#E8F5E9',
        '--color-text': options.textColor || '#1B5E20',
    } : {};

    for (let i = 0; i < moduleElements.length; i++) {
        const element = moduleElements[i];
        let dataUrl: string = ''; // Initialize to satisfy TS

        let retries = 3;
        while (retries > 0) {
            try {
                // Wait for fonts to be ready
                if (document.fonts) await document.fonts.ready;

                // Strategy: Capture at 430px (Layout Width) but export at 780px (Coupang) using pixelRatio
                const COUPANG_WIDTH = 780;
                const LAYOUT_WIDTH = 430;
                const pixelRatio = COUPANG_WIDTH / LAYOUT_WIDTH; // approx 1.814

                // Cast options to any to avoid "useCORS does not exist" type error (library version mismatch often causes this)
                const captureOptions: any = {
                    quality: 0.98,
                    pixelRatio: pixelRatio,
                    cacheBust: true,
                    useCORS: true,       // [Fix] Essential for external images
                    skipAutoScale: true, // [Fix] Prevent internal scaling weirdness
                    style: {
                        width: `${LAYOUT_WIDTH}px`, // Keep layout consistent with preview
                        backgroundColor: '#ffffff', // [Fix] Force white background to prevent transparency
                        margin: '0',
                        padding: '0',
                        ...styleVariables
                    },
                    filter: (node: any) => {
                        const classList = node.classList;
                        return !(classList && classList.contains('no-capture'));
                    }
                };

                // [Robustness] Pre-convert all images to Base64 to bypass toPng's internal fetcher
                // This solves "empty object" errors caused by Tainted Canvas or Network Timeouts during capture.
                const imagePromises = Array.from(element.querySelectorAll('img')).map(async (img) => {
                    try {
                        // Skip if already data url
                        if (img.src.startsWith('data:')) return;

                        const response = await fetch(img.src, { mode: 'cors' });
                        const blob = await response.blob();
                        const reader = new FileReader();
                        await new Promise((resolve) => {
                            reader.onloadend = () => {
                                img.src = reader.result as string;
                                resolve(null);
                            };
                            reader.readAsDataURL(blob);
                        });
                    } catch (err) {
                        console.warn('Failed to pre-load image:', img.src, err);
                        // If fail, leave as is and hope for the best
                    }
                });
                await Promise.all(imagePromises);

                dataUrl = await toPng(element, captureOptions);

                // Success! Break loop
                break;

            } catch (e: any) {
                retries--;
                console.warn(`[Capture] html-to-image failed for module ${i + 1}. Retries left: ${retries}`, e);

                if (retries === 0) {
                    // If all retries fail, check if we can fallback to a "simple" capture (no style injection?) 
                    // No, just throw for now as user wants exactness.
                    console.error(`[Capture] Final failure for module ${i + 1}`, e);
                    throw new Error(`이미지 변환 실패 (모듈 ${i + 1}): ${e.message || '네트워크/CORS 오류 가능성'}`);
                }

                // Wait 500ms before retry
                await new Promise(r => setTimeout(r, 500));
            }
        }

        // If we reach here, dataUrl must have been successfully assigned (or an error was thrown above)
        moduleImages.push({ dataUrl, height: element.offsetHeight });
        onProgress?.(i + 1, moduleElements.length);
    }

    const totalHeight = moduleImages.reduce((sum, img) => sum + img.height, 0);

    // If total height fits in one image, combine them.
    if (totalHeight <= MAX_IMAGE_HEIGHT) {
        const combined = await combineImages(moduleImages.map(m => m.dataUrl));
        return { images: [combined], needsZip: false, totalHeight };
    }

    // Otherwise, split them into chunks based on height
    const splitImages = await splitModuleImages(moduleImages, MAX_IMAGE_HEIGHT);
    return { images: splitImages, needsZip: true, totalHeight };
}

async function combineImages(dataUrls: string[]): Promise<string> {
    const images = await Promise.all(dataUrls.map(loadImage));
    const totalHeight = images.reduce((sum, img) => sum + img.height, 0);
    const maxWidth = Math.max(...images.map(img => img.width));

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d')!;

    let y = 0;
    for (const img of images) {
        ctx.drawImage(img, 0, y);
        y += img.height;
    }

    return canvas.toDataURL('image/png');
}

async function splitModuleImages(
    modules: { dataUrl: string; height: number }[],
    maxHeight: number
): Promise<string[]> {
    const results: string[] = [];
    let currentBatch: string[] = [];
    let currentHeight = 0;

    for (const module of modules) {
        // If adding this module exceeds max height, flush current batch
        if (currentHeight + module.height > maxHeight && currentBatch.length > 0) {
            results.push(await combineImages(currentBatch));
            currentBatch = [];
            currentHeight = 0;
        }
        currentBatch.push(module.dataUrl);
        currentHeight += module.height;
    }

    if (currentBatch.length > 0) {
        results.push(await combineImages(currentBatch));
    }

    return results;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // No crossOrigin needed for dataUrls
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Canvas image load failed'));
        img.src = dataUrl;
    });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
