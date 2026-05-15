import { v4 as uuidv4 } from 'uuid';
import { TextLayerNode, StickerLayerNode, OverlayNode } from '@/types';

export function extractDOMToKonvaNodes(container: HTMLElement): OverlayNode[] {
    const containerRect = container.getBoundingClientRect();
    const nodes: OverlayNode[] = [];

    // Find all element nodes (omitted 3rd arg for browser compatibility)
    const walk = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
    let node: Element | null = walk.nextNode() as Element;

    while (node) {
        // Skip hidden elements, or the preview-canvas itself
        const style = window.getComputedStyle(node);
        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0' ||
            node.classList.contains('preview-overlay-canvas') ||
            node.closest('.preview-overlay-canvas')
        ) {
            node = walk.nextNode() as Element;
            continue;
        }

        // Image extraction
        if (node.tagName.toLowerCase() === 'img') {
            const img = node as HTMLImageElement;
            const rect = img.getBoundingClientRect();
            // Make sure the image is actually visible and has size
            if (rect.width > 5 && rect.height > 5) {
                node.classList.add('is-extracted-image');
                nodes.push({
                    id: uuidv4(),
                    type: 'image',
                    url: img.src,
                    x: rect.left - containerRect.left,
                    y: rect.top - containerRect.top + container.scrollTop,
                    width: rect.width,
                    height: rect.height,
                    rotation: 0
                } as StickerLayerNode);
            }
        } 
        // SVG Icon extraction (treat as images or just skip? We'll skip for now to avoid CORS/b64 issues with inline SVGs, or we can handle them if needed. Usually text/images are enough).
        // Text extraction
        else {
            let hasDirectText = false;
            let combinedText = '';
            for (const child of Array.from(node.childNodes)) {
                if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
                    hasDirectText = true;
                    // replace multiple whitespaces with single space
                    combinedText += child.textContent.replace(/\s+/g, ' ');
                }
            }

            if (hasDirectText && combinedText.trim()) {
                const rect = node.getBoundingClientRect();
                
                if (rect.width > 0 && rect.height > 0) {
                    node.classList.add('is-extracted-text');
                    const fontSize = parseFloat(style.fontSize) || 16;
                    // Konva text rendering might be slightly different than DOM.
                    // We'll extract computed font styles.
                    let fontFamily = style.fontFamily || 'sans-serif';
                    // strip quotes from font family
                    fontFamily = fontFamily.replace(/['"]/g, '').split(',')[0];

                    const color = style.color || '#000000';

                    nodes.push({
                        id: uuidv4(),
                        type: 'text',
                        text: combinedText.trim(),
                        x: rect.left - containerRect.left,
                        y: rect.top - containerRect.top + container.scrollTop,
                        fontSize: fontSize,
                        fill: color,
                        fontFamily: fontFamily,
                        rotation: 0
                    } as TextLayerNode);
                }
            }
        }
        node = walk.nextNode() as Element;
    }

    return nodes;
}
