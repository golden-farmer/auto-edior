import type { BuilderState, ImageUpload, MaskRegion, ModuleConfig, OverlayNode, ProductData, TextScale, FontType } from '@/types';

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
  const previewUrl = await urlToDataUrl(image.previewUrl);
  const transformedUrl = image.transformedUrl ? await urlToDataUrl(image.transformedUrl) : undefined;

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
