/**
 * figma-mapping.ts
 *
 * Figma 컴포넌트명 → ModuleType 매핑 및 노드 파싱 유틸
 *
 * [Figma 레이어 네이밍 컨벤션]
 * - 모듈 프레임:    "module/hooking-banner", "module/benefit-point-1" 등
 * - 텍스트 레이어:  "text/title", "text/description", "text/tip1" 등
 * - 이미지 레이어:  "image/main", "image/product", "image/bg" 등
 */

import { ModuleType } from '@/types';

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

export interface FigmaColor {
  r: number; // 0~1
  g: number;
  b: number;
  a: number;
}

export interface FigmaTextLayer {
  nodeId: string;
  layerName: string;   // e.g. "text/title"
  propKey: string;     // e.g. "title" → React prop 키
  content: string;     // 현재 Figma 상의 기본 텍스트
  fontSize: number;
  fontFamily: string;
}

export interface FigmaImagePlaceholder {
  nodeId: string;
  layerName: string;   // e.g. "image/main"
  slotKey: string;     // e.g. "main" → 이미지 슬롯 키
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaTemplateData {
  moduleType: ModuleType;
  figmaNodeId: string;
  width: number;
  height: number;
  primaryColor: string;    // hex
  secondaryColor: string;  // hex
  bgColor: string;         // hex
  titleFont: string;
  bodyFont: string;
  textLayers: FigmaTextLayer[];
  imagePlaceholders: FigmaImagePlaceholder[];
}

// ─────────────────────────────────────────────
// Figma 컴포넌트명 → ModuleType 매핑 테이블
// ─────────────────────────────────────────────

export const FIGMA_MODULE_NAME_MAP: Record<string, ModuleType> = {
  'module/hero-image':       'hero-image',
  'module/summary-card':     'summary-card',
  'module/review-summary':   'review-summary',
  'module/farmer-story':     'farmer-story',
  'module/benefit-point-1':  'benefit-point-1',
  'module/benefit-point-2':  'benefit-point-2',
  'module/benefit-point-3':  'benefit-point-3',
  'module/comparison-table': 'comparison-table',
  'module/size-guide':       'size-guide',
  'module/harvest-process':  'harvest-process',
  'module/sweetness-check':  'sweetness-check',
  'module/taste-tip':        'taste-tip',
  'module/event-highlight':  'event-highlight',
  'module/packaging-info':   'packaging-info',
  'module/caution-notice':   'caution-notice',
  'module/cs-info':          'cs-info',
};

// ─────────────────────────────────────────────
// 텍스트 레이어명 → React prop 키 매핑
// ─────────────────────────────────────────────

export const TEXT_LAYER_PROP_MAP: Record<string, string> = {
  'text/title':        'title',
  'text/subtitle':     'subtitle',
  'text/description':  'description',
  'text/mainCopy':     'mainCopy',
  'text/subCopy':      'subCopy',
  'text/tip1':         'tip1',
  'text/tip2':         'tip2',
  'text/tip3':         'tip3',
  'text/tip4':         'tip4',
  'text/label1':       'label1',
  'text/label2':       'label2',
  'text/label3':       'label3',
  'text/value1':       'value1',
  'text/value2':       'value2',
  'text/value3':       'value3',
  'text/review1':      'text1',
  'text/review2':      'text2',
  'text/review3':      'text3',
  'text/reviewTitle1': 'title1',
  'text/reviewTitle2': 'title2',
  'text/reviewTitle3': 'title3',
  'text/csPhone':      'csPhone',
  'text/eventText':    'eventText',
};

// 이미지 레이어명 → 슬롯 키 매핑
export const IMAGE_LAYER_SLOT_MAP: Record<string, string> = {
  'image/main':    'main',
  'image/product': 'product',
  'image/bg':      'bg',
  'image/sub1':    'sub1',
  'image/sub2':    'sub2',
};

// ─────────────────────────────────────────────
// 유틸: Figma rgba → hex 변환
// ─────────────────────────────────────────────

export function figmaColorToHex(color: FigmaColor): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

// ─────────────────────────────────────────────
// 핵심: Figma API 노드 → FigmaTemplateData 파싱
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFigmaNode(node: any, moduleType: ModuleType): FigmaTemplateData {
  const textLayers: FigmaTextLayer[] = [];
  const imagePlaceholders: FigmaImagePlaceholder[] = [];

  // 재귀 탐색으로 텍스트/이미지 레이어 수집
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function traverse(n: any) {
    const name: string = n.name || '';

    // 텍스트 레이어
    if (n.type === 'TEXT' && TEXT_LAYER_PROP_MAP[name]) {
      textLayers.push({
        nodeId: n.id,
        layerName: name,
        propKey: TEXT_LAYER_PROP_MAP[name],
        content: n.characters || '',
        fontSize: n.style?.fontSize || 16,
        fontFamily: n.style?.fontFamily || 'Noto Sans KR',
      });
    }

    // 이미지 플레이스홀더 (fills에 IMAGE 타입이 있거나, 레이어명이 image/ 시작)
    const hasImageFill = n.fills?.some((f: { type: string }) => f.type === 'IMAGE');
    if ((hasImageFill || name.startsWith('image/')) && IMAGE_LAYER_SLOT_MAP[name]) {
      imagePlaceholders.push({
        nodeId: n.id,
        layerName: name,
        slotKey: IMAGE_LAYER_SLOT_MAP[name],
        x: n.absoluteBoundingBox?.x || 0,
        y: n.absoluteBoundingBox?.y || 0,
        width: n.absoluteBoundingBox?.width || 800,
        height: n.absoluteBoundingBox?.height || 600,
      });
    }

    // 자식 재귀
    if (n.children?.length) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);

  // 색상 추출: 첫 번째 solid fill → primaryColor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstFill = node.fills?.find((f: any) => f.type === 'SOLID');
  const primaryColor = firstFill ? figmaColorToHex(firstFill.color) : '#333333';

  // 배경색: 프레임 배경
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgFill = node.background?.find((f: any) => f.type === 'SOLID');
  const bgColor = bgFill ? figmaColorToHex(bgFill.color) : '#ffffff';

  // 폰트: 첫 번째 텍스트 레이어 기준
  const firstText = textLayers[0];

  return {
    moduleType,
    figmaNodeId: node.id,
    width: node.absoluteBoundingBox?.width || 1000,
    height: node.absoluteBoundingBox?.height || 600,
    primaryColor,
    secondaryColor: primaryColor, // 추가 파싱 원한다면 extends 가능
    bgColor,
    titleFont: firstText?.fontFamily || 'Noto Sans KR',
    bodyFont: firstText?.fontFamily || 'Noto Sans KR',
    textLayers,
    imagePlaceholders,
  };
}
