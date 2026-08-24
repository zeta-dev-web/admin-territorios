"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { FilterValue } from "./types";

type Props = {
  searchQuery: string; onSearchChange: (v: string) => void;
  genderFilter: string; onGenderFilterChange: (v: string) => void;
  baptizedFilter: string; onBaptizedFilterChange: (v: string) => void;
  pioneerFilter: string; onPioneerFilterChange: (v: string) => void;
  ministerialFilter: string; onMinisterialFilterChange: (v: string) => void;
  elderFilter: string; onElderFilterChange: (v: string) => void;
  groups: Array<{ id: string; name: string }>;
  groupFilter: string; onGroupFilterChange: (v: string) => void;
};

export function PublisherFilters(p: Props) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <div className="relative xl:col-span-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
        <Input type="text" placeholder="Buscar por nombre o teléfono..."
          value={p.searchQuery} onChange={(e) => p.onSearchChange(e.target.value)}
          className="pl-10" />
      </div>
      <Select value={p.genderFilter} onValueChange={p.onGenderFilterChange}>
        <SelectTrigger><SelectValue placeholder="Género" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los géneros</SelectItem>
          <SelectItem value="MALE">Hermano</SelectItem>
          <SelectItem value="FEMALE">Hermana</SelectItem>
        </SelectContent>
      </Select>
      <Select value={p.baptizedFilter} onValueChange={p.onBaptizedFilterChange}>
        <SelectTrigger><SelectValue placeholder="Bautismo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Bautismo: todos</SelectItem>
          <SelectItem value="true">Bautizado</SelectItem>
          <SelectItem value="false">No bautizado</SelectItem>
        </SelectContent>
      </Select>
      <Select value={p.pioneerFilter} onValueChange={p.onPioneerFilterChange}>
        <SelectTrigger><SelectValue placeholder="Precursor" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Precursor: todos</SelectItem>
          <SelectItem value="true">Precursor</SelectItem>
          <SelectItem value="false">No precursor</SelectItem>
        </SelectContent>
      </Select>
      <Select value={p.ministerialFilter} onValueChange={p.onMinisterialFilterChange}>
        <SelectTrigger><SelectValue placeholder="Ministerial" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Ministerial: todos</SelectItem>
          <SelectItem value="true">Siervo ministerial</SelectItem>
          <SelectItem value="false">No ministerial</SelectItem>
        </SelectContent>
      </Select>
      <Select value={p.elderFilter} onValueChange={p.onElderFilterChange}>
        <SelectTrigger><SelectValue placeholder="Anciano" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Anciano: todos</SelectItem>
          <SelectItem value="true">Anciano</SelectItem>
          <SelectItem value="false">No anciano</SelectItem>
        </SelectContent>
      </Select>
      <Select value={p.groupFilter} onValueChange={p.onGroupFilterChange}>
        <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Grupo: todos</SelectItem>
          <SelectItem value="__none__">Sin grupo</SelectItem>
          {p.groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
