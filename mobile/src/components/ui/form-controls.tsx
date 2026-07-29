import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function FormField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline, autoCapitalize = 'sentences' }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDim}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: Array<{ label: string; value: T }>; onChange: (value: T) => void }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const active = value === option.value;
          return <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{option.label}</Text>{active && <Check size={14} color={Colors.ink} />}</Pressable>;
        })}
      </View>
    </View>
  );
}

export function SelectChips<T extends string>({ label, value, options, onChange, emptyLabel = 'No hay opciones disponibles' }: { label: string; value: T | undefined; options: Array<{ label: string; value: T; detail?: string }>; onChange: (value: T) => void; emptyLabel?: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {!options.length ? <Text style={styles.empty}>{emptyLabel}</Text> : <View style={styles.chips}>{options.map((option) => { const active = value === option.value; return <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, active && styles.chipActive]}><View style={styles.chipCopy}><Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>{option.detail && <Text style={[styles.chipDetail, active && styles.chipDetailActive]}>{option.detail}</Text>}</View>{active && <Check size={15} color={Colors.ink} />}</Pressable>; })}</View>}
    </View>
  );
}

export function SubmitButton({ label, loading, onPress, disabled }: { label: string; loading?: boolean; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled || loading} onPress={onPress} style={[styles.submit, (disabled || loading) && styles.submitDisabled]}>{loading ? <ActivityIndicator color={Colors.ink} /> : <Text style={styles.submitText}>{label}</Text>}</Pressable>;
}

export function FormError({ message }: { message?: string | null }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 8 },
  label: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  input: { minHeight: 50, paddingHorizontal: 15, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, color: Colors.text, backgroundColor: 'rgba(6,18,37,0.58)', fontFamily: Fonts.sans, fontSize: 14 },
  multiline: { minHeight: 88, paddingTop: 14, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 10, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.07)' },
  choiceActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  choiceText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 11 },
  choiceTextActive: { color: Colors.ink },
  chips: { gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(168,183,204,0.06)' },
  chipActive: { borderColor: Colors.mint, backgroundColor: 'rgba(94,234,212,0.13)' },
  chipCopy: { gap: 3 },
  chipText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 13 },
  chipTextActive: { color: Colors.text },
  chipDetail: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11 },
  chipDetailActive: { color: Colors.mint },
  empty: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  submit: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.medium, backgroundColor: Colors.mint, marginTop: 4 },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 14 },
  error: { color: Colors.danger, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
});
