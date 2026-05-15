'use client';

import React from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { ProductData } from '@/types';

export function ProductInputForm() {
    const { state, dispatch } = useBuilder();
    const { productData } = state;

    const updateField = (field: keyof ProductData, value: string) => {
        dispatch({ type: 'SET_PRODUCT_DATA', payload: { [field]: value } });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                <InputField
                    label="상품명"
                    value={productData.productName}
                    onChange={(v) => updateField('productName', v)}
                    placeholder="예: 성주 꿀참외 3kg"
                />

                <TextareaField
                    label="상품 설명"
                    value={productData.productDescription}
                    onChange={(v) => updateField('productDescription', v)}
                    placeholder="상품에 대한 자세한 설명을 입력해주세요"
                    rows={3}
                />

                <InputField
                    label="CS 전화번호"
                    value={productData.csPhone}
                    onChange={(v) => updateField('csPhone', v)}
                    placeholder="예: 1588-0000"
                />
            </div>
        </div>
    );
}

function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = 'text'
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
        </div>
    );
}

function TextareaField({
    label,
    value,
    onChange,
    placeholder,
    rows = 3
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
        </div>
    );
}
