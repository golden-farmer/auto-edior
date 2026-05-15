'use client';

import React from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';

export const COLOR_PALETTES = [
    { value: 'apple', label: '🪄 꿀사과', primary: '#FF3B30', secondary: '#FFF0F0', text: '#8A0804' },
    { value: 'strawberry', label: '🍓 설향딸기', primary: '#FF2D55', secondary: '#FFE8EC', text: '#9C0A26' },
    { value: 'tangerine', label: '🍊 제주감귤', primary: '#FF9500', secondary: '#FFF5E5', text: '#A65500' },
    { value: 'peach', label: '🍑 물복숭아', primary: '#FF7A8A', secondary: '#FFF0F2', text: '#A63344' },
    { value: 'blueberry', label: '🫐 블루베리', primary: '#5E5CE6', secondary: '#EFEFFD', text: '#29288A' },
    { value: 'shinemuscat', label: '🍇 샤인머스캣', primary: '#34C759', secondary: '#EAF8ED', text: '#166E28' },
];

export type ColorPalette = typeof COLOR_PALETTES[number]['value'] | 'custom';

export function ColorSelector() {
    const currentPalette = useBuilderStore(state => state.colorPalette);
    const customColors = useBuilderStore(state => state.customColors) || { primary: '#10b981', secondary: '#d1fae5', text: '#047857' };
    const setColorPalette = useBuilderStore(state => state.setColorPalette);
    const setCustomColors = useBuilderStore(state => state.setCustomColors);

    const applyColorsToRoot = (primary: string, secondary: string, text: string) => {
        document.documentElement.style.setProperty('--color-primary', primary);
        document.documentElement.style.setProperty('--color-secondary', secondary);
        document.documentElement.style.setProperty('--color-text', text);
    };

    React.useEffect(() => {
        if (currentPalette === 'custom') {
            applyColorsToRoot(customColors.primary, customColors.secondary, customColors.text);
        } else {
            const selected = COLOR_PALETTES.find(p => p.value === currentPalette);
            if (selected) {
                applyColorsToRoot(selected.primary, selected.secondary, selected.text);
            }
        }
    }, [currentPalette, customColors]);

    const handlePresetChange = (palette: string) => {
        setColorPalette(palette);
        const selected = COLOR_PALETTES.find(p => p.value === palette);
        if (selected) {
            applyColorsToRoot(selected.primary, selected.secondary, selected.text);
        }
    };

    const handleCustomChange = (field: 'primary' | 'secondary' | 'text', value: string) => {
        if (currentPalette !== 'custom') setColorPalette('custom');
        const newColors = { ...customColors, [field]: value };
        setCustomColors(newColors);
        applyColorsToRoot(newColors.primary, newColors.secondary, newColors.text);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                {COLOR_PALETTES.map((palette) => (
                    <button
                        key={palette.value}
                        onClick={() => handlePresetChange(palette.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${currentPalette === palette.value
                                ? 'border-blue-500 bg-blue-500/20'
                                : 'border-gray-300 hover:border-gray-500'
                            }`}
                    >
                        <div
                            className="w-6 h-6 rounded-full shadow-sm"
                            style={{ backgroundColor: palette.primary }}
                        />
                        <span className="text-[10px] text-gray-700">{palette.label}</span>
                    </button>
                ))}
                
                {/* Custom Picker Option */}
                <button
                    onClick={() => {
                        setColorPalette('custom');
                        applyColorsToRoot(customColors.primary, customColors.secondary, customColors.text);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${currentPalette === 'custom'
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                >
                    <div
                        className="w-6 h-6 rounded-full shadow-sm bg-gradient-to-br from-red-500 via-green-500 to-blue-500"
                    />
                    <span className="text-[10px] text-gray-700">⚙️ 커스텀</span>
                </button>
            </div>

            {/* Custom RGB Controls */}
            {currentPalette === 'custom' && (
                <div className="flex gap-2 p-2 bg-slate-50 rounded-lg border border-blue-500/30">
                    <div className="flex-1 flex flex-col items-center">
                        <label className="text-[10px] text-gray-500 mb-1">프라이머리</label>
                        <input 
                            type="color" 
                            className="w-full h-8 cursor-pointer rounded bg-transparent outline-none" 
                            value={customColors.primary} 
                            onChange={(e) => handleCustomChange('primary', e.target.value)} 
                        />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <label className="text-[10px] text-gray-500 mb-1">세컨더리</label>
                        <input 
                            type="color" 
                            className="w-full h-8 cursor-pointer rounded bg-transparent outline-none" 
                            value={customColors.secondary} 
                            onChange={(e) => handleCustomChange('secondary', e.target.value)} 
                        />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <label className="text-[10px] text-gray-500 mb-1">텍스트</label>
                        <input 
                            type="color" 
                            className="w-full h-8 cursor-pointer rounded bg-transparent outline-none" 
                            value={customColors.text} 
                            onChange={(e) => handleCustomChange('text', e.target.value)} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
