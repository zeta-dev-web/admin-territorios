import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function saveAndSharePdf(pdf: Blob, filename: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return 'downloaded' as const;
  }

  const file = new File(Paths.cache, filename);
  file.write(new Uint8Array(await pdf.arrayBuffer()));

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
