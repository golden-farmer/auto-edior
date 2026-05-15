'use client';

import React from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';

const THEMES = [
    { value: 'A', label: '✨ 퓨어 프레시', desc: '과일 본연의 색을 살리는 깔끔한 여백' },
    { value: 'B', label: '🧃 과즙 팡팡', desc: '메인 컬러로 가득 채운 생동감' },
    { value: 'C', label: '☁️ 말랑 쫀득', desc: '둥글둥글 귀여운 모서리와 부드러운 그림자' },
    { value: 'D', label: '💌 농부의 진심', desc: '따뜻한 아이보리 배경과 아날로그 감성' },
    { value: 'E', label: '👑 고당도 명품', desc: '신뢰를 주는 테두리와 프리미엄 분위기' },
    { value: 'F', label: '📸 매거진 픽', desc: '세련된 타이포그래피와 에디토리얼 무드' },
    { value: 'G', label: '🎨 팝 아트', desc: '강렬한 테두리와 원색의 확실한 존재감' },
    { value: 'H', label: '🌿 오가닉 에코', desc: '자연을 담은 크라프트 질감과 따뜻한 톤' },
    { value: 'I', label: '🚨 타임 딜', desc: '시선을 확 끄는 다이내믹 스포츠/할인 룩' },
    { value: 'J', label: '🌃 블랙 라벨', desc: '블랙을 베이스로 한 하이엔드 퀄리티' },
] as const;

export function ThemeSelector() {
    const modules = useBuilderStore(state => state.modules);
    const updateAllVariants = useBuilderStore(state => state.updateAllVariants);

    const activeVariants = modules.filter(m => m.isActive).map(m => m.variant);
    const currentTheme = activeVariants.length > 0 
        ? activeVariants.sort((a,b) => activeVariants.filter(v => v===a).length - activeVariants.filter(v => v===b).length).reverse()[0] 
        : 'A';

    return (
        <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm mb-4">
            <h3 className="text-[13px] font-bold text-gray-500 mb-3 flex items-center gap-2">
                <span className="text-base">🎨</span> 전역 스타일 테마
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {THEMES.map((theme) => (
                    <button
                        key={theme.value}
                        onClick={() => updateAllVariants(theme.value as any)}
                        className={`flex flex-col items-start p-2.5 rounded-lg border transition-all text-left animate-in fade-in
                            ${currentTheme === theme.value
                                ? 'bg-blue-500/20 border-blue-500'
                                : 'bg-white shadow-sm border-gray-200 hover:border-gray-500 hover:bg-white border text-gray-700'
                            }`}
                    >
                        <span className={`text-[12px] font-bold mb-0.5 ${currentTheme === theme.value ? 'text-blue-400' : 'text-gray-800'}`}>
                            {theme.label}
                        </span>
                        <span className="text-[9px] text-gray-500 leading-tight">{theme.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
