'use client';

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

// 6가지 컬러 팔레트
export const COLOR_PALETTES = [
    { value: 'apple', label: '🍎 사과', primary: '#D32F2F', secondary: '#FFEBEE', text: '#B71C1C' },
    { value: 'strawberry', label: '🍓 딸기', primary: '#EC407A', secondary: '#FCE4EC', text: '#C2185B' },
    { value: 'tangerine', label: '🍊 귤', primary: '#FB8C00', secondary: '#FFF3E0', text: '#EF6C00' },
    { value: 'peach', label: '🍑 복숭아', primary: '#FF7043', secondary: '#FBE9E7', text: '#D84315' },
    { value: 'sweetpotato', label: '🍠 고구마', primary: '#7B1FA2', secondary: '#F3E5F5', text: '#4A148C' },
    { value: 'green', label: '🥬 초록', primary: '#2E7D32', secondary: '#E8F5E9', text: '#1B5E20' },
];

export type ColorPalette = typeof COLOR_PALETTES[number]['value'];

export function ColorSelector() {
    const { state, dispatch } = useBuilder();
    const currentPalette = (state as any).colorPalette || 'apple';

    const handleChange = (palette: string) => {
        dispatch({ type: 'SET_COLOR_PALETTE', payload: palette });

        // Apply CSS variables to :root
        const selected = COLOR_PALETTES.find(p => p.value === palette);
        if (selected) {
            document.documentElement.style.setProperty('--color-primary', selected.primary);
            document.documentElement.style.setProperty('--color-secondary', selected.secondary);
            document.documentElement.style.setProperty('--color-text', selected.text);
        }
    };

    return (
        <div className="space-y-2 p-4 bg-gray-800/60 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300">🎨 컬러 팔레트</h4>
            <div className="grid grid-cols-3 gap-2">
                {COLOR_PALETTES.map((palette) => (
                    <button
                        key={palette.value}
                        onClick={() => handleChange(palette.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${currentPalette === palette.value
                                ? 'border-emerald-500 bg-emerald-500/20'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                    >
                        <div
                            className="w-6 h-6 rounded-full shadow-sm"
                            style={{ backgroundColor: palette.primary }}
                        />
                        <span className="text-[10px] text-gray-300">{palette.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
