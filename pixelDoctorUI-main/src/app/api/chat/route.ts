import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callPipeline, buildReportJson, buildChatHistory } from "@/server/services/pipeline.service";
import { z } from "zod";

const RequestSchema = z.object({
  sessionId: z.string().min(1),
  message:   z.string().min(1),
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
      return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
    }
    const { sessionId, message } = parsed.data;

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        visit: {
          include: {
            xrayImages: {
              where: { analysisStatus: "COMPLETED" },
              orderBy: { analyzedAt: "desc" },
              take: 1,
            },
            ctScans: {
              where: { analysisStatus: "COMPLETED" },
              orderBy: { analyzedAt: "desc" },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true, finalResponse: true },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "채팅 세션을 찾을 수 없습니다" }, { status: 404 });
    }

    await prisma.chatMessage.create({
      data: { chatSessionId: sessionId, role: "user", content: message },
    });

    const xrayResult = chatSession.visit.xrayImages[0]?.analysisResult as Record<string, unknown> | null;
    const ctResult   = chatSession.visit.ctScans[0]?.analysisResult   as Record<string, unknown> | null;
    const reportJson = buildReportJson(xrayResult, ctResult);
    const chatHistory = buildChatHistory(chatSession.messages);
    const participantRole = chatSession.participantType === "DOCTOR" ? "doctor" : "patient";

    const pipelineRes = await callPipeline({
      role: participantRole,
      question: message,
      report_json: reportJson,
      model_result_json: { xray: xrayResult, ct: ctResult },
      chat_history: chatHistory,
    });

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: "assistant",
        content: pipelineRes.answer,
        finalResponse: pipelineRes.answer,
        reportJson: reportJson as any,
        doctorExplanation: reportJson.doctor_summary || null,
        patientExplanation: reportJson.patient_friendly || null,
        diagnosisSummary: {
          summary: reportJson.doctor_summary,
          keyFindings: [],
          urgencyLevel: reportJson.risk_level,
        },
      },
      include: {
        followUpQuestions: { orderBy: { orderIndex: "asc" } },
        ragReferences: true,
      },
    });

    return NextResponse.json({
      message: {
        id:                 assistantMessage.id,
        role:               "assistant",
        content:            assistantMessage.content,
        finalResponse:      assistantMessage.finalResponse,
        doctorExplanation:  assistantMessage.doctorExplanation,
        patientExplanation: assistantMessage.patientExplanation,
        reportJson:         assistantMessage.reportJson,
        followUpQuestions:  assistantMessage.followUpQuestions,
        ragReferences:      assistantMessage.ragReferences,
        createdAt:          assistantMessage.createdAt,
      },
    });

  } catch (err) {
    console.error("[POST /api/chat]", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
