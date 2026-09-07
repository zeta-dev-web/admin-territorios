"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { formatWeekRangeLabel, WEEK_TYPE_LABELS } from "@/components/vymc/week-display-config";
import type { WeekSummary } from "@/types/week-detail";

type WeeksTableProps = {
  weeks: WeekSummary[];
  onSelectWeek?: (weekId: string) => void;
  onDeleteWeek: (weekId: string) => void;
};

export function WeeksTable({ weeks, onSelectWeek, onDeleteWeek }: WeeksTableProps) {
  const router = useRouter();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (monthYear: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthYear)) {
      newExpanded.delete(monthYear);
    } else {
      newExpanded.add(monthYear);
    }
    setExpandedMonths(newExpanded);
  };

  // Group weeks by month (most recent first) - use START date
  const groupedWeeks = weeks.reduce((acc, week) => {
    const date = new Date(week.startDate);
    const monthYear = `${date.toLocaleDateString("es-ES", { timeZone: "UTC", month: "long", year: "numeric" })}`;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(week);
    return acc;
  }, {} as Record<string, WeekSummary[]>);

  // Sort months (most recent first)
  const sortedMonths = Object.keys(groupedWeeks).sort((a, b) => {
    const dateA = new Date(groupedWeeks[a][0].startDate);
    const dateB = new Date(groupedWeeks[b][0].startDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-3">
      {sortedMonths.map((monthYear) => {
        const isExpanded = expandedMonths.has(monthYear);
        const weeksInMonth = groupedWeeks[monthYear];

        return (
          <div key={monthYear} className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Month Header - Clickable */}
            <button
              onClick={() => toggleMonth(monthYear)}
              className="w-full flex items-center justify-between px-5 py-3 bg-card hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`w-5 h-5 text-primary transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                  {monthYear}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {weeksInMonth.length} {weeksInMonth.length === 1 ? 'semana' : 'semanas'}
                </span>
              </div>
            </button>

            {/* Weeks in this month - Collapsible */}
            {isExpanded && (
              <div className="border-t border-border">
                {weeksInMonth.map((week, index) => {
                  const { startDay, endDay, month } = formatWeekRangeLabel(week.startDate, week.endDate);

                  return (
                    <div
                      key={week.id}
                      onClick={() => {
                        if (onSelectWeek) {
                          onSelectWeek(week.id);
                        } else {
                          router.push(`/vymc/programas/${week.id}`);
                        }
                      }}
                      className={`flex items-center justify-between px-5 py-4 hover:bg-accent/10 cursor-pointer transition-colors ${
                        index < weeksInMonth.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-card-foreground">
                            Semana del {startDay}-{endDay} de {month}
                          </p>
                          {week.weekType !== "REGULAR" && (
                            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-amber-700">
                              {WEEK_TYPE_LABELS[week.weekType]}
                            </p>
                          )}
                          {week.biblicalReading && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              📖 {week.biblicalReading}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWeek(week.id);
                          }}
                          className="p-2 text-muted-foreground/70 hover:text-red-500 hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {weeks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron semanas que coincidan con la búsqueda
        </div>
      )}
    </div>
  );
}
