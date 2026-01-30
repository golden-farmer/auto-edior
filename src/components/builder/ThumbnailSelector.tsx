'use client';

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';

export function ThumbnailSelector() {
    const { state, dispatch } = useBuilder();
    const { images, selectedThumbnailIds } = state;

    const toggleThumbnail = (id: string) => {
        dispatch({ type: 'TOGGLE_THUMBNAIL_SELECTION', payload: id });
    };

    if (images.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8 bg-gray-900/20 rounded-xl border border-dashed border-gray-700">
                <p className="text-sm">이미지를 먼저 업로드해주세요</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">썸네일 사진 선택</h4>
                    <p className="text-[10px] text-gray-500">{selectedThumbnailIds.length}/10 선택됨</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => {
                    const isSelected = selectedThumbnailIds.includes(image.id);
                    const selectionOrder = selectedThumbnailIds.indexOf(image.id) + 1;
                    const imgSrc = image.transformedUrl || image.previewUrl;

                    return (
                        <div
                            key={image.id}
                            onClick={() => toggleThumbnail(image.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-95'
                                : 'border-transparent hover:border-gray-600 hover:scale-105'
                                }`}
                        >
                            <img
                                src={imgSrc}
                                alt={`Image ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {isSelected && (
                                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                                    <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {selectionOrder}
                                    </span>
                                </div>
                            )}

                            <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
