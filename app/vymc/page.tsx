"use client";

import { useEffect, useState } from "react";
import { useSession } from '@/lib/vymc-session';
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Download,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { useCongregation } from "@/contexts/congregation-context";
import { formatCongregationName } from "@/lib/format-congregation";
import { formatDateRange } from "@/components/vymc/week-display-config";
import type { DashboardStats } from "@/types/dashboard.types";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "hace instantes";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { congregationName } = useCongregation();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/vymc/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al cargar estadísticas");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totals = stats?.totals;
  const month = stats?.month;
  const nextMeeting = stats?.nextMeeting;
  const hasMissingParts =
    nextMeeting && nextMeeting.assignedParts < nextMeeting.totalParts;
  const missingCount = nextMeeting
    ? nextMeeting.totalParts - nextMeeting.assignedParts
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#1A365D] to-primary rounded-xl p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm mb-2">Bienvenido de vuelta</p>
            <h1 className="text-3xl font-semibold mb-1">
              {session?.user.name}
            </h1>
            <p className="text-white/80">
              {formatCongregationName(congregationName)}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-accent rounded-full text-sm font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-card rounded-full"></div>
            Sistema activo
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-5 h-5 text-white/80" />
              <span className="text-2xl font-semibold tabular-nums">
                {totals ? totals.publishers : "—"}
              </span>
            </div>
            <p className="text-white/90 font-medium">Publicadores</p>
            <p className="text-white/60 text-sm mt-0.5">
              {totals
                ? `${totals.elders} ancianos · ${totals.ministerialServants} siervos · ${totals.pioneers} precursores`
                : "En el directorio"}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-5 h-5 text-white/80" />
              <span className="text-2xl font-semibold tabular-nums">
                {totals ? totals.weeks : "—"}
              </span>
            </div>
            <p className="text-white/90 font-medium">Semanas</p>
            <p className="text-white/60 text-sm mt-0.5">Programadas</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <ClipboardCheck className="w-5 h-5 text-white/80" />
              <span className="text-2xl font-semibold tabular-nums">
                {month ? `${month.completionPercentage}%` : "—"}
              </span>
            </div>
            <p className="text-white/90 font-medium">Asignaciones</p>
            <p className="text-white/60 text-sm mt-0.5 capitalize">
              {month
                ? `${month.assignedParts}/${month.totalParts} partes · ${month.label}`
                : "Este mes"}
            </p>
          </div>
        </div>
      </div>

      {/* Next Meeting Alert */}
      {nextMeeting &&
        (hasMissingParts ? (
          <Link href={`/vymc/programas/${nextMeeting.weekId}`} className="block group">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-amber-400 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-amber-900">
                  Reunión próxima con {missingCount}{" "}
                  {missingCount === 1 ? "parte sin asignar" : "partes sin asignar"}
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  {formatDateRange(nextMeeting.startDate, nextMeeting.endDate)} ·{" "}
                  {nextMeeting.assignedParts}/{nextMeeting.totalParts} partes completadas
                  {!nextMeeting.presidentAssigned && " · Falta presidente"}
                  {!nextMeeting.openingPrayerAssigned && " · Falta oración inicial"}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-[#D97706] hover:bg-amber-600 text-white shrink-0"
              >
                Completar programa
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Link>
        ) : (
          <Link href={`/vymc/programas/${nextMeeting.weekId}`} className="block group">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-4 hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-emerald-900">
                  Próxima reunión completa
                </p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  {formatDateRange(nextMeeting.startDate, nextMeeting.endDate)} · Todas las
                  partes tienen asignación
                </p>
              </div>
            </div>
          </Link>
        ))}

      {/* Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card rounded-xl border-2 border-border p-6 hover:border-primary transition-all group">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
              <Users className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-card-foreground mb-1">Publicadores</h2>
              <p className="text-muted-foreground text-sm">
                Directorio de hermanos y hermanas
              </p>
            </div>
          </div>

          <p className="text-foreground/80 text-sm mb-5 leading-relaxed">
            Gestiona el directorio completo: nombres, nombramientos, capacidades y disponibilidad para participar en las reuniones.
          </p>

          <Link href="/vymc/publicadores">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group/btn">
              Ver publicadores
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl border-2 border-border p-6 hover:border-accent transition-all group">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-colors">
              <Calendar className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-card-foreground mb-1">Programas semanales</h2>
              <p className="text-muted-foreground text-sm">
                Reuniones y asignaciones
              </p>
            </div>
          </div>

          <p className="text-foreground/80 text-sm mb-5 leading-relaxed">
            Importa programas, asigna participaciones y organiza las reuniones de entre semana y fin de semana.
          </p>

          <Link href="/vymc/programas">
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground group/btn">
              Ver programas
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
