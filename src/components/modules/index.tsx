'use client';

import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useBuilder } from '@/context/BuilderContext';
import { ModuleConfig, ProductData, ImageUpload, TEXT_SCALE_VALUES, TextScale, TextStyleOverride } from '@/types';
import { useBuilderStore } from '@/store/useBuilderStore';

type ModuleTextStyleContextValue = {
    moduleId: string;
    getNextTextKey: () => string;
    textStyles: Record<string, TextStyleOverride>;
};

const ModuleTextStyleContext = createContext<ModuleTextStyleContextValue | null>(null);

const TEXT_COLOR_CLASS_PATTERN = /^text-([a-z]+(?:-[a-z0-9]+)*)(?:\/(\d+))?$/;
const TEXT_SIZE_OR_ALIGN_TOKENS = new Set([
    'text-left',
    'text-center',
    'text-right',
    'text-justify',
    'text-start',
    'text-end',
    'text-xs',
    'text-sm',
    'text-base',
    'text-lg',
    'text-xl',
    'text-2xl',
    'text-3xl',
    'text-4xl',
    'text-5xl',
    'text-6xl',
    'text-7xl',
]);

function getThemeColorStyle(className: string): React.CSSProperties {
    const textColorClass = className
        .split(/\s+/)
        .find((token) => {
            if (!token.startsWith('text-')) return false;
            if (TEXT_SIZE_OR_ALIGN_TOKENS.has(token)) return false;
            if (token.startsWith('text-[')) return false;
            return TEXT_COLOR_CLASS_PATTERN.test(token);
        });

    if (!textColorClass) {
        return {};
    }

    const match = textColorClass.match(TEXT_COLOR_CLASS_PATTERN);
    if (!match) {
        return {};
    }

    const [, colorToken, opacityToken] = match;
    const opacity = opacityToken ? Number(opacityToken) : undefined;

    let baseColor: string | undefined;
    if (colorToken === 'primary') baseColor = 'var(--color-primary)';
    else if (colorToken === 'secondary') baseColor = 'var(--color-secondary)';
    else if (colorToken === 'main') baseColor = 'var(--color-text)';
    else if (colorToken === 'white') baseColor = '#ffffff';
    else if (colorToken === 'black') baseColor = '#000000';
    else if (colorToken.startsWith('gray-')) {
        const shade = Number(colorToken.split('-')[1] ?? 500);
        baseColor = shade >= 700 ? 'var(--color-text)' : 'var(--color-muted)';
    }

    if (!baseColor) {
        return {};
    }

    if (!opacity || Number.isNaN(opacity) || opacity >= 100) {
        return { color: baseColor };
    }

    return {
        color: `color-mix(in srgb, ${baseColor} ${opacity}%, transparent)`,
    };
}

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
    const textIndexRef = useRef(0);
    textIndexRef.current = 0;

    const textStyleContext = useMemo<ModuleTextStyleContextValue>(() => ({
        moduleId: module.id,
        getNextTextKey: () => `text-${textIndexRef.current++}`,
        textStyles: (module.data._textStyles as Record<string, TextStyleOverride> | undefined) ?? {},
    }), [module.data, module.id]);

    let renderedModule: React.ReactNode;
    switch (module.type) {
        case 'hero-image': renderedModule = <HeroImage {...commonProps} />; break;
        case 'summary-card': renderedModule = <SummaryCard {...commonProps} />; break;
        case 'review-summary': renderedModule = <ReviewSummary {...commonProps} />; break;
        case 'farmer-story': renderedModule = <FarmerStory {...commonProps} />; break;
        case 'benefit-point-1':
        case 'benefit-point-2':
        case 'benefit-point-3':
            renderedModule = <BenefitPoint index={parseInt(module.type.slice(-1))} {...commonProps} />; break;
        case 'comparison-table': renderedModule = <ComparisonTable {...commonProps} />; break;
        case 'size-guide': renderedModule = <SizeGuide {...commonProps} />; break;
        case 'harvest-process': renderedModule = <HarvestProcess {...commonProps} />; break;
        case 'home-use-notice': renderedModule = <HomeUseNotice {...commonProps} />; break;
        case 'option-list': renderedModule = <OptionList {...commonProps} />; break;
        case 'sweetness-check': renderedModule = <SweetnessCheck {...commonProps} />; break;
        case 'taste-tip': renderedModule = <TasteTip {...commonProps} />; break;
        case 'event-highlight': renderedModule = <EventHighlight {...commonProps} />; break;
        case 'packaging-info': renderedModule = <PackagingInfo {...commonProps} />; break;
        case 'caution-notice': renderedModule = <CautionNotice {...commonProps} />; break;
        case 'cs-info': renderedModule = <CSInfo {...commonProps} />; break;
        default:
            renderedModule = <div className="p-4 bg-gray-800 text-gray-400">Unknown module: {module.type}</div>;
    }

    return (
        <ModuleTextStyleContext.Provider value={textStyleContext}>
            {renderedModule}
        </ModuleTextStyleContext.Provider>
    );
}

// Common props interface
interface ModuleProps {
    productData: ProductData;
    images: ImageUpload[];
    data: Record<string, unknown>;
    variant: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
    onUpdateData?: (data: Record<string, unknown>) => void;
}

