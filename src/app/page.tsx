'use client';

import { useState } from 'react';
import { BuilderProvider } from '@/context/BuilderContext';
import { ImageUploader, ProductInputForm, ModuleList, PreviewPanel, ActionBar } from '@/components/builder';

// Recommended selling points data
const SELLING_POINTS = [
  { category: '신선도', phrases: ['당일 수확 당일 발송', '산지 직송 신선함', '냉장 특송으로 신선하게'] },
  { category: '품질', phrases: ['GAP 인증 농산물', '무농약 재배', '프리미엄 등급만 선별'] },
  { category: '당도', phrases: ['비파괴 당도 선별', '고당도 보장', '14Brix 이상 고당도'] },
  { category: '신뢰', phrases: ['30년 경력 농부', '3대째 이어온 농장', '재구매율 90%'] },
  { category: '혜택', phrases: ['첫 구매 특별 할인', '2+1 이벤트 진행중', '무료 배송'] },
  { category: '안심', phrases: ['100% 환불 보장', '하자 시 전액 환불', '꼼꼼 포장 안심 배송'] },
];

function HelpTooltip({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-[100] overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-700 border-b border-gray-600">
        <h3 className="font-bold text-white text-sm">💡 소구점 추천 문구</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="p-3 max-h-80 overflow-y-auto space-y-3">
        {SELLING_POINTS.map((group) => (
          <div key={group.category}>
            <p className="text-xs font-bold text-emerald-400 mb-1.5">{group.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.phrases.map((phrase) => (
                <span
                  key={phrase}
                  className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-md hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors"
                  onClick={() => navigator.clipboard.writeText(phrase)}
                  title="클릭하여 복사"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 bg-gray-700/50 border-t border-gray-600">
        <p className="text-[10px] text-gray-400 text-center">문구를 클릭하면 복사됩니다</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <BuilderProvider>
      <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
        {/* Header - Fixed Height */}
        <header className="h-16 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 flex-shrink-0 z-50 relative">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                🍎
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">과일 상세페이지</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 flex items-center justify-center bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full transition-colors shadow-lg"
                title="소구점 추천 문구"
              >
                !
              </button>
              <div className="text-xs text-gray-500">v1.0</div>
            </div>
          </div>
          <HelpTooltip isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </header>

        {/* Main Workspace - Flex Row */}
        <div className="flex-1 flex overflow-hidden">

          {/* Sidebar - Fixed Width, Scrollable */}
          <aside className="w-[420px] h-full flex flex-col bg-gray-800/30 border-r border-gray-700 flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-[3px] hover:[&::-webkit-scrollbar-thumb]:bg-white/20">

              {/* Uploder Section */}
              <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-700/50 bg-gray-800">
                  <h2 className="text-sm font-semibold text-gray-300">1. 상품 이미지</h2>
                </div>
                <div className="p-4">
                  <ImageUploader />
                </div>
              </div>

              {/* Info Form */}
              <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-700/50 bg-gray-800">
                  <h2 className="text-sm font-semibold text-gray-300">2. 기본 정보</h2>
                </div>
                <div className="p-4">
                  <ProductInputForm />
                </div>
              </div>

              {/* Module Config - Takes remaining space or flows naturally? Let's flow. */}
              <div className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-700/50 bg-gray-800">
                  <h2 className="text-sm font-semibold text-gray-300">3. 상세페이지 구성</h2>
                </div>
                <div className="p-4">
                  <ModuleList />
                </div>
              </div>

              {/* Spacer for Action Bar */}
              <div className="h-20"></div>
            </div>
          </aside>

          {/* Preview Area - Flex 1, Centered */}
          <main className="flex-1 h-full bg-gray-950/50 relative overflow-hidden flex flex-col">
            <div className="flex-1 h-full overflow-hidden">
              {/* PreviewPanel has its own scrolling */}
              <PreviewPanel />
            </div>
          </main>
        </div>

        {/* Action Bar - Fixed Bottom (or inside Sidebar?) 
            Original design had it fixed bottom. Let's keep it global.
        */}
        <ActionBar />
      </div>

    </BuilderProvider>
  );
}
