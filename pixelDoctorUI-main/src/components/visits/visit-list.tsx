"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { FileImage, ScanLine, MessageSquare, ChevronRight, ClipboardList } from "lucide-react";
import styles from "./visit-list.module.css";

interface Visit {
  id: string;
  visitedAt: Date;
  symptoms: string;
  treatment: string | null;
  _count: { xrayImages: number; ctScans: number; chatSessions: number };
}

export function VisitList({ visits, patientId }: { visits: Visit[]; patientId: string }) {
  if (visits.length === 0) {
    return (
      <div className={styles.empty}>
        <ClipboardList className={styles.emptyIcon} />
        <p className={styles.emptyText}>방문 기록이 없습니다</p>
      </div>
    );
  }
  return (
    <div className={styles.list}>
      {visits.map((visit) => (
        <Link key={visit.id} href={`/patients/${patientId}/visits/${visit.id}`} className={styles.item}>
          <div className={styles.dateBlock}>
            <p className={styles.dateMain}>{formatDateTime(visit.visitedAt).split(" ")[0]}</p>
            <p className={styles.dateTime}>{formatDateTime(visit.visitedAt).split(" ")[1]}</p>
          </div>
          <div className={styles.divider} />
          <div className={styles.symptoms}>
            <p className={styles.symptomsText}>{visit.symptoms}</p>
            {visit.treatment && <p className={styles.treatmentText}>{visit.treatment}</p>}
          </div>
          <div className={styles.badges}>
            {visit._count.xrayImages > 0 && (
              <span className={`${styles.badge} ${styles.badgeXray}`}>
                <FileImage className={styles.badgeIcon} />X-ray {visit._count.xrayImages}
              </span>
            )}
            {visit._count.ctScans > 0 && (
              <span className={`${styles.badge} ${styles.badgeCT}`}>
                <ScanLine className={styles.badgeIcon} />CT {visit._count.ctScans}
              </span>
            )}
            {visit._count.chatSessions > 0 && (
              <span className={`${styles.badge} ${styles.badgeChat}`}>
                <MessageSquare className={styles.badgeIcon} />{visit._count.chatSessions}
              </span>
            )}
          </div>
          <ChevronRight className={styles.chevron} />
        </Link>
      ))}
    </div>
  );
}
