import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
export const metadata: Metadata = { title: "관리자 대시보드" };
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/patients");
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">관리자 대시보드</h1>
      <p className="text-sm text-slate-400">병원 전체 통계 — 구현 예정</p>
    </div>
  );
}
