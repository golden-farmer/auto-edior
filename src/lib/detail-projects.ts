import type { BuilderState, ImageUpload, MaskRegion, ModuleConfig, OverlayNode, ProductData, TextScale, FontType } from '@/types';

const PERSISTED_IMAGE_MAX_DIMENSION = 1200;
const PERSISTED_IMAGE_QUALITY = 0.72;

export type PersistedImageUpload = {
  id: string;
  previewUrl: string;
  transformedUrl?: string;
  isProcessing: boolean;
  masks?: MaskRegion[];
};

export type DetailProjectSnapshot = {
  images: PersistedImageUpload[];
  modules: ModuleConfig[];
  productData: ProductData;
  titleFont: FontType;
  bodyFont: FontType;
  textScale: TextScale;
  colorPalette: string;
  customColors?: { primary: string; secondary: string; text: string };
  selectedThumbnailIds: string[];
  isCanvasMode: boolean;
  overlayNodes: OverlayNode[];
};

function isObjectUrl(url: string) {
  return url.startsWith('blob:');
}

function shouldCompressImageUrl(url: string) {
  return url.startsWith('data:') || isObjectUrl(url);
}

async function loadImageElement(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for compression.'));
    image.src = src;
  });
}

async function compressImageUrl(url: string) {
  if (!shouldCompressImageUrl(url)) {
    return url;
  }

  const image = await loadImageElement(url);
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);

  if (!longestSide) {
    return url;
  }

  const scale = Math.min(1, PERSISTED_IMAGE_MAX_DIMENSION / longestSide);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to prepare image compression canvas.');
  }

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', PERSISTED_IMAGE_QUALITY);
}

async function urlToDataUrl(url: string) {
  if (!url || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (!isObjectUrl(url)) {
    return url;
  }

  const response = await fetch(url);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert image to data URL.'));
    reader.readAsDataURL(blob);
  });
}

async function serializeImage(image: ImageUpload): Promise<PersistedImageUpload> {
  const previewUrl = await compressImageUrl(await urlToDataUrl(image.previewUrl));
  const transformedUrl = image.transformedUrl
    ? await compressImageUrl(await urlToDataUrl(image.transformedUrl))
    : undefined;

  return {
    id: image.id,
    previewUrl,
    transformedUrl,
    isProcessing: false,
    masks: image.masks,
  };
}

export async function serializeDetailProjectSnapshot(state: BuilderState): Promise<DetailProjectSnapshot> {
  const images = await Promise.all(state.images.map((image) => serializeImage(image)));

  return {
    images,
    modules: state.modules,
    productData: state.productData,
    titleFont: state.titleFont,
    bodyFont: state.bodyFont,
    textScale: state.textScale,
    colorPalette: state.colorPalette,
    customColors: state.customColors,
    selectedThumbnailIds: state.selectedThumbnailIds,
    isCanvasMode: state.isCanvasMode,
    overlayNodes: state.overlayNodes,
  };
}

export function deserializeDetailProjectSnapshot(snapshot: DetailProjectSnapshot): Partial<BuilderState> {
  return {
    images: snapshot.images.map((image) => ({
      ...image,
      file: null,
    })),
    modules: snapshot.modules,
    productData: snapshot.productData,
    titleFont: snapshot.titleFont,
    bodyFont: snapshot.bodyFont,
    textScale: snapshot.textScale,
    colorPalette: snapshot.colorPalette,
    customColors: snapshot.customColors,
    selectedThumbnailIds: snapshot.selectedThumbnailIds,
    isCanvasMode: snapshot.isCanvasMode,
    overlayNodes: snapshot.overlayNodes,
  };
}
