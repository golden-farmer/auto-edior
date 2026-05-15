"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Save, ArrowLeft, CheckCircle2, Info } from "lucide-react";

export default function ApiKeyManagementPage() {
  const router = useRouter();
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      const res = await fetch("/api/user/keys");
      const data = await res.json();
      if (res.ok && data.hasKey) {
        setMaskedKey(data.maskedKey);
      }
    } catch (error) {
      console.error("Failed to fetch key status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: newKey.trim() }),
      });

      if (res.ok) {
        setSaveStatus("success");
        setNewKey("");
        fetchKeyStatus();

        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API 키 관리</h1>
              <p className="mt-2 text-gray-600">
                자동화된 작업을 위해 외부 서비스의 API 키를 등록하고 관리합니다.
              </p>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Key size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gemini API 키</h2>
              <p className="text-sm text-gray-500">
                구글 Gemini AI 모델을 사용하기 위한 발급된 키를 입력해주세요.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-1/4 rounded bg-gray-200"></div>
              <div className="h-12 w-full rounded bg-gray-200"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label
                  htmlFor="geminiKey"
                  className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700"
                >
                  <span>현재 저장된 키</span>
                  {maskedKey && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 size={14} />
                      활성화됨
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="geminiKey"
                    type="text"
                    value={maskedKey ? maskedKey : "등록된 키가 없습니다."}
                    disabled
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newKey"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  새 키 입력
                </label>
                <input
                  id="newKey"
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="새로운 API 키를 붙여넣으세요..."
                  className="block w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-indigo-800">
                  <Info size={18} />
                  Gemini API 키 발급 방법
                </h3>
                <ol className="list-inside list-decimal space-y-2 text-sm text-indigo-700 marker:font-medium marker:text-indigo-500">
                  <li>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline transition-colors hover:text-indigo-900"
                    >
                      Google AI Studio
                    </a>
                    에 접속하여 구글 계정으로 로그인합니다.
                  </li>
                  <li>
                    좌측 메뉴에서 <strong>"Get API key"</strong> 버튼을 클릭합니다.
                  </li>
                  <li>
                    <strong>"Create API key"</strong>를 누르고 프로젝트 공간에 생성합니다.
                  </li>
                  <li>
                    생성된 문자열(예: <code className="rounded bg-indigo-100 px-1 py-0.5 text-indigo-800">AIzaSy...</code>)을 복사하여 위 입력란에 저장하세요.
                  </li>
                  <li>
                    별도 결제 수단 등록 없이 <strong>무료</strong>로 사용할 수 있으니 안심하셔도 됩니다.
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-4">
                {saveStatus === "success" ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <CheckCircle2 size={16} />
                    API 키가 성공적으로 저장되었습니다.
                  </p>
                ) : saveStatus === "error" ? (
                  <p className="text-sm font-medium text-red-600">
                    키 저장 중 오류가 발생했습니다. 다시 시도해주세요.
                  </p>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={!newKey.trim() || isSaving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
