"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { VymcPublisher } from "./types";

type FormState = {
  firstName: string
  lastName: string
  phone: string
  gender: "MALE" | "FEMALE"
  isElder: boolean
  isMinisterialServant: boolean
  isPioneer: boolean
  isBaptized: boolean
  isConductor: boolean
  groupId: string
}

const EMPTY: FormState = {
  firstName: "", lastName: "", phone: "", gender: "MALE",
  isElder: false, isMinisterialServant: false, isPioneer: false,
  isBaptized: false, isConductor: false, groupId: "",
}

type Group = { id: string; name: string }

type PublisherFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPublisher: VymcPublisher | null
  groups: Group[]
  onSaved: () => void
}

export function PublisherFormDialog({
  open, onOpenChange, editingPublisher, groups, onSaved,
}: PublisherFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resetear el formulario cada vez que se abre para crear o editar
  useEffect(() => {
    if (!open) return
    if (editingPublisher) {
      setForm({
        firstName: editingPublisher.firstName,
        lastName: editingPublisher.lastName,
        phone: editingPublisher.phone || "",
        gender: editingPublisher.gender,
        isElder: editingPublisher.isElder,
        isMinisterialServant: editingPublisher.isMinisterialServant,
        isPioneer: editingPublisher.isPioneer,
        isBaptized: editingPublisher.isBaptized,
        isConductor: editingPublisher.isConductor ?? false,
        groupId: editingPublisher.groupId || "",
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editingPublisher])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("El nombre y el apellido son requeridos")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
        gender: form.gender,
        isElder: form.isElder,
        isMinisterialServant: form.isMinisterialServant,
        isPioneer: form.isPioneer,
        isBaptized: form.isBaptized,
        isConductor: form.isConductor,
        groupId: form.groupId || null,
      }

      const response = editingPublisher
        ? await fetch(`/api/vymc/publishers/${editingPublisher.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/vymc/publishers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al guardar el publicador")
      }

      toast.success(editingPublisher ? "Publicador actualizado correctamente" : "Publicador creado correctamente")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsSubmitting(false)
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {editingPublisher ? "Editar publicador" : "Nuevo publicador"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingPublisher
              ? "Actualiza la información del publicador"
              : "Completa los datos del nuevo publicador"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-foreground font-medium">Nombre</Label>
              <Input id="firstName" placeholder="Juan" value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                disabled={isSubmitting}
                className="border-border focus:border-ring focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-foreground font-medium">Apellido</Label>
              <Input id="lastName" placeholder="Pérez" value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                disabled={isSubmitting}
                className="border-border focus:border-ring focus:ring-ring" />
            </div>
          </div>

          {/* Grupo */}
          <div className="space-y-1.5">
            <Label htmlFor="group" className="text-foreground font-medium flex items-center gap-1.5">
              Grupo
            </Label>
            <Select value={form.groupId || "__none__"}
              onValueChange={(v) => set("groupId", v === "__none__" ? "" : v)}
              disabled={isSubmitting}>
              <SelectTrigger className="border-border focus:border-ring focus:ring-ring">
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin grupo</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Teléfono / WhatsApp (Opcional)
            </Label>
            <Input id="phone" placeholder="Ej: +54 9 381 123-4567" {...{ value: form.phone }}
              onChange={(e) => set("phone", e.target.value)}
              disabled={isSubmitting}
              className="border-border focus:border-ring focus:ring-ring" />
            <p className="text-[11px] text-muted-foreground">
              Formato con código de país/área para enviar recordatorios por WhatsApp.
            </p>
          </div>

          {/* Género */}
          <div className="space-y-1.5">
            <Label className="text-foreground font-medium">Género</Label>
            <Select value={form.gender}
              onValueChange={(v) => set("gender", v as "MALE" | "FEMALE")}
              disabled={isSubmitting}>
              <SelectTrigger className="border-border focus:border-ring focus:ring-ring">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Hermano</SelectItem>
                <SelectItem value="FEMALE">Hermana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Flags */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="isBaptized" className="text-foreground">Bautizado</Label>
              <Switch id="isBaptized" checked={form.isBaptized}
                onCheckedChange={(c) => set("isBaptized", c)} disabled={isSubmitting} />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="isPioneer" className="text-foreground">Precursor</Label>
              <Switch id="isPioneer" checked={form.isPioneer}
                onCheckedChange={(c) => set("isPioneer", c)} disabled={isSubmitting} />
            </div>
            {form.gender === "MALE" && (
              <>
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="isMinisterialServant" className="text-foreground">Siervo Ministerial</Label>
                  <Switch id="isMinisterialServant" checked={form.isMinisterialServant}
                    onCheckedChange={(c) => set("isMinisterialServant", c)} disabled={isSubmitting} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="isElder" className="text-foreground">Anciano</Label>
                  <Switch id="isElder" checked={form.isElder}
                    onCheckedChange={(c) => set("isElder", c)} disabled={isSubmitting} />
                </div>
              </>
            )}
            {/* Capacidad de conductor de territorio (integra con el módulo Territorios) */}
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="isConductor" className="text-foreground">Conductor de territorio</Label>
              <Switch id="isConductor" checked={form.isConductor}
                onCheckedChange={(c) => set("isConductor", c)} disabled={isSubmitting} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
              disabled={isSubmitting} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSubmitting ? "Guardando..." : editingPublisher ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
