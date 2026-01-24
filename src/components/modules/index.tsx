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


    const startResize = (e: React.PointerEvent, dir: 'top' | 'bottom') => {
        if (!onUpdateAspectRatio) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDir(dir);
        startYRef.current = e.clientY;
        startRatioRef.current = getNumericRatio(aspectRatio);
        document.body.style.cursor = 'ns-resize';
    }

    const handleStyle = "absolute w-4 h-4 bg-white border-2 border-emerald-500 rounded-full z-50 opacity-0 group-hover/resize:opacity-100 transition-opacity cursor-ns-resize shadow-md hover:scale-125 hover:bg-emerald-50";

    return (
        <div
            className={`relative group/resize ${className}`}
            style={{ ...style, ...getAspectRatioStyle(aspectRatio) }}
        >
            {children}

            {onUpdateAspectRatio && showHandles && (
                <>
                    {/* Top Left */}
                    <div className={`${handleStyle} -top-2 -left-2`} onPointerDown={(e) => startResize(e, 'top')} />
                    {/* Top Right */}
                    <div className={`${handleStyle} -top-2 -right-2`} onPointerDown={(e) => startResize(e, 'top')} />
                    {/* Bottom Left */}
                    <div className={`${handleStyle} -bottom-2 -left-2`} onPointerDown={(e) => startResize(e, 'bottom')} />
                    {/* Bottom Right */}
                    <div className={`${handleStyle} -bottom-2 -right-2`} onPointerDown={(e) => startResize(e, 'bottom')} />

                    {/* Border guide */}
                    <div className="absolute inset-0 border-2 border-emerald-500 opacity-0 group-hover/resize:opacity-30 pointer-events-none z-40 transition-opacity" />
                </>
            )}
        </div>
    );
}


