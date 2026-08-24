"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  AlertCircle,
  CalendarDays,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImportWeekDialog } from "@/components/vymc/import-week-dialog";
import { ExportWeekDialog } from "@/components/vymc/export-dialog";
import { BulkSendDialog } from "@/components/vymc/bulk-send-dialog";
import { WeeksTable } from "@/components/vymc/weeks-table";
import { getNearestMonday } from "@/components/vymc/week-display-config";
import type { WeekSummary } from "@/types/week-detail";

export default function WeeksPage() {
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isBulkSendDialogOpen, setIsBulkSendDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [isExportingHistory, setIsExportingHistory] = useState(false);

  const loadWeeks = async () => {
    try {
      setError(null);
      const response = await fetch("/api/vymc/weeks");
      if (!response.ok) throw new Error("Error al cargar semanas");
      const data = await response.json();
      setWeeks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/vymc/weeks");
        if (!response.ok) throw new Error("Error al cargar semanas");
        const data = await response.json();
        if (!cancelled) setWeeks(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/vymc/weeks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar semana");
      }

      setDeleteConfirmId(null);
      loadWeeks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleExportHistory = async () => {
    setIsExportingHistory(true);
    try {
      const response = await fetch("/api/vymc/weeks/export-history");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al exportar el historial");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial-asignaciones-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsExportingHistory(false);
    }
  };

  // Get unique years for filter
  const years = [...new Set(weeks.map((w) => w.year))].sort((a, b) => b - a);

  // Filter weeks
  const filteredWeeks = weeks.filter((week) => {
    if (yearFilter !== "all" && week.year !== parseInt(yearFilter)) return false;

    // If a date is selected, find the Monday of that week and match
    if (searchDate) {
      const selectedDate = new Date(searchDate + "T12:00:00Z");
      const monday = getNearestMonday(selectedDate);
      const mondayStr = monday.toISOString().split("T")[0];

      // Compare startDate directly (both should be in YYYY-MM-DD format)
      const weekStartDate = week.startDate.split("T")[0]; // Handle if it has time
      return weekStartDate === mondayStr;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando programas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-card-foreground">
            Programas Semanales
          </h1>
          <p className="text-muted-foreground mt-1">
            {weeks.length > 0 ? (
              <>
                <span className="font-medium tabular-nums">{weeks.length}</span>{" "}
                {weeks.length === 1 ? "semana registrada" : "semanas registradas"}
              </>
            ) : (
              "Gestiona las reuniones de la congregación"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {weeks.length > 0 && (
            <>
              <Button
                onClick={() => setIsExportDialogOpen(true)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button
                onClick={handleExportHistory}
                disabled={isExportingHistory}
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-white"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Historial Excel
              </Button>
              <Button
                onClick={() => setIsBulkSendDialogOpen(true)}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Asignaciones
              </Button>
            </>
          )}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Semana
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      {weeks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              type="date"
              placeholder="Buscar por fecha..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="pl-10 border-border focus:border-ring focus:ring-ring"
            />
            {searchDate && (
              <button
                onClick={() => setSearchDate("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground hover:text-white hover:bg-primary bg-card pl-2 pr-2 py-1 rounded transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Borrar búsqueda</span>
              </button>
            )}
          </div>
          {years.length > 1 && (
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-10 w-full min-w-[150px] px-3 pr-8 rounded-md border border-border bg-card text-sm text-foreground/80 appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
              >
                <option value="all">Todos los años</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* Table or Empty State */}
      {weeks.length === 0 ? (
        <div className="text-center py-20 bg-muted/40 rounded-xl border-2 border-dashed border-border">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No hay programas semanales
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crea tu primera semana para comenzar a gestionar las asignaciones de
            las reuniones.
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear primera semana
          </Button>
        </div>
      ) : (
        <WeeksTable
          weeks={filteredWeeks}
          onDeleteWeek={(weekId) => setDeleteConfirmId(weekId)}
        />
      )}

      {/* Create Week Dialog */}
      <ImportWeekDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onImported={loadWeeks}
      />

      {/* Export PDF Dialog */}
      <ExportWeekDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        weeks={weeks}
      />

      {/* Bulk WhatsApp Send Dialog */}
      <BulkSendDialog
        open={isBulkSendDialogOpen}
        onOpenChange={setIsBulkSendDialogOpen}
        years={years}
      />


      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              Eliminar semana
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Se eliminará la semana con todas
              sus secciones, elementos y asignaciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
