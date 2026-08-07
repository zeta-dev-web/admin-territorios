import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, Expand, Map, Pencil, Plus, Trash2, UsersRound, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { AppHeader, SectionTitle } from '@/components/ui/app-header';
import { ChoiceRow, FormError, FormField, SelectChips, SubmitButton } from '@/components/ui/form-controls';
import { GlassCard } from '@/components/ui/glass-card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { ScreenBackground } from '@/components/ui/screen-background';
import { ScreenLoader } from '@/components/ui/screen-loader';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Group, mobileAction, TerritoryMap } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

type MapType = 'GENERAL' | 'GROUP';
function parseUrls(value: string) { return [...new Set(value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean))]; }

function PinchableMap({ uri, fullscreen = false }: { uri: string; fullscreen?: boolean }) {
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  // Gesture callbacks run on the UI thread and update Reanimated shared values.
  // eslint-disable-next-line react-hooks/immutability
  const pinch = Gesture.Pinch().onUpdate((event) => { scale.value = Math.min(4, Math.max(1, baseScale.value * event.scale)); }).onEnd(() => { baseScale.value = scale.value; });
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <GestureDetector gesture={pinch}><Animated.View style={[fullscreen ? styles.fullscreenImage : styles.preview, animatedStyle]}><Image source={{ uri }} alt="Mapa" contentFit="contain" style={styles.imageFill} /></Animated.View></GestureDetector>;
}

