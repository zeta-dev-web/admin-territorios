"use client";

import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/components/vymc/week-display-config";

type WeekHeaderProps = {
  startDate: string;
  endDate: string;
  biblicalReading?: string | null;
  isAutoAssigning: boolean;
  onAutoAssign: () => void;
};

export function WeekHeader({
  startDate,
  endDate,
  biblicalReading,
  isAutoAssigning,
  onAutoAssign,
}: WeekHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-[#1A365D] to-primary rounded-xl p-6 text-white">
      <h1 className="text-2xl font-semibold">{formatDateRange(startDate, endDate)}</h1>
      <Button
        onClick={onAutoAssign}
        disabled={isAutoAssigning}
        className="mt-4 bg-white/15 hover:bg-white/25 text-white border border-white/30"
      >
        {isAutoAssigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
        {isAutoAssigning ? "Completando..." : "Completar automáticamente"}
      </Button>
      {biblicalReading && (
        <p className="text-white/80 text-sm mt-2">
          📖 Lectura bíblica: <span className="font-medium">{biblicalReading}</span>
        </p>
      )}
    </div>
  );
}
