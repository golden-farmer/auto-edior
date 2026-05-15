'use client';

import React from 'react';
import { TextStyleControls, useSelectedTextStyleInfo } from './TextStyleControls';

export function TextStylePanel() {
    const { selectedTextTarget } = useSelectedTextStyleInfo();

    return (
        <div className="space-y-4">
            <div className="border-b border-gray-200 bg-white p-3">
                <h2 className="text-sm font-semibold text-gray-700">텍스트 개별 스타일</h2>
            </div>

            <div className="space-y-4 p-4">
                {selectedTextTarget ? (
                    <>
                        <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                선택한 텍스트
                            </p>
                            <p className="line-clamp-3 break-keep text-sm font-medium text-gray-900">
                                {selectedTextTarget.textValue || '(빈 텍스트)'}
                            </p>
                        </div>
                        <TextStyleControls />
                    </>
                ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-4 text-sm text-gray-500">
                        미리보기에서 텍스트를 클릭하면 바로 색상, 크기, 굵기, 정렬, 자간, 줄간격을 조절할 수 있습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
