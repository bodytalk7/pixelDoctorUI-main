"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./login-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: form.get("username"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) { setError("아이디 또는 비밀번호가 올바르지 않습니다."); return; }
    router.push("/patients");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>아이디</label>
        <input id="username" name="username" type="text" required autoComplete="username"
          className={styles.input} placeholder="아이디를 입력하세요" />
      </div>
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>비밀번호</label>
        <input id="password" name="password" type="password" required autoComplete="current-password"
          className={styles.input} placeholder="비밀번호를 입력하세요" />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" disabled={loading} className={styles.submitBtn}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
