'use client'

import Image from 'next/image'
import { BiAward, BiCheckShield, BiCrown } from 'react-icons/bi'
import { LevelInfo } from './utils/passportStats'

import Link from 'next/link'

interface SaunaPassportProps {
  displayName: string
  avatarUrl: string | null
  passportNumber: string
  issuedDate: string
  levelInfo: LevelInfo
  totalVisits: number
  uniqueSaunasCount: number
}

/**
 * 비로그인 유저를 위한 '미발급 사우나 여권 커버'
 */
export function UnissuedSaunaPassport() {
  return (
    <div className="relative mx-4 overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-gradient-to-br from-[#121c2b] via-[#0b131e] to-[#060a10] p-6 text-white shadow-xl shadow-black/30 text-center">
      {/* 엠보싱 워터마크 배경 */}
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
        }}
      />

      {/* 골드 엠블럼 */}
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
        <span className="text-2xl">♨️</span>
      </div>

      <p className="text-[11px] font-black tracking-[0.25em] text-[#f59e0b] uppercase">
        Republic of Sauna Geukrak
      </p>
      <h2 className="mt-1 text-xl font-black tracking-wider text-white">
        대한민국 사우나 여권
      </h2>
      <p className="mt-0.5 text-[9px] tracking-widest text-slate-400 uppercase">
        Sauna Passport · Official Document
      </p>

      {/* 발급 대기 안내 박스 */}
      <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-black text-amber-300">여권 발급 대기 중</span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
          로그인하시면 <strong>나만의 고유 여권 번호(SGK-XXXX)</strong>와 <strong>첫 사우너 등급</strong>이 즉시 발급됩니다.
        </p>
      </div>

      <div className="mt-5">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-point py-3.5 text-[13px] font-black text-white shadow-lg shadow-point/25 transition active:scale-[0.98] hover:bg-point-hover"
        >
          여권 발급받기 (로그인 / 회원가입)
        </Link>
      </div>
    </div>
  )
}

export default function SaunaPassport({
  displayName,
  avatarUrl,
  passportNumber,
  issuedDate,
  levelInfo,
  totalVisits,
  uniqueSaunasCount,
}: SaunaPassportProps) {
  const isZeroVisits = totalVisits === 0

  return (
    <div className="relative mx-4 overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#101b2b] via-[#0d1624] to-[#070c14] p-5 text-white shadow-xl shadow-black/25">
      {/* 엠보싱 워터마크 배경 */}
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-point/10 blur-2xl" />

      {/* 여권 상단 헤더 (골드 라인) */}
      <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3">
        <div className="flex items-center gap-2">
          {/* 금빛 사우나 엠블럼 */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <span className="text-sm">♨️</span>
          </div>
          <div>
            <span className="text-[11px] font-black tracking-widest text-[#f59e0b] uppercase">
              Sauna Passport
            </span>
            <p className="text-[9px] tracking-wider text-slate-400">대한민국 사우나 극락 여권</p>
          </div>
        </div>

        {/* 여권 번호 */}
        <div className="text-right">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">PASSPORT NO.</p>
          <p className="font-mono text-[12px] font-black tracking-widest text-[#f0f6fc] tabular-nums">
            {passportNumber}
          </p>
        </div>
      </div>

      {/* 여권 본문 (아바타 + 유저 정보 + 승인 스탬프) */}
      <div className="relative mt-4 flex items-start gap-4">
        {/* 아바타 / 사진 영역 */}
        <div className="relative flex-shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-[#d4af37]/40 bg-slate-800/80 p-0.5 shadow-md">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="h-full w-full rounded-[14px] object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-slate-700 to-slate-900 text-3xl">
                🧖
              </div>
            )}
          </div>
          {/* 레벨 배지 뱃지 */}
          <div className="absolute -bottom-2 -right-1 flex items-center gap-0.5 rounded-full border border-[#f59e0b]/40 bg-gradient-to-r from-amber-600 to-amber-700 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
            <BiCrown size={10} className="text-amber-200" />
            <span>Lv.{levelInfo.level}</span>
          </div>
        </div>

        {/* 신상 및 칭호 */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-lg font-black text-white">{displayName}</h2>
            <BiCheckShield size={16} className="flex-shrink-0 text-point" title="공식 인증 사우너" />
          </div>

          <p className="mt-0.5 text-[11px] font-black text-[#f59e0b] tracking-tight">
            {levelInfo.title}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400 line-clamp-1">{levelInfo.subtitle}</p>

          <div className="mt-2.5 flex items-center gap-3 text-[10px]">
            <div>
              <span className="text-[8px] block uppercase text-slate-500">발급일</span>
              <span className="font-mono font-bold text-slate-300 tabular-nums">{issuedDate}</span>
            </div>
            <div>
              <span className="text-[8px] block uppercase text-slate-500">유효기간</span>
              <span className="font-bold text-emerald-400">평생 극락 保障</span>
            </div>
          </div>
        </div>

        {/* 극락 인증 인장 (방문 1회 이상일 때 APPROVED, 0회일 때 첫 기록 대기 인장) */}
        {isZeroVisits ? (
          <div className="pointer-events-none absolute -right-2 -bottom-2 flex h-16 w-16 rotate-[-10deg] items-center justify-center rounded-full border border-dashed border-slate-500/50 bg-slate-900/40 p-1 text-center text-slate-400/80 shadow-sm backdrop-blur-[1px]">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[7px] font-black tracking-wider uppercase text-amber-400">첫 사활</span>
              <span className="text-[8px] font-black tracking-tight">도장 대기</span>
              <span className="text-[6px] tracking-wider text-slate-500">READY</span>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none absolute -right-2 -bottom-2 flex h-16 w-16 rotate-[-14deg] items-center justify-center rounded-full border-2 border-dashed border-red-500/70 bg-red-950/20 p-1 text-center text-red-400/90 shadow-sm backdrop-blur-[1px]">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[7px] font-black tracking-widest uppercase">극락 인증</span>
              <span className="text-[10px] font-black tracking-tighter">APPROVED</span>
              <span className="text-[6px] tracking-wider text-red-400/70">SAUNA GEUKRAK</span>
            </div>
          </div>
        )}
      </div>

      {/* 레벨 진행도 바 */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <div className="flex items-center gap-1 text-slate-300">
            <BiAward size={14} className="text-[#f59e0b]" />
            <span className="font-bold">사우너 숙련도</span>
          </div>
          <span className="font-mono text-slate-400 tabular-nums">
            {levelInfo.isMax ? (
              <strong className="text-[#f59e0b]">최고 등급 달성 👑</strong>
            ) : (
              <>
                <strong className="text-white font-black">{totalVisits}</strong> / {levelInfo.nextTarget}회 (
                {levelInfo.progressPercent}%)
              </>
            )}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-amber-400 to-amber-300 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(isZeroVisits ? 0 : 5, levelInfo.progressPercent))}%` }}
          />
        </div>

        {!levelInfo.isMax && (
          <p className="mt-1 text-[9px] text-slate-400 text-right">
            다음 등급까지 사활 <strong className="text-[#f59e0b]">{levelInfo.nextTarget - totalVisits}회</strong> 남았어요!
          </p>
        )}
      </div>
    </div>
  )
}
