import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardClock, FileDown, Pencil, UserRound, UsersRound } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDeferredValue, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { ClearableSearch, FormError, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { MobilePagination } from '@/components/ui/mobile-pagination';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Driver, HistoryAssignment, MemberOption, mobileAction, TerritoryRange } from '@/lib/api';
import { saveAndSharePdf } from '@/lib/pdf';
import { useAuth } from '@/providers/auth-provider';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
type MonthTarget = 'FROM' | 'TO' | null;
type DateTarget = 'ASSIGNED' | 'RETURNED' | null;
const PAGE_SIZE = 8;

function toInputDate(value?: string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ''; }
function today() { return new Date().toISOString().slice(0, 10); }
function parseMonthKey(value: string) { const [year, month] = value.split('-').map(Number); return { year, month }; }
function formatMonthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function formatMonthLabel(key: string) { const { year, month } = parseMonthKey(key); return Number.isInteger(month) ? `${MONTH_NAMES[month - 1]} ${year}` : 'Elegir período'; }

export default function HistoryScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = formatMonthKey(now);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<HistoryAssignment | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>();
  const [assignedDate, setAssignedDate] = useState('');
  const [returnedDate, setReturnedDate] = useState('');
  const [error, setError] = useState('');
  const [pdfModal, setPdfModal] = useState(false);
  const [fromKey, setFromKey] = useState(currentMonth);
  const [toKey, setToKey] = useState(currentMonth);
  const [selectedRanges, setSelectedRanges] = useState<string[]>([]);
  const [includeActive, setIncludeActive] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [monthTarget, setMonthTarget] = useState<MonthTarget>(null);
  const [dateTarget, setDateTarget] = useState<DateTarget>(null);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const deferredSearch = useDeferredValue(search);
  const historyQuery = useQuery({ queryKey: ['history'], queryFn: () => mobileAction<HistoryAssignment[]>('getUnifiedHistory', { page: 1, pageSize: 100 }, token), enabled: Boolean(token) });
  const rangesQuery = useQuery({ queryKey: ['territory-ranges'], queryFn: () => mobileAction<TerritoryRange[]>('getAvailableTerritoryRanges', {}, token), enabled: Boolean(token) });
  const driversQuery = useQuery({ queryKey: ['driver-select'], queryFn: () => mobileAction<Driver[]>('getAllDriversForSelect', {}, token), enabled: Boolean(token) });
  const membersQuery = useQuery({ queryKey: ['member-select'], queryFn: () => mobileAction<MemberOption[]>('getAllMembersForSelect', {}, token), enabled: Boolean(token) });
  const mutation = useMutation({
    mutationFn: ({ action, params }: { action: string; params: Record<string, unknown> }) => mobileAction(action, params, token),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['history'] }); await queryClient.invalidateQueries({ queryKey: ['territories'] }); closeModal(); },
    onError: (value: Error) => setError(value.message),
  });
  const term = deferredSearch.toLowerCase().trim();
  const histories = (historyQuery.data || []).filter((item) => !term || `${item.territoryNumber} ${item.assigneeName} ${item.groupName}`.toLowerCase().includes(term));
  const pages = Math.max(1, Math.ceil(histories.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visibleHistories = histories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const options = editing?.type === 'CONDUCTOR' ? (driversQuery.data || []).map((driver) => ({ value: driver.id, label: driver.name, detail: driver.group.name })) : (membersQuery.data || []).map((member) => ({ value: member.id, label: member.name, detail: member.group.name }));

  function openEdit(item: HistoryAssignment) { setEditing(item); setAssigneeId(item.assigneeId); setAssignedDate(toInputDate(item.assignedDate)); setReturnedDate(toInputDate(item.endDate)); setError(''); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); setError(''); }
  function save() {
    if (!editing || !assigneeId || !assignedDate || !returnedDate) { setError('Completá la persona y ambas fechas.'); return; }
    const start = new Date(`${assignedDate}T12:00:00`);
    const end = new Date(`${returnedDate}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) { setError('Revisá las fechas ingresadas.'); return; }
    const params = editing.type === 'CONDUCTOR' ? { assignmentId: editing.id, data: { driverId: assigneeId, startDate: start.toISOString(), endDate: end.toISOString() } } : { assignmentId: editing.id, data: { memberId: assigneeId, assignedDate: start.toISOString(), returnedDate: end.toISOString() } };
    mutation.mutate({ action: editing.type === 'CONDUCTOR' ? 'updateAssignment' : 'updatePersonalAssignment', params });
  }
  function openPdfModal() { setFromKey(currentMonth); setToKey(currentMonth); setSelectedRanges([]); setIncludeActive(false); setPdfError(''); setMonthTarget(null); setPdfModal(true); }
  function closePdfModal() { if (!pdfLoading) setPdfModal(false); }
  function toggleRange(label: string) { setSelectedRanges((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]); }
  function openMonthPicker(target: Exclude<MonthTarget, null>) { const key = target === 'FROM' ? fromKey : toKey; setPickerYear(parseMonthKey(key).year || now.getFullYear()); setMonthTarget(target); }
  function openDatePicker(target: Exclude<DateTarget, null>) { setDateTarget(target); }
  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'dismissed') { setDateTarget(null); return; }
    if (!date || !dateTarget) return;
    const value = date.toISOString().slice(0, 10);
    if (dateTarget === 'ASSIGNED') setAssignedDate(value); else setReturnedDate(value);
    setDateTarget(null);
  }
  function chooseMonth(month: number) { const key = `${pickerYear}-${String(month).padStart(2, '0')}`; if (monthTarget === 'FROM') setFromKey(key); if (monthTarget === 'TO') setToKey(key); setMonthTarget(null); }
  async function generatePdfs() {
    const from = parseMonthKey(fromKey);
    const to = parseMonthKey(toKey);
    if (!Number.isInteger(from.year) || !Number.isInteger(from.month) || !Number.isInteger(to.year) || !Number.isInteger(to.month) || from.month < 1 || from.month > 12 || to.month < 1 || to.month > 12) { setPdfError('Elegí un mes y año válido para el período.'); return; }
    if (fromKey > toKey) { setPdfError('El período Desde no puede ser posterior a Hasta.'); return; }
    if (!selectedRanges.length) { setPdfError('Seleccioná al menos un rango de territorios.'); return; }
    setPdfLoading(true);
    setPdfError('');
    try {
      for (const label of selectedRanges) {
        const range = (rangesQuery.data || []).find((item) => item.label === label);
        if (!range) continue;
        const pdf = await mobileAction<string>('exportTerritoryHistoryPdf', { startNumber: range.start, endNumber: range.end, fromMonth: from.month, fromYear: from.year, toMonth: to.month, toYear: to.year, includeActive }, token);
        const period = fromKey === toKey ? `${MONTH_NAMES[from.month - 1]}-${from.year}` : `${MONTH_NAMES[from.month - 1]}-${from.year}_${MONTH_NAMES[to.month - 1]}-${to.year}`;
        await saveAndSharePdf(pdf, `S-13-S_Territorios_${label}_${period}.pdf`);
      }
      setPdfModal(false);
      Alert.alert('PDF generado', `${selectedRanges.length} formulario(s) S-13-S listo(s) para descargar o compartir.`);
    } catch (value) {
      setPdfError(value instanceof Error ? value.message : 'No se pudo generar el PDF.');
    } finally {
      setPdfLoading(false);
    }
  }

  return <ScreenBackground><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={historyQuery.isRefetching} onRefresh={() => historyQuery.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}><AppHeader /><View style={styles.intro}><Text style={styles.eyebrow}>CONTROL ADMINISTRATIVO</Text><Text style={styles.title}>Historial</Text><Text style={styles.subtitle}>Consultá los territorios devueltos y corregí fechas o responsables cuando sea necesario.</Text></View><ClearableSearch value={search} onChangeText={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar territorio, conductor o grupo" /><View style={styles.actionRow}><SectionTitle eyebrow="REGISTRO" title={`${histories.length} devoluciones`} /><Pressable onPress={openPdfModal} style={styles.pdfButton}><FileDown size={15} color={Colors.ink} /><Text style={styles.pdfButtonText}>PDF S-13-S</Text></Pressable></View>{historyQuery.isLoading ? <ScreenLoader label="Cargando historial..." /> : histories.length ? <><View style={styles.list}>{visibleHistories.map((item, index) => <Animated.View key={`${item.type}-${item.id}`} entering={FadeInUp.duration(420).delay(Math.min(index, 6) * 50)}><HistoryCard item={item} onEdit={() => openEdit(item)} /></Animated.View>)}</View><MobilePagination page={currentPage} pageSize={PAGE_SIZE} totalItems={histories.length} onChange={setPage} /></> : <GlassCard style={styles.empty}><ClipboardClock size={28} color={Colors.textDim} /><Text style={styles.emptyTitle}>No hay coincidencias</Text><Text style={styles.emptyCopy}>{search ? 'Probá con otro término de búsqueda.' : 'Las asignaciones devueltas aparecerán en esta vista.'}</Text></GlassCard>}</ScrollView><ModalSheet visible={modal} onClose={closeModal} eyebrow="EDITAR HISTORIAL" title="Corregir devolución"><SelectChips label={editing?.type === 'CONDUCTOR' ? 'Conductor' : 'Integrante'} value={assigneeId} options={options} onChange={setAssigneeId} />{dateTarget && <DateTimePicker value={new Date(`${(dateTarget === 'ASSIGNED' ? assignedDate : returnedDate) || today()}T12:00:00`)} mode="date" display="calendar" onChange={handleDateChange} />}{!dateTarget && <><DateField label="Fecha de asignación" value={assignedDate} onPress={() => openDatePicker('ASSIGNED')} /><DateField label="Fecha de devolución" value={returnedDate} onPress={() => openDatePicker('RETURNED')} /></>}<Text style={styles.formHint}>Los cambios se aplican al registro histórico ya devuelto.</Text><FormError message={error} /><SubmitButton label="Guardar corrección" loading={mutation.isPending} onPress={save} /></ModalSheet><ModalSheet visible={pdfModal} onClose={closePdfModal} eyebrow="FORMULARIO OFICIAL" title="Exportar a PDF S-13-S"><Text style={styles.formLabel}>Período del formulario</Text><View style={styles.monthFields}><MonthField label="Desde" value={formatMonthLabel(fromKey)} active={monthTarget === 'FROM'} onPress={() => openMonthPicker('FROM')} /><MonthField label="Hasta" value={formatMonthLabel(toKey)} active={monthTarget === 'TO'} onPress={() => openMonthPicker('TO')} /></View>{monthTarget && <MonthYearPicker year={pickerYear} selectedMonth={parseMonthKey(monthTarget === 'FROM' ? fromKey : toKey).month} onPreviousYear={() => setPickerYear((year) => year - 1)} onNextYear={() => setPickerYear((year) => year + 1)} onChooseMonth={chooseMonth} />}<View style={styles.rangeHeader}><Text style={styles.formLabel}>Rangos de territorios</Text><Pressable onPress={() => setSelectedRanges(selectedRanges.length === (rangesQuery.data || []).length ? [] : (rangesQuery.data || []).map((range) => range.label))}><Text style={styles.selectAll}>{selectedRanges.length === (rangesQuery.data || []).length ? 'Quitar todos' : 'Seleccionar todos'}</Text></Pressable></View><View style={styles.rangeList}>{(rangesQuery.data || []).map((range) => <Pressable key={range.label} onPress={() => toggleRange(range.label)} style={[styles.rangeRow, selectedRanges.includes(range.label) && styles.rangeRowActive]}><View><Text style={styles.rangeLabel}>Territorios {range.label}</Text><Text style={styles.rangeCount}>{range.count} {range.count === 1 ? 'territorio' : 'territorios'}</Text></View><View style={[styles.check, selectedRanges.includes(range.label) && styles.checkActive]}>{selectedRanges.includes(range.label) && <Text style={styles.checkText}>✓</Text>}</View></Pressable>)}</View><Pressable onPress={() => setIncludeActive((current) => !current)} style={[styles.activeOption, includeActive && styles.activeOptionSelected]}><View><Text style={styles.activeOptionTitle}>Incluir asignaciones activas</Text><Text style={styles.activeOptionCopy}>Agrega registros que todavía están en curso.</Text></View><View style={[styles.check, includeActive && styles.checkActive]}>{includeActive && <Text style={styles.checkText}>✓</Text>}</View></Pressable><FormError message={pdfError} /><SubmitButton label={pdfLoading ? 'Generando...' : selectedRanges.length === 1 ? 'Generar PDF' : `Generar ${selectedRanges.length} PDF`} loading={pdfLoading} disabled={rangesQuery.isLoading} onPress={generatePdfs} /></ModalSheet></ScreenBackground>;
}

function MonthField({ label, value, active, onPress }: { label: string; value: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.monthField, active && styles.monthFieldActive]}><CalendarDays size={18} color={active ? Colors.ink : Colors.mint} /><View style={styles.monthFieldCopy}><Text style={[styles.monthFieldLabel, active && styles.monthFieldLabelActive]}>{label}</Text><Text style={[styles.monthFieldValue, active && styles.monthFieldValueActive]}>{value}</Text></View></Pressable>;
}

function DateField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.dateField}><View><Text style={styles.dateFieldLabel}>{label}</Text><Text style={styles.dateFieldValue}>{value || 'Elegir fecha'}</Text></View><CalendarDays size={20} color={Colors.mint} /></Pressable>;
}

function MonthYearPicker({ year, selectedMonth, onPreviousYear, onNextYear, onChooseMonth }: { year: number; selectedMonth: number; onPreviousYear: () => void; onNextYear: () => void; onChooseMonth: (month: number) => void }) {
  return <View style={styles.monthPicker}><View style={styles.yearRow}><Pressable accessibilityLabel="Año anterior" onPress={onPreviousYear} style={styles.yearButton}><ChevronLeft size={18} color={Colors.textMuted} /></Pressable><Text style={styles.yearText}>{year}</Text><Pressable accessibilityLabel="Año siguiente" onPress={onNextYear} style={styles.yearButton}><ChevronRight size={18} color={Colors.textMuted} /></Pressable></View><View style={styles.monthGrid}>{MONTH_NAMES.map((month, index) => <Pressable key={month} onPress={() => onChooseMonth(index + 1)} style={[styles.monthChip, selectedMonth === index + 1 && styles.monthChipActive]}><Text style={[styles.monthChipText, selectedMonth === index + 1 && styles.monthChipTextActive]}>{month.slice(0, 3)}</Text></Pressable>)}</View></View>;
}

function HistoryCard({ item, onEdit }: { item: HistoryAssignment; onEdit: () => void }) {
  const personal = item.type === 'PERSONAL';
  return <GlassCard style={styles.card}><View style={styles.cardTop}><View style={[styles.iconBox, personal ? styles.personalIcon : styles.groupIcon]}>{personal ? <UserRound size={18} color={Colors.mint} /> : <UsersRound size={18} color={Colors.blueBright} />}</View><View style={styles.cardMain}><Text style={styles.cardTitle}>Territorio {item.territoryNumber}</Text><Text style={styles.cardMeta}>{item.assigneeName} · {item.groupName}</Text></View><Pressable onPress={onEdit} style={styles.iconButton}><Pencil size={15} color={Colors.textMuted} /></Pressable></View><View style={styles.dates}><View><Text style={styles.smallLabel}>ASIGNADO</Text><Text style={styles.date}>{new Date(item.assignedDate).toLocaleDateString('es-AR')}</Text></View><CalendarDays size={15} color={Colors.textDim} /><View><Text style={styles.smallLabel}>DEVUELTO</Text><Text style={styles.date}>{item.endDate ? new Date(item.endDate).toLocaleDateString('es-AR') : 'Sin fecha'}</Text></View></View></GlassCard>;
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
  pdfButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint },
  pdfButtonText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 10 },
  list: { gap: Spacing.three, paddingHorizontal: Spacing.four },
  card: { padding: Spacing.three, gap: 18 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  personalIcon: { backgroundColor: 'rgba(94,234,212,0.13)' },
  groupIcon: { backgroundColor: 'rgba(51,133,246,0.14)' },
  cardMain: { flex: 1, gap: 4 },
  cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  cardMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.08)' },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2 },
  dateField: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.medium, backgroundColor: 'rgba(6,18,37,0.58)' },
  dateFieldLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase' },
  dateFieldValue: { color: Colors.text, fontFamily: Fonts.sans, fontSize: 14, marginTop: 5 },
  smallLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 8, letterSpacing: 1 },
  date: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 12, marginTop: 4 },
  formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  formLabel: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  monthFields: { flexDirection: 'row', gap: 9 },
  monthField: { flex: 1, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  monthFieldActive: { borderColor: Colors.mint, backgroundColor: Colors.mint },
  monthFieldCopy: { flex: 1, gap: 3 },
  monthFieldLabel: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' },
  monthFieldLabelActive: { color: Colors.ink },
  monthFieldValue: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 11 },
  monthFieldValueActive: { color: Colors.ink },
  monthPicker: { padding: 12, gap: 12, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.borderStrong, backgroundColor: 'rgba(6,18,37,0.55)' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yearButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.08)' },
  yearText: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 17 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  monthChip: { width: '23.5%', minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.small, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  monthChipActive: { backgroundColor: Colors.mint, borderColor: Colors.mint },
  monthChipText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 10 },
  monthChipTextActive: { color: Colors.ink },
  rangeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectAll: { color: Colors.blueBright, fontFamily: Fonts.rounded, fontSize: 10 },
  rangeList: { gap: 8 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  rangeRowActive: { borderColor: Colors.mint, backgroundColor: 'rgba(94,234,212,0.12)' },
  rangeLabel: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 12 },
  rangeCount: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 10, marginTop: 3 },
  check: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  checkActive: { borderColor: Colors.mint, backgroundColor: Colors.mint },
  checkText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 13 },
  activeOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: Radius.medium, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  activeOptionSelected: { borderColor: Colors.mint, backgroundColor: 'rgba(94,234,212,0.1)' },
  activeOptionTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 12 },
  activeOptionCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 10, marginTop: 3 },
  empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' },
});
