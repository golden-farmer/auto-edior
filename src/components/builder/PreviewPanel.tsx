'use client';

import React, { useRef } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { ModuleRenderer } from '@/components/modules';
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

export function PreviewPanel() {
    const { state, dispatch } = useBuilder();
    const previewRef = useRef<HTMLDivElement>(null);

    const activeModules = state.modules
        .filter(m => m.isActive)
        .sort((a, b) => a.order - b.order);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = activeModules.findIndex((m) => m.id === active.id);
            const newIndex = activeModules.findIndex((m) => m.id === over.id);

            const activeOrders = activeModules.map(m => m.order);
            activeOrders.sort((a, b) => a - b);

            const reorderedActiveModules = arrayMove(activeModules, oldIndex, newIndex);

            const updates = new Map<string, number>();
            reorderedActiveModules.forEach((m, index) => {
                updates.set(m.id, activeOrders[index]);
            });

            const newModules = state.modules.map(m => {
                if (updates.has(m.id)) {
                    return { ...m, order: updates.get(m.id)! };
                }
                return m;
            });

            dispatch({ type: 'REORDER_MODULES', payload: newModules });
        }
    };

    const updateModuleData = (id: string, data: Record<string, unknown>) => {
        dispatch({ type: 'UPDATE_MODULE_DATA', payload: { id, data } });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100">미리보기</h2>
                <span className="text-sm text-gray-400">
                    {activeModules.length}개 모듈 활성화
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-900/50">
                <div
                    ref={previewRef}
                    className="mx-auto bg-white shadow-2xl overflow-hidden"
                    style={{ width: 430, maxWidth: '100%' }}
                    id="preview-container"
                >
                    {activeModules.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={activeModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                                {activeModules.map((module) => (
                                    <SortablePreviewItem
                                        key={module.id}
                                        module={module}
                                        productData={state.productData}
                                        images={state.images}
                                        onUpdateData={(data) => updateModuleData(module.id, data)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            <div className="text-4xl mb-4">📄</div>
                            <p>활성화된 모듈이 없습니다.</p>
                            <p className="text-sm mt-2">좌측 패널에서 모듈을 활성화해주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SortablePreviewItem({
    module,
    productData,
    images,
    onUpdateData
}: {
    module: any;
    productData: any;
    images: any[];
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
        position: 'relative' as const,
    };

    // Modules that support image swapping (for valid check)
    const hasImageSelection = [
        'hero-image',
        'benefit-point-1', 'benefit-point-2', 'benefit-point-3',
        'comparison-table',
        'packaging-info',
        'farmer-story',
        'sweetness-check',
        'size-guide'
    ].includes(module.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`module-item relative group/preview cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-80 shadow-2xl scale-[1.02]' : ''}`}
            data-module-id={module.id}
        >
            <ModuleRenderer
                module={module}
                productData={productData}
                images={images}
                onUpdateData={onUpdateData}
            />

            {/* Image Swap Overlay (Centered Top) */}
            {hasImageSelection && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/preview:opacity-100 transition-opacity z-30">
                    <select
                        value={(module.data.imageIndex as number) ?? ''}
                        onChange={(e) => {
                            e.stopPropagation();
                            onUpdateData({ imageIndex: e.target.value === '' ? undefined : Number(e.target.value) });
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="bg-black/70 text-white text-xs px-2 py-1.5 rounded-full border border-white/30 backdrop-blur-sm outline-none hover:bg-black/90 cursor-pointer shadow-lg text-center appearance-none"
                    >
                        <option value="">🖼️ 변경</option>
                        {images.map((img: any, idx: number) => (
                            <option key={img.id} value={idx}>
                                📸 이미지 {idx + 1}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
