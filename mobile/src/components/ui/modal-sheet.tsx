import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface ModalSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
}

export function ModalSheet({ visible, title, eyebrow, onClose, children }: ModalSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeButton}>
              <X size={19} color={Colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(2,8,20,0.72)' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Colors.navy,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingTop: 10,
  },
  safeArea: { backgroundColor: Colors.navy },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 4, backgroundColor: Colors.textDim },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingTop: 18, paddingBottom: 12 },
  headerCopy: { gap: 4 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1.6 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 23, letterSpacing: -0.4 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.09)' },
  scroll: { flexShrink: 1 },
  body: { gap: Spacing.three, paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
});
