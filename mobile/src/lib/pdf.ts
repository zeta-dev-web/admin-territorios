import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function saveAndSharePdf(pdfBase64: string, filename: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([base64ToBytes(pdfBase64)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return 'downloaded' as const;
  }

  const file = new File(Paths.document, filename);
  file.write(pdfBase64, { encoding: 'base64' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir formulario S-13-S',
      UTI: 'com.adobe.pdf',
    });
    return 'shared' as const;
  }

  return 'saved' as const;
}
