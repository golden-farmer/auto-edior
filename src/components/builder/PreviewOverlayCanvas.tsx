'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useImage from 'use-image';
import { useBuilderStore } from '@/store/useBuilderStore';
import { OverlayNode, TextLayerNode, StickerLayerNode } from '@/types';
import { COLOR_PALETTES } from './ColorSelector';

// Dynamically import Konva to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), { ssr: false });
const Image = dynamic(() => import('react-konva').then((mod) => mod.Image), { ssr: false });
const Text = dynamic(() => import('react-konva').then((mod) => mod.Text), { ssr: false });
const Transformer = dynamic(() => import('react-konva').then((mod) => mod.Transformer), { ssr: false });
const Line = dynamic(() => import('react-konva').then((mod) => mod.Line), { ssr: false });

const GUIDELINE_OFFSET = 5;

// Sticker Image Node Component
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

interface PreviewOverlayCanvasProps {
    width: number;
    height: number;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
}

export function PreviewOverlayCanvas({ width, height, selectedId, setSelectedId }: PreviewOverlayCanvasProps) {
    const { isCanvasMode, overlayNodes, updateOverlayNode } = useBuilderStore();
    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const textNodeRef = useRef<any>(null);

    const [guides, setGuides] = useState<{ type: 'horizontal' | 'vertical', position: number }[]>([]);

    // Attach transformer to selected text node
    useEffect(() => {
        if (selectedId && trRef.current && textNodeRef.current) {
            const isText = overlayNodes.some(n => n.id === selectedId && n.type === 'text');
            if (isText) {
                trRef.current.nodes([textNodeRef.current]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId, overlayNodes]);

    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    // Snapping Logic
    const getLineGuideStops = (skipId: string) => {
        const vertical = [0, width / 2, width];
        const horizontal = [0, height / 2, height];

        overlayNodes.forEach((node) => {
            if (node.id === skipId) return;
            // Provide center and edges of other nodes
            const hw = (node.width || 100) / 2;
            const hh = (node.height || 40) / 2;
            vertical.push(node.x, node.x + hw, node.x + hw * 2);
            horizontal.push(node.y, node.y + hh, node.y + hh * 2);
        });

        return { vertical, horizontal };
    };

    const getObjectSnappingEdges = (node: any) => {
        const box = node.getClientRect();
        return {
            vertical: [
                { guide: Math.round(box.x), offset: Math.round(node.x() - box.x), snap: 'start' },
                { guide: Math.round(box.x + box.width / 2), offset: Math.round(node.x() - box.x - box.width / 2), snap: 'center' },
                { guide: Math.round(box.x + box.width), offset: Math.round(node.x() - box.x - box.width), snap: 'end' },
            ],
            horizontal: [
                { guide: Math.round(box.y), offset: Math.round(node.y() - box.y), snap: 'start' },
                { guide: Math.round(box.y + box.height / 2), offset: Math.round(node.y() - box.y - box.height / 2), snap: 'center' },
                { guide: Math.round(box.y + box.height), offset: Math.round(node.y() - box.y - box.height), snap: 'end' },
            ],
        };
    };

    const getGuides = (lineGuideStops: any, itemBounds: any) => {
        const resultV: any[] = [];
        const resultH: any[] = [];

        lineGuideStops.vertical.forEach((lineGuide: number) => {
            itemBounds.vertical.forEach((itemBound: any) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < GUIDELINE_OFFSET) {
                    resultV.push({
                        lineGuide: lineGuide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                    });
                }
            });
        });

        lineGuideStops.horizontal.forEach((lineGuide: number) => {
            itemBounds.horizontal.forEach((itemBound: any) => {
                const diff = Math.abs(lineGuide - itemBound.guide);
                if (diff < GUIDELINE_OFFSET) {
                    resultH.push({
                        lineGuide: lineGuide,
                        diff: diff,
                        snap: itemBound.snap,
                        offset: itemBound.offset,
                    });
                }
            });
        });

        const guides = [];
        // Find closest snap
        const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
        const minH = resultH.sort((a, b) => a.diff - b.diff)[0];

        if (minV) guides.push({ lineGuide: minV.lineGuide, offset: minV.offset, orientation: 'V' });
        if (minH) guides.push({ lineGuide: minH.lineGuide, offset: minH.offset, orientation: 'H' });

        return guides;
    };

    const handleDragMove = (e: any) => {
        const layer = e.target.getLayer();
        const node = e.target;
        const lineGuideStops = getLineGuideStops(node.id());
        const itemBounds = getObjectSnappingEdges(node);
        const snappingGuides = getGuides(lineGuideStops, itemBounds);

        let absPos = node.absolutePosition();
        const newGuides: { type: 'horizontal' | 'vertical', position: number }[] = [];

        snappingGuides.forEach((guide) => {
            if (guide.orientation === 'V') {
                absPos.x = guide.lineGuide + guide.offset;
                newGuides.push({ type: 'vertical', position: guide.lineGuide });
            } else if (guide.orientation === 'H') {
                absPos.y = guide.lineGuide + guide.offset;
                newGuides.push({ type: 'horizontal', position: guide.lineGuide });
            }
        });

        node.absolutePosition(absPos);
        setGuides(newGuides);
    };

    const handleDragEnd = (e: any) => {
        setGuides([]);
        updateOverlayNode(e.target.id(), {
            x: e.target.x(),
            y: e.target.y(),
        });
    };

    return (
        <div className="preview-overlay-canvas" style={{ position: 'absolute', top: 0, left: 0, width, height, pointerEvents: isCanvasMode ? 'auto' : 'none', zIndex: 40 }}>
            <Stage
                width={width}
                height={height}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                ref={stageRef}
            >
                <Layer>
                    {overlayNodes.map((node) => {
                        if (node.type === 'text') {
                            const textNode = node as TextLayerNode;
                            return (
                                <Text
                                    key={textNode.id}
                                    id={textNode.id}
                                    text={textNode.text}
                                    x={textNode.x}
                                    y={textNode.y}
                                    fontSize={textNode.fontSize}
                                    fill={textNode.fill}
                                    rotation={textNode.rotation}
                                    fontFamily={textNode.fontFamily}
                                    draggable={isCanvasMode}
                                    onClick={() => setSelectedId(textNode.id)}
                                    onTap={() => setSelectedId(textNode.id)}
                                    ref={selectedId === textNode.id ? textNodeRef : null}
                                    onDragMove={handleDragMove}
                                    onDragEnd={handleDragEnd}
                                    onTransformEnd={(e) => {
                                        const nodeObj = textNodeRef.current;
                                        const scaleX = nodeObj.scaleX();
                                        nodeObj.scaleX(1);
                                        nodeObj.scaleY(1);

                                        updateOverlayNode(textNode.id, {
                                            x: nodeObj.x(),
                                            y: nodeObj.y(),
                                            rotation: nodeObj.rotation(),
                                            fontSize: Math.max(10, textNode.fontSize * scaleX),
                                        });
                                    }}
                                    fontStyle="bold"
                                    shadowColor="rgba(0,0,0,0.5)"
                                    shadowBlur={4}
                                    shadowOffsetX={2}
                                    shadowOffsetY={2}
                                />
                            );
                        } else if (node.type === 'image') {
                            const stickerNode = node as StickerLayerNode;
                            return (
                                <StickerImageNode
                                    key={stickerNode.id}
                                    shapeProps={stickerNode}
                                    isSelected={stickerNode.id === selectedId}
                                    onSelect={() => setSelectedId(stickerNode.id)}
                                    onChange={(newAttrs: any) => {
                                        updateOverlayNode(stickerNode.id, newAttrs);
                                    }}
                                    trRef={trRef}
                                />
                            );
                        }
                        return null;
                    })}

                    {isCanvasMode && selectedId && (
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

                    {/* Snap Guide Lines */}
                    {guides.map((guide, i) => {
                        if (guide.type === 'vertical') {
                            return (
                                <Line
                                    key={i}
                                    points={[guide.position, 0, guide.position, height]}
                                    stroke="rgb(16, 185, 129)"
                                    strokeWidth={1}
                                    dash={[4, 4]}
                                />
                            );
                        } else {
                            return (
                                <Line
                                    key={i}
                                    points={[0, guide.position, width, guide.position]}
                                    stroke="rgb(16, 185, 129)"
                                    strokeWidth={1}
                                    dash={[4, 4]}
                                />
                            );
                        }
                    })}
                </Layer>
            </Stage>
        </div>
    );
}
