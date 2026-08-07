import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Search, X } from 'lucide-react-native';
import { useState } from 'react';
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

export function ClearableSearch({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <View style={styles.searchField}><Search size={18} color={Colors.textDim} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={Colors.textDim} style={styles.searchFieldInput} />{value.length > 0 && <Pressable accessibilityLabel="Limpiar búsqueda" onPress={() => onChangeText('')} style={styles.clearSearch}><X size={16} color={Colors.textMuted} /></Pressable>}</View>;
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
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const matching = options.filter((option) => `${option.label} ${option.detail || ''}`.toLowerCase().includes(term));
  const selected = options.find((option) => option.value === value);
  const visible = term ? matching.slice(0, 6) : selected ? [selected] : [];
  const remaining = term ? Math.max(0, matching.length - visible.length) : 0;
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {!options.length ? <Text style={styles.empty}>{emptyLabel}</Text> : <>
        <View style={styles.selectorSearch}><Search size={16} color={Colors.textDim} /><TextInput value={search} onChangeText={setSearch} placeholder={`Buscar ${label.toLowerCase()}`} placeholderTextColor={Colors.textDim} style={styles.selectorSearchInput} /></View>
        {!visible.length ? <Text style={styles.empty}>{term ? 'No encontramos resultados.' : selected ? 'No hay una selección actual.' : 'Escribí para buscar y seleccionar.'}</Text> : <View style={styles.chips}>{visible.map((option) => { const active = value === option.value; return <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, active && styles.chipActive]}><View style={styles.chipCopy}><Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>{option.detail && <Text numberOfLines={1} style={[styles.chipDetail, active && styles.chipDetailActive]}>{option.detail}</Text>}</View>{active && <Check size={15} color={Colors.ink} />}</Pressable>; })}</View>}
        {remaining > 0 && <Text style={styles.remaining}>Mostrando 6 de {matching.length}. Refiná la búsqueda para encontrar otro.</Text>}
      </>}
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
  searchField: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(6,18,37,0.58)' },
  searchFieldInput: { flex: 1, color: Colors.text, fontFamily: Fonts.sans, fontSize: 14 },
  clearSearch: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.12)' },
  label: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  input: { minHeight: 50, paddingHorizontal: 15, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, color: Colors.text, backgroundColor: 'rgba(6,18,37,0.58)', fontFamily: Fonts.sans, fontSize: 14 },
  multiline: { minHeight: 88, paddingTop: 14, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 10, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.07)' },
  choiceActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  choiceText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 11 },
  choiceTextActive: { color: Colors.ink },
  chips: { gap: 8 },
  selectorSearch: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(6,18,37,0.58)' },
  selectorSearchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.sans, fontSize: 13 },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(168,183,204,0.06)' },
  chipActive: { borderColor: Colors.mint, backgroundColor: 'rgba(94,234,212,0.13)' },
  chipCopy: { gap: 3 },
  chipText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 13 },
  chipTextActive: { color: Colors.text },
  chipDetail: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11 },
  chipDetailActive: { color: Colors.mint },
  empty: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  remaining: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  submit: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.medium, backgroundColor: Colors.mint, marginTop: 4 },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 14 },
  error: { color: Colors.danger, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
});
