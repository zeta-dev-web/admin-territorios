"use client";

import {
  Award, ChevronLeft, ChevronRight, MessageCircle, Pencil,
  Shield, Trash2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { VymcPublisher } from "./types";

type PublishersTableProps = {
  publishers: VymcPublisher[];
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (next: (current: number) => number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (publisher: VymcPublisher) => void;
  onDeleteRequest: (id: string) => void;
};

function WhatsAppLink({ phone, compact }: { phone: string; compact?: boolean }) {
  return (
    <a
      href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? "inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded"
          : "inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors"
      }
      title="Abrir chat de WhatsApp"
    >
      <MessageCircle className={compact ? "w-3 h-3" : "w-3.5 h-3.5 text-emerald-600"} />
      {phone}
    </a>
  );
}

export function PublishersTable({
  publishers, page, totalPages, pageSize,
  onPageChange, onPageSizeChange, onEdit, onDeleteRequest,
}: PublishersTableProps) {
  if (publishers.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground/80 font-medium">Nombre</TableHead>
              <TableHead className="text-foreground/80 font-medium">Grupo</TableHead>
              <TableHead className="text-foreground/80 font-medium">Teléfono / WhatsApp</TableHead>
              <TableHead className="text-foreground/80 font-medium">Género</TableHead>
              <TableHead className="text-foreground/80 font-medium">Nombramientos</TableHead>
              <TableHead className="text-foreground/80 font-medium">Estado</TableHead>
              <TableHead className="text-right text-foreground/80 font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishers.map((p) => (
              <TableRow key={p.id} className="border-border">
                <TableCell className="font-medium text-card-foreground">
                  {p.firstName} {p.lastName}
                </TableCell>
                <TableCell>
                  {p.group?.name ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" />{p.group.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/70 italic">Sin grupo</span>
                  )}
                </TableCell>
                <TableCell>
                  {p.phone ? <WhatsAppLink phone={p.phone} /> : <span className="text-xs text-muted-foreground/70 italic">Sin registrar</span>}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.gender === "MALE" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  }`}>
                    {p.gender === "MALE" ? "Hermano" : "Hermana"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5 flex-wrap">
                    {p.isElder && (
                      <Badge variant="outline" className="flex items-center gap-1 border-primary text-primary">
                        <Shield className="w-3 h-3" />Anciano
                      </Badge>
                    )}
                    {p.isMinisterialServant && (
                      <Badge variant="outline" className="border-ring text-ring">Siervo Ministerial</Badge>
                    )}
                    {!p.isElder && !p.isMinisterialServant && <span className="text-sm text-muted-foreground/70">—</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5 flex-wrap">
                    {p.isPioneer && (
                      <Badge variant="outline" className="flex items-center gap-1 border-accent text-accent">
                        <Award className="w-3 h-3" />Precursor
                      </Badge>
                    )}
                    {p.isBaptized && (
                      <Badge variant="outline" className="border-muted-foreground/60 text-muted-foreground">Bautizado</Badge>
                    )}
                    {p.isConductor && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">Conductor</Badge>
                    )}
                    {!p.isPioneer && !p.isBaptized && !p.isConductor && <span className="text-sm text-muted-foreground/70">—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(p)}
                      className="hover:bg-ring/10 hover:text-ring">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteRequest(p.id)}
                      className="hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-3 md:hidden">
        {publishers.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-muted p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-card-foreground">{p.firstName} {p.lastName}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{p.gender === "MALE" ? "Hermano" : "Hermana"}</span>
                  {p.group?.name && <span className="text-xs text-slate-500">· {p.group.name}</span>}
                  {p.phone && <WhatsAppLink phone={p.phone} compact />}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(p)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onDeleteRequest(p.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.isConductor && <Badge variant="outline" className="border-amber-500 text-amber-600">Conductor</Badge>}
              {p.isElder && <Badge variant="outline" className="border-primary text-primary">Anciano</Badge>}
              {p.isMinisterialServant && <Badge variant="outline" className="border-ring text-ring">Siervo ministerial</Badge>}
              {p.isPioneer && <Badge variant="outline" className="border-accent text-accent">Precursor</Badge>}
              {p.isBaptized && <Badge variant="outline" className="border-muted-foreground/60 text-muted-foreground">Bautizado</Badge>}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange((c) => c - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange((c) => c + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
