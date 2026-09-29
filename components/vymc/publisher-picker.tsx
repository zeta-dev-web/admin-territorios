"use client";

import { useMemo, useState } from "react";
import { Check, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";

export type PickerPublisher = {
  id: string;
  firstName: string;
  lastName: string;
};

type PublisherPickerProps = {
  publishers: PickerPublisher[];
  value: string;
  onChange: (publisherId: string) => void;
  emptyMessage: string;
};

/* Buscador + lista de publicadores (reemplaza al select desplegable). */
export function PublisherPicker({
  publishers,
  value,
  onChange,
  emptyMessage,
}: PublisherPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return publishers;
    return publishers.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );
  }, [publishers, query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar publicador..."
          aria-label="Buscar publicador"
          className="pl-9"
        />
      </div>

      <div
        role="listbox"
        aria-label="Publicadores disponibles"
        className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border"
      >
        {query.trim() === "" ? (
          <p className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <Search className="h-4 w-4 shrink-0" />
            {publishers.length === 0
              ? emptyMessage
              : "Escribí para buscar un publicador"}
          </p>
        ) : (
          <>
            {filtered.map((p) => {
              const selected = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onChange(p.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors active:bg-accent/20 ${
                    selected
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-card-foreground hover:bg-accent/10"
                  }`}
                >
                  <span className="truncate">
                    {p.firstName} {p.lastName}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <SearchX className="h-4 w-4 shrink-0" />
                Sin resultados para esa búsqueda
              </p>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length}{" "}
        {filtered.length === 1 ? "publicador" : "publicadores"}
      </p>
    </div>
  );
}
