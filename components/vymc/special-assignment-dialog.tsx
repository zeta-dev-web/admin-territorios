"use client";

import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Asignar {type === "president" ? "presidente" : "oración de apertura"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Seleccioná el publicador para{" "}
            {type === "president" ? "presidir" : "dar la oración de apertura"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Publisher selector */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Publicador</Label>
            <p className="text-xs text-muted-foreground">
              Solo ancianos o siervos ministeriales
            </p>
            <Select value={selectedPublisherId} onValueChange={onPublisherChange}>
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Seleccionar publicador" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {eligiblePublishers.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="bg-card hover:bg-gray-100">
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
                {eligiblePublishers.length === 0 && (
                  <SelectItem value="__none__" disabled className="bg-card">
                    No hay hermanos disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedPublisherId || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Asignar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
