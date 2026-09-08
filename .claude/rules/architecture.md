---
paths:
  - "app/**"
  - "proxy.ts"
  - "stores/**"
  - "lib/**"
---

# Architecture & Next.js 16 Rules

> `app/**`, `proxy.ts`, `stores/**`, `lib/**` 작업 시 자동 로드. 전역 지침은 루트 `CLAUDE.md` 참고.

---

## 1. Next.js 16 App Router & `proxy.ts`

- **Next.js 16 컨벤션 준수**:
  - `proxy.ts`는 Next.js 16의 네트워크 프록시/포워딩 컨벤션 파일입니다. (기존 `middleware.ts` 대신 동작)
  - Supabase SSR 쿠키 세션 동기화(`supabase.auth.getUser()`) 및 백엔드 토큰 갱신 로직이 위치하므로 임의로 삭제하거나 구조를 깨뜨리지 않습니다.
- **Turbopack & React Compiler**:
  - React Compiler(`reactCompiler: true`)가 활성화되어 있어 불필요한 `useMemo`, `useCallback` 수동 작성을 지양하고 선언적인 React 코드를 유지합니다.

---

## 2. 렌더링 & 캐싱 전략

- **홈 화면 및 공개 페이지 (ISR 적용)**:
  - 실시간성이 극도로 요구되지 않는 목록 화면은 `export const revalidate = 60` 등의 ISR(Incremental Static Regeneration)을 적용합니다.
  - 서버 측에서 `getQueryClient()`와 `prefetchInfiniteQuery`를 실행하고 `<HydrationBoundary state={dehydrate(queryClient)}>`로 클라이언트에 전달합니다.
- **캐시 무효화 (`revalidatePath`)**:
  - 사우나 등록, 수정, 삭제 등 데이터 변경(Server Action) 발생 시 반드시 영향을 받는 경로(예: `revalidatePath('/')`, `revalidatePath('/saunas/[id]')`)를 호출하여 즉시 최신화합니다.

---

## 3. 상태 관리 분리 원칙

1. **서버 상태 (Server State)**:
   - 반드시 **TanStack Query v5 (`@tanstack/react-query`)** 사용.
   - 무한 스크롤 목록은 `useInfiniteQuery`, 단건 데이터는 `useQuery`.
   - `staleTime`을 명시하여 불필요한 네트워크 재요청을 방지합니다.
2. **클라이언트 전역 UI 상태 (Client Global State)**:
   - **Zustand v5 (`stores/`)** 사용.
   - `homeFilterStore.ts`: 홈 검색어, 선택 지역, 필터 조건(`autoloyly`, `groundwater` 등), 정렬 키.
   - `uiStore.ts`: 테마(dark/light), 바텀시트 열림 상태 등.
   - `userStore.ts`: 클라이언트 사용자 부가 상태.
3. **로컬 컴포넌트 상태**:
   - 단순 입력 폼, 토글 등은 `useState` / `useReducer` 사용.

---

## 4. Server Actions 작성 가이드 (`app/actions/`)

- 모든 서버 액션 파일 최상단에는 `'use server'` 선언.
- **입력 유효성 검사**: 복잡한 페이로드(`createSauna`, `updateSauna` 등)는 반드시 **Zod 스키마**(`saunaSchema.safeParse`)로 런타임 검증 수행.
- **반환 규격 통일**:
  ```typescript
  type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }
  ```
- **민감 세션 검증**: 사용자 식별이 필요한 작업(리뷰 작성, 찜하기, 사우나 등록)은 반드시 `supabase.auth.getSession()` 또는 `getUser()`로 세션 유효성을 서버 측에서 검증.
