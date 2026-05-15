'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Baseline,
    GripHorizontal,
    Palette,
    RotateCcw,
    Type,
    WholeWord,
    X,
} from 'lucide-react';
import { useBuilderStore } from '@/store/useBuilderStore';
import { useSelectedTextStyleInfo } from './TextStyleControls';

type FloatingPosition = {
    top: number;
    left: number;
};

type DragState = {
    pointerId: number;
    startX: number;
    startY: number;
    initialTop: number;
    initialLeft: number;
};

const WEIGHT_OPTIONS = [
    { label: '얇게', value: 300 },
    { label: '보통', value: 400 },
    { label: '굵게', value: 700 },
] as const;

const ALIGN_OPTIONS = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
] as const;

function getRelativeOffset(element: HTMLElement, ancestor: HTMLElement) {
    let top = 0;
    let left = 0;
    let current: HTMLElement | null = element;

    while (current && current !== ancestor) {
        top += current.offsetTop;
        left += current.offsetLeft;
        current = current.offsetParent as HTMLElement | null;
    }

    return { top, left };
}

function clampPosition(position: FloatingPosition, stage: HTMLElement, toolbar: HTMLElement): FloatingPosition {
    return {
        top: Math.max(12, Math.min(position.top, stage.clientHeight - toolbar.offsetHeight - 12)),
        left: Math.max(12, Math.min(position.left, stage.clientWidth - toolbar.offsetWidth - 12)),
    };
}