export default function MapsScreen() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const mapsQuery = useQuery({ queryKey: ['maps'], queryFn: () => mobileAction<TerritoryMap[]>('getAllMaps', {}, token), enabled: Boolean(token) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => mobileAction<Group[]>('getAllGroups', {}, token), enabled: Boolean(token) });
  const [scope, setScope] = useState<MapType>('GENERAL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const [imageIndex, setImageIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TerritoryMap | null>(null);
  const [type, setType] = useState<MapType>('GENERAL');
  const [groupId, setGroupId] = useState<string>();
  const [images, setImages] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: (params: Record<string, unknown>) => mobileAction('createOrUpdateMap', params, token), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['maps'] }); closeModal(); }, onError: (value: Error) => setError(value.message) });
  const deleteMutation = useMutation({ mutationFn: (mapId: string) => mobileAction('deleteMap', { mapId }, token), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maps'] }), onError: (value: Error) => Alert.alert('No se pudo eliminar', value.message) });

  const maps = mapsQuery.data || [];
  const generalMaps = maps.filter((item) => item.type === 'GENERAL');
  const groupMaps = maps.filter((item) => item.type === 'GROUP');
  const visibleGroupId = groupMaps.some((item) => item.groupId === selectedGroupId) ? selectedGroupId : groupMaps[0]?.groupId || undefined;
  const activeMap = scope === 'GENERAL' ? generalMaps[0] : groupMaps.find((item) => item.groupId === visibleGroupId) || groupMaps[0];
  const activeGroupName = activeMap?.group?.name || groupsQuery.data?.find((group) => group.id === activeMap?.groupId)?.name;
  const activeImages = activeMap?.images || [];
  const safeImageIndex = imageIndex % Math.max(activeImages.length, 1);

  function openCreate() { setEditing(null); setType(scope); setGroupId(scope === 'GROUP' ? visibleGroupId : undefined); setImages(''); setError(''); setModal(true); }
  function openEdit(map: TerritoryMap) { setEditing(map); setType(map.type); setGroupId(map.groupId || undefined); setImages(map.images.map((image) => image.url).join('\n')); setError(''); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); setError(''); }
  function save() {
    const imageUrls = parseUrls(images);
    if (!imageUrls.length || (type === 'GROUP' && !groupId)) { setError('Elegí el alcance del mapa y cargá al menos una URL de imagen.'); return; }
    mutation.mutate({ type, images: imageUrls, ...(type === 'GROUP' ? { groupId } : {}) });
  }
  function remove(map: TerritoryMap) { Alert.alert('Eliminar mapa', 'Se eliminarán las imágenes asociadas a este mapa.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(map.id) }]); }
  function changeImage(direction: -1 | 1) { if (!activeImages.length) return; setImageIndex((current) => (current + direction + activeImages.length) % activeImages.length); }

  return <ScreenBackground><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={mapsQuery.isRefetching} onRefresh={() => mapsQuery.refetch()} tintColor={Colors.mint} colors={[Colors.mint]} />}><AppHeader /><View style={styles.intro}><Text style={styles.eyebrow}>REFERENCIAS VISUALES</Text><Text style={styles.title}>Mapas</Text><Text style={styles.subtitle}>Consultá el mapa general o las áreas asignadas a cada grupo.</Text></View><View style={styles.scopeTabs}><ScopeTab label="General" icon={Map} active={scope === 'GENERAL'} onPress={() => { setScope('GENERAL'); setImageIndex(0); }} /><ScopeTab label="Por grupo" icon={UsersRound} active={scope === 'GROUP'} onPress={() => { setScope('GROUP'); setImageIndex(0); }} /></View>{scope === 'GROUP' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupChips}>{groupMaps.map((map) => { const groupName = map.group?.name || groupsQuery.data?.find((group) => group.id === map.groupId)?.name || 'Grupo'; const active = map.groupId === visibleGroupId; return <Pressable key={map.id} onPress={() => { setSelectedGroupId(map.groupId || undefined); setImageIndex(0); }} style={[styles.groupChip, active && styles.groupChipActive]}><Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{groupName}</Text></Pressable>; })}</ScrollView>}<View style={styles.actionRow}><SectionTitle eyebrow={scope === 'GENERAL' ? 'MAPA GENERAL' : 'MAPA DE GRUPOS'} title={activeMap ? (scope === 'GENERAL' ? 'Territorios' : activeGroupName || 'Áreas de grupo') : 'Sin mapa cargado'} /><Pressable onPress={activeMap ? () => openEdit(activeMap) : openCreate} style={styles.addButton}>{activeMap ? <Pencil size={15} color={Colors.ink} /> : <Plus size={16} color={Colors.ink} />}<Text style={styles.addText}>{activeMap ? 'Editar' : 'Cargar'}</Text></Pressable></View>{mapsQuery.isLoading ? <ScreenLoader label="Cargando mapas..." /> : activeMap && activeImages.length ? <GlassCard style={styles.viewerCard}><Pressable onPress={() => setViewerOpen(true)} style={styles.previewPressable}><Image source={{ uri: activeImages[safeImageIndex]?.url }} alt="Vista del mapa" contentFit="contain" style={styles.preview} /><View style={styles.expandButton}><Expand size={17} color={Colors.white} /></View></Pressable>{activeImages.length > 1 && <View style={styles.imageControls}><Pressable accessibilityLabel="Imagen anterior" onPress={() => changeImage(-1)} style={styles.imageArrow}><ChevronLeft size={19} color={Colors.mint} /></Pressable><Text style={styles.imageCounter}>{safeImageIndex + 1} de {activeImages.length}</Text><Pressable accessibilityLabel="Imagen siguiente" onPress={() => changeImage(1)} style={styles.imageArrow}><ChevronRight size={19} color={Colors.mint} /></Pressable></View>}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>{activeImages.map((image, index) => <Pressable key={image.id} onPress={() => setImageIndex(index)} style={[styles.thumbnail, safeImageIndex === index && styles.thumbnailActive]}><Image source={{ uri: image.url }} alt={`Miniatura ${index + 1}`} contentFit="cover" style={styles.thumbnailImage} /></Pressable>)}</ScrollView><View style={styles.mapFooter}><Text style={styles.mapFooterText}>{scope === 'GENERAL' ? 'Mapa general de la congregación' : `Áreas de ${activeGroupName || 'grupo'}`}</Text><Pressable onPress={() => remove(activeMap)} hitSlop={8} style={styles.deleteButton}><Trash2 size={16} color={Colors.danger} /><Text style={styles.deleteText}>Eliminar</Text></Pressable></View></GlassCard> : <GlassCard style={styles.empty}><Map size={32} color={Colors.textDim} /><Text style={styles.emptyTitle}>{scope === 'GENERAL' ? 'Sin mapa general' : 'Sin mapa de grupo'}</Text><Text style={styles.emptyCopy}>{scope === 'GENERAL' ? 'Cargá el plano general de territorios para poder consultarlo desde la app.' : 'Cargá el mapa con las áreas de cada grupo para verlo desde aquí.'}</Text><Pressable onPress={openCreate} style={styles.emptyAction}><Plus size={16} color={Colors.ink} /><Text style={styles.emptyActionText}>Cargar mapa</Text></Pressable></GlassCard>}</ScrollView><Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}><View style={styles.fullscreen}><Pressable style={styles.fullscreenBackdrop} onPress={() => setViewerOpen(false)} /><SafeAreaView edges={['top', 'bottom']} style={styles.fullscreenSafe}><View style={styles.fullscreenHeader}><Text style={styles.fullscreenTitle}>{scope === 'GENERAL' ? 'Mapa general' : activeGroupName || 'Mapa de grupo'}</Text><Pressable onPress={() => setViewerOpen(false)} style={styles.closeViewer}><X size={21} color={Colors.white} /></Pressable></View>{activeImages[safeImageIndex] && <PinchableMap uri={activeImages[safeImageIndex].url} fullscreen />}{activeImages.length > 1 && <View style={styles.fullscreenControls}><Pressable onPress={() => changeImage(-1)} style={styles.imageArrow}><ChevronLeft size={21} color={Colors.mint} /></Pressable><Text style={styles.imageCounter}>{safeImageIndex + 1} de {activeImages.length}</Text><Pressable onPress={() => changeImage(1)} style={styles.imageArrow}><ChevronRight size={21} color={Colors.mint} /></Pressable></View>}</SafeAreaView></View></Modal><ModalSheet visible={modal} onClose={closeModal} eyebrow={editing ? 'EDITAR MAPA' : 'NUEVO MAPA'} title={editing ? 'Editar mapa' : 'Cargar mapa'}><ChoiceRow label="Alcance del mapa" value={type} options={[{ label: 'General', value: 'GENERAL' }, { label: 'Por grupo', value: 'GROUP' }]} onChange={(value) => { setType(value); if (value === 'GENERAL') setGroupId(undefined); }} />{type === 'GROUP' && <SelectChips label="Grupo" value={groupId} options={(groupsQuery.data || []).map((group) => ({ value: group.id, label: group.name, detail: 'Mapa de áreas del grupo' }))} onChange={setGroupId} />}<FormField label="URLs de las imágenes" value={images} onChangeText={setImages} placeholder={'Una URL por línea\nhttps://...'} multiline autoCapitalize="none" /><Text style={styles.formHint}>Podés cargar una o varias imágenes. Cada una aparecerá en el visor del mapa.</Text><FormError message={error} /><SubmitButton label="Guardar mapa" loading={mutation.isPending} onPress={save} /></ModalSheet></ScreenBackground>;
}

function ScopeTab({ label, icon: Icon, active, onPress }: { label: string; icon: typeof Map; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.scopeTab, active && styles.scopeTabActive]}><Icon size={16} color={active ? Colors.ink : Colors.textMuted} /><Text style={[styles.scopeTabText, active && styles.scopeTabTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.eight, gap: Spacing.four },
  intro: { paddingHorizontal: Spacing.four, gap: 5 },
  eyebrow: { color: Colors.mint, fontFamily: Fonts.rounded, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 32, letterSpacing: -0.8 },
  subtitle: { color: Colors.textMuted, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  scopeTabs: { flexDirection: 'row', gap: 8, marginHorizontal: Spacing.four, padding: 5, borderRadius: Radius.medium, backgroundColor: 'rgba(6,18,37,0.48)', borderWidth: 1, borderColor: Colors.border },
  scopeTab: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: Radius.small },
  scopeTabActive: { backgroundColor: Colors.mint },
  scopeTabText: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 12 },
  scopeTabTextActive: { color: Colors.ink },
  groupChips: { gap: 8, paddingHorizontal: Spacing.four },
  groupChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(168,183,204,0.06)' },
  groupChipActive: { borderColor: Colors.mint, backgroundColor: 'rgba(94,234,212,0.13)' },
  groupChipText: { color: Colors.textDim, fontFamily: Fonts.rounded, fontSize: 11 },
  groupChipTextActive: { color: Colors.mint },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.mint },
  addText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 },
  viewerCard: { marginHorizontal: Spacing.four, padding: Spacing.three, gap: Spacing.three },
  previewPressable: { height: 310, overflow: 'hidden', borderRadius: Radius.medium, backgroundColor: 'rgba(6,18,37,0.72)' },
  preview: { width: '100%', height: '100%' },
  imageFill: { width: '100%', height: '100%' },
  expandButton: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(6,18,37,0.72)' },
  imageControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  imageArrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, borderWidth: 1, borderColor: 'rgba(94,234,212,0.24)', backgroundColor: 'rgba(94,234,212,0.1)' },
  imageCounter: { color: Colors.textMuted, fontFamily: Fonts.rounded, fontSize: 11 },
  thumbnails: { gap: 8 },
  thumbnail: { width: 64, height: 48, overflow: 'hidden', borderRadius: 10, borderWidth: 2, borderColor: 'transparent', opacity: 0.62 },
  thumbnailActive: { borderColor: Colors.mint, opacity: 1 },
  thumbnailImage: { width: '100%', height: '100%' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 },
  mapFooterText: { flex: 1, color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 11 },
  deleteButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, borderRadius: Radius.pill, backgroundColor: 'rgba(244,141,145,0.08)' },
  deleteText: { color: Colors.danger, fontFamily: Fonts.rounded, fontSize: 10 },
  empty: { marginHorizontal: Spacing.four, alignItems: 'center', padding: Spacing.five, gap: 9 },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.rounded, fontSize: 16 },
  emptyCopy: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyAction: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, borderRadius: Radius.pill, backgroundColor: Colors.mint, marginTop: 3 },
  emptyActionText: { color: Colors.ink, fontFamily: Fonts.rounded, fontSize: 11 },
  formHint: { color: Colors.textDim, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  fullscreen: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(2,8,20,0.96)' },
  fullscreenSafe: { flex: 1, justifyContent: 'center' },
  fullscreenBackdrop: { ...StyleSheet.absoluteFill },
  fullscreenHeader: { position: 'absolute', zIndex: 2, top: 28, right: Spacing.four, left: Spacing.four, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fullscreenTitle: { color: Colors.white, fontFamily: Fonts.rounded, fontSize: 16 },
  closeViewer: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  fullscreenImage: { width: '100%', height: '76%' },
  fullscreenControls: { position: 'absolute', right: Spacing.four, bottom: 14, left: Spacing.four, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
