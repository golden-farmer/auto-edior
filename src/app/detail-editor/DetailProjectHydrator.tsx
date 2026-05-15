'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { deserializeDetailProjectSnapshot, type DetailProjectSnapshot } from '@/lib/detail-projects';
import { useBuilderStore } from '@/store/useBuilderStore';

type ProjectResponse = {
  project: {
    id: string;
    title: string;
    snapshot: DetailProjectSnapshot;
  };
};

export function DetailProjectHydrator() {
  const searchParams = useSearchParams();
  const reset = useBuilderStore((state) => state.reset);
  const loadProjectState = useBuilderStore((state) => state.loadProjectState);
  const lastLoadedRef = useRef<string | null>(null);
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (!projectId) {
      reset();
      lastLoadedRef.current = null;
      return;
    }

    if (lastLoadedRef.current === projectId) {
      return;
    }

    let isCancelled = false;

    const loadProject = async () => {
      try {
        const response = await fetch(`/api/detail-projects/${projectId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load saved project.');
        }

        const data = (await response.json()) as ProjectResponse;
        if (isCancelled) return;

        loadProjectState(
          deserializeDetailProjectSnapshot(data.project.snapshot),
          { id: data.project.id, title: data.project.title },
        );
        lastLoadedRef.current = projectId;
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          toast.error('임시 저장본을 불러오지 못했습니다.');
        }
      }
    };

    void loadProject();

    return () => {
      isCancelled = true;
    };
  }, [projectId, loadProjectState, reset]);

  return null;
}
