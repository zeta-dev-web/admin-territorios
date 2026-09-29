"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PendingAssignment = {
  role: string;
};

type PendingItem = {
  id: string;
  title: string;
  itemType: string;
  order: number;
  timeMinutes: number | null;
  songNumber: number | null;
  requiresStudentHelper: boolean;
  assignments: PendingAssignment[];
};

type PendingSection = {
  id: string;
  sectionType: string;
  order: number;
  items: PendingItem[];
};

type PendingWeek = {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  biblicalReading: string | null;
  presidentId: string | null;
  openingPrayerId: string | null;
  sections: PendingSection[];
};

type VymcPublisher = {
  id: string;
  firstName: string;
  lastName: string;
  group?: { name: string } | null;
  isElder: boolean;
  isMinisterialServant: boolean;
  isPioneer: boolean;
};

/** Roles que debería tener un tema menos los ya cubiertos. */
function countMissingRoles(
  sectionType: string,
  item: Pick<PendingItem, "itemType" | "title" | "requiresStudentHelper" | "assignments">
): number {
  const taken = new Set(item.assignments.map((a) => a.role));
  let expected: string[];
  if (sectionType === "BE_BETTER_TEACHERS") {
    expected = item.itemType === "SPEECH" ? ["ASSIGNEE"] : ["ASSIGNEE", "HELPER"];
  } else if (sectionType === "CHRISTIAN_LIFE") {
    const lower = item.title.toLowerCase();
    expected =
      lower.includes("estudio bíblico") || lower.includes("estudio biblico")
        ? ["CONDUCTOR", "READER"]
        : ["ASSIGNEE"];
  } else {
    expected = ["ASSIGNEE"];
  }
  return expected.filter((r) => !taken.has(r)).length;
}

function isSkippedItem(sectionType: string, item: PendingItem): boolean {
  if (item.songNumber && !item.timeMinutes) return true;
  const lower = item.title.toLowerCase();
  if (
    lower.includes("palabras de introducción") ||
    lower.includes("palabras de conclusión")
  )
    return true;
  return sectionType === "PRESIDENT" || sectionType === "OPENING_PRAYER";
}

function countWeekPending(week: PendingWeek): number {
  let count = 0;
  if (!week.presidentId) count += 1;
  if (!week.openingPrayerId) count += 1;
  for (const section of week.sections) {
    for (const item of section.items) {
      if (isSkippedItem(section.sectionType, item)) continue;
      count += countMissingRoles(section.sectionType, item);
    }
  }
  return count;
}

function formatMonthTitle(date: Date): string {
  const label = date.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function VymcHomePage() {
  const [weeks, setWeeks] = useState<PendingWeek[]>([]);
  const [publishers, setPublishers] = useState<VymcPublisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [weeksRes, pubRes] = await Promise.all([
          fetch("/api/vymc/weeks/pending"),
          fetch("/api/vymc/publishers"),
        ]);
        if (weeksRes.ok && !cancelled) setWeeks(await weeksRes.json());
        if (pubRes.ok && !cancelled) setPublishers(await pubRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
    const nextDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const nextKey = `${nextDate.getUTCFullYear()}-${nextDate.getUTCMonth()}`;

    let currentPending = 0;
    let nextPending = 0;
    let currentWeeks = 0;
    let nextWeeks = 0;
    for (const week of weeks) {
      const d = new Date(week.startDate);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      if (key === currentKey) {
        currentPending += countWeekPending(week);
        currentWeeks += 1;
      } else if (key === nextKey) {
        nextPending += countWeekPending(week);
        nextWeeks += 1;
      }
    }

    const elders = publishers.filter((p) => p.isElder).length;
    const servants = publishers.filter((p) => p.isMinisterialServant).length;
    const pioneers = publishers.filter((p) => p.isPioneer).length;

    return {
      currentPending,
      nextPending,
      currentWeeks,
      nextWeeks,
      currentTitle: formatMonthTitle(now),
      nextTitle: formatMonthTitle(nextDate),
      totalPublishers: publishers.length,
      elders,
      servants,
      pioneers,
    };
  }, [weeks, publishers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Cargando resumen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-card-foreground">Resumen</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asignaciones pendientes */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                Asignaciones pendientes
              </h2>
              <p className="text-sm text-muted-foreground">Partes sin asignar</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/vymc/programas"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Este mes · {stats.currentTitle}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {stats.currentWeeks}{" "}
                  {stats.currentWeeks === 1 ? "semana" : "semanas"} en el mes
                </p>
              </div>
              <p className="text-3xl font-bold text-amber-500 tabular-nums">
                {stats.currentPending}
              </p>
            </Link>

            <Link
              href="/vymc/programas"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Próximo mes · {stats.nextTitle}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {stats.nextWeeks}{" "}
                  {stats.nextWeeks === 1 ? "semana" : "semanas"} en el mes
                </p>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.nextPending}
              </p>
            </Link>
          </div>

          <Link href="/vymc/programas">
            <Button className="w-full">
              Ver programas
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Publicadores */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                Publicadores
              </h2>
              <p className="text-sm text-muted-foreground">Directorio</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.totalPublishers}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-border text-center">
                <p className="text-2xl font-bold text-card-foreground tabular-nums">
                  {stats.elders}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ancianos</p>
              </div>
              <div className="p-4 rounded-lg border border-border text-center">
                <p className="text-2xl font-bold text-card-foreground tabular-nums">
                  {stats.servants}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Siervos ministeriales</p>
              </div>
              <div className="p-4 rounded-lg border border-border text-center">
                <p className="text-2xl font-bold text-card-foreground tabular-nums">
                  {stats.pioneers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Precursores regulares</p>
              </div>
            </div>
          </div>

          <Link href="/vymc/publicadores">
            <Button variant="outline" className="w-full">
              Ver publicadores
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
