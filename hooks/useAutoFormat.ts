import { formatNovelText } from '@/lib/textFormatter'

export default function useAutoFormat(text: string | undefined) {
  if (!text) return ''
  return formatNovelText(text)
}
