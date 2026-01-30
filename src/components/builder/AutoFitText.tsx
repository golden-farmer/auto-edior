'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AutoFitTextProps {
    children: React.ReactNode;
    minFontSize?: number;
    maxFontSize?: number;
    className?: string;
    onOverflow?: (isOverflowing: boolean) => void;
}

export function AutoFitText({
    children,
    minFontSize = 12,
    maxFontSize = 100,
    className = '',
    onOverflow
}: AutoFitTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState(maxFontSize);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const checkAndFit = useCallback(() => {
        if (!containerRef.current || !textRef.current) return;

        const container = containerRef.current;
        const text = textRef.current;

        // Reset to max size first
        let currentSize = maxFontSize;
        text.style.fontSize = `${currentSize}px`;

        // Binary search for optimal font size
        let low = minFontSize;
        let high = maxFontSize;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            text.style.fontSize = `${mid}px`;

            const isOverflow = text.scrollWidth > container.clientWidth ||
                text.scrollHeight > container.clientHeight;

            if (isOverflow) {
                high = mid - 1;
            } else {
                low = mid + 1;
                currentSize = mid;
            }
        }

        text.style.fontSize = `${currentSize}px`;
        setFontSize(currentSize);

        // Check if still overflowing at min size
        const stillOverflowing = currentSize <= minFontSize &&
            (text.scrollWidth > container.clientWidth || text.scrollHeight > container.clientHeight);

        setIsOverflowing(stillOverflowing);
        onOverflow?.(stillOverflowing);
    }, [minFontSize, maxFontSize, onOverflow]);

    useEffect(() => {
        checkAndFit();

        // Re-fit on resize
        const resizeObserver = new ResizeObserver(() => {
            checkAndFit();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [checkAndFit, children]);

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden ${className}`}
            style={{ position: 'relative' }}
        >
            <span
                ref={textRef}
                style={{
                    fontSize: `${fontSize}px`,
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    textOverflow: isOverflowing ? 'ellipsis' : 'clip',
                    overflow: 'hidden',
                    maxWidth: '100%'
                }}
            >
                {children}
            </span>
        </div>
    );
}

// Simple inline text overflow warning component
export function TextOverflowWarning({ show }: { show: boolean }) {
    if (!show) return null;

    return (
        <p className="text-xs text-red-500 mt-1 animate-pulse">
            ⚠️ 내용이 너무 깁니다. 줄여주세요!
        </p>
    );
}
