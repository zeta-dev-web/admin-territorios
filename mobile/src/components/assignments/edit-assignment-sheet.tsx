import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, CheckCircle2, Circle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Driver, MemberOption, mobileAction, UnifiedAssignment } from '@/lib/api';

export interface EditableTerritory {
  id: string;
  number: number;
  description: string | null;
  blocks: Array<{ letter: string }>;
}

interface AssignmentDetail {
  blocks: Array<{ letter: string }>;
  dailyRecords: Array<{
    date: string;
    notes?: string | null;
    block: { letter: string };
  }>;
}

interface BlockWorkState {
  letter: string;
  completed: boolean;
  date: string;
  notes?: string;
}

type DateTarget = 'ASSIGNED' | string | null;

interface Props {
  assignment: UnifiedAssignment | null;
  token?: string | null;
  territories: EditableTerritory[];
  drivers: Driver[];
  members: MemberOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

type ActiveProps = Omit<Props, 'assignment'> & { assignment: UnifiedAssignment };

const today = () => new Date().toISOString().slice(0, 10);
const inputDate = (value: string) => new Date(value).toISOString().slice(0, 10);

export function EditAssignmentSheet({ assignment, ...props }: Props) {
  if (!assignment) return null;
  return <EditAssignmentForm key={`${assignment.type}-${assignment.id}`} assignment={assignment} {...props} />;
}

function EditAssignmentForm({ assignment, token, territories, drivers, members, onClose, onSaved }: ActiveProps) {
  const congregational = assignment.type === 'CONDUCTOR';
  const [territoryId, setTerritoryId] = useState(assignment.territoryId);
  const [assigneeId, setAssigneeId] = useState(assignment.assigneeId);
  const [assignedDate, setAssignedDate] = useState(inputDate(assignment.assignedDate));
  const [notes, setNotes] = useState(assignment.notes || '');
  const [blockWorkOverride, setBlockWorkOverride] = useState<BlockWorkState[] | null>(null);
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const [error, setError] = useState('');

  const detailQuery = useQuery({
    queryKey: ['assignment-edit-detail', assignment?.id],
    queryFn: () => mobileAction<AssignmentDetail>('getAssignmentById', { assignmentId: assignment?.id }, token),
    enabled: Boolean(token && assignment?.id && congregational),
  });

  const loadedBlockWork = useMemo<BlockWorkState[]>(() => {
    if (!congregational || !detailQuery.data) return [];
    const latestByLetter = new Map<string, { date: string; notes?: string | null }>();
    detailQuery.data.dailyRecords.forEach((record) => {
      if (!latestByLetter.has(record.block.letter)) {
        latestByLetter.set(record.block.letter, { date: record.date, notes: record.notes });
      }
    });
    return [...detailQuery.data.blocks]
      .sort((a, b) => a.letter.localeCompare(b.letter))
      .map((block) => {
        const work = latestByLetter.get(block.letter);
        return {
          letter: block.letter,
          completed: Boolean(work),
          date: work ? inputDate(work.date) : today(),
          notes: work?.notes || undefined,
        };
      });
  }, [congregational, detailQuery.data]);
  const blockWork = blockWorkOverride ?? loadedBlockWork;

  const mutation = useMutation({
    mutationFn: () => {
      if (!assignment || !territoryId || !assigneeId) throw new Error('Completá territorio, responsable y fecha.');
      const data = congregational
        ? {
            territoryId,
            driverId: assigneeId,
            startDate: new Date(`${assignedDate}T12:00:00`).toISOString(),
            blockWork: blockWork
              .filter((block) => block.completed)
              .map((block) => ({
                letter: block.letter,
                date: new Date(`${block.date}T12:00:00`).toISOString(),
                notes: block.notes,
              })),
          }
        : {
            territoryId,
            memberId: assigneeId,
            assignedDate: new Date(`${assignedDate}T12:00:00`).toISOString(),
            notes: notes.trim() || undefined,
          };
      return mobileAction('updateUnifiedAssignment', { assignmentId: assignment.id, type: assignment.type, data }, token);
    },
    onSuccess: async () => {
      await onSaved();
      onClose();
    },
    onError: (value: Error) => setError(value.message),
  });

  const selectedTerritory = territories.find((territory) => territory.id === territoryId);
  const completedCount = blockWork.filter((block) => block.completed).length;
  const options = congregational
    ? drivers.map((driver) => ({ value: driver.id, label: driver.name, detail: driver.group.name }))
    : members.map((member) => ({ value: member.id, label: member.name, detail: member.group.name }));

  function chooseTerritory(value: string) {
    setTerritoryId(value);
    if (!congregational) return;
    const territory = territories.find((item) => item.id === value);
    const currentByLetter = new Map(blockWork.map((block) => [block.letter, block]));
    setBlockWorkOverride(
      (territory?.blocks || []).map((block) => currentByLetter.get(block.letter) || {
        letter: block.letter,
        completed: false,
        date: today(),
      }),
    );
  }

  function updateBlock(letter: string, patch: Partial<BlockWorkState>) {
    setBlockWorkOverride((current) => (current ?? loadedBlockWork).map((block) => block.letter === letter ? { ...block, ...patch } : block));
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'dismissed') {
      setDateTarget(null);
      return;
    }
    if (!date || !dateTarget) return;
    const value = date.toISOString().slice(0, 10);
    if (dateTarget === 'ASSIGNED') setAssignedDate(value);
    else updateBlock(dateTarget, { date: value });
    setDateTarget(null);
  }

  function selectedPickerDate() {
    if (dateTarget === 'ASSIGNED') return assignedDate;
    return blockWork.find((block) => block.letter === dateTarget)?.date || today();
  }

