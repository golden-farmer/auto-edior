'use client';

import { BuilderProvider } from '@/context/BuilderContext';
import { ImageUploader, ProductInputForm, ModuleList, PreviewPanel, ActionBar } from '@/components/builder';

export default function Home() {
  return (
    <BuilderProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                🍎
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Auto Image</h1>
                <p className="text-xs text-gray-400">과일 상세페이지 자동화</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Powered by AI
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Input */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 overflow-hidden">
                <div className="p-6">
                  <ImageUploader />
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 overflow-hidden">
                <div className="p-6">
                  <ProductInputForm />
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 overflow-hidden">
                <div className="p-6">
                  <ModuleList />
                </div>
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 overflow-hidden lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
              <PreviewPanel />
            </div>
          </div>
        </main>

        {/* Action Bar */}
        <ActionBar />
      </div>
    </BuilderProvider>
  );
}
