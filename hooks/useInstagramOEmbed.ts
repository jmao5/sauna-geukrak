import { useQuery } from '@tanstack/react-query'

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

export function useInstagramOEmbed(url: string, enabled = true) {
  return useQuery({
    queryKey: ['instagram-oembed', url],
    queryFn: () => fetchInstagramOEmbed(url),
    enabled: enabled && !!url,
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    retry: 1,
  })
}
