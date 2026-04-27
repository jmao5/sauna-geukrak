import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sauna-geukrak.vercel.app'
  
  // 나중에 동적으로 사우나 목록을 가져와서 추가할 수 있습니다.
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 예시: { url: `${baseUrl}/search`, lastModified: new Date(), priority: 0.8 },
  ]
}
