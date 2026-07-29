import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPinned, Pencil, Plus, Search, UsersRound } from 'lucide-react-native';
import { useDeferredValue, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Group, mobileAction, Territory } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

function parseLetters(value: string) { return [...new Set(value.toUpperCase().split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean))]; }

export default function TerritoriesScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Territory | null>(null);
  const [form, setForm] = useState({ number: '', groupId: '', description: '', blocks: '' });
  const [error, setError] = useState('');
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['territories'], queryFn: () => mobileAction<Territory[]>('getAllTerritories', { page: 1, pageSize: 100 }, token), enabled: Boolean(token) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => mobileAction<Group[]>('getAllGroups', {}, token), enabled: Boolean(token) });
  const mutation = useMutation({ mutationFn: (params: Record<string, unknown>) => mobileAction(editing ? 'updateTerritory' : 'createTerritory', params, token), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['territories'] }); await queryClient.invalidateQueries({ queryKey: ['dashboard'] }); closeModal(); }, onError: (value: Error) => setError(value.message) });
  const term = deferredSearch.toLowerCase().trim();
  const territories = (query.data || []).filter((territory) => !term || `${territory.number} ${territory.description || ''} ${territory.group.name}`.toLowerCase().includes(term));

  function openCreate() { setEditing(null); setForm({ number: '', groupId: groupsQuery.data?.[0]?.id || '', description: '', blocks: '' }); setError(''); setModal(true); }
  function openEdit(territory: Territory) { setEditing(territory); setForm({ number: String(territory.number), groupId: territory.group.id, description: territory.description || '', blocks: territory.blocks.map((block) => block.letter).join(', ') }); setError(''); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); setError(''); }
  function save() { const number = Number(form.number); const blockLetters = parseLetters(form.blocks); if (!Number.isInteger(number) || number <= 0 || !form.groupId) { setError('Ingresá un número válido y elegí el grupo.'); return; } const params = editing ? { territoryId: editing.id, data: { number, groupId: form.groupId, description: form.description.trim() || undefined, blockLetters } } : { number, groupId: form.groupId, description: form.description.trim() || undefined, blockLetters }; mutation.mutate(params); }

  return <ScreenBackground><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}><AppHeader /><View style={styles.intro}><Text style={styles.eyebrow}>MAPA DE COBERTURA</Text><Text style={styles.title}>Territorios</Text><Text style={styles.subtitle}>Cargá el territorio, su grupo y las manzanas en orden alfabético.</Text></View><View style={styles.searchShell}><Search size={18} color={Colors.textDim} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar por número o grupo" placeholderTextColor={Colors.textDim} style={styles.searchInput} /></View><View style={styles.actionRow}><SectionTitle eyebrow="REGISTRO" title={`${territories.length} territorios`} /><Pressable onPress={openCreate} style={styles.addButton}><Plus size={16} color={Colors.ink} /><Text style={styles.addText}>Nuevo</Text></Pressable></View><View style={styles.list}>{territories.map((territory, index) => <Animated.View key={territory.id} entering={FadeInUp.duration(450).delay(Math.min(index, 6) * 45)}><TerritoryCard territory={territory} onEdit={() => openEdit(territory)} /></Animated.View>)}</View>{!territories.length && <GlassCard style={styles.empty}><MapPinned size={26} color={Colors.textDim} /><Text style={styles.emptyTitle}>No encontramos ese territorio</Text><Text style={styles.emptyCopy}>Probá con otro número o grupo.</Text></GlassCard>}</ScrollView><ModalSheet visible={modal} onClose={closeModal} eyebrow={editing ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'} title={editing ? 'Editar territorio' : 'Crear territorio'}><FormField label="Número" value={form.number} onChangeText={(value) => setForm({ ...form, number: value.replace(/[^0-9]/g, '') })} placeholder="Ej. 4" keyboardType="numeric" /><SelectChips label="Grupo asignado" value={form.groupId} options={(groupsQuery.data || []).map((group) => ({ value: group.id, label: group.name, detail: `${group.members.length} integrantes` }))} onChange={(value) => setForm({ ...form, groupId: value })} /><FormField label="Descripción (opcional)" value={form.description} onChangeText={(value) => setForm({ ...form, description: value })} placeholder="Ej. Zona norte" /><FormField label="Manzanas" value={form.blocks} onChangeText={(value) => setForm({ ...form, blocks: value })} placeholder="Ej. A, B, C, D" autoCapitalize="characters" /><Text style={styles.formHint}>Si el territorio tiene 4 manzanas, cargalas como A, B, C y D. Esto permite registrar el avance una por una.</Text><FormError message={error} /><SubmitButton label={editing ? 'Guardar cambios' : 'Crear territorio'} loading={mutation.isPending} onPress={save} /></ModalSheet></ScreenBackground>;
}

function TerritoryCard({ territory, onEdit }: { territory: Territory; onEdit: () => void }) {
  const active = Boolean(territory.assignments?.length || territory.personalAssignments?.length);
  return <GlassCard style={styles.card}><View style={styles.cardTop}><View style={styles.number}><Text style={styles.numberText}>{territory.number}</Text></View><View style={styles.cardMain}><Text style={styles.cardTitle}>{territory.description || `Territorio ${territory.number}`}</Text><View style={styles.groupLine}><UsersRound size={12} color={Colors.textDim} /><Text style={styles.groupText}>{territory.group.name}</Text></View></View><View style={[styles.status, active ? styles.statusActive : styles.statusQuiet]}><View style={[styles.statusDot, { backgroundColor: active ? Colors.mint : Colors.textDim }]} /><Text style={styles.statusText}>{active ? 'ACTIVO' : 'DISPONIBLE'}</Text></View><Pressable onPress={onEdit} hitSlop={8}><Pencil size={15} color={Colors.textDim} /></Pressable></View><View style={styles.bottom}><Text style={styles.blocks}>{territory.blocks.length} {territory.blocks.length === 1 ? 'manzana' : 'manzanas'}</Text><View style={styles.letters}>{territory.blocks.slice(0, 7).map((block) => <View key={block.id} style={[styles.letter, active && styles.letterActive]}><Text style={styles.letterText}>{block.letter}</Text></View>)}{territory.blocks.length > 7 && <Text style={styles.more}>+{territory.blocks.length - 7}</Text>}</View></View></GlassCard>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four },
  intro: { paddingHorizontal: Spacing.four, gap: 5 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  searchShell: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.four, paddingHorizontal: 15, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(6,18,37,0.52)' },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.sans, fontSize: 13 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint },
  addText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 },
  list: { gap: Spacing.three, paddingHorizontal: Spacing.four },
  card: { padding: Spacing.three, gap: Spacing.three },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(51,133,246,0.15)', borderWidth: 1, borderColor: 'rgba(84,161,255,0.24)' },
  numberText: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 19 },
  cardMain: { flex: 1, gap: 5 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  groupLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  groupText: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.pill },
  statusActive: { backgroundColor: 'rgba(94,234,212,0.11)' },
  statusQuiet: { backgroundColor: 'rgba(168,183,204,0.08)' },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 0.6 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blocks: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12 },
  letters: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  letter: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: 'rgba(168,183,204,0.1)' },
  letterActive: { backgroundColor: 'rgba(94,234,212,0.14)' },
  letterText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10 },
  more: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 10 },
  formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
});
