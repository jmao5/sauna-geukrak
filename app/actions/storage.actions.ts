'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 여러 장 병렬 업로드 (Server Action)
 */
export async function uploadImagesAction(saunaId: string, formData: FormData): Promise<string[]> {
  const supabase = await createClient()
  const files = formData.getAll('files') as File[]
  const uploaded: string[] = []

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${saunaId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('sauna-geukrak')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (error) throw new Error(path)
      const { data } = supabase.storage.from('sauna-geukrak').getPublicUrl(path)
      return data.publicUrl
    })
  )

  const failed: string[] = []
  results.forEach((r) => {
    if (r.status === 'fulfilled') uploaded.push(r.value)
    else if (r.reason instanceof Error) failed.push(r.reason.message)
  })

  if (failed.length > 0) {
    await supabase.storage.from('sauna-geukrak').remove(failed).catch(() => null)
    throw new Error(`${failed.length}개 업로드 실패. 성공: ${uploaded.length}개`)
  }

  return uploaded
}

/**
 * 단일 이미지 업로드 (Server Action)
 */
export async function uploadImageAction(saunaId: string, formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  if (!file) throw new Error('파일이 없습니다.')

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${saunaId}/${crypto.randomUUID()}.${ext}`
  
  const { error } = await supabase.storage
    .from('sauna-geukrak')
    .upload(path, file, { upsert: false, contentType: file.type })
  
  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)
  
  const { data } = supabase.storage.from('sauna-geukrak').getPublicUrl(path)
  return data.publicUrl
}

/**
 * 이미지 삭제 (Server Action)
 */
export async function deleteImageAction(publicUrl: string): Promise<void> {
  const supabase = await createClient()
  const marker = '/sauna-geukrak/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  
  const path = publicUrl.slice(idx + marker.length)
  const { error } = await supabase.storage.from('sauna-geukrak').remove([path])
  
  if (error) throw new Error(`이미지 삭제 실패: ${error.message}`)
}
