import { useMemo } from 'react'
import { formatNovelText } from '@/lib/textFormatter'

export default function useAutoFormat(text: string | undefined) {
  return useMemo(() => {
    if (!text) return ''
    return formatNovelText(text)
  }, [text])
}
