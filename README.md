# 🩺 Pixel Doctor

> **흉부 X-ray 및 CT 기반 멀티모달 설명형 진단 지원 시스템**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Pipeline-green)](https://langchain-ai.github.io/langgraph/)
[![GPT-4o](https://img.shields.io/badge/LLM-GPT--4o--mini-orange?logo=openai)](https://openai.com/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-316192?logo=postgresql)](https://postgresql.org/)

---

## 📌 프로젝트 개요

**Pixel Doctor**는 CT segmentation mask와 Radiomics 분석 결과를 입력받아, LangGraph 기반 파이프라인을 통해 **의사용 근거 중심 요약**과 **환자용 안전한 설명**을 분리 생성하는 대화형 의료 AI Assistant입니다.

### 💡 Why Pixel Doctor?

| 문제 | 해결책 |
|------|--------|
| AI 분석 결과가 환자에게 직접 전달 시 과도한 확정 표현·오해 유발 | 의사용·환자용 설명을 역할에 따라 **분리 생성** |
| Radiomics를 임상 확정 지표처럼 해석 시 발생하는 위험 | Radiomics를 **참고 지표로만 제한** — 진단·치료 추천 원천 차단 |
| 단순 LLM 호출로는 출력의 일관성·안전성 제어 어려움 | **LangGraph 단계형 파이프라인**으로 안전성 검토·검증 분리 |
| 의료진과 환자 간 필요한 정보 수준과 표현 방식의 차이 | **RAG 기반** 의학 문헌·가이드라인·유사케이스 검색으로 근거 보강 |

---

## 🏗️ 시스템 아키텍처

```
사용자 (의사 / 환자)
        │ 
        ▼
┌─────────────────────────────┐
│       Next.js Web Service   │
│  채팅 UI · 대시보드 · 환자관리│
└────────────┬────────────────┘
             │
    ┌────────▼────────┐
    │   입력 데이터     │
    │  텍스트·X-ray·CT  │
    └────────┬────────┘
             │
    ┌────────▼────────────────────────────┐
    │       LangGraph 통합 파이프라인      │
    │                                     │
    │  1단계: Diagnose Summary            │
    │  ┌──────────────────────────────┐   │
    │  │ diagnose_summarizer          │   │
    │  │   ├─ [Doctor]  title_gen     │   │
    │  │   │           result_explain │   │
    │  │   └─ [Patient] title_gen     │   │
    │  │               patient_explain│   │
    │  │   └─ follow_up_gen           │   │
    │  └──────────────────────────────┘   │
    │                                     │
    │  2단계: RAG Chat QA                 │
    │  ┌──────────────────────────────┐   │
    │  │ Question Classifier          │   │
    │  │   → FAISS Retriever          │   │
    │  │   → Retrieval Quality Router │   │
    │  │   → Answer Generator         │   │
    │  │   → Safety Validator ↺       │   │
    │  └──────────────────────────────┘   │
    └──────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │  PostgreSQL DB  │
    │  (Prisma ORM)   │
    └─────────────────┘
```

---

## ✨ 핵심 기능

### 1️⃣ AI 분석 결과 기반 리포트 생성
CT mask·Radiomics summary·사용자 질문을 입력받아 `doctor_summary` / `patient_friendly` JSON 구조로 생성

### 2️⃣ 환자 안전 중심 설명 시스템
- 진단 확정·예후 예측·치료 추천을 **원천 차단**
- AI 결과의 한계와 의료진 판독 필요성을 명확히 안내
- "암입니다/정상입니다" 같은 단정 표현 **절대 금지**

### 3️⃣ LangGraph 기반 Agentic Pipeline
입력 검증 → 질문 분류 → 근거 매핑 → 리포트 생성 → 안전성 검토 → 최종 응답을 **노드 기반으로 단계 분리**

### 4️⃣ 의사용 / 환자용 출력 분리

| | 의사용 | 환자용 |
|--|--------|--------|
| 언어 | 전문 의학 용어 | 평이한 한국어 |
| 내용 | CT 방사선 소견, GLCM 등 feature명 포함 | feature명 절대 노출 금지 |
| 톤 | 기술적·학술적 | 차분하고 안심시키는 표현 |

### 5️⃣ 웹 서비스 주요 기능

- **환자 프로젝트 관리**: 환자 생성·검색·수정, 방문 기록 타임라인, X-ray·CT 선택적 첨부
- **AI 채팅 인터페이스**: 멀티턴 대화, 이중 설명 동시 제공, 후속 질문 자동 추천
- **대시보드 & 통계**: X-ray·CT 변화 추이 그래프, 방문 히스토리, 관리자 현황 조회
- **환자 링크 공유**: 시간 기반·수동·복합 만료 정책, 링크 접속 로깅
- **검색 & 권한 제어**: 의사(본인 담당 환자), 관리자(전체 환자) 역할 분리

---

## 🧠 AI 모델 상세

### CT Segmentation + Radiomics

```
원본 CT (.nii.gz)
      │
      ▼
  nnU-Net (3D Segmentation)
      │  0: background / 1: liver / 2: tumor
      ▼
  PyRadiomics (특징 추출)
      │  Shape · First-order · Texture (GLCM, GLRLM, GLSZM...)
      ▼
  QC / 안전성 검증
      │  geometry mismatch · tumor label · NaN 검사
      ▼
  Radiomics JSON / CSV
```

> ⚠️ `tumor label 부재 ≠ 종양 없음` — 모델 출력은 참고 지표이며, 최종 판단은 반드시 의료진이 수행합니다.

### LLM 구성

| 역할 | 모델 |
|------|------|
| Primary | GPT-4o-mini |
| Fallback | Gemini-1.5-flash-preview (Reasoning=LOW) |

### RAG 검색 소스

- 📋 NCCN Guideline
- 📚 PubMed
- 🔍 Similar Cases

---

## 🛠️ 기술 스택

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-38bdf8?logo=tailwindcss)

### Backend / AI
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-green)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![nnU-Net](https://img.shields.io/badge/nnU--Net-segmentation-red)
![PyRadiomics](https://img.shields.io/badge/PyRadiomics-feature_extraction-orange)
![FAISS](https://img.shields.io/badge/FAISS-vector_search-yellow)

### Database / Infra
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-realtime-blue)

---

## 🗄️ 데이터베이스 구조

```
HospitalUnit ──< User (의사/관리자)
                   │
                   └──< Patient ──< Visit
                                     │
                                     ├──< XrayImage
                                     ├──< CTScan
                                     ├──< PatientLink
                                     └──< ChatSession ──< ChatMessage
```

---

## 🚀 시작하기

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에서 아래 항목을 설정하세요:

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# DB 마이그레이션
npx prisma migrate dev

# 시드 데이터 삽입
npx prisma db seed

# 개발 서버 실행
npm run dev
```

### Python AI 서버

```bash
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

---

## 👥 팀원

| 이름 | 역할 |
|------|------|
| 김희현 | AI Pipeline · LangGraph |
| 박상혁 | CT Segmentation · Radiomics |
| 한민섭 |  AI Pipeline · LangGraph |
| 이형호 |  AI Pipeline · LangGraph |
| 이동호 |  AI Pipeline · LangGraph |

---

## ⚠️ 면책 사항

본 시스템은 **의료 보조 도구**로, 의료진의 판단을 대체하지 않습니다. 모든 AI 출력 결과는 반드시 전문 의료진의 검토를 거쳐야 하며, 진단·치료 결정의 근거로 단독 사용할 수 없습니다.

---

<div align="center">
  <sub>Built with ❤️ by Team 7 · AI 2분반</sub>
</div>
