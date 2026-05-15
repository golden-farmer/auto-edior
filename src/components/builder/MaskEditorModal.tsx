'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MaskRegion } from '@/types';
import { detectMasks, createEmptyProductMask } from '@/hooks/useMaskDetection';
import { MaskPropertyPanel } from './MaskPropertyPanel';

interface MaskEditorModalProps {
    imageId: string;
    imageUrl: string;
    initialMasks?: MaskRegion[];
    onSave: (imageId: string, masks: MaskRegion[]) => void;
    onClose: () => void;
}

export function MaskEditorModal({ imageId, imageUrl, initialMasks, onSave, onClose }: MaskEditorModalProps) {
    const [masks, setMasks] = useState<MaskRegion[]>(initialMasks || []);
    const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [threshold, setThreshold] = useState(80);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // Load and render image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        img.onload = () => {
            imgRef.current = img;
            drawImageOnCanvas(img);
        };
    }, [imageUrl]);

    // Re-draw overlays when masks or selection change
    useEffect(() => {
        if (imgRef.current) drawOverlays();
    }, [masks, selectedMaskId]);

    // Auto-detect on first open if no masks yet
    useEffect(() => {
        if (!initialMasks || initialMasks.length === 0) {
            runDetection();
        }
    }, []);

    function drawImageOnCanvas(img: HTMLImageElement) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxW = canvas.parentElement?.clientWidth || 600;
        const maxH = canvas.parentElement?.clientHeight || 500;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        if (overlayRef.current) {
            overlayRef.current.width = canvas.width;
            overlayRef.current.height = canvas.height;
        }
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawOverlays();
    }

    const drawOverlays = useCallback(() => {
        const overlay = overlayRef.current;
        const canvas = canvasRef.current;
        if (!overlay || !canvas) return;
        const ctx = overlay.getContext('2d')!;
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        const W = overlay.width;
        const H = overlay.height;

        masks.forEach(mask => {
            if (!mask.visible) return;

            const isSelected = mask.id === selectedMaskId;
            const opacity = isSelected ? Math.min(mask.opacity + 0.2, 0.85) : mask.opacity;

            // Parse hex color
            const r = parseInt(mask.color.slice(1, 3), 16);
            const g = parseInt(mask.color.slice(3, 5), 16);
            const b = parseInt(mask.color.slice(5, 7), 16);

            if (mask.pixelIndices && mask.pixelIndices.length > 0) {
                // Draw pixel-accurate overlay using ImageData
                // pixelIndices are from downscaled canvas (200px), scale to display canvas
                const imageData = ctx.createImageData(W, H);
                // We'll approximate by drawing a semi-transparent fill over detected bounding
                // Pixel-level overlay from downscaled detection
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                // Use convex hull approximation: fill bounding rect of pixelIndices
                // For display purposes this gives a good visual indicator
                const SAMPLE = 200; // detection sample size
                const scaleX = W / SAMPLE;
                const scaleY = H / SAMPLE;
                let minX = SAMPLE, maxX = 0, minY = SAMPLE, maxY = 0;
                const step = Math.max(1, Math.floor(mask.pixelIndices.length / 2000));
                for (let i = 0; i < mask.pixelIndices.length; i += step) {
                    const pi = mask.pixelIndices[i];
                    const px = pi % SAMPLE;
                    const py = Math.floor(pi / SAMPLE);
                    if (px < minX) minX = px;
                    if (px > maxX) maxX = px;
                    if (py < minY) minY = py;
                    if (py > maxY) maxY = py;
                }
                // Draw individual pixel columns for accuracy
                // Group by row
                const rowMap = new Map<number, [number, number]>();
                for (let i = 0; i < mask.pixelIndices.length; i++) {
                    const pi = mask.pixelIndices[i];
                    const px = pi % SAMPLE;
                    const py = Math.floor(pi / SAMPLE);
                    const entry = rowMap.get(py);
                    if (!entry) rowMap.set(py, [px, px]);
                    else { if (px < entry[0]) entry[0] = px; if (px > entry[1]) entry[1] = px; }
                }
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                rowMap.forEach(([ xMin, xMax ], y) => {
                    ctx.fillRect(
                        Math.floor(xMin * scaleX),
                        Math.floor(y * scaleY),
                        Math.ceil((xMax - xMin + 1) * scaleX),
                        Math.ceil(scaleY)
                    );
                });
            } else {
                // Background mask or no pixel data → fill entire canvas
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.fillRect(0, 0, W, H);
            }

            // Selection border
            if (isSelected) {
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
                ctx.lineWidth = 3;
                ctx.strokeRect(2, 2, W - 4, H - 4);
            }
        });
    }, [masks, selectedMaskId]);

    async function runDetection() {
        setIsDetecting(true);
        try {
            const detected = await detectMasks(imageUrl, { threshold });
            setMasks(detected);
            if (detected.length > 0) setSelectedMaskId(detected[0].id);
        } catch (e) {
            console.error('Mask detection failed:', e);
        } finally {
            setIsDetecting(false);
        }
    }

    function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
        // Find which mask was clicked by checking pixel position
        const canvas = overlayRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const W = canvas.width;
        const SAMPLE = 200;
        const scaleX = W / SAMPLE;
        const scaleY = canvas.height / SAMPLE;
        const sx = Math.floor(x / scaleX);
        const sy = Math.floor(y / scaleY);
        const clickedIdx = sy * SAMPLE + sx;

        // Find topmost visible product mask containing this pixel
        let found: string | null = null;
        for (let i = masks.length - 1; i >= 0; i--) {
            const m = masks[i];
            if (!m.visible) continue;
            if (m.maskType === 'product' && m.pixelIndices) {
                // Binary search or simple includes (use Set for O(1) lookup)
                const pixSet = new Set(m.pixelIndices);
                if (pixSet.has(clickedIdx)) { found = m.id; break; }
            }
        }
        if (!found) {
            // Click on uncovered area → select background
            const bg = masks.find(m => m.maskType === 'background');
            if (bg) found = bg.id;
        }
        if (found) setSelectedMaskId(found);
    }

    function updateMask(updated: MaskRegion) {
        setMasks(prev => prev.map(m => m.id === updated.id ? updated : m));
    }

    function deleteMask(id: string) {
        setMasks(prev => prev.filter(m => m.id !== id));
        if (selectedMaskId === id) setSelectedMaskId(masks[0]?.id || null);
    }

    function addProductMask() {
        const productCount = masks.filter(m => m.maskType === 'product').length;
        const newMask = createEmptyProductMask(productCount);
        setMasks(prev => [...prev, newMask]);
        setSelectedMaskId(newMask.id);
    }

    function handleExportJson() {
        const exportData = masks.map(({ pixelIndices: _, ...rest }) => rest);
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `masks_${imageId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleSave() {
        onSave(imageId, masks);
        onClose();
    }

    const selectedMask = masks.find(m => m.id === selectedMaskId) || null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-50 border border-gray-200 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎭</span>
                        <div>
                            <h2 className="text-gray-900 font-bold text-lg">마스크 에디터</h2>
                            <p className="text-gray-500 text-xs">배경과 물건 영역을 자동 감지하고 편집합니다</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 mr-1">감도</label>
                        <input
                            type="range"
                            min={20}
                            max={160}
                            step={10}
                            value={threshold}
                            onChange={e => setThreshold(Number(e.target.value))}
                            className="w-20 accent-blue-500"
                            title={`임계값: ${threshold}`}
                        />
                        <span className="text-xs text-gray-500 w-8">{threshold}</span>
                        <button
                            onClick={runDetection}
                            disabled={isDetecting}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                            {isDetecting ? <span className="animate-spin">⏳</span> : '🔍'}
                            재감지
                        </button>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white border text-gray-700 rounded-lg transition-colors">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Canvas Area */}
                    <div className="flex-1 relative bg-gray-950 overflow-hidden flex items-center justify-center p-4">
                        {isDetecting && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                                <div className="animate-spin w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full mb-3" />
                                <span className="text-gray-900 text-sm">마스크 감지 중...</span>
                            </div>
                        )}
                        <div className="relative">
                            <canvas ref={canvasRef} className="block rounded-lg shadow-xl" />
                            <canvas
                                ref={overlayRef}
                                onClick={handleCanvasClick}
                                className="absolute inset-0 rounded-lg cursor-crosshair"
                                style={{ mixBlendMode: 'normal' }}
                            />
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="w-80 flex flex-col border-l border-gray-200 bg-white/50 flex-shrink-0">
                        {/* Mask List */}
                        <div className="p-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700">마스크 목록 ({masks.length})</span>
                                <button
                                    onClick={addProductMask}
                                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 py-1 rounded transition-colors"
                                >
                                    + 물건 추가
                                </button>
                            </div>
                            <div className="space-y-1 max-h-36 overflow-y-auto">
                                {masks.map(mask => (
                                    <button
                                        key={mask.id}
                                        onClick={() => setSelectedMaskId(mask.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                                            selectedMaskId === mask.id
                                                ? 'bg-gray-200 text-gray-900'
                                                : 'text-gray-700 hover:bg-white border text-gray-700'
                                        }`}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: mask.color, opacity: mask.visible ? 1 : 0.3 }}
                                        />
                                        <span className="truncate">{mask.name}</span>
                                        <span className="ml-auto text-[10px] text-gray-500">
                                            {mask.maskType === 'background' ? '배경' : '물건'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Property Panel */}
                        <div className="flex-1 overflow-hidden p-4">
                            {selectedMask ? (
                                <MaskPropertyPanel
                                    mask={selectedMask}
                                    onChange={updateMask}
                                    onDelete={() => deleteMask(selectedMask.id)}
                                    canDelete={selectedMask.maskType !== 'background'}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <span className="text-4xl mb-2">🎨</span>
                                    <p className="text-sm">마스크를 클릭하여 편집</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white/50">
                    <div className="text-xs text-gray-500">
                        배경 1개 + 물건 {masks.filter(m => m.maskType === 'product').length}개
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportJson}
                            className="px-4 py-2 border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            📄 JSON 내보내기
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border text-gray-700 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg"
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
