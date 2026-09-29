"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddingSectionState = {
  sectionId: string;
  sectionType: string;
  sectionTitle: string;
} | null;

type AddItemDialogProps = {
  addingSection: AddingSectionState;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (title: string, timeMinutes: number | null) => void;
};

export function AddItemDialog({
  addingSection,
  isSaving,
  error,
  onClose,
  onConfirm,
}: AddItemDialogProps) {
  const [title, setTitle] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");

  useEffect(() => {
    if (addingSection) {
      setTitle("");
      setTimeMinutes("");
    }
  }, [addingSection]);

  const handleConfirm = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const raw = timeMinutes.trim();
    const minutes = raw === "" ? null : Number(raw);
    onConfirm(trimmed, minutes);
  };

  return (
    <Dialog open={!!addingSection} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Agregar tema</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Título del tema</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Discurso especial: ..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">
              Minutos <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Ej. 10"
              inputMode="numeric"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="border-border justify-center">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!title.trim() || isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Agregar tema
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
