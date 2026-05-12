'use client'

import BottomSheet from '@/components/ui/BottomSheet'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { REGIONS, CONDITIONS, SORT_OPTIONS } from '@/constants/home'

export default function FilterBottomSheets() {
  const {
    regionOpen, setRegionOpen, selectedRegion, setSelectedRegion,
    conditionOpen, setConditionOpen, selectedConds, toggleCondition,
    sortOpen, setSortOpen, sortKey, setSortKey
  } = useHomeFilterStore()

  return (
    <>
      {/* 지역 바텀시트 */}
      <BottomSheet open={regionOpen} onClose={() => setRegionOpen(false)} title="지역 선택">
        <div className="p-4">
          <button
            onClick={() => { setSelectedRegion(null); setRegionOpen(false) }}
            className={`mb-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-[13px] font-bold transition active:scale-[0.98] ${
              !selectedRegion ? 'border-point bg-point/5 text-point' : 'border-border-main text-text-sub'
            }`}
          >
            전체 지역
            {!selectedRegion && <span className="text-[16px]">✓</span>}
          </button>
          <div className="grid grid-cols-3 gap-2">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => { setSelectedRegion(region); setRegionOpen(false) }}
                className={`rounded-2xl border py-3.5 text-[13px] font-bold transition active:scale-95 ${
                  selectedRegion === region
                    ? 'border-point bg-point text-white'
                    : 'border-border-main bg-bg-sub text-text-sub'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* 조건 바텀시트 */}
      <BottomSheet open={conditionOpen} onClose={() => setConditionOpen(false)} title="조건 선택">
        <div className="space-y-2 p-4">
          {CONDITIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggleCondition(opt.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 transition active:scale-[0.98] ${
                selectedConds.includes(opt.id) ? 'border-point bg-point/5' : 'border-border-main bg-bg-sub'
              }`}
            >
              <span className="text-[18px]">{opt.emoji}</span>
              <span
                className={`flex-1 text-left text-[13px] font-bold ${
                  selectedConds.includes(opt.id) ? 'text-point' : 'text-text-main'
                }`}
              >
                {opt.label}
              </span>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                  selectedConds.includes(opt.id) ? 'border-point bg-point' : 'border-border-main'
                }`}
              >
                {selectedConds.includes(opt.id) && <span className="text-[10px] font-black text-white">✓</span>}
              </div>
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={() => setConditionOpen(false)}
              className="w-full rounded-2xl bg-point py-4 text-[14px] font-black text-white"
            >
              {selectedConds.length > 0 ? `${selectedConds.length}개 조건 적용` : '닫기'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* 정렬 바텀시트 */}
      <BottomSheet open={sortOpen} onClose={() => setSortOpen(false)} title="정렬 기준">
        <div className="space-y-2 p-4">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setSortKey(opt.id); setSortOpen(false) }}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-[13px] font-bold transition active:scale-[0.98] ${
                sortKey === opt.id ? 'border-point bg-point/5 text-point' : 'border-border-main text-text-sub'
              }`}
            >
              {opt.label}
              {sortKey === opt.id && <span className="text-[16px]">✓</span>}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
