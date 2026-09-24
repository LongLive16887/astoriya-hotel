import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { randomId } from '../../lib/ids'
import { getAdminStorage } from './firebase'

const MAX_SIDE = 2000
const QUALITY = 0.84
const MAX_FILE_SIZE = 25 * 1024 * 1024

const cloudinary = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
}

/** Where photos go: Cloudinary when it is configured, otherwise Firebase Storage. */
export const uploadTarget = cloudinary.cloudName && cloudinary.preset ? 'cloudinary' : 'firebase'

export class UploadError extends Error {}

/** Shrinks big photos to at most 2000px and re-encodes them as WebP (JPEG where WebP is unsupported). */
export async function compressImage(file: File): Promise<Blob> {
  // Vector and animated images would lose their nature on a canvas.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY))
  const webp = await encode('image/webp')
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await encode('image/jpeg')
  if (!jpeg) throw new UploadError('Не удалось обработать изображение')
  return jpeg
}

const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

/** Compresses and uploads a photo; resolves with its public URL. */
export async function uploadImage(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  if (!file.type.startsWith('image/')) throw new UploadError('Можно загружать только изображения')
  if (file.size > MAX_FILE_SIZE) throw new UploadError('Файл больше 25 МБ')

  const blob = await compressImage(file)
  return uploadTarget === 'cloudinary' ? uploadToCloudinary(blob, onProgress) : uploadToFirebase(blob, onProgress)
}

function uploadToFirebase(blob: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const extension = EXTENSIONS[blob.type] ?? 'jpg'
  const name = `uploads/${new Date().toISOString().slice(0, 10)}-${randomId(10)}.${extension}`
  const task = uploadBytesResumable(ref(getAdminStorage(), name), blob, {
    contentType: blob.type,
    cacheControl: 'public, max-age=31536000, immutable',
  })
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes),
      (error) => {
        const code = (error as { code?: string }).code
        reject(
          new UploadError(
            code === 'storage/unauthorized'
              ? 'Нет прав на загрузку. Проверьте правила Storage и доступ администратора.'
              : code === 'storage/unknown' || code === 'storage/retry-limit-exceeded'
                ? 'Firebase Storage недоступен. Включите Storage в консоли Firebase (нужен тариф Blaze) или настройте Cloudinary — см. README.'
                : `Ошибка загрузки: ${error.message}`,
          ),
        )
      },
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve, reject)
      },
    )
  })
}

function uploadToCloudinary(blob: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const form = new FormData()
  form.append('file', blob)
  form.append('upload_preset', cloudinary.preset!)
  form.append('folder', 'astoria')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { secure_url?: string; error?: { message: string } }
        if (xhr.status < 300 && body.secure_url) resolve(body.secure_url)
        else reject(new UploadError(`Cloudinary: ${body.error?.message ?? xhr.statusText}`))
      } catch {
        reject(new UploadError('Cloudinary вернул неожиданный ответ'))
      }
    }
    xhr.onerror = () => reject(new UploadError('Нет соединения с Cloudinary'))
    xhr.send(form)
  })
}
