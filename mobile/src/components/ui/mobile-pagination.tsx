import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface MobilePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onChange: (page: number) => void;
}

export function MobilePagination({ page, pageSize, totalItems, onChange }: MobilePaginationProps) {
  const pages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (pages < 2) return null;

  const currentPage = Math.min(page, pages);
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="Página anterior" disabled={currentPage === 1} onPress={() => onChange(currentPage - 1)} style={[styles.button, currentPage === 1 && styles.disabled]}>
        <ChevronLeft size={18} color={Colors.textMuted} />
      </Pressable>
      <Text style={styles.label}>Página {currentPage} de {pages}</Text>
      <Pressable accessibilityLabel="Página siguiente" disabled={currentPage === pages} onPress={() => onChange(currentPage + 1)} style={[styles.button, currentPage === pages && styles.disabled]}>
        <ChevronRight size={18} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 6 },
  button: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderStrong, backgroundColor: 'rgba(168,183,204,0.08)' },
  disabled: { opacity: 0.38 },
  label: { minWidth: 98, color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 11, textAlign: 'center' },
});
