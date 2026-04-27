'use client'

import * as React from 'react'
import { Slider } from '@base-ui-components/react'
import { clsx } from 'clsx'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label?: string
  icon?: React.ReactNode
}

export function JmanaSlider({ value, min, max, step = 1, onChange, label, icon }: SliderProps) {
  // Base UI Slider typically expects an array for controlled value
  const sliderValue = React.useMemo(() => [value], [value])
  const id = React.useId()

  return (
    <div className="flex flex-col gap-2 py-2">
      {label && (
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          {icon}
          <span>{label}</span>
          <span className="ml-auto text-indigo-500 dark:text-indigo-400 font-extrabold">{value}</span>
        </label>
      )}
      <Slider.Root
        id={id}
        value={sliderValue}
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => {
          const nextValue = Array.isArray(val) ? val[0] : val
          onChange(nextValue)
        }}
        // 부모의 onClick(toggleNav 등)이 트리거되지 않도록 전파 차단
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        aria-label={label}
        className="relative flex w-full touch-none items-center select-none group"
      >
        <Slider.Control className="relative flex h-10 w-full items-center cursor-pointer">
          <Slider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <Slider.Indicator className="absolute h-full bg-indigo-500 dark:bg-indigo-600 transition-colors" />
          </Slider.Track>
          <Slider.Thumb 
            className={clsx(
              "z-10 block h-5 w-5 rounded-full border-2 border-indigo-500 bg-white shadow-lg transition-all",
              "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black",
              "active:scale-95 active:shadow-indigo-500/20 dark:bg-gray-100"
            )}
          />
        </Slider.Control>
      </Slider.Root>
    </div>
  )
}
