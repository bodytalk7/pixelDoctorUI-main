"use client";

import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import { User, Calendar, Activity } from "lucide-react";
import styles from "./patient-list.module.css";

export function PatientList({ patients }: { patients: any[] }) {
  if (patients.length === 0) {
    return (
      <div className={styles.empty}>
        <User className={styles.emptyIcon} />
        <p className={styles.emptyText}>등록된 환자가 없습니다</p>
      </div>
    );
  }
  return (
    <div className={styles.grid}>
      {patients.map((patient) => {
        const lastVisit = patient.visits[0];
        return (
          <Link key={patient.id} href={`/patients/${patient.id}`} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardAvatar}>
                <User className={styles.cardAvatarIcon} />
              </div>
              <span className={styles.cardCode}>{patient.patientCode}</span>
            </div>
            <h3 className={styles.cardName}>{patient.name}</h3>
            <p className={styles.cardDoctor}>{patient.doctor.name} · {patient.doctor.specialty ?? "일반의"}</p>
            <div className={styles.cardMeta}>
              <span className={styles.cardMetaItem}>
                <Activity className={styles.cardMetaIcon} />
                {patient._count.visits}회 방문
              </span>
              {lastVisit && (
                <span className={styles.cardMetaItem}>
                  <Calendar className={styles.cardMetaIcon} />
                  {formatRelative(lastVisit.visitedAt)}
                </span>
              )}
            </div>
            {lastVisit?.symptoms && (
              <p className={styles.cardSymptoms}>{lastVisit.symptoms}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
