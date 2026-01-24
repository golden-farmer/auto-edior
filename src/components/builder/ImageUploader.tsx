'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBuilder } from '@/context/BuilderContext';

export function ImageUploader() {
    const { state, dispatch } = useBuilder();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const remainingSlots = 20 - state.images.length;
        const filesToAdd = acceptedFiles.slice(0, remainingSlots);
        filesToAdd.forEach(file => {
            dispatch({ type: 'ADD_IMAGE', payload: file });
        });
    }, [state.images.length, dispatch]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        maxFiles: 20 - state.images.length,
    });

    const removeImage = (id: string) => {
        dispatch({ type: 'REMOVE_IMAGE', payload: id });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">상품 이미지 업로드</h3>
            <p className="text-sm text-gray-400">최대 20장까지 업로드 가능합니다 ({state.images.length}/20)</p>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                    }
          ${state.images.length >= 20 ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} disabled={state.images.length >= 20} />
                <div className="space-y-2">
                    <div className="text-4xl">📷</div>
                    {isDragActive ? (
                        <p className="text-emerald-400">이미지를 여기에 놓으세요</p>
                    ) : (
                        <p className="text-gray-400">클릭하거나 이미지를 드래그하여 업로드</p>
                    )}
                </div>
            </div>

            {state.images.length > 0 && (
                <div className="grid grid-cols-5 gap-3">
                    {state.images.map((img, index) => (
                        <div key={img.id} className="relative group aspect-square">
                            <img
                                src={img.transformedUrl || img.previewUrl}
                                alt={`상품 이미지 ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            {img.isProcessing && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                    <div className="animate-spin w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full" />
                                </div>
                            )}
                            <button
                                onClick={() => removeImage(img.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                            >
                                ×
                            </button>
                            {img.transformedUrl && (
                                <div className="absolute bottom-1 right-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded">
                                    AI
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
