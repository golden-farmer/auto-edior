'use client';

import React, { useState } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { stitchModuleImages, downloadDataUrl, downloadBlob } from '@/lib/image-processing';
import { generateThumbnail } from '@/lib/thumbnail';
import { COLOR_PALETTES } from './ColorSelector';
import { TEXT_SCALE_VALUES } from '@/types';
// import JSZip from 'jszip'; // Removed to avoid potential chunk load issues as requested

export function ActionBar() {
    const { state, dispatch } = useBuilder();
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const handleGenerateAI = async () => {
        const missingFields = [];
        if (!state.productData.productName) missingFields.push('상품명');

        if (missingFields.length > 0) {
            alert(`다음 항목을 입력해주세요:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setIsGeneratingAI(true);
        dispatch({ type: 'SET_PROGRESS', payload: { progress: 0, message: 'AI 텍스트 생성 중...' } });

        try {
            console.log('Starting AI generation...');
            // 1. 이미지 분석 (첫 번째 이미지가 있는 경우)
            let imageAnalysis = '';
            if (state.images.length > 0) {
                console.log('Image detected, analyzing first image...');
                dispatch({ type: 'SET_PROGRESS', payload: { progress: 10, message: '이미지 분석 중...' } });
                try {
                    const firstImage = state.images[0];
                    let base64 = '';

                    if (firstImage.file) {
                        console.log('Using File object for base64 conversion...');
                        base64 = await fileToBase64(firstImage.file);
                    } else {
                        console.log('Fetching image from preview URL (no File object found):', firstImage.previewUrl);
                        const response = await fetch(firstImage.previewUrl);
                        const blob = await response.blob();
                        base64 = await fileToBase64(new File([blob], 'image.jpg'));
                    }

                    if (base64) {
                        console.log('Calling /api/generate for image analysis...');
                        const analysisRes = await fetch('/api/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'analyze-image', imageBase64: base64 }),
                        });
                        const analysisData = await analysisRes.json();
                        imageAnalysis = analysisData.result || '';
                    }
                    console.log('Image analysis complete.');
                } catch (e) {
                    console.error('Image analysis failed:', e);
                }
            }

            // 2. 상단 후킹 문구 생성
            console.log('Requesting hooking copy...');
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 30, message: '후킹 문구 생성 중...' } });
            const hookingRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'hooking-copy',
                    productName: state.productData.productName,
                    imageAnalysis,
                }),
            });
            if (!hookingRes.ok) throw new Error(`Hooking copy request failed: ${hookingRes.status}`);
            const hookingData = await hookingRes.json();

            // Update HookingBanner module with generated copy
            const hookingModule = state.modules.find(m => m.type === 'hooking-banner');
            if (hookingModule) {
                dispatch({
                    type: 'UPDATE_MODULE_DATA',
                    payload: { id: hookingModule.id, data: { mainCopy: hookingData.result?.trim() || '' } }
                });
            }

            // 3. 소구점 3종 생성
            console.log('Requesting selling points...');
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 50, message: '소구점 생성 중...' } });
            const sellingRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'selling-points',
                    productName: state.productData.productName,
                    imageAnalysis,
                }),
            });
            if (!sellingRes.ok) throw new Error(`Selling points request failed: ${sellingRes.status}`);
            const sellingData = await sellingRes.json();

            // Parse selling points and update BenefitPoint modules
            const sellingPointsText = sellingData.result || '';
            const sellingPoints = parseSellingPoints(sellingPointsText);

            console.log('Final Parsed Selling Points for Dispatch:', sellingPoints);

            // 소구점 모듈 업데이트
            state.modules.forEach(m => {
                const match = m.type.match(/benefit-point-(\d)/);
                if (match) {
                    const idx = parseInt(match[1]) - 1;
                    if (sellingPoints[idx]) {
                        dispatch({
                            type: 'UPDATE_MODULE_DATA',
                            payload: {
                                id: m.id,
                                data: {
                                    title: sellingPoints[idx].title,
                                    description: sellingPoints[idx].description
                                }
                            }
                        });
                    }
                }
            });

            // 4. 보관 팁 및 주의사항 생성
            console.log('Requesting storage tips...');
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 70, message: '보관 팁 생성 중...' } });
            const storageRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'storage-tips',
                    productName: state.productData.productName,
                }),
            });
            if (!storageRes.ok) throw new Error(`Storage tips request failed: ${storageRes.status}`);
            const storageData = await storageRes.json();

            // Update TasteTip or CautionNotice module with storage tips
            const tasteTipModule = state.modules.find(m => m.type === 'taste-tip');
            if (tasteTipModule) {
                const tips = parseStorageTips(storageData.result || '');
                const tipData: Record<string, string> = {};
                tips.forEach((tip, i) => {
                    tipData[`tip${i + 1}`] = tip;
                });
                dispatch({
                    type: 'UPDATE_MODULE_DATA',
                    payload: { id: tasteTipModule.id, data: tipData }
                });
            }

            // 5. 리뷰 3종 생성
            console.log('Requesting review 3-pack...');
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 85, message: '리뷰 3종 생성 중...' } });
            const reviewRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'review-summary',
                    productName: state.productData.productName,
                    description: state.productData.productDescription || '',
                }),
            });
            if (!reviewRes.ok) throw new Error(`Review summary request failed: ${reviewRes.status}`);
            const reviewData = await reviewRes.json();

            const reviewText = reviewData.result || '';
            const parsedReviews = parseReviews(reviewText);

            const reviewModule = state.modules.find(m => m.type === 'review-summary');
            if (reviewModule && parsedReviews.length > 0) {
                const updatePayload: Record<string, unknown> = {};
                parsedReviews.forEach((rev, i) => {
                    updatePayload[`title${i + 1}`] = rev.title;
                    updatePayload[`text${i + 1}`] = rev.text;
                });
                dispatch({
                    type: 'UPDATE_MODULE_DATA',
                    payload: { id: reviewModule.id, data: updatePayload }
                });
            }

            // 6. 3초 요약 카드 생성
            console.log('Requesting summary card...');
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 90, message: '요약 카드 생성 중...' } });
            const summaryRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'summary-card',
                    productName: state.productData.productName,
                }),
            });
            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                const summaryModule = state.modules.find(m => m.type === 'summary-card');
                if (summaryModule) {
                    const parsedData = parseSummaryCard(summaryData.result || '');
                    dispatch({
                        type: 'UPDATE_MODULE_DATA',
                        payload: { id: summaryModule.id, data: parsedData }
                    });
                }
            }

            // 7. 비교 테이블 생성
            console.log('Requesting comparison table...');
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 95, message: '비교 테이블 생성 중...' } });
            const compModule = state.modules.find(m => m.type === 'comparison-table');
            if (compModule) {
                const compRes = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'comparison-table',
                        productName: state.productData.productName,
                        rowCount: (compModule.data.rowCount as number) || 3
                    }),
                });
                if (compRes.ok) {
                    const compData = await compRes.json();
                    const parsedData = parseComparisonTable(compData.result || '');
                    dispatch({
                        type: 'UPDATE_MODULE_DATA',
                        payload: { id: compModule.id, data: parsedData }
                    });
                }
            }

            dispatch({ type: 'SET_PROGRESS', payload: { progress: 100, message: 'AI 생성 완료!' } });
            console.log('AI generation complete.');
        } catch (error) {
            console.error('Detailed AI generation error:', error);
            alert('AI 생성 중 오류가 발생했습니다. 브라우저 콘솔(F12)을 확인해주세요.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // Parse selling points from AI response
    const parseSellingPoints = (text: string): Array<{ title: string, description: string }> => {
        console.log('--- AI Selling Points Raw Response ---');
        console.log(text);

        const points: Array<{ title: string, description: string }> = [];
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

        lines.forEach(line => {
            // "소구점 1:", "1.", "[1]" 등 머리말 제거
            let cleaned = line.replace(/^(?:소구점|point|리뷰|소항점|항목)?\s*[\d\.\s\[\]\:]+\s*[:：\-\/]?\s*/i, '').trim();

            // 구분자 (/, :, |, —) 기준으로 분리 - 가장 처음 나오는 것을 기준으로 분리
            const separatorMatch = cleaned.match(/[\/|:：\-\—]/);

            if (separatorMatch && separatorMatch.index !== undefined) {
                const title = cleaned.slice(0, separatorMatch.index).replace(/[\[\]]/g, '').trim();
                const description = cleaned.slice(separatorMatch.index + 1).replace(/[\[\]]/g, '').trim();
                if (title && description) {
                    points.push({ title: title.slice(0, 20), description });
                    return;
                }
            }

            // 구분자가 없으면 적당히 반 잘라서 넣거나 전체를 설명으로 넣음
            if (cleaned.length > 10) {
                points.push({
                    title: cleaned.slice(0, 10).trim(),
                    description: cleaned.trim()
                });
            }
        });

        console.log('--- Parsed Selling Results ---', points);
        return points;
    };

    // Parse review 3-pack from AI response
    const parseReviews = (text: string): Array<{ title: string, text: string }> => {
        console.log('--- AI Reviews Raw Response ---');
        console.log(text);
        const reviews: Array<{ title: string, text: string }> = [];
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

        lines.forEach(line => {
            let cleaned = line.replace(/^(?:리뷰|review|point|소구점)?\s*[\d\.\s\[\]\:]+\s*[:：\-\/]?\s*/i, '').trim();
            const separatorMatch = cleaned.match(/[\/|:：\-\—]/);

            if (separatorMatch && separatorMatch.index !== undefined) {
                const title = cleaned.slice(0, separatorMatch.index).replace(/[\[\]]/g, '').trim();
                const text = cleaned.slice(separatorMatch.index + 1).replace(/[\[\]]/g, '').trim();
                if (title && text) {
                    reviews.push({ title: title.slice(0, 15), text });
                    return;
                }
            }

            if (cleaned.length > 10) {
                reviews.push({
                    title: '실제 구매 후기',
                    text: cleaned.trim()
                });
            }
        });
        return reviews.slice(0, 3);
    };

    // Parse storage tips from AI response
    const parseStorageTips = (text: string): string[] => {
        console.log('--- AI Storage Tips Raw Response ---');
        console.log(text);

        const tips = text
            .split('\n')
            .map(line => line.replace(/^[•\-\*\d\.\s]+/, '').trim())
            .filter(line => line.length > 3)
            .slice(0, 4);

        console.log('--- Parsed Tips ---', tips);
        return tips;
    };

    const parseSummaryCard = (text: string): Record<string, string> => {
        const newData: Record<string, string> = {};
        const lines = text.split('\n').filter(l => l.includes('|'));
        lines.forEach((line, i) => {
            const parts = line.split('|');
            if (parts.length >= 3) {
                // Remove prefixes like "지표 1: " or "1. "
                newData[`label${i + 1}`] = parts[0].replace(/^.*[:：.]\s*/, '').trim().replace(/[\[\]]/g, '');
                newData[`value${i + 1}`] = parts[1].trim().replace(/[\[\]]/g, '');
                newData[`desc${i + 1}`] = parts[2].trim().replace(/[\[\]]/g, '');
            }
        });
        return newData;
    };

    const parseComparisonTable = (text: string): Record<string, string> => {
        const newData: Record<string, string> = {};
        const lines = text.split('\n').filter(l => l.includes('|'));
        lines.forEach((line, i) => {
            const parts = line.split('|');
            if (parts.length >= 3) {
                // Remove prefixes like "항목 1: " or "1. "
                newData[`row${i + 1}Title`] = parts[0].replace(/^.*[:：.]\s*/, '').trim().replace(/[\[\]]/g, '');
                newData[`row${i + 1}Our`] = parts[1].trim().replace(/[\[\]]/g, '');
                newData[`row${i + 1}Comp`] = parts[2].trim().replace(/[\[\]]/g, '');
            }
        });
        return newData;
    };


    // 개별 일괄 다운로드 (상세페이지 + 선택된 썸네일)
    const handleDownloadAll = async () => {
        console.log('--- Download Started [Ver: 2026-01-31-0610-FontSwap] ---');
        const container = document.getElementById('preview-container');
        if (!container) return;

        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_PROGRESS', payload: { progress: 5, message: '이미지 생성 준비 중...' } });

        try {
            // 1. 상세페이지 캡처 (모듈별 캡처 + 스타일 주입 방식으로 변경) - 안정성 확보
            const moduleElements = Array.from(container.querySelectorAll('.module-item')) as HTMLElement[];

            const palette = COLOR_PALETTES.find(p => p.value === state.colorPalette) || COLOR_PALETTES[0];
            const captureOptions = {
                titleFont: state.titleFont,
                bodyFont: state.bodyFont,
                textScale: TEXT_SCALE_VALUES[state.textScale],
                primaryColor: palette.primary,
                secondaryColor: palette.secondary,
                textColor: palette.text
            };

            const stitchResult = await stitchModuleImages(moduleElements, (current, total) => {
                dispatch({
                    type: 'SET_PROGRESS', payload: {
                        progress: 5 + (current / total) * 60,
                        message: `상세페이지 캡처 중 (${current}/${total})...`
                    }
                });
            }, captureOptions);

            // 2. 썸네일 생성
            const thumbnailImages: { name: string, dataUrl: string }[] = [];
            const selectedIds = state.selectedThumbnailIds;

            if (selectedIds.length > 0) {
                dispatch({ type: 'SET_PROGRESS', payload: { progress: 70, message: '썸네일 생성 중...' } });
                for (let i = 0; i < selectedIds.length; i++) {
                    const id = selectedIds[i];
                    const image = state.images.find(img => img.id === id);
                    if (image) {
                        const imgSrc = image.transformedUrl || image.previewUrl;
                        // 첫 번째는 대표 썸네일(1000), 나머지는 추가(500)
                        const size = i === 0 ? 1000 : 500;
                        const thumbDataUrl = await generateThumbnail(imgSrc, i === 0 ? state.productData.productName : '', size);
                        thumbnailImages.push({
                            name: i === 0 ? `00_대표썸네일` : `썸네일_${i}`,
                            dataUrl: thumbDataUrl
                        });
                    }
                }
            }

            // 3. 개별 파일 다운로드
            dispatch({ type: 'SET_PROGRESS', payload: { progress: 90, message: '파일 다운로드 중...' } });

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const productName = state.productData.productName || '상품';
            const prefix = `[${today}]_[${productName}]`;

            // 상세페이지 다운로드
            stitchResult.images.forEach((imgData, idx) => {
                downloadDataUrl(imgData, `${prefix}_상세페이지_${idx + 1}.png`);
            });

            // 썸네일 다운로드
            thumbnailImages.forEach(thumb => {
                downloadDataUrl(thumb.dataUrl, `${prefix}_${thumb.name}.png`);
            });

            dispatch({ type: 'SET_PROGRESS', payload: { progress: 100, message: '다운로드 완료!' } });
        } catch (error: any) {
            console.error('Download error 상세:', error);
            alert(`다운로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
        } finally {
            dispatch({ type: 'SET_GENERATING', payload: false });
        }
    };

    const handleDownload = async () => {
        const container = document.getElementById('preview-container');
        if (!container) return;

        dispatch({ type: 'SET_GENERATING', payload: true });
        dispatch({ type: 'SET_PROGRESS', payload: { progress: 0, message: '이미지 생성 중...' } });

        try {
            const moduleElements = Array.from(container.querySelectorAll('.module-item')) as HTMLElement[];

            const palette = COLOR_PALETTES.find(p => p.value === state.colorPalette) || COLOR_PALETTES[0];
            const captureOptions = {
                titleFont: state.titleFont,
                bodyFont: state.bodyFont,
                textScale: TEXT_SCALE_VALUES[state.textScale],
                primaryColor: palette.primary,
                secondaryColor: palette.secondary,
                textColor: palette.text
            };

            const result = await stitchModuleImages(moduleElements, (current, total) => {
                dispatch({
                    type: 'SET_PROGRESS', payload: {
                        progress: (current / total) * 80,
                        message: `모듈 캡처 중 (${current}/${total})...`
                    }
                });
            }, captureOptions);

            dispatch({ type: 'SET_PROGRESS', payload: { progress: 90, message: '파일 생성 중...' } });

            // Always download as single stitched image (stitch all module images into one long image)
            // If multiple images, we use the first one (already stitched by stitchModuleImages)
            if (result.images.length > 0) {
                downloadDataUrl(result.images[0], `${state.productData.productName || 'detail-page'}.png`);
            }

            dispatch({ type: 'SET_PROGRESS', payload: { progress: 100, message: '다운로드 완료!' } });
        } catch (error: any) {
            console.error('Download error 상세:', error);
            alert(`다운로드 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
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
                        AI 텍스트
                    </button>

                    <button
                        onClick={handleDownloadAll}
                        disabled={state.isGenerating}
                        className="px-8 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                    >
                        📥 다운로드 (전체)
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
