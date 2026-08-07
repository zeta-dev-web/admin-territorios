import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, ShieldCheck, Trash2, UserPlus, UsersRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { FormError, FormField, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Group, GroupMember, mobileAction } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function GroupsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => mobileAction<Group[]>('getAllGroups', {}, token), enabled: Boolean(token) });
  const [groupModal, setGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', superintendent: '', auxiliary: '' });
  const [groupError, setGroupError] = useState('');
  const [memberModal, setMemberModal] = useState(false);
  const [memberGroup, setMemberGroup] = useState<Group | null>(null);
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberError, setMemberError] = useState('');

  const groupMutation = useMutation({
    mutationFn: (params: Record<string, unknown>) => mobileAction(editingGroup ? 'updateGroup' : 'createGroup', params, token),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['groups'] }); await queryClient.invalidateQueries({ queryKey: ['drivers'] }); closeGroupModal(); },
    onError: (error: Error) => setGroupError(error.message),
  });
  const memberMutation = useMutation({
    mutationFn: (params: Record<string, unknown>) => mobileAction(editingMember ? 'updateMember' : 'createMember', params, token),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['groups'] }); await queryClient.invalidateQueries({ queryKey: ['members'] }); closeMemberModal(); },
    onError: (error: Error) => setMemberError(error.message),
  });
  const actionMutation = useMutation({
    mutationFn: ({ action, params }: { action: string; params: Record<string, unknown> }) => mobileAction(action, params, token),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['groups'] }); await queryClient.invalidateQueries({ queryKey: ['drivers'] }); await queryClient.invalidateQueries({ queryKey: ['members'] }); },
    onError: (error: Error) => Alert.alert('No se pudo completar', error.message),
  });

  function openCreateGroup() { setEditingGroup(null); setGroupForm({ name: '', superintendent: '', auxiliary: '' }); setGroupError(''); setGroupModal(true); }
  function openEditGroup(group: Group) { setEditingGroup(group); setGroupForm({ name: group.name, superintendent: group.superintendent || '', auxiliary: group.auxiliary || '' }); setGroupError(''); setGroupModal(true); }
  function closeGroupModal() { setGroupModal(false); setEditingGroup(null); setGroupError(''); }
  function saveGroup() {
    if (!groupForm.name.trim()) { setGroupError('Ingresá el número o nombre del grupo.'); return; }
    const params = { name: groupForm.name.trim(), superintendent: groupForm.superintendent.trim() || undefined, auxiliary: groupForm.auxiliary.trim() || undefined, ...(editingGroup ? { groupId: editingGroup.id } : {}) };
    groupMutation.mutate(params);
  }
  function openCreateMember(group: Group) { setMemberGroup(group); setEditingMember(null); setMemberName(''); setMemberError(''); setMemberModal(true); }
  function openEditMember(group: Group, member: GroupMember) { setMemberGroup(group); setEditingMember(member); setMemberName(member.name); setMemberError(''); setMemberModal(true); }
  function closeMemberModal() { setMemberModal(false); setMemberGroup(null); setEditingMember(null); setMemberError(''); }
  function saveMember() {
    if (!memberName.trim() || !memberGroup) { setMemberError('Ingresá el nombre del integrante.'); return; }
    memberMutation.mutate({ name: memberName.trim(), groupId: memberGroup.id, ...(editingMember ? { memberId: editingMember.id } : {}) });
  }
  function toggleDriver(group: Group, member: GroupMember) {
    Alert.alert(memberIsDriver(group, member) ? 'Quitar conductor' : 'Hacer conductor', `${member.name} ${memberIsDriver(group, member) ? 'dejará de' : 'pasará a'} ser conductor del grupo.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Continuar', onPress: () => actionMutation.mutate({ action: 'toggleMemberDriver', params: { memberId: member.id, groupId: group.id, memberName: member.name } }) }]);
  }
  function deleteMember(member: GroupMember) {
    Alert.alert('Eliminar integrante', `¿Querés eliminar a ${member.name}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => actionMutation.mutate({ action: 'deleteMember', params: { memberId: member.id } }) }]);
  }
  function memberIsDriver(group: Group, member: GroupMember) { return group.drivers.some((driver) => driver.name.toLowerCase() === member.name.toLowerCase()); }

  const groups = groupsQuery.data || [];
  return <ScreenBackground>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={groupsQuery.isRefetching} onRefresh={() => groupsQuery.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}>
      <AppHeader />
      <View style={styles.intro}><Text style={styles.eyebrow}>ESTRUCTURA DE LA CONGREGACIÓN</Text><Text style={styles.title}>Grupos</Text><Text style={styles.subtitle}>Administrá responsables, auxiliares e integrantes desde un mismo lugar.</Text></View>
      <View style={styles.actionRow}><SectionTitle eyebrow="REGISTRO" title={`${groups.length} grupos`} /><Pressable onPress={openCreateGroup} style={styles.addButton}><Plus size={16} color={Colors.ink} /><Text style={styles.addText}>Nuevo grupo</Text></Pressable></View>
      {groupsQuery.isLoading ? <ScreenLoader label="Cargando grupos..." /> : <View style={styles.list}>{groups.map((group, index) => <Animated.View key={group.id} entering={FadeInUp.duration(420).delay(Math.min(index, 6) * 50)}><GroupCard group={group} onEdit={() => openEditGroup(group)} onAddMember={() => openCreateMember(group)} onEditMember={(member) => openEditMember(group, member)} onToggleDriver={(member) => toggleDriver(group, member)} onDeleteMember={deleteMember} memberIsDriver={(member) => memberIsDriver(group, member)} /></Animated.View>)}</View>}
      {!groups.length && !groupsQuery.isLoading && <GlassCard style={styles.empty}><UsersRound size={28} color={Colors.textDim} /><Text style={styles.emptyTitle}>Todavía no hay grupos</Text><Text style={styles.emptyCopy}>Creá el primero para empezar a organizar la congregación.</Text></GlassCard>}
    </ScrollView>
    <ModalSheet visible={groupModal} onClose={closeGroupModal} eyebrow={editingGroup ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'} title={editingGroup ? 'Editar grupo' : 'Crear grupo'}><FormField label="Número o nombre" value={groupForm.name} onChangeText={(value) => setGroupForm({ ...groupForm, name: value })} placeholder="Ej. Grupo 1" /><FormField label="Superintendente" value={groupForm.superintendent} onChangeText={(value) => setGroupForm({ ...groupForm, superintendent: value })} placeholder="Nombre y apellido" /><FormField label="Auxiliar" value={groupForm.auxiliary} onChangeText={(value) => setGroupForm({ ...groupForm, auxiliary: value })} placeholder="Nombre y apellido" /><Text style={styles.formHint}>Los responsables también quedan registrados como integrantes y conductores.</Text><FormError message={groupError} /><SubmitButton label={editingGroup ? 'Guardar cambios' : 'Crear grupo'} loading={groupMutation.isPending} onPress={saveGroup} /></ModalSheet>
    <ModalSheet visible={memberModal} onClose={closeMemberModal} eyebrow={memberGroup?.name} title={editingMember ? 'Editar integrante' : 'Agregar integrante'}><FormField label="Nombre completo" value={memberName} onChangeText={setMemberName} placeholder="Nombre y apellido" /><Text style={styles.formHint}>Después podrás convertirlo en conductor con el botón de conductor.</Text><FormError message={memberError} /><SubmitButton label={editingMember ? 'Guardar cambios' : 'Agregar integrante'} loading={memberMutation.isPending} onPress={saveMember} /></ModalSheet>
  </ScreenBackground>;
}

