---
description: 사우나 극락의 화면 또는 기능에 대한 기능 명세서(개요, 작업 파일 목록, 컴포넌트 구조, 데이터 흐름, 핵심 프로세스)를 마크다운으로 생성한다.
disable-model-invocation: true
---

사용자가 `/feature-spec`을 호출했다. 지정된 화면/기능(예: `/`, `/map`, `/saunas/[id]`, 리뷰 작성 등)의 **기능 명세서(Feature Specification)**를 마크다운으로 생성한다.

## 절차

1. **대상 확정**: 라우트 경로 또는 기능명 (예: `app/saunas/[id]`, `app/map`, `stores/homeFilterStore` 등).
2. 관련 코드(페이지, 컴포넌트, Server Action, Zustand Store, Supabase 스키마)를 읽고 아래 5개 섹션으로 구성한다.
3. 코드에 없는 추측 정보는 기재하지 않으며 미확인 부분은 `[확인 필요]`로 명시한다.
4. 결과를 **프로젝트 루트 상대경로 `.claude-out/{기능명}.feature-spec.md`** 로 저장하고 경로를 안내한다.

---

## 문서 양식 (5섹션)

```markdown
# [기능/화면 명세서] {기능 또는 화면명}

## 1. 개요 (Overview)
- **화면/기능 목적**: (1~3문장 간결 정의)
- **진입 경로**: (URL 라우트 경로)
- **주요 사용자 가치**: (이 기능이 사용자에게 제공하는 경험)

## 2. 데이터 흐름 및 Server Actions
- **사용되는 Server Actions / API**:
  | 함수명 | 파일 위치 | 역할 / 설명 |
  | --- | --- | --- |
  | `getSaunaById` | `app/actions/sauna.actions.ts` | 사우나 상세 단건 조회 |
- **관련 Supabase 테이블**: (예: `saunas`, `reviews`, `favorites`)
- **상태 관리**:
  - 서버 상태: TanStack Query 캐시 키 (예: `['sauna', id]`)
  - 클라이언트 상태: Zustand 스토어 (예: `homeFilterStore`)

## 3. 작업 파일 및 컴포넌트 트리
- **주요 디렉터리 및 파일 목록**:
```plaintext
app/saunas/[id]/
├── page.tsx               # 서버 컴포넌트 (데이터 프리페치/메타데이터)
└── SaunaDetailClient.tsx  # 클라이언트 메인 뷰
components/sauna/detail/
├── DetailHero.tsx         # 상단 이미지 및 대표 정보
├── InfoTab.tsx            # 시설 제원 (온도/수심/규정 등)
├── CongestionSection.tsx  # 혼잡도 차트
└── ReviewList.tsx         # 리뷰 목록 및 작성 바텀시트
```

## 4. 주요 프로세스 및 비즈니스 로직
1) (진입 시 초기 데이터 로드 및 Hydration 흐름)
2) (사용자 인터랙션에 따른 상태 변화)
3) (예외 처리 및 유효성 검사 규칙)

## 5. UI & 인터랙션 특이사항
- 모바일 뷰포트(`<AppFrame>`) 및 Safe Area 처리
- 적용된 마이크로 인터랙션 및 애니메이션 (Framer Motion, 햅틱 피드백)
```

## 인자
$ARGUMENTS
