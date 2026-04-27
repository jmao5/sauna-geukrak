'use client'

import * as React from 'react'
import { Dialog } from '@base-ui-components/react'
import { clsx } from 'clsx'
import { BiX } from 'react-icons/bi'

interface JmanaDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement<Record<string, unknown>>
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function JmanaDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true }: JmanaDialogProps) {

    return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger render={trigger} />}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity data-[entering]:opacity-100 data-[exiting]:opacity-0 duration-300" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup
            className={clsx(
              'relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white dark:bg-gray-900 p-6 shadow-2xl transition-all',
              'data-[entering]:opacity-100 data-[entering]:scale-100 data-[exiting]:opacity-0 data-[exiting]:scale-95 duration-300',
              className,
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  {title && (
                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {title}
                    </Dialog.Title>
                  )}
                  {description && (
                    <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
                {showCloseButton && (
                  <Dialog.Close
                    render={
                      <button className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                        <BiX size={24} />
                      </button>
                    }
                  />
                )}
              </div>

              <div className="mt-2 text-gray-700 dark:text-gray-300">{children}</div>

              {footer && (
                <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  {footer}
                </div>
              )}
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
