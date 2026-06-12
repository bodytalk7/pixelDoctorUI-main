import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { isLinkExpired } from "@/lib/utils";

interface Props {
  params: { token: string };
}

export default async function PatientChatPage({ params }: Props) {
  const link = await prisma.patientLink.findUnique({
    where: { token: params.token },
    include: {
      visit: {
        select: { id: true, visitedAt: true, symptoms: true, patientId: true },
      },
    },
  });

  if (!link) return notFound();

  const expired = isLinkExpired(link.expiresAt, link.isManuallyExpired);
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3 p-8">
          <p className="text-lg font-semibold text-slate-700">링크가 만료되었습니다</p>
          <p className="text-sm text-slate-400">담당 의사에게 문의하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-sm font-semibold text-slate-800">AI 진료 상담</h1>
        <p className="text-xs text-slate-400 mt-0.5">궁금한 점을 자유롭게 질문하세요</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-slate-400">채팅 UI — 구현 예정 (visitId: {link.visit.id})</p>
      </div>
    </div>
  );
}
