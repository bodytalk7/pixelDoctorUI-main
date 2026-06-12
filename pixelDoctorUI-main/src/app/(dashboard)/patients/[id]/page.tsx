import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VisitList } from "@/components/visits/visit-list";
import { formatDate } from "@/lib/utils";
import { User, Calendar, Plus } from "lucide-react";
import styles from "./patient-detail.module.css";

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const patient = await prisma.patient.findUnique({ where: { id: params.id } });
  return { title: patient ? patient.name : "환자 상세" };
}

export default async function PatientDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      doctor: { select: { name: true, specialty: true } },
      visits: {
        orderBy: { visitedAt: "desc" },
        include: {
          _count: { select: { xrayImages: true, ctScans: true, chatSessions: true } },
        },
      },
    },
  });

  if (!patient) notFound();
  if (session.user.role !== "ADMIN" && patient.doctorId !== session.user.id) notFound();

  const totalXray = patient.visits.reduce((s, v) => s + v._count.xrayImages, 0);
  const totalCT   = patient.visits.reduce((s, v) => s + v._count.ctScans, 0);

  return (
    <div className={styles.container}>
      {/* 환자 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatar}>
            <User className={styles.avatarIcon} />
          </div>
          <div>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{patient.name}</h1>
              <span className={styles.patientCode}>{patient.patientCode}</span>
            </div>
            <div className={styles.metaRow}>
              <Calendar className={styles.metaIcon} />
              <span>{formatDate(patient.birthDate)}생</span>
              <span className={styles.metaDot}>·</span>
              <span>{patient.doctor.name} ({patient.doctor.specialty ?? "일반의"})</span>
            </div>
          </div>
        </div>
        <Link href={`/patients/${patient.id}/visits/new`} className={styles.newVisitBtn}>
          <Plus className={styles.newVisitBtnIcon} />
          새 방문 기록
        </Link>
      </div>

      {/* 통계 */}
      <div className={styles.statsGrid}>
        {[
          { label: "총 방문",  value: patient.visits.length },
          { label: "X-ray",   value: totalXray },
          { label: "CT",      value: totalCT },
        ].map(({ label, value }) => (
          <div key={label} className={styles.statCard}>
            <p className={styles.statValue}>{value}</p>
            <p className={styles.statLabel}>{label}</p>
          </div>
        ))}
      </div>

      {/* 방문 기록 */}
      <p className={styles.sectionLabel}>방문 기록</p>
      <VisitList visits={patient.visits as any} patientId={patient.id} />
    </div>
  );
}