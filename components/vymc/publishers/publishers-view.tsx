"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PublisherFilters } from "./publisher-filters";
import { PublishersTable } from "./publishers-table";
import { PublisherFormDialog } from "./publisher-form-dialog";
import type { VymcPublisher } from "./types";

type Group = { id: string; name: string; _count?: { publishers: number } };

/**
 * Vista de publicadores compartida por los paneles VYMC y Territorios.
 * La paleta se resuelve por CSS mediante el wrapper ancestro
 * (.vymc-theme claro / .ter-theme oscuro).
 */
export function PublishersView() {
  const [allPublishers, setAllPublishers] = useState<VymcPublisher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Diálogos
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<VymcPublisher | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [baptizedFilter, setBaptizedFilter] = useState("ALL");
  const [pioneerFilter, setPioneerFilter] = useState("ALL");
  const [ministerialFilter, setMinisterialFilter] = useState("ALL");
  const [elderFilter, setElderFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");

  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const loadPublishers = async () => {
    try {
      const response = await fetch("/api/vymc/publishers");
      if (!response.ok) throw new Error("Error al cargar publicadores");
      setAllPublishers(await response.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar publicadores");
    }
  };

  const loadGroups = async () => {
    try {
      const response = await fetch("/api/vymc/groups");
      if (response.ok) setGroups(await response.json());
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/vymc/publishers");
        if (!response.ok) throw new Error("Error al cargar publicadores");
        const data = await response.json();
        if (!cancelled) setAllPublishers(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al cargar publicadores");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    void loadGroups();
    return () => { cancelled = true };
  }, []);

  const filteredPublishers = useMemo(() => {
    let result = [...allPublishers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          (p.phone && p.phone.includes(q))
      );
    }
    if (genderFilter !== "ALL") result = result.filter((p) => p.gender === genderFilter);
    if (baptizedFilter !== "ALL") result = result.filter((p) => p.isBaptized === (baptizedFilter === "true"));
    if (pioneerFilter !== "ALL") result = result.filter((p) => p.isPioneer === (pioneerFilter === "true"));
    if (ministerialFilter !== "ALL")
      result = result.filter((p) => p.isMinisterialServant === (ministerialFilter === "true"));
    if (elderFilter !== "ALL") result = result.filter((p) => p.isElder === (elderFilter === "true"));
    if (groupFilter !== "ALL") {
      result = result.filter((p) =>
        groupFilter === "__none__" ? !p.groupId : p.groupId === groupFilter
      );
    }

    return result;
  }, [allPublishers, searchQuery, genderFilter, baptizedFilter, pioneerFilter, ministerialFilter, elderFilter, groupFilter]);

  const totalPages = Math.ceil(filteredPublishers.length / pageSize) || 1;
  const paginatedPublishers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPublishers.slice(start, start + pageSize);
  }, [filteredPublishers, page, pageSize]);

  const openCreateDialog = () => { setEditingPublisher(null); setIsFormDialogOpen(true); };
  const openEditDialog = (publisher: VymcPublisher) => {
    setEditingPublisher(publisher);
    setIsFormDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/vymc/publishers/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al eliminar publicador");
      }
      setDeleteConfirmId(null);
      await loadPublishers();
      await loadGroups(); // refrescar contadores de grupos
      toast.success("Publicador eliminado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar publicador");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const response = await fetch("/api/vymc/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error al crear el grupo");

      toast.success(`Grupo "${data.name}" creado`);
      await loadGroups();
      setGroupFilter(data.id); // dejarlo seleccionado
      setIsGroupDialogOpen(false);
      setNewGroupName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear el grupo");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const resetToFirstPage = () => setPage(1);
  const resetPagesForFilters = () => setPage(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando directorio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-card-foreground">Publicadores</h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-medium tabular-nums">{filteredPublishers.length}</span>{" "}
            {filteredPublishers.length === 1 ? "publicador encontrado" : "publicadores encontrados"}
            {allPublishers.length !== filteredPublishers.length && (
              <span className="opacity-60"> de {allPublishers.length} total</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"
            onClick={() => { setNewGroupName(""); setIsGroupDialogOpen(true) }}
            className="border-border text-muted-foreground hover:text-card-foreground">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo grupo
          </Button>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Agregar publicador
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <PublisherFilters
        searchQuery={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); resetPagesForFilters(); }}
        genderFilter={genderFilter}
        onGenderFilterChange={(v) => { setGenderFilter(v); resetToFirstPage(); }}
        baptizedFilter={baptizedFilter}
        onBaptizedFilterChange={(v) => { setBaptizedFilter(v); resetToFirstPage(); }}
        pioneerFilter={pioneerFilter}
        onPioneerFilterChange={(v) => { setPioneerFilter(v); resetToFirstPage(); }}
        ministerialFilter={ministerialFilter}
        onMinisterialFilterChange={(v) => { setMinisterialFilter(v); resetToFirstPage(); }}
        elderFilter={elderFilter}
        onElderFilterChange={(v) => { setElderFilter(v); resetToFirstPage(); }}
        groups={groups}
        groupFilter={groupFilter}
        onGroupFilterChange={(v) => { setGroupFilter(v); resetToFirstPage(); }}
      />


      {/* Tabla o estado vacío */}
      {filteredPublishers.length === 0 ? (
        <div className="text-center py-16 bg-muted rounded-xl border-2 border-dashed border-border">
          <p className="text-muted-foreground mb-4">
            {allPublishers.length === 0
              ? "No hay publicadores registrados"
              : "No se encontraron publicadores con los filtros aplicados"}
          </p>
          {allPublishers.length === 0 && (
            <Button onClick={openCreateDialog} variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer publicador
            </Button>
          )}
        </div>
      ) : (
        <PublishersTable
          publishers={paginatedPublishers}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); resetToFirstPage(); }}
          onEdit={openEditDialog}
          onDeleteRequest={setDeleteConfirmId}
        />
      )}

      {/* Formulario crear/editar */}
      <PublisherFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        editingPublisher={editingPublisher}
        groups={groups}
        onSaved={() => { loadPublishers(); loadGroups(); }}
      />

      {/* Crear grupo */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Nuevo grupo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ingresá el nombre del grupo. Después podés asignarle publicadores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="groupName" className="text-foreground font-medium">Nombre del grupo</Label>
            <Input id="groupName" placeholder="Ej: Grupo 1" value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateGroup() }}
              disabled={isCreatingGroup}
              autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)} disabled={isCreatingGroup}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreatingGroup}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isCreatingGroup ? "Creando..." : "Crear grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Eliminar publicador</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. El publicador será eliminado del directorio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