function GroupCard({ group, onEdit, onAddMember, onEditMember, onToggleDriver, onDeleteMember, memberIsDriver }: { group: Group; onEdit: () => void; onAddMember: () => void; onEditMember: (member: GroupMember) => void; onToggleDriver: (member: GroupMember) => void; onDeleteMember: (member: GroupMember) => void; memberIsDriver: (member: GroupMember) => boolean }) {
  return <GlassCard style={styles.card}><View style={styles.cardTop}><View style={styles.groupBadge}><Text style={styles.groupBadgeText}>{group.name.replace(/[^0-9]/g, '') || 'G'}</Text></View><View style={styles.cardMain}><Text style={styles.cardTitle}>{group.name}</Text><Text style={styles.cardMeta}>{group.members.length} integrantes · {group.drivers.length} conductores</Text></View><Pressable onPress={onEdit} style={styles.iconButton}><Pencil size={16} color={Colors.textMuted} /></Pressable></View><View style={styles.responsibles}><View><Text style={styles.smallLabel}>SUPERINTENDENTE</Text><Text style={styles.responsible}>{group.superintendent || 'Sin asignar'}</Text></View><View><Text style={styles.smallLabel}>AUXILIAR</Text><Text style={styles.responsible}>{group.auxiliary || 'Sin asignar'}</Text></View></View><View style={styles.divider} /><View style={styles.memberHeader}><Text style={styles.membersTitle}>Integrantes</Text><Pressable onPress={onAddMember} style={styles.memberAdd}><UserPlus size={14} color={Colors.mint} /><Text style={styles.memberAddText}>Agregar</Text></Pressable></View><View style={styles.members}>{group.members.map((member) => <View key={member.id} style={styles.memberItem}><View style={styles.memberRow}><View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{member.name.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.memberName}>{member.name}</Text></View><View style={styles.memberActions}><Pressable onPress={() => onToggleDriver(member)} style={[styles.memberAction, styles.driverButton, memberIsDriver(member) && styles.driverButtonActive]}><ShieldCheck size={14} color={memberIsDriver(member) ? Colors.ink : Colors.textDim} /><Text style={[styles.memberActionText, memberIsDriver(member) && styles.driverTextActive]}>Conductor</Text></Pressable><Pressable onPress={() => onEditMember(member)} style={styles.memberAction}><Pencil size={14} color={Colors.textMuted} /><Text style={styles.memberActionText}>Editar</Text></Pressable><Pressable onPress={() => onDeleteMember(member)} style={[styles.memberAction, styles.memberActionDanger]}><Trash2 size={14} color={Colors.danger} /><Text style={styles.memberActionDangerText}>Eliminar</Text></Pressable></View></View>)}</View></GlassCard>;
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(51,133,246,0.16)', borderWidth: 1, borderColor: 'rgba(84,161,255,0.24)' },
  groupBadgeText: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 18 },
  cardMain: { flex: 1, gap: 4 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 16 },
  cardMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.08)' },
  responsibles: { flexDirection: 'row', gap: 26 },
  smallLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 1 },
  responsible: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border },
  memberHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  membersTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 13 },
  memberAdd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberAddText: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 11 },
  members: { gap: 14 },
  memberItem: { gap: 8, paddingBottom: 2 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberAvatar: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(94,234,212,0.13)' },
  memberAvatarText: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 11 },
  memberName: { flex: 1, color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12 },
  memberActions: { flexDirection: 'row', gap: 8 },
  memberAction: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: Radius.small, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  memberActionText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10 },
  memberActionDanger: { borderColor: 'rgba(244,141,145,0.23)', backgroundColor: 'rgba(244,141,145,0.07)' },
  memberActionDangerText: { color: Colors.danger, fontFamily: Fonts.rounded, fontSize: 10 },
  driverButton: { backgroundColor: 'rgba(168,183,204,0.08)' },
  driverButtonActive: { backgroundColor: Colors.mint },
  driverTextActive: { color: Colors.ink },
  formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
});
