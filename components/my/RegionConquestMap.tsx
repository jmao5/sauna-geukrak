'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BiMap } from 'react-icons/bi'
import { SidoConquestInfo } from './utils/passportStats'
import { SEOUL_TILES, SEOUL_TILE_COLS, SEOUL_RIVER_ROW } from '@/constants/regions'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { hapticFeedback } from '@/utils/haptic'

interface RegionConquestMapProps {
  conquest: SidoConquestInfo[]
}

const SEOUL_ROWS = Math.max(...SEOUL_TILES.map((t) => t.row)) + 1

export default function RegionConquestMap({ conquest }: RegionConquestMapProps) {
  const router = useRouter()
  const { resetAll, setKeyword } = useHomeFilterStore()
  const [selectedTile, setSelectedTile] = useState<string | null>(null)

  const seoul = conquest.find((c) => c.sido === '서울')
  const others = conquest.filter((c) => c.sido !== '서울' && c.visitedCount > 0)
  const totalUnits = conquest.reduce((s, c) => s + c.visitedCount, 0)

  // 타일 탭: 홈 검색어에 구 이름을 넣고 홈으로 이동 → 해당 지역 사우나 목록
  const goToRegion = (unit: string) => {
    hapticFeedback('light')
    resetAll()
    setKeyword(unit)
    router.push('/')
  }

  return (
    <div className="mx-4 rounded-2xl border border-border-main bg-bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BiMap size={16} className="text-point" />
          <span className="text-[11px] font-black uppercase tracking-wider text-text-main">지역 정복 지도</span>
        </div>
        <span className="text-[10px] font-bold text-text-muted tabular-nums">누적 {totalUnits}개 지역</span>
      </div>

      {/* 서울 25구 타일 지도 */}
      {seoul && (
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[12px] font-black text-text-main">
              서울 <span className="text-point tabular-nums">{seoul.visitedCount}</span>
              <span className="text-text-muted"> / {seoul.total}구 정복</span>
            </p>
            <span className="text-[10px] font-bold text-text-muted tabular-nums">{seoul.progressPercent}%</span>
          </div>

          <div
            className="relative grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${SEOUL_TILE_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${SEOUL_ROWS}, 34px)`,
            }}
          >
            {/* 한강 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 h-[3px] rounded-full bg-cold/40"
              style={{ top: `calc(${SEOUL_RIVER_ROW} * (34px + 4px) - 3.5px)` }}
            />
            {SEOUL_TILES.map((tile) => {
              const count = seoul.visited[tile.name] ?? 0
              const visited = count > 0
              const isSelected = selectedTile === tile.name
              return (
                <button
                  key={tile.name}
                  type="button"
                  onClick={() => setSelectedTile(isSelected ? null : tile.name)}
                  aria-label={`${tile.name} ${visited ? `${count}회 방문` : '미방문'}`}
                  style={{ gridRow: tile.row + 1, gridColumn: tile.col + 1 }}
                  className={`flex items-center justify-center rounded-md border text-[9.5px] font-black leading-none transition active:scale-95 ${
                    visited
                      ? 'border-point bg-point text-white'
                      : 'border-border-main bg-bg-sub text-text-muted'
                  } ${isSelected ? 'ring-2 ring-point/50 ring-offset-1 ring-offset-bg-card' : ''}`}
                >
                  {tile.name.replace(/구$/, '')}
                </button>
              )
            })}
          </div>

          {/* 선택 타일 상세 */}
          {selectedTile && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-border-subtle bg-bg-sub/60 px-3 py-2">
              <p className="text-[11px] font-bold text-text-sub">
                <span className="font-black text-text-main">{selectedTile}</span>
                {(seoul.visited[selectedTile] ?? 0) > 0
                  ? ` · ${seoul.visited[selectedTile]}회 방문`
                  : ' · 아직 방문 전이에요'}
              </p>
              <button
                type="button"
                onClick={() => goToRegion(selectedTile)}
                className="rounded-lg bg-point/10 px-2.5 py-1 text-[10.5px] font-black text-point transition active:scale-95"
              >
                사우나 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 그 외 시·도 진행 바 */}
      {others.length > 0 && (
        <div className={`space-y-2 ${seoul ? 'mt-4 border-t border-border-subtle pt-3' : ''}`}>
          {others.map((c) => (
            <div key={c.sido}>
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-[11px] font-black text-text-main">
                  {c.sido}{' '}
                  <span className="text-[10px] font-bold text-text-muted tabular-nums">
                    {c.visitedCount} / {c.total}{c.unit}
                  </span>
                </p>
                <span className="text-[10px] font-bold text-text-muted tabular-nums">{c.progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-sub">
                <div className="h-full rounded-full bg-point" style={{ width: `${c.progressPercent}%` }} />
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(c.visited).map(([unit, count]) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => goToRegion(unit)}
                    className="rounded-full border border-point/30 bg-point/5 px-2 py-0.5 text-[9.5px] font-bold text-point transition active:scale-95"
                  >
                    {unit} {count}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