// ====== INTRO Modules ======
function HookingBanner({ productData, variant, data }: ModuleProps) {
    const mainCopy = (data?.mainCopy as string) || productData.productName || '신선한 과일';
    const subCopy = (data?.subCopy as string) || (productData.origin ? `${productData.origin} 산지직송` : '산지직송 직배송');
    const styles = getThemeStyles(variant);
    // Not resizable
    if (variant === 'A') {
        return (
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-500 p-10 text-center overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <p className="text-yellow-300 font-bold text-lg mb-2 animate-bounce">🔥 지금이 제철!</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md">{mainCopy}</h1>
                    <p className="text-white/90 mt-2 text-lg font-medium bg-white/10 inline-block px-4 py-1 rounded-full">{subCopy}</p>
                </div>
            </div>
        );
    }
    return (
        <div className={`${styles.bg} ${styles.container} p-12 text-center relative overflow-hidden`}>
            <p className={`${styles.accent} ${styles.font || 'font-bold'} uppercase tracking-widest text-sm mb-3`}>Premium Quality</p>
            <h1 className={`${styles.text} ${styles.font || 'font-black'} text-4xl md:text-5xl mb-4 leading-tight`}>{mainCopy}</h1>
            <div className={`inline-block ${variant === 'G' ? 'bg-lime-300 text-purple-900' : (variant === 'B' ? 'bg-yellow-400 text-black' : (variant === 'I' ? 'bg-black text-white' : 'border border-current'))} px-6 py-2 ${styles.text} font-bold`}>
                {subCopy}
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

    if (variant === 'G') { // Pop Art
        return (
            <div className="p-4 bg-yellow-300 border-4 border-black">
                <ResizableImageContainer
                    aspectRatio={data?.aspectRatio as number}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="relative border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                    {mainImage ? <img src={imgSrc} className="w-full h-full object-cover grayscale contrast-125" /> : null}
                    <div className="absolute top-4 left-4 bg-purple-600 text-white font-black text-xl px-2 py-1 rotate-[-5deg] border-2 border-black">NEW!</div>
                </ResizableImageContainer>
            </div>
        )
    }

    return (
        <ResizableImageContainer
            aspectRatio={data?.aspectRatio as number}
            onUpdateAspectRatio={handleUpdateRatio}
            className={`overflow-hidden ${variant === 'D' ? 'mx-6 my-6 bg-rose-50' : (variant === 'I' ? 'mx-4 my-4 border-x-2 border-black' : 'bg-gray-100')}`}
        // Note: For Variant D/I, padding was creating distance from image. By applying ResizableContainer as the wrapper, 
        // the handles will be on this wrapper. If we want handles on the image *inside* the padding, 
        // we should put ResizableImageContainer *inside*.
        // Let's optimize: Put ResizableImageContainer around the img tag itself if possible, or make the wrapper the container.
        // For Variant D (Soft), it has padding `p-6`.
        >
            {/* Fixing structure for layout consistency with resizing */}
            {/* If variant D, we want handles on the outer box or inner? User said "image corners". 
                 If we put handles on the outer box, it resizes the padding box. That seems acceptable?
                 No, usually people want to resize the visual image. 
                 Let's keep it simple: Resizing the container of the image.
             */}
            {mainImage ? (
                <div className={`w-full h-full relative ${variant === 'D' ? 'rounded-2xl overflow-hidden shadow-lg' : ''}`}>
                    <img src={imgSrc} alt="Hero" className={`w-full h-full object-cover ${variant === 'H' ? 'sepia-[.3]' : ''} ${variant === 'F' ? 'brightness-90 contrast-85' : ''}`} />
                    {variant === 'H' && <div className="absolute inset-0 border-[1rem] border-neutral-900/10 pointer-events-none"></div>}
                </div>
            ) : (
                <div className={`w-full h-full flex items-center justify-center ${styles.text} ${styles.bg}`}>Hero Image</div>
            )}
        </ResizableImageContainer>
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
function ReviewSummary({ productData, variant }: ModuleProps) {
    const content = productData.reviewSummary || '리뷰 요약이 AI에 의해 자동 생성됩니다.';
    const styles = getThemeStyles(variant);
    if (variant === 'A') {
        return (<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6"><h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">⭐ 리뷰 요약</h2><div className="bg-white p-4 rounded-lg border border-purple-200 text-gray-700 shadow-sm">{content}</div></div>)
    }
    return (<div className={`${styles.bg} ${styles.container} p-8 text-center`}><div className={`text-2xl mb-2 ${styles.accent}`}>★★★★★</div><p className={`${styles.text} ${styles.font} leading-relaxed`}>{content}</p></div>);
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

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });

    if (variant === 'B' || variant === 'H' || variant === 'E') {
        return (
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio || 'video'}
                onUpdateAspectRatio={handleUpdateRatio}
                className="relative bg-black overflow-hidden group"
            >
                {farmerImage && <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black via-transparent to-transparent">
                    <h2 className={`text-3xl font-bold ${styles.text} mb-2`}>{productData.farmerName || 'Farmer'}</h2>
                    <p className={`${styles.text} opacity-80 leading-relaxed`}>"정직하게 키운 농산물만 보냅니다."</p>
                </div>
            </ResizableImageContainer>
        )
    }

    return (
        <div className={`${styles.bg} ${styles.container} p-8 flex flex-col items-center text-center`}>
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio || 'video'}
                onUpdateAspectRatio={handleUpdateRatio}
                className={`w-full max-w-sm rounded-lg overflow-hidden mb-6 border-4 ${styles.border}`}
            >
                {farmerImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="bg-gray-200 w-full h-full" />}
            </ResizableImageContainer>
            <h2 className={`text-xl font-bold ${styles.text} mb-4`}>{productData.farmerName} 농부의 이야기</h2>
            <p className={`${styles.text} max-w-md leading-relaxed opacity-90`}>자연 그대로의 맛을 전하기 위해<br />365일 땀흘려 키웠습니다.</p>
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

    if (variant === 'A') {
        return (
            <div className="flex flex-col p-10 bg-white border-b border-gray-100 items-center text-center">
                <span className="text-emerald-600 font-bold text-sm mb-3">POINT {index}</span>
                <h3 className="text-3xl font-bold text-gray-900 mb-8 break-keep leading-snug px-4">{title}</h3>
                <ResizableImageContainer
                    aspectRatio={data?.aspectRatio || 16 / 9}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="w-full max-w-3xl rounded-2xl overflow-hidden bg-gray-100 shadow-lg mb-8"
                >
                    {image && <img src={imgSrc} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />}
                </ResizableImageContainer>
                <p className="text-gray-700 leading-relaxed text-lg break-keep max-w-2xl">{description}</p>
            </div>
        );
    }

    if (['B', 'E', 'H'].includes(variant)) {
        return (
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio || 16 / 9}
                onUpdateAspectRatio={handleUpdateRatio}
                className={`relative ${styles.bg} overflow-hidden group`}
            >
                {image && <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 flex flex-col justify-end items-center text-center">
                    <div className={`border ${styles.border} px-4 py-1 rounded-full ${styles.accent} font-bold text-sm mb-4 tracking-widest uppercase backdrop-blur-sm`}>Premium Benefit 0{index}</div>
                    <h3 className={`text-3xl font-black ${styles.text} mb-6 leading-tight max-w-2xl text-shadow-lg`}>{title}</h3>
                    <div className={`w-12 h-1 bg-current ${styles.accent} mb-6`}></div>
                    <p className="text-gray-100 text-lg leading-relaxed max-w-3xl font-medium text-shadow">{description}</p>
                </div>
            </ResizableImageContainer>
        )
    }

    if (['C', 'D', 'F'].includes(variant)) {
        return (
            <div className={`py-16 px-8 ${styles.bg} ${styles.container} flex flex-col items-center text-center`}>
                <span className={`text-xs tracking-widest ${styles.accent} mb-6 border ${styles.border} px-4 py-1.5 rounded-full uppercase`}>Check Point 0{index}</span>
                <h3 className={`text-3xl ${styles.font} ${styles.text} mb-8 px-4 leading-snug`}>{title}</h3>
                <ResizableImageContainer
                    aspectRatio={data?.aspectRatio}
                    onUpdateAspectRatio={handleUpdateRatio}
                    // Default C/F: Pano(21/9), D: Pano/Video? Let's assume Pano as per original code 'aspect-[21/9]' unless square logic
                    className={`w-full max-w-4xl bg-black/5 mb-10 ${variant === 'D' ? 'rounded-2xl' : 'rounded-sm'} overflow-hidden`}
                >
                    {image && <img src={imgSrc} className="w-full h-full object-cover" />}
                </ResizableImageContainer>
                <p className={`${styles.text} opacity-80 text-lg leading-loose max-w-2xl break-keep`}>{description}</p>
            </div>
        )
    }

    if (['G', 'I'].includes(variant)) {
        return (
            <div className={`${styles.bg} ${styles.container} p-8 md:p-12 flex flex-col items-center text-center relative`}>
                <div className={`absolute top-0 left-0 bg-black text-white px-4 py-2 font-bold text-xl z-10 ${variant === 'I' ? 'block' : 'hidden'}`}>{index}</div>
                <h3 className={`text-4xl md:text-5xl font-black ${styles.text} mb-8 uppercase italic`}>{title}</h3>
                <ResizableImageContainer
                    aspectRatio={data?.aspectRatio || 1}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`w-full max-w-lg mb-8 border-4 ${styles.border} shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]`}
                >
                    {image && <img src={imgSrc} className="w-full h-full object-cover" />}
                </ResizableImageContainer>
                <p className={`${styles.text} font-bold text-xl max-w-xl`}>{description}</p>
            </div>
        )
    }

    // Fallback
    return (
        <div className={`${styles.bg} ${styles.container} p-10 flex flex-col items-center text-center`}>
            <span className={`${styles.accent} font-bold mb-4`}>POINT {index}</span>
            <h3 className={`text-2xl ${styles.text} font-bold mb-6`}>{title}</h3>
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio || 16 / 9}
                onUpdateAspectRatio={handleUpdateRatio}
                className="w-full max-w-2xl bg-gray-100 rounded mb-6 overflow-hidden"
            >
                {image && <img src={imgSrc} className="w-full h-full object-cover" />}
            </ResizableImageContainer>
            <p className={`${styles.text} leading-relaxed`}>{description}</p>
        </div>
    );
}

