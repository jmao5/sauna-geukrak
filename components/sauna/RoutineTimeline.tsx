'use client'

import React from 'react'
import type { Session } from '@/types/sauna'
import { formatSessionDuration } from '@/lib/utils'
import { BiChevronRight } from 'react-icons/bi'

interface RoutineTimelineProps {
  sessions?: Session[]
  variant?: 'full' | 'compact'
  className?: string
}

interface StepMeta {
  type: 'sauna' | 'cold' | 'rest'
  emoji: string
  label: string
  bgClass: string
  textClass: string
  borderClass: string
}

const STEP_META: Record<'sauna' | 'cold' | 'rest', StepMeta> = {
  sauna: {
    type: 'sauna',
    emoji: '🔥',
    label: '사우나',
    bgClass: 'bg-amber-500/10 dark:bg-amber-950/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-500/25 dark:border-amber-500/30',
  },
  cold: {
    type: 'cold',
    emoji: '💧',
    label: '냉탕',
    bgClass: 'bg-sky-500/10 dark:bg-sky-950/30',
    textClass: 'text-sky-700 dark:text-sky-400',
    borderClass: 'border-sky-500/25 dark:border-sky-500/30',
  },
  rest: {
    type: 'rest',
    emoji: '🍃',
    label: '휴식',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-500/25 dark:border-emerald-500/30',
  },
}

export default function RoutineTimeline({
  sessions,
  variant = 'full',
  className = '',
}: RoutineTimelineProps) {
  if (!sessions || sessions.length === 0) return null

  // 총 소요 시간 (분)
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)

  // 1. 동일 패턴 반복 세트 분석 (예: sauna -> cold -> rest 가 N회 반복)
  const pattern: string[] = []
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    if (i > 0 && s.type === sessions[0].type) {
      break
    }
    pattern.push(s.type)
  }

  const patternLength = pattern.length
  let isUniformPattern = false
  let setCount = 1

  if (patternLength > 0 && sessions.length % patternLength === 0) {
    setCount = sessions.length / patternLength
    isUniformPattern = true

    // 모든 세트가 동일한 타입 순서 및 동일한 시간인지 확인
    for (let i = 0; i < sessions.length; i++) {
      const stepInPattern = i % patternLength
      if (
        sessions[i].type !== pattern[stepInPattern] ||
        sessions[i].duration_minutes !== sessions[stepInPattern].duration_minutes
      ) {
        isUniformPattern = false
        break
      }
    }
  }

  // ── 1. 균일 반복 패턴 (가장 일반적인 형태) ────────────────
  if (isUniformPattern && setCount > 0) {
    const sampleSet = sessions.slice(0, patternLength)

    if (variant === 'compact') {
      return (
        <div className={`flex flex-wrap items-center gap-1 text-[11px] font-bold ${className}`}>
          {sampleSet.map((step, idx) => {
            const meta = STEP_META[step.type] || STEP_META.sauna
            return (
              <React.Fragment key={idx}>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                >
                  <span>{meta.emoji}</span>
                  <span className="tabular-nums">{formatSessionDuration(step.duration_minutes)}</span>
                </span>
                {idx < sampleSet.length - 1 && (
                  <span className="text-text-muted text-[10px]">➔</span>
                )}
              </React.Fragment>
            )
          })}
          <span className="ml-1 text-[10px] font-black text-point tabular-nums">
            {setCount}세트
          </span>
        </div>
      )
    }

    return (
      <div
        className={`mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-card/70 px-3 py-2 text-[12px] shadow-2xs backdrop-blur-xs ${className}`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-point bg-point/10 border border-point/20 px-1.5 py-0.5 rounded-md">
            ROUTINE
          </span>
          {sampleSet.map((step, idx) => {
            const meta = STEP_META[step.type] || STEP_META.sauna
            return (
              <React.Fragment key={idx}>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-extrabold shadow-2xs transition-all ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                >
                  <span className="text-[12px]">{meta.emoji}</span>
                  <span className="font-medium text-text-sub">{meta.label}</span>
                  <span className="font-black tabular-nums">
                    {formatSessionDuration(step.duration_minutes)}
                  </span>
                </span>
                {idx < sampleSet.length - 1 && (
                  <BiChevronRight size={14} className="text-text-muted" />
                )}
              </React.Fragment>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-point/20 bg-point/10 px-2 py-0.5 text-[10.5px] font-black text-point tabular-nums">
            {setCount}세트
          </span>
          {totalMinutes > 0 && (
            <span className="text-[10.5px] font-medium text-text-muted tabular-nums">
              총 {formatSessionDuration(totalMinutes)}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── 2. 개별 세션이 다양하거나 불규칙한 경우 ────────────────
  // 세트 추정 (sauna 횟수)
  const saunaCount = sessions.filter((s) => s.type === 'sauna').length

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-1 text-[11px] font-bold ${className}`}>
        {sessions.slice(0, 4).map((step, idx) => {
          const meta = STEP_META[step.type] || STEP_META.sauna
          return (
            <span
              key={idx}
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
            >
              <span>{meta.emoji}</span>
              <span className="tabular-nums">{formatSessionDuration(step.duration_minutes)}</span>
            </span>
          )
        })}
        {sessions.length > 4 && (
          <span className="text-[10px] text-text-muted font-bold">+{sessions.length - 4}</span>
        )}
        {saunaCount > 1 && (
          <span className="ml-1 text-[10px] font-black text-point tabular-nums">
            {saunaCount}세트
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`mt-2.5 rounded-xl border border-border-subtle bg-bg-card/70 px-3 py-2 text-[12px] shadow-2xs backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[9px] font-black uppercase tracking-wider text-point bg-point/10 border border-point/20 px-1.5 py-0.5 rounded-md">
          ROUTINE
        </span>
        <div className="flex items-center gap-1.5">
          {saunaCount > 0 && (
            <span className="rounded-md border border-point/20 bg-point/10 px-2 py-0.5 text-[10.5px] font-black text-point tabular-nums">
              {saunaCount}세트
            </span>
          )}
          {totalMinutes > 0 && (
            <span className="text-[10.5px] font-medium text-text-muted tabular-nums">
              총 {formatSessionDuration(totalMinutes)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {sessions.map((step, idx) => {
          const meta = STEP_META[step.type] || STEP_META.sauna
          return (
            <React.Fragment key={idx}>
              <span
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10.5px] font-extrabold shadow-2xs ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
              >
                <span>{meta.emoji}</span>
                <span className="font-medium text-text-sub">{meta.label}</span>
                <span className="font-black tabular-nums">
                  {formatSessionDuration(step.duration_minutes)}
                </span>
              </span>
              {idx < sessions.length - 1 && (
                <BiChevronRight size={12} className="text-text-muted" />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
