import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sauna-geukrak.vercel.app'

  let saunaUrls: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data: saunas } = await supabase
      .from('saunas')
      .select('id, updated_at')
      .order('created_at', { ascending: false })

    saunaUrls = (saunas ?? []).map((s) => ({
      url: `${baseUrl}/saunas/${s.id}`,
      lastModified: new Date(s.updated_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // Supabase 요청 실패해도 기본 URL만이라도 반환
  }

  return [
    { url: baseUrl,                  lastModified: new Date(), changeFrequency: 'daily',  priority: 1   },
    { url: `${baseUrl}/map`,         lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${baseUrl}/search`,      lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...saunaUrls,
  ]
}
