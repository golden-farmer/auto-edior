// Module type definitions for the 17 block types

export type ModuleCategory = 'intro' | 'trust' | 'benefits' | 'detail' | 'service' | 'closing';

// Font Mix-Match System Types
export type FontType = 'Noto Sans KR' | 'Do Hyeon' | 'Nanum Gothic' | 'Nanum Myeongjo' | 'Gowun Dodum';
export type TextScale = 'small' | 'normal' | 'large';

export const FONT_OPTIONS: { value: FontType; label: string; description: string }[] = [
    { value: 'Noto Sans KR', label: '노토산스', description: '깔끔' },
    { value: 'Do Hyeon', label: '도현체', description: '강조' },
    { value: 'Nanum Gothic', label: '나눔고딕', description: '기본' },
    { value: 'Nanum Myeongjo', label: '나눔명조', description: '고급' },
    { value: 'Gowun Dodum', label: '고운돋움', description: '부드러움' },
];

export const TEXT_SCALE_VALUES: Record<TextScale, number> = {
    small: 0.8,
    normal: 1.0,
    large: 1.2,
};

export type ModuleType =
    // Intro modules
    | 'event-highlight'
    | 'hero-image'
    | 'summary-card'
    // Trust modules
    | 'review-summary'
    | 'farmer-story'
    // Benefits modules
    | 'benefit-point-1'
    | 'benefit-point-2'
    | 'benefit-point-3'
    | 'comparison-table'
    | 'sweetness-check'
    // Detail modules
    | 'size-guide'
    | 'harvest-process'
    | 'home-use-notice'
    | 'option-list'
    // Usage modules
    | 'taste-tip'
    // Service modules
    | 'packaging-info'
    // Closing modules
    | 'caution-notice'
    | 'cs-info';

export interface ModuleConfig {
    id: string;
    type: ModuleType;
    category: ModuleCategory;
    name: string;
    nameKo: string;
    isActive: boolean;
    order: number;
    data: Record<string, unknown>;
    variant: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';
}

export interface MaskRegion {
    id: string;
    name: string;
    maskType: 'background' | 'product';
    productIndex?: number; // product 마스크일 때 물건 번호 (0-based)
    color: string;         // hex color for overlay e.g. "#E67E22"
    opacity: number;       // 0~1
    pixelCount: number;
    avgColor: { r: number; g: number; b: number };
    label: string;         // 유저가 편집하는 레이블
    visible: boolean;
    // 마스크 픽셀 셋: 이미지 인덱스 배열 (width * y + x)
    pixelIndices?: Uint32Array;
}

export interface ImageUpload {
    id: string;
    file: File | null;
    previewUrl: string;
    transformedUrl?: string;
    isProcessing: boolean;
    masks?: MaskRegion[];
}

export interface ProductData {
    productName: string;
    productDescription: string;
    csPhone: string;
    eventText?: string;
    reviewSummary?: string; // AI generated
    cautionText?: string; // AI generated
}

export interface TextStyleOverride {
    color?: string;
    fontSize?: number;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    lineHeight?: number;
}

export interface SelectedTextTarget {
    moduleId: string;
    textKey: string;
    textValue: string;
    style: TextStyleOverride;
    resolvedColor?: string;
    resolvedFontSize?: number;
    resolvedFontWeight?: number;
    resolvedTextAlign?: 'left' | 'center' | 'right';
    resolvedLetterSpacing?: number;
    resolvedLineHeight?: number;
}

export interface TextLayerNode {
    id: string;
    type: 'text';
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fill: string;
    rotation: number;
    fontFamily: string;
    width?: number;
    height?: number;
}

