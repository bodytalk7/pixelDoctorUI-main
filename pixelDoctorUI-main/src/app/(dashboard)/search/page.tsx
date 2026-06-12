import type { Metadata } from "next";
export const metadata: Metadata = { title: "검색" };
export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">환자 검색</h1>
      <p className="text-sm text-slate-400">검색 컴포넌트 — 구현 예정</p>
    </div>
  );
}
