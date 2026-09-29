"use client";

import { useState } from "react";
import { useSession } from '@/lib/vymc-session';
import toast from "react-hot-toast";
import { CheckCircle2, ChevronDown, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatWeekRangeLabel } from "@/components/vymc/week-display-config";
import type { WeekSummary } from "@/types/week-detail";

type ExportWeekDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeks: WeekSummary[];
};

function getMonthYear(startDateStr: string): string {
  const date = new Date(startDateStr);
  return `${date.toLocaleDateString("es-ES", { timeZone: "UTC", month: "long", year: "numeric" })}`;
}

export function ExportWeekDialog({ open, onOpenChange, weeks }: ExportWeekDialogProps) {
  const { data: session } = useSession();
  const [selectedWeekIds, setSelectedWeekIds] = useState<Set<string>>(new Set());
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportMonthFilter, setExportMonthFilter] = useState<string>("all");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedWeekIds(new Set());
      setExportMonthFilter("all");
    }
    onOpenChange(nextOpen);
  };

  const handleExportPDF = async () => {
    if (selectedWeekIds.size === 0) return;
    if (!session?.user) return;

    setIsExportingPDF(true);
    try {
      const congregationId = session.user.congregationId;

      const response = await fetch("/api/vymc/weeks/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekIds: Array.from(selectedWeekIds),
          congregationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `programas-semanas-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      handleOpenChange(false);
      toast.success("PDF exportado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportImages = async () => {
    if (selectedWeekIds.size === 0) return;
    if (!session?.user) return;

    setIsExportingImages(true);
    try {
      const congregationId = session.user.congregationId;

      const response = await fetch("/api/vymc/weeks/export-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekIds: Array.from(selectedWeekIds),
          congregationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar imágenes");
      }

      const zipBlob = await response.blob();
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `programas-semanas-${new Date().toISOString().split("T")[0]}-imagenes.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      handleOpenChange(false);
      toast.success("Imágenes exportadas correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar imágenes");
    } finally {
      setIsExportingImages(false);
    }
  };

  const toggleWeekSelection = (weekId: string) => {
    const newSelection = new Set(selectedWeekIds);
    if (newSelection.has(weekId)) {
      newSelection.delete(weekId);
    } else {
      newSelection.add(weekId);
    }
    setSelectedWeekIds(newSelection);
  };

  const selectAllVisibleWeeks = () => {
    const weeksToSelect = weeks
      .filter(week => {
        if (exportMonthFilter === "all") return true;
        return getMonthYear(week.startDate) === exportMonthFilter;
      })
      .map(w => w.id);
    setSelectedWeekIds(new Set(weeksToSelect));
  };

  const deselectAllWeeks = () => {
    setSelectedWeekIds(new Set());
  };

  // Unique months from weeks, most recent first
  const monthsSet = new Set<string>();
  weeks.forEach(week => {
    monthsSet.add(getMonthYear(week.startDate));
  });
  const availableMonths = Array.from(monthsSet).sort((a, b) => {
    const [monthA, yearA] = a.split(" de ");
    const [monthB, yearB] = b.split(" de ");
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateB.getTime() - dateA.getTime();
  });

  const weeksToShow = weeks
    .filter(week => {
      if (exportMonthFilter === "all") return true;
      return getMonthYear(week.startDate) === exportMonthFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl sm:max-w-2xl overflow-y-auto p-4 sm:p-6 lg:p-7">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Descargar Semanas</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Seleccioná las semanas que querés descargar en formato PDF o Imágenes (S-140-S).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month Filter */}
          <div className="relative">
            <select
              value={exportMonthFilter}
              onChange={(e) => setExportMonthFilter(e.target.value)}
              className="h-10 w-full px-3 pr-8 rounded-md border border-border bg-card text-sm text-foreground/80 appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
            >
              <option value="all">Todos los meses</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
          </div>

          {/* Select All / Deselect All */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              onClick={selectAllVisibleWeeks}
              variant="outline"
              size="sm"
              className="w-full text-xs sm:w-auto"
            >
              Seleccionar todas
            </Button>
            <Button
              type="button"
              onClick={deselectAllWeeks}
              variant="outline"
              size="sm"
              className="w-full text-xs sm:w-auto"
            >
              Deseleccionar todas
            </Button>
            <div className="text-xs text-muted-foreground sm:ml-auto sm:text-sm">
              {selectedWeekIds.size} {selectedWeekIds.size === 1 ? "semana seleccionada" : "semanas seleccionadas"}
            </div>
          </div>

          {/* Weeks List */}
          <div className="border border-border rounded-lg divide-y divide-border max-h-[400px] overflow-y-auto">
            {weeksToShow.map((week) => {
              const { startDay, endDay, month } = formatWeekRangeLabel(week.startDate, week.endDate);
              const isSelected = selectedWeekIds.has(week.id);

              return (
                <div
                  key={week.id}
                  onClick={() => toggleWeekSelection(week.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/10 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground text-sm">
                      Semana del {startDay}-{endDay} de {month}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleOpenChange(false);
            }}
            disabled={isExportingPDF || isExportingImages}
            className="min-h-11 border-border justify-center sm:min-w-24"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExportImages}
            disabled={selectedWeekIds.size === 0 || isExportingPDF || isExportingImages}
            variant="outline"
            className="min-h-11 border-primary text-primary hover:bg-primary hover:text-white justify-center"
          >
            {isExportingImages ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando imágenes...
              </div>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Descargar Imágenes
              </>
            )}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={selectedWeekIds.size === 0 || isExportingPDF || isExportingImages}
            className="min-h-11 bg-primary hover:bg-primary/90 text-primary-foreground justify-center"
          >
            {isExportingPDF ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando PDF...
              </div>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
