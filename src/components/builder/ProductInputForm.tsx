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
            <h3 className="text-lg font-semibold text-gray-100">상품 정보 입력</h3>

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

                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="원산지"
                        value={productData.origin}
                        onChange={(v) => updateField('origin', v)}
                        placeholder="예: 경북 성주"
                    />
                    <InputField
                        label="농부/생산자명"
                        value={productData.farmerName}
                        onChange={(v) => updateField('farmerName', v)}
                        placeholder="예: 김성주 농부"
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <InputField
                        label="가격"
                        value={productData.price}
                        onChange={(v) => updateField('price', v)}
                        placeholder="예: 29,900원"
                    />
                    <InputField
                        label="당도 (Brix)"
                        value={productData.sweetness}
                        onChange={(v) => updateField('sweetness', v)}
                        placeholder="예: 14~16"
                    />
                    <InputField
                        label="사이즈"
                        value={productData.size}
                        onChange={(v) => updateField('size', v)}
                        placeholder="예: 특대/10과"
                    />
                </div>

                <TextareaField
                    label="보관법"
                    value={productData.storageMethod}
                    onChange={(v) => updateField('storageMethod', v)}
                    placeholder="예: 냉장보관 시 7일간 신선하게 보관 가능"
                    rows={2}
                />

                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="CS 전화번호"
                        value={productData.csPhone}
                        onChange={(v) => updateField('csPhone', v)}
                        placeholder="예: 1588-0000"
                    />
                    <InputField
                        label="CS 이메일"
                        value={productData.csEmail}
                        onChange={(v) => updateField('csEmail', v)}
                        placeholder="예: cs@example.com"
                    />
                </div>

                <InputField
                    label="이벤트 문구 (선택)"
                    value={productData.eventText || ''}
                    onChange={(v) => updateField('eventText', v)}
                    placeholder="예: 첫 구매 20% 할인!"
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
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
            <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
            />
        </div>
    );
}
