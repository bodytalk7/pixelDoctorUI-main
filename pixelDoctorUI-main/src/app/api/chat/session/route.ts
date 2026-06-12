import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RequestSchema = z.object({
  visitId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "visitId가 필요합니다" }, { status: 400 });
    }

    const existing = await prisma.chatSession.findFirst({
      where: {
        visitId: parsed.data.visitId,
        userId: session.user.id,
        participantType: "DOCTOR",
      },
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

    if (existing) return NextResponse.json({ session: existing });

    const newSession = await prisma.chatSession.create({
      data: {
        visitId: parsed.data.visitId,
        userId: session.user.id,
        participantType: "DOCTOR",
      },
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

    return NextResponse.json({ session: newSession });

  } catch (err) {
    console.error("[POST /api/chat/session]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}