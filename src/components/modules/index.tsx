'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { ModuleConfig, ProductData, ImageUpload } from '@/types';

// Module renderer that displays the appropriate module based on type
// Updated to accept onUpdateData
export function ModuleRenderer({
    module,
    productData,
    images,
    onUpdateData,
}: {
    module: ModuleConfig;
    productData: ProductData;
    images: ImageUpload[];
    onUpdateData?: (data: Record<string, unknown>) => void;
}) {
    // We pass onUpdateData to commonProps so specific modules can use it
    const commonProps = { productData, images, data: module.data, variant: module.variant, onUpdateData };

    switch (module.type) {
        case 'hooking-banner': return <HookingBanner {...commonProps} />;
        case 'hero-image': return <HeroImage {...commonProps} />;
        case 'summary-card': return <SummaryCard {...commonProps} />;
        case 'review-summary': return <ReviewSummary {...commonProps} />;
        case 'origin-certificate': return <OriginCertificate {...commonProps} />;
        case 'farmer-story': return <FarmerStory {...commonProps} />;
        case 'benefit-point-1':
        case 'benefit-point-2':
        case 'benefit-point-3':
            return <BenefitPoint index={parseInt(module.type.slice(-1))} {...commonProps} />;
        case 'comparison-table': return <ComparisonTable {...commonProps} />;
        case 'size-guide': return <SizeGuide {...commonProps} />;
        case 'harvest-process': return <HarvestProcess {...commonProps} />;
        case 'sweetness-check': return <SweetnessCheck {...commonProps} />;
        case 'taste-tip': return <TasteTip {...commonProps} />;
        case 'event-highlight': return <EventHighlight {...commonProps} />;
        case 'packaging-info': return <PackagingInfo {...commonProps} />;
        case 'caution-notice': return <CautionNotice {...commonProps} />;
        case 'cs-info': return <CSInfo {...commonProps} />;
        default:
            return <div className="p-4 bg-gray-800 text-gray-400">Unknown module: {module.type}</div>;
    }
}

// Common props interface
interface ModuleProps {
    productData: ProductData;
    images: ImageUpload[];
    data: Record<string, unknown>;
    variant: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
    onUpdateData?: (data: Record<string, unknown>) => void;
}

// Theme Helper
const getThemeStyles = (variant: string) => {
    switch (variant) {
        case 'B': return { bg: 'bg-gray-900', text: 'text-white', accent: 'text-yellow-400', border: 'border-yellow-400', container: 'border-b-8 border-yellow-400' };
        case 'C': return { bg: 'bg-white', text: 'text-gray-800', accent: 'text-gray-400', border: 'border-gray-200', font: 'font-serif', container: 'border-b border-gray-100' };
        case 'D': return { bg: 'bg-rose-50', text: 'text-rose-900', accent: 'text-rose-500', border: 'border-rose-200', container: 'rounded-xl m-4' };
        case 'E': return { bg: 'bg-slate-800', text: 'text-slate-100', accent: 'text-blue-300', border: 'border-blue-500', container: 'border-l-4 border-blue-500' };
        case 'F': return { bg: 'bg-[#f5f5dc]', text: 'text-[#5d4037]', accent: 'text-[#8d6e63]', border: 'border-[#d7ccc8]', font: 'font-mono' };
        case 'G': return { bg: 'bg-purple-600', text: 'text-white', accent: 'text-lime-300', border: 'border-lime-300', container: 'border-4 border-black box-shadow-retro' };
        case 'H': return { bg: 'bg-neutral-900', text: 'text-neutral-200', accent: 'text-amber-500', border: 'border-amber-600', font: 'font-serif', container: 'border-y border-amber-900' };
        case 'I': return { bg: 'bg-white', text: 'text-black', accent: 'text-black', border: 'border-black', container: 'border-2 border-black grid-pattern' };
        case 'J': return { bg: 'bg-red-50', text: 'text-green-900', accent: 'text-red-600', border: 'border-red-200', container: 'border-dashed border-2 border-red-300' };
        default: return { bg: 'bg-white', text: 'text-gray-900', accent: 'text-emerald-600', border: 'border-gray-100', container: 'border-b border-gray-100' }; // A
    }
};

// Aspect Ratio Helper
const getAspectRatioStyle = (ratio: unknown) => {
    if (typeof ratio === 'number') {
        return { aspectRatio: `${ratio}` };
    }
    switch (ratio) {
        case 'video': return { aspectRatio: '16/9' };
        case 'standard': return { aspectRatio: '4/3' };
        case 'tall': return { aspectRatio: '3/4' };
        case 'pano': return { aspectRatio: '21/9' };
        case 'square':
        default: return { aspectRatio: '1/1' };
    }
};

// Helper to safely extract aspectRatio from data object
const getDataAspectRatio = (data: Record<string, unknown> | undefined, fallback: number | string = 1): number | string => {
    const ratio = data?.aspectRatio;
    if (typeof ratio === 'number' || typeof ratio === 'string') {
        return ratio;
    }
    return fallback;
};

