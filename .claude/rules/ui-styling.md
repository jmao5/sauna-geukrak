---
paths:
  - "components/**"
  - "app/globals.css"
  - "tailwind.config.ts"
---

# UI, UX & Styling Rules

> `components/**`, `app/globals.css`, `tailwind.config.ts` 작업 시 자동 로드. 전역 지침은 루트 `CLAUDE.md` 참고.

---

## 1. 디자인 시스템 & 컬러 토큰 (Tailwind CSS v4)

이 프로젝트는 Tailwind CSS v4와 CSS 변수 기반 시맨틱 토큰을 사용합니다. **임의의 HEX 코드나 기본 Tailwind 원색(예: `bg-blue-500`, `text-red-400`)을 직접 하드코딩하지 마십시오.**

### 주요 시맨틱 토큰
- **배경**: `bg-bg-main`, `bg-bg-sub`, `bg-bg-card`, `bg-bg-elevated`
- **텍스트**: `text-text-main`, `text-text-sub`, `text-text-muted`
- **포인트/브랜드**: `bg-point` / `text-point` (포카리 블루 `#0098d8`), `bg-point-hover`
- **도메인 특화 색상**:
  - `sauna`: 사우나/열탕 테마 (`text-sauna`, `bg-sauna-bg`, `text-sauna-text`)
  - `cold`: 냉탕 테마 (`text-cold`, `bg-cold-bg`, `text-cold-text`)
- **보더**: `border-border-main`, `border-border-subtle`, `border-border-strong`

---

## 2. 모바일 퍼스트 PWA 레이아웃 (`components/layout/AppFrame.tsx`)

- 웹앱 전체는 모바일 뷰포트 컨테이너인 `<AppFrame>` 내부에서 렌더링됩니다.
- **최대 너비**: `max-w-md sm:max-w-xl` (데스크톱에서는 중앙 정렬된 모바일 카드 형태로 표시)
- **높이 및 Safe Area**:
  - `h-[100dvh]` 및 `pt-[env(safe-area-inset-top)]`, `pb-[env(safe-area-inset-bottom)]`를 엄수하여 모바일 브라우저 주소창이나 노치에 UI가 가려지지 않도록 합니다.
- **모달 및 바텀시트**:
  - 포털 마운트 기준점은 `#app-root`입니다.

---

## 3. 다크 모드 & 테마 플리커(FOUC) 방지

- 다크 모드는 `class` 전략을 따릅니다 (`<html class="dark">`).
- 테마 깜빡임을 방지하기 위해 `app/layout.tsx`의 `<head>` 내에 `localStorage('ui-storage')`를 동기적으로 읽어 `dark` 클래스를 부여하는 인라인 스크립트가 유지되어야 합니다.

---

## 4. 애니메이션 & 성능 최적화 (Framer Motion)

- **번들 최적화 원칙**:
  - `framer-motion` 전체 번들을 불러오는 layout animation이나 무거운 기능 대신, `<MotionProvider>`에서 제공하는 `domAnimation` 기능을 기반으로 경량 `<m.div>` 및 `<AnimatePresence>`를 사용합니다.
- **인터랙션 피드백**:
  - 네비게이션 탭 전환, 찜 버튼 클릭 등 주요 터치 인터랙션에는 `@/utils/haptic`의 `hapticFeedback('light')`를 호출해 모바일 사용자 경험을 극대화합니다.

---

## 5. 이미지 처리 가이드

- 외부 이미지는 `next/image`를 사용하고, 도메인은 `next.config.ts`의 `remotePatterns`(`https://**`, `http://k.kakaocdn.net`)를 준수합니다.
- 고정 종횡비 유지 및 이미지 로딩 스켈레톤/플레이스홀더를 제공하여 CLS(Cumulative Layout Shift)를 방지합니다.
