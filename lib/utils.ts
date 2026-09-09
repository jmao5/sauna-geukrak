import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to conditionally join classNames together
 * and merge tailwind css classes safely without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 세션 시간(분 단위, 소수점 가능)을 'N초', 'N분', 'N분 M초' 형식으로 포맷팅
 */
export function formatSessionDuration(minutes: number): string {
  if (minutes <= 0) return '0분'
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}초`
  }
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  if (secs > 0) {
    return `${mins}분 ${secs}초`
  }
  return `${mins}분`
}
