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
import { ModuleConfig, ImageUpload } from '@/types';

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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = modules.findIndex((m) => m.id === active.id);
            const newIndex = modules.findIndex((m) => m.id === over.id);
            const newModules = arrayMove(modules, oldIndex, newIndex).map((m, i) => ({
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
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-100">상세페이지 구성</h3>
                <select
                    onChange={(e) => updateAllVariants(e.target.value)}
                    className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 outline-none hover:border-emerald-500 transition-colors"
                >
                    <option value="">일괄 변경...</option>
                    <option value="A">Type A (Standard)</option>
                    <option value="B">Type B (Bold)</option>
                    <option value="C">Type C (Minimal)</option>
                    <option value="D">Type D (Soft)</option>
                    <option value="E">Type E (Trust)</option>
                    <option value="F">Type F (Natural)</option>
                    <option value="G">Type G (Pop)</option>
                    <option value="H">Type H (Luxury)</option>
                    <option value="I">Type I (Grid)</option>
                    <option value="J">Type J (Seasonal)</option>
                </select>
            </div>
            <p className="text-sm text-gray-400">드래그하여 순서를 변경하고, 화살표를 눌러 내용을 수정하세요</p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {modules.map((module) => (
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

    const [isExpanded, setIsExpanded] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const categoryColor = CATEGORY_COLORS[module.category];

    // Modules that support editing
    const hasEditableFields = ['hooking-banner', 'benefit-point-1', 'benefit-point-2', 'benefit-point-3', 'summary-card'].includes(module.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-lg border transition-all duration-200
        ${module.isActive ? categoryColor : 'bg-gray-800/50 border-gray-700 text-gray-500'}
        ${isDragging ? 'opacity-50 scale-105 shadow-xl' : 'opacity-100'}
      `}
        >
            <div className="flex items-center gap-3 p-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>

                <button
                    onClick={onToggle}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
            ${module.isActive
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-500 hover:border-gray-400'
                        }
            `}
                >
                    {module.isActive && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                <div className="flex-1">
                    <span className="font-medium">{module.nameKo}</span>
                    <span className="ml-2 text-xs opacity-60">({module.name})</span>
                </div>

                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 capitalize mr-2">
                    {module.category}
                </span>

                {hasEditableFields && module.isActive && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Edit Form */}
            {isExpanded && module.isActive && hasEditableFields && (
                <div className="p-3 border-t border-white/10 bg-black/20 space-y-3">
                    <ModuleEditForm module={module} images={images} onUpdate={onUpdateData} />
                </div>
            )}
        </div>
    );
}

function ModuleEditForm({
    module,
    images,
    onUpdate
}: {
    module: ModuleConfig;
    images: ImageUpload[];
    onUpdate: (data: Record<string, unknown>) => void;
}) {
    const handleChange = (key: string, value: string | number) => {
        onUpdate({ [key]: value });
    };

    return (
        <>
            {/* Hooking Banner Specifics */}
            {module.type === 'hooking-banner' && (
                <>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">메인 카피</label>
                        <input
                            type="text"
                            value={(module.data.mainCopy as string) || ''}
                            onChange={(e) => handleChange('mainCopy', e.target.value)}
                            placeholder="예: 신선한 과일"
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">서브 카피</label>
                        <input
                            type="text"
                            value={(module.data.subCopy as string) || ''}
                            onChange={(e) => handleChange('subCopy', e.target.value)}
                            placeholder="예: 산지직송 직배송"
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-emerald-500 outline-none"
                        />
                    </div>
                </>
            )}

            {/* Benefit Points Specifics */}
            {module.category === 'benefits' && (
                <>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">소구점 제목</label>
                        <input
                            type="text"
                            value={(module.data.title as string) || ''}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">상세 설명</label>
                        <textarea
                            value={(module.data.description as string) || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="설명을 입력하세요"
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 focus:border-emerald-500 outline-none resize-none"
                        />
                    </div>
                </>
            )}

            {module.type === 'summary-card' && (
                <div className="text-xs text-gray-500">편집 가능한 항목이 없습니다 (자동 연동)</div>
            )}
        </>
    );
}