function ComparisonTable({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 6;
    const compImage = images[imageIndex];
    const imgSrc = compImage?.transformedUrl || compImage?.previewUrl;

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <h2 className={`text-xl font-bold ${styles.text} mb-6 text-center`}>Comparison Check</h2>
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio || 21 / 9}
                onUpdateAspectRatio={handleUpdateRatio}
                className="w-full bg-gray-100 rounded-lg overflow-hidden mb-8 shadow-sm relative group"
            >
                {compImage ? <img src={imgSrc} className="w-full h-full object-cover" alt="Comparison" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200"><span>비교 이미지 (선택해주세요)</span></div>}
            </ResizableImageContainer>
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 text-center divide-x divide-gray-200">
                    <div className={`p-4 bg-emerald-50 ${styles.accent} font-bold text-lg`}>우리 상품</div>
                    <div className="p-4 bg-gray-50 text-gray-500 font-medium">일반 상품</div>
                </div>
                <div className={`grid grid-cols-2 text-center divide-x divide-gray-200 border-t border-gray-200 bg-white ${styles.text}`}>
                    <div className="p-4 space-y-1"><p className="text-xs opacity-50 mb-1">당도</p><p className="font-bold text-lg">{productData.sweetness || '14'}Bx</p><p className="text-xs text-emerald-600 font-bold">고당도 보장</p></div>
                    <div className="p-4 space-y-1 bg-gray-50/50"><p className="text-xs opacity-50 mb-1">당도</p><p className="text-gray-400">10~12Bx</p><p className="text-xs text-gray-400">일반 당도</p></div>
                </div>
                {/* ... (rest of table) */}
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

    return (
        <div className={`${styles.bg} ${styles.container} p-8 flex flex-col items-center text-center`}>
            <h2 className={`text-xl font-bold ${styles.text} mb-6`}>SIZE CHECK</h2>
            <div className="w-64 max-w-full">
                <ResizableImageContainer
                    aspectRatio={data?.aspectRatio || 1}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`rounded-full overflow-hidden mb-4 border-4 ${styles.border} ${styles.bg === 'bg-white' ? 'bg-gray-50' : 'bg-white/10'}`}
                >
                    {sizeImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <span className="text-3xl block p-12">📏</span>}
                </ResizableImageContainer>
            </div>
            <p className={`text-2xl font-bold ${styles.accent}`}>{productData.size || '특대'}</p>
            <p className={`${styles.text} opacity-70 mt-2`}>실제 크기는 이미지와 다를 수 있습니다.</p>
        </div>
    );
}

