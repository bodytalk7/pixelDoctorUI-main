import type {
  User, Patient, Visit, XrayImage, CTScan,
  ChatSession, PatientLink, FollowUpQuestion, RagReference
} from "@prisma/client";

// -----------------------------------------------
// 세션 사용자 (NextAuth)
// -----------------------------------------------
export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "DOCTOR";
  accountType: "INDIVIDUAL" | "HOSPITAL";
  hospitalUnitId: string | null;
};

// -----------------------------------------------
// API 응답 래퍼
// -----------------------------------------------
export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

// -----------------------------------------------
// 환자 + 관계 데이터
// -----------------------------------------------
export type PatientWithDoctor = Patient & {
  doctor: Pick<User, "id" | "name" | "specialty">;
  _count: { visits: number };
  visits: Pick<Visit, "id" | "visitedAt" | "symptoms">[];
};

// -----------------------------------------------
// 방문 기록 + 관계 데이터
// -----------------------------------------------
export type VisitWithMedia = Visit & {
  xrayImages: XrayImage[];
  ctScans: CTScan[];
  _count: { chatSessions: number };
};

// -----------------------------------------------
// 채팅 메시지 (UI용)
// -----------------------------------------------
export type ChatMessageUI = {
  id: string;
  role: "user" | "assistant";
  content: string;
  finalResponse?: string | null;
  doctorExplanation?: string | null;
  patientExplanation?: string | null;
  reportJson?: ReportJson | null;
  followUpQuestions: Pick<FollowUpQuestion, "id" | "question" | "orderIndex">[];
  ragReferences: Pick<RagReference, "id" | "title" | "similarityScore">[];
  createdAt: Date;
};

// -----------------------------------------------
// 환자 링크 (만료 상태 포함)
// -----------------------------------------------
export type PatientLinkWithStatus = PatientLink & {
  isExpired: boolean;
  visit: Pick<Visit, "id" | "visitedAt" | "symptoms">;
};

// -----------------------------------------------
// 분석 결과 JSON 구조 (의도적 비정규화 JSONB)
// -----------------------------------------------
export type XrayAnalysisResult = {
  findings: string[];
  impression: string;
  confidence: number;
  regions?: { label: string; severity: "normal" | "mild" | "moderate" | "severe" }[];
};

export type CTAnalysisResult = {
  findings: string[];
  impression: string;
  confidence: number;
  measurements?: { label: string; value: number; unit: string }[];
};

// -----------------------------------------------
// 파이프라인 report_json 구조
// -----------------------------------------------
export type ReportJson = {
  doctor_summary: string;
  patient_friendly: string;
  risk_level: "low" | "moderate" | "high"; // 파이프라인 기준
  recommendations: string[];
  evidence: {
    json_key: string;
    explanation_for_doctor: string;
    explanation_for_patient: string;
  }[];
};

// -----------------------------------------------
// 파이프라인 요청 전체 구조
// -----------------------------------------------
export type PipelineRequest = {
  role: "doctor" | "patient";
  question: string;
  report_json: ReportJson;
  model_result_json: Record<string, unknown>;
  chat_history: { role: "user" | "assistant"; content: string }[];
};

// -----------------------------------------------
// 파이프라인 응답 구조
// -----------------------------------------------
export type PipelineResponse = {
  answer: string;
};

// -----------------------------------------------
// LangChain 파이프라인 최종 출력 (DB 저장용)
// risk_level: "low" | "moderate" | "high" (파이프라인 기준으로 통일)
// -----------------------------------------------
export type DiagnosisSummary = {
  summary: string;
  keyFindings: string[];
  urgencyLevel: "low" | "moderate" | "high";
};

export type PipelineOutput = {
  diagnosisSummary: DiagnosisSummary;
  doctorTitle: string;
  doctorExplanation: string;
  patientTitle: string;
  patientExplanation: string;
  compareResult: { consistency: boolean; notes: string };
  followUpQuestions: string[];
  reportJson: ReportJson;
  finalResponse: string;
};