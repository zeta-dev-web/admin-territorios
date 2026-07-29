import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Map, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { ChoiceRow, FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Group, mobileAction, TerritoryMap } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

type MapType = 'GENERAL' | 'GROUP';
function parseUrls(value: string) { return [...new Set(value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean))]; }

export default function MapsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const mapsQuery = useQuery({ queryKey: ['maps'], queryFn: () => mobileAction<TerritoryMap[]>('getAllMaps', {}, token), enabled: Boolean(token) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => mobileAction<Group[]>('getAllGroups', {}, token), enabled: Boolean(token) });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TerritoryMap | null>(null);
  const [type, setType] = useState<MapType>('GENERAL');
  const [groupId, setGroupId] = useState<string>();
  const [images, setImages] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: (params: Record<string, unknown>) => mobileAction('createOrUpdateMap', params, token), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['maps'] }); closeModal(); }, onError: (value: Error) => setError(value.message) });
  const deleteMutation = useMutation({ mutationFn: (mapId: string) => mobileAction('deleteMap', { mapId }, token), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maps'] }), onError: (value: Error) => Alert.alert('No se pudo eliminar', value.message) });

  function openCreate() { setEditing(null); setType('GENERAL'); setGroupId(undefined); setImages(''); setError(''); setModal(true); }
  function openEdit(map: TerritoryMap) { setEditing(map); setType(map.type); setGroupId(map.groupId || undefined); setImages(map.images.map((image) => image.url).join('\n')); setError(''); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); setError(''); }
  function save() { const imageUrls = parseUrls(images); if (!imageUrls.length || (type === 'GROUP' && !groupId)) { setError('Elegí el alcance del mapa y cargá al menos una URL de imagen.'); return; } mutation.mutate({ type, images: imageUrls, ...(type === 'GROUP' ? { groupId } : {}) }); }
  function remove(map: TerritoryMap) { Alert.alert('Eliminar mapa', 'Se eliminarán las imágenes asociadas a este mapa.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(map.id) }]); }
  const maps = mapsQuery.data || [];
  return <ScreenBackground><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={mapsQuery.isRefetching} onRefresh={() => mapsQuery.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}><AppHeader /><View style={styles.intro}><Text style={styles.eyebrow}>REFERENCIAS VISUALES</Text><Text style={styles.title}>Mapas</Text><Text style={styles.subtitle}>Guardá el mapa general o el mapa con las áreas de cada grupo.</Text></View><View style={styles.actionRow}><SectionTitle eyebrow="REGISTRO" title={`${maps.length} mapas`} /><Pressable onPress={openCreate} style={styles.addButton}><Plus size={16} color={Colors.ink} /><Text style={styles.addText}>Nuevo</Text></Pressable></View><View style={styles.list}>{maps.map((map, index) => <Animated.View key={map.id} entering={FadeInUp.duration(420).delay(Math.min(index, 6) * 50)}><MapCard map={map} groupName={groupsQuery.data?.find((group) => group.id === map.groupId)?.name} onEdit={() => openEdit(map)} onDelete={() => remove(map)} /></Animated.View>)}</View>{!maps.length && !mapsQuery.isLoading && <GlassCard style={styles.empty}><Map size={28} color={Colors.textDim} /><Text style={styles.emptyTitle}>Todavía no hay mapas</Text><Text style={styles.emptyCopy}>Podés cargar URLs de imágenes de Google Drive u otro almacenamiento.</Text></GlassCard>}</ScrollView><ModalSheet visible={modal} onClose={closeModal} eyebrow={editing ? 'EDITAR MAPA' : 'NUEVO MAPA'} title={editing ? 'Editar mapa' : 'Cargar mapa'}><ChoiceRow label="Alcance del mapa" value={type} options={[{ label: 'General', value: 'GENERAL' }, { label: 'Por grupo', value: 'GROUP' }]} onChange={(value) => { setType(value); if (value === 'GENERAL') setGroupId(undefined); }} />{type === 'GROUP' && <SelectChips label="Grupo" value={groupId} options={(groupsQuery.data || []).map((group) => ({ value: group.id, label: group.name, detail: 'Mapa de áreas del grupo' }))} onChange={setGroupId} />}<FormField label="URLs de las imágenes" value={images} onChangeText={setImages} placeholder={'Una URL por línea\nhttps://...'} multiline autoCapitalize="none" /><Text style={styles.formHint}>El sistema admite una o varias imágenes. Si usás Google Drive, pegá el enlace compartido.</Text><FormError message={error} /><SubmitButton label="Guardar mapa" loading={mutation.isPending} onPress={save} /></ModalSheet></ScreenBackground>;
}

function MapCard({ map, groupName, onEdit, onDelete }: { map: TerritoryMap; groupName?: string; onEdit: () => void; onDelete: () => void }) { const firstImage = map.images[0]?.url; return <GlassCard style={styles.card}><View style={styles.cardTop}>{firstImage ? <Image source={{ uri: firstImage }} alt="Vista previa del mapa" contentFit="cover" style={styles.preview} /> : <View style={styles.previewFallback}><Map size={22} color={Colors.mint} /></View>}<View style={styles.cardMain}><Text style={styles.cardTitle}>{map.type === 'GENERAL' ? 'Mapa general' : groupName || 'Mapa de grupo'}</Text><Text style={styles.cardMeta}>{map.images.length} {map.images.length === 1 ? 'imagen' : 'imágenes'}</Text></View><Pressable onPress={onEdit} style={styles.iconButton}><Pencil size={15} color={Colors.textMuted} /></Pressable><Pressable onPress={onDelete} style={styles.iconButton}><Trash2 size={15} color={Colors.textDim} /></Pressable></View></GlassCard>; }

const styles = StyleSheet.create({ content: { paddingBottom: Spacing.eight, gap: Spacing.four }, intro: { paddingHorizontal: Spacing.four, gap: 5 }, eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 }, title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 }, subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four }, addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint }, addText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 }, list: { gap: Spacing.three, paddingHorizontal: Spacing.four }, card: { padding: Spacing.three }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, preview: { width: 52, height: 52, borderRadius: 15, backgroundColor: Colors.panel }, previewFallback: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(94,234,212,0.12)' }, cardMain: { flex: 1, gap: 4 }, cardTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 }, cardMeta: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12 }, iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(168,183,204,0.08)' }, formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 }, empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 8 }, emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 15 }, emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, textAlign: 'center' } });
