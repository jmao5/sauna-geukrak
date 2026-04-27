'use client'

import * as React from 'react'
import { Switch } from '@base-ui-components/react'
import { clsx } from 'clsx'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function JmanaSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className }: SwitchProps) {
  const id = React.useId()

  return (
    <div className={clsx('flex items-center justify-between gap-4 py-2', className)}>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-bold text-gray-900 dark:text-gray-50 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {description}
            </span>
          )}
        </div>
      )}
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
        className={clsx(
          'relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black',
          'disabled:cursor-not-allowed disabled:opacity-30',
          checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600',
        )}
      >
        <Switch.Thumb
          className={clsx(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </Switch.Root>
    </div>
  )
}
