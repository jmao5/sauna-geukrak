'use server'

import { createClient } from '@/lib/supabase/server'

const BUCKET = 'sauna-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES_PER_UPLOAD = 5
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

function getExtension(file: File): string {
  return file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
}

function validateFiles(files: FormDataEntryValue[]): File[] {
  if (files.length === 0) throw new Error('업로드할 파일이 없습니다.')
  if (files.length > MAX_FILES_PER_UPLOAD) throw new Error(`한 번에 최대 ${MAX_FILES_PER_UPLOAD}장까지 업로드할 수 있습니다.`)

  return files.map((entry) => {
    if (!(entry instanceof File)) throw new Error('유효하지 않은 파일입니다.')
    if (!ALLOWED_IMAGE_TYPES.has(entry.type)) throw new Error('JPEG, PNG, WebP, AVIF 이미지만 업로드할 수 있습니다.')
    if (entry.size === 0 || entry.size > MAX_FILE_SIZE) throw new Error('이미지 파일은 5MB 이하여야 합니다.')
    return entry
  })
}

function validateSaunaId(saunaId: string): void {
  if (!/^(?:temp|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(saunaId)) {
    throw new Error('유효하지 않은 사우나 ID입니다.')
  }
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')
  return supabase
}

async function uploadImages(prefix: string, formData: FormData): Promise<string[]> {
  const files = validateFiles(formData.getAll('files'))
  const supabase = await getAuthenticatedClient()
  const uploadedPaths: string[] = []

  try {
    return await Promise.all(files.map(async (file) => {
      const path = `${prefix}/${crypto.randomUUID()}.${getExtension(file)}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type,
        cacheControl: '31536000',
      })
      if (error) throw new Error(error.message)
      uploadedPaths.push(path)
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    }))
  } catch (error) {
    if (uploadedPaths.length > 0) await supabase.storage.from(BUCKET).remove(uploadedPaths)
    throw error
  }
}

/** 여러 장 병렬 업로드 — 일반 사우나 사진용 */
export async function uploadImagesAction(saunaId: string, formData: FormData): Promise<string[]> {
  validateSaunaId(saunaId)
  return uploadImages(`saunas/${saunaId}`, formData)
}

/** 사우나 내부 모형도·도면 이미지 업로드 */
export async function uploadFloorPlanAction(saunaId: string, formData: FormData): Promise<string[]> {
  validateSaunaId(saunaId)
  return uploadImages(`floor-plans/${saunaId}`, formData)
}

/** 단일 이미지 업로드 */
export async function uploadImageAction(saunaId: string, formData: FormData): Promise<string> {
  validateSaunaId(saunaId)
  const singleFile = formData.get('file')
  const uploadData = new FormData()
  if (singleFile) uploadData.append('files', singleFile)
  const [url] = await uploadImages(`saunas/${saunaId}`, uploadData)
  return url
}

/** 현재 Supabase 프로젝트의 공개 버킷 URL만 삭제 대상으로 허용한다. */
function getStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const expectedOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
    const prefix = `/storage/v1/object/public/${BUCKET}/`
    if (url.origin !== expectedOrigin || !url.pathname.startsWith(prefix)) return null
    return decodeURIComponent(url.pathname.slice(prefix.length)) || null
  } catch {
    return null
  }
}

/** 이미지 삭제 — Storage RLS가 업로드한 본인 파일만 허용한다. */
export async function deleteImageAction(publicUrl: string): Promise<void> {
  const path = getStoragePath(publicUrl)
  if (!path) throw new Error('삭제할 수 없는 이미지 URL입니다.')

  const supabase = await getAuthenticatedClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`이미지 삭제 실패: ${error.message}`)
}