export function TextStyleFloatingToolbar() {
    const {
        selectedTextTarget,
        currentColor,
        currentFontSize,
        currentFontWeight,
        currentTextAlign,
        currentLetterSpacing,
        currentLineHeight,
    } = useSelectedTextStyleInfo();
    const updateSelectedTextStyle = useBuilderStore((state) => state.updateSelectedTextStyle);
    const setSelectedTextTarget = useBuilderStore((state) => state.setSelectedTextTarget);

    const toolbarRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const manualPositionRef = useRef<FloatingPosition | null>(null);
    const dragFrameRef = useRef<number | null>(null);

    const [autoPosition, setAutoPosition] = useState<FloatingPosition | null>(null);
    const [manualPosition, setManualPosition] = useState<FloatingPosition | null>(null);

    const selector = useMemo(() => {
        if (!selectedTextTarget) return null;
        return `[data-editable-text="true"][data-module-id="${selectedTextTarget.moduleId}"][data-text-key="${selectedTextTarget.textKey}"]`;
    }, [selectedTextTarget]);

    useEffect(() => {
        manualPositionRef.current = manualPosition;
    }, [manualPosition]);

    useEffect(() => {
        if (!selector) {
            setAutoPosition(null);
            return;
        }

        const previewContainer = document.getElementById('preview-container');
        const previewStage = document.getElementById('preview-stage');
        if (!previewContainer || !previewStage) return;

        const updatePosition = () => {
            const selectedElement = previewContainer.querySelector(selector) as HTMLElement | null;
            const toolbarElement = toolbarRef.current;

            if (!selectedElement || !toolbarElement) {
                setAutoPosition(null);
                return;
            }

            const previewOffset = getRelativeOffset(previewContainer, previewStage);
            const { top } = getRelativeOffset(selectedElement, previewContainer);
            const targetHeight = selectedElement.offsetHeight;
            const gap = 14;

            const nextAutoPosition = clampPosition(
                {
                    top: previewOffset.top + top + targetHeight / 2 - toolbarElement.offsetHeight / 2,
                    left: previewOffset.left + previewContainer.offsetWidth + gap,
                },
                previewStage,
                toolbarElement
            );

            setAutoPosition(nextAutoPosition);
        };

        updatePosition();

        const selectedElement = previewContainer.querySelector(selector) as HTMLElement | null;
        const previewScrollParent = previewStage;
        const resizeObserver = new ResizeObserver(() => updatePosition());

        resizeObserver.observe(previewContainer);
        resizeObserver.observe(previewStage);
        if (selectedElement) {
            resizeObserver.observe(selectedElement);
        }

        window.addEventListener('resize', updatePosition);
        previewScrollParent?.addEventListener('scroll', updatePosition, { passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updatePosition);
            previewScrollParent?.removeEventListener('scroll', updatePosition);
        };
    }, [selector]);

    useEffect(() => {
        const applyManualPosition = (nextPosition: FloatingPosition) => {
            const previewStage = document.getElementById('preview-stage');
            const toolbarElement = toolbarRef.current;
            if (!previewStage || !toolbarElement) return;

            const clamped = clampPosition(nextPosition, previewStage, toolbarElement);
            manualPositionRef.current = clamped;

            if (dragFrameRef.current !== null) {
                cancelAnimationFrame(dragFrameRef.current);
            }

            dragFrameRef.current = requestAnimationFrame(() => {
                if (!toolbarRef.current) return;
                toolbarRef.current.style.top = `${clamped.top}px`;
                toolbarRef.current.style.left = `${clamped.left}px`;
            });
        };

        const handlePointerMove = (event: PointerEvent) => {
            const dragState = dragStateRef.current;
            if (!dragState) return;

            applyManualPosition({
                top: dragState.initialTop + (event.clientY - dragState.startY),
                left: dragState.initialLeft + (event.clientX - dragState.startX),
            });
        };

        const finishDrag = (pointerId: number) => {
            if (!dragStateRef.current || dragStateRef.current.pointerId !== pointerId) return;
            dragStateRef.current = null;
            setManualPosition(manualPositionRef.current);
        };

        const handlePointerUp = (event: PointerEvent) => finishDrag(event.pointerId);
        const handlePointerCancel = (event: PointerEvent) => finishDrag(event.pointerId);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);

        return () => {
            if (dragFrameRef.current !== null) {
                cancelAnimationFrame(dragFrameRef.current);
            }
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
        };
    }, []);

    if (!selectedTextTarget) {
        return null;
    }

    const position = manualPosition ?? autoPosition;

    return (
        <div
            ref={toolbarRef}
            className={`no-capture absolute z-[70] w-[300px] rounded-2xl border border-gray-200 bg-white/96 p-2 shadow-sm backdrop-blur-md transition-opacity ${position ? 'opacity-100' : 'opacity-0'
                }`}
            style={{
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onPointerDown={(e) => {
                        if (!position) return;
                        dragStateRef.current = {
                            pointerId: e.pointerId,
                            startX: e.clientX,
                            startY: e.clientY,
                            initialTop: position.top,
                            initialLeft: position.left,
                        };
                        e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 cursor-grab active:cursor-grabbing"
                    title="툴바 이동"
                    aria-label="툴바 이동"
                >
                    <GripHorizontal size={14} />
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedTextTarget(undefined)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    aria-label="텍스트 선택 해제"
                    title="닫기"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2">
                <label className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5" title="색상">
                    <Palette size={14} className="shrink-0 text-gray-500" />
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => updateSelectedTextStyle({ color: e.target.value })}
                        className="h-5 w-5 cursor-pointer rounded border border-gray-200 bg-transparent"
                    />
                </label>

                <label className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5" title="크기">
                    <Type size={14} className="shrink-0 text-gray-500" />
                    <input
                        type="number"
                        min={10}
                        max={96}
                        step={1}
                        value={currentFontSize}
                        onChange={(e) => updateSelectedTextStyle({ fontSize: Number(e.target.value) })}
                        className="w-8 border-0 bg-transparent p-0 text-xs font-semibold text-gray-900 outline-none"
                    />
                </label>

                <label className="flex min-w-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5" title="굵기">
                    <WholeWord size={14} className="shrink-0 text-gray-500" />
                    <select
                        value={currentFontWeight}
                        onChange={(e) => updateSelectedTextStyle({ fontWeight: Number(e.target.value) })}
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[11px] font-semibold text-gray-900 outline-none"
                    >
                        {WEIGHT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="button"
                    onClick={() =>
                        updateSelectedTextStyle({
                            color: undefined,
                            fontSize: undefined,
                            fontWeight: undefined,
                            textAlign: undefined,
                            letterSpacing: undefined,
                            lineHeight: undefined,
                        })
                    }
                    className="inline-flex h-[34px] items-center justify-center rounded-xl border border-gray-200 px-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    title="개별 스타일 초기화"
                >
                    <RotateCcw size={14} />
                </button>
            </div>

            <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white" title="정렬">
                    {ALIGN_OPTIONS.map((option) => {
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateSelectedTextStyle({ textAlign: option.value })}
                                className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${currentTextAlign === option.value
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                title={`정렬 ${option.value}`}
                            >
                                <Icon size={14} />
                            </button>
                        );
                    })}
                </div>

                <label className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5" title="자간">
                    <Type size={14} className="shrink-0 text-gray-500" />
                    <input
                        type="number"
                        min={-4}
                        max={20}
                        step={0.5}
                        value={currentLetterSpacing}
                        onChange={(e) => updateSelectedTextStyle({ letterSpacing: Number(e.target.value) })}
                        className="w-12 border-0 bg-transparent p-0 text-xs font-semibold text-gray-900 outline-none"
                    />
                </label>

                <label className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5" title="줄간격">
                    <Baseline size={14} className="shrink-0 text-gray-500" />
                    <input
                        type="number"
                        min={0.8}
                        max={2.5}
                        step={0.05}
                        value={currentLineHeight}
                        onChange={(e) => updateSelectedTextStyle({ lineHeight: Number(e.target.value) })}
                        className="w-8 border-0 bg-transparent p-0 text-xs font-semibold text-gray-900 outline-none"
                    />
                </label>
            </div>
        </div>
    );
}
