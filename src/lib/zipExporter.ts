// ZIP Exporter using JSZip
// import JSZip from 'jszip';
import { downloadBlob } from './image-processing';

interface ExportImage {
    name: string;
    dataUrl: string;
}

// Convert data URL to blob
function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/*
// Export images as ZIP file
export async function exportAsZip(
    images: ExportImage[],
    zipName: string = '상세페이지'
): Promise<void> {
    const zip = new JSZip();

    // Add images to ZIP
    images.forEach((image, index) => {
        const fileName = image.name || `module_${String(index + 1).padStart(2, '0')}.png`;
        const blob = dataUrlToBlob(image.dataUrl);
        zip.file(fileName, blob);
    });

    // Generate ZIP and trigger download
    const content = await zip.generateAsync({ type: 'blob' });
    downloadBlob(content, `${zipName}.zip`);
}
*/

// Helper to capture module as image (uses html2canvas if available)
export async function captureElementAsImage(
    element: HTMLElement
): Promise<string | null> {
    try {
        // Dynamic import html2canvas to avoid SSR issues
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // High resolution
            useCORS: true,
            allowTaint: true,
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Failed to capture element:', error);
        return null;
    }
}

/*
// Export entire preview panel as ZIP
export async function exportPreviewAsZip(
    previewContainer: HTMLElement,
    productName: string = '상품',
    thumbnail?: string
): Promise<void> {
...
    // Export as ZIP
    await exportAsZip(images, `${productName}_상세페이지`);
}
*/
