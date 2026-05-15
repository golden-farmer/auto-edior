"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Send,
  Save,
  MessageSquare,
  Loader2,
  Copy,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

import { useQuotaStore } from "@/store/useQuotaStore";
import { useApiKeyStore } from "@/store/useApiKeyStore";

export default function CSResponderPage() {
  const { setQuotaExceeded } = useQuotaStore();
  const { setApiKeyMissing, setApiKeyInvalid } = useApiKeyStore();
  const [companyName, setCompanyName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const guideText = `안녕하세요 고객님, ${companyName || "고객님"}입니다. 먼저 상품 문제로 불편을 드려 대단히 죄송합니다.
신속하고 정확한 처리를 위해 번거로우시겠지만 아래 3가지 사진을 첨부해 주시면 감사하겠습니다.

1. 운송장 번호가 선명하게 보이는 전체 박스 사진
2. 상품 전체가 다 담긴 박스 내부 사진
3. 문제가 발생한 과일의 줌인(확대) 사진

해당 사진들을 첨부해 주시면 확인 후 즉시 교환 및 부분 환불 절차를 도와드리겠습니다. 다시 한번 진심으로 사과드립니다.`;

  const copyGuide = () => {
    navigator.clipboard.writeText(guideText);
    toast.success("가이드 문구가 복사되었습니다.");
  };

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch initial company name
  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch("/api/user/company");
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.companyName || "");
        }
      } catch (error) {
        console.error("Failed to fetch company name", error);
      } finally {
        setIsFetching(false);
      }
    }
    fetchCompany();
  }, []);

  const saveCompany = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      if (res.ok) {
        toast.success("업체 이름이 성공적으로 저장되었습니다.");
      } else {
        toast.error("업체 이름 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save company name", error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const onFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !(companyName || "").trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/cs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (res.status === 403) throw new Error("NO_API_KEY");
        if (res.status === 401) throw new Error("INVALID_API_KEY");
        if (res.status === 503) throw new Error("SERVER_OVERLOADED");
        throw new Error("API Route Error");
      }

      const data = await res.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "응답을 생성하지 못했습니다.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      if (error.message === "QUOTA_EXCEEDED") {
         setQuotaExceeded(true);
      } else if (error.message === "NO_API_KEY") {
         setApiKeyMissing(true);
      } else if (error.message === "INVALID_API_KEY") {
         setApiKeyInvalid(true);
      } else if (error.message === "SERVER_OVERLOADED") {
         toast.error('Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
      } else {
         toast.error("AI 응답을 가져오는 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">CS 자동 응답기</h1>
          </div>
        </div>

        {/* Company Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
            <div className="flex items-center pl-2 text-gray-400">
              <Building2 size={16} />
            </div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="업체 이름 입력"
              className="w-48 bg-transparent px-2 py-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              disabled={isFetching}
            />
          </div>
          <button
            onClick={saveCompany}
            disabled={isSaving || isFetching}
            className="flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-1.5" />}
            저장
          </button>
        </div>
      </header>

      {/* Chat Container */}
      <main className="mx-auto flex w-full max-w-[1400px] gap-6 flex-1 p-6 justify-center">
        {/* Left Spacer for absolute centering */}
        <div className="w-[320px] shrink-0 hidden lg:block pointer-events-none opacity-0"></div>

        {/* Center Column (Chat + Input) */}
        <div className="flex flex-col min-w-0 w-full max-w-3xl h-full">
          <div className="flex-1 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm overflow-y-auto mb-4 min-h-[50vh]">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <MessageSquare size={48} className="mb-4 text-blue-100" />
                <p className="text-lg font-medium text-gray-500">CS 담당 AI입니다.</p>
                <p className="mt-1 text-sm">고객 문의 내용을 입력해주세요.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex w-full ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  답변 생성 중...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <form
              onSubmit={onFormSubmit}
              className="flex items-end gap-2"
            >
              <textarea
                className="max-h-32 min-h-[44px] w-full resize-none rounded-lg bg-transparent px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="고객 불만 또는 문의 사항을 입력하세요..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onFormSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim() || !(companyName || "").trim()}
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                <Send size={18} />
              </button>
            </form>
            {!(companyName || "").trim() && (
              <p className="mt-2 px-2 text-xs text-red-500">
                진행하기 전 우측 상단에서 업체 이름을 먼저 저장해주세요.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (Guide Sidebar) */}
        <aside className="w-[320px] shrink-0 hidden lg:flex flex-col gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Copy size={16} /> 사진 요청 (빠른 복사 가이드)
            </h3>
            <p className="text-xs text-blue-700 mb-4 opacity-90 leading-tight">
              고객이 아직 증빙 사진을 제출하지 않았다면, 아래 문구를 복사해서 직접 전달해주세요. (AI는 항상 고객이 사진을 이미 제출했다고 가정하고 응대합니다.)
            </p>
            <div className="bg-white p-3 p-y-2 rounded-lg text-xs leading-relaxed text-gray-700 whitespace-pre-wrap border border-blue-100 max-h-72 overflow-y-auto">
              {guideText}
            </div>
            <button
              onClick={copyGuide}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
            >
              <Copy size={16} /> 가이드 문구 복사하기
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
