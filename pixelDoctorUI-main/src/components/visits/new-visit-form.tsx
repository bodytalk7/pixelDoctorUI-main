"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVisit } from "@/server/actions/patient";
import styles from "./visit-form.module.css";

export function NewVisitForm({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createVisit(patientId, formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const defaultDateTime = now.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>방문 일시 *</label>
        <input name="visitedAt" type="datetime-local" required
          defaultValue={defaultDateTime} className={styles.input} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>증세 *</label>
        <textarea name="symptoms" required rows={3}
          className={styles.textarea} placeholder="환자의 주요 증상을 입력하세요" />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>조치방법</label>
        <textarea name="treatment" rows={3}
          className={styles.textarea} placeholder="처방 또는 조치 내용을 입력하세요" />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>취소</button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
