import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewVisitForm } from "@/components/visits/new-visit-form";

interface Props { params: { id: string } }

export const metadata: Metadata = { title: "새 방문 기록" };

export default async function NewVisitPage({ params }: Props) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, patientCode: true },
  });
  if (!patient) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">새 방문 기록</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {patient.name} ({patient.patientCode})
        </p>
      </div>
      <NewVisitForm patientId={patient.id} />
    </div>
  );
}
