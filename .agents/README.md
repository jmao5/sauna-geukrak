# 사우나 극락 AI Agent & Gemini (Antigravity) 설정 가이드

이 문서는 프로젝트 내 AI 코딩 에이전트(Google Antigravity, Gemini 등) 설정(`GEMINI.md`, `.agents/`)의 구조와 각 결정의 근거를 설명합니다.

---

## 1. 디렉터리 구조 한눈에

```plaintext
GEMINI.md                        # 전역 지침 (매 세션 상시 로드, 200줄 이하 유지)
AGENTS.md                        # Next.js 16 브레이킹 체인지 등 프레임워크 규칙
.agents/
  rules/                         # 도메인 특화 지침 (해당 파일 작업 시 참조)
    architecture.md              #   Next.js 16, proxy.ts, ISR, Zustand, TanStack Query
    supabase-db.md               #   Supabase 3원칙, DB 스키마, JSONB 쿼리, RLS, 트리거
    ui-styling.md                #   Tailwind v4 시맨틱 토큰, <AppFrame>, Framer Motion
  hooks/
    protect_env.js               # 보안 훅 (환경변수 .env.local 및 시크릿 파일 접근 차단)
  skills/                        # 워크스페이스 특화 스킬 (/name)
    clarify/                     #   복잡한 요청을 의도·범위·제약·산출물로 사전 정리
    feature-spec/                #   화면/기능 상세 명세서 마크다운 생성
    task-report/                 #   작업 내역/이슈 분석 리포트 마크다운 생성
    flowchart/                   #   표준 draw.io Flowchart XML 생성
    local-test/                  #   로컬 개발 서버 기반 통합 테스트
  hooks.json                     # Antigravity 라이프사이클 Hook 등록
  output/                        # 스킬 산출물 폴더 (gitignore 대상)
```

---

## 2. 설계 원칙: 루트 GEMINI.md vs rules/

### 왜 분리했는가?
- 컨텍스트 낭비를 줄이고 핵심 지침 준수율을 극대화하기 위해 `GEMINI.md` 크기를 간결하게 유지합니다.
- 루트 `GEMINI.md`에는 **프로젝트 개요, 기술 스택, 디렉토리 구조, 개발 명령어, 핵심 작업 원칙(Karpathy Guidelines)** 등 매 세션 상시 필요한 정보만 담았습니다.
- 상세 도메인 지식(Next.js 16 아키텍처, Supabase RLS/트리거/JSONB, Tailwind v4 토큰/PWA 스타일링)은 `.agents/rules/`의 도메인 특화 규칙으로 분리했습니다.

---

## 3. 보안 훅 (`hooks/protect_env.js` & `hooks.json`)

- `.env.local`, `.env.production` 등 민감한 Supabase 키 및 VAPID 시크릿이 들어있는 설정 파일을 에이전트가 실수로 읽거나 덮어쓰지 못하도록 `PreToolUse` 훅에서 원천 차단합니다.
- Antigravity `hooks.json`의 `PreToolUse` 이벤트에 등록되어 동작합니다.

---

## 4. 커스텀 스킬 목록

- **/clarify**: 사용자의 길거나 복잡한 요청을 받기 전, 의도/범위/제약/산출물 4개 항목으로 요약하고 사용자 확인을 거치는 안전장치 스킬.
- **/feature-spec**: 라우트 화면이나 기능 단위의 아키텍처, 컴포넌트 구조, Server Actions, 데이터 흐름 명세서 생성 (`.agents/output/` 저장).
- **/task-report**: 기능 개발, 버그 픽스, 성능 최적화 후 작업 보고서 마크다운 자동 생성 (`.agents/output/` 저장).
- **/flowchart**: 사용자 액션, Server Actions, Supabase 쿼리 흐름을 표준 draw.io XML로 다이어그램화 (`.agents/output/` 저장).
- **/local-test**: 로컬 포트 3000번 개발 서버와 내장 브라우저를 활용한 화면/콘솔/네트워크 통합 검증.
