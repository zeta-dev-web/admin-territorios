"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertCircle, ArrowLeft, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WeekHeader } from "@/components/vymc/week-header";
import { WhatsAppIcon } from "@/components/vymc/whatsapp-icon";
import { WeekSectionCard } from "@/components/vymc/week-section-card";
import { AssignmentDialog } from "@/components/vymc/assignment-dialog";
import { AddItemDialog, type AddingSectionState } from "@/components/vymc/add-item-dialog";
import { DeleteItemDialog } from "@/components/vymc/delete-item-dialog";
import { SpecialAssignmentDialog } from "@/components/vymc/special-assignment-dialog";
import {
  AutoAssignPreviewDialog,
  type AutoAssignPlanResponse,
} from "@/components/vymc/auto-assign-preview-dialog";
import {
  WhatsAppShareDialog,
  WhatsAppShareData,
} from "@/components/vymc/whatsapp-share-dialog";
import {
  ensureSections,
  formatDateRange,
  getPlaceholderConfig,
  SECTION_TITLES,
  sortSections,
} from "@/components/vymc/week-display-config";
import { canAssignPublisher } from "@/lib/assignment-eligibility";
import type {
  AssigningItemState,
  Publisher,
  SpecialAssignType,
  WeekDetail,
  WeekItem,
  WeekSection,
} from "@/types/week-detail";

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [week, setWeek] = useState<WeekDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishers, setPublishers] = useState<Publisher[]>([]);

  // WhatsApp share dialog state
  const [whatsAppShareData, setWhatsAppShareData] = useState<WhatsAppShareData | null>(null);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

  // Assignment dialog state
  const [assigningItem, setAssigningItem] = useState<AssigningItemState | null>(null);
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isAssigningLoading, setIsAssigningLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // President/Prayer assignment dialog state
  const [assigningSpecial, setAssigningSpecial] = useState<SpecialAssignType | null>(null);
  const [selectedSpecialPublisherId, setSelectedSpecialPublisherId] =
    useState<string>("");
  const [isSpecialAssignLoading, setIsSpecialAssignLoading] = useState(false);
  const [specialAssignError, setSpecialAssignError] = useState<string | null>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [autoAssignMessage, setAutoAssignMessage] = useState<string | null>(null);
  const [autoAssignPlan, setAutoAssignPlan] = useState<AutoAssignPlanResponse | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);

  // Title editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  // Add extra topic state
  const [addingSection, setAddingSection] = useState<AddingSectionState>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // Delete topic state
  const [deletingItem, setDeletingItem] = useState<WeekItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const weekId = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!weekId) return;

      try {
        const [weekRes, pubRes] = await Promise.all([
          fetch(`/api/vymc/weeks/${weekId}`),
          fetch("/api/vymc/publishers"),
        ]);

        if (!weekRes.ok) {
          if (weekRes.status === 404) throw new Error("Semana no encontrada");
          throw new Error("Error al cargar la semana");
        }
        if (!pubRes.ok) throw new Error("Error al cargar publicadores");

        const weekData = await weekRes.json();
        const pubData = await pubRes.json();

        if (!cancelled) {
          setWeek(weekData);
          setPublishers(pubData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weekId]);

  const reloadWeek = async () => {
    try {
      const res = await fetch(`/api/vymc/weeks/${weekId}`);
      if (res.ok) {
        const data = await res.json();
        setWeek(data);
      }
    } catch {
      // Silently fail on refresh
    }
  };

  const openAssignDialog = async (
    item: WeekItem,
    sectionType: string,
    isPlaceholder: boolean,
    preSelectedRole?: string
  ) => {
    if (isPlaceholder) {
      // Create the section + item in the database first
      setIsAssigningLoading(true);
      try {
        const sectionConfig = getPlaceholderConfig(sectionType);
        const res = await fetch(`/api/vymc/weeks/${weekId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sectionConfig),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al crear sección");
        }

        const createdSection = await res.json();
        // Reload the week to get fresh data with the new section
        await reloadWeek();

        // Now find the created item and open dialog for it
        const createdItem = createdSection.items?.[0];
        if (createdItem) {
          setAssigningItem({
            item: createdItem,
            sectionType,
            isPlaceholder: false,
          });
          setSelectedPublisherId("");
          setSelectedRole("");
          setAssignError(null);
        }
      } catch (err) {
        setAssignError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsAssigningLoading(false);
      }
    } else {
      setAssigningItem({ item, sectionType, isPlaceholder: false });
      setSelectedPublisherId("");
      setSelectedRole(preSelectedRole ?? "");
      setAssignError(null);
    }
  };

  const handleCreateAssignment = async () => {
    if (!assigningItem || !selectedPublisherId || !selectedRole) return;

    setIsAssigningLoading(true);
    setAssignError(null);

    try {
      const res = await fetch("/api/vymc/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekItemId: assigningItem.item.id,
          publisherId: selectedPublisherId,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear asignación");
      }

      setAssigningItem(null);
      await reloadWeek();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsAssigningLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/vymc/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar asignación");
      }

      await reloadWeek();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const openSpecialAssignDialog = (type: SpecialAssignType) => {
    setAssigningSpecial(type);
    setSelectedSpecialPublisherId(
      type === "president"
        ? week?.president?.id || ""
        : week?.openingPrayer?.id || ""
    );
    setSpecialAssignError(null);
  };

  /* Quita la oración inicial y abre el modal para elegir otra vez. */
  const handleRemoveOpeningPrayer = async () => {
    if (!week) return;

    setIsSpecialAssignLoading(true);
    try {
      const res = await fetch(`/api/vymc/weeks/${weekId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingPrayerId: null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al quitar");
      }

      await reloadWeek();
      setSelectedSpecialPublisherId("");
      setSpecialAssignError(null);
      setAssigningSpecial("prayer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al quitar");
    } finally {
      setIsSpecialAssignLoading(false);
    }
  };

  const handleClearSpecial = async (type: SpecialAssignType) => {
    if (!week) return;

    setIsSpecialAssignLoading(true);
    setSpecialAssignError(null);

    try {
      const field =
        type === "president" ? "presidentId" : "openingPrayerId";

      const res = await fetch(`/api/vymc/weeks/${weekId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al quitar");
      }

      await reloadWeek();
    } catch (err) {
      setSpecialAssignError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSpecialAssignLoading(false);
    }
  };

  const handleSpecialAssignment = async () => {
    if (!assigningSpecial || !selectedSpecialPublisherId || !week) return;

    setIsSpecialAssignLoading(true);
    setSpecialAssignError(null);

    try {
      const field =
        assigningSpecial === "president" ? "presidentId" : "openingPrayerId";

      const res = await fetch(`/api/vymc/weeks/${weekId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: selectedSpecialPublisherId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al asignar");
      }

      setAssigningSpecial(null);
      await reloadWeek();
    } catch (err) {
      setSpecialAssignError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSpecialAssignLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!week || isAutoAssigning) return;

    setIsAutoAssigning(true);
    setAutoAssignMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/vymc/weeks/${weekId}/auto-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar el borrador");

      setAutoAssignPlan(data);
      setIsPreviewDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleApplyAutoAssign = async (selectedKeys: Set<string>) => {
    if (!autoAssignPlan) return;

    const assignments = autoAssignPlan.proposals
      .filter((proposal) => selectedKeys.has(proposal.key))
      .map((proposal) =>
        proposal.kind === "special"
          ? {
              kind: "special",
              field: proposal.field,
              publisherId: proposal.publisherId,
            }
          : {
              kind: "assignment",
              weekItemId: proposal.weekItemId,
              role: proposal.role,
              publisherId: proposal.publisherId,
            }
      );

    setIsApplyingPlan(true);
    try {
      const res = await fetch(`/api/vymc/weeks/${weekId}/auto-assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron aplicar las asignaciones");

      setIsPreviewDialogOpen(false);
      setAutoAssignPlan(null);
      setAutoAssignMessage(
        data.skipped.length > 0
          ? `Se aplicaron ${data.assigned} asignaciones. Omitidas: ${data.skipped.join(", ")}.`
          : `Se aplicaron ${data.assigned} asignaciones correctamente.`
      );
      await reloadWeek();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsApplyingPlan(false);
    }
  };

  const startEditingTitle = (itemId: string, currentTitle: string) => {
    setEditingItemId(itemId);
    setEditingTitle(currentTitle);
  };

  const cancelEditingTitle = () => {
    setEditingItemId(null);
    setEditingTitle("");
  };

  const saveEditingTitle = async () => {
    if (!editingItemId || !editingTitle.trim()) return;

    setIsUpdatingTitle(true);
    try {
      const res = await fetch(`/api/vymc/weeks/items/${editingItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar el título");
      }

      await reloadWeek();
      setEditingItemId(null);
      setEditingTitle("");
      toast.success("Título actualizado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar el título");
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const openAddItemDialog = (section: WeekSection) => {
    setAddingSection({
      sectionId: section.id,
      sectionType: section.sectionType,
      sectionTitle: SECTION_TITLES[section.sectionType] ?? section.sectionType,
    });
    setAddItemError(null);
  };

  const handleConfirmAddItem = async (title: string, timeMinutes: number | null) => {
    if (!addingSection) return;

    setIsAddingItem(true);
    setAddItemError(null);
    try {
      const res = await fetch(
        `/api/vymc/weeks/sections/${addingSection.sectionId}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, timeMinutes }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al agregar el tema");
      }

      await reloadWeek();
      setAddingSection(null);
      toast.success("Tema agregado correctamente");
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : "Error al agregar el tema");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (item: WeekItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDeleteItem = async () => {
    if (!deletingItem) return;

    setIsDeletingItem(true);
    try {
      const res = await fetch(`/api/vymc/weeks/items/${deletingItem.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar el tema");
      }

      await reloadWeek();
      setDeletingItem(null);
      toast.success("Tema eliminado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar el tema");
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleMoveItem = async (itemId: string, swapWithItemId: string) => {
    try {
      const res = await fetch(`/api/vymc/weeks/items/${itemId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapWithItemId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al mover el tema");
      }

      await reloadWeek();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al mover el tema");
    }
  };

  const handleOpenWhatsAppDialog = (data: WhatsAppShareData) => {
    if (!week) return;
    const weekRangeText = formatDateRange(week.startDate, week.endDate);
    setWhatsAppShareData({
      ...data,
      weekRangeText,
      biblicalReading: week.biblicalReading,
    });
    setIsWhatsAppDialogOpen(true);
  };

  const handlePhoneUpdated = (publisherId: string, newPhone: string) => {
    setPublishers((prev) =>
      prev.map((p) => (p.id === publisherId ? { ...p, phone: newPhone } : p))
    );
    setWeek((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        president:
          prev.president?.id === publisherId
            ? { ...prev.president, phone: newPhone }
            : prev.president,
        openingPrayer:
          prev.openingPrayer?.id === publisherId
            ? { ...prev.openingPrayer, phone: newPhone }
            : prev.openingPrayer,
      };
    });
  };

  // ============ LOADING / ERROR STATES ============

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando programa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/vymc/programas")}
          className="gap-2 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a programas
        </Button>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!week) return null;

  const eligibleAssignmentPublishers = assigningItem
    ? publishers.filter((publisher) =>
        canAssignPublisher(publisher, {
          sectionType: assigningItem.sectionType,
          itemType: assigningItem.item.itemType,
          role: selectedRole,
        })
      )
    : publishers;
  const specialSectionType =
    assigningSpecial === "president" ? "PRESIDENT" : "OPENING_PRAYER";
  const eligibleSpecialPublishers = publishers.filter((publisher) =>
    canAssignPublisher(publisher, { sectionType: specialSectionType })
  );

  const displayedSections: WeekSection[] = ensureSections(week);
  const sortedSections = sortSections(displayedSections);

  // Find items needed for special rendering
  const openingItem = week.sections
    .find((s) => s.sectionType === "OPENING_PRAYER")?.items?.[0] ?? null;
  const closingPrayerSection = week.sections
    .find((s) => s.sectionType === "CLOSING_PRAYER") ?? null;
  const closingPrayerItem = closingPrayerSection?.items?.[0] ?? null;
  const conclusionItem = week.sections
    .find((s) => s.sectionType === "CHRISTIAN_LIFE")?.items
    ?.find((i) => i.title.toLowerCase().includes("palabras de conclusión")) ?? null;

  // Sections to exclude from the main program render
  const excludeSectionTypes = new Set(["PRESIDENT", "CLOSING_PRAYER"]);

  // ============ RENDER ============

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/vymc/programas")}
        className="gap-2 px-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a programas
      </Button>

      {/* Week Header */}
      <WeekHeader
        startDate={week.startDate}
        endDate={week.endDate}
        biblicalReading={week.biblicalReading}
        weekType={week.weekType}
        isAutoAssigning={isAutoAssigning}
        onAutoAssign={handleAutoAssign}
      />
      {autoAssignMessage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {autoAssignMessage}
        </div>
      )}

      {(week.weekType === "REGIONAL_ASSEMBLY" || week.weekType === "CIRCUIT_ASSEMBLY") && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-5 py-4 text-amber-900">
          <p className="font-semibold">Semana especial</p>
          <p className="mt-1 text-sm">No se trae programa y no se realizan asignaciones para esta semana.</p>
        </div>
      )}

      {(week.weekType === "REGULAR" || week.weekType === "CIRCUIT_SUPERVISOR_VISIT") && <>
      {/* Presidencia */}
      <Card className="border overflow-hidden">
        <div className="px-5 py-2.5 bg-card border-gray-200">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-800">
            Presidencia
          </h2>
        </div>
        <CardContent className="py-3 px-5 bg-card">
          {week.president ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white">
                <span>
                  {week.president.firstName} {week.president.lastName}
                  {" · "}Asignado
                </span>
                <button
                  onClick={() => handleClearSpecial("president")}
                  className="ml-1 hover:opacity-70"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
              <button
                type="button"
                onClick={() =>
                  handleOpenWhatsAppDialog({
                    publisherId: week.president!.id,
                    publisherName: `${week.president!.firstName} ${week.president!.lastName}`,
                    phone: week.president!.phone,
                    gender: "MALE",
                    role: "PRESIDENT",
                    roleLabel: "Presidente de la reunión",
                    partTitle: "Presidencia de la reunión",
                    sectionTitle: "Presidencia",
                    weekRangeText: "",
                  })
                }
                aria-label="Notificar por WhatsApp"
                title="Notificar por WhatsApp"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] border border-[#128C4B]/50 text-[#ffffff] shadow-sm hover:bg-[#1eb457] transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
              </button>
            </span>
          ) : (
            <Button
              variant="soft"
              size="sm"
              onClick={() => openSpecialAssignDialog("president")}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Asignar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Meeting Program */}
      <div className="space-y-3">
        {sortedSections
          .filter((s) => !excludeSectionTypes.has(s.sectionType))
          .map((section) => (
            <WeekSectionCard
              key={section.id}
              section={section}
              openingItem={openingItem}
              openingPrayerPublisher={week.openingPrayer}
              conclusionItem={conclusionItem}
              closingPrayerItem={closingPrayerItem}
              onAssign={openAssignDialog}
              onRemoveAssignment={handleRemoveAssignment}
              onAiAssigned={reloadWeek}
              onChangeOpeningPrayer={() => openSpecialAssignDialog("prayer")}
              onRemoveOpeningPrayer={handleRemoveOpeningPrayer}
              onShareWhatsApp={handleOpenWhatsAppDialog}
              editingItemId={editingItemId}
              editingTitle={editingTitle}
              onEditingTitleChange={setEditingTitle}
              onStartEditingTitle={startEditingTitle}
              onCancelEditingTitle={cancelEditingTitle}
              onSaveEditingTitle={saveEditingTitle}
              isUpdatingTitle={isUpdatingTitle}
              onAddItem={openAddItemDialog}
              onDeleteItem={handleDeleteItem}
              onMoveItem={handleMoveItem}
            />
          ))}
      </div>
      </>}

      {/* Assign Dialog */}
      <AssignmentDialog
        assigningItem={assigningItem}
        selectedRole={selectedRole}
        eligiblePublishers={eligibleAssignmentPublishers}
        selectedPublisherId={selectedPublisherId}
        onPublisherChange={setSelectedPublisherId}
        isLoading={isAssigningLoading}
        error={assignError}
        onClose={() => setAssigningItem(null)}
        onConfirm={handleCreateAssignment}
      />

      {/* Add extra topic dialog */}
      <AddItemDialog
        addingSection={addingSection}
        isSaving={isAddingItem}
        error={addItemError}
        onClose={() => setAddingSection(null)}
        onConfirm={handleConfirmAddItem}
      />

      {/* Delete topic dialog */}
      <DeleteItemDialog
        item={deletingItem}
        isDeleting={isDeletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDeleteItem}
      />

      {/* Auto-assign preview dialog */}
      <AutoAssignPreviewDialog
        open={isPreviewDialogOpen}
        plan={autoAssignPlan}
        isApplying={isApplyingPlan}
        onOpenChange={setIsPreviewDialogOpen}
        onApply={handleApplyAutoAssign}
      />

      {/* President/Prayer Assignment Dialog */}
      <SpecialAssignmentDialog
        type={assigningSpecial}
        eligiblePublishers={eligibleSpecialPublishers}
        selectedPublisherId={selectedSpecialPublisherId}
        onPublisherChange={setSelectedSpecialPublisherId}
        isLoading={isSpecialAssignLoading}
        error={specialAssignError}
        onClose={() => setAssigningSpecial(null)}
        onConfirm={handleSpecialAssignment}
      />

      {/* WhatsApp Share Dialog */}
      <WhatsAppShareDialog
        isOpen={isWhatsAppDialogOpen}
        onClose={() => setIsWhatsAppDialogOpen(false)}
        data={whatsAppShareData}
        onPhoneUpdated={handlePhoneUpdated}
      />
    </div>
  );
}
