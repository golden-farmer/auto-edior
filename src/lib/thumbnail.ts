// Canvas-based Thumbnail Generator (1000x1000px)

export async function generateThumbnail(
    imageUrl: string,
    productName: string = '',
    size: number = 1000
): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }

        canvas.width = size;
        canvas.height = size;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Calculate crop dimensions for center-crop
            const srcSize = Math.min(img.width, img.height);
            const srcX = (img.width - srcSize) / 2;
            const srcY = (img.height - srcSize) / 2;

            // Draw cropped and resized image
            ctx.drawImage(
                img,
                srcX, srcY, srcSize, srcSize, // Source crop
                0, 0, size, size // Destination
            );

            // Optional: Add product name overlay
            if (productName) {
                // Semi-transparent gradient overlay at bottom
                const gradient = ctx.createLinearGradient(0, size * 0.7, 0, size);
                gradient.addColorStop(0, 'rgba(0,0,0,0)');
                gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, size * 0.7, size, size * 0.3);

                // Product name text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 48px Pretendard, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(productName, size / 2, size - 40, size - 80);
            }

            // Export as base64
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = imageUrl;
    });
}

// Batch generate thumbnails for multiple images
export async function generateThumbnails(
    imageUrls: string[],
    productName: string = '',
    size: number = 1000
): Promise<string[]> {
    const results: string[] = [];

    for (const url of imageUrls) {
        try {
            const thumbnail = await generateThumbnail(url, productName, size);
            results.push(thumbnail);
        } catch (error) {
            console.error('Failed to generate thumbnail:', error);
        }
    }

    return results;
}
