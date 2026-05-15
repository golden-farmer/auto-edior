'use client';

import React from 'react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Baseline,
    Palette,
    RotateCcw,
    Type,
    WholeWord,
} from 'lucide-react';
import { useBuilderStore } from '@/store/useBuilderStore';

const WEIGHT_OPTIONS = [
    { label: '얇게', value: 300 },
    { label: '보통', value: 400 },
    { label: '굵게', value: 700 },
] as const;

const ALIGN_OPTIONS = [
    { label: '좌', value: 'left', icon: AlignLeft },
    { label: '중앙', value: 'center', icon: AlignCenter },
    { label: '우', value: 'right', icon: AlignRight },
] as const;

function useCurrentTextStyleValues() {
    const selectedTextTarget = useBuilderStore((state) => state.selectedTextTarget);

    return {
        selectedTextTarget,
        currentColor: selectedTextTarget?.style.color ?? selectedTextTarget?.resolvedColor ?? '#111827',
        currentFontSize: selectedTextTarget?.style.fontSize ?? selectedTextTarget?.resolvedFontSize ?? 16,
        currentFontWeight: selectedTextTarget?.style.fontWeight ?? selectedTextTarget?.resolvedFontWeight ?? 700,
        currentTextAlign: selectedTextTarget?.style.textAlign ?? selectedTextTarget?.resolvedTextAlign ?? 'left',
        currentLetterSpacing: selectedTextTarget?.style.letterSpacing ?? selectedTextTarget?.resolvedLetterSpacing ?? 0,
        currentLineHeight: selectedTextTarget?.style.lineHeight ?? selectedTextTarget?.resolvedLineHeight ?? 1.4,
    };
}

export function TextStyleControls({ compact = false }: { compact?: boolean }) {
    const updateSelectedTextStyle = useBuilderStore((state) => state.updateSelectedTextStyle);
    const {
        currentColor,
        currentFontSize,
        currentFontWeight,
        currentTextAlign,
        currentLetterSpacing,
        currentLineHeight,
    } = useCurrentTextStyleValues();

    const labelClassName = compact
        ? 'flex items-center gap-2 text-xs font-semibold text-gray-700'
        : 'flex items-center gap-2 text-sm font-medium text-gray-700';
    const inputClassName = compact
        ? 'w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-500'
        : 'w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500';
    const codeClassName = compact
        ? 'rounded-md bg-slate-100 px-2 py-1 text-[11px] text-gray-600'
        : 'rounded-md bg-slate-100 px-2 py-1 text-xs text-gray-600';
    const resetButtonClassName = compact
        ? 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50'
        : 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50';

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <div className={labelClassName}>
                    <Palette size={16} />
                    <span>색상</span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => updateSelectedTextStyle({ color: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded border border-gray-300 bg-transparent"
                    />
                    <code className={codeClassName}>{currentColor.toUpperCase()}</code>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <div className={labelClassName}>
                    <Type size={16} />
                    <span>크기</span>
                </div>
                <div className="space-y-2">
                    <input
                        type="range"
                        min={10}
                        max={96}
                        step={1}
                        value={currentFontSize}
                        onChange={(e) => updateSelectedTextStyle({ fontSize: Number(e.target.value) })}
                        className="w-full accent-blue-500"
                    />
                    <div className="flex items-center justify-between gap-3">
                        <input
                            type="number"
                            min={10}
                            max={96}
                            step={1}
                            value={currentFontSize}
                            onChange={(e) => updateSelectedTextStyle({ fontSize: Number(e.target.value) })}
                            className={inputClassName}
                        />
                        <span className="text-xs font-medium text-gray-500">px</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                <div className={`${labelClassName} pt-2`}>
                    <WholeWord size={16} />
                    <span>굵기</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {WEIGHT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateSelectedTextStyle({ fontWeight: option.value })}
                            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${currentFontWeight === option.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                <div className={`${labelClassName} pt-2`}>
                    <AlignLeft size={16} />
                    <span>정렬</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {ALIGN_OPTIONS.map((option) => {
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateSelectedTextStyle({ textAlign: option.value })}
                                className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${currentTextAlign === option.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon size={14} />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <div className={labelClassName}>
                    <Type size={16} />
                    <span>자간</span>
                </div>
                <div className="space-y-2">
                    <input
                        type="range"
                        min={-4}
                        max={20}
                        step={0.5}
                        value={currentLetterSpacing}
                        onChange={(e) => updateSelectedTextStyle({ letterSpacing: Number(e.target.value) })}
                        className="w-full accent-blue-500"
                    />
                    <div className="flex items-center justify-between gap-3">
                        <input
                            type="number"
                            min={-4}
                            max={20}
                            step={0.5}
                            value={currentLetterSpacing}
                            onChange={(e) => updateSelectedTextStyle({ letterSpacing: Number(e.target.value) })}
                            className={inputClassName}
                        />
                        <span className="text-xs font-medium text-gray-500">px</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <div className={labelClassName}>
                    <Baseline size={16} />
                    <span>줄간격</span>
                </div>
                <div className="space-y-2">
                    <input
                        type="range"
                        min={0.8}
                        max={2.5}
                        step={0.05}
                        value={currentLineHeight}
                        onChange={(e) => updateSelectedTextStyle({ lineHeight: Number(e.target.value) })}
                        className="w-full accent-blue-500"
                    />
                    <div className="flex items-center justify-between gap-3">
                        <input
                            type="number"
                            min={0.8}
                            max={2.5}
                            step={0.05}
                            value={currentLineHeight}
                            onChange={(e) => updateSelectedTextStyle({ lineHeight: Number(e.target.value) })}
                            className={inputClassName}
                        />
                        <span className="text-xs font-medium text-gray-500">x</span>
                    </div>
                </div>
            </div>

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
                className={resetButtonClassName}
            >
                <RotateCcw size={15} />
                개별 스타일 초기화
            </button>
        </div>
    );
}

export function useSelectedTextStyleInfo() {
    return useCurrentTextStyleValues();
}
