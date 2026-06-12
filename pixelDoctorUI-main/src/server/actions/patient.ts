"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── 유효성 검사 스키마 ───────────────────────────────────────────

const PatientSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요"),
  birthDate: z.string().min(1, "생년월일을 입력하세요"),
  patientCode: z.string().min(1, "환자 ID를 입력하세요"),
});

const VisitSchema = z.object({
  visitedAt: z.string().min(1, "방문 일시를 입력하세요"),
  symptoms: z.string().min(1, "증세를 입력하세요"),
  treatment: z.string().optional(),
});

// ── 환자 생성 ────────────────────────────────────────────────────

export async function createPatient(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("인증이 필요합니다");

  const parsed = PatientSchema.safeParse({
    name: formData.get("name"),
    birthDate: formData.get("birthDate"),
    patientCode: formData.get("patientCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.patient.findUnique({
    where: { patientCode: parsed.data.patientCode },
  });
  if (existing) return { error: "이미 존재하는 환자 ID입니다" };

  const patient = await prisma.patient.create({
    data: {
      name: parsed.data.name,
      birthDate: new Date(parsed.data.birthDate),
      patientCode: parsed.data.patientCode,
      doctorId: session.user.id,
      hospitalUnitId: session.user.hospitalUnitId,
    },
  });

  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

// ── 방문 기록 생성 ───────────────────────────────────────────────

export async function createVisit(patientId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("인증이 필요합니다");

  const parsed = VisitSchema.safeParse({
    visitedAt: formData.get("visitedAt"),
    symptoms: formData.get("symptoms"),
    treatment: formData.get("treatment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const visit = await prisma.visit.create({
    data: {
      patientId,
      visitedAt: new Date(parsed.data.visitedAt),
      symptoms: parsed.data.symptoms,
      treatment: parsed.data.treatment || null,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}/visits/${visit.id}`);
}

// ── 방문 기록 수정 ───────────────────────────────────────────────

export async function updateVisit(visitId: string, patientId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("인증이 필요합니다");

  const parsed = VisitSchema.safeParse({
    visitedAt: formData.get("visitedAt"),
    symptoms: formData.get("symptoms"),
    treatment: formData.get("treatment"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await prisma.visit.update({
    where: { id: visitId },
    data: {
      visitedAt: new Date(parsed.data.visitedAt),
      symptoms: parsed.data.symptoms,
      treatment: parsed.data.treatment || null,
    },
  });

  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}/visits/${visitId}`);
}
