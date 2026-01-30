'use client';

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { FONT_OPTIONS, FontType, TextScale, TEXT_SCALE_VALUES } from '@/types';

const SCALE_LABELS: Record<TextScale, string> = {
    small: '작게',
    normal: '보통',
    large: '크게',
};

export function FontSelector() {
    const { state, dispatch } = useBuilder();
    const { titleFont, bodyFont, textScale } = state;

    const handleTitleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_TITLE_FONT', payload: e.target.value as FontType });
    };

    const handleBodyFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_BODY_FONT', payload: e.target.value as FontType });
    };

    const handleScaleChange = (scale: TextScale) => {
        dispatch({ type: 'SET_TEXT_SCALE', payload: scale });
    };

    return (
        <div className="space-y-3 p-4 bg-gray-800/60 rounded-lg border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">🔤 폰트 설정</h4>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">제목 폰트</label>
                    <select
                        value={titleFont}
                        onChange={handleTitleFontChange}
                        className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 outline-none hover:border-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label} ({font.description})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-1">본문 폰트</label>
                    <select
                        value={bodyFont}
                        onChange={handleBodyFontChange}
                        className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 outline-none hover:border-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label} ({font.description})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Text Scale Toggle */}
            <div>
                <label className="block text-xs text-gray-400 mb-1">글자 크기</label>
                <div className="flex gap-1">
                    {(['small', 'normal', 'large'] as TextScale[]).map((scale) => (
                        <button
                            key={scale}
                            onClick={() => handleScaleChange(scale)}
                            className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all ${textScale === scale
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {SCALE_LABELS[scale]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
