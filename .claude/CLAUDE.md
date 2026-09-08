# CLAUDE.md

This file provides guidance to Claude Code & AI Coding Agents when working with code in this repository.

> 💡 도메인 특화 세부 지침은 `.claude/rules/`에 분리되어 있으며 관련 파일 작업 시 자동 로드됩니다:
> - `rules/architecture.md` — Next.js 16 App Router, ISR, Server Actions, 상태 관리 (`app/**`, `stores/**`, `lib/**`)
> - `rules/supabase-db.md` — Supabase 클라이언트 3원칙, DB 스키마, JSONB 쿼리, RLS, 트리거 (`app/actions/**`, `lib/supabase/**`, `supabase/**`)
> - `rules/ui-styling.md` — Tailwind CSS v4, 시맨틱 디자인 토큰, PWA 모바일 레이아웃 (`components/**`, `globals.css`)

---

## 1. 프로젝트 개요

- **사우나 극락 (`sauna-geukrak`)**: 일본의 '사우나이쿠' UX를 벤치마킹하여 한국 목욕 문화(세신, 한증막, 불가마, 식음료, 문신 허용 등)에 최적화한 사우나·찜질방 탐색 및 '사활(세션 루틴)' 기록 플랫폼.
- **플랫폼**: 모바일 퍼스트 반응형 웹 및 PWA (`100dvh`, Safe Area, 햅틱 피드백).

---

## 2. 기술 스택

- **Framework**: Next.js 16.2.4 (App Router, Turbopack, React Compiler 활성화), React 19.2.4, TypeScript 5
- **Network Proxy**: `proxy.ts` (Next.js 16 공식 프록시 컨벤션 — Supabase SSR 세션 갱신 및 토큰 프록시)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), CSS 변수 기반 시맨틱 토큰 체계, Framer Motion 12 (`domAnimation`)
- **State**: Zustand v5 (클라이언트 전역 UI 상태), TanStack Query v5 (서버 데이터 캐싱/무한 스크롤)
- **Backend & DB**: Supabase (PostgreSQL, Auth, Storage, RLS, DB 트리거), Web Push (VAPID)
- **Maps & External**: Kakao Maps SDK, 카카오 장소 검색 API (이미지 자동 크롤링/동기화), Instagram oEmbed

---

## 3. 개발 명령어

```bash
pnpm dev              # 개발 서버 기동 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint 검사
pnpm image:audit      # 이미지 최적화 감사 스크립트 실행
```

---

## 4. 디렉토리 구조 요약

```plaintext
app/                  # Next.js App Router (페이지, layout, proxy.ts)
  actions/            # Server Actions (sauna, review, favorite, follow, push 등)
  api/                # API Routes (인증, 프록시, 인스타그램 oEmbed)
components/           # UI 및 도메인 컴포넌트 (home, sauna, layout, providers, ui)
stores/               # Zustand 스토어 (homeFilterStore, uiStore, userStore)
hooks/                # 커스텀 훅 (카카오 SDK, 디바운스, 햅틱 등)
lib/                  # 유틸리티 및 Supabase 클라이언트 (client, server, storage)
supabase/             # DB 스키마(schema.sql) 및 마이그레이션 SQL
types/                # TypeScript 도메인 타입 정의 (sauna, user, common)
proxy.ts              # Next.js 16 네트워크 프록시 (SSR 세션 쿠키 갱신)
```

---

## 5. 핵심 코딩 원칙

1. **Next.js 16 & Server Actions**:
   - 복합 입력값은 반드시 Zod 스키마 검증 수행.
   - 렌더링 최적화를 위해 목록 조작 시 `revalidatePath` 호출로 ISR 캐시를 명시적으로 갱신.
2. **Supabase 클라이언트 분리 원칙**:
   - ISR/공개 조회는 `createPublicClient()`, 인증이 필요한 Server Action은 `createClient()` 사용.
   - DB 트리거(`schema.sql`)에 의해 평점, 리뷰수, 좋아요, 팔로우 수가 자동 집계되므로 코드에서 수동 계산하지 말 것.
3. **디자인 시스템 엄수**:
   - 임의 HEX 코드 하드코딩 금지. 시맨틱 토큰(`bg-bg-main`, `bg-point`, `text-sauna`, `text-cold` 등) 사용.
   - Framer Motion은 번들 절감을 위해 `<MotionProvider>` 기반 `<m.div>` 및 `domAnimation` 패턴 유지.

---

## 6. 작업 원칙 (Karpathy Guidelines)

1. **코딩 전에 생각하기**:
   - 가정을 명시적으로 밝히고, 모호한 요구사항은 추측하여 구현하지 않고 질문한다.
   - 여러 접근법이 있을 때는 임의로 고르지 않고 선택지를 제시한다.
2. **단순함 유지**:
   - 요청받은 것 이상의 불필요한 추상화나 과도한 유연성을 추가하지 않는다.
3. **건드릴 곳만 건드리기**:
   - 요청과 무관한 인접 코드의 포맷팅, 주석, 네이밍을 임의로 "개선"하거나 리팩터링하지 않는다.
   - 고장나지 않은 기존 코드는 그대로 둔다.
4. **수정 전 확인**:
   - 코드 수정 전에 어떤 파일을 어떻게 수정할 것인지 계획을 명확히 제시한 후 진행한다.
