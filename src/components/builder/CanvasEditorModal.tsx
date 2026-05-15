'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import useImage from 'use-image';
import { useBuilderStore } from '@/store/useBuilderStore';
import { COLOR_PALETTES } from './ColorSelector';

// Dynamically import Konva components to avoid SSR errors
const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), { ssr: false });
const Image = dynamic(() => import('react-konva').then((mod) => mod.Image), { ssr: false });
const Text = dynamic(() => import('react-konva').then((mod) => mod.Text), { ssr: false });
const Transformer = dynamic(() => import('react-konva').then((mod) => mod.Transformer), { ssr: false });

interface TextNode {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fill: string;
    rotation: number;
    fontFamily: string;
}

interface StickerNode {
    id: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

interface CanvasEditorModalProps {
    imageId: string;
    imageUrl: string;
    onSave: (imageId: string, dataUrl: string) => void;
    onClose: () => void;
}

// Background Image Component
const BackgroundImage = ({ url, canvasWidth, canvasHeight }: { url: string; canvasWidth: number; canvasHeight: number }) => {
    const [image] = useImage(url, 'anonymous');

    if (!image) return null;

    const scale = Math.min(canvasWidth / image.width, canvasHeight / image.height);
    const x = (canvasWidth - image.width * scale) / 2;
    const y = (canvasHeight - image.height * scale) / 2;

    return (
        <Image
            image={image}
            x={x}
            y={y}
            width={image.width * scale}
            height={image.height * scale}
            listening={false}
        />
    );
};

// ... StickerImageNode ...
const StickerImageNode = ({ shapeProps, isSelected, onSelect, onChange, trRef }: any) => {
    const [image] = useImage(shapeProps.url, 'anonymous');
    const shapeRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, trRef]);

    if (!image) return null;

    return (
        <Image
            image={image}
            onClick={onSelect}
            onTap={onSelect}
            ref={shapeRef}
            {...shapeProps}
            draggable
            onDragEnd={(e) => {
                onChange({
                    ...shapeProps,
                    x: e.target.x(),
                    y: e.target.y(),
                });
            }}
            onTransformEnd={(e) => {
                const node = shapeRef.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    ...shapeProps,
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY),
                });
            }}
        />
    );
};

