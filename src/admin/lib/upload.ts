import { UNAUTHORIZED_EVENT } from '../../lib/api'

const MAX_SIDE = 2000
const QUALITY = 0.84
const MAX_FILE_SIZE = 25 * 1024 * 1024
/** What the server accepts for one photo (after compression). */
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

export class UploadError extends Error {}

/** Shrinks big photos to at most 2000px and re-encodes them as WebP (JPEG where WebP is unsupported). */
export async function compressImage(file: File): Promise<Blob> {
  // An animated GIF would lose its animation on a canvas.
  if (file.type === 'image/gif') return file

  // Older browsers do not know the "from-image" option (they rotate by EXIF anyway).
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file))
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

/** Compresses a photo and uploads it to the server; resolves with its address on the site. */
export async function uploadImage(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  if (!file.type.startsWith('image/')) throw new UploadError('Можно загружать только изображения')
  if (file.type === 'image/svg+xml') throw new UploadError('SVG не поддерживается — сохраните картинку как PNG или JPG')
  if (file.size > MAX_FILE_SIZE) throw new UploadError('Файл больше 25 МБ')

  const blob = await compressImage(file)
  if (blob.size >= MAX_UPLOAD_SIZE) {
    throw new UploadError('Файл больше 10 МБ. GIF загружаются без сжатия — уменьшите файл и попробуйте снова.')
  }
  return send(blob, onProgress)
}

const UPLOAD_ERRORS: Record<number, string> = {
  401: 'Сессия закончилась. Войдите снова.',
  413: 'Файл больше 10 МБ.',
  415: 'Этот формат не поддерживается: загрузите JPG, PNG, WebP или GIF.',
}

function send(blob: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/uploads')
    xhr.setRequestHeader('Content-Type', blob.type)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status === 201) {
        try {
          resolve((JSON.parse(xhr.responseText) as { url: string }).url)
        } catch {
          reject(new UploadError('Сервер вернул неожиданный ответ'))
        }
        return
      }
      if (xhr.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      reject(new UploadError(UPLOAD_ERRORS[xhr.status] ?? `Не удалось загрузить фото (ошибка ${xhr.status})`))
    }
    xhr.onerror = () => reject(new UploadError('Нет соединения с сервером'))
    xhr.send(blob)
  })
}