// Reusable Editable Text Component for inline editing in preview
function EditableText({
    value,
    onChange,
    className = '',
    placeholder = '텍스트를 입력하세요',
    multiline = false,
    tag: Tag = 'span'
}: {
    value: string;
    onChange?: (value: string) => void;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
    tag?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}) {
    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        const newValue = e.currentTarget.innerText;
        if (onChange && newValue !== value) {
            onChange(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} outline-none cursor-text hover:ring-2 hover:ring-emerald-400/50 focus:ring-2 focus:ring-emerald-500 rounded px-1 -mx-1 transition-all`}
            style={{ minWidth: '20px' }}
        >
            {value || placeholder}
        </Tag>
    );
}

// Reusable Droppable Image Zone Component
function DroppableImageZone({
    children,
    onDrop,
    className = '',
    placeholder = '이미지를 드래그하세요'
}: {
    children: React.ReactNode;
    onDrop?: (imageIndex: number) => void;
    className?: string;
    placeholder?: string;
}) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const imageIndex = parseInt(e.dataTransfer.getData('imageIndex'));
        if (!isNaN(imageIndex) && onDrop) {
            onDrop(imageIndex);
        }
        setIsDragOver(false);
    };

    return (
        <div
            className={`${className} ${isDragOver ? 'ring-4 ring-emerald-400 scale-[1.02]' : ''} transition-all`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            {children}
            {isDragOver && (
                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center z-50 pointer-events-none">
                    <span className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                        {placeholder}
                    </span>
                </div>
            )}
        </div>
    );
}

// Resizable Image Container Component
// This component wraps the image/container and renders resize handles directly on it.
function ResizableImageContainer({
    children,
    aspectRatio,
    onUpdateAspectRatio,
    className = '',
    style = {},
    showHandles = true // Can default to true, acts on hover via CSS group
}: {
    children: React.ReactNode;
    aspectRatio?: number | string;
    onUpdateAspectRatio?: (ratio: number) => void;
    className?: string;
    style?: React.CSSProperties;
    showHandles?: boolean;
}) {
    const [isResizing, setIsResizing] = useState(false);
    const startYRef = useRef<number>(0);
    const startRatioRef = useRef<number>(1);

    // Convert ratio string to number for calculation
    const getNumericRatio = (r: unknown) => {
        if (typeof r === 'number') return r;
        if (r === 'video') return 16 / 9;
        if (r === 'standard') return 4 / 3;
        if (r === 'tall') return 3 / 4;
        if (r === 'pano') return 21 / 9;
        return 1;
    };

    const handleResizeStart = (e: React.PointerEvent, direction: 'top' | 'bottom') => {
        if (!onUpdateAspectRatio) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startYRef.current = e.clientY;
        startRatioRef.current = getNumericRatio(aspectRatio);
        document.body.style.cursor = 'ns-resize';
    };

    useEffect(() => {
        if (!isResizing || !onUpdateAspectRatio) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - startYRef.current;

            // Standardizing logic: Dragging vertical expands height, reducing ratio (W/H)
            // It feels intuitive that pulling down bottom handle increases height.
            // Also pulling up top handle increases height.
            // But we need to know which handle. 
            // Simplified: Just use deltaY with sensitivity. 
            // Wait, we need direction state. 
            // Actually let's assume bottom handle logic for simplicity unless passed.
            // But we want 4 corners. Top corners should drag up (-Y) to increase height (+H).
            // Bottom corners should drag down (+Y) to increase height (+H).
            // Since we didn't store direction in state here, let's fix that.
            // For now, let's just use bottom-drag logic for all handles as a fallback, 
            // OR re-add direction state.
            // Okay, let's re-add direction state for correctness.
        };
        // Refactor to include direction in state if needed, but for now let's just assume simple logic
        // or actually, let's just put the logic in the handle handler closure? No, event listener needs access.
        // Let's use a ref for direction.
    }, [isResizing, onUpdateAspectRatio]);

    // Re-implementing correctly with direction state
    const [resizeDir, setResizeDir] = useState<'top' | 'bottom' | null>(null);

    useEffect(() => {
        if (!isResizing || !resizeDir || !onUpdateAspectRatio) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - startYRef.current;
            let effectiveDelta = deltaY;

            // Top handle: Moving UP (-Y) -> Increase Height -> Decrease Ratio
            if (resizeDir === 'top') {
                effectiveDelta = -deltaY;
            }

            const sensitivity = 0.005;
            const newRatio = Math.max(0.5, Math.min(3, startRatioRef.current - (effectiveDelta * sensitivity)));
            onUpdateAspectRatio(newRatio);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeDir(null);
            document.body.style.cursor = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeDir, onUpdateAspectRatio]);


    const startResize = (e: React.MouseEvent, dir: 'top' | 'bottom') => {
        if (!onUpdateAspectRatio) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDir(dir);
        startYRef.current = e.clientY;
        startRatioRef.current = getNumericRatio(aspectRatio);
        document.body.style.cursor = 'ns-resize';
    }

    const handleStyle = "absolute w-5 h-5 bg-white border-2 border-emerald-500 rounded-full z-50 opacity-50 group-hover/resize:opacity-100 transition-opacity cursor-ns-resize shadow-md hover:scale-125 hover:bg-emerald-50";

    return (
        <div
            className={`relative group/resize ${className}`}
            style={{ ...style, ...getAspectRatioStyle(aspectRatio) }}
        >
            {children}

            {onUpdateAspectRatio && showHandles && (
                <>
                    {/* Top Left */}
                    <div className={`${handleStyle} -top-2 -left-2`} onMouseDown={(e) => startResize(e, 'top')} />
                    {/* Top Right */}
                    <div className={`${handleStyle} -top-2 -right-2`} onMouseDown={(e) => startResize(e, 'top')} />
                    {/* Bottom Left */}
                    <div className={`${handleStyle} -bottom-2 -left-2`} onMouseDown={(e) => startResize(e, 'bottom')} />
                    {/* Bottom Right */}
                    <div className={`${handleStyle} -bottom-2 -right-2`} onMouseDown={(e) => startResize(e, 'bottom')} />

                    {/* Border guide */}
                    <div className="absolute inset-0 border-2 border-emerald-500 opacity-0 group-hover/resize:opacity-30 pointer-events-none z-40 transition-opacity" />
                </>
            )}
        </div >
    );
}


// ====== INTRO Modules ======
function HookingBanner({ productData, variant, data, onUpdateData }: ModuleProps) {
    const mainCopy = (data?.mainCopy as string) || '신선한 과일';
    const subCopy = (data?.subCopy as string) || (productData.origin ? `${productData.origin} 산지직송` : '산지직송 직배송');
    const styles = getThemeStyles(variant);

    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    if (variant === 'A') {
        return (
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-500 p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <p className="text-yellow-300 font-bold text-lg mb-2 animate-bounce">🔥 지금이 제철!</p>
                    <EditableText
                        value={mainCopy}
                        onChange={handleTextChange('mainCopy')}
                        className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md whitespace-pre-line block"
                        tag="h1"
                        multiline
                    />
                    <EditableText
                        value={subCopy}
                        onChange={handleTextChange('subCopy')}
                        className="text-white/90 text-lg font-medium bg-white/10 inline-block px-4 py-1 rounded-full whitespace-pre-line"
                        multiline
                    />
                </div>
            </div>
        );
    }
    return (
        <div className={`${styles.bg} ${styles.container} p-12 text-center relative overflow-hidden`}>
            <p className={`${styles.accent} ${styles.font || 'font-bold'} uppercase tracking-widest text-sm mb-3`}>Premium Quality</p>
            <EditableText
                value={mainCopy}
                onChange={handleTextChange('mainCopy')}
                className={`${styles.text} ${styles.font || 'font-black'} text-4xl md:text-5xl mb-4 leading-tight whitespace-pre-line block`}
                tag="h1"
                multiline
            />
            <div className={`inline-block ${variant === 'G' ? 'bg-lime-300 text-purple-900' : (variant === 'B' ? 'bg-yellow-400 text-black' : (variant === 'I' ? 'bg-black text-white' : 'border border-current'))} px-6 py-2 ${styles.text} font-bold`}>
                <EditableText
                    value={subCopy}
                    onChange={handleTextChange('subCopy')}
                    className="whitespace-pre-line"
                    multiline
                />
            </div>
        </div>
    );
}

function HeroImage({ images, variant, data, onUpdateData }: ModuleProps) {
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 0;
    const mainImage = images[imageIndex];
    const imgSrc = mainImage?.transformedUrl || mainImage?.previewUrl;
    const styles = getThemeStyles(variant);

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });

    if (variant === 'G') { // Pop Art
        return (
            <DroppableImageZone onDrop={handleImageDrop} className="relative p-4 bg-yellow-300 border-4 border-black">
                <ResizableImageContainer
                    aspectRatio={data?.aspectRatio as number}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="relative border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                    {mainImage ? <img src={imgSrc} className="w-full h-full object-cover grayscale contrast-125" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">이미지 드롭</div>}
                    <div className="absolute top-4 left-4 bg-purple-600 text-white font-black text-xl px-2 py-1 rotate-[-5deg] border-2 border-black">NEW!</div>
                </ResizableImageContainer>
            </DroppableImageZone>
        )
    }

    return (
        <DroppableImageZone onDrop={handleImageDrop} className="relative">
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio as number}
                onUpdateAspectRatio={handleUpdateRatio}
                className={`overflow-hidden ${variant === 'D' ? 'mx-6 my-6 bg-rose-50' : (variant === 'I' ? 'mx-4 my-4 border-x-2 border-black' : 'bg-gray-100')}`}
            >
                {mainImage ? (
                    <div className={`w-full h-full relative ${variant === 'D' ? 'rounded-2xl overflow-hidden shadow-lg' : ''}`}>
                        <img src={imgSrc} alt="Hero" className={`w-full h-full object-cover ${variant === 'H' ? 'sepia-[.3]' : ''} ${variant === 'F' ? 'brightness-90 contrast-85' : ''}`} />
                        {variant === 'H' && <div className="absolute inset-0 border-[1rem] border-neutral-900/10 pointer-events-none"></div>}
                    </div>
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${styles.text} ${styles.bg} text-gray-400`}>이미지를 드래그하세요</div>
                )}
            </ResizableImageContainer>
        </DroppableImageZone>
    );
}

