import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { ChoiceRow, FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Driver, Group, MemberOption, mobileAction } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

type DriverMode = 'member' | 'new';

export default function DriversScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const driversQuery = useQuery({ queryKey: ['drivers'], queryFn: () => mobileAction<Driver[]>('getAllDrivers', { page: 1, pageSize: 100 }, token), enabled: Boolean(token) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => mobileAction<Group[]>('getAllGroups', {}, token), enabled: Boolean(token) });
  const membersQuery = useQuery({ queryKey: ['members'], queryFn: () => mobileAction<MemberOption[]>('getAllMembersForSelect', {}, token), enabled: Boolean(token) });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [mode, setMode] = useState<DriverMode>('member');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<string>();
  const [memberId, setMemberId] = useState<string>();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (params: Record<string, unknown>) => mobileAction(editing ? 'updateDriver' : 'createDriver', params, token),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['drivers'] }); await queryClient.invalidateQueries({ queryKey: ['groups'] }); await queryClient.invalidateQueries({ queryKey: ['members'] }); closeModal(); },
    onError: (value: Error) => setError(value.message),
  });
  const deleteMutation = useMutation({ mutationFn: (driverId: string) => mobileAction('deleteDriver', { driverId }, token), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }), onError: (value: Error) => Alert.alert('No se pudo eliminar', value.message) });

  function openCreate() { setEditing(null); setMode('member'); setName(''); setGroupId(groupsQuery.data?.[0]?.id); setMemberId(undefined); setError(''); setModal(true); }
  function openEdit(driver: Driver) { setEditing(driver); setMode('new'); setName(driver.name); setGroupId(driver.groupId); setMemberId(undefined); setError(''); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); setError(''); }
  function selectMember(value: string) { const member = (membersQuery.data || []).find((item) => item.id === value); setMemberId(value); if (member) { setName(member.name); const group = (groupsQuery.data || []).find((item) => item.name === member.group.name); if (group) setGroupId(group.id); } }
  function save() { const selectedMember = (membersQuery.data || []).find((item) => item.id === memberId); const finalName = mode === 'member' ? selectedMember?.name || name.trim() : name.trim(); if (!finalName || !groupId) { setError('Elegí un grupo y completá el nombre del conductor.'); return; } mutation.mutate({ name: finalName, groupId, ...(editing ? { driverId: editing.id } : {}) }); }
  function remove(driver: Driver) { Alert.alert('Eliminar conductor', `¿Querés eliminar a ${driver.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(driver.id) }]); }

  const drivers = driversQuery.data || [];
  const availableMembers = (membersQuery.data || []).filter((member) => !groupId || groupsQuery.data?.find((group) => group.id === groupId)?.name === member.group.name);
  return <ScreenBackground><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={driversQuery.isRefetching} onRefresh={() => driversQuery.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}><AppHeader /><View style={styles.intro}><Text style={styles.eyebrow}>PERSONAS QUE RECIBEN TERRITORIOS</Text><Text style={styles.title}>Conductores</Text><Text style={styles.subtitle}>Asigná conductores a cada grupo y mantené visible su actividad.</Text></View><View style={styles.actionRow}><SectionTitle eyebrow="REGISTRO" title={`${drivers.length} conductores`} /><Pressable onPress={openCreate} style={styles.addButton}><Plus size={16} color={Colors.ink} /><Text style={styles.addText}>Nuevo</Text></Pressable></View><View style={styles.list}>{drivers.map((driver, index) => <Animated.View key={driver.id} entering={FadeInUp.duration(420).delay(Math.min(index, 6) * 50)}><GlassCard style={styles.card}><View style={styles.cardTop}><View style={styles.avatar}><UserRound size={19} color={Colors.mint} /></View><View style={styles.cardMain}><Text style={styles.cardTitle}>{driver.name}</Text><Text style={styles.cardMeta}>{driver.group.name}</Text></View><Pressable onPress={() => openEdit(driver)} style={styles.iconButton}><Pencil size={15} color={Colors.textMuted} /></Pressable><Pressable onPress={() => remove(driver)} style={styles.iconButton}><Trash2 size={15} color={Colors.textDim} /></Pressable></View><View style={styles.stats}><View><Text style={styles.smallLabel}>ASIGNACIONES</Text><Text style={styles.statValue}>{driver._count?.assignments || 0}</Text></View><View><Text style={styles.smallLabel}>REGISTROS</Text><Text style={styles.statValue}>{driver._count?.dailyRecords || 0}</Text></View><View style={styles.activePill}><ShieldCheck size={13} color={Colors.mint} /><Text style={styles.activeText}>{driver.assignments?.filter((item) => !item.isCompleted).length || 0} activas</Text></View></View></GlassCard></Animated.View>)}</View>{!drivers.length && !driversQuery.isLoading && <GlassCard style={styles.empty}><UserRound size={28} color={Colors.textDim} /><Text style={styles.emptyTitle}>Sin conductores cargados</Text><Text style={styles.emptyCopy}>Podés crear uno desde un integrante existente o cargarlo manualmente.</Text></GlassCard>}</ScrollView><ModalSheet visible={modal} onClose={closeModal} eyebrow={editing ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'} title={editing ? 'Editar conductor' : 'Crear conductor'}><ChoiceRow label="Origen del conductor" value={mode} options={[{ label: 'Integrante existente', value: 'member' }, { label: 'Cargar nombre', value: 'new' }]} onChange={(value) => { setMode(value); setMemberId(undefined); }} /><SelectChips label="Grupo" value={groupId} options={(groupsQuery.data || []).map((group) => ({ value: group.id, label: group.name, detail: `${group.members.length} integrantes` }))} onChange={(value) => { setGroupId(value); setMemberId(undefined); }} />{mode === 'member' && !editing ? <SelectChips label="Integrante" value={memberId} options={availableMembers.map((member) => ({ value: member.id, label: member.name, detail: member.group.name }))} onChange={selectMember} emptyLabel="No hay integrantes para este grupo" /> : <FormField label="Nombre del conductor" value={name} onChangeText={setName} placeholder="Nombre y apellido" />}{mode === 'member' && !editing && <Text style={styles.formHint}>Seleccionar un integrante existente cumple la misma función que crearlo como conductor desde la sección de grupos.</Text>}<FormError message={error} /><SubmitButton label={editing ? 'Guardar cambios' : 'Crear conductor'} loading={mutation.isPending} onPress={save} /></ModalSheet></ScreenBackground>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four },
  intro: { paddingHorizontal: Spacing.four, gap: 5 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.7 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint },
  addText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 },
  list: { gap: Spacing.three, paddingHorizontal: Spacing.four },
  card: { padding: Spacing.three, gap: Spacing.three },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(94,234,212,0.13)' },
  cardMain: { flex: 1, gap: 4 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  cardMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.08)' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  smallLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 1 },
  statValue: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 15, marginTop: 3 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto', paddingHorizontal: 9, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: 'rgba(94,234,212,0.1)' },
  activeText: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10 },
  formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
});