  function save() {
    if (!territoryId || !assigneeId || !assignedDate) {
      setError('Completá territorio, responsable y fecha de asignación.');
      return;
    }
    setError('');
    mutation.mutate();
  }

  return (
    <ModalSheet visible={Boolean(assignment)} onClose={() => !mutation.isPending && onClose()} eyebrow="EDITAR ASIGNACIÓN" title={`Territorio ${assignment?.territoryNumber || ''}`}>
      <Text style={styles.hint}>Corregí los datos de la asignación activa. Los cambios se reflejarán también en el seguimiento.</Text>
      <SelectChips label="Territorio" value={territoryId} options={territories.map((territory) => ({ value: territory.id, label: `Territorio ${territory.number}`, detail: territory.description || `${territory.blocks.length} manzanas` }))} onChange={chooseTerritory} />
      <SelectChips label={congregational ? 'Conductor' : 'Integrante'} value={assigneeId} options={options} onChange={setAssigneeId} />

      {dateTarget && <DateTimePicker value={new Date(`${selectedPickerDate()}T12:00:00`)} mode="date" display="calendar" maximumDate={new Date()} onChange={handleDateChange} />}
      {!dateTarget && <DateField label="Fecha de asignación" value={assignedDate} onPress={() => setDateTarget('ASSIGNED')} />}

      {!congregational && <FormField label="Notas (opcional)" value={notes} onChangeText={setNotes} placeholder="Información adicional" multiline />}

      {congregational && (
        <View style={styles.workSection}>
          <View style={styles.workHeader}>
            <View style={styles.workCopy}>
              <Text style={styles.sectionEyebrow}>TRABAJO REGISTRADO</Text>
              <Text style={styles.sectionTitle}>Corregir manzanas</Text>
            </View>
            <Text style={styles.counter}>{completedCount}/{blockWork.length}</Text>
          </View>
          <Text style={styles.hint}>Tocá una manzana para marcarla o quitarla. También podés corregir su fecha.</Text>
          {detailQuery.isLoading ? <Text style={styles.loading}>Cargando manzanas...</Text> : (
            <View style={styles.blockList}>
              {blockWork.map((block) => (
                <View key={block.letter} style={[styles.blockCard, block.completed && styles.blockCardCompleted]}>
                  <Pressable onPress={() => updateBlock(block.letter, { completed: !block.completed })} style={styles.blockToggle}>
                    <View style={[styles.blockBadge, block.completed && styles.blockBadgeCompleted]}>
                      <Text style={[styles.blockLetter, block.completed && styles.blockLetterCompleted]}>{block.letter.toUpperCase()}</Text>
                    </View>
                    <View style={styles.blockCopy}>
                      <Text style={styles.blockTitle}>Manzana {block.letter.toUpperCase()}</Text>
                      <Text style={styles.blockState}>{block.completed ? 'Trabajo registrado' : 'Pendiente'}</Text>
                    </View>
                    {block.completed ? <CheckCircle2 size={19} color={Colors.mint} /> : <Circle size={19} color={Colors.textDim} />}
                  </Pressable>
                  {block.completed && <DateField compact label="Fecha del trabajo" value={block.date} onPress={() => setDateTarget(block.letter)} />}
                </View>
              ))}
            </View>
          )}
          {selectedTerritory && blockWork.length > 0 && completedCount === blockWork.length && (
            <View style={styles.warning}><AlertTriangle size={17} color={Colors.warning} /><Text style={styles.warningText}>Al guardar, esta asignación pasará al historial como completada.</Text></View>
          )}
        </View>
      )}

      <FormError message={error || detailQuery.error?.message} />
      <SubmitButton label="Guardar cambios" loading={mutation.isPending} disabled={congregational && detailQuery.isLoading} onPress={save} />
    </ModalSheet>
  );
}

function DateField({ label, value, onPress, compact }: { label: string; value: string; onPress: () => void; compact?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.dateField, compact && styles.dateFieldCompact]}><View style={styles.dateCopy}><Text style={styles.dateLabel}>{label}</Text><Text style={styles.dateValue}>{value}</Text></View><CalendarDays size={compact ? 17 : 20} color={Colors.mint} /></Pressable>;
}

const styles = StyleSheet.create({
  hint: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  dateField: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(6,18,37,0.58)' },
  dateFieldCompact: { minHeight: 48, marginTop: 10, borderColor: 'rgba(94,234,212,0.24)' },
  dateCopy: { gap: 3 },
  dateLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1 },
  dateValue: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 13 },
  workSection: { gap: Spacing.three, marginTop: 2, padding: Spacing.three, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.large, backgroundColor: 'rgba(6,18,37,0.38)' },
  workHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workCopy: { gap: 3 },
  sectionEyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 1.3 },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 16 },
  counter: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 11, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill, backgroundColor: 'rgba(94,234,212,0.1)' },
  loading: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, paddingVertical: Spacing.four, textAlign: 'center' },
  blockList: { gap: 9 },
  blockCard: { padding: 11, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(168,183,204,0.04)' },
  blockCardCompleted: { borderColor: 'rgba(94,234,212,0.34)', backgroundColor: 'rgba(94,234,212,0.08)' },
  blockToggle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blockBadge: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(168,183,204,0.09)' },
  blockBadgeCompleted: { backgroundColor: Colors.mint },
  blockLetter: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 15 },
  blockLetterCompleted: { color: Colors.ink },
  blockCopy: { flex: 1, gap: 2 },
  blockTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 12 },
  blockState: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 11, borderWidth: 1, borderColor: 'rgba(245,201,106,0.28)', borderRadius: Radius.medium, backgroundColor: 'rgba(245,201,106,0.08)' },
  warningText: { flex: 1, color: Colors.warning, fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
});
