'use client';

import React, { useState, useCallback } from 'react';
import { MaskRegion } from '@/types';

interface MaskPropertyPanelProps {
    mask: MaskRegion;
    onChange: (updated: MaskRegion) => void;
    onDelete?: () => void;
    canDelete: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('');
}

export function MaskPropertyPanel({ mask, onChange, onDelete, canDelete }: MaskPropertyPanelProps) {
    const [rgbInput, setRgbInput] = useState(hexToRgb(mask.color));

    const update = useCallback((partial: Partial<MaskRegion>) => {
        onChange({ ...mask, ...partial });
    }, [mask, onChange]);

    const handleColorPickerChange = (hex: string) => {
        setRgbInput(hexToRgb(hex));
        update({ color: hex });
    };

    const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
        const num = Math.min(255, Math.max(0, parseInt(value) || 0));
        const newRgb = { ...rgbInput, [channel]: num };
        setRgbInput(newRgb);
        update({ color: rgbToHex(newRgb.r, newRgb.g, newRgb.b) });
    };

    // Sync rgbInput if mask.color changes externally
    React.useEffect(() => {
        setRgbInput(hexToRgb(mask.color));
    }, [mask.color]);

    const jsonPreview = JSON.stringify({
        id: mask.id,
        name: mask.name,
        maskType: mask.maskType,
        ...(mask.productIndex !== undefined ? { productIndex: mask.productIndex } : {}),
        color: mask.color,
        opacity: mask.opacity,
        pixelCount: mask.pixelCount,
        avgColor: mask.avgColor,
        label: mask.label,
        visible: mask.visible,
    }, null, 2);

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: mask.color }}
                    />
                    <span className="text-sm font-semibold text-gray-900">
                        {mask.maskType === 'background' ? '🌄 배경 마스크' : `📦 ${mask.name}`}
                    </span>
                </div>
                {canDelete && onDelete && (
                    <button
                        onClick={onDelete}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                    >
                        삭제
                    </button>
                )}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
                {/* Name */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">이름 (name)</label>
                    <input
                        type="text"
                        value={mask.name}
                        onChange={e => update({ name: e.target.value })}
                        className="w-full bg-white border text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Label */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">레이블 (label)</label>
                    <input
                        type="text"
                        value={mask.label}
                        onChange={e => update({ label: e.target.value })}
                        className="w-full bg-white border text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Color */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">오버레이 색상 (color)</label>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="color"
                            value={mask.color}
                            onChange={e => handleColorPickerChange(e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs text-gray-500 font-mono">{mask.color.toUpperCase()}</span>
                    </div>
                    {/* RGB numeric inputs */}
                    <div className="grid grid-cols-3 gap-2">
                        {(['r', 'g', 'b'] as const).map(ch => (
                            <div key={ch}>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold">{ch}</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={rgbInput[ch]}
                                    onChange={e => handleRgbChange(ch, e.target.value)}
                                    className="w-full bg-white border text-gray-700 border border-gray-300 rounded px-2 py-1.5 text-gray-900 text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Opacity */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">
                        불투명도 (opacity) — {Math.round(mask.opacity * 100)}%
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={mask.opacity}
                        onChange={e => update({ opacity: parseFloat(e.target.value) })}
                        className="w-full accent-blue-500"
                    />
                </div>

                {/* Visible */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id={`visible-${mask.id}`}
                        checked={mask.visible}
                        onChange={e => update({ visible: e.target.checked })}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                    <label htmlFor={`visible-${mask.id}`} className="text-sm text-gray-700 cursor-pointer">
                        오버레이 표시 (visible)
                    </label>
                </div>

                {/* Stats (read-only) */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="bg-white rounded-lg px-3 py-2">
                        <span className="block text-[10px] text-gray-600 mb-0.5">픽셀 수</span>
                        {mask.pixelCount.toLocaleString()}
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2">
                        <span className="block text-[10px] text-gray-600 mb-0.5">평균 색상</span>
                        rgb({mask.avgColor.r}, {mask.avgColor.g}, {mask.avgColor.b})
                    </div>
                </div>

                {/* JSON Preview */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">JSON 미리보기</label>
                    <textarea
                        readOnly
                        value={jsonPreview}
                        rows={10}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg px-3 py-2 text-blue-400 text-xs font-mono resize-none focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
