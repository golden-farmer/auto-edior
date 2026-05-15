'use client';

import React, { ReactNode } from 'react';
import { useBuilderStore } from '@/store/useBuilderStore';

export function BuilderProvider({ children }: { children: ReactNode }) {
    // No longer needs Context Provider wrapper, but kept for compatibility
    return <>{children}</>;
}

export function useBuilder() {
    const store = useBuilderStore();
    
    const dispatch = (action: any) => {
        switch (action.type) {
            case 'SET_IMAGES': store.setImages(action.payload); break;
            case 'ADD_IMAGE': store.addImage(action.payload); break;
            case 'REMOVE_IMAGE': store.removeImage(action.payload); break;
            case 'UPDATE_IMAGE': store.updateImage(action.payload.id, action.payload.data); break;
            case 'SET_MODULES': store.setModules(action.payload); break;
            case 'TOGGLE_MODULE': store.toggleModule(action.payload); break;
            case 'REORDER_MODULES': store.reorderModules(action.payload); break;
            case 'UPDATE_MODULE_DATA': store.updateModuleData(action.payload.id, action.payload.data); break;
            case 'UPDATE_MODULE_VARIANT': store.updateModuleVariant(action.payload.id, action.payload.variant); break;
            case 'UPDATE_ALL_VARIANTS': store.updateAllVariants(action.payload); break;
            case 'SET_PRODUCT_DATA': store.setProductData(action.payload); break;
            case 'SET_GENERATING': store.setGenerating(action.payload); break;
            case 'SET_PROGRESS': store.setProgress(action.payload.progress, action.payload.message); break;
            case 'SET_TITLE_FONT': store.setTitleFont(action.payload); break;
            case 'SET_BODY_FONT': store.setBodyFont(action.payload); break;
            case 'SET_TEXT_SCALE': store.setTextScale(action.payload); break;
            case 'SET_COLOR_PALETTE': store.setColorPalette(action.payload); break;
            case 'TOGGLE_THUMBNAIL_SELECTION': store.toggleThumbnailSelection(action.payload); break;
            case 'UPDATE_IMAGE_MASKS': store.updateImageMasks(action.payload.id, action.payload.masks); break;
            case 'RESET': store.reset(); break;
            default: console.warn('Unhandled action type:', action.type);
        }
    };

    return { state: store, dispatch };
}
