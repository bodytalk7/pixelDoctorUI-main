import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { EditVisitForm } from "@/components/visits/edit-visit-form";
import { ArrowLeft, Bot, FileImage, ScanLine } from "lucide-react";
import styles from "./visit-detail.module.css";

interface Props { params: { id: string; visitId: string } }

export const metadata: Metadata = { title: "방문 기록" };

export default async function VisitDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const visit = await prisma.visit.findUnique({
    where: { id: params.visitId },
    include: {
      patient: { select: { id: true, name: true, patientCode: true, doctorId: true } },
      xrayImages: true,
      ctScans: true,
      _count: { select: { chatSessions: true } },
    },
  });

  if (!visit || visit.patient.id !== params.id) notFound();
  if (session.user.role !== "ADMIN" && visit.patient.doctorId !== session.user.id) notFound();

  return (
    <div className={styles.container}>
      {/* 뒤로가기 */}
      <Link href={`/patients/${params.id}`} className={styles.backLink}>
        <ArrowLeft className={styles.backIcon} />
        {visit.patient.name} 환자로 돌아가기
      </Link>

      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>방문 기록</h1>
        <p className={styles.headerDate}>{formatDateTime(visit.visitedAt)}</p>
      </div>

      {/* 수정 폼 */}
      <div className={styles.formCard}>
        <EditVisitForm visit={visit as any} patientId={params.id} />
      </div>

      {/* 액션 카드 */}
      <div className={styles.actionGrid}>
        <Link
          href={`/patients/${params.id}/visits/${params.visitId}/chat`}
          className={styles.actionCard}
        >
          <div className={`${styles.actionIconWrap} ${styles.actionIconBlue}`}>
            <Bot className={`${styles.actionIcon} ${styles.actionIconColorBlue}`} />
          </div>
          <div>
            <p className={styles.actionTitle}>AI 채팅 시작</p>
            <p className={styles.actionDesc}>
              {visit._count.chatSessions > 0 ? `세션 ${visit._count.chatSessions}개` : "새 대화 시작"}
            </p>
          </div>
        </Link>

        <div className={styles.actionCard}>
          <div className={`${styles.actionIconWrap} ${styles.actionIconSlate}`}>
            <FileImage className={`${styles.actionIcon} ${styles.actionIconColorSlate}`} />
          </div>
          <div>
            <p className={styles.actionTitle}>X-ray 이미지</p>
            <p className={styles.actionDesc}>
              {visit.xrayImages.length > 0 ? `${visit.xrayImages.length}장 첨부됨` : "첨부 없음"}
            </p>
          </div>
        </div>

        <div className={styles.actionCard}>
          <div className={`${styles.actionIconWrap} ${styles.actionIconPurple}`}>
            <ScanLine className={`${styles.actionIcon} ${styles.actionIconColorPurple}`} />
          </div>
          <div>
            <p className={styles.actionTitle}>CT 영상</p>
            <p className={styles.actionDesc}>
              {visit.ctScans.length > 0 ? `${visit.ctScans.length}개 첨부됨` : "첨부 없음"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}