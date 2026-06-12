import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 병원 생성
  const hospital = await prisma.hospitalUnit.upsert({
    where: { id: "hospital-1" },
    update: {},
    create: { id: "hospital-1", name: "서울 중앙병원" },
  });

  // 관리자
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "홍원장",
      passwordHash: await hash("admin1234", 12),
      accountType: "HOSPITAL",
      role: "ADMIN",
      specialty: "내과",
      hospitalUnitId: hospital.id,
    },
  });

  // 의사
  const doctor = await prisma.user.upsert({
    where: { username: "doctor1" },
    update: {},
    create: {
      username: "doctor1",
      name: "김의사",
      passwordHash: await hash("doctor1234", 12),
      accountType: "HOSPITAL",
      role: "DOCTOR",
      specialty: "흉부외과",
      hospitalUnitId: hospital.id,
    },
  });

  // 환자
  const patient = await prisma.patient.upsert({
    where: { patientCode: "P-2024-001" },
    update: {},
    create: {
      name: "이환자",
      birthDate: new Date("1980-03-15"),
      patientCode: "P-2024-001",
      doctorId: doctor.id,
      hospitalUnitId: hospital.id,
    },
  });

  // 방문 기록
  const visit = await prisma.visit.create({
    data: {
      patientId: patient.id,
      visitedAt: new Date("2024-11-01T10:00:00"),
      symptoms: "지속적인 기침, 흉통, 미열",
      treatment: "흉부 X-ray 촬영 및 CT 검사 의뢰",
    },
  });

  // 채팅 세션 + 메시지 샘플 (1NF 반영)
  const session = await prisma.chatSession.create({
    data: {
      visitId: visit.id,
      userId: doctor.id,
      participantType: "DOCTOR",
    },
  });

  const message = await prisma.chatMessage.create({
    data: {
      chatSessionId: session.id,
      role: "assistant",
      content: "흉부 X-ray 분석 결과를 안내해드립니다.",
      diagnosisSummary: {
        summary: "좌하엽 음영 증가 소견",
        keyFindings: ["좌하엽 침윤", "경미한 흉막 삼출"],
        urgencyLevel: "high", // "urgent" → "high" (파이프라인 기준으로 수정)
      },
      doctorTitle: "좌하엽 폐렴 의심",
      doctorExplanation: "좌하엽에 침윤 소견이 관찰되며 세균성 폐렴 가능성이 높습니다.",
      patientTitle: "폐에 염증 소견이 있습니다",
      patientExplanation: "왼쪽 폐 아래 부분에 염증이 생긴 것으로 보입니다.",
      compareResult: { consistency: true, notes: "의사·환자 설명 일치" },
      reportJson: {
        doctor_summary: "좌하엽에 침윤 소견이 관찰되며 세균성 폐렴 가능성이 높습니다.",
        patient_friendly: "왼쪽 폐 아래 부분에 염증이 생긴 것으로 보입니다.",
        risk_level: "high",
        recommendations: ["항생제 치료 고려", "추적 X-ray 촬영", "입원 여부 검토"],
        evidence: [
          {
            json_key: "ml_results.risk_score",
            explanation_for_doctor: "좌하엽 침윤 패턴이 세균성 폐렴 소견과 일치합니다.",
            explanation_for_patient: "AI가 CT 영상에서 폐 염증 소견을 확인했습니다.",
          },
        ],
      },
      finalResponse: "좌하엽 폐렴 의심 소견입니다. 항생제 치료를 고려하세요.",
    },
  });

  // FollowUpQuestion (1NF 분리)
  await prisma.followUpQuestion.createMany({
    data: [
      { chatMessageId: message.id, question: "항생제는 어떤 종류를 사용하나요?", orderIndex: 0 },
      { chatMessageId: message.id, question: "추적 X-ray는 언제 촬영해야 하나요?", orderIndex: 1 },
      { chatMessageId: message.id, question: "입원이 필요한가요?", orderIndex: 2 },
    ],
  });

  // RagReference (1NF 분리)
  await prisma.ragReference.createMany({
    data: [
      { chatMessageId: message.id, docId: "doc-001", title: "세균성 폐렴 진단 가이드라인", similarityScore: 0.94 },
      { chatMessageId: message.id, docId: "doc-002", title: "흉부 X-ray 판독 기준", similarityScore: 0.87 },
    ],
  });

  console.log("✓ Seed 완료");
  console.log("  관리자: admin / admin1234");
  console.log("  의사:   doctor1 / doctor1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());