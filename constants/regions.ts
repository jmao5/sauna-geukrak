/**
 * 지역 정복 지도용 행정구역 상수.
 * - SIDO_ALIASES: 주소 첫 토큰(서울특별시/서울시/서울 등)을 홈 필터 REGIONS와 같은 짧은 이름으로 정규화
 * - SIDO_TOTALS: 시·도별 정복 대상 구·군(광역시·특별시) 또는 시·군(도) 총 수. 진행률 분모.
 * - SEOUL_TILES: 서울 25개 구의 대략적 지리 배치(카토그램). row 0~6, col 0~6.
 */

export const SIDO_ALIASES: { match: string; sido: string; kind: 'metro' | 'province' | 'single' }[] = [
  { match: '서울', sido: '서울', kind: 'metro' },
  { match: '경기', sido: '경기', kind: 'province' },
  { match: '인천', sido: '인천', kind: 'metro' },
  { match: '부산', sido: '부산', kind: 'metro' },
  { match: '대구', sido: '대구', kind: 'metro' },
  { match: '대전', sido: '대전', kind: 'metro' },
  { match: '광주', sido: '광주', kind: 'metro' },
  { match: '울산', sido: '울산', kind: 'metro' },
  { match: '세종', sido: '세종', kind: 'single' },
  { match: '강원', sido: '강원', kind: 'province' },
  { match: '충청북도', sido: '충북', kind: 'province' },
  { match: '충북', sido: '충북', kind: 'province' },
  { match: '충청남도', sido: '충남', kind: 'province' },
  { match: '충남', sido: '충남', kind: 'province' },
  { match: '전북', sido: '전북', kind: 'province' },
  { match: '전라북도', sido: '전북', kind: 'province' },
  { match: '전라남도', sido: '전남', kind: 'province' },
  { match: '전남', sido: '전남', kind: 'province' },
  { match: '경상북도', sido: '경북', kind: 'province' },
  { match: '경북', sido: '경북', kind: 'province' },
  { match: '경상남도', sido: '경남', kind: 'province' },
  { match: '경남', sido: '경남', kind: 'province' },
  { match: '제주', sido: '제주', kind: 'province' },
]

export const SIDO_TOTALS: Record<string, { total: number; unit: string }> = {
  서울: { total: 25, unit: '구' },
  경기: { total: 31, unit: '시·군' },
  인천: { total: 10, unit: '구·군' },
  부산: { total: 16, unit: '구·군' },
  대구: { total: 9,  unit: '구·군' },
  대전: { total: 5,  unit: '구' },
  광주: { total: 5,  unit: '구' },
  울산: { total: 5,  unit: '구·군' },
  세종: { total: 1,  unit: '시' },
  강원: { total: 18, unit: '시·군' },
  충북: { total: 11, unit: '시·군' },
  충남: { total: 15, unit: '시·군' },
  전북: { total: 14, unit: '시·군' },
  전남: { total: 22, unit: '시·군' },
  경북: { total: 22, unit: '시·군' },
  경남: { total: 18, unit: '시·군' },
  제주: { total: 2,  unit: '시' },
}

export interface RegionTile {
  name: string
  row: number
  col: number
}

export const SEOUL_TILE_COLS = 7
/** 한강: 이 row(포함) 아래가 강남권 */
export const SEOUL_RIVER_ROW = 5

export const SEOUL_TILES: RegionTile[] = [
  // 강북권
  { name: '도봉구',   row: 0, col: 3 },
  { name: '노원구',   row: 0, col: 4 },
  { name: '은평구',   row: 1, col: 1 },
  { name: '강북구',   row: 1, col: 2 },
  { name: '성북구',   row: 1, col: 3 },
  { name: '중랑구',   row: 1, col: 4 },
  { name: '서대문구', row: 2, col: 1 },
  { name: '종로구',   row: 2, col: 2 },
  { name: '동대문구', row: 2, col: 3 },
  { name: '마포구',   row: 3, col: 1 },
  { name: '중구',     row: 3, col: 2 },
  { name: '성동구',   row: 3, col: 3 },
  { name: '광진구',   row: 3, col: 4 },
  { name: '용산구',   row: 4, col: 2 },
  // 강남권 (한강 이남)
  { name: '강서구',   row: 5, col: 0 },
  { name: '양천구',   row: 5, col: 1 },
  { name: '영등포구', row: 5, col: 2 },
  { name: '동작구',   row: 5, col: 3 },
  { name: '서초구',   row: 5, col: 4 },
  { name: '강남구',   row: 5, col: 5 },
  { name: '강동구',   row: 5, col: 6 },
  { name: '구로구',   row: 6, col: 1 },
  { name: '금천구',   row: 6, col: 2 },
  { name: '관악구',   row: 6, col: 3 },
  { name: '송파구',   row: 6, col: 5 },
]
