"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Key, X, ExternalLink, AlertTriangle } from "lucide-react";
import { useApiKeyStore } from "@/store/useApiKeyStore";
import { useRouter } from "next/navigation";

export function ApiKeyRequiredModal() {
  const { isApiKeyMissing, isApiKeyInvalid, setApiKeyMissing, setApiKeyInvalid } = useApiKeyStore();
  const router = useRouter();

  const isOpen = isApiKeyMissing || isApiKeyInvalid;
  const isInvalid = isApiKeyInvalid;

  const handleClose = (open: boolean) => {
    if (!open) {
      setApiKeyMissing(false);
      setApiKeyInvalid(false);
    }
  };

  const handleNavigate = () => {
    setApiKeyMissing(false);
    setApiKeyInvalid(false);
    router.push("/dashboard/api-keys");
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200">

          <div className="p-6 border-b border-gray-100 flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isInvalid ? 'bg-red-50' : 'bg-amber-50'}`}>
              {isInvalid ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <Key className="w-6 h-6 text-amber-500" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                {isInvalid ? "API 키가 유효하지 않습니다" : "Gemini API 키가 필요합니다"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 leading-relaxed">
                {isInvalid ? (
                  <>
                    등록된 Gemini API 키가 <strong>만료되었거나 잘못된 키</strong>입니다.
                    올바른 키를 다시 등록해주세요.
                  </>
                ) : (
                  <>
                    AI 기능을 사용하려면 <strong>본인의 Gemini API 키</strong>를 먼저 등록해야 합니다.
                  </>
                )}
                <br />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline font-medium"
                >
                  Google AI Studio에서 무료 발급
                  <ExternalLink className="w-3 h-3" />
                </a>
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
              onClick={handleNavigate}
              className={`px-5 py-2.5 rounded-xl font-medium text-white transition-colors shadow-sm flex items-center gap-2 ${isInvalid ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
            >
              <Key className="w-4 h-4" />
              {isInvalid ? "API 키 다시 등록하기" : "API 키 등록하러 가기"}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
