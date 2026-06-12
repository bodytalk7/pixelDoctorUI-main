import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, CalendarDays, Activity } from "lucide-react";
import styles from "./patients-home.module.css";

export const metadata: Metadata = { title: "환자 목록" };

export default async function PatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const where = {
    ...(session.user.role !== "ADMIN" && { doctorId: session.user.id }),
    ...(session.user.hospitalUnitId && { hospitalUnitId: session.user.hospitalUnitId }),
  };

  const [totalPatients, weekVisits] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.visit.count({
      where: {
        patient: where,
        visitedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const stats = [
    { label: "전체 환자",    value: totalPatients, icon: Users,        iconBg: styles.statIconBlue,   iconColor: styles.statIconInnerBlue   },
    { label: "이번 주 방문", value: weekVisits,    icon: CalendarDays, iconBg: styles.statIconPurple, iconColor: styles.statIconInnerPurple },
    { label: "AI 분석",      value: "-",           icon: Activity,     iconBg: styles.statIconGreen,  iconColor: styles.statIconInnerGreen  },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.greeting}>
          <h1 className={styles.greetingTitle}>안녕하세요, {session.user.name}님</h1>
          <p className={styles.greetingDesc}>왼쪽 목록에서 환자를 선택하거나 새 환자를 등록하세요</p>
        </div>
        <div className={styles.statsGrid}>
          {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
            <div key={label} className={styles.statCard}>
              <div className={`${styles.statIcon} ${iconBg}`}>
                <Icon className={`${styles.statIconInner} ${iconColor}`} />
              </div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}