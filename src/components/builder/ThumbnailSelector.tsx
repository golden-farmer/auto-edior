'use client';

import React, { useState, useRef } from 'react';
import { useBuilder } from '@/context/BuilderContext';

export function ThumbnailSelector() {
    const { state } = useBuilder();
    const { images } = state;
    const [selectedThumbnails, setSelectedThumbnails] = useState<number[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const toggleThumbnail = (index: number) => {
        setSelectedThumbnails(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else if (prev.length < 10) {
                return [...prev, index];
            }
            return prev;
        });
    };

    const cropToSquare = (img: HTMLImageElement, size: number = 500): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = size;
            canvas.height = size;

            // Center crop
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        });
    };

    const downloadThumbnails = async () => {
        if (selectedThumbnails.length === 0) return;

        for (let i = 0; i < selectedThumbnails.length; i++) {
            const imgIndex = selectedThumbnails[i];
            const image = images[imgIndex];
            if (!image) continue;

            const imgSrc = image.transformedUrl || image.previewUrl;

            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>((resolve) => {
                img.onload = async () => {
                    const croppedDataUrl = await cropToSquare(img, 500);

                    // Download
                    const link = document.createElement('a');
                    link.download = `thumbnail_${i + 1}_500x500.jpg`;
                    link.href = croppedDataUrl;
                    link.click();

                    resolve();
                };
                img.src = imgSrc;
            });

            // Small delay between downloads
            await new Promise(r => setTimeout(r, 300));
        }
    };

    if (images.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                <p className="text-sm">이미지를 먼저 업로드해주세요</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                    {selectedThumbnails.length}/10 선택됨
                </p>
                <button
                    onClick={downloadThumbnails}
                    disabled={selectedThumbnails.length === 0}
                    className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    500x500 다운로드
                </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => {
                    const isSelected = selectedThumbnails.includes(index);
                    const selectionOrder = selectedThumbnails.indexOf(index) + 1;
                    const imgSrc = image.transformedUrl || image.previewUrl;

                    return (
                        <div
                            key={image.id}
                            onClick={() => toggleThumbnail(index)}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                                    : 'border-transparent hover:border-gray-500'
                                }`}
                        >
                            <img
                                src={imgSrc}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Selection overlay */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                                    <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {selectionOrder}
                                    </span>
                                </div>
                            )}

                            {/* Image number */}
                            <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedThumbnails.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">선택된 순서:</p>
                    <div className="flex flex-wrap gap-1">
                        {selectedThumbnails.map((imgIndex, order) => (
                            <span key={imgIndex} className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">
                                {order + 1}. 이미지 {imgIndex + 1}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" width={500} height={500} />
        </div>
    );
}
