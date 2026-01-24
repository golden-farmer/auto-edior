'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface AutoScaleOptions {
    minFontSize?: number;
    maxFontSize?: number;
    step?: number;
}

export function useAutoScaleText(options: AutoScaleOptions = {}) {
    const { minFontSize = 12, maxFontSize = 48, step = 2 } = options;
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState(maxFontSize);

    const calculateFontSize = useCallback(() => {
        if (!containerRef.current || !textRef.current) return;

        const container = containerRef.current;
        const text = textRef.current;
        const containerWidth = container.offsetWidth;

        let currentSize = maxFontSize;
        text.style.fontSize = `${currentSize}px`;

        while (text.scrollWidth > containerWidth && currentSize > minFontSize) {
            currentSize -= step;
            text.style.fontSize = `${currentSize}px`;
        }

        setFontSize(currentSize);
    }, [minFontSize, maxFontSize, step]);

    useEffect(() => {
        calculateFontSize();
        window.addEventListener('resize', calculateFontSize);
        return () => window.removeEventListener('resize', calculateFontSize);
    }, [calculateFontSize]);

    return { containerRef, textRef, fontSize, recalculate: calculateFontSize };
}

// Utility function for inline auto-scaling
export function calculateAutoFontSize(
    text: string,
    containerWidth: number,
    options: AutoScaleOptions = {}
): number {
    const { minFontSize = 12, maxFontSize = 48 } = options;

    // Simple estimation: ~0.6 characters per pixel at base size
    const charWidth = 0.6;
    const estimatedWidth = text.length * maxFontSize * charWidth;

    if (estimatedWidth <= containerWidth) {
        return maxFontSize;
    }

    const ratio = containerWidth / estimatedWidth;
    const calculatedSize = Math.floor(maxFontSize * ratio);

    return Math.max(minFontSize, Math.min(maxFontSize, calculatedSize));
}
