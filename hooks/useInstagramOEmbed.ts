import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

interface OEmbedResult {
  thumbnail_url: string | null
  title: string | null
  author_name: string | null
}

async function fetchInstagramOEmbed(url: string): Promise<OEmbedResult> {
  const res = await fetch(`/api/instagram-oembed?url=${encodeURIComponent(url)}`)
  if (!res.ok) return { thumbnail_url: null, title: null, author_name: null }
  return res.json()
}

/**
 * 인스타그램 oEmbed 훅
 * SSR hydration 불일치 방지를 위해 클라이언트 mount 이후에만 활성화
 */
export function useInstagramOEmbed(url: string, enabled = true) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return useQuery({
    queryKey: ['instagram-oembed', url],
    queryFn: () => fetchInstagramOEmbed(url),
    enabled: mounted && enabled && !!url,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    retry: 1,
  })
}
