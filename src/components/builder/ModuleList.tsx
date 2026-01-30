'use client';

import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder } from '@/context/BuilderContext';
import { ModuleConfig, ImageUpload, TextScale } from '@/types';
import { FontSelector } from './FontSelector';
import { ColorSelector } from './ColorSelector';
import { TextScaleToggle } from './TextScaleToggle';

const CATEGORY_COLORS = {
    intro: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    trust: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    benefits: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    detail: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
    service: 'bg-pink-500/20 border-pink-500/50 text-pink-300',
    closing: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
};

export function ModuleList() {
    const { state, dispatch } = useBuilder();
    const { modules, images } = state;

    // Sort modules by order for display
    const sortedModules = [...modules].sort((a, b) => a.order - b.order);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = sortedModules.findIndex((m) => m.id === active.id);
            const newIndex = sortedModules.findIndex((m) => m.id === over.id);
            const newModules = arrayMove(sortedModules, oldIndex, newIndex).map((m, i) => ({
                ...m,
                order: i,
            }));
            dispatch({ type: 'REORDER_MODULES', payload: newModules });
        }
    };

    const toggleModule = (id: string) => {
        dispatch({ type: 'TOGGLE_MODULE', payload: id });
    };

    const updateModuleData = (id: string, data: Record<string, unknown>) => {
        dispatch({ type: 'UPDATE_MODULE_DATA', payload: { id, data } });
    };

    const updateAllVariants = (variant: string) => {
        if (!variant) return;
        dispatch({ type: 'UPDATE_ALL_VARIANTS', payload: variant as any });
    };

    return (
        <div className="space-y-4">
            <FontSelector />
            <ColorSelector />

            <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">상세 구성 모듈</h3>
                <select
                    defaultValue="A"
                    onChange={(e) => updateAllVariants(e.target.value)}
                    className="bg-gray-800 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-700 outline-none hover:border-emerald-500 transition-colors uppercase font-bold"
                >
                    <option value="A">Style A (Default)</option>
                    <option value="B">Style B</option>
                    <option value="C">Style C</option>
                    <option value="D">Style D</option>
                    <option value="E">Style E</option>
                </select>
            </div>

            <DndContext id="dnd-module-list" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                        {sortedModules.map((module) => (
                            <SortableModuleItem
                                key={module.id}
                                module={module}
                                images={images}
                                onToggle={() => toggleModule(module.id)}
                                onUpdateData={(data) => updateModuleData(module.id, data)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

function SortableModuleItem({
    module,
    images,
    onToggle,
    onUpdateData
}: {
    module: ModuleConfig;
    images: ImageUpload[];
    onToggle: () => void;
    onUpdateData: (data: Record<string, unknown>) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const categoryColor = CATEGORY_COLORS[module.category as keyof typeof CATEGORY_COLORS];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded border transition-all duration-200 overflow-hidden
        ${module.isActive ? categoryColor : 'bg-gray-900 border-gray-800 text-gray-600'}
        ${isDragging ? 'opacity-50 scale-105 shadow-xl' : 'opacity-100'}
      `}
        >
            <div className="flex items-center gap-2 px-3 py-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-300"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>

                <button
                    onClick={onToggle}
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all
                    ${module.isActive
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-700 hover:border-gray-600'
                        }
                    `}
                >
                    {module.isActive && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold truncate block">{module.nameKo}</span>
                </div>

                {module.isActive && module.type === 'review-summary' && (
                    <div className="flex bg-black/20 p-0.5 rounded border border-white/5 mr-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdateData({ layoutMode: 'horizontal' }); }}
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${(module.data.layoutMode as string) !== 'vertical'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >가로</button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onUpdateData({ layoutMode: 'vertical' }); }}
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-sm transition-all ${(module.data.layoutMode as string) === 'vertical'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >세로</button>
                    </div>
                )}

                {module.isActive && module.type === 'comparison-table' && (
                    <div className="flex items-center gap-1 mr-1">
                        <select
                            value={(module.data.rowCount as number) || 3}
                            onChange={(e) => { e.stopPropagation(); onUpdateData({ rowCount: parseInt(e.target.value) }); }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="bg-black/20 text-emerald-400 text-[10px] font-bold px-1 py-0.5 rounded border border-white/5 outline-none"
                        >
                            {[2, 3, 4, 5].map(v => <option key={v} value={v}>{v}줄</option>)}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
