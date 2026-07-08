'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isHydrating, setIsHydrating] = useState(false);
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (!projectId) {
      setIsHydrating(false);
      reset();
      lastLoadedRef.current = null;
      return;
    }

    if (lastLoadedRef.current === projectId) {
      setIsHydrating(false);
      return;
    }

    let isCancelled = false;
    setIsHydrating(true);

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
          toast.error('?꾩떆 ??λ낯??遺덈윭?ㅼ? 紐삵뻽?듬땲??');
        }
      } finally {
        if (!isCancelled) {
          setIsHydrating(false);
        }
      }
    };

    void loadProject();

    return () => {
      isCancelled = true;
    };
  }, [projectId, loadProjectState, reset]);

  if (!isHydrating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/88 backdrop-blur-sm">
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">본문을 불러오는 중입니다.</p>
            <p className="text-xs text-gray-500">잠시만 기다려 주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
