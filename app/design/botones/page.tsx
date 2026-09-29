"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Página temporal de previsualización del Button refinado.
 * Comparar ANTES (clases viejas) vs DESPUÉS (variantes nuevas).
 * Borrar cuando se apruebe el diseño.
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function BotonesPreviewPage() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="vymc-theme rounded-2xl p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-card-foreground">
          Botones — antes / después
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Página temporal de comparación. Misma API (<code>variant</code> +{" "}
          <code>size</code>), estética minimalista refinada.
        </p>
      </div>

      <Section
        title="1. Comparación directa"
        hint="Izquierda: estilo anterior. Derecha: estilo nuevo."
      >
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">ANTES</span>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Agregar publicador
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">DESPUÉS</span>
          <Button>
            <Plus className="w-4 h-4" />
            Agregar publicador
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">ANTES</span>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
            Filtros
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">DESPUÉS</span>
          <Button variant="outline">Filtros</Button>
        </div>
      </Section>

      <Section
        title="2. Variantes"
        hint="Nueva variante soft para acciones secundarias con acento del módulo."
      >
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="soft">
          <Check className="w-4 h-4" />
          Soft
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">
          <Trash2 className="w-4 h-4" />
          Eliminar
        </Button>
        <Button variant="link">Link</Button>
      </Section>

      <Section
        title="3. Tamaños"
        hint="icon-lg nuevo de 44px para uso táctil."
      >
        <Button size="sm">Pequeño</Button>
        <Button>Normal (h-10)</Button>
        <Button size="lg">Grande</Button>
        <Button size="icon" variant="outline" aria-label="Editar">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button size="icon-lg" variant="outline" aria-label="Editar táctil">
          <Pencil className="w-5 h-5" />
        </Button>
      </Section>

      <Section
        title="4. Ejemplo real: botón Filtros + orden"
        hint="Tal como quedaría en Publicadores."
      >
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="flex-1"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground">
              2
            </span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </Section>
    </div>
  );
}
