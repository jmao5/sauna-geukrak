import { createClient } from './server'

/**
 * Supabase Storage 버킷 이름
 * Supabase Dashboard → Storage → New bucket → 이름: sauna-images, Public: ON
 */
const BUCKET = 'sauna-images'

/**
 * contentType에서 확장자를 추출합니다.
 */
function extFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }
  return map[contentType.toLowerCase()] ?? 'jpg'
}

/**
 * 이미지 Buffer를 Supabase Storage에 업로드하고 공개 URL을 반환합니다.
 *
 * @param buffer      - 이미지 데이터 Buffer
 * @param contentType - MIME 타입 (예: 'image/jpeg')
 * @param folder      - 저장 경로 prefix (예: 'saunas/12345')
 * @returns 공개 URL 또는 null (업로드 실패 시)
 *
 * @example
 * const url = await uploadSaunaImage(buffer, 'image/jpeg', 'saunas/some-id')
 * // → 'https://xxx.supabase.co/storage/v1/object/public/sauna-images/saunas/some-id/thumb.jpg'
 */
export async function uploadSaunaImage(
  buffer: Buffer,
  contentType: string,
  folder: string
): Promise<string | null> {
  try {
    const supabase = await createClient()
    const ext = extFromContentType(contentType)
    const filePath = `${folder}/thumb.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,       // 같은 경로에 재업로드 시 덮어씀
        cacheControl: '31536000', // 1년 캐시 (이미지는 변경 없음)
      })

    if (error) {
      console.error('[Storage] 업로드 실패:', error.message)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    return data.publicUrl ?? null
  } catch (err) {
    console.error('[Storage] 예외:', err)
    return null
  }
}

/**
 * Supabase Storage에서 파일을 삭제합니다.
 * 사우나 삭제 시 연관 이미지 정리에 사용합니다.
 *
 * @param publicUrl - getPublicUrl로 얻은 전체 URL
 */
export async function deleteSaunaImage(publicUrl: string): Promise<void> {
  try {
    const supabase = await createClient()

    // URL에서 버킷 이후의 경로만 추출
    const marker = `/${BUCKET}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return

    const filePath = publicUrl.slice(idx + marker.length)
    await supabase.storage.from(BUCKET).remove([filePath])
  } catch (err) {
    console.error('[Storage] 삭제 실패:', err)
  }
}
