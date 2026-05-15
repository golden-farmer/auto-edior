import { MarginCalculator } from "@/components/modules/margin/MarginCalculator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MarginCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          대시보드로 돌아가기
        </Link>
      </div>
      <MarginCalculator />
    </div>
  );
}