// Theme Helper - 5 Layout Templates
// Type A: 더 미니멀 (Apple Style) - 배경 흰색, 여백 중심
// Type B: 솔리드 블록 - 제목 배경에 Primary Color 꽉 채움
// Type C: 라운드 카드 - 연한 배경 위 둥근 흰색 박스 + 그림자
// Type D: 감성 편지 - 1px 실선 테두리 + 손글씨 폰트
// Type E: 보더 라인 - 전체를 감싸는 이중 테두리, 중앙 정렬
const getThemeStyles = (variant: string) => {
    switch (variant) {
        // Type A: 퓨어 프레시 - 과일 본연의 색을 살리는 깔끔한 여백
        case 'A':
            return {
                bg: 'bg-white',
                text: 'text-gray-900',
                accent: 'text-primary',
                border: 'border-gray-100',
                font: 'font-sans tracking-tight',
                container: 'bg-white'
            };

        // Type B: 과즙 팡팡 - 메인 컬러로 가득 채운 생동감
        case 'B':
            return {
                bg: 'bg-primary',
                text: 'text-white',
                accent: 'text-secondary/90',
                border: 'border-white/20',
                font: 'font-black tracking-tight',
                container: 'py-4 relative'
            };

        // Type C: 말랑 쫀득 - 둥글둥글 귀여운 모서리와 부드러운 파스텔
        case 'C':
            return {
                bg: 'bg-secondary',
                text: 'text-gray-800',
                accent: 'text-primary',
                border: 'border-white',
                font: 'font-bold',
                container: 'rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] mx-4 my-4 bg-white border-[6px] border-white/50 relative'
            };

        // Type D: 농부의 진심 - 따뜻한 아이보리 배경과 아날로그 감성
        case 'D':
            return {
                bg: 'bg-[#FDFAEE]',
                text: 'text-[#5C4D42]',
                accent: 'text-primary',
                border: 'border-primary/30',
                font: 'font-serif',
                container: 'border-[2px] border-dashed border-primary/40 mx-4 my-4 rounded-xl shadow-sm bg-white'
            };

        // Type E: 고당도 명품 - 신뢰를 주는 이중 테두리와 프리미엄 분위기
        case 'E':
            return {
                bg: 'bg-white',
                text: 'text-gray-900',
                accent: 'text-primary',
                border: 'border-primary',
                font: 'font-serif tracking-wide',
                container: 'border-[6px] border-double border-primary/30 mx-4 my-4 shadow-xl bg-white relative'
            };

        // Type F: 매거진 픽 - 세련된 에디토리얼 룩, 타임리스 모던
        case 'F':
            return {
                bg: 'bg-white',
                text: 'text-black', // 흑백 대비 극대화
                accent: 'text-primary',
                border: 'border-gray-900',
                font: 'font-serif tracking-tighter', // 명조계열, 좁은 자간으로 세련되게
                container: 'bg-white border-b-2 border-black/10' // 매거진 느낌의 깔끔한 섹션 구분
            };

        // Type G: 팝 아트 - 굵은 테두리와 그림자, 팝하고 통통 튀는 감성
        case 'G':
            return {
                bg: 'bg-white',
                text: 'text-black',
                accent: 'text-primary',
                border: 'border-black',
                font: 'font-black uppercase',
                container: 'border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mx-4 my-4 bg-white relative'
            };

        // Type H: 오가닉 에코 - 친환경 종이 질감, 편안한 자연 색상
        case 'H':
            return {
                bg: 'bg-[#F4EFEA]', // 웜 스톤, 크라프트지 느낌
                text: 'text-[#3E3832]',
                accent: 'text-primary',
                border: 'border-[#E0D5C1]',
                font: 'font-medium',
                container: 'bg-[#FCFAF8] mx-4 my-4 rounded-2xl border-2 border-[#E0D5C1] shadow-sm relative'
            };

        // Type I: 타임 딜 - 세일 강조, 강렬한 액센트, 시선 집중
        case 'I':
            return {
                bg: 'bg-gray-900', // 다크 배경에 형광 엑센트 대비
                text: 'text-white',
                accent: 'text-primary',
                border: 'border-primary',
                font: 'font-black italic tracking-tighter', // 빠르고 강렬한 느낌
                container: 'border-l-4 border-primary bg-gray-800 mx-4 my-4 shadow-lg relative' // 스포츠/딜 느낌 박스
            };

        // Type J: 블랙 라벨 - 최상급 퀄리티, 명품 다크 모드
        case 'J':
            return {
                bg: 'bg-gray-950',
                text: 'text-gray-100',
                accent: 'text-primary',
                border: 'border-gray-800',
                font: 'font-serif tracking-widest',
                container: 'bg-black border border-gray-800 mx-4 my-4 shadow-2xl relative'
            };

        default: return { bg: 'bg-white', text: 'text-gray-900', accent: 'text-primary', border: 'border-gray-100', font: 'font-sans', container: '' };
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
    tag: Tag = 'span',
    textScale = 'normal'
}: {
    value: string;
    onChange?: (value: string) => void;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
    tag?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
    textScale?: TextScale;
}) {
    const moduleTextContext = useContext(ModuleTextStyleContext);
    const textKeyRef = useRef<string | null>(null);
    if (!textKeyRef.current) {
        textKeyRef.current = moduleTextContext?.getNextTextKey() ?? 'text-0';
    }

    const textStyle = moduleTextContext?.textStyles[textKeyRef.current] ?? {};
    const setSelectedTextTarget = useBuilderStore((state) => state.setSelectedTextTarget);
    const themeColorStyle = getThemeColorStyle(className);
    const rgbToHex = (rgb: string) => {
        const matches = rgb.match(/\d+/g);
        if (!matches || matches.length < 3) return '#111827';
        const [r, g, b] = matches.slice(0, 3).map(Number);
        return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    };
    const parseFontWeight = (fontWeight: string) => {
        const parsed = Number.parseInt(fontWeight, 10);
        return Number.isNaN(parsed) ? 400 : parsed;
    };
    const parseLetterSpacing = (letterSpacing: string) => {
        if (!letterSpacing || letterSpacing === 'normal') return 0;
        const parsed = Number.parseFloat(letterSpacing);
        return Number.isNaN(parsed) ? 0 : parsed;
    };
    const parseLineHeight = (lineHeight: string, fontSize: number) => {
        if (!lineHeight || lineHeight === 'normal' || !fontSize) return 1.4;
        const parsed = Number.parseFloat(lineHeight);
        if (Number.isNaN(parsed)) return 1.4;
        if (lineHeight.endsWith('px')) {
            return Number((parsed / fontSize).toFixed(2));
        }
        return Number(parsed.toFixed(2));
    };
    const getResolvedTextAlign = (textAlign: string): 'left' | 'center' | 'right' => {
        if (textAlign === 'center') return 'center';
        if (textAlign === 'right' || textAlign === 'end') return 'right';
        return 'left';
    };

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

    // Determine font based on tag - titles use title font, body uses body font
    const isTitle = ['h1', 'h2', 'h3', 'h4'].includes(Tag);
    const fontFamily = isTitle ? 'var(--font-title)' : 'var(--font-body)';
    const scaleValue = TEXT_SCALE_VALUES[textScale];
    const hasCustomColor = !!textStyle.color;
    const hasCustomFontSize = !!textStyle.fontSize;
    const hasCustomFontWeight = typeof textStyle.fontWeight === 'number';
    const hasCustomTextAlign = !!textStyle.textAlign;
    const hasCustomLetterSpacing = typeof textStyle.letterSpacing === 'number';
    const hasCustomLineHeight = typeof textStyle.lineHeight === 'number';

    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
                if (!moduleTextContext || !textKeyRef.current) return;
                const computedStyle = window.getComputedStyle(e.currentTarget);
                setSelectedTextTarget({
                    moduleId: moduleTextContext.moduleId,
                    textKey: textKeyRef.current,
                    textValue: value,
                    style: textStyle,
                    resolvedColor: computedStyle ? rgbToHex(computedStyle.color) : undefined,
                    resolvedFontSize: computedStyle ? Number.parseFloat(computedStyle.fontSize) : undefined,
                    resolvedFontWeight: computedStyle ? parseFontWeight(computedStyle.fontWeight) : undefined,
                    resolvedTextAlign: computedStyle ? getResolvedTextAlign(computedStyle.textAlign) : undefined,
                    resolvedLetterSpacing: computedStyle ? parseLetterSpacing(computedStyle.letterSpacing) : undefined,
                    resolvedLineHeight: computedStyle
                        ? parseLineHeight(computedStyle.lineHeight, Number.parseFloat(computedStyle.fontSize))
                        : undefined,
                });
            }}
            data-editable-text="true"
            data-module-id={moduleTextContext?.moduleId}
            data-text-key={textKeyRef.current}
            data-has-custom-color={hasCustomColor ? 'true' : 'false'}
            data-has-custom-font-size={hasCustomFontSize ? 'true' : 'false'}
            data-has-custom-font-weight={hasCustomFontWeight ? 'true' : 'false'}
            data-has-custom-text-align={hasCustomTextAlign ? 'true' : 'false'}
            data-has-custom-letter-spacing={hasCustomLetterSpacing ? 'true' : 'false'}
            data-has-custom-line-height={hasCustomLineHeight ? 'true' : 'false'}
            className={`${className} ${multiline ? 'whitespace-pre-wrap break-words' : ''} ${hasCustomColor ? 'editable-text-custom-color' : ''} ${hasCustomFontSize ? 'editable-text-custom-size' : ''} ${hasCustomFontWeight ? 'editable-text-custom-weight' : ''} ${hasCustomTextAlign ? 'editable-text-custom-align' : ''} ${hasCustomLetterSpacing ? 'editable-text-custom-letter-spacing' : ''} ${hasCustomLineHeight ? 'editable-text-custom-line-height' : ''} outline-none cursor-text hover:ring-2 hover:ring-blue-400/50 focus:ring-2 focus:ring-blue-500 rounded px-1 -mx-1 transition-all`}
            style={{
                minWidth: '20px',
                fontFamily,
                ...themeColorStyle,
                color: textStyle.color ?? themeColorStyle.color,
                fontSize: textStyle.fontSize ? `${textStyle.fontSize}px` : undefined,
                fontWeight: textStyle.fontWeight,
                textAlign: textStyle.textAlign,
                letterSpacing: typeof textStyle.letterSpacing === 'number' ? `${textStyle.letterSpacing}px` : undefined,
                lineHeight: textStyle.lineHeight,
                ['--editable-custom-color' as string]: textStyle.color ?? undefined,
                ['--editable-custom-font-size' as string]: textStyle.fontSize ? `${textStyle.fontSize}px` : undefined,
                ['--editable-custom-font-weight' as string]: textStyle.fontWeight ? `${textStyle.fontWeight}` : undefined,
                ['--editable-custom-text-align' as string]: textStyle.textAlign ?? undefined,
                ['--editable-custom-letter-spacing' as string]: typeof textStyle.letterSpacing === 'number' ? `${textStyle.letterSpacing}px` : undefined,
                ['--editable-custom-line-height' as string]: textStyle.lineHeight ? `${textStyle.lineHeight}` : undefined,
            }}
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
            className={`${className} ${isDragOver ? 'ring-4 ring-blue-400 scale-[1.02]' : ''} transition-all`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            {children}
            {isDragOver && (
                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center z-50 pointer-events-none">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
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

    const handleStyle = "absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full z-50 opacity-0 group-hover/resize:opacity-100 transition-opacity cursor-ns-resize shadow-md hover:scale-125 hover:bg-blue-50 no-capture";

    const containerRef = useRef<HTMLDivElement>(null);

    // [Fix] Enforce explicit pixel height for html2canvas compatibility
    // html2canvas often ignores 'aspect-ratio' CSS, causing images to explode in height.
    // We calculate the pixel height manually and set it as an inline style.
    useEffect(() => {
        const updateHeight = () => {
            if (!containerRef.current) return;
            const ratio = getNumericRatio(aspectRatio);
            const width = containerRef.current.offsetWidth;
            if (width && ratio) {
                containerRef.current.style.height = `${width / ratio}px`;
            }
        };

        // Initial calc
        updateHeight();

        // Observer for resize
        const observer = new ResizeObserver(updateHeight);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [aspectRatio]);

    return (
        <div
            ref={containerRef}
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
                    <div className="absolute inset-0 border-2 border-blue-500 opacity-0 group-hover/resize:opacity-30 pointer-events-none z-40 transition-opacity no-capture" />
                </>
            )}
        </div >
    );
}


// ====== INTRO Modules ======

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
                    <div className="absolute top-4 left-4 bg-blue-600 text-white font-black text-xl px-2 py-1 rotate-[-5deg] border-2 border-black">NEW!</div>
                </ResizableImageContainer>
            </DroppableImageZone>
        )
    }

    return (
        <DroppableImageZone onDrop={handleImageDrop} className="relative">
            <ResizableImageContainer
                aspectRatio={data?.aspectRatio as number}
                onUpdateAspectRatio={handleUpdateRatio}
                className={`overflow-hidden ${variant === 'D' ? 'w-[calc(100%-3rem)] mx-auto my-6 bg-rose-50 border border-gray-100 rounded-2xl' : `w-full ${variant === 'I' ? 'mx-4 my-4 border-x-2 border-black' : 'bg-gray-100'}`}`}
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

function SummaryCard({ productData, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);

    const getPoint = (idx: number) => ({
        label: (data?.[`label${idx}`] as string) || (idx === 1 ? '원산지' : idx === 2 ? '당도' : '크기'),
        value: (data?.[`value${idx}`] as string) || (idx === 1 ? '국내산' : idx === 2 ? '15브릭스' : '특대'),
        desc: (data?.[`desc${idx}`] as string) || '최상급 품격 선별'
    });

    const handleUpdate = (field: string) => (val: string) => {
        onUpdateData && onUpdateData({ [field]: val });
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-10 pb-[50px]`}>
            <div className={`grid grid-cols-3 gap-6 text-center`}>
                {[1, 2, 3].map(i => {
                    const point = getPoint(i);
                    return (
                        <div key={i} className="flex flex-col items-center px-4">
                            <EditableText
                                value={point.label}
                                onChange={handleUpdate(`label${i}`)}
                                className={`${styles.accent} text-[8px] font-black uppercase tracking-widest mb-2 opacity-70`}
                                tag="p"
                                multiline
                            />
                            <EditableText
                                value={point.value}
                                onChange={handleUpdate(`value${i}`)}
                                className={`${styles.text} font-black text-lg mb-1`}
                                tag="p"
                                multiline
                            />
                            <EditableText
                                value={point.desc}
                                onChange={handleUpdate(`desc${i}`)}
                                className="text-gray-400 text-[8px] font-bold"
                                tag="p"
                                multiline
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ReviewSummary({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const layoutMode = (data?.layoutMode as string) || 'horizontal';

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

    if (layoutMode === 'vertical') {
        return (
            <div className={`${styles.bg} ${styles.container} p-10 pb-[50px]`}>
                <div className="max-w-md mx-auto space-y-4">
                    <EditableText value={(data?.sectionTitle as string) || '리얼 후기'} onChange={(v) => onUpdateData && onUpdateData({ sectionTitle: v })} className={`${styles.text} text-center mb-6 font-bold block`} tag="h3" multiline />
                    {[0, 1, 2].map(i => {
                        const review = getReviewData(i);
                        const img = images[review.imgIdx];
                        const imgSrc = img?.transformedUrl || img?.previewUrl;

                        return (
                            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                                <DroppableImageZone onDrop={handleImageDrop(i)} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 text-[8px] text-gray-400">
                                    {img ? (
                                        <img src={imgSrc} className="w-full h-full object-contain bg-white" alt="리뷰 이미지" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">드롭</div>
                                    )}
                                </DroppableImageZone>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <EditableText value={review.title} onChange={handleUpdateText(i, 'title')} className="text-gray-900 font-bold text-sm" tag="h4" />
                                    <EditableText value={review.text} onChange={handleUpdateText(i, 'text')} className="text-gray-500 text-xs" tag="p" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.bg} ${styles.container} p-8 pb-[50px]`}>
            <div className="text-center mb-8">
                <EditableText value={(data?.sectionTitle as string) || '구매자가 증명하는 맛'} onChange={(v) => onUpdateData && onUpdateData({ sectionTitle: v })} className={`${styles.text} text-xl font-bold block`} tag="h3" multiline />
            </div>
            <div className="grid grid-cols-3 gap-4 auto-rows-fr">
                {[0, 1, 2].map(i => {
                    const review = getReviewData(i);
                    const img = images[review.imgIdx];
                    const imgSrc = img?.transformedUrl || img?.previewUrl;

                    return (
                        <div key={i} className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50 flex flex-col">
                            <DroppableImageZone onDrop={handleImageDrop(i)}>
                                <ResizableImageContainer
                                    aspectRatio={1}
                                    onUpdateAspectRatio={(r) => onUpdateData && onUpdateData({ [`aspectRatio${i + 1}`]: r })}
                                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 text-[10px] text-gray-400"
                                >
                                    {img ? (
                                        <img src={imgSrc} className="w-full h-full object-cover rounded-xl" alt="리뷰 이미지" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">사진 드래그</div>
                                    )}
                                </ResizableImageContainer>
                            </DroppableImageZone>
                            <EditableText value={review.title} onChange={handleUpdateText(i, 'title')} className="text-gray-800 font-bold mb-1 text-sm" tag="h4" />
                            <EditableText value={review.text} onChange={handleUpdateText(i, 'text')} className="text-gray-500 text-xs line-clamp-3" tag="p" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FarmerStory({ productData, images, variant, data, onUpdateData }: ModuleProps) {
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 1;
    const farmerImage = images[imageIndex];
    const imgSrc = farmerImage?.transformedUrl || farmerImage?.previewUrl;
    const styles = getThemeStyles(variant);

    const farmerName = (data?.farmerName as string) || '생산자';
    const storyText = (data?.storyText as string) || '"정직하게 키운 농산물만 보냅니다."';

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });
    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    if (variant === 'B' || variant === 'H' || variant === 'E') {
        return (
            <DroppableImageZone onDrop={handleImageDrop} className={`relative ${styles.bg} pb-[50px]`}>
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 'video')}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="relative w-full bg-black overflow-hidden"
                >
                    {farmerImage ? <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-400">이미지 드롭</div>}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black via-transparent to-transparent">
                        <EditableText value={farmerName} onChange={handleTextChange('farmerName')} className={`text-3xl font-bold ${styles.text} mb-2`} tag="h2" />
                        <EditableText value={storyText} onChange={handleTextChange('storyText')} className={`${styles.text} opacity-80 leading-relaxed`} tag="p" multiline />
                    </div>
                </ResizableImageContainer>
            </DroppableImageZone>
        )
    }

    return (
        <div className={`${styles.bg} ${styles.container} p-8 flex flex-col items-center text-center pb-[50px]`}>
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

    if (variant === 'A') {
        return (
            <div className="flex flex-col p-10 sm:p-14 bg-white border-b border-gray-100 items-center text-center pb-[50px]">
                <span className={`${styles.accent} font-bold text-base mb-3`}>포인트 0{index}</span>
                <EditableText value={title} onChange={handleTextChange('title')} className="text-3xl sm:text-4xl font-black text-main mb-8 break-keep leading-tight px-4" tag="h3" multiline />
                <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-4xl mb-8">
                    <ResizableImageContainer
                        aspectRatio={getDataAspectRatio(data, 16 / 9)}
                        onUpdateAspectRatio={handleUpdateRatio}
                        className="w-full rounded-2xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100"
                    >
                        {image ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-video">사진 드래그</div>}
                    </ResizableImageContainer>
                </DroppableImageZone>
                <EditableText value={description} onChange={handleTextChange('description')} className="text-main/70 leading-relaxed text-lg break-keep max-w-2xl px-4" tag="p" multiline />
            </div>
        );
    }

    if (['B', 'E', 'H'].includes(variant)) {
        return (
            <DroppableImageZone onDrop={handleImageDrop} className={`relative ${styles.bg} pb-[50px]`}>
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 16 / 9)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`relative w-full ${styles.bg} overflow-hidden`}
                >
                    {image ? <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gray-700" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 flex flex-col justify-end items-center text-center">
                        <div className={`border ${styles.border} px-4 py-1 rounded-full ${styles.accent} font-bold text-sm mb-4 tracking-widest uppercase backdrop-blur-sm`}>포인트 0{index}</div>
                        <EditableText value={title} onChange={handleTextChange('title')} className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight max-w-2xl" tag="h3" multiline />
                        <div className={`w-12 h-1 ${styles.bg === 'bg-primary' ? 'bg-secondary' : 'bg-primary'} mb-6 opacity-80`}></div>
                        <EditableText value={description} onChange={handleTextChange('description')} className="text-white opacity-90 text-lg leading-relaxed max-w-3xl font-medium" tag="p" multiline />
                    </div>
                </ResizableImageContainer>
            </DroppableImageZone>
        )
    }

    if (['C', 'D', 'F'].includes(variant)) {
        return (
            <div className={`py-16 px-8 ${styles.bg} ${styles.container} flex flex-col items-center text-center pb-[50px]`}>
                <span className={`text-sm tracking-widest ${styles.accent} mb-6 border ${styles.border} px-4 py-1.5 rounded-full uppercase font-bold`}>체크포인트 0{index}</span>
                <EditableText value={title} onChange={handleTextChange('title')} className={`text-3xl sm:text-4xl ${styles.font} ${styles.text} mb-8 px-4 leading-snug font-black`} tag="h3" multiline />
                <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-4xl mb-10">
                    <ResizableImageContainer
                        aspectRatio={getDataAspectRatio(data, 16 / 9)}
                        onUpdateAspectRatio={handleUpdateRatio}
                        className={`w-full bg-black/5 ${variant === 'D' ? 'rounded-2xl shadow-sm' : 'rounded-sm'} overflow-hidden border ${styles.border}`}
                    >
                        {image ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-video">이미지 드롭</div>}
                    </ResizableImageContainer>
                </DroppableImageZone>
                <EditableText value={description} onChange={handleTextChange('description')} className={`${styles.text} opacity-80 text-lg leading-relaxed max-w-2xl break-keep px-4`} tag="p" multiline />
            </div>
        )
    }

    if (['G', 'I'].includes(variant)) {
        return (
            <div className={`${styles.bg} ${styles.container} p-8 md:p-12 flex flex-col items-center text-center relative pb-[50px]`}>
                <div className={`absolute top-0 left-0 bg-black text-white px-4 py-2 font-bold text-2xl z-10 ${variant === 'I' ? 'block' : 'hidden'}`}>{index}</div>
                <EditableText value={title} onChange={handleTextChange('title')} className={`text-5xl md:text-6xl font-black ${styles.text} mb-8 uppercase italic`} tag="h3" multiline />
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
        <div className={`${styles.bg} ${styles.container} p-10 flex flex-col items-center text-center pb-[50px]`}>
            <span className={`${styles.accent} font-bold text-lg mb-4`}>포인트 {index}</span>
            <EditableText value={title} onChange={handleTextChange('title')} className={`text-3xl ${styles.text} font-bold mb-6`} tag="h3" multiline />
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
    const rowCount = (data?.rowCount as number) || 3;
    const ourImageIndex = typeof data?.ourImageIndex === 'number' ? (data.ourImageIndex as number) : 0;
    const competitorImageIndex = typeof data?.competitorImageIndex === 'number' ? (data.competitorImageIndex as number) : 1;

    const ourImage = images[ourImageIndex];
    const competitorImage = images[competitorImageIndex];
    const ourImgSrc = ourImage?.transformedUrl || ourImage?.previewUrl;
    const competitorImgSrc = competitorImage?.transformedUrl || competitorImage?.previewUrl;

    const handleUpdate = (field: string) => (val: string) => {
        onUpdateData && onUpdateData({ [field]: val });
    };

    const handleImageDrop = (field: 'ourImageIndex' | 'competitorImageIndex') => (idx: number) => {
        onUpdateData && onUpdateData({ [field]: idx });
    };

    const isSolid = variant === 'B';

    return (
        <div className={`${styles.bg} ${styles.container} p-10 pb-[50px]`}>
            <div className="text-center mb-10">
                <EditableText value={(data?.compareLabel as string) || '품질 비교'} onChange={handleUpdate('compareLabel')} className={`${styles.accent} text-[13px] font-bold tracking-[0.2em] uppercase mb-2 block`} tag="p" />
                <EditableText value={(data?.compareTitle as string) || '압도적인 품질 차이'} onChange={handleUpdate('compareTitle')} className={`${styles.text} text-3xl font-black mb-1 block`} tag="h2" multiline />
                <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-10">
                <div className="flex flex-col">
                    <DroppableImageZone onDrop={handleImageDrop('ourImageIndex')}>
                        <ResizableImageContainer aspectRatio={1} className="bg-gray-50 rounded-2xl overflow-hidden border-4 border-primary shadow-md">
                            {ourImage ? (
                                <img src={ourImgSrc} className="w-full h-full object-cover rounded-2xl" alt="우리 상품" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                    <span className="text-3xl">📥</span>
                                    <span className="text-xs font-bold text-primary">우리 상품</span>
                                </div>
                            )}
                        </ResizableImageContainer>
                    </DroppableImageZone>
                </div>
                <div className="flex flex-col">
                    <DroppableImageZone onDrop={handleImageDrop('competitorImageIndex')}>
                        <ResizableImageContainer aspectRatio={1} className="bg-gray-50 rounded-2xl overflow-hidden border-4 border-gray-200 shadow-md">
                            {competitorImage ? (
                                <img src={competitorImgSrc} className="w-full h-full object-cover rounded-2xl" alt="경쟁사 상품" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                                    <span className="text-3xl grayscale">📤</span>
                                    <span className="text-xs font-bold">일반 상품</span>
                                </div>
                            )}
                        </ResizableImageContainer>
                    </DroppableImageZone>
                </div>
            </div>

            <div className={`overflow-hidden rounded-3xl border-2 ${isSolid ? 'border-secondary/30' : 'border-gray-100'} shadow-2xl bg-white w-full mx-auto`}>
                <div className="grid grid-cols-2 text-center">
                    <div className={`p-5 ${isSolid ? 'bg-secondary text-primary' : 'bg-primary text-white'} font-black text-lg shadow-inner`}>
                        <EditableText value={(data?.headerOur as string) || '우리 상품'} onChange={handleUpdate('headerOur')} tag="span" />
                    </div>
                    <div className="p-5 bg-gray-100 text-gray-400 font-bold border-l border-white/50">
                        <EditableText value={(data?.headerComp as string) || '일반 상품'} onChange={handleUpdate('headerComp')} tag="span" />
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {Array.from({ length: rowCount }).map((_, i) => (
                        <div key={i} className="grid grid-cols-2 group relative">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <EditableText
                                    value={(data?.[`row${i + 1}Title`] as string) || (i === 0 ? '당도' : i === 1 ? '선별' : '산지')}
                                    onChange={handleUpdate(`row${i + 1}Title`)}
                                    className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-gray-400 border border-gray-100 shadow-sm min-w-[50px] text-center"
                                    tag="p"
                                />
                            </div>
                            <div className="p-8 text-center border-r border-gray-100">
                                <EditableText
                                    value={(data?.[`row${i + 1}Our`] as string) || '프리미엄급'}
                                    onChange={handleUpdate(`row${i + 1}Our`)}
                                    className={`${isSolid ? 'text-primary' : 'text-gray-900'} font-black text-xl leading-snug break-keep`}
                                    tag="p"
                                />
                            </div>
                            <div className="p-8 text-center bg-gray-50/30 flex items-center justify-center">
                                <EditableText
                                    value={(data?.[`row${i + 1}Comp`] as string) || '일반 등급'}
                                    onChange={handleUpdate(`row${i + 1}Comp`)}
                                    className="text-gray-400 font-bold text-base break-keep"
                                    tag="p"
                                />
                            </div>
                        </div>
                    ))}
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

    const isSolid = variant === 'B';

    return (
        <div className={`${styles.bg} ${styles.container} p-10 flex flex-col items-center text-center`}>
            <EditableText value={(data?.guideTitle as string) || '사이즈 안내'} onChange={(v) => onUpdateData && onUpdateData({ guideTitle: v })} className={`text-xl font-bold ${styles.text} mb-8 uppercase tracking-widest block`} tag="h2" multiline />
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-64 max-w-full">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 1)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`rounded-full overflow-hidden mb-6 border-4 ${isSolid ? 'border-secondary shadow-lg' : styles.border} ${styles.bg === 'bg-white' ? 'bg-gray-50' : 'bg-white/10'}`}
                >
                    {sizeImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-square">이미지 드롭</div>}
                </ResizableImageContainer>
            </DroppableImageZone>
            <EditableText
                value={(data?.size as string) || '특대형'}
                onChange={(v) => onUpdateData && onUpdateData({ size: v })}
                className={`text-3xl font-black ${isSolid ? 'text-white' : styles.accent} mb-2`}
                tag="p"
            />
            <EditableText value={(data?.guideNote as string) || '실제 크기는 이미지와 다를 수 있습니다.'} onChange={(v) => onUpdateData && onUpdateData({ guideNote: v })} className={`${styles.text} opacity-60 text-sm italic block`} tag="p" />
        </div>
    );
}

// ... HarvestProcess, SweetnessCheck, TasteTip, EventHighlight, PackagingInfo, CautionNotice, CSInfo
function HomeUseNotice({ images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const imageIndex = typeof data?.imageIndex === 'number' ? (data.imageIndex as number) : 0;
    const noticeImage = images[imageIndex];
    const imgSrc = noticeImage?.transformedUrl || noticeImage?.previewUrl;
    const isSolid = variant === 'B';

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });
    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    const title = (data?.title as string) || '가정용/실속형 상품 안내';
    const subtitle = (data?.subtitle as string) || '모양은 조금 못나도 맛과 영양은 정품 그대로!';
    const description = (data?.description as string) || '크기가 일정하지 않거나 약간의 흠집이 있을 수 있지만, 집에서 편하게 드시기 좋은 가성비 최고 등급입니다.';

    return (
        <div className={`${styles.bg} ${styles.container} p-10 sm:p-14 text-center pb-[50px]`}>
            <div className="mb-8">
                <span className="text-4xl mb-4 block">👨‍👩‍👧‍👦</span>
                <EditableText
                    value={title}
                    onChange={handleTextChange('title')}
                    className={`${isSolid ? 'text-white/80' : styles.accent} tracking-[0.1em] text-sm font-black mb-3 uppercase`}
                    tag="p"
                />
                <EditableText
                    value={subtitle}
                    onChange={handleTextChange('subtitle')}
                    className={`text-2xl sm:text-3xl font-black ${styles.text} mb-4 break-keep leading-snug`}
                    tag="h3"
                    multiline
                />
                <EditableText
                    value={description}
                    onChange={handleTextChange('description')}
                    className={`text-base ${styles.text} opacity-80 break-keep max-w-lg mx-auto leading-relaxed`}
                    tag="p"
                    multiline
                />
            </div>

            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-2xl mx-auto">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 16 / 9)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`w-full rounded-2xl overflow-hidden shadow-md border-4 ${isSolid ? 'border-white/20' : styles.border}`}
                >
                    {noticeImage ? (
                        <img src={imgSrc} className="w-full h-full object-cover" alt="실속형 안내" />
                    ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${isSolid ? 'bg-white/10 text-white/50' : 'bg-gray-100 text-gray-400'} p-8 aspect-video`}>
                            <span className="text-4xl mb-2">📸</span>
                            <span className="text-sm font-bold mb-1">실제 상품 사진</span>
                            <span className="text-xs opacity-80">이미지를 드래그하세요</span>
                        </div>
                    )}
                </ResizableImageContainer>
            </DroppableImageZone>
            <p className={`${styles.text} mt-4 text-sm opacity-60 font-medium italic`}>실제 발송되는 상품의 예시 이미지입니다.</p>
        </div>
    );
}

function OptionList({ variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const optionCount = typeof data?.optionCount === 'number' ? (data.optionCount as number) : 3;
    const isSolid = variant === 'B';

    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    const updateOptionCount = (delta: number) => {
        if (!onUpdateData) return;
        const newCount = Math.max(1, Math.min(5, optionCount + delta));
        onUpdateData({ optionCount: newCount });
    };

    return (
        <div className={`${styles.bg} ${styles.container} p-8 sm:p-12 pb-[50px] relative group`}>
            {/* Control Panel (Visible on Hover in Editor) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <span className="text-xs font-bold mr-1">옵션 수량</span>
                <button type="button" onClick={() => updateOptionCount(-1)} className="w-5 h-5 flex items-center justify-center bg-white/40 hover:bg-white/60 rounded-full text-xs font-bold leading-none">-</button>
                <span className="text-xs font-bold w-3 text-center">{optionCount}</span>
                <button type="button" onClick={() => updateOptionCount(1)} className="w-5 h-5 flex items-center justify-center bg-white/40 hover:bg-white/60 rounded-full text-xs font-bold leading-none">+</button>
            </div>

            <div className="text-center mb-8">
                <span className="text-4xl mb-3 block">📦</span>
                <h3 className={`text-2xl font-black ${styles.text} uppercase tracking-widest`}>
                    <EditableText value={(data?.title as string) || '옵션/구성 안내'} onChange={handleTextChange('title')} />
                </h3>
                <div className={`w-12 h-1 ${isSolid ? 'bg-secondary' : 'bg-primary'} mx-auto mt-4 rounded-full`}></div>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
                {Array.from({ length: optionCount }).map((_, index) => (
                    <div key={index} className={`flex flex-col sm:flex-row items-center sm:items-stretch gap-2 sm:gap-6 p-6 sm:p-7 rounded-2xl border ${isSolid ? 'border-white/10 bg-white/5 shadow-inner' : `${styles.border} ${styles.bg === 'bg-white' ? 'bg-gray-50/50' : 'bg-white/50'} shadow-sm`}`}>
                        <div className="flex-1 w-full text-center sm:text-left flex flex-col justify-center">
                            <EditableText
                                value={(data?.[`optionTitle${index + 1}`] as string) || `프리미엄 세트 ${index + 1}`}
                                onChange={handleTextChange(`optionTitle${index + 1}`)}
                                className={`font-black text-2xl sm:text-3xl ${styles.text} block mb-2 break-keep tracking-tight`}
                                tag="h4"
                            />
                            <EditableText
                                value={(data?.[`optionDesc${index + 1}`] as string) || '중과 1.5kg (7~9과) + 포장용기'}
                                onChange={handleTextChange(`optionDesc${index + 1}`)}
                                className={`${styles.text} opacity-80 text-sm sm:text-base font-medium break-keep`}
                                tag="p"
                            />
                        </div>
                        <div className="flex items-center justify-center sm:justify-end sm:w-32 mt-4 sm:mt-0 font-black text-xl sm:text-2xl border-t sm:border-t-0 border-gray-100/30 pt-4 sm:pt-0">
                            <EditableText
                                value={(data?.[`optionPrice${index + 1}`] as string) || '29,900원'}
                                onChange={handleTextChange(`optionPrice${index + 1}`)}
                                className={isSolid ? 'text-white' : 'text-primary drop-shadow-sm'}
                                tag="span"
                            />
                        </div>
                    </div>
                ))}
            </div>
            {optionCount === 5 && (
                <p className={`${styles.text} mt-6 text-center text-xs opacity-50 font-bold`}>최대 5개 옵션까지 설정 가능합니다.</p>
            )}
        </div>
    );
}

function HarvestProcess({ images, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const isSolid = variant === 'B';

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
        <div className={`${styles.bg} ${styles.container} p-8 sm:p-12`}>
            <h2 className={`text-xl font-bold ${styles.text} mb-8 text-center uppercase tracking-widest`}>수확 프로세스</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
                {[0, 1, 2, 3].map(stepIndex => (
                    <div key={stepIndex} className={`flex items-start gap-4 p-5 border ${isSolid ? 'border-white/10 bg-white/5' : `${styles.border} ${styles.bg === 'bg-white' ? 'bg-gray-50' : 'bg-black/10'}`} rounded-xl`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black ${isSolid ? 'bg-secondary text-primary' : `${styles.accent} ${styles.bg === 'bg-white' ? 'bg-primary/5' : 'bg-white/10'}`}`}>
                            {stepIndex + 1}
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
                                className={`${styles.text} opacity-70 text-sm leading-relaxed`}
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
    const isSolid = variant === 'B';

    const handleUpdateRatio = (r: number) => onUpdateData && onUpdateData({ aspectRatio: r });
    const handleImageDrop = (idx: number) => onUpdateData && onUpdateData({ imageIndex: idx });

    return (
        <div className={`${styles.bg} ${styles.container} p-10 sm:p-14 text-center`}>
            <div className="mb-10">
                <EditableText value={(data?.brixLabel as string) || '당도 체크'} onChange={(v) => onUpdateData && onUpdateData({ brixLabel: v })} className={`${isSolid ? 'text-white/60' : styles.accent} tracking-[0.2em] text-[10px] font-black mb-3 uppercase block`} tag="p" multiline />
                <div className={`flex justify-center items-baseline gap-1 mb-6 ${styles.text}`}>
                    <EditableText
                        value={(data?.sweetness as string) || '14'}
                        onChange={(v) => onUpdateData && onUpdateData({ sweetness: v })}
                        className="text-7xl font-black"
                        tag="span"
                    />
                    <EditableText value={(data?.brixUnit as string) || '브릭스'} onChange={(v) => onUpdateData && onUpdateData({ brixUnit: v })} className="text-xl font-bold opacity-50 inline-block" tag="span" />
                </div>
                <div className={`w-full max-w-xs mx-auto h-2.5 rounded-full overflow-hidden ${styles.bg === 'bg-white' ? 'bg-gray-100' : 'bg-black/20'}`}>
                    <div className={`h-full ${isSolid ? 'bg-white' : 'bg-primary'} w-[85%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]`}></div>
                </div>
            </div>

            {/* Brix Image Section */}
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full max-w-sm mx-auto">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 1)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className={`w-full rounded-2xl overflow-hidden shadow-xl border-4 ${isSolid ? 'border-white/20' : styles.border}`}
                >
                    {brixImage ? (
                        <img src={imgSrc} className="w-full h-full object-cover" alt="당도 측정" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 aspect-square">
                            <span className="text-4xl mb-2">📊</span>
                            <EditableText value={(data?.imageCaption as string) || '당도 측정 사진'} onChange={(v) => onUpdateData && onUpdateData({ imageCaption: v })} className="text-sm block" tag="span" />
                            <span className="text-xs mt-1 opacity-60">이미지를 드래그하세요</span>
                        </div>
                    )}
                </ResizableImageContainer>
            </DroppableImageZone>

            <EditableText value={(data?.brixNote as string) || '비파괴 당도 선별기로 측정한 고당도 과일만 보내드립니다.'} onChange={(v) => onUpdateData && onUpdateData({ brixNote: v })} className={`${styles.text} mt-8 text-sm opacity-60 font-medium italic block`} tag="p" />
        </div>
    );
}

function TasteTip({ productData, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const isSolid = variant === 'B';

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
        <div className={`${styles.bg} ${styles.container} p-8 sm:p-12`}>
            <div className="text-center mb-8">
                <span className="text-4xl mb-3 block">😋</span>
                <h3 className={`text-2xl font-black ${styles.text} uppercase tracking-widest`}>맛있게 먹는 법</h3>
            </div>
            <div className="space-y-3 max-w-2xl mx-auto">
                {[0, 1, 2, 3].map(index => (
                    <div key={index} className={`flex items-start gap-4 p-4 rounded-xl border ${isSolid ? 'border-white/10 bg-white/10' : `${styles.border} ${styles.bg === 'bg-white' ? 'bg-blue-50/50' : 'bg-white/5'}`}`}>
                        <span className={`${isSolid ? 'text-white' : styles.accent} text-lg font-bold`}>✓</span>
                        <EditableText
                            value={getTipData(index)}
                            onChange={handleTextChange(index)}
                            className={`${styles.text} text-base flex-1 opacity-90`}
                            tag="p"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
function EventHighlight({ productData, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const eventTitle = (data?.eventTitle as string) || 'SPECIAL EVENT';
    const eventText = (data?.eventText as string) || productData.eventText || '지금 구매 시 특별 할인 혜택!';
    const badgeText = (data?.badgeText as string) || '💰 기간 한정 혜택 💰';

    const handleTextChange = (field: string) => (value: string) => {
        onUpdateData && onUpdateData({ [field]: value });
    };

    return (
        <div className={`${styles.bg} ${styles.container} py-16 px-8 text-center relative overflow-hidden`}>
            {/* Template specific background decorations without animation */}
            {variant === 'B' && <div className="absolute inset-0 bg-primary/10" />}

            <div className="relative z-10">
                <EditableText
                    value={eventTitle}
                    onChange={handleTextChange('eventTitle')}
                    className={`${styles.accent} font-black text-4xl md:text-5xl mb-4 tracking-tighter uppercase block`}
                    tag="h3"
                    multiline
                />

                <EditableText
                    value={eventText}
                    onChange={handleTextChange('eventText')}
                    className={`${styles.text} text-2xl md:text-3xl font-bold max-w-4xl mx-auto break-keep leading-snug whitespace-pre-line block mb-8`}
                    tag="p"
                    multiline
                />

                <div className="inline-block">
                    <div className={`${variant === 'B' ? 'bg-secondary text-primary' : (variant === 'E' ? 'border-2 border-primary text-primary' : 'bg-primary text-white')} font-bold text-lg px-8 py-3 rounded-full shadow-sm`}>
                        <EditableText
                            value={badgeText}
                            onChange={handleTextChange('badgeText')}
                            className="whitespace-pre-line"
                            multiline
                        />
                    </div>
                </div>

                <EditableText value={(data?.eventNote as string) || '본 이벤트는 조기 종료될 수 있습니다.'} onChange={handleTextChange('eventNote')} className={`${styles.text} mt-6 opacity-60 text-sm block`} tag="p" />
            </div>
        </div>
    );
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
            <EditableText value={(data?.packagingTitle as string) || 'Safe Delivery'} onChange={(v) => onUpdateData && onUpdateData({ packagingTitle: v })} className={`text-xl font-bold ${styles.text} mb-4 text-center block`} tag="h3" multiline />
            <DroppableImageZone onDrop={handleImageDrop} className="relative w-full mb-4">
                <ResizableImageContainer
                    aspectRatio={getDataAspectRatio(data, 16 / 9)}
                    onUpdateAspectRatio={handleUpdateRatio}
                    className="w-full bg-gray-200 rounded-lg overflow-hidden"
                >
                    {packagingImage ? <img src={imgSrc} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 aspect-video">이미지 드롭</div>}
                </ResizableImageContainer>
            </DroppableImageZone>
            <EditableText value={(data?.packagingDesc as string) || '꼼꼼하게 포장하여 안전하게 배송해드립니다.'} onChange={(v) => onUpdateData && onUpdateData({ packagingDesc: v })} className={`${styles.text} text-center opacity-80 block`} tag="p" />
        </div>
    )
}

function CautionNotice({ productData, variant, data, onUpdateData }: ModuleProps) {
    const styles = getThemeStyles(variant);
    const isSolid = variant === 'B';

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
        <div className={`${styles.bg} ${styles.container} p-10 sm:p-12`}>
            <div className="text-center mb-8">
                <span className="text-4xl mb-3 block">⚠️</span>
                <h3 className={`text-xl font-black ${styles.text} uppercase tracking-widest`}>주의사항</h3>
            </div>
            <div className="space-y-3 max-w-2xl mx-auto">
                {[0, 1, 2, 3].map(index => (
                    <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border ${isSolid ? 'border-white/10 bg-white/5' : `${styles.border} ${styles.bg === 'bg-white' ? 'bg-red-50/50' : 'bg-white/5'}`}`}>
                        <span className="text-red-500 text-lg font-bold">•</span>
                        <EditableText
                            value={getCautionData(index)}
                            onChange={handleTextChange(index)}
                            className={`${styles.text} text-sm opacity-70 flex-1 leading-relaxed`}
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
