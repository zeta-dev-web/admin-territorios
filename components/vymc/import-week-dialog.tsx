"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatDateForDisplay,
  getNearestMonday,
  getWeekNumberForDate,
} from "@/components/vymc/week-display-config";

type ScrapeResult = {
  weekNumber: number;
  year: number;
  biblicalReading?: string | null;
  scrapedDate: string;
  sections?: Array<{
    sectionType?: string;
    title?: string;
    items?: Array<{
      title?: string;
      timeMinutes?: number | null;
    }>;
  }>;
};

type ImportWeekDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a week is successfully imported (e.g. to reload the list). */
  onImported: () => void;
};

export function ImportWeekDialog({ open, onOpenChange, onImported }: ImportWeekDialogProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(getNearestMonday(new Date()));
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset the dialog state every time it is opened
  useEffect(() => {
    if (open) {
      setSelectedDate(getNearestMonday(new Date()));
      setScrapeResult(null);
      setScrapeError(null);
    }
  }, [open]);

  const handleScrape = async () => {
    setIsScraping(true);
    setScrapeError(null);
    setScrapeResult(null);
    try {
      const createDate = selectedDate.toISOString().split("T")[0];
      const d = new Date(createDate + "T12:00:00Z");
      const wkNum = getWeekNumberForDate(d);
      const yr = d.getFullYear();

      const res = await fetch("/api/vymc/scraper/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekNumber: wkNum, year: yr }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al obtener programa");
      }
      const data = await res.json();
      setScrapeResult({ ...data, scrapedDate: createDate, weekNumber: wkNum, year: yr });
    } catch (err: any) {
      setScrapeError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = async () => {
    if (!scrapeResult) return;

    setIsSaving(true);
    try {
      const createDate = selectedDate.toISOString().split("T")[0];
      const d = new Date(createDate + "T12:00:00Z");
      const endDate = new Date(d);
      endDate.setDate(d.getDate() + 6);

      const res = await fetch("/api/vymc/weeks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber: scrapeResult.weekNumber,
          year: scrapeResult.year,
          startDate: createDate,
          endDate: endDate.toISOString().split("T")[0],
          biblicalReading: scrapeResult.biblicalReading,
          sections: scrapeResult.sections,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar la semana");
      }

      const savedWeek = await res.json();
      onOpenChange(false);
      setScrapeResult(null);
      setScrapeError(null);
      onImported();
      router.push(`/vymc/programas/${savedWeek.id}`);
    } catch (err: any) {
      setScrapeError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[80vh] overflow-y-auto p-4 sm:w-full sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Agregar Semana</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Elegí el lunes de la semana para importar el programa desde wol.jw.org.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date picker */}
          <div>
            <Label className="text-foreground font-medium">
              Lunes de la semana
            </Label>
            <div className="flex flex-col gap-3 mt-1.5 sm:flex-row sm:items-start">
              <div className="flex-1">
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => {
                    if (date) {
                      const monday = getNearestMonday(date);
                      setSelectedDate(monday);
                    }
                  }}
                  disabled={isScraping || isSaving}
                  placeholder="Seleccionar fecha"
                />
              </div>
              <Button
                onClick={handleScrape}
                disabled={isScraping || isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 w-full sm:w-auto"
              >
                {isScraping ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Obteniendo programa...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Obtener programa</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {new Intl.DateTimeFormat("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(selectedDate)}
            </p>
          </div>

          {/* Loading overlay */}
          {isScraping && !scrapeResult && !scrapeError && (
            <div className="flex flex-col items-center justify-center py-12 border border-border rounded-lg bg-muted">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-foreground/80 font-medium">Obteniendo programa...</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Scrapeando {formatDateForDisplay(selectedDate.toISOString().split("T")[0])}
              </p>
            </div>
          )}

          {scrapeResult && (
            <>
              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-card-foreground">
                      Preview — Semana {scrapeResult.weekNumber} de {scrapeResult.year}
                    </h4>
                    {scrapeResult.biblicalReading && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📖 Lectura bíblica: <span className="font-medium text-primary">{scrapeResult.biblicalReading}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-accent bg-accent/10 px-2 py-1 rounded-md font-medium">
                    {formatDateForDisplay(scrapeResult.scrapedDate)}
                  </span>
                </div>
                {scrapeResult.sections?.map((section, i) => (
                  <div key={i} className="border-l-4 border-primary pl-3">
                    <h5 className="font-medium text-primary text-sm uppercase tracking-wide">
                      {section.sectionType === "OPENING_PRAYER" ? "🔔 " : ""}
                      {section.sectionType === "TREASURES" ? "📖 " : ""}
                      {section.sectionType === "BE_BETTER_TEACHERS" ? "🎤 " : ""}
                      {section.sectionType === "CHRISTIAN_LIFE" ? "❤️ " : ""}
                      {section.title}
                    </h5>
                    <ul className="mt-2 space-y-1">
                      {section.items?.map((item, j) => (
                        <li key={j} className="text-sm text-foreground/80 flex items-start gap-2">
                          <div className="flex-1">
                            <span>{item.title}</span>
                            {item.timeMinutes && (
                              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">{item.timeMinutes} min</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {scrapeError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-800">{scrapeError}</p>
                </div>
              )}

              <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    setScrapeResult(null);
                    setScrapeError(null);
                  }}
                  disabled={isSaving}
                  className="border-border"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </div>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Guardar Programa</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