export interface StickerLayerNode {
    id: string;
    type: 'image';
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

export type OverlayNode = TextLayerNode | StickerLayerNode;

export interface BuilderState {
    images: ImageUpload[];
    modules: ModuleConfig[];
    productData: ProductData;
    isGenerating: boolean;
    progress: number;
    progressMessage: string;
    // Font Mix-Match System
    titleFont: FontType;
    bodyFont: FontType;
    textScale: TextScale;
    // Color Palette
    colorPalette: string;
    customColors?: { primary: string; secondary: string; text: string };
    // Thumbnail Selection
    selectedThumbnailIds: string[];
    // Canvas Overlay Mode
    isCanvasMode: boolean;
    overlayNodes: OverlayNode[];
    selectedTextTarget?: SelectedTextTarget;
    currentProjectId?: string;
    currentProjectTitle: string;
}

export const DEFAULT_MODULES: Omit<ModuleConfig, 'id'>[] = [
    // ── Intro ──
    { type: 'event-highlight',     category: 'intro',    name: 'Event Highlight',      nameKo: '이벤트 강조',      isActive: true,  order: 0,  data: {}, variant: 'A' },
    { type: 'hero-image',          category: 'intro',    name: 'Hero Image',           nameKo: '히어로 이미지',    isActive: true,  order: 3,  data: {}, variant: 'A' },
    { type: 'summary-card',        category: 'intro',    name: '3-Second Summary',     nameKo: '3초 요약 카드',    isActive: true,  order: 4,  data: {}, variant: 'A' },
    // ── Trust ──
    { type: 'review-summary',      category: 'trust',    name: 'Review Summary',       nameKo: '리뷰 요약',        isActive: true,  order: 5,  data: {}, variant: 'A' },
    { type: 'farmer-story',        category: 'trust',    name: 'Farmer Story',         nameKo: '농부 스토리',      isActive: true,  order: 6,  data: {}, variant: 'A' },
    // ── Benefits ──
    { type: 'benefit-point-1',     category: 'benefits', name: 'Benefit Point 1',      nameKo: '소구점 1',         isActive: true,  order: 10, data: {}, variant: 'A' },
    { type: 'benefit-point-2',     category: 'benefits', name: 'Benefit Point 2',      nameKo: '소구점 2',         isActive: true,  order: 11, data: {}, variant: 'A' },
    { type: 'benefit-point-3',     category: 'benefits', name: 'Benefit Point 3',      nameKo: '소구점 3',         isActive: true,  order: 12, data: {}, variant: 'A' },
    { type: 'comparison-table',    category: 'benefits', name: 'Comparison Table',     nameKo: '비교 테이블',      isActive: true,  order: 13, data: {}, variant: 'A' },
    { type: 'sweetness-check',     category: 'benefits', name: 'Sweetness Check',      nameKo: '당도 확인',        isActive: true,  order: 14, data: {}, variant: 'A' },
    // ── Detail ──
    { type: 'size-guide',          category: 'detail',   name: 'Size Guide',           nameKo: '사이즈 가이드',    isActive: true,  order: 16, data: {}, variant: 'A' },
    { type: 'harvest-process',     category: 'detail',   name: 'Harvest Process',      nameKo: '수확 프로세스',    isActive: true,  order: 17, data: {}, variant: 'A' },
    { type: 'home-use-notice',     category: 'detail',   name: 'Home Use Notice',      nameKo: '가정용 실속용 알림', isActive: true,  order: 18, data: {}, variant: 'A' },
    { type: 'option-list',         category: 'detail',   name: 'Option List',          nameKo: '옵션/구성 안내',     isActive: true,  order: 19, data: {}, variant: 'A' },
    // ── Usage ──
    { type: 'taste-tip',           category: 'service',  name: 'Taste Tip',            nameKo: '보관법/맛팁',      isActive: true,  order: 22, data: {}, variant: 'A' },
    // ── Service ──
    { type: 'packaging-info',      category: 'service',  name: 'Packaging Info',       nameKo: '포장 안내',        isActive: true,  order: 26, data: {}, variant: 'A' },
    // ── Closing ──
    { type: 'caution-notice',      category: 'closing',  name: 'Caution Notice',       nameKo: '주의사항',         isActive: true,  order: 28, data: {}, variant: 'A' },
    { type: 'cs-info',             category: 'closing',  name: 'CS Info',              nameKo: 'CS 정보',          isActive: true,  order: 29, data: {}, variant: 'A' },
];

export const DEFAULT_PRODUCT_DATA: ProductData = {
    productName: '',
    productDescription: '',
    csPhone: '',
};