export function CanvasEditorModal({ imageId, imageUrl, onSave, onClose }: CanvasEditorModalProps) {
    const [texts, setTexts] = useState<TextNode[]>([]);
    const [stickers, setStickers] = useState<StickerNode[]>([]);
    const [selectedId, selectShape] = useState<string | null>(null);
    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const textNodeRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const titleFont = useBuilderStore(state => state.titleFont);
    const bodyFont = useBuilderStore(state => state.bodyFont);
    const colorPalette = useBuilderStore(state => state.colorPalette);
    const customColors = useBuilderStore(state => state.customColors);

    const activePalette = colorPalette === 'custom' && customColors 
        ? { primary: customColors.primary, secondary: customColors.secondary, text: customColors.text }
        : COLOR_PALETTES.find(p => p.value === colorPalette) || COLOR_PALETTES[0];

    const CANVAS_SIZE = 500;

    // Attach transformer to selected text
    useEffect(() => {
        if (selectedId && trRef.current && textNodeRef.current) {
            // Check if selected is a text node (sticker nodes handle their own trRef attachment)
            const isText = texts.some(t => t.id === selectedId);
            if (isText) {
                trRef.current.nodes([textNodeRef.current]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId, texts]);

    const checkDeselect = (e: any) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    const handleAddText = () => {
        const newText: TextNode = {
            id: uuidv4(),
            text: '텍스트 입력',
            x: CANVAS_SIZE / 2 - 50,
            y: CANVAS_SIZE / 2 - 20,
            fontSize: 40,
            fill: activePalette.text,
            rotation: 0,
            fontFamily: titleFont
        };
        setTexts([...texts, newText]);
        selectShape(newText.id);
    };

    const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const newSticker: StickerNode = {
                id: uuidv4(),
                url,
                x: CANVAS_SIZE / 2 - 50,
                y: CANVAS_SIZE / 2 - 50,
                width: 100,
                height: 100,
                rotation: 0
            };
            setStickers([...stickers, newSticker]);
            selectShape(newSticker.id);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = () => {
        if (selectedId) {
            if (texts.some(t => t.id === selectedId)) {
                setTexts(texts.filter(t => t.id !== selectedId));
            } else if (stickers.some(s => s.id === selectedId)) {
                setStickers(stickers.filter(s => s.id !== selectedId));
            }
            selectShape(null);
        }
    };

    const handleSave = () => {
        if (stageRef.current) {
            selectShape(null); // deselect before saving so transformer isn't visible
            setTimeout(() => {
                const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
                onSave(imageId, dataUrl);
            }, 100);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-slate-50 w-[900px] h-[700px] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl border border-gray-200">
                {/* Left: Canvas Area */}
                <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center relative p-8">
                    <div className="bg-checkered rounded overflow-hidden shadow-lg border border-gray-800" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
                        <Stage
                            width={CANVAS_SIZE}
                            height={CANVAS_SIZE}
                            onMouseDown={checkDeselect}
                            onTouchStart={checkDeselect}
                            ref={stageRef}
                        >
                            <Layer>
                                <BackgroundImage url={imageUrl} canvasWidth={CANVAS_SIZE} canvasHeight={CANVAS_SIZE} />
                                {texts.map((text, i) => (
                                    <Text
                                        key={text.id}
                                        id={text.id}
                                        text={text.text}
                                        x={text.x}
                                        y={text.y}
                                        fontSize={text.fontSize}
                                        fill={text.fill}
                                        rotation={text.rotation}
                                        fontFamily={text.fontFamily}
                                        draggable
                                        onClick={() => selectShape(text.id)}
                                        onTap={() => selectShape(text.id)}
                                        ref={selectedId === text.id ? textNodeRef : null}
                                        onDragEnd={(e) => {
                                            const items = texts.slice();
                                            const item = items.find((i) => i.id === text.id);
                                            if (item) {
                                                item.x = e.target.x();
                                                item.y = e.target.y();
                                                setTexts(items);
                                            }
                                        }}
                                        onTransformEnd={(e) => {
                                            const node = textNodeRef.current;
                                            const scaleX = node.scaleX();
                                            node.scaleX(1);
                                            node.scaleY(1);
                                            
                                            const items = texts.slice();
                                            const item = items.find((i) => i.id === text.id);
                                            if (item) {
                                                item.x = node.x();
                                                item.y = node.y();
                                                item.rotation = node.rotation();
                                                item.fontSize = Math.max(10, item.fontSize * scaleX);
                                                setTexts(items);
                                            }
                                        }}
                                        fontStyle="bold"
                                        shadowColor="rgba(0,0,0,0.5)"
                                        shadowBlur={4}
                                        shadowOffsetX={2}
                                        shadowOffsetY={2}
                                    />
                                ))}
                                {stickers.map((sticker) => (
                                    <StickerImageNode
                                        key={sticker.id}
                                        shapeProps={sticker}
                                        isSelected={sticker.id === selectedId}
                                        onSelect={() => selectShape(sticker.id)}
                                        onChange={(newAttrs: any) => {
                                            const newStickers = stickers.map(s => s.id === sticker.id ? newAttrs : s);
                                            setStickers(newStickers);
                                        }}
                                        trRef={trRef}
                                    />
                                ))}
                                {selectedId && (
                                    <Transformer
                                        ref={trRef}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (newBox.width < 10 || newBox.height < 10) return oldBox;
                                            return newBox;
                                        }}
                                        keepRatio={true}
                                        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                    />
                                )}
                            </Layer>
                        </Stage>
                    </div>
                </div>

                {/* Right: Controls Area */}
                <div className="w-[300px] bg-white p-6 flex flex-col border-l border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">🎨 캔버스 에디터</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl leading-none">×</button>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto">
                        {/* Tools */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-500">도구</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleAddText} className="bg-white border text-gray-700 hover:bg-gray-200 border border-gray-300 text-gray-900 rounded-lg py-3 flex flex-col items-center justify-center gap-1 transition-colors">
                                    <span className="text-xl">T</span>
                                    <span className="text-xs font-bold">텍스트 추가</span>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="bg-white border text-gray-700 hover:bg-gray-200 border border-gray-300 text-gray-900 rounded-lg py-3 flex flex-col items-center justify-center gap-1 transition-colors">
                                    <span className="text-xl">🖼️</span>
                                    <span className="text-xs font-bold">이미지 추가</span>
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleStickerUpload} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                <button onClick={handleDelete} disabled={!selectedId} className={`rounded-lg py-3 col-span-2 flex flex-col items-center justify-center gap-1 transition-colors border ${selectedId ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white text-gray-600 border-gray-200 cursor-not-allowed'}`}>
                                    <span className="text-sm">🗑️ 선택요소 삭제</span>
                                </button>
                            </div>
                        </div>

                        {/* Selected Element Properties */}
                        {selectedId && texts.some(t => t.id === selectedId) && (
                            <div className="space-y-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-blue-400">텍스트 속성 편집</h4>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">내용</label>
                                    <input 
                                        type="text" 
                                        value={texts.find(t => t.id === selectedId)?.text || ''}
                                        onChange={(e) => {
                                            const newTexts = texts.map(t => t.id === selectedId ? { ...t, text: e.target.value } : t);
                                            setTexts(newTexts);
                                        }}
                                        className="w-full bg-slate-50 border border-gray-200 rounded p-2 text-gray-900 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">글자 색상</label>
                                        <input 
                                            type="color" 
                                            value={texts.find(t => t.id === selectedId)?.fill || '#ffffff'}
                                            onChange={(e) => {
                                                const newTexts = texts.map(t => t.id === selectedId ? { ...t, fill: e.target.value } : t);
                                                setTexts(newTexts);
                                            }}
                                            className="w-full h-8 cursor-pointer rounded bg-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">크기 (픽셀)</label>
                                        <input 
                                            type="number" 
                                            value={Math.round(texts.find(t => t.id === selectedId)?.fontSize || 40)}
                                            onChange={(e) => {
                                                const newTexts = texts.map(t => t.id === selectedId ? { ...t, fontSize: Number(e.target.value) } : t);
                                                setTexts(newTexts);
                                            }}
                                            className="w-full bg-slate-50 border border-gray-200 rounded p-1.5 text-gray-900 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {!selectedId && (
                            <div className="pt-8 text-center text-gray-500 text-sm">
                                <p>요소를 클릭하면 속성을 편집할 수 있습니다.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 space-y-2 mt-auto">
                        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
                            저장 후 닫기
                        </button>
                        <button onClick={onClose} className="w-full bg-white border text-gray-700 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-lg transition-colors">
                            취소
                        </button>
                    </div>
                </div>
            </div>
            {/* Checkerboard Pattern for Canvas Background */}
            <style>{`
                .bg-checkered {
                    background-image: linear-gradient(45deg, #1f2937 25%, transparent 25%), 
                                      linear-gradient(-45deg, #1f2937 25%, transparent 25%), 
                                      linear-gradient(45deg, transparent 75%, #1f2937 75%), 
                                      linear-gradient(-45deg, transparent 75%, #1f2937 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                    background-color: #111827;
                }
            `}</style>
        </div>
    );
}
