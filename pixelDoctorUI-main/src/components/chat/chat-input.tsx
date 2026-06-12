"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import styles from "./chat-input.module.css";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputWrap}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          rows={1}
          placeholder="메시지를 입력하세요 (Enter 전송 · Shift+Enter 줄바꿈)"
          className={styles.textarea}
        />
        <button onClick={handleSend} disabled={disabled || !text.trim()} className={styles.sendBtn}>
          <Send className={styles.sendIcon} />
        </button>
      </div>
      <p className={styles.disclaimer}>AI 응답은 진단을 대체하지 않습니다. 최종 판단은 전문의가 수행해야 합니다.</p>
    </div>
  );
}
