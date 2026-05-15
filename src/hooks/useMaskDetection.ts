import { MaskRegion } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Preset overlay colors for product masks
const PRODUCT_COLORS = [
    '#E67E22', '#9B59B6', '#27AE60', '#E74C3C',
    '#F39C12', '#1ABC9C', '#3498DB', '#E91E63',
    '#FF5722', '#8BC34A',
];
const BG_COLOR = '#4A90D9';

interface MaskDetectionOptions {
    threshold?: number;       // color distance threshold (default 80)
    minBlobRatio?: number;    // minimum blob size ratio (default 0.005 = 0.5%)
    sampleSize?: number;      // canvas downscale size for analysis (default 200)
}

/**
 * Analyzes an image URL and returns auto-detected mask regions.
 * Algorithm:
 * 1. Sample corner pixels → compute background reference color
 * 2. Each pixel: if color distance < threshold → background, else → product candidate
 * 3. Connected-Component Labeling (8-directional BFS) on product candidates
 * 4. Filter out tiny blobs (noise)
 * 5. Return one background MaskRegion + one MaskRegion per blob
 */
export async function detectMasks(
    imageUrl: string,
    options: MaskDetectionOptions = {}
): Promise<MaskRegion[]> {
    const { threshold = 80, minBlobRatio = 0.005, sampleSize = 200 } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const scale = Math.min(sampleSize / img.width, sampleSize / img.height);
                const W = Math.round(img.width * scale);
                const H = Math.round(img.height * scale);
                canvas.width = W;
                canvas.height = H;

                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, W, H);
                const { data } = ctx.getImageData(0, 0, W, H);

                // 1. Sample corners (5x5 patch each) to get background color
                const bgSamples: number[][] = [];
                const patchSize = 5;
                for (let py = 0; py < patchSize; py++) {
                    for (let px = 0; px < patchSize; px++) {
                        // top-left
                        const tl = (py * W + px) * 4;
                        bgSamples.push([data[tl], data[tl + 1], data[tl + 2]]);
                        // top-right
                        const tr = (py * W + (W - 1 - px)) * 4;
                        bgSamples.push([data[tr], data[tr + 1], data[tr + 2]]);
                        // bottom-left
                        const bl = ((H - 1 - py) * W + px) * 4;
                        bgSamples.push([data[bl], data[bl + 1], data[bl + 2]]);
                        // bottom-right
                        const br = ((H - 1 - py) * W + (W - 1 - px)) * 4;
                        bgSamples.push([data[br], data[br + 1], data[br + 2]]);
                    }
                }
                const bgR = bgSamples.reduce((s, c) => s + c[0], 0) / bgSamples.length;
                const bgG = bgSamples.reduce((s, c) => s + c[1], 0) / bgSamples.length;
                const bgB = bgSamples.reduce((s, c) => s + c[2], 0) / bgSamples.length;

                // 2. Classify pixels: 0 = background, -1 = product candidate (unlabeled)
                const totalPixels = W * H;
                const labels = new Int32Array(totalPixels).fill(0); // 0 = bg
                let bgTotalR = 0, bgTotalG = 0, bgTotalB = 0, bgCount = 0;

                for (let i = 0; i < totalPixels; i++) {
                    const r = data[i * 4];
                    const g = data[i * 4 + 1];
                    const b = data[i * 4 + 2];
                    const dist = Math.sqrt(
                        (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
                    );
                    if (dist < threshold) {
                        labels[i] = 0; // background
                        bgTotalR += r; bgTotalG += g; bgTotalB += b; bgCount++;
                    } else {
                        labels[i] = -1; // product candidate
                    }
                }

                // 3. Connected-Component Labeling (BFS, 8-directional)
                let nextLabel = 1;
                const blobPixels: Map<number, number[]> = new Map();

                for (let i = 0; i < totalPixels; i++) {
                    if (labels[i] !== -1) continue; // already labeled or bg

                    // BFS
                    const queue: number[] = [i];
                    labels[i] = nextLabel;
                    const blob: number[] = [];

                    while (queue.length > 0) {
                        const cur = queue.shift()!;
                        blob.push(cur);
                        const x = cur % W;
                        const y = Math.floor(cur / W);

                        // 8-neighbors
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
                                const ni = ny * W + nx;
                                if (labels[ni] === -1) {
                                    labels[ni] = nextLabel;
                                    queue.push(ni);
                                }
                            }
                        }
                    }

                    blobPixels.set(nextLabel, blob);
                    nextLabel++;
                }

                // 4. Filter tiny blobs
                const minPixels = Math.floor(totalPixels * minBlobRatio);
                const validBlobs: number[][] = [];
                blobPixels.forEach((pixels) => {
                    if (pixels.length >= minPixels) {
                        validBlobs.push(pixels);
                    }
                });

                // Sort by size descending
                validBlobs.sort((a, b) => b.length - a.length);

                // 5. Build MaskRegion list
                const masks: MaskRegion[] = [];

                // Background mask
                const bgAvgR = bgCount > 0 ? Math.round(bgTotalR / bgCount) : Math.round(bgR);
                const bgAvgG = bgCount > 0 ? Math.round(bgTotalG / bgCount) : Math.round(bgG);
                const bgAvgB = bgCount > 0 ? Math.round(bgTotalB / bgCount) : Math.round(bgB);

                masks.push({
                    id: uuidv4(),
                    name: '배경',
                    maskType: 'background',
                    color: BG_COLOR,
                    opacity: 0.4,
                    pixelCount: bgCount,
                    avgColor: { r: bgAvgR, g: bgAvgG, b: bgAvgB },
                    label: '배경 영역',
                    visible: true,
                });

                // Product masks (one per valid blob)
                validBlobs.forEach((pixelList, idx) => {
                    let sumR = 0, sumG = 0, sumB = 0;
                    pixelList.forEach(pi => {
                        sumR += data[pi * 4];
                        sumG += data[pi * 4 + 1];
                        sumB += data[pi * 4 + 2];
                    });
                    const count = pixelList.length;

                    masks.push({
                        id: uuidv4(),
                        name: `물건 ${idx + 1}`,
                        maskType: 'product',
                        productIndex: idx,
                        color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length],
                        opacity: 0.4,
                        pixelCount: count,
                        avgColor: {
                            r: Math.round(sumR / count),
                            g: Math.round(sumG / count),
                            b: Math.round(sumB / count),
                        },
                        label: `제품 ${idx + 1}`,
                        visible: true,
                        // Scale pixel indices back to original image coordinates
                        pixelIndices: new Uint32Array(pixelList),
                    });
                });

                resolve(masks);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}

/** Creates a new empty product mask */
export function createEmptyProductMask(productIndex: number): MaskRegion {
    return {
        id: uuidv4(),
        name: `물건 ${productIndex + 1}`,
        maskType: 'product',
        productIndex,
        color: PRODUCT_COLORS[productIndex % PRODUCT_COLORS.length],
        opacity: 0.4,
        pixelCount: 0,
        avgColor: { r: 128, g: 128, b: 128 },
        label: `제품 ${productIndex + 1}`,
        visible: true,
    };
}
