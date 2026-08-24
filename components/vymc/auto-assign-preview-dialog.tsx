"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Wand2 } from "lucide-react";
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
  SECTION_TITLES,
  ROLE_LABELS,
} from "@/components/vymc/week-display-config";

export type AutoAssignProposal = {
  key: string;
  kind: "special" | "assignment";
  publisherId: string;
  label?: string;
  field?: "presidentId" | "openingPrayerId";
  weekItemId?: string;
  itemTitle?: string;
  sectionType?: string;
  role?: string;
  publisherName: string;
};

export type AutoAssignPlanResponse = {
  proposals: AutoAssignProposal[];
  skipped: string[];
};

type AutoAssignPreviewDialogProps = {
  open: boolean;
  plan: AutoAssignPlanResponse | null;
  isApplying: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (selectedKeys: Set<string>) => void;
};

export function AutoAssignPreviewDialog({
  open,
  plan,
  isApplying,
  onOpenChange,
  onApply,
}: AutoAssignPreviewDialogProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const proposals = useMemo(() => plan?.proposals ?? [], [plan]);

  // Keep selection in sync when a new plan arrives
  const allKeys = useMemo(() => new Set(proposals.map((p) => p.key)), [proposals]);
  const effectiveSelection = useMemo(() => {
    const intersection = new Set(
      [...selectedKeys].filter((key) => allKeys.has(key))
    );
    return selectedKeys.size > 0 && intersection.size > 0
      ? intersection
      : allKeys;
  }, [selectedKeys, allKeys]);

  if (!open) return null;

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev.size === 0 ? allKeys : prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const grouped = new Map<string, AutoAssignProposal[]>();
  for (const proposal of proposals) {
    const groupLabel =
      proposal.kind === "special"
        ? "Presidencia y oración"
        : (SECTION_TITLES[proposal.sectionType ?? ""] ?? proposal.sectionType ?? "Otros");
    if (!grouped.has(groupLabel)) grouped.set(groupLabel, []);
    grouped.get(groupLabel)!.push(proposal);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedKeys(new Set());
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            Borrador de asignaciones automáticas
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Revisá las propuestas. Desmarcá lo que no quieras aplicar y luego
            confirmá.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {proposals.length === 0 && (
            <p className="text-sm text-muted-foreground/70 text-center py-6">
              No hay lugares vacíos para completar en esta semana.
            </p>
          )}

          {[...grouped.entries()].map(([groupLabel, groupProposals]) => (
            <div key={groupLabel} className="border border-border rounded-lg overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-white bg-primary px-3 py-1.5">
                {groupLabel}
              </p>
              <ul className="divide-y divide-border">
                {groupProposals.map((proposal) => {
                  const isChecked = effectiveSelection.has(proposal.key);
                  return (
                    <li key={proposal.key}>
                      <label className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleKey(proposal.key)}
                          disabled={isApplying}
                          className="w-4 h-4 accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {proposal.kind === "special"
                              ? proposal.label
                              : `${proposal.itemTitle}${proposal.role ? ` · ${ROLE_LABELS[proposal.role] ?? proposal.role}` : ""}`}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            → {proposal.publisherName}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {plan && plan.skipped.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">
                  Sin candidatos disponibles:
                </p>
                <p className="text-xs text-amber-700 mt-0.5">{plan.skipped.join(", ")}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedKeys(new Set());
              onOpenChange(false);
            }}
            disabled={isApplying}
            className="border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onApply(new Set(effectiveSelection))}
            disabled={proposals.length === 0 || effectiveSelection.size === 0 || isApplying}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : (
              `Aplicar ${effectiveSelection.size} ${
                effectiveSelection.size === 1 ? "asignación" : "asignaciones"
              }`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
