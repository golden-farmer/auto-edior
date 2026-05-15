"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, Key, X } from "lucide-react";
import { useQuotaStore } from "@/store/useQuotaStore";
import { useRouter } from "next/navigation";

export function QuotaModal() {
  const { isQuotaExceeded, setQuotaExceeded } = useQuotaStore();
  const router = useRouter();

  const handleNavigateToKeys = () => {
    setQuotaExceeded(false);
    router.push("/dashboard/api-keys");
  };

  return (
    <Dialog.Root open={isQuotaExceeded} onOpenChange={setQuotaExceeded}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200">
          
          <div className="p-6 border-b border-gray-100 flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 pt-1">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                API 크레딧 소진 안내
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 leading-relaxed">
                현재 연결된 Gemini API 키의 <strong>무료 요청 한도(Quota)가 모두 소진</strong>되었습니다. 추가 AI 이미지 생성 및 텍스트 자동화를 이용하시려면 다른 API 키를 등록하시거나 결제 계정을 확인해주세요.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
            <Dialog.Close asChild>
              <button className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                닫기
              </button>
            </Dialog.Close>
            <button 
              onClick={handleNavigateToKeys}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              API 키 변경하기
            </button>
          </div>
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
