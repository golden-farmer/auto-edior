'use client';

import React from 'react';
import { ColorSelector } from './ColorSelector';
import { useBuilderStore } from '@/store/useBuilderStore';

export function ToneAndMoodPanel() {
    return (
        <div className="space-y-4">
            <div className="p-3 border-b border-gray-200 bg-white">
                <h2 className="text-sm font-semibold text-gray-700">🎨 톤앤무드</h2>
            </div>
            <div className="p-4 space-y-4">
                <ColorSelector />
            </div>
        </div>
    );
}
