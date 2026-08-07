import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { ChoiceRow, FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { MobilePagination } from '@/components/ui/mobile-pagination';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Driver, Group, MemberOption, mobileAction } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

type DriverMode = 'member' | 'new';
const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);

  const mutation = useMutation({
    mutationFn: (params: Record<string, unknown>) => mobileAction(editing ? 'updateDriver' : 'createDriver', params, token),
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['drivers'] }), queryClient.invalidateQueries({ queryKey: ['groups'] }), queryClient.invalidateQueries({ queryKey: ['members'] })]); closeModal(); },
    onError: (value: Error) => setError(value.message),
  });
  const deleteMutation = useMutation({ mutationFn: (driverId: string) => mobileAction('deleteDriver', { driverId }, token), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }), onError: (value: Error) => Alert.alert('No se pudo eliminar', value.message) });

  const drivers = driversQuery.data || [];
  const pages = Math.max(1, Math.ceil(drivers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleDrivers = drivers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const availableMembers = (membersQuery.data || []).filter((member) => !groupId || groupsQuery.data?.find((group) => group.id === groupId)?.name === member.group.name);

  function openCreate() { setEditing(null); setMode('member'); setName(''); setGroupId(groupsQuery.data?.[0]?.id); setMemberId(undefined); setError(''); setModal(true); }
  function openEdit(driver: Driver) { setEditing(driver); setMode('new'); setName(driver.name); setGroupId(driver.groupId); setMemberId(undefined); setError(''); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); setError(''); }
  function selectMember(value: string) { const member = (membersQuery.data || []).find((item) => item.id === value); setMemberId(value); if (member) { setName(member.name); const group = (groupsQuery.data || []).find((item) => item.name === member.group.name); if (group) setGroupId(group.id); } }
  function save() { const selectedMember = (membersQuery.data || []).find((item) => item.id === memberId); const finalName = mode === 'member' ? selectedMember?.name || name.trim() : name.trim(); if (!finalName || !groupId) { setError('Elegí un grupo y completá el nombre del conductor.'); return; } mutation.mutate({ name: finalName, groupId, ...(editing ? { driverId: editing.id } : {}) }); }
  function remove(driver: Driver) { Alert.alert('Eliminar conductor', `¿Querés eliminar a ${driver.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(driver.id) }]); }

  return <ScreenBackground><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={driversQuery.isRefetching} onRefresh={() => driversQuery.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}><AppHeader /><View style={styles.intro}><Text style={styles.eyebrow}>PERSONAS QUE RECIBEN TERRITORIOS</Text><Text style={styles.title}>Conductores</Text><Text style={styles.subtitle}>Asigná conductores a cada grupo y mantené visible su actividad.</Text></View><View style={styles.actionRow}><SectionTitle eyebrow="REGISTRO" title={`${drivers.length} conductores`} /><Pressable onPress={openCreate} style={styles.addButton}><Plus size={16} color={Colors.ink} /><Text style={styles.addText}>Nuevo</Text></Pressable></View>{driversQuery.isLoading ? <ScreenLoader label="Cargando conductores..." /> : drivers.length ? <><View style={styles.list}>{visibleDrivers.map((driver, index) => <Animated.View key={driver.id} entering={FadeInUp.duration(420).delay(Math.min(index, 6) * 50)}><DriverCard driver={driver} onEdit={() => openEdit(driver)} onRemove={() => remove(driver)} /></Animated.View>)}</View><MobilePagination page={currentPage} pageSize={PAGE_SIZE} totalItems={drivers.length} onChange={setPage} /></> : <GlassCard style={styles.empty}><UserRound size={28} color={Colors.textDim} /><Text style={styles.emptyTitle}>Sin conductores cargados</Text><Text style={styles.emptyCopy}>Podés crear uno desde un integrante existente o cargarlo manualmente.</Text></GlassCard>}</ScrollView><ModalSheet visible={modal} onClose={closeModal} eyebrow={editing ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'} title={editing ? 'Editar conductor' : 'Crear conductor'}><ChoiceRow label="Origen del conductor" value={mode} options={[{ label: 'Integrante existente', value: 'member' }, { label: 'Cargar nombre', value: 'new' }]} onChange={(value) => { setMode(value); setMemberId(undefined); }} /><SelectChips label="Grupo" value={groupId} options={(groupsQuery.data || []).map((group) => ({ value: group.id, label: group.name, detail: `${group.members.length} integrantes` }))} onChange={(value) => { setGroupId(value); setMemberId(undefined); }} />{mode === 'member' && !editing ? <SelectChips label="Integrante" value={memberId} options={availableMembers.map((member) => ({ value: member.id, label: member.name, detail: member.group.name }))} onChange={selectMember} emptyLabel="No hay integrantes para este grupo" /> : <FormField label="Nombre del conductor" value={name} onChangeText={setName} placeholder="Nombre y apellido" />}{mode === 'member' && !editing && <Text style={styles.formHint}>Seleccionar un integrante existente cumple la misma función que crearlo como conductor desde la sección de grupos.</Text>}<FormError message={error} /><SubmitButton label={editing ? 'Guardar cambios' : 'Crear conductor'} loading={mutation.isPending} onPress={save} /></ModalSheet></ScreenBackground>;
}

function DriverCard({ driver, onEdit, onRemove }: { driver: Driver; onEdit: () => void; onRemove: () => void }) {
  const active = driver.assignments?.filter((item) => !item.isCompleted).length || 0;
  return <GlassCard style={styles.card}><View style={styles.cardTop}><View style={styles.avatar}><UserRound size={19} color={Colors.mint} /></View><View style={styles.cardMain}><Text numberOfLines={1} style={styles.cardTitle}>{driver.name}</Text><Text numberOfLines={1} style={styles.cardMeta}>{driver.group.name}</Text></View></View><View style={[styles.metrics, { marginBottom: 10 }]}><DriverMetric label="ASIGNACIONES" value={driver._count?.assignments || 0} /><DriverMetric label="REGISTROS" value={driver._count?.dailyRecords || 0} /><View style={styles.activeMetric}><ShieldCheck size={14} color={Colors.mint} /><Text style={styles.activeValue}>{active}</Text><Text style={styles.activeLabel}>activas</Text></View></View><View style={[styles.cardActions, { marginTop: 4 }]}><Pressable accessibilityLabel="Editar conductor" onPress={onEdit} style={styles.actionButton}><Pencil size={16} color={Colors.textMuted} /><Text style={styles.actionText}>Editar</Text></Pressable><Pressable accessibilityLabel="Eliminar conductor" onPress={onRemove} style={[styles.actionButton, styles.deleteButton]}><Trash2 size={16} color={Colors.danger} /><Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text></Pressable></View></GlassCard>;
}

function DriverMetric({ label, value }: { label: string; value: number }) { return <View style={styles.metric}><Text style={styles.smallLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four }, intro: { paddingHorizontal: Spacing.four, gap: 5 }, eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.7 }, title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 }, subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four }, addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint }, addText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 }, list: { gap: Spacing.three, paddingHorizontal: Spacing.four }, card: { padding: Spacing.three, gap: Spacing.three }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(94,234,212,0.13)' }, cardMain: { flex: 1, gap: 4 }, cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 }, cardMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 }, metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, minHeight: 58, justifyContent: 'center', paddingHorizontal: 9, borderRadius: Radius.small, backgroundColor: 'rgba(168,183,204,0.06)' }, smallLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 0.7 }, statValue: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 17, marginTop: 4 }, activeMetric: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: Radius.small, backgroundColor: 'rgba(94,234,212,0.1)' }, activeValue: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 16 }, activeLabel: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 8 }, cardActions: { flexDirection: 'row', gap: 8 }, actionButton: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: Radius.small, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' }, deleteButton: { borderColor: 'rgba(244,141,145,0.26)', backgroundColor: 'rgba(244,141,145,0.06)' }, actionText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 11 }, deleteText: { color: Colors.danger }, formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 }, empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 }, emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 }, emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
});
