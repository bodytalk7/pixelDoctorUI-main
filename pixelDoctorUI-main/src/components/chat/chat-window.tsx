"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { Bot, MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import styles from "./chat-window.module.css";

interface Message {
  id: string;
  role: string;
  content: string;
  finalResponse: string | null;
  doctorExplanation: string | null;
  patientExplanation: string | null;
  reportJson: any;
  followUpQuestions: { id: string; question: string; orderIndex: number }[];
  ragReferences: any[];
  createdAt: Date | string;
}

interface ChatSession {
  id: string;
  createdAt: Date | string;
  messages: Message[];
}

interface Props {
  visitId: string;
  participantType: "DOCTOR" | "PATIENT_LINK";
  initialSession: ChatSession | null;
  onNewSession?: (session: ChatSession) => void;
}

export function ChatWindow({ visitId, participantType, initialSession, onNewSession }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(initialSession?.id ?? null);
  const [messages, setMessages] = useState<Message[]>(initialSession?.messages ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(initialSession?.id ?? null);
    setMessages(initialSession?.messages ?? []);
    setError(null);
  }, [initialSession?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "세션 생성 실패");
    setSessionId(data.session.id);
    onNewSession?.(data.session);
    return data.session.id;
  }

  async function handleSend(text: string) {
    setLoading(true);
    setError(null);
    const userMsg: Message = {
      id: `temp-${Date.now()}`, role: "user", content: text,
      finalResponse: null, doctorExplanation: null, patientExplanation: null,
      reportJson: null, followUpQuestions: [], ragReferences: [], createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const sid = await ensureSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "응답 오류");
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      setError(err.message ?? "오류가 발생했습니다");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.window}>
      {initialSession && (
        <div className={styles.sessionHeader}>
          <MessageSquare className={styles.sessionHeaderIcon} />
          <span className={styles.sessionHeaderDate}>{formatDateTime(initialSession.createdAt)} 세션</span>
          <span className={styles.sessionHeaderCount}>{messages.length}개 메시지</span>
        </div>
      )}
      <div className={styles.messages}>
        {messages.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Bot className={styles.emptyIconInner} /></div>
            <p className={styles.emptyTitle}>AI 진단 보조 채팅</p>
            <p className={styles.emptyDesc}>X-ray · CT 분석 결과를 기반으로 질문해보세요</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg}
            participantType={participantType} onFollowUpClick={handleSend} />
        ))}
        {loading && (
          <div className={styles.loadingWrap}>
            <div className={styles.loadingAvatar}><Bot className={styles.loadingAvatarIcon} /></div>
            <div className={styles.loadingBubble}>
              <div className={styles.loadingDots}>
                {[0,1,2].map((i) => <span key={i} className={styles.loadingDot} />)}
              </div>
            </div>
          </div>
        )}
        {error && (
          <div style={{ textAlign: "center" }}>
            <p className={styles.error}>{error}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