function SummaryCard({ productData, variant }: ModuleProps) {
    // ... (unchanged)
    const styles = getThemeStyles(variant);
    return (
        <div className={`${styles.bg} ${styles.container} p-6`}>
            <div className={`grid grid-cols-3 gap-4 text-center ${variant === 'I' ? 'divide-x-2 divide-black' : ''}`}>
                <div><p className={`${styles.accent} text-xs mb-1 uppercase opacity-70`}>Origin</p><p className={`${styles.text} font-bold text-lg`}>{productData.origin || '-'}</p></div>
                <div><p className={`${styles.accent} text-xs mb-1 uppercase opacity-70`}>Sweetness</p><p className={`${styles.text} font-bold text-lg`}>{productData.sweetness || '-'} Bx</p></div>
                <div><p className={`${styles.accent} text-xs mb-1 uppercase opacity-70`}>Size</p><p className={`${styles.text} font-bold text-lg`}>{productData.size || '-'}</p></div>
            </div>
        </div>
    );
}

// ... ReviewSummary, OriginCertificate (unchanged, just short code for brevity in update if needed, but I must provide full file content for write_to_file usually, 
// wait, I can use replace or just write fully. Write full is safer to avoid context loss on large refactor.)
function ReviewSummary({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);

    // Default reviews if no data
    const defaultReviews = [
        { title: '정말 달아요!', text: '아이들이 너무 좋아해요. 당도가 정말 높네요.', imgIdx: 5 },
        { title: '신선하네요', text: '방금 딴 것처럼 싱싱해서 놀랐어요.', imgIdx: 6 },
        { title: '포장 꼼꼼!', text: '하나도 안 터지고 잘 왔습니다. 번창하세요.', imgIdx: 7 }
    ];

    const getReviewData = (index: number) => {
        return {
            title: (data?.[`title${index + 1}`] as string) || defaultReviews[index].title,
            text: (data?.[`text${index + 1}`] as string) || defaultReviews[index].text,
            imgIdx: typeof data?.[`imageIndex${index + 1}`] === 'number' ? (data[`imageIndex${index + 1}`] as number) : defaultReviews[index].imgIdx
        };
    };

    const handleUpdateText = (index: number, field: 'title' | 'text') => (val: string) => {
        onUpdateData && onUpdateData({ [`${field}${index + 1}`]: val });
    };

    const handleImageDrop = (index: number) => (idx: number) => {
        onUpdateData && onUpdateData({ [`imageIndex${index + 1}`]: idx });
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-10 overflow-hidden`}>
            <div className="text-center mb-10">
                <p className={`${styles.accent} text-[13px] font-bold tracking-[0.2em] uppercase mb-2`}>Real Reviews</p>
                <h2 className={`${styles.text} text-3xl font-black mb-3 break-keep`}>고객이 직접 증명하는 품질</h2>
                <div className="flex justify-center text-yellow-500 text-2xl tracking-tight">★★★★★</div>
            </div>

            {/* Fixed 3-column grid - NO SCROLL */}
            <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map(i => {
                    const review = getReviewData(i);
                    const img = images[review.imgIdx];
                    const imgSrc = img?.transformedUrl || img?.previewUrl;

                    return (
                        <div key={i} className={`flex flex-col rounded-[24px] overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-lg ${styles.bg === 'bg-white' ? 'bg-white' : 'bg-white/10 backdrop-blur-md'}`}>
                            <DroppableImageZone onDrop={handleImageDrop(i)} className="relative aspect-square bg-gray-50">
                                {img ? (
                                    <img src={imgSrc} className="w-full h-full object-cover" alt="리뷰 이미지" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1 px-2">
                                        <span className="text-2xl">📸</span>
                                        <span className="text-[10px] font-bold text-center leading-tight">사진 드래그</span>
                                    </div>
                                )}
                            </DroppableImageZone>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="text-yellow-500 text-[10px] mb-2 tracking-tighter">★★★★★</div>
                                <EditableText
                                    value={review.title}
                                    onChange={handleUpdateText(i, 'title')}
                                    className={`${styles.text} font-bold text-sm mb-2 block text-left break-keep leading-snug h-10 overflow-hidden line-clamp-2`}
                                    tag="h4"
                                />
                                <EditableText
                                    value={review.text}
                                    onChange={handleUpdateText(i, 'text')}
                                    className={`${styles.text} text-[11px] opacity-70 leading-[1.5] text-left break-keep h-20 overflow-hidden line-clamp-4`}
                                    tag="p"
                                    multiline
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
function OriginCertificate({ productData, variant }: ModuleProps) {
    const styles = getThemeStyles(variant);
    return (<div className={`${styles.bg} ${styles.container} p-8 flex flex-col items-center text-center`}><div className={`w-16 h-16 rounded-full border-2 ${styles.border} flex items-center justify-center mb-4 ${styles.accent}`}><span className="text-3xl">✓</span></div><h3 className={`${styles.text} font-bold text-lg uppercase tracking-wider mb-1`}>Certified Origin</h3><p className={`${styles.text} opacity-80`}>{productData.origin || '산지 인증'}</p></div>)
}

function FarmerStory({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 1;
    const farmerImage = images[imageIndex];
    const imgSrc = farmerImage?.transformedUrl || farmerImage?.previewUrl;
    const styles = getThemeStyles(variant);

    const farmerName = (data?.farmerName as string) || productData.farmerName || 'Farmer';
    const storyText = (data?.storyText as string) || '"정직하게 키운 농산물만 보냅니다."';

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });
    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    if (variant === 'B' || variant === 'H' || variant === 'E') {
        return (
            <DroppableImageZone onDrop={handleImageDrop} className="relative">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 'video')}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="relative bg-black overflow-hidden group"
                >
                    {farmerImage ? <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-400">이미지 드롭</div>}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black via-transparent to-transparent">
                        <EditableText value={farmerName} onChange={handleTextChange('farmerName')} className={`text-3xl font-bold ${styles.text} mb-2`} tag="h2" />
                        <EditableText value={storyText} onChange={handleTextChange('storyText')} className={`${styles.text} opacity-80 leading-relaxed`} tag="p" multiline />
                    </div>
                </ResizableImageContainer>
            </DroppableImageZone>
        )
    }

    return (
        <div className={`${styles.bg} ${styles.container} p-8 flex flex-col items-center text-center`}>
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-sm">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 'video')}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`w-full rounded-lg overflow-hidden mb-6 border-4 ${styles.border}`}
                >
                    {farmerImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-400 aspect-video">이미지 드롭</div>}
                </ResizableImageContainer>
            </DroppableImageZone>
            <EditableText value={`${farmerName} 농부의 이야기`} onChange={handleTextChange('farmerName')} className={`text-xl font-bold ${styles.text} mb-4`} tag="h2" />
            <EditableText value={(data?.storyText as string) || '자연 그대로의 맛을 전하기 위해 365일 땀흘려 키웠습니다.'} onChange={handleTextChange('storyText')} className={`${styles.text} max-w-md leading-relaxed opacity-90`} tag="p" multiline />
        </div>
    );
}

function BenefitPoint({ index, productData, images, variant, data, onUpdateData }: ModuleProps & { index: number }) {
    const defaultImageIndex = [2, 3, 4][index - 1];
    const customImageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : undefined;
    const targetImageIndex = customImageIndex !== undefined ? customImageIndex : defaultImageIndex;
    const image = images[targetImageIndex];
    const imgSrc = image?.transformedUrl || image?.previewUrl;

    const defaultTitles = ['백화점 퀄리티 그대로, 상위 1% 프리미엄 선별', '산지의 신선함을 식탁까지, 당일 수확 당일 발송', '입안 가득 터지는 과즙, 고당도 보장'];
    const defaultDescriptions = ['수확 후 까다로운 3단계 선별 과정을 거쳐 크기, 모양, 때깔까지 완벽한 최상품만을 엄선했습니다.', '미리 따놓은 과일이 아닙니다. 주문이 들어오면 농장에서 가장 맛이 오른 과일을 골라 새벽에 수확하고 발송합니다.', '평균 당도 14Brix 이상! 비파괴 당도 선별기로 확실하게 검증된 달콤함만 담았습니다.'];
    const title = (data?.title as string) || defaultTitles[index - 1];
    const description = (data?.description as string) || defaultDescriptions[index - 1];
    const styles = getThemeStyles(variant);

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });
    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    const renderImage = (extraClass = '') => (
        <DroppableImageZone onDrop={handleImageDrop} className="relative w-full">
            <ResizableImageContainer
                aspectRatio={getDataAspectRatio(data, 16 / 9)}
                onUpdateAspectRatio={handleUpdateRatio}
                className={extraClass}
            >
                {image ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">이미지 드롭</div>}
            </ResizableImageContainer>
        </DroppableImageZone>
    );

    if (variant === 'A') {
        return (
            <div className="flex flex-col p-10 bg-white border-b border-gray-100 items-center text-center">
                <span className="text-emerald-600 font-bold text-sm mb-3">POINT {index}</span>
                <EditableText value={title} onChange={handleTextChange('title')} className="text-3xl font-bold text-gray-900 mb-8 break-keep leading-snug px-4" tag="h3" multiline />
                <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-3xl mb-8">
                    <ResizableImageContainer
                        aspectRatio={getDataAspectRatio(data, 16 / 9)}
                        onUpdateAspectRatio={handleUpdateRatio}
                        className="w-full rounded-2xl overflow-hidden bg-gray-100 shadow-lg"
                    >
                        {image ? <img src={imgSrc} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-video">이미지 드롭</div>}
                    </ResizableImageContainer>
                </DroppableImageZone>
                <EditableText value={description} onChange={handleTextChange('description')} className="text-gray-700 leading-relaxed text-lg break-keep max-w-2xl" tag="p" multiline />
            </div>
        );
    }

    if (['B', 'E', 'H'].includes(variant)) {
        return (
            <DroppableImageZone onDrop={handleImageDrop} className="relative">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 16 / 9)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`relative ${styles.bg} overflow-hidden group`}
                >
                    {image ? <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gray-700" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 flex flex-col justify-end items-center text-center">
                        <div className={`border ${styles.border} px-4 py-1 rounded-full ${styles.accent} font-bold text-sm mb-4 tracking-widest uppercase backdrop-blur-sm`}>Premium Benefit 0{index}</div>
                        <EditableText value={title} onChange={handleTextChange('title')} className={`text-3xl font-black ${styles.text} mb-6 leading-tight max-w-2xl text-shadow-lg`} tag="h3" multiline />
                        <div className={`w-12 h-1 bg-current ${styles.accent} mb-6`}></div>
                        <EditableText value={description} onChange={handleTextChange('description')} className="text-gray-100 text-lg leading-relaxed max-w-3xl font-medium text-shadow" tag="p" multiline />
                    </div>
                </ResizableImageContainer>
            </DroppableImageZone>
        )
    }

    if (['C', 'D', 'F'].includes(variant)) {
        return (
            <div className={`py-16 px-8 ${styles.bg} ${styles.container} flex flex-col items-center text-center`}>
                <span className={`text-xs tracking-widest ${styles.accent} mb-6 border ${styles.border} px-4 py-1.5 rounded-full uppercase`}>Check Point 0{index}</span>
                <EditableText value={title} onChange={handleTextChange('title')} className={`text-3xl ${styles.font} ${styles.text} mb-8 px-4 leading-snug`} tag="h3" multiline />
                <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-4xl mb-10">
                    <ResizableImageContainer
                        aspectRatio={getDataAspectRatio(data, 21 / 9)}
                        onUpdateAspectRatio={handleUpdateRatio}
                        className={`w-full bg-black/5 ${variant === 'D' ? 'rounded-2xl' : 'rounded-sm'} overflow-hidden`}
                    >
                        {image ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-[21/9]">이미지 드롭</div>}
                    </ResizableImageContainer>
                </DroppableImageZone>
                <EditableText value={description} onChange={handleTextChange('description')} className={`${styles.text} opacity-80 text-lg leading-loose max-w-2xl break-keep`} tag="p" multiline />
            </div>
        )
    }

    if (['G', 'I'].includes(variant)) {
        return (
            <div className={`${styles.bg} ${styles.container} p-8 md:p-12 flex flex-col items-center text-center relative`}>
                <div className={`absolute top-0 left-0 bg-black text-white px-4 py-2 font-bold text-xl z-10 ${variant === 'I' ? 'block' : 'hidden'}`}>{index}</div>
                <EditableText value={title} onChange={handleTextChange('title')} className={`text-4xl md:text-5xl font-black ${styles.text} mb-8 uppercase italic`} tag="h3" multiline />
                <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-lg mb-8">
                    <ResizableImageContainer
                        aspectRatio={getDataAspectRatio(data, 1)}
                        onUpdateAspectRatio={handleUpdateRatio}
                        className={`w-full border-4 ${styles.border} shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]`}
                    >
                        {image ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-square">이미지 드롭</div>}
                    </ResizableImageContainer>
                </DroppableImageZone>
                <EditableText value={description} onChange={handleTextChange('description')} className={`${styles.text} font-bold text-xl max-w-xl`} tag="p" multiline />
            </div>
        )
    }

    // Fallback
    return (
        <div className={`${styles.bg} ${styles.container} p-10 flex flex-col items-center text-center`}>
            <span className={`${styles.accent} font-bold mb-4`}>POINT {index}</span>
            <EditableText value={title} onChange={handleTextChange('title')} className={`text-2xl ${styles.text} font-bold mb-6`} tag="h3" multiline />
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-2xl mb-6">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 16 / 9)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="w-full bg-gray-100 rounded overflow-hidden"
                >
                    {image ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-video">이미지 드롭</div>}
                </ResizableImageContainer>
            </DroppableImageZone>
            <EditableText value={description} onChange={handleTextChange('description')} className={`${styles.text} leading-relaxed`} tag="p" multiline />
        </div>
    );
}

function ComparisonTable({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const ourImageIndex = typeof data?.ourImageIndex === 'number' ? (data.ourImageIndex as number) : 0;
    const competitorImageIndex = typeof data?.competitorImageIndex === 'number' ? (data.competitorImageIndex as number) : 1;

    const ourImage = images[ourImageIndex];
    const competitorImage = images[competitorImageIndex];
    const ourImgSrc = ourImage?.transformedUrl || ourImage?.previewUrl;
    const competitorImgSrc = competitorImage?.transformedUrl || competitorImage?.previewUrl;

    const [ourDragOver, setOurDragOver] = React.useState(false);
    const [compDragOver, setCompDragOver] = React.useState(false);

    const handleDrop = (field: 'ourImageIndex' | 'competitorImageIndex') => (e: React.DragEvent) => {
        e.preventDefault();
        const imageIndex = parseInt(e.dataTransfer.getData('imageIndex'));
        if (!isNaN(imageIndex) && onUpdateData) {
            onUpdateData({ [field]: imageIndex });
        }
        setOurDragOver(false);
        setCompDragOver(false);
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <h2 className={`text-xl font-bold ${styles.text} mb-6 text-center`}>Comparison Check</h2>

            {/* Two images side by side */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col">
                    <div
                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm border-2 transition-all ${ourDragOver ? 'border-emerald-500 ring-4 ring-emerald-200 scale-105' : 'border-emerald-400'}`}
                        onDragOver={(e) => { e.preventDefault(); setOurDragOver(true); }}
                        onDragLeave={() => setOurDragOver(false)}
                        onDrop={handleDrop('ourImageIndex')}
                    >
                        {ourImage ? (
                            <img src={ourImgSrc} className="w-full h-full object-cover" alt="우리 상품" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 text-sm text-center p-2">
                                이미지를<br />드래그하세요
                            </div>
                        )}
                    </div>
                    <p className={`text-center mt-2 font-bold text-sm ${styles.accent}`}>우리 상품</p>
                </div>
                <div className="flex flex-col">
                    <div
                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm border transition-all ${compDragOver ? 'border-gray-500 ring-4 ring-gray-300 scale-105' : 'border-gray-300'}`}
                        onDragOver={(e) => { e.preventDefault(); setCompDragOver(true); }}
                        onDragLeave={() => setCompDragOver(false)}
                        onDrop={handleDrop('competitorImageIndex')}
                    >
                        {competitorImage ? (
                            <img src={competitorImgSrc} className="w-full h-full object-cover" alt="경쟁사 상품" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 text-sm text-center p-2">
                                이미지를<br />드래그하세요
                            </div>
                        )}
                    </div>
                    <p className="text-center mt-2 font-medium text-sm text-gray-500">일반 상품</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 text-center divide-x divide-gray-200">
                    <div className={`p-4 bg-emerald-50 ${styles.accent} font-bold text-lg`}>우리 상품</div>
                    <div className="p-4 bg-gray-50 text-gray-500 font-medium">일반 상품</div>
                </div>
                <div className={`grid grid-cols-2 text-center divide-x divide-gray-200 border-t border-gray-200 bg-white ${styles.text}`}>
                    <div className="p-4 space-y-1"><p className="text-xs opacity-50 mb-1">당도</p><p className="font-bold text-lg">{productData.sweetness || '14'}Bx</p><p className="text-xs text-emerald-600 font-bold">고당도 보장</p></div>
                    <div className="p-4 space-y-1 bg-gray-50/50"><p className="text-xs opacity-50 mb-1">당도</p><p className="text-gray-400">10~12Bx</p><p className="text-xs text-gray-400">일반 당도</p></div>
                </div>
            </div>
        </div>
    );
}

function SizeGuide({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 5;
    const sizeImage = images[imageIndex];
    const imgSrc = sizeImage?.transformedUrl || sizeImage?.previewUrl;
    const styles = getThemeStyles(variant);
    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });

    return (
        <div className={`${styles.bg} ${styles.container} p-8 flex flex-col items-center text-center`}>
            <h2 className={`text-xl font-bold ${styles.text} mb-6`}>SIZE CHECK</h2>
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-64 max-w-full">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 1)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`rounded-full overflow-hidden mb-4 border-4 ${styles.border} ${styles.bg === 'bg-white' ? 'bg-gray-50' : 'bg-white/10'}`}
                >
                    {sizeImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-square">이미지 드롭</div>}
                </ResizableImageContainer>
            </DroppableImageZone>
            <p className={`text-2xl font-bold ${styles.accent}`}>{productData.size || '특대'}</p>
            <p className={`${styles.text} opacity-70 mt-2`}>실제 크기는 이미지와 다를 수 있습니다.</p>
        </div>
    );
}

// ... HarvestProcess, SweetnessCheck, TasteTip, EventHighlight, PackagingInfo, CautionNotice, CSInfo
function HarvestProcess({ images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);

    const defaultSteps = [
        { title: '엄격한 선별', desc: '수확 후 크기, 당도, 외관을 기준으로 최상품만 선별합니다.' },
        { title: '세척 및 건조', desc: '깨끗한 물로 세척 후 자연 건조하여 신선도를 유지합니다.' },
        { title: '꼼꼼한 포장', desc: '개별 완충재로 감싸 배송 중 손상을 방지합니다.' },
        { title: '당일 출고', desc: '오전 주문 시 당일 수확, 당일 발송으로 최상의 신선도를 보장합니다.' }
    ];

    const getStepData = (stepIndex: number, field: 'title' | 'desc') => {
        const key = `step${stepIndex + 1}${field === 'title' ? 'Title' : 'Desc'}`;
        return (data?.[key] as string) || defaultSteps[stepIndex][field];
    };

    const handleTextChange = (stepIndex: number, field: 'title' | 'desc') => (value: string) => {
        const key = `step${stepIndex + 1}${field === 'title' ? 'Title' : 'Desc'}`;
        onUpdateData && onUpdateData({ [key]: value });
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <h2 className={`text-xl font-bold ${styles.text} mb-6 text-center`}>수확부터 배송까지</h2>
            <div className="space-y-4">
                {[0, 1, 2, 3].map(stepIndex => (
                    <div key={stepIndex} className={`flex items-start gap-4 p-5 border ${styles.border} rounded-xl ${styles.bg === 'bg-white' ? 'bg-gray-50' : 'bg-black/20'}`}>
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${styles.accent} ${styles.bg === 'bg-white' ? 'bg-emerald-100' : 'bg-white/10'}`}>
                            <span className="text-xl font-black">0{stepIndex + 1}</span>
                        </div>
                        <div className="flex-1">
                            <EditableText
                                value={getStepData(stepIndex, 'title')}
                                onChange={handleTextChange(stepIndex, 'title')}
                                className={`font-bold text-lg ${styles.text} block mb-1`}
                                tag="h3"
                            />
                            <EditableText
                                value={getStepData(stepIndex, 'desc')}
                                onChange={handleTextChange(stepIndex, 'desc')}
                                className={`${styles.text} opacity-80 text-sm leading-relaxed`}
                                tag="p"
                                multiline
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SweetnessCheck({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 0;
    const brixImage = images[imageIndex];
    const imgSrc = brixImage?.transformedUrl || brixImage?.previewUrl;

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <div className="text-center mb-6">
                <p className={`${styles.accent} tracking-widest text-sm font-bold mb-2 uppercase`}>Brix Check</p>
                <div className={`text-6xl font-black mb-4 flex justify-center items-start ${styles.text}`}>
                    {productData.sweetness || 14}
                    <span className="text-xl mt-2 opacity-50 ml-1">Bx</span>
                </div>
                <div className={`w-full max-w-xs mx-auto h-3 rounded-full overflow-hidden ${styles.bg === 'bg-white' ? 'bg-gray-200' : 'bg-gray-700'}`}>
                    <div className={`h-full ${styles.bg === 'bg-white' ? 'bg-emerald-500' : 'bg-emerald-400'} w-[80%] rounded-full`}></div>
                </div>
            </div>

            {/* Brix Image Section */}
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-sm mx-auto">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 1)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`w-full rounded-xl overflow-hidden ${styles.bg === 'bg-white' ? 'bg-gray-100 border border-gray-200' : 'bg-white/10'}`}
                >
                    {brixImage ? (
                        <img src={imgSrc} className="w-full h-full object-cover" alt="당도 측정" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 aspect-square">
                            <span className="text-4xl mb-2">📊</span>
                            <span className="text-sm">당도 측정 사진</span>
                            <span className="text-xs mt-1 opacity-60">이미지를 드래그하세요</span>
                        </div>
                    )}
                </ResizableImageContainer>
            </DroppableImageZone>

            <p className={`${styles.text} text-center mt-4 text-sm opacity-70`}>비파괴 당도 선별기로 측정한 고당도 과일만 보내드립니다.</p>
        </div>
    );
}

