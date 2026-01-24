// Module type definitions for the 17 block types

export type ModuleCategory = 'intro' | 'trust' | 'benefits' | 'detail' | 'service' | 'closing';

export type ModuleType =
    // Intro modules
    | 'hooking-banner'
    | 'hero-image'
    | 'summary-card'
    // Trust modules
    | 'review-summary'
    | 'origin-certificate'
    | 'farmer-story'
    // Benefits modules
    | 'benefit-point-1'
    | 'benefit-point-2'
    | 'benefit-point-3'
    | 'comparison-table'
    // Detail modules
    | 'size-guide'
    | 'harvest-process'
    | 'sweetness-check'
    // Service modules
    | 'taste-tip'
    | 'event-highlight'
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

export interface ImageUpload {
    id: string;
    file: File | null;
    previewUrl: string;
    transformedUrl?: string;
    isProcessing: boolean;
}

export interface ProductData {
    productName: string;
    productDescription: string;
    origin: string;
    farmerName: string;
    price: string;
    sweetness: string;
    size: string;
    storageMethod: string;
    csPhone: string;
    csEmail: string;
    eventText?: string;
    reviewSummary?: string; // AI generated
    cautionText?: string; // AI generated
}

export interface BuilderState {
    images: ImageUpload[];
    modules: ModuleConfig[];
    productData: ProductData;
    isGenerating: boolean;
    progress: number;
    progressMessage: string;
}

export const DEFAULT_MODULES: Omit<ModuleConfig, 'id'>[] = [
    { type: 'hooking-banner', category: 'intro', name: 'Hooking Banner', nameKo: '후킹 배너', isActive: true, order: 0, data: {}, variant: 'A' },
    { type: 'hero-image', category: 'intro', name: 'Hero Image', nameKo: '히어로 이미지', isActive: true, order: 1, data: {}, variant: 'A' },
    { type: 'summary-card', category: 'intro', name: '3-Second Summary', nameKo: '3초 요약 카드', isActive: true, order: 2, data: {}, variant: 'A' },
    { type: 'review-summary', category: 'trust', name: 'Review Summary', nameKo: '리뷰 요약', isActive: true, order: 3, data: {}, variant: 'A' },
    { type: 'origin-certificate', category: 'trust', name: 'Origin Certificate', nameKo: '산지 인증서', isActive: true, order: 4, data: {}, variant: 'A' },
    { type: 'farmer-story', category: 'trust', name: 'Farmer Story', nameKo: '농부 스토리', isActive: true, order: 5, data: {}, variant: 'A' },
    { type: 'benefit-point-1', category: 'benefits', name: 'Benefit Point 1', nameKo: '소구점 1', isActive: true, order: 6, data: {}, variant: 'A' },
    { type: 'benefit-point-2', category: 'benefits', name: 'Benefit Point 2', nameKo: '소구점 2', isActive: true, order: 7, data: {}, variant: 'A' },
    { type: 'benefit-point-3', category: 'benefits', name: 'Benefit Point 3', nameKo: '소구점 3', isActive: true, order: 8, data: {}, variant: 'A' },
    { type: 'comparison-table', category: 'benefits', name: 'Comparison Table', nameKo: '비교 테이블', isActive: true, order: 9, data: {}, variant: 'A' },
    { type: 'size-guide', category: 'detail', name: 'Size Guide', nameKo: '사이즈 가이드', isActive: true, order: 10, data: {}, variant: 'A' },
    { type: 'harvest-process', category: 'detail', name: 'Harvest Process', nameKo: '수확 프로세스', isActive: true, order: 11, data: {}, variant: 'A' },
    { type: 'sweetness-check', category: 'detail', name: 'Sweetness Check', nameKo: '당도 확인', isActive: true, order: 12, data: {}, variant: 'A' },
    { type: 'taste-tip', category: 'service', name: 'Taste Tip', nameKo: '맛팁(보관법)', isActive: true, order: 13, data: {}, variant: 'A' },
    { type: 'event-highlight', category: 'service', name: 'Event Highlight', nameKo: '이벤트 강조', isActive: false, order: 14, data: {}, variant: 'A' },
    { type: 'packaging-info', category: 'service', name: 'Packaging Info', nameKo: '포장 안내', isActive: true, order: 15, data: {}, variant: 'A' },
    { type: 'caution-notice', category: 'closing', name: 'Caution Notice', nameKo: '주의사항', isActive: true, order: 16, data: {}, variant: 'A' },
    { type: 'cs-info', category: 'closing', name: 'CS Info', nameKo: 'CS 정보', isActive: true, order: 17, data: {}, variant: 'A' },
];

export const DEFAULT_PRODUCT_DATA: ProductData = {
    productName: '',
    productDescription: '',
    origin: '',
    farmerName: '',
    price: '',
    sweetness: '',
    size: '',
    storageMethod: '',
    csPhone: '',
    csEmail: '',
};
