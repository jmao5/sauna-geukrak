import HomeClient from './HomeClient'

// SSR prefetch 제거 — 서버에서 Supabase 쿼리가 완료될 때까지 HTML block됨
// → 클라이언트에서 skeleton 즉시 보여주고 데이터 fetch하는 방식이 체감 속도 더 빠름
export default function HomePage() {
  return <HomeClient />
}
