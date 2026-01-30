'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { ModuleRenderer } from '@/components/modules';
import { COLOR_PALETTES } from './ColorSelector';
import { TEXT_SCALE_VALUES } from '@/types';
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
    const [zoom, setZoom] = useState(1.0);
    const ZOOM_STEP = 0.1;
    const MIN_ZOOM = 0.3;
    const MAX_ZOOM = 2.0;

    const activeModules = state.modules
        .filter(m => m.isActive)
        .sort((a, b) => a.order - b.order);

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

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
        }
    };

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
        <div className="h-full flex flex-col relative group/preview-area" onWheel={handleWheel}>
            <div className="flex-1 overflow-auto p-8 flex flex-col items-center bg-gray-950/80 custom-scrollbar">
                <div
                    ref={previewRef}
                    className="bg-white shadow-2xl origin-top transition-transform duration-200 ease-out mb-20"
                    style={{
                        width: 430,
                        maxWidth: '100%',
                        transform: `scale(${zoom})`,
                    }}
                    id="preview-container"
                >
                    {/* Inject scoped CSS */}
                    <style>{`
                        #preview-container {
                            --font-title: '${state.titleFont}', sans-serif;
                            --font-body: '${state.bodyFont}', sans-serif;
                            --text-scale: ${TEXT_SCALE_VALUES[state.textScale]};
                            --color-primary: ${COLOR_PALETTES.find(p => p.value === state.colorPalette)?.primary || '#2E7D32'};
                            --color-secondary: ${COLOR_PALETTES.find(p => p.value === state.colorPalette)?.secondary || '#E8F5E9'};
                            --color-text: ${COLOR_PALETTES.find(p => p.value === state.colorPalette)?.text || '#1B5E20'};
                        }
                        #preview-container h1, #preview-container h2, #preview-container h3, 
                        #preview-container h4, #preview-container h5, #preview-container h6 {
                            font-family: var(--font-title) !important;
                        }
                        #preview-container p, #preview-container span, #preview-container div,
                        #preview-container li, #preview-container label, #preview-container td {
                            font-family: var(--font-body);
                        }
                        #preview-container .bg-primary { background-color: var(--color-primary) !important; }
                        #preview-container .bg-secondary { background-color: var(--color-secondary) !important; }
                        #preview-container .text-primary { color: var(--color-primary) !important; }
                        #preview-container .text-secondary { color: var(--color-secondary) !important; }
                        #preview-container .text-main { color: var(--color-text) !important; }
                        #preview-container .border-primary { border-color: var(--color-primary) !important; }
                        #preview-container .border-secondary { border-color: var(--color-secondary) !important; }
                        #preview-container h1 { font-size: calc(2rem * var(--text-scale)) !important; }
                        #preview-container h2 { font-size: calc(1.5rem * var(--text-scale)) !important; }
                        #preview-container h3 { font-size: calc(1.25rem * var(--text-scale)) !important; }
                        #preview-container h4 { font-size: calc(1.125rem * var(--text-scale)) !important; }
                        #preview-container p, #preview-container span, #preview-container div {
                            font-size: calc(1rem * var(--text-scale));
                        }
                        #preview-container .text-xs { font-size: calc(0.75rem * var(--text-scale)) !important; }
                        #preview-container .text-sm { font-size: calc(0.875rem * var(--text-scale)) !important; }
                        #preview-container .text-base { font-size: calc(1rem * var(--text-scale)) !important; }
                        #preview-container .text-lg { font-size: calc(1.125rem * var(--text-scale)) !important; }
                        #preview-container .text-xl { font-size: calc(1.25rem * var(--text-scale)) !important; }
                        #preview-container .text-2xl { font-size: calc(1.5rem * var(--text-scale)) !important; }
                        #preview-container .text-3xl { font-size: calc(1.875rem * var(--text-scale)) !important; }
                        #preview-container .text-4xl { font-size: calc(2.25rem * var(--text-scale)) !important; }
                    `}</style>
                    {activeModules.length > 0 ? (
                        <DndContext id="dnd-preview-panel" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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

            {/* Floating Zoom Control */}
            <div className="absolute bottom-24 right-8 z-[60] flex flex-col items-center gap-4 bg-gray-800/90 backdrop-blur-md p-4 rounded-full border border-gray-700 shadow-2xl opacity-0 hover:opacity-100 group-hover/preview-area:opacity-100 transition-opacity">
                <button
                    onClick={() => setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP))}
                    className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-emerald-600 rounded-full transition-colors font-bold"
                >
                    +
                </button>
                <div className="h-40 flex flex-col items-center relative py-2">
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="appearance-none bg-gray-600 h-1 rounded-lg outline-none cursor-pointer w-40 -rotate-90 origin-center absolute top-1/2 -translate-y-1/2"
                        style={{
                            accentColor: '#10b981'
                        }}
                    />
                </div>
                <button
                    onClick={() => setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP))}
                    className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-emerald-600 rounded-full transition-colors font-bold"
                >
                    -
                </button>
                <div className="text-[10px] font-bold text-emerald-400 mt-1">
                    {Math.round(zoom * 100)}%
                </div>
                <button
                    onClick={() => setZoom(1.0)}
                    className="text-[9px] text-gray-400 hover:text-white uppercase font-bold mt-1"
                >
                    Reset
                </button>
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
            className={`module-item relative group/preview ${isDragging ? 'opacity-80 shadow-2xl scale-[1.02] z-50' : 'hover:ring-2 hover:ring-emerald-500/50'} !touch-action-auto`}
            data-module-id={module.id}
        >
            <div
                {...listeners}
                {...attributes}
                className="no-capture absolute top-2 right-2 p-2 bg-black/50 hover:bg-emerald-600 text-white rounded cursor-grab active:cursor-grabbing opacity-0 group-hover/preview:opacity-100 transition-opacity z-50 backdrop-blur-sm"
                title="이동하려면 드래그하세요"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>

            <ModuleRenderer
                module={module}
                productData={productData}
                images={images}
                onUpdateData={onUpdateData}
            />

            {hasImageSelection && (
                <div className="no-capture absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/preview:opacity-100 transition-opacity z-30">
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
