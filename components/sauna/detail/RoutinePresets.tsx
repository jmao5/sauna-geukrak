'use client'

import { BiX, BiBookmarkPlus } from 'react-icons/bi'
import toast from 'react-hot-toast'
import useLocalStorage from '@/hooks/useLocalStorage'
import { formatSessionDuration } from '@/lib/utils'
import { hapticFeedback } from '@/utils/haptic'

export interface RoutinePreset {
  id: string
  sauna: number
  cold: number
  rest: number
  sets: number
}

const STORAGE_KEY = 'routine-presets'
const MAX_PRESETS = 5

interface RoutinePresetsProps {
  current: Omit<RoutinePreset, 'id'>
  onApply: (preset: Omit<RoutinePreset, 'id'>) => void
}

const isSame = (a: Omit<RoutinePreset, 'id'>, b: Omit<RoutinePreset, 'id'>) =>
  a.sauna === b.sauna && a.cold === b.cold && a.rest === b.rest && a.sets === b.sets

const labelOf = (p: Omit<RoutinePreset, 'id'>) =>
  `🧖 ${p.sauna}분 · ❄️ ${formatSessionDuration(p.cold)} · 🍃 ${p.rest}분 × ${p.sets}`

/**
 * 자주 쓰는 사활 세트를 기기(localStorage)에 저장해 원탭으로 불러오는 프리셋 바.
 * 현재 값과 같은 프리셋은 활성 표시되며, 저장 버튼은 현재 값이 아직 없을 때만 노출.
 */
export default function RoutinePresets({ current, onApply }: RoutinePresetsProps) {
  const { value: presets, setValue } = useLocalStorage<RoutinePreset[]>(STORAGE_KEY, [])
  const alreadySaved = presets.some((p) => isSame(p, current))

  const save = () => {
    if (alreadySaved) return
    if (presets.length >= MAX_PRESETS) {
      toast(`프리셋은 최대 ${MAX_PRESETS}개까지 저장할 수 있어요`, { icon: '📌' })
      return
    }
    hapticFeedback('light')
    const id = `${Date.now()}`
    // 최근 저장이 앞에 오도록
    setValue([{ id, ...current }, ...presets])
    toast.success('내 루틴으로 저장했어요')
  }

  const remove = (id: string) => {
    hapticFeedback('light')
    setValue(presets.filter((p) => p.id !== id))
  }

  const apply = (preset: RoutinePreset) => {
    hapticFeedback('light')
    onApply({ sauna: preset.sauna, cold: preset.cold, rest: preset.rest, sets: preset.sets })
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold text-text-sub">📌 내 루틴 프리셋</span>
        {!alreadySaved && (
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1 rounded-full border border-point/40 bg-point/5 px-2.5 py-1 text-[10px] font-black text-point transition active:scale-95"
          >
            <BiBookmarkPlus size={12} /> 현재 루틴 저장
          </button>
        )}
      </div>

      {presets.length === 0 ? (
        <p className="text-[10px] text-text-muted">자주 쓰는 세트를 저장하면 다음부터 한 번에 불러올 수 있어요</p>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {presets.map((preset) => {
            const active = isSame(preset, current)
            return (
              <div
                key={preset.id}
                className={`flex flex-shrink-0 items-center overflow-hidden rounded-full border text-[10px] font-black transition ${
                  active ? 'border-point bg-point text-white' : 'border-border-main bg-bg-card text-text-sub'
                }`}
              >
                <button
                  type="button"
                  onClick={() => apply(preset)}
                  className="py-1.5 pl-2.5 pr-1.5 transition active:opacity-70"
                >
                  {labelOf(preset)}
                </button>
                <button
                  type="button"
                  onClick={() => remove(preset.id)}
                  aria-label="프리셋 삭제"
                  className={`flex h-full items-center pr-2 pl-0.5 transition active:opacity-70 ${active ? 'text-white/80' : 'text-text-muted'}`}
                >
                  <BiX size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
