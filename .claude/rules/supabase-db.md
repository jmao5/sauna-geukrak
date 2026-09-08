---
paths:
  - "app/actions/**"
  - "lib/supabase/**"
  - "supabase/**"
  - "types/**"
---

# Supabase & Database Rules

> `app/actions/**`, `lib/supabase/**`, `supabase/**`, `types/**` 작업 시 자동 로드. 전역 지침은 루트 `CLAUDE.md` 참고.

---

## 1. Supabase 클라이언트 3원칙 (`lib/supabase/`)

1. **`createPublicClient()` (`lib/supabase/server.ts`)**:
   - **용도**: ISR 정적 렌더링, 누구나 접근 가능한 공개 사우나 목록/상세 조회.
   - **원칙**: `cookies()`를 읽지 않으므로 Next.js 렌더링 캐시(ISR)를 깨뜨리지 않습니다. 로그인 세션이 필요 없는 읽기 작업에 반드시 사용합니다.
2. **`createClient()` (`lib/supabase/server.ts`)**:
   - **용도**: Server Actions, 개인화 데이터(찜 목록, 내 리뷰, 프로필 수정 등).
   - **원칙**: Next.js의 쿠키를 기반으로 로그인된 유저의 Supabase Auth 세션을 확인하고 RLS 정책을 평가합니다.
3. **`createClient()` (`lib/supabase/client.ts`)**:
   - **용도**: 클라이언트 컴포넌트(`'use client'`)에서 직접 Supabase와 통신할 때 사용 (소셜 로그인 리다이렉트 등).

---

## 2. 사우나 도메인 JSONB & 쿼리 컨벤션

사우나 정보는 복합적인 시설 제원을 다루므로 정규화 테이블 대신 성능과 유연성을 위해 **JSONB 컬럼**을 사용합니다.

- **`sauna_rooms` (JSONB Array)**:
  - 속성: `type`, `gender` ('male' | 'female' | 'both'), `temp`, `capacity`, `has_tv`, `has_auto_loyly`, `has_self_loyly`
  - 쿼리 예시: `.contains('sauna_rooms', '[{"has_auto_loyly":true}]')`
- **`cold_baths` (JSONB Array)**:
  - 속성: `temp`, `gender`, `capacity`, `is_groundwater`, `depth`
  - 쿼리 예시: `.contains('cold_baths', '[{"is_groundwater":true}]')`
- **`rules` (JSONB Object)**:
  - `tattoo_allowed`, `female_allowed`, `male_allowed`
- **`kr_specific` (JSONB Object)**:
  - `has_jjimjilbang`, `sesin_price_male`, `sesin_price_female`, `food`

---

## 3. RLS(Row Level Security) 및 보안

- 모든 신규 테이블 생성 시 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` 필수.
- **Role 컬럼 보호 원칙**:
  - `users` 테이블의 `role` 컬럼은 관리자 승격 권한이므로 일반 사용자가 직접 UPDATE할 수 없도록 DB 레벨에서 제한됩니다.
  ```sql
  REVOKE UPDATE ON TABLE public.users FROM anon, authenticated;
  GRANT UPDATE (nickname, avatar_url, bio) ON TABLE public.users TO authenticated;
  ```
  - 클라이언트나 일반 Server Action에서 `role` 컬럼을 덮어쓰지 않도록 주의합니다.

---

## 4. DB 트리거 및 카운트 역정규화 주의점

데이터베이스(`supabase/schema.sql`)에 아래와 같은 자동 계산 트리거가 설정되어 있습니다:
- `trg_refresh_sauna_rating`: 리뷰 생성/수정/삭제 시 사우나의 `avg_rating`, `review_count` 자동 갱신
- `trg_refresh_like_count`: 리뷰 좋아요 추가/삭제 시 리뷰의 `like_count` 자동 갱신
- `trg_refresh_comment_count`: 댓글 추가/삭제 시 리뷰의 `comment_count` 자동 갱신
- `trg_refresh_follow_counts`: 팔로우 추가/삭제 시 `follower_count`, `following_count` 자동 갱신

> ⚠️ **주의**: 코드 레벨에서 카운트나 평점을 수동으로 직접 계산하여 UPDATE하지 마십시오. 트리거가 처리합니다.

---

## 5. Storage & 외부 이미지 동기화

- 업로드 경로는 통일된 `sauna-geukrak` 버킷을 사용하며 용도별 폴더(`saunas/`, `reviews/`, `avatars/`, `floor-plans/`)로 관리합니다.
- 카카오 검색 이미지 자동 동기화(`updateSaunaImages`)는 기존 사우나의 `images` 배열이 비어있을 때만 동작하도록 멱등성을 보장해야 합니다.
