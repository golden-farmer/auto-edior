'use client';

import React, { useState } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { stitchModuleImages, createZip, downloadBlob, downloadDataUrl } from '@/lib/image-processing';

export function ActionBar() {
    const { state, dispatch } = useBuilder();
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const handleGenerateAI = async () => {
        const missingFields = [];
        if (!state.productData.productName) missingFields.push('상품명');
        // if (!state.productData.productDescription) missingFields.push('상품 설명'); // Optional?

        if (missingFields.length > 0) {
            alert(`다음 항목을 입력해주세요:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setIsGeneratingAI(true);
        dispatch({ type: 'SET_PROGRESS', payload: { progress: 0, message: 'AI 텍스트 생성 중...' } });

        try {
            // Generate review summary
            const reviewRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'review-summary',
                    productName: state.productData.productName,
                    description: state.productData.productDescription,
                }),
            });
            const reviewData = await reviewRes.json();
            dispatch({ type: 'SET_PRODUCT_DATA', payload: { reviewSummary: reviewData.result } });
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 50, message: '리뷰 요약 생성 완료...' } });

            // Generate caution notice
            const cautionRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'caution-notice',
                    productName: state.productData.productName,
                }),
            });
            const cautionData = await cautionRes.json();
            dispatch({ type: 'SET_PRODUCT_DATA', payload: { cautionText: cautionData.result } });
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 100, message: 'AI 생성 완료!' } });
        } catch (error) {
            console.error('AI generation error:', error);
            alert('AI 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleDownload = async () => {
        const container = document.getElementById('preview-container');
        if (!container) return;

        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_PROGRESS', payload: { progress: 0, message: '이미지 생성 중...' } });

        try {
            const moduleElements = Array.from(container.querySelectorAll('.module-item')) as HTMLElement[];

            const result = await stitchModuleImages(moduleElements, (current, total) => {
                dispatch({
                    type: 'SET_PROGRESS', payload: {
                        progress: (current / total) * 80,
                        message: `모듈 캡처 중 (${current}/${total})...`
                    }
                });
            });

            dispatch({ type: 'SET_PROGRESS', payload: { progress: 90, message: '파일 생성 중...' } });

            if (result.needsZip) {
                const zipBlob = await createZip(result.images, state.productData.productName || 'detail-page');
                downloadBlob(zipBlob, `${state.productData.productName || 'detail-page'}.zip`);
            } else {
                downloadDataUrl(result.images[0], `${state.productData.productName || 'detail-page'}.png`);
            }

            dispatch({ type: 'SET_PROGRESS', payload: { progress: 100, message: '다운로드 완료!' } });
        } catch (error) {
            console.error('Download error:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        } finally {
            dispatch({ type: 'SET_GENERATING', payload: false });
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur border-t border-gray-700 p-4 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Progress indicator */}
                {state.progress > 0 && state.progress < 100 && (
                    <div className="flex-1 max-w-md">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                                    style={{ width: `${state.progress}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-400 whitespace-nowrap">{state.progressMessage}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 ml-auto">
                    <button
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI || state.isGenerating}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        {isGeneratingAI ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <span>✨</span>
                        )}
                        AI 텍스트 생성
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={state.isGenerating}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                    >
                        📥 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
