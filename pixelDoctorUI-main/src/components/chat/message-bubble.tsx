"use client";

import { formatDateTime } from "@/lib/utils";
import { Bot, User, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useState } from "react";
import styles from "./message-bubble.module.css";

interface Props {
  message: {
    id: string;
    role: string;
    content: string;
    finalResponse: string | null;
    doctorExplanation: string | null;
    patientExplanation: string | null;
    reportJson: any;
    followUpQuestions: { id: string; question: string; orderIndex: number }[];
    ragReferences: { id: string; title: string; similarityScore: number }[];
    createdAt: Date | string;
  };
  participantType: "DOCTOR" | "PATIENT_LINK";
  onFollowUpClick: (question: string) => void;
}

export function MessageBubble({ message, participantType, onFollowUpClick }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className={styles.userWrap}>
        <div className={styles.userAvatar}><User className={styles.userAvatarIcon} /></div>
        <div className={styles.userContent}>
          <div className={styles.userBubble}>{message.content}</div>
          <p className={styles.userTime}>{formatDateTime(message.createdAt)}</p>
        </div>
      </div>
    );
  }

  const displayText = message.finalResponse ?? message.content;
  const riskLevel   = message.reportJson?.risk_level;
  const recommendations: string[] = message.reportJson?.recommendations ?? [];

  const riskClass = { low: styles.riskLow, moderate: styles.riskMod, high: styles.riskHigh }[riskLevel as string] ?? "";
  const riskLabel = { low: "낮음", moderate: "중간", high: "높음" }[riskLevel as string];

  return (
    <div className={styles.aiWrap}>
      <div className={styles.aiAvatar}><Bot className={styles.aiAvatarIcon} /></div>
      <div className={styles.aiContent}>
        <div className={styles.aiBubble}>
          <p className={styles.aiBubbleText}>{displayText}</p>
          {riskLevel && (
            <div className={styles.riskWrap}>
              <span className={`${styles.riskBadge} ${riskClass}`}>위험도: {riskLabel}</span>
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className={styles.recBox}>
            <p className={styles.recTitle}>권고사항</p>
            {recommendations.map((rec, i) => (
              <p key={i} className={styles.recItem}>
                <span className={styles.recDot} />{rec}
              </p>
            ))}
          </div>
        )}

        {participantType === "DOCTOR" && (message.doctorExplanation || message.patientExplanation) && (
          <div>
            <button onClick={() => setShowDetail(!showDetail)} className={styles.detailToggle}>
              {showDetail
                ? <ChevronUp className={styles.detailToggleIcon} />
                : <ChevronDown className={styles.detailToggleIcon} />}
              상세 설명 {showDetail ? "접기" : "펼치기"}
            </button>
            {showDetail && (
              <div className={styles.detailBox}>
                {message.doctorExplanation && (
                  <div className={styles.detailCard}>
                    <p className={styles.detailCardLabel}>의사용 설명</p>
                    <p className={styles.detailCardText}>{message.doctorExplanation}</p>
                  </div>
                )}
                {message.patientExplanation && (
                  <div className={styles.detailCard}>
                    <p className={styles.detailCardLabel}>환자용 설명</p>
                    <p className={styles.detailCardText}>{message.patientExplanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {message.ragReferences.length > 0 && (
          <div className={styles.ragWrap}>
            <BookOpen className={styles.ragIcon} />
            {message.ragReferences.map((ref) => (
              <span key={ref.id} className={styles.ragBadge}>
                {ref.title} ({Math.round(ref.similarityScore * 100)}%)
              </span>
            ))}
          </div>
        )}

        {message.followUpQuestions.length > 0 && (
          <div className={styles.followUpWrap}>
            <p className={styles.followUpLabel}>추천 질문</p>
            {message.followUpQuestions
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((q) => (
                <button key={q.id} onClick={() => onFollowUpClick(q.question)} className={styles.followUpBtn}>
                  {q.question}
                </button>
              ))}
          </div>
        )}

        <p className={styles.aiTime}>{formatDateTime(message.createdAt)}</p>
      </div>
    </div>
  );
}
