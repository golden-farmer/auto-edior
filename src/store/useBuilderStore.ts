import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, ModuleConfig, ProductData, ImageUpload, MaskRegion, DEFAULT_MODULES, DEFAULT_PRODUCT_DATA, FontType, TextScale, OverlayNode, SelectedTextTarget, TextStyleOverride } from '@/types';

interface BuilderStore extends BuilderState {
    setImages: (images: ImageUpload[]) => void;
    addImage: (file: File) => void;
    removeImage: (id: string) => void;
    updateImage: (id: string, data: Partial<ImageUpload>) => void;
    setModules: (modules: ModuleConfig[]) => void;
    toggleModule: (id: string) => void;
    reorderModules: (modules: ModuleConfig[]) => void;
    updateModuleData: (id: string, data: Record<string, unknown>) => void;
    updateModuleVariant: (id: string, variant: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J') => void;
    updateAllVariants: (variant: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J') => void;
    setProductData: (data: Partial<ProductData>) => void;
    setGenerating: (isGenerating: boolean) => void;
    setProgress: (progress: number, message: string) => void;
    setTitleFont: (font: FontType) => void;
    setBodyFont: (font: FontType) => void;
    setTextScale: (scale: TextScale) => void;
    setColorPalette: (palette: string) => void;
    setCustomColors: (colors: { primary: string; secondary: string; text: string }) => void;
    toggleThumbnailSelection: (id: string) => void;
    updateImageMasks: (id: string, masks: MaskRegion[]) => void;
    setIsCanvasMode: (isCanvasMode: boolean) => void;
    setOverlayNodes: (nodes: OverlayNode[]) => void;
    addOverlayNode: (node: OverlayNode) => void;
    updateOverlayNode: (id: string, data: Partial<OverlayNode>) => void;
    removeOverlayNode: (id: string) => void;
    setSelectedTextTarget: (target?: SelectedTextTarget) => void;
    updateSelectedTextStyle: (style: TextStyleOverride) => void;
    setCurrentProjectMeta: (project: { id?: string; title?: string }) => void;
    loadProjectState: (state: Partial<BuilderState>, project: { id: string; title: string }) => void;
    reset: () => void;
}

const initialState: BuilderState = {
    images: [],
    modules: DEFAULT_MODULES.map((m, i) => ({ ...m, id: `default-module-${i}` })),
    productData: DEFAULT_PRODUCT_DATA,
    isGenerating: false,
    progress: 0,
    progressMessage: '',
    titleFont: 'Gowun Dodum',
    bodyFont: 'Gowun Dodum',
    textScale: 'small',
    colorPalette: 'apple',
    customColors: undefined,
    selectedThumbnailIds: [],
    isCanvasMode: false,
    overlayNodes: [],
    selectedTextTarget: undefined,
    currentProjectId: undefined,
    currentProjectTitle: '',
};

export const useBuilderStore = create<BuilderStore>((set) => ({
    ...initialState,

    setImages: (images) => set({ images }),
    
    addImage: (file) => set((state) => {
        if (state.images.length >= 30) return state;
        const newImage: ImageUpload = {
            id: uuidv4(),
            file,
            previewUrl: URL.createObjectURL(file), // Note: Need to revokeObjectURL later in real app
            isProcessing: false,
        };
        return { images: [...state.images, newImage] };
    }),

    removeImage: (id) => set((state) => ({
        images: state.images.filter(img => img.id !== id),
        selectedThumbnailIds: state.selectedThumbnailIds.filter(thumbId => thumbId !== id)
    })),

    updateImage: (id, data) => set((state) => ({
        images: state.images.map(img => img.id === id ? { ...img, ...data } : img)
    })),

    setModules: (modules) => set({ modules }),

    toggleModule: (id) => set((state) => ({
        modules: state.modules.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m)
    })),

    reorderModules: (modules) => set({ modules }),

    updateModuleData: (id, data) => set((state) => ({
        modules: state.modules.map(m => m.id === id ? { ...m, data: { ...m.data, ...data } } : m)
    })),

    updateModuleVariant: (id, variant) => set((state) => ({
        modules: state.modules.map(m => m.id === id ? { ...m, variant } : m)
    })),

    updateAllVariants: (variant) => set((state) => ({
        modules: state.modules.map(m => ({ ...m, variant }))
    })),

    setProductData: (data) => set((state) => ({
        productData: { ...state.productData, ...data }
    })),

    setGenerating: (isGenerating) => set({ isGenerating }),

    setProgress: (progress, message) => set({ progress, progressMessage: message }),

    setTitleFont: (titleFont) => set({ titleFont }),
    
    setBodyFont: (bodyFont) => set({ bodyFont }),

    setTextScale: (textScale) => set({ textScale }),

    setColorPalette: (colorPalette) => set({ colorPalette }),

    setCustomColors: (customColors) => set({ customColors }),

    toggleThumbnailSelection: (id) => set((state) => {
        if (state.selectedThumbnailIds.includes(id)) {
            return { selectedThumbnailIds: state.selectedThumbnailIds.filter(i => i !== id) };
        } else {
            if (state.selectedThumbnailIds.length >= 10) return state;
            return { selectedThumbnailIds: [...state.selectedThumbnailIds, id] };
        }
    }),

    updateImageMasks: (id, masks) => set((state) => ({
        images: state.images.map(img => img.id === id ? { ...img, masks } : img)
    })),

    setIsCanvasMode: (isCanvasMode) => set({ isCanvasMode }),
    
    setOverlayNodes: (overlayNodes) => set({ overlayNodes }),
    
    addOverlayNode: (node) => set((state) => ({ 
        overlayNodes: [...state.overlayNodes, node] 
    })),
    
    updateOverlayNode: (id, data) => set((state) => ({
        overlayNodes: state.overlayNodes.map(n => n.id === id ? { ...n, ...data } as OverlayNode : n)
    })),
    
    removeOverlayNode: (id) => set((state) => ({
        overlayNodes: state.overlayNodes.filter(n => n.id !== id)
    })),

    setSelectedTextTarget: (selectedTextTarget) => set({ selectedTextTarget }),

    updateSelectedTextStyle: (style) => set((state) => {
        const target = state.selectedTextTarget;
        if (!target) return state;

        const nextStyle = { ...target.style, ...style };

        return {
            selectedTextTarget: {
                ...target,
                style: nextStyle,
            },
            modules: state.modules.map((module) => {
                if (module.id !== target.moduleId) return module;

                const currentTextStyles = (module.data._textStyles as Record<string, TextStyleOverride> | undefined) ?? {};

                return {
                    ...module,
                    data: {
                        ...module.data,
                        _textStyles: {
                            ...currentTextStyles,
                            [target.textKey]: nextStyle,
                        },
                    },
                };
            }),
        };
    }),

    setCurrentProjectMeta: ({ id, title }) => set((state) => ({
        currentProjectId: id,
        currentProjectTitle: title ?? state.currentProjectTitle,
    })),

    loadProjectState: (projectState, project) =>
        set((state) => ({
            ...state,
            ...projectState,
            images: projectState.images ?? [],
            modules: projectState.modules ?? state.modules,
            productData: projectState.productData ?? state.productData,
            titleFont: projectState.titleFont ?? state.titleFont,
            bodyFont: projectState.bodyFont ?? state.bodyFont,
            textScale: projectState.textScale ?? state.textScale,
            colorPalette: projectState.colorPalette ?? state.colorPalette,
            customColors: projectState.customColors,
            selectedThumbnailIds: projectState.selectedThumbnailIds ?? [],
            isCanvasMode: projectState.isCanvasMode ?? false,
            overlayNodes: projectState.overlayNodes ?? [],
            selectedTextTarget: undefined,
            isGenerating: false,
            progress: 0,
            progressMessage: '',
            currentProjectId: project.id,
            currentProjectTitle: project.title,
        })),

    reset: () => set(initialState),
}));
