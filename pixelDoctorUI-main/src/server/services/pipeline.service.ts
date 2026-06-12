import type { PipelineRequest, PipelineResponse, ReportJson } from "@/types";

const PIPELINE_URL = process.env.PIPELINE_URL ?? "http://127.0.0.1:8000/chat";

// ── pipixel-doctor 서버 호출 ──────────────────────────────────────
export async function callPipeline(req: PipelineRequest): Promise<PipelineResponse> {
  const res = await fetch(PIPELINE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error(`Pipeline 서버 오류: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<PipelineResponse>;
}

// ── visit의 분석 결과로 report_json 조성 ─────────────────────────
export function buildReportJson(
  xrayResult: Record<string, unknown> | null,
  ctResult: Record<string, unknown> | null
): ReportJson {
  // 자체 모델 출력이 있으면 그 값을 쓰고, 없으면 기본값
  return {
    doctor_summary: (xrayResult?.impression as string) ?? (ctResult?.impression as string) ?? "",
    patient_friendly: "",
    risk_level: (xrayResult?.risk_level as ReportJson["risk_level"]) ?? "low",
    recommendations: (xrayResult?.recommendations as string[]) ?? [],
    evidence: [],
  };
}

// ── 채팅 히스토리 포맷 변환 ──────────────────────────────────────
export function buildChatHistory(
  messages: { role: string; content: string; finalResponse: string | null }[]
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    // assistant 메시지는 finalResponse를 히스토리로 전송
    content: m.role === "assistant" ? (m.finalResponse ?? m.content) : m.content,
  }));
}