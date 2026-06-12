import type { Metadata } from "next";
import { NewPatientForm } from "@/components/patients/new-patient-form";

export const metadata: Metadata = { title: "새 환자 등록" };

export default function NewPatientPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">새 환자 등록</h1>
        <p className="text-sm text-slate-500 mt-0.5">환자 기본 정보를 입력하세요</p>
      </div>
      <NewPatientForm />
    </div>
  );
}
