"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import styles from "./chat-room.module.css";

interface Props {
  visit: any;
  chatSessions: any[];
  patientId: string;
  patients: any[];
}

export function ChatRoom({ visit, chatSessions, patientId, patients }: Props) {
  const [activeSession, setActiveSession] = useState<any>(chatSessions.length > 0 ? chatSessions[0] : null);

  return (
    <div className={styles.room}>
      <div className={styles.header}>
        <Link href={`/patients/${patientId}/visits/${visit.id}`} className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} />
          방문 기록으로
        </Link>
        <span className={styles.headerDivider}>·</span>
        <span className={styles.headerTitle}>
          {visit.patient.name} · {formatDateTime(visit.visitedAt)} 방문
        </span>
      </div>
      <div className={styles.body}>
        <ChatSidebar
          visit={visit}
          chatSessions={chatSessions}
          activeSessionId={activeSession?.id ?? null}
          onSessionSelect={(s) => setActiveSession(s)}
          patients={patients}
        />
        <div className={styles.chatArea}>
          <ChatWindow
            visitId={visit.id}
            participantType="DOCTOR"
            initialSession={activeSession}
            onNewSession={(s) => setActiveSession(s)}
          />
        </div>
      </div>
    </div>
  );
}
