import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-2xl shadow-sm border">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            X-ray AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            아이디와 비밀번호를 입력하여 로그인하세요
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
