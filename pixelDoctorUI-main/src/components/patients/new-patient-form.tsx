"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPatient } from "@/server/actions/patient";
import styles from "./new-patient-form.module.css";

export function NewPatientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createPatient(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>환자 이름 *</label>
        <input name="name" type="text" required className={styles.input} placeholder="홍길동" />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>생년월일 *</label>
        <input name="birthDate" type="date" required className={styles.input} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>환자 ID *</label>
        <input name="patientCode" type="text" required className={styles.input} placeholder="P-2024-002" />
        <p className={styles.hint}>병원 내 고유 식별 코드</p>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>취소</button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