// ... HarvestProcess, SweetnessCheck, TasteTip, EventHighlight, PackagingInfo, CautionNotice, CSInfo
function HarvestProcess({ images, variant }: ModuleProps) { const styles = getThemeStyles(variant); return (<div className={`${styles.bg} ${styles.container} p-8`}><h2 className={`text-xl font-bold ${styles.text} mb-6 text-center`}>Harvest Process</h2><div className="space-y-4">{[1, 2, 3, 4].map(step => (<div key={step} className={`flex items-center gap-4 p-4 border ${styles.border} rounded-lg ${styles.bg === 'bg-white' ? 'bg-gray-50' : 'bg-black/20'}`}><span className={`text-2xl font-black ${styles.accent}`}>0{step}</span><span className={styles.text}>Step Description {step}</span></div>))}</div></div>) }

function SweetnessCheck({ productData, images, variant, data }: ModuleProps) {
    // ...
    const styles = getThemeStyles(variant);
    return (
        <div className={`${styles.bg} ${styles.container} p-8 text-center`}>
            <p className={`${styles.accent} tracking-widest text-sm font-bold mb-2 uppercase`}>Brix Check</p>
            <div className={`text-6xl font-black mb-4 flex justify-center items-start ${styles.text}`}>{productData.sweetness || 14}<span className="text-xl mt-2 opacity-50 ml-1">Bx</span></div>
            <div className={`w-full h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}><div className={`h-full ${styles.bg === 'bg-white' ? 'bg-emerald-500' : 'bg-white'} w-[80%]`}></div></div>
        </div>
    )
}

function TasteTip({ productData, variant }: ModuleProps) { const styles = getThemeStyles(variant); return (<div className={`${styles.bg} ${styles.container} p-8 text-center`}><span className="text-4xl mb-4 block">😋</span><h3 className={`text-xl font-bold ${styles.text} mb-2`}>맛있게 먹는 팁</h3><p className={`${styles.text} opacity-80`}>{productData.storageMethod || '수령 후 바로 냉장보관하세요.'}</p></div>) }
function EventHighlight({ productData, variant }: ModuleProps) { const styles = getThemeStyles(variant); const eventText = productData.eventText || '지금 구매 시 특별 할인 혜택!'; if (variant === 'B') { return (<div className="bg-black p-16 text-center border-y-8 border-yellow-400 relative overflow-hidden group"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 animate-[pulse_3s_infinite]"></div><h3 className="relative text-yellow-400 font-black text-6xl mb-6 tracking-tighter uppercase animate-bounce">SPECIAL OFFER</h3><p className="relative text-white font-bold text-3xl max-w-4xl mx-auto leading-tight">{eventText}</p><div className="mt-8"><span className="inline-block bg-yellow-400 text-black font-black text-xl px-8 py-3 rounded-full transform rotate-[-2deg]">💰 기간 한정 혜택 💰</span></div></div>) } if (variant === 'G') { return (<div className="bg-purple-600 p-16 text-center relative overflow-hidden border-4 border-black"><div className="absolute top-0 right-0 text-9xl opacity-20 rotate-12">🎉</div><div className="absolute bottom-0 left-0 text-9xl opacity-20 -rotate-12">🎁</div><h3 className="text-5xl font-black text-lime-300 mb-6 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] uppercase italic">Limited Event</h3><div className="bg-white border-4 border-black p-6 transform -rotate-1 shadow-[8px_8px_0_rgba(0,0,0,1)] inline-block"><p className="text-black font-bold text-2xl md:text-3xl">{eventText}</p></div></div>) } if (variant === 'J') { return (<div className="bg-red-600 p-16 text-center text-white border-4 border-dashed border-green-400 m-4 rounded-xl shadow-xl relative"><div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-bold px-6 py-2 rounded-full border-2 border-white shadow-lg">SEASON SPECIAL</div><h3 className="text-4xl font-serif font-bold mb-4 mt-2">🎄 특별한 선물 🎄</h3><p className="text-2xl font-medium opacity-90">{eventText}</p></div>) } return (<div className={`${styles.bg} ${styles.container} py-20 px-8 text-center relative overflow-hidden`}>{variant === 'A' && <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-20 animate-pulse"></div>}<div className="relative z-10"><div className="text-6xl mb-6 animate-bounce">🎁</div><h3 className={`text-4xl md:text-5xl font-black ${styles.text} mb-6 leading-tight`}><span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-600 block mb-2">EVENT</span></h3><p className={`${styles.text} text-2xl md:text-3xl font-bold max-w-4xl mx-auto break-keep leading-snug`}>{eventText}</p><div className="mt-8 w-24 h-1 bg-current opacity-30 mx-auto rounded-full"></div><p className={`${styles.text} mt-4 opacity-70`}>기간 한정 혜택을 놓치지 마세요!</p></div></div>) }

function PackagingInfo({ images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 9;
    const packagingImage = images[imageIndex];
    const imgSrc = packagingImage?.transformedUrl || packagingImage?.previewUrl;

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });

    return (
        <div className={`${styles.bg} ${styles.container} p-8`}>
            <h3 className={`text-xl font-bold ${styles.text} mb-4 text-center`}>Safe Delivery</h3>
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio || 16 / 9}
                onUpdateAspectRatio={handleUpdateRatio}
                className="w-full bg-gray-200 rounded-lg overflow-hidden mb-4"
            >
                {packagingImage && <img src={imgSrc} className="w-full h-full object-cover" />}
            </ResizableImageContainer>
            <p className={`${styles.text} text-center opacity-80`}>꼼꼼하게 포장하여 안전하게 배송해드립니다.</p>
        </div>
    )
}

function CautionNotice({ productData, variant }: ModuleProps) { const styles = getThemeStyles(variant); return (<div className={`${styles.bg} ${styles.container} p-8 text-center`}><p className={`text-xs font-bold ${styles.accent} mb-2`}>NOTICE</p><p className={`${styles.text} text-xs opacity-70 leading-loose whitespace-pre-line`}>{productData.cautionText || '단순 변심 반품 불가\n수령 후 즉시 확인 부탁드립니다.'}</p></div>) }
function CSInfo({ productData, variant }: ModuleProps) { const styles = getThemeStyles(variant); return (<div className={`${styles.bg} ${styles.container} p-10 text-center`}><p className={`${styles.accent} text-xs mb-2 font-bold`}>CUSTOMER CENTER</p><p className={`text-3xl font-black ${styles.text} tracking-wider`}>{productData.csPhone || '1588-0000'}</p></div>) }