function TasteTip({ productData, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);

    const defaultTips = [
        '수령 후 바로 냉장(0~5°C) 보관해주세요.',
        '드시기 2~3시간 전 실온에 두시면 더 달콤합니다.',
        '흐르는 물에 가볍게 세척 후 드시면 됩니다.',
        '개봉 후 3~5일 이내 섭취를 권장드립니다.'
    ];

    const getTipData = (index: number) => {
        const key = `tip${index + 1}`;
        return (data?.[key] as string) || defaultTips[index];
    };

    const handleTextChange = (index: number) => (value: string) => {
        const key = `tip${index + 1}`;
        onUpdateData && onUpdateData({ [key]: value });
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">😋</span>
                <h3 className={`text-xl font-bold ${styles.text}`}>맛있게 먹는 팁</h3>
            </div>
            <div className="space-y-3">
                {[0, 1, 2, 3].map(index => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${styles.bg === 'bg-white' ? 'bg-emerald-50' : 'bg-white/5'}`}>
                        <span className={`${styles.accent} text-lg`}>✓</span>
                        <EditableText
                            value={getTipData(index)}
                            onChange={handleTextChange(index)}
                            className={`${styles.text} text-sm flex-1`}
                            tag="p"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
function EventHighlight({ productData, variant, data }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const eventText = (data?.eventText as string) || productData.eventText || '지금 구매 시 특별 할인 혜택!'; if (variant === 'B') { return (<div className="bg-black p-16 text-center border-y-8 border-yellow-400 relative overflow-hidden group"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 animate-[pulse_3s_infinite]"></div><h3 className="relative text-yellow-400 font-black text-6xl mb-6 tracking-tighter uppercase animate-bounce">SPECIAL OFFER</h3><p className="relative text-white font-bold text-3xl max-w-4xl mx-auto leading-tight whitespace-pre-line">{eventText}</p><div className="mt-8"><span className="inline-block bg-yellow-400 text-black font-black text-xl px-8 py-3 rounded-full transform rotate-[-2deg]">💰 기간 한정 혜택 💰</span></div></div>) } if (variant === 'G') { return (<div className="bg-purple-600 p-16 text-center relative overflow-hidden border-4 border-black"><div className="absolute top-0 right-0 text-9xl opacity-20 rotate-12">🎉</div><div className="absolute bottom-0 left-0 text-9xl opacity-20 -rotate-12">🎁</div><h3 className="text-5xl font-black text-lime-300 mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] uppercase italic">Limited Event</h3><div className="bg-white border-4 border-black p-6 transform -rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)] inline-block"><p className="text-black font-bold text-2xl md:text-3xl whitespace-pre-line">{eventText}</p></div></div>) } if (variant === 'J') { return (<div className="bg-red-600 p-16 text-center text-white border-4 border-dashed border-green-400 m-4 rounded-xl shadow-xl relative"><div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-bold px-6 py-2 rounded-full border-2 border-white shadow-lg">SEASON SPECIAL</div><h3 className="text-4xl font-serif font-bold mb-4 mt-2">🎄 특별한 선물 🎄</h3><p className="text-2xl font-medium opacity-90 whitespace-pre-line">{eventText}</p></div>) } return (<div className={`${styles.bg} ${styles.container} py-20 px-8 text-center relative overflow-hidden`}>{variant === 'A' && <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-20 animate-pulse"></div>}<div className="relative z-10"><div className="text-6xl mb-6 animate-bounce">🎁</div><h3 className={`text-4xl md:text-5xl font-black ${styles.text} mb-6 leading-tight`}><span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-600 block mb-2">EVENT</span></h3><p className={`${styles.text} text-2xl md:text-3xl font-bold max-w-4xl mx-auto break-keep leading-snug whitespace-pre-line`}>{eventText}</p><div className="mt-8 w-24 h-1 bg-current opacity-30 mx-auto rounded-full"></div><p className={`${styles.text} mt-4 opacity-70`}>기간 한정 혜택을 놓치지 마세요!</p></div></div>)
}

function PackagingInfo({ images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 9;
    const packagingImage = images[imageIndex];
    const imgSrc = packagingImage?.transformedUrl || packagingImage?.previewUrl;

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <h3 className={`text-xl font-bold ${styles.text} mb-4 text-center`}>Safe Delivery</h3>
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full mb-4">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 16 / 9)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="w-full bg-gray-200 rounded-lg overflow-hidden"
                >
                    {packagingImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-video">이미지 드롭</div>}
                </ResizableImageContainer>
            </DroppableImageZone>
            <p className={`${styles.text} text-center opacity-80`}>꼼꼼하게 포장하여 안전하게 배송해드립니다.</p>
        </div>
    )
}

function CautionNotice({ productData, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);

    const defaultCautions = [
        '본 상품은 신선식품으로 단순 변심에 의한 교환/반품이 어렵습니다.',
        '상품 수령 후 하자가 있는 경우 1일 이내 사진과 함께 고객센터로 연락 부탁드립니다.',
        '납품 전 상품 상태를 꼭 확인해주세요.',
        '산지 직송 상품으로 배송일이 다소 지연될 수 있습니다.'
    ];

    const getCautionData = (index: number) => {
        const key = `caution${index + 1}`;
        return (data?.[key] as string) || defaultCautions[index];
    };

    const handleTextChange = (index: number) => (value: string) => {
        const key = `caution${index + 1}`;
        onUpdateData && onUpdateData({ [key]: value });
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">⚠️</span>
                <h3 className={`text-lg font-bold ${styles.text}`}>주의사항</h3>
            </div>
            <div className="space-y-2">
                {[0, 1, 2, 3].map(index => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${styles.bg === 'bg-white' ? 'bg-yellow-50' : 'bg-yellow-900/20'}`}>
                        <span className="text-yellow-600 text-sm font-bold">•</span>
                        <EditableText
                            value={getCautionData(index)}
                            onChange={handleTextChange(index)}
                            className={`${styles.text} text-sm opacity-80 flex-1`}
                            tag="p"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function CSInfo({ productData, variant, data, onUpdateData }: ModuleProps) {
    const csPhone = (data?.csPhone as string) || productData.csPhone || '010-0000-0000';

    const handlePhoneChange = (value: string) => {
        onUpdateData && onUpdateData({ csPhone: value });
    };

    return (
        <div className="bg-gray-900 text-white">
            {/* 교환 및 반품 안내 */}
            <div className="p-6">
                <h2 className="text-xl font-bold mb-6">교환 및 반품 안내</h2>
                <div className="space-y-4 text-sm">
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">01</span>
                        <p className="text-gray-300 leading-relaxed">주문 확인이 된 상태에서는 배송지 변경 및 취소가 어려울 수 있고, 부득이하게 변경/취소를 해야 할 경우 판매자와 협의 후 처리가 가능합니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">02</span>
                        <p className="text-gray-300 leading-relaxed">본 상품은 신선식품으로, 상품의 특성상 배송 완료 후 <span className="text-yellow-400">고객님의 단순 변심 및 의한 교환 및 반품이 어렵습니다.</span> (반품 및 환불은 판매자와 협의 후 처리 가능)</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">03</span>
                        <div className="text-gray-300 leading-relaxed">
                            <p>상품 수령 후 문제가 발생한 경우 즉시 사진을 찍어</p>
                            <p>상품 수령일 기준 1일 이내 고객 센터로 접수해주세요.</p>
                            <ul className="mt-2 ml-4 list-disc text-gray-400">
                                <li>운송장 사진</li>
                                <li>상품이 보이는 박스 전체 사진</li>
                                <li>문제 부분사진</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">04</span>
                        <p className="text-gray-300 leading-relaxed">재판매가 불가한 신선제품의 특성상 단순 변심 및 개인적인 입맛 차이로 인한 반품 및 교환은 어려울 수 있습니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">05</span>
                        <p className="text-gray-300 leading-relaxed">제품 수령 후 보관 중 발생한 상품 변형에 대한 요청사항은 처리가 어려울 수 있습니다.</p>
                    </div>
                </div>
            </div>

            {/* 배송 안내 */}
            <div className="p-6 bg-gray-800">
                <h2 className="text-xl font-bold mb-6">배송 안내</h2>
                <div className="space-y-4 text-sm">
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">01</span>
                        <p className="text-gray-300 leading-relaxed">당일 작업 후 배송되는 신선제품은 주문 폭주 시 1~3일 배송 지연될 수 있습니다. 페이지에서 보이는 배송 도착 예정일은 시스템상 자동으로 보여지는 데이터로, 저희 실제 배송일과 무관합니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">02</span>
                        <p className="text-gray-300 leading-relaxed">신선제품 특성상 산지 기상상황에 따라 다소 배송이 지연될 수 있습니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">03</span>
                        <p className="text-gray-300 leading-relaxed">냉장/냉동식품은 수령 후 바로 개봉하여 냉장/냉동 보관해 주세요. 아이스팩을 동봉해서 보내드리나 하절기에는 아이스팩 및 제품이 녹을 수 있으며 이로 인한 반품 및 교환은 어려울 수 있습니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">04</span>
                        <p className="text-gray-300 leading-relaxed">제주도 및 도서산간지역은 계절, 날씨에 따라 출고가 어려울 수 있습니다.</p>
                    </div>
                </div>
            </div>

            {/* 기타 유의사항 */}
            <div className="p-6">
                <h2 className="text-xl font-bold mb-6">기타 유의사항</h2>
                <div className="space-y-4 text-sm">
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">01</span>
                        <p className="text-gray-300 leading-relaxed">고객 과실로 인한 고객 정보 기재 오류 및 부재중 보관 장소에 대한 정보 기재 오류로 연락이 되지 않아 발생한 배송사고에 대해서는 책임지지 않습니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-400 font-bold text-lg w-8 flex-shrink-0">02</span>
                        <div className="text-gray-300 leading-relaxed">
                            <p>기타 문의사항은 고객센터로 연락 주시기 바랍니다.</p>
                            <p className="mt-2">- 쿠팡 채팅 문의가 가장 빠릅니다.</p>
                            <p>- 문자 상담 : <EditableText value={csPhone} onChange={handlePhoneChange} className="text-white font-bold inline" /></p>
                            <p className="text-gray-400 text-xs mt-1">문의 내용과 사진을 함께 보내주시면 빠른 응대가 가능합니다.</p>
                            <p className="mt-2 text-gray-400">- 업무시간 : 평일 09:00 ~ 18:00</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
