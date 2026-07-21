/**
 * Convierte URLs de Google Drive a formato directo de imagen lh3.googleusercontent.com
 *
 * Formatos aceptados:
 *   - https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
 *   - https://drive.google.com/file/d/FILE_ID/view
 *   - https://drive.google.com/uc?export=view&id=FILE_ID
 *   - https://drive.google.com/open?id=FILE_ID
 *
 * Formato de salida:
 *   https://lh3.googleusercontent.com/d/FILE_ID=w3000?authuser=0
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url || !url.includes('drive.google.com')) {
    return url
  }

  // Intentar extraer el file ID de distintos formatos
  let fileId: string | null = null

  // Formato: /file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([^/\\?&]+)/)
  if (fileMatch) {
    fileId = fileMatch[1]
  }

  // Formato: ?id=FILE_ID o &id=FILE_ID
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([^&]+)/)
    if (idMatch) {
      fileId = idMatch[1]
    }
  }

  if (!fileId) {
    // Si no se pudo extraer un ID, devolvemos la URL original
    console.warn('No se pudo extraer el file ID de la URL de Google Drive:', url)
    return url
  }

  return `https://lh3.googleusercontent.com/d/${fileId}=w3000?authuser=0`
}
