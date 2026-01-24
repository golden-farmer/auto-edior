// Image stitching and ZIP generation utilities

import JSZip from 'jszip';

const MAX_IMAGE_HEIGHT = 15000;
const IMAGE_WIDTH = 860; // Standard detail page width

export interface StitchResult {
    images: string[]; // Base64 images
    needsZip: boolean;
    totalHeight: number;
}

export async function stitchModuleImages(
    moduleElements: HTMLElement[],
    onProgress?: (current: number, total: number) => void
): Promise<StitchResult> {
    const { toPng } = await import('html-to-image');

    // Capture each module as image
    const moduleImages: { dataUrl: string; height: number }[] = [];

    for (let i = 0; i < moduleElements.length; i++) {
        const element = moduleElements[i];
        const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 2 });
        moduleImages.push({ dataUrl, height: element.offsetHeight });
        onProgress?.(i + 1, moduleElements.length);
    }

    const totalHeight = moduleImages.reduce((sum, img) => sum + img.height, 0);

    if (totalHeight <= MAX_IMAGE_HEIGHT) {
        // Single image - combine all modules
        const combined = await combineImages(moduleImages.map(m => m.dataUrl));
        return { images: [combined], needsZip: false, totalHeight };
    }

    // Split into multiple images
    const splitImages = await splitModuleImages(moduleImages, MAX_IMAGE_HEIGHT);
    return { images: splitImages, needsZip: true, totalHeight };
}

async function combineImages(dataUrls: string[]): Promise<string> {
    // Create canvas and combine images vertically
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
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}

export async function createZip(images: string[], productName: string): Promise<Blob> {
    const zip = new JSZip();
    const folder = zip.folder(productName);

    for (let i = 0; i < images.length; i++) {
        const base64 = images[i].replace(/^data:image\/\w+;base64,/, '');
        folder?.file(`detail-${i + 1}.png`, base64, { base64: true });
    }

    return await zip.generateAsync({ type: 'blob' });
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

export function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
