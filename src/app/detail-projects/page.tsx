'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock3, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type DetailProjectSummary = {
  id: string;
  title: string;
  product_name: string | null;
  created_at: string;
  updated_at: string;
};

export default function DetailProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<DetailProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadProjects = async () => {
      try {
        const response = await fetch('/api/detail-projects', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load projects.');
        }

        const data = await response.json();
        if (!isCancelled) {
          setProjects(data.projects ?? []);
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          toast.error('저장된 상세페이지를 불러오지 못했습니다.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('이 저장본을 삭제할까요?')) {
      return;
    }

    setDeletingId(projectId);

    try {
      const response = await fetch(`/api/detail-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project.');
      }

      setProjects((current) => current.filter((project) => project.id !== projectId));
      toast.success('저장본을 삭제했습니다.');
    } catch (error) {
      console.error(error);
      toast.error('저장본 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">상세페이지 저장함</h1>
              <p className="mt-2 text-gray-600">임시 저장본을 열고 이어서 작업할 수 있습니다. 계정당 최대 10개까지 저장됩니다.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/detail-editor')}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700"
          >
            <Plus size={16} />
            상세 페이지 제작
          </button>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
            저장본을 불러오는 중입니다.
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <FolderOpen size={26} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">저장된 상세페이지가 없습니다.</h2>
            <p className="mt-2 text-gray-600">편집기에서 임시 저장하면 여기서 다시 열 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-gray-900">{project.title}</h2>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {project.product_name || '상품명 미입력'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
                  <Clock3 size={14} />
                  <span>{new Date(project.updated_at).toLocaleString('ko-KR')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/detail-editor?projectId=${project.id}`)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <FolderOpen size={16} />
                  저장본 열기
                </button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && projects.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">
            현재 {projects.length} / 10개 저장됨
          </p>
        )}
      </div>
    </div>
  );
}
