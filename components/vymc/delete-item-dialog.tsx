"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WeekItem } from "@/types/week-detail";

type DeleteItemDialogProps = {
  item: WeekItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteItemDialog({ item, isDeleting, onClose, onConfirm }: DeleteItemDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Eliminar tema
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Se eliminará{" "}
            <span className="font-medium text-foreground/80">
              &ldquo;{item?.title || ""}&rdquo;
            </span>
            {item && item.assignments.length > 0 && (
              <> junto con sus {item.assignments.length} {item.assignments.length === 1 ? "asignación" : "asignaciones"}</>
            )}
            . Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="border-border justify-center">
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="justify-center">
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
