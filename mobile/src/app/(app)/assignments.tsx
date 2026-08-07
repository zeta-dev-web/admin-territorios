import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, CheckCircle2, Circle, ClipboardList, Eye, Grid3X3, Pencil, Plus, Trash2, UserRound, UsersRound } from 'lucide-react-native';
import { useDeferredValue, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { ChoiceRow, ClearableSearch, FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { MobilePagination } from '@/components/ui/mobile-pagination';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { EditAssignmentSheet } from '@/components/assignments/edit-assignment-sheet';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { AssignmentBlockStatus, AssignmentBlocksData, Driver, MemberOption, mobileAction, UnifiedAssignment } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

type AssignmentFilter = 'TODAS' | 'CONDUCTOR' | 'PERSONAL';
type AssignmentMode = 'CONDUCTOR' | 'PERSONAL';
type AssignmentAction = 'REGISTER' | 'STATUS' | 'RETURN' | null;
const PAGE_SIZE = 8;

interface SelectTerritory {
  id: string;
  number: number;
  description: string | null;
  blocks: Array<{ letter: string }>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AssignmentsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AssignmentFilter>('TODAS');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [mode, setMode] = useState<AssignmentMode>('CONDUCTOR');
  const [territoryId, setTerritoryId] = useState<string>();
  const [driverId, setDriverId] = useState<string>();
  const [memberId, setMemberId] = useState<string>();
  const [blockLetters, setBlockLetters] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<UnifiedAssignment | null>(null);
  const [assignmentAction, setAssignmentAction] = useState<AssignmentAction>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [workDate, setWorkDate] = useState(today());
  const [workNotes, setWorkNotes] = useState('');
  const [returnDate, setReturnDate] = useState(today());
  const [actionError, setActionError] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<UnifiedAssignment | null>(null);
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ['assignments'],
    queryFn: () => mobileAction<UnifiedAssignment[]>('getUnifiedAssignments', { page: 1, pageSize: 100 }, token),
    enabled: Boolean(token),
  });
  const territoriesQuery = useQuery({ queryKey: ['territory-select'], queryFn: () => mobileAction<SelectTerritory[]>('getAllTerritoriesForSelect', {}, token), enabled: Boolean(token) });
  const driversQuery = useQuery({ queryKey: ['driver-select'], queryFn: () => mobileAction<Driver[]>('getAllDriversForSelect', {}, token), enabled: Boolean(token) });
  const membersQuery = useQuery({ queryKey: ['member-select'], queryFn: () => mobileAction<MemberOption[]>('getAllMembersForSelect', {}, token), enabled: Boolean(token) });
  const blocksQuery = useQuery({
    queryKey: ['assignment-blocks', selectedAssignment?.id],
    queryFn: () => mobileAction<AssignmentBlocksData>('getAssignmentBlocks', { assignmentId: selectedAssignment?.id }, token),
    enabled: Boolean(token && selectedAssignment?.id && (assignmentAction === 'REGISTER' || assignmentAction === 'STATUS')),
  });

  const createMutation = useMutation({
    mutationFn: ({ action, params }: { action: string; params: Record<string, unknown> }) => mobileAction(action, params, token),
    onSuccess: async () => {
      await refreshOperationalData();
      closeCreateModal();
    },
    onError: (value: Error) => setCreateError(value.message),
  });
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAssignment || !blocksQuery.data || !selectedBlockIds.length) throw new Error('Seleccioná al menos una manzana.');
      const date = new Date(`${workDate}T12:00:00`);
      if (Number.isNaN(date.getTime())) throw new Error('Indicá una fecha válida en formato YYYY-MM-DD.');
      await Promise.all(selectedBlockIds.map((blockId) => mobileAction('createDailyRecord', {
        assignmentId: selectedAssignment.id,
        driverId: blocksQuery.data?.assignment.driver.id,
        blockId,
        date: date.toISOString(),
        notes: workNotes.trim() || undefined,
      }, token)));
    },
    onSuccess: async () => {
      await refreshOperationalData();
      Alert.alert('Manzanas registradas', 'El progreso de la asignación se actualizó correctamente.');
      closeAssignmentAction();
    },
    onError: (value: Error) => setActionError(value.message),
  });
  const returnMutation = useMutation({
    mutationFn: () => {
      if (!selectedAssignment) throw new Error('No se encontró la asignación.');
      const date = new Date(`${returnDate}T12:00:00`);
      if (Number.isNaN(date.getTime())) throw new Error('Indicá una fecha válida en formato YYYY-MM-DD.');
      return mobileAction('returnUnifiedAssignment', { assignmentId: selectedAssignment.id, type: selectedAssignment.type, returnDate: date.toISOString() }, token);
    },
    onSuccess: async () => {
      await refreshOperationalData();
      Alert.alert('Territorio devuelto', 'La asignación fue enviada al historial y el territorio volvió a estar disponible.');
      closeAssignmentAction();
    },
    onError: (value: Error) => setActionError(value.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (assignment: UnifiedAssignment) => mobileAction('deleteUnifiedAssignment', { assignmentId: assignment.id, type: assignment.type }, token),
    onSuccess: async () => {
      await refreshOperationalData();
      Alert.alert('Asignación eliminada', 'El territorio volvió a quedar disponible.');
    },
    onError: (value: Error) => Alert.alert('No se pudo eliminar', value.message),
  });

  const term = deferredSearch.toLowerCase().trim();
  const assignments = (query.data || []).filter((assignment) => {
    const matchesFilter = filter === 'TODAS' || assignment.type === filter;
    const matchesSearch = !term || `${assignment.territoryNumber} ${assignment.assigneeName} ${assignment.groupName}`.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });
  const pageCount = Math.max(1, Math.ceil(assignments.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleAssignments = assignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedTerritory = (territoriesQuery.data || []).find((territory) => territory.id === territoryId);
  const blocks = [...(blocksQuery.data?.blocks || [])].sort((a, b) => a.letter.localeCompare(b.letter));
  const completedBlocks = blocks.filter((block) => block.isCompleted).length;
  const blockProgress = blocks.length ? Math.round((completedBlocks / blocks.length) * 100) : 0;

  async function refreshOperationalData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['assignments'] }),
      queryClient.invalidateQueries({ queryKey: ['assignment-blocks'] }),
      queryClient.invalidateQueries({ queryKey: ['territories'] }),
      queryClient.invalidateQueries({ queryKey: ['general-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  }

  function openCreate() {
    setMode('CONDUCTOR');
    setTerritoryId(undefined);
    setDriverId(undefined);
    setMemberId(undefined);
    setBlockLetters([]);
    setNotes('');
    setCreateError('');
    setCreateModal(true);
  }
  function closeCreateModal() { setCreateModal(false); setCreateError(''); }
  function chooseTerritory(value: string) {
    const territory = (territoriesQuery.data || []).find((item) => item.id === value);
    setTerritoryId(value);
    setBlockLetters(territory?.blocks.map((block) => block.letter) || []);
  }
  function save() {
    if (!territoryId) { setCreateError('Elegí un territorio.'); return; }
    if (mode === 'CONDUCTOR' && (!driverId || !blockLetters.length)) { setCreateError('Elegí un conductor y al menos una manzana.'); return; }
    if (mode === 'PERSONAL' && !memberId) { setCreateError('Elegí el integrante que trabajará el territorio.'); return; }
    const action = mode === 'CONDUCTOR' ? 'createAssignment' : 'createPersonalAssignment';
    const params = mode === 'CONDUCTOR' ? { territoryId, driverId, blockLetters } : { territoryId, memberId, notes: notes.trim() || undefined };
    createMutation.mutate({ action, params });
  }
  function toggleBlock(letter: string) { setBlockLetters((current) => current.includes(letter) ? current.filter((item) => item !== letter) : [...current, letter]); }
  function openAssignmentAction(assignment: UnifiedAssignment, action: Exclude<AssignmentAction, null>) {
    setSelectedAssignment(assignment);
    setAssignmentAction(action);
    setSelectedBlockIds([]);
    setWorkDate(today());
    setWorkNotes('');
    setReturnDate(today());
    setActionError('');
  }
  function closeAssignmentAction() {
    if (registerMutation.isPending || returnMutation.isPending) return;
    setSelectedAssignment(null);
    setAssignmentAction(null);
    setActionError('');
  }
  function toggleWorkedBlock(block: AssignmentBlockStatus) {
    if (block.isCompleted) return;
    setSelectedBlockIds((current) => current.includes(block.id) ? current.filter((id) => id !== block.id) : [...current, block.id]);
  }
  function submitRegister() {
    if (!selectedBlockIds.length) { setActionError('Seleccioná una o más manzanas pendientes.'); return; }
    setActionError('');
    registerMutation.mutate();
  }
  function submitReturn() {
    setActionError('');
    returnMutation.mutate();
  }
  function confirmDelete(assignment: UnifiedAssignment) {
    Alert.alert(
      'Eliminar asignación',
      `Se eliminará la asignación del territorio ${assignment.territoryNumber} y sus trabajos registrados. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(assignment) },
      ],
    );
  }

  const actionTitle = assignmentAction === 'REGISTER' ? 'Registrar manzanas' : assignmentAction === 'STATUS' ? 'Estado de manzanas' : 'Devolver territorio';
  const actionEyebrow = selectedAssignment ? `TERRITORIO ${selectedAssignment.territoryNumber}` : undefined;

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}>
        <AppHeader />
        <View style={styles.intro}><Text style={styles.eyebrow}>CONTROL OPERATIVO</Text><Text style={styles.title}>Asignaciones</Text><Text style={styles.subtitle}>Gestioná el trabajo actual y registrá el avance por manzanas.</Text></View>
        <ClearableSearch value={search} onChangeText={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar territorio, persona o grupo" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(['TODAS', 'CONDUCTOR', 'PERSONAL'] as AssignmentFilter[]).map((item) => <Pressable key={item} onPress={() => { setFilter(item); setPage(1); }} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === 'TODAS' ? 'Todas' : item === 'CONDUCTOR' ? 'Congregacionales' : 'Personales'}</Text></Pressable>)}</ScrollView>
        <View style={styles.actionRow}><SectionTitle eyebrow="EN CURSO" title={`${assignments.length} asignaciones`} /><Pressable onPress={openCreate} style={styles.addButton}><Plus size={16} color={Colors.ink} /><Text style={styles.addText}>Asignar</Text></Pressable></View>
        {query.isLoading ? <ScreenLoader label="Cargando asignaciones..." /> : assignments.length === 0 ? <GlassCard style={styles.empty}><ClipboardList size={26} color={Colors.textDim} /><Text style={styles.emptyTitle}>No hay resultados</Text><Text style={styles.emptyCopy}>Podés crear una asignación o probar otro filtro.</Text></GlassCard> : <><View style={styles.list}>{visibleAssignments.map((assignment, index) => <Animated.View key={`${assignment.type}-${assignment.id}`} entering={FadeInUp.duration(420).delay(Math.min(index, 5) * 45)}><AssignmentCard assignment={assignment} onRegister={() => openAssignmentAction(assignment, 'REGISTER')} onStatus={() => openAssignmentAction(assignment, 'STATUS')} onEdit={() => setEditingAssignment(assignment)} onDelete={() => confirmDelete(assignment)} onReturn={() => openAssignmentAction(assignment, 'RETURN')} /></Animated.View>)}</View><MobilePagination page={currentPage} pageSize={PAGE_SIZE} totalItems={assignments.length} onChange={setPage} /></>}
      </ScrollView>

      <ModalSheet visible={createModal} onClose={closeCreateModal} eyebrow="NUEVA ASIGNACIÓN" title="Asignar territorio">
        <ChoiceRow label="Tipo de asignación" value={mode} options={[{ label: 'Congregacional', value: 'CONDUCTOR' }, { label: 'Personal', value: 'PERSONAL' }]} onChange={(value) => { setMode(value); setCreateError(''); }} />
        <SelectChips label="Territorio" value={territoryId} options={(territoriesQuery.data || []).map((territory) => ({ value: territory.id, label: `Territorio ${territory.number}`, detail: `${territory.blocks.length} manzanas` }))} onChange={chooseTerritory} emptyLabel="Primero cargá un territorio" />
        {mode === 'CONDUCTOR' ? <><SelectChips label="Conductor" value={driverId} options={(driversQuery.data || []).map((driver) => ({ value: driver.id, label: driver.name, detail: driver.group.name }))} onChange={setDriverId} emptyLabel="Primero cargá un conductor" />{selectedTerritory && <BlockPicker letters={selectedTerritory.blocks.map((block) => block.letter)} selected={blockLetters} onToggle={toggleBlock} />}</> : <><SelectChips label="Integrante" value={memberId} options={(membersQuery.data || []).map((member) => ({ value: member.id, label: member.name, detail: member.group.name }))} onChange={setMemberId} emptyLabel="Primero cargá un integrante" /><FormField label="Notas (opcional)" value={notes} onChangeText={setNotes} placeholder="Información adicional" multiline /></>}
        <FormError message={createError} /><SubmitButton label="Crear asignación" loading={createMutation.isPending} onPress={save} />
      </ModalSheet>

      <ModalSheet visible={Boolean(selectedAssignment && assignmentAction)} onClose={closeAssignmentAction} eyebrow={actionEyebrow} title={actionTitle}>
        {selectedAssignment && <AssignmentIdentity assignment={selectedAssignment} />}
        {(assignmentAction === 'REGISTER' || assignmentAction === 'STATUS') && (blocksQuery.isLoading ? <GlassCard style={styles.loading}><Text style={styles.loadingText}>Cargando manzanas...</Text></GlassCard> : <>
          <View style={styles.sheetProgress}><View><Text style={styles.progressCaption}>PROGRESO</Text><Text style={styles.sheetProgressNumber}>{blockProgress}%</Text></View><Text style={styles.sheetProgressText}>{completedBlocks} de {blocks.length} completas</Text></View>
          <ProgressBar value={blockProgress} />
          {assignmentAction === 'REGISTER' ? <><Text style={styles.sheetHint}>Seleccioná las manzanas trabajadas. Las completas quedan bloqueadas.</Text><BlockGrid blocks={blocks} selectedIds={selectedBlockIds} selectable onPress={toggleWorkedBlock} /><FormField label="Fecha del trabajo" value={workDate} onChangeText={setWorkDate} placeholder="YYYY-MM-DD" autoCapitalize="none" /><FormField label="Notas (opcional)" value={workNotes} onChangeText={setWorkNotes} placeholder="Observaciones del trabajo" multiline /><FormError message={actionError} /><SubmitButton label={selectedBlockIds.length ? `Registrar (${selectedBlockIds.length})` : 'Seleccioná manzanas'} loading={registerMutation.isPending} disabled={!selectedBlockIds.length} onPress={submitRegister} /></> : <><Text style={styles.sheetHint}>Estado actual de las manzanas de esta asignación.</Text><BlockGrid blocks={blocks} selectedIds={[]} selectable={false} onPress={() => undefined} /></>}
        </>)}
        {assignmentAction === 'RETURN' && <><View style={styles.returnNotice}><ArrowLeftRight size={20} color={Colors.warning} /><View style={styles.returnCopy}><Text style={styles.returnTitle}>Devolver al historial</Text><Text style={styles.returnText}>Podés devolver el territorio aunque queden manzanas pendientes.</Text></View></View><FormField label="Fecha de devolución" value={returnDate} onChangeText={setReturnDate} placeholder="YYYY-MM-DD" autoCapitalize="none" /><FormError message={actionError} /><Pressable onPress={submitReturn} disabled={returnMutation.isPending} style={[styles.returnSubmit, returnMutation.isPending && styles.submitDisabled]}><ArrowLeftRight size={18} color={Colors.ink} /><Text style={styles.returnSubmitText}>{returnMutation.isPending ? 'Devolviendo...' : 'Confirmar devolución'}</Text></Pressable></>}
      </ModalSheet>
      <EditAssignmentSheet
        assignment={editingAssignment}
        token={token}
        territories={territoriesQuery.data || []}
        drivers={driversQuery.data || []}
        members={membersQuery.data || []}
        onClose={() => setEditingAssignment(null)}
        onSaved={async () => {
          await refreshOperationalData();
          Alert.alert('Asignación actualizada', 'Los cambios se guardaron correctamente.');
        }}
      />
    </ScreenBackground>
  );
}

function AssignmentCard({ assignment, onRegister, onStatus, onEdit, onDelete, onReturn }: { assignment: UnifiedAssignment; onRegister: () => void; onStatus: () => void; onEdit: () => void; onDelete: () => void; onReturn: () => void }) {
  const personal = assignment.type === 'PERSONAL';
  const progress = assignment.blocksTotal ? Math.round(((assignment.blocksCompleted || 0) / assignment.blocksTotal) * 100) : 0;
  return <GlassCard style={styles.card}><View style={styles.cardTop}><View style={[styles.iconBox, personal ? styles.personalIcon : styles.groupIcon]}>{personal ? <UserRound size={18} color={Colors.mint} /> : <UsersRound size={18} color={Colors.blueBright} />}</View><View style={styles.cardMain}><Text numberOfLines={1} style={styles.cardTitle}>Territorio {assignment.territoryNumber}</Text><Text numberOfLines={1} style={styles.cardMeta}>{assignment.assigneeName} · {assignment.groupName}</Text></View><View style={[styles.typePill, personal ? styles.personalPill : styles.groupPill]}><Text style={styles.typeText}>{personal ? 'PERSONAL' : 'CONGREGACIÓN'}</Text></View></View><View style={styles.divider} /><View style={styles.cardBottom}><View><Text style={styles.smallLabel}>ASIGNADO</Text><Text style={styles.date}>{new Date(assignment.assignedDate).toLocaleDateString('es-AR')}</Text></View>{!personal && <View style={styles.progressWrap}><Text style={styles.progressLabel}>{assignment.blocksCompleted} / {assignment.blocksTotal} manzanas</Text><ProgressBar value={progress} /></View>}</View>{!personal && <View style={styles.cardActions}><ActionButton label="Registrar" icon={Grid3X3} tone="blue" onPress={onRegister} /><ActionButton label="Estado" icon={Eye} tone="mint" onPress={onStatus} /></View>}<View style={styles.cardManagement}><ActionButton label="Editar" icon={Pencil} tone="neutral" onPress={onEdit} /><ActionButton label="Eliminar" icon={Trash2} tone="danger" onPress={onDelete} /></View><View style={styles.returnAction}><ActionButton label="Devolver territorio" icon={ArrowLeftRight} tone="warning" onPress={onReturn} /></View></GlassCard>;
}

function ActionButton({ label, icon: Icon, tone, onPress }: { label: string; icon: typeof Grid3X3; tone: 'blue' | 'mint' | 'warning' | 'neutral' | 'danger'; onPress: () => void }) {
  const color = tone === 'blue' ? Colors.blueBright : tone === 'warning' ? Colors.warning : tone === 'danger' ? Colors.danger : tone === 'neutral' ? Colors.textMuted : Colors.mint;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.cardAction, tone === 'blue' && styles.cardActionBlue, tone === 'mint' && styles.cardActionMint, tone === 'warning' && styles.cardActionWarning, tone === 'neutral' && styles.cardActionNeutral, tone === 'danger' && styles.cardActionDanger, pressed && styles.pressed]}><Icon size={15} color={color} /><Text style={[styles.cardActionText, { color }]}>{label}</Text></Pressable>;
}

function AssignmentIdentity({ assignment }: { assignment: UnifiedAssignment }) {
  return <View style={styles.identity}><View style={styles.identityBadge}><Text style={styles.identityBadgeText}>{assignment.territoryNumber}</Text></View><View style={styles.identityCopy}><Text style={styles.identityTitle}>Territorio {assignment.territoryNumber}</Text><Text style={styles.identitySubtitle}>{assignment.assigneeName} · {assignment.groupName}</Text></View></View>;
}

function BlockPicker({ letters, selected, onToggle }: { letters: string[]; selected: string[]; onToggle: (letter: string) => void }) {
  return <View style={styles.blockField}><View style={styles.blockHeader}><Text style={styles.fieldLabel}>Manzanas a trabajar</Text><Text style={styles.blockCount}>{selected.length}/{letters.length}</Text></View><View style={styles.blockChoices}>{letters.map((letter) => <Pressable key={letter} onPress={() => onToggle(letter)} style={[styles.blockChoice, selected.includes(letter) && styles.blockChoiceActive]}><Text style={[styles.blockText, selected.includes(letter) && styles.blockTextActive]}>{letter}</Text></Pressable>)}</View></View>;
}

function BlockGrid({ blocks, selectedIds, selectable, onPress }: { blocks: AssignmentBlockStatus[]; selectedIds: string[]; selectable: boolean; onPress: (block: AssignmentBlockStatus) => void }) {
  if (!blocks.length) return <GlassCard style={styles.loading}><Text style={styles.loadingText}>Esta asignación no tiene manzanas cargadas.</Text></GlassCard>;
  return <View style={styles.blockGrid}>{blocks.map((block) => { const selected = selectedIds.includes(block.id); return <Pressable key={block.id} disabled={!selectable || block.isCompleted} onPress={() => onPress(block)} style={[styles.blockCell, block.isCompleted && styles.blockCompleted, selected && styles.blockSelected]}><View style={[styles.blockMark, block.isCompleted && styles.blockMarkCompleted, selected && styles.blockMarkSelected]}>{block.isCompleted ? <CheckCircle2 size={17} color={Colors.ink} /> : selected ? <Grid3X3 size={16} color={Colors.ink} /> : <Circle size={17} color={Colors.textDim} />}</View><Text style={[styles.blockLetter, (block.isCompleted || selected) && styles.blockLetterDark]}>{block.letter}</Text><Text style={[styles.blockState, (block.isCompleted || selected) && styles.blockStateDark]}>{block.isCompleted ? 'COMPLETA' : selected ? 'SELECCIONADA' : 'PENDIENTE'}</Text>{block.lastWorkedDate && <Text style={[styles.blockDate, block.isCompleted && styles.blockDateDark]}>{new Date(block.lastWorkedDate).toLocaleDateString('es-AR')}</Text>}</Pressable>; })}</View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four },
  intro: { paddingHorizontal: Spacing.four, gap: 5 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  searchShell: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: Spacing.four, paddingHorizontal: 15, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(6,18,37,0.52)' },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.sans, fontSize: 13 },
  filters: { gap: 8, paddingHorizontal: Spacing.four },
  filter: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.05)' },
  filterActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  filterText: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 11 },
  filterTextActive: { color: Colors.ink },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint },
  addText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 },
  list: { gap: Spacing.three, paddingHorizontal: Spacing.four },
  card: { padding: Spacing.three, gap: Spacing.three },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  personalIcon: { backgroundColor: 'rgba(94,234,212,0.13)' },
  groupIcon: { backgroundColor: 'rgba(51,133,246,0.14)' },
  cardMain: { flex: 1, gap: 3 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  cardMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  typePill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.pill },
  personalPill: { backgroundColor: 'rgba(94,234,212,0.12)' },
  groupPill: { backgroundColor: 'rgba(51,133,246,0.12)' },
  typeText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 0.8 },
  divider: { height: 1, backgroundColor: Colors.border },
  cardBottom: { minHeight: 58, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.three, paddingTop: 2, marginBottom: 8 },
  smallLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1.2 },
  date: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, marginTop: 4 },
  progressWrap: { flex: 1, gap: 7, paddingTop: 1 },
  progressLabel: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 10, textAlign: 'right' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  cardManagement: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  returnAction: { width: '100%', marginTop: 4 },
  cardAction: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: Radius.small, borderWidth: 1 },
  cardActionBlue: { borderColor: 'rgba(84,161,255,0.32)', backgroundColor: 'rgba(84,161,255,0.1)' },
  cardActionMint: { borderColor: 'rgba(94,234,212,0.3)', backgroundColor: 'rgba(94,234,212,0.09)' },
  cardActionWarning: { borderColor: 'rgba(245,201,106,0.32)', backgroundColor: 'rgba(245,201,106,0.09)' },
  cardActionNeutral: { borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.07)' },
  cardActionDanger: { borderColor: 'rgba(251,113,133,0.34)', backgroundColor: 'rgba(251,113,133,0.08)' },
  cardActionText: { fontFamily: Fonts.rounded, fontSize: 10 },
  blockField: { gap: 8 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  blockCount: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 11 },
  blockChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  blockChoice: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.07)' },
  blockChoiceActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  blockText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 12 },
  blockTextActive: { color: Colors.ink },
  empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(6,18,37,0.45)' },
  identityBadge: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(84,161,255,0.14)' },
  identityBadgeText: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 17 },
  identityCopy: { flex: 1, gap: 3 },
  identityTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 14 },
  identitySubtitle: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  sheetProgress: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  progressCaption: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1.2 },
  sheetProgressNumber: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 30, marginTop: 3 },
  sheetProgressText: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12 },
  sheetHint: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  blockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  blockCell: { width: '31.8%', minHeight: 95, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 7, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  blockCompleted: { borderColor: 'rgba(94,234,212,0.42)', backgroundColor: 'rgba(94,234,212,0.14)' },
  blockSelected: { borderColor: Colors.blueBright, backgroundColor: Colors.blueBright },
  blockMark: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(168,183,204,0.1)' },
  blockMarkCompleted: { backgroundColor: Colors.mint },
  blockMarkSelected: { backgroundColor: 'rgba(6,18,37,0.16)' },
  blockLetter: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 18 },
  blockLetterDark: { color: Colors.ink },
  blockState: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 7, letterSpacing: 0.4 },
  blockStateDark: { color: Colors.ink },
  blockDate: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 8 },
  blockDateDark: { color: Colors.ink },
  returnNotice: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: Radius.medium, borderWidth: 1, borderColor: 'rgba(245,201,106,0.3)', backgroundColor: 'rgba(245,201,106,0.09)' },
  returnCopy: { flex: 1, gap: 3 },
  returnTitle: { color: Colors.warning, fontFamily: Fonts.rounded, fontSize: 13 },
  returnText: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  returnSubmit: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: Radius.medium, backgroundColor: Colors.warning },
  returnSubmitText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 14 },
  submitDisabled: { opacity: 0.55 },
  loading: { alignItems: 'center', padding: Spacing.four },
  loadingText: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
