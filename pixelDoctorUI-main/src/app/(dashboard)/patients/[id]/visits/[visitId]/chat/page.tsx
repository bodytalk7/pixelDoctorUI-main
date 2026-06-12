import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatRoom } from "@/components/chat/chat-room";

interface Props { params: { id: string; visitId: string } }

export const metadata: Metadata = { title: "AI 채팅" };

export default async function ChatPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const visit = await prisma.visit.findUnique({
    where: { id: params.visitId },
    include: {
      patient: {
        include: {
          doctor: { select: { name: true, specialty: true } },
        },
      },
      xrayImages: {
        orderBy: { createdAt: "desc" },
        select: { id: true, analysisStatus: true, analyzedAt: true, analysisResult: true, createdAt: true },
      },
      ctScans: {
        orderBy: { createdAt: "desc" },
        select: { id: true, analysisStatus: true, analyzedAt: true, analysisResult: true, createdAt: true },
      },
    },
  });

  if (!visit || visit.patient.id !== params.id) notFound();
  if (session.user.role !== "ADMIN" && visit.patient.doctorId !== session.user.id) notFound();

  // 기존 채팅 세션 목록
  const chatSessions = await prisma.chatSession.findMany({
    where: { visitId: params.visitId, participantType: "DOCTOR" },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          followUpQuestions: { orderBy: { orderIndex: "asc" } },
          ragReferences: true,
        },
      },
    },
  });

  // 환자 전환용 — 담당 환자 전체 목록 (최근 방문 포함)
  const patients = await prisma.patient.findMany({
    where: {
      ...(session.user.role !== "ADMIN" && { doctorId: session.user.id }),
      ...(session.user.hospitalUnitId && { hospitalUnitId: session.user.hospitalUnitId }),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      patientCode: true,
      visits: {
        orderBy: { visitedAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  return (
    <ChatRoom
      visit={visit as any}
      chatSessions={chatSessions as any}
      patientId={params.id}
      patients={patients}
    />
  );
}