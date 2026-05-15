'use client';

import React from 'react';
import { TextScale, TEXT_SCALE_VALUES } from '@/types';

interface TextScaleToggleProps {
    value: TextScale;
    onChange: (scale: TextScale) => void;
    className?: string;
}

export function TextScaleToggle({ value, onChange, className = '' }: TextScaleToggleProps) {
    const scales: { key: TextScale; label: string }[] = [
        { key: 'small', label: '작게' },
        { key: 'normal', label: '보통' },
        { key: 'large', label: '크게' },
    ];

    return (
        <div className={`flex gap-1 ${className}`}>
            {scales.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all
                        ${value === key
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-white border text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {label}
                    <span className="ml-1 text-[10px] opacity-70">
                        {TEXT_SCALE_VALUES[key]}x
                    </span>
                </button>
            ))}
        </div>
    );
}
