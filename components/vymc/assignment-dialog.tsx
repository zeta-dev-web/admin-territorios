"use client";

import { AlertCircle, Loader2, UserPlus, Users } from "lucide-react";
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
import { ROLE_LABELS } from "@/components/vymc/week-display-config";
import { getEligibilityDescription } from "@/lib/assignment-eligibility";
import type { AssigningItemState } from "@/types/week-detail";

type AssignmentDialogProps = {
  assigningItem: AssigningItemState | null;
  selectedRole: string;
  eligiblePublishers: Array<{ id: string; firstName: string; lastName: string }>;
  selectedPublisherId: string;
  onPublisherChange: (publisherId: string) => void;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function AssignmentDialog({
  assigningItem,
  selectedRole,
  eligiblePublishers,
  selectedPublisherId,
  onPublisherChange,
  isLoading,
  error,
  onClose,
  onConfirm,
}: AssignmentDialogProps) {
  const roleLabel =
    selectedRole && ROLE_LABELS[selectedRole]
      ? ROLE_LABELS[selectedRole].toLowerCase()
      : "publicador";

  return (
    <Dialog open={!!assigningItem} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Asignar {roleLabel}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Seleccioná el {roleLabel} para{" "}
            <span className="font-medium text-foreground/80">
              {assigningItem?.item.title || ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Publisher selector */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Publicador</Label>
            <p className="text-xs text-muted-foreground">
              {getEligibilityDescription({
                sectionType: assigningItem?.sectionType ?? "",
                itemType: assigningItem?.item.itemType,
                role: selectedRole,
              })}
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
                    No hay publicadores disponibles
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

          {assigningItem?.item.requiresStudentHelper && (
            <div className="flex items-center gap-2 text-xs text-accent bg-accent/5 rounded-lg p-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>
                Este elemento requiere un Estudiante y un Ayudante. Asignalos
                por separado.
              </span>
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
            disabled={!selectedPublisherId || !selectedRole || isLoading}
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
