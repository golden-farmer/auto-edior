"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wand2, ImageIcon, Download, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useQuotaStore } from "@/store/useQuotaStore";
import { useApiKeyStore } from "@/store/useApiKeyStore";

export default function ThumbnailEditorPage() {
  const { setQuotaExceeded } = useQuotaStore();
  const { setApiKeyMissing, setApiKeyInvalid } = useApiKeyStore();
  const [ingredient, setIngredient] = useState("");
  const [category, setCategory] = useState("과일");
  const [customPrompt, setCustomPrompt] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("이미지 포맷(JPG, PNG 등)의 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("업로드 실패: 이미지 크기는 최대 5MB 이하여야 합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!ingredient.trim()) {
      toast.error("식재료명을 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setStatusMessage("식재료 분석 및 최적화 프롬프트 생성 중...");

    try {
      const promptRes = await fetch("/api/generate-thumbnail-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient, category, customPrompt }),
      });

      const promptData = await promptRes.json();
      if (!promptRes.ok) {
        if (promptRes.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (promptRes.status === 403) throw new Error("NO_API_KEY");
        if (promptRes.status === 401) throw new Error("INVALID_API_KEY");
        if (promptRes.status === 503) throw new Error("SERVER_OVERLOADED");
        throw new Error(promptData.error || "프롬프트 생성에 실패했습니다.");
      }

      const generatedPrompt = promptData.prompt;
      
      setStatusMessage("극사실주의 8K 썸네일 이미지 렌더링 중 (Imagen 4.0)...");

      const imageRes = await fetch("/api/generate-thumbnail-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatedPrompt, referenceImage }),
      });

      const imageData = await imageRes.json();
      if (!imageRes.ok) {
        if (imageRes.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (imageRes.status === 403) throw new Error("NO_API_KEY");
        if (imageRes.status === 401) throw new Error("INVALID_API_KEY");
        if (imageRes.status === 503) throw new Error("SERVER_OVERLOADED");
        throw new Error(imageData.error || "이미지 생성에 실패했습니다.");
      }

      setGeneratedImage(`data:image/png;base64,${imageData.base64Image}`);
      setStatusMessage("");
      toast.success("썸네일 이미지가 성공적으로 생성되었습니다!");
    } catch (err: any) {
      console.error(err);
      if (err.message === "QUOTA_EXCEEDED") {
        setQuotaExceeded(true);
      } else if (err.message === "NO_API_KEY") {
        setApiKeyMissing(true);
      } else if (err.message === "INVALID_API_KEY") {
        setApiKeyInvalid(true);
      } else if (err.message === "SERVER_OVERLOADED") {
        toast.error('Gemini AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
      } else {
        toast.error(err.message || "이미지 생성 중 오류가 발생했습니다.");
      }
      setStatusMessage("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `썸네일_${ingredient}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            대시보드로 돌아가기
          </Link>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 border-b pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <ImageIcon size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI 썸네일 자동 제조기</h2>
                <p className="text-gray-500 mt-1">
                  식재료를 입력하면 AI가 맛을 극대화한 최고 품질의 이미지를 분 간에 만들어냅니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: Input Form */}
            <div className="space-y-6 flex flex-col h-full">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리 선택
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="과일">과일 (과즙, 단면 효과)</option>
                  <option value="신선 채소">신선 채소 (아삭함, 물방울 효과)</option>
                  <option value="익혀 먹는 구황작물">익혀 먹는 구황작물 (따끈함, 모락모락 김 효과)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  식재료명 (예: 사과, 양배추, 꿀고구마)
                </label>
                <input 
                  type="text"
                  value={ingredient}
                  onChange={(e) => setIngredient(e.target.value)}
                  placeholder="식재료를 입력하세요"
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate();
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  추가 연출 프롬프트 (선택)
                </label>
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="원하는 추가 연출을 자유롭게 적어주세요 (예: 물방울이 맺힌, 반으로 가른 단면이 잘 보이는, 햇빛이 비치는 뒷배경)"
                  className="w-full h-24 resize-none rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  레퍼런스 이미지 (선택)
                </label>
                {!referenceImage ? (
                  <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-all ${
                      isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pb-2 pt-2">
                      <Upload className={`mb-2 h-6 w-6 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
                      <p className={`text-sm font-medium ${isDragging ? "text-blue-600" : "text-gray-500"}`}>
                        {isDragging ? "여기에 파일을 놓으세요" : "클릭하거나 이미지를 드래그 앤 드롭"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">최대 5MB 이하의 이미지 파일</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                ) : (
                  <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center p-2 h-32">
                    <img src={referenceImage} alt="Reference Preview" className="h-full object-contain rounded" />
                    <button 
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-100 hover:text-red-600 rounded-full shadow-sm text-gray-600 transition-colors backdrop-blur-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-auto">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !ingredient.trim()}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 px-4 font-bold text-white transition-all text-lg shadow-md ${
                    isGenerating || !ingredient.trim() 
                      ? "bg-blue-300 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      AI 썸네일 이미지 만들기
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Image Generation Result */}
            <div className="flex flex-col space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-200 flex-1 flex flex-col min-h-[400px]">
                 <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-sm">이미지 결과 (Imagen 4.0)</span>
                  {generatedImage && (
                    <button 
                      onClick={handleDownloadImage}
                      className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100"
                    >
                      <Download size={14} className="mr-1.5" /> 다운로드
                    </button>
                  )}
                </div>

                <div className="flex-1 rounded-lg border border-gray-200 bg-white overflow-hidden relative flex items-center justify-center shadow-inner">
                  {!generatedImage && !isGenerating && (
                    <div className="text-center text-gray-500 p-6">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">생성된 이미지가 이곳에 표시됩니다.</p>
                      <p className="text-xs mt-1">비주얼 디렉터가 연출한 극사실주의 1:1 썸네일</p>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 mb-4"></div>
                      <p className="text-blue-600 font-medium animate-pulse">{statusMessage}</p>
                    </div>
                  )}

                  {generatedImage && (
                    <img 
                      src={generatedImage} 
                      alt="Generated Thumbnail" 
                      className={`w-full h-full object-contain ${isGenerating ? 'opacity-30' : 'opacity-100'} transition-opacity duration-300`} 
                    />
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
