"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PublisherPicker } from "@/components/vymc/publisher-picker";
import type { SpecialAssignType } from "@/types/week-detail";

type SpecialAssignmentDialogProps = {
  type: SpecialAssignType | null;
  eligiblePublishers: Array<{ id: string; firstName: string; lastName: string }>;
  selectedPublisherId: string;
  onPublisherChange: (publisherId: string) => void;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function SpecialAssignmentDialog({
  type,
  eligiblePublishers,
  selectedPublisherId,
  onPublisherChange,
  isLoading,
  error,
  onClose,
  onConfirm,
}: SpecialAssignmentDialogProps) {
  return (
    <Dialog open={!!type} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Asignar {type === "president" ? "presidente" : "oración de apertura"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Publisher selector */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Publicador</Label>
            <p className="text-xs text-muted-foreground">
              Solo ancianos o siervos ministeriales
            </p>
            <PublisherPicker
              key={type ?? "none"}
              publishers={eligiblePublishers}
              value={selectedPublisherId}
              onChange={onPublisherChange}
              emptyMessage="No hay hermanos disponibles"
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border justify-center"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedPublisherId || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              "Asignar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
