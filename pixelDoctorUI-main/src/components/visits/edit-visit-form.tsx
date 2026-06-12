"use client";

import { useState } from "react";
import { updateVisit } from "@/server/actions/patient";
import styles from "./visit-form.module.css";

interface Visit {
  id: string;
  visitedAt: Date;
  symptoms: string;
  treatment: string | null;
}

export function EditVisitForm({ visit, patientId }: { visit: Visit; patientId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const visitedAtLocal = new Date(visit.visitedAt);
  visitedAtLocal.setMinutes(visitedAtLocal.getMinutes() - visitedAtLocal.getTimezoneOffset());
  const defaultDateTime = visitedAtLocal.toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null); setSaved(false);
    const formData = new FormData(e.currentTarget);
    const result = await updateVisit(visit.id, patientId, formData);
    if (result?.error) { setError(result.error); setLoading(false); }
    else { setSaved(true); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} style={{ border: "none", padding: 0, borderRadius: 0 }}>
      <div className={styles.field}>
        <label className={styles.label}>방문 일시</label>
        <input name="visitedAt" type="datetime-local" required
          defaultValue={defaultDateTime} className={styles.input} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>증세</label>
        <textarea name="symptoms" required rows={3}
          defaultValue={visit.symptoms} className={styles.textarea} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>조치방법</label>
        <textarea name="treatment" rows={3}
          defaultValue={visit.treatment ?? ""} className={styles.textarea} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {saved && <p className={styles.success}>저장되었습니다</p>}
      <button type="submit" disabled={loading} className={styles.submitBtnFull}>
        {loading ? "저장 중..." : "수정 저장"}
      </button>
    </form>
  );
}
