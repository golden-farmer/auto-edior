'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BuilderState, ModuleConfig, ProductData, ImageUpload, DEFAULT_MODULES, DEFAULT_PRODUCT_DATA } from '@/types';

type BuilderAction =
    | { type: 'SET_IMAGES'; payload: ImageUpload[] }
    | { type: 'ADD_IMAGE'; payload: File }
    | { type: 'REMOVE_IMAGE'; payload: string }
    | { type: 'UPDATE_IMAGE'; payload: { id: string; data: Partial<ImageUpload> } }
    | { type: 'SET_MODULES'; payload: ModuleConfig[] }
    | { type: 'TOGGLE_MODULE'; payload: string }
    | { type: 'REORDER_MODULES'; payload: ModuleConfig[] }
    | { type: 'UPDATE_MODULE_DATA'; payload: { id: string; data: Record<string, unknown> } }
    | { type: 'UPDATE_MODULE_VARIANT'; payload: { id: string; variant: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' } }
    | { type: 'UPDATE_ALL_VARIANTS'; payload: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' }
    | { type: 'SET_PRODUCT_DATA'; payload: Partial<ProductData> }
    | { type: 'SET_GENERATING'; payload: boolean }
    | { type: 'SET_PROGRESS'; payload: { progress: number; message: string } }
    | { type: 'RESET' };

const initialState: BuilderState = {
    images: [],
    modules: DEFAULT_MODULES.map((m, i) => ({ ...m, id: uuidv4() })),
    productData: DEFAULT_PRODUCT_DATA,
    isGenerating: false,
    progress: 0,
    progressMessage: '',
};

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
    switch (action.type) {
        case 'SET_IMAGES':
            return { ...state, images: action.payload };
        case 'ADD_IMAGE':
            if (state.images.length >= 20) return state;
            const newImage: ImageUpload = {
                id: uuidv4(),
                file: action.payload,
                previewUrl: URL.createObjectURL(action.payload),
                isProcessing: false,
            };
            return { ...state, images: [...state.images, newImage] };
        case 'REMOVE_IMAGE':
            return { ...state, images: state.images.filter(img => img.id !== action.payload) };
        case 'UPDATE_IMAGE':
            return {
                ...state,
                images: state.images.map(img =>
                    img.id === action.payload.id ? { ...img, ...action.payload.data } : img
                ),
            };
        case 'SET_MODULES':
            return { ...state, modules: action.payload };
        case 'TOGGLE_MODULE':
            return {
                ...state,
                modules: state.modules.map(m =>
                    m.id === action.payload ? { ...m, isActive: !m.isActive } : m
                ),
            };
        case 'REORDER_MODULES':
            return { ...state, modules: action.payload };
        case 'UPDATE_MODULE_DATA':
            return {
                ...state,
                modules: state.modules.map(m =>
                    m.id === action.payload.id ? { ...m, data: { ...m.data, ...action.payload.data } } : m
                ),
            };
        case 'UPDATE_MODULE_VARIANT':
            return {
                ...state,
                modules: state.modules.map(m =>
                    m.id === action.payload.id ? { ...m, variant: action.payload.variant } : m
                ),
            };
        case 'UPDATE_ALL_VARIANTS':
            return {
                ...state,
                modules: state.modules.map(m => ({ ...m, variant: action.payload })),
            };
        case 'SET_PRODUCT_DATA':
            return { ...state, productData: { ...state.productData, ...action.payload } };
        case 'SET_GENERATING':
            return { ...state, isGenerating: action.payload };
        case 'SET_PROGRESS':
            return { ...state, progress: action.payload.progress, progressMessage: action.payload.message };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

const BuilderContext = createContext<{
    state: BuilderState;
    dispatch: React.Dispatch<BuilderAction>;
} | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(builderReducer, initialState);
    return (
        <BuilderContext.Provider value={{ state, dispatch }}>
            {children}
        </BuilderContext.Provider>
    );
}

export function useBuilder() {
    const context = useContext(BuilderContext);
    if (!context) {
        throw new Error('useBuilder must be used within a BuilderProvider');
    }
    return context;
}
