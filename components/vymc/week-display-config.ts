import type { WeekDetail, WeekItem, WeekSection } from "@/types/week-detail";

export const SECTION_ORDER: Record<string, number> = {
  PRESIDENT: 0,
  OPENING_PRAYER: 1,
  TREASURES: 2,
  BE_BETTER_TEACHERS: 3,
  CHRISTIAN_LIFE: 4,
  CLOSING_PRAYER: 5,
};

export const SECTION_COLORS: Record<string, string> = {
  PRESIDENT: "bg-card border-gray-200",
  OPENING_PRAYER: "bg-card border-gray-200",
  TREASURES: "bg-[#5a5a5a]",
  BE_BETTER_TEACHERS: "bg-[#d9a441]",
  CHRISTIAN_LIFE: "bg-[#8b1e3f]",
  CLOSING_PRAYER: "bg-card border-gray-200",
};

export const SECTION_TEXT_COLORS: Record<string, string> = {
  PRESIDENT: "text-gray-800",
  OPENING_PRAYER: "text-gray-800",
  TREASURES: "text-white",
  BE_BETTER_TEACHERS: "text-white",
  CHRISTIAN_LIFE: "text-white",
  CLOSING_PRAYER: "text-gray-800",
};

export const SECTION_TITLES: Record<string, string> = {
  PRESIDENT: "Presidencia",
  OPENING_PRAYER: "Apertura",
  TREASURES: "Tesoros de la Biblia",
  BE_BETTER_TEACHERS: "Seamos Mejores Maestros",
  CHRISTIAN_LIFE: "Nuestra Vida Cristiana",
  CLOSING_PRAYER: "Oración Final",
};

export const ITEM_TYPE_BADGES: Record<string, string> = {
  SPEECH: "bg-blue-100 text-blue-700 border-blue-200",
  READING: "bg-purple-100 text-purple-700 border-purple-200",
  DISCUSSION: "bg-green-100 text-green-700 border-green-200",
  CONDUCTOR_READER: "bg-amber-100 text-amber-700 border-amber-200",
  PRAYER: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export const ITEM_TYPE_LABELS: Record<string, string> = {
  SPEECH: "Discurso",
  READING: "Lectura",
  DISCUSSION: "Análisis",
  CONDUCTOR_READER: "Conductor/Lector",
  PRAYER: "Oración",
};

export const ROLE_BADGES: Record<string, string> = {
  ASSIGNEE: "bg-gray-600 text-white",
  STUDENT: "bg-gray-600 text-white",
  HELPER: "bg-gray-600 text-white",
  CONDUCTOR: "bg-gray-600 text-white",
  READER: "bg-gray-600 text-white",
};

export const ROLE_LABELS: Record<string, string> = {
  ASSIGNEE: "Asignado",
  STUDENT: "Estudiante",
  HELPER: "Ayudante",
  CONDUCTOR: "Conductor",
  READER: "Lector",
};

export const ALL_ROLES = [
  { value: "ASSIGNEE", label: "Asignado" },
  { value: "STUDENT", label: "Estudiante" },
  { value: "HELPER", label: "Ayudante" },
  { value: "CONDUCTOR", label: "Conductor" },
  { value: "READER", label: "Lector" },
];

export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRange(startDateStr: string, endDateStr: string) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const startDay = startDate.getUTCDate();
  const endDay = endDate.getUTCDate();

  const month = endDate.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    month: "long",
  }).toUpperCase();

  return `Semana del ${startDay}-${endDay} de ${month}`;
}

/**
 * Get the available roles for an item based on its section type and item type.
 * Default: 1 Asignado.
 * BE_BETTER_TEACHERS (non-SPEECH): Asignado + Ayudante
 * CHRISTIAN_LIFE (estudio bíblico): Asignado + Lector
 */
export function getAvailableRolesForItem(
  sectionType: string,
  item: WeekItem
): Array<{ value: string; label: string }> {
  const takenRoles = new Set<string>(item.assignments.map((a) => a.role));

  let allowedRoles: string[];

  switch (sectionType) {
    case "BE_BETTER_TEACHERS":
      if (item.itemType === "SPEECH") {
        allowedRoles = ["ASSIGNEE"];
      } else {
        allowedRoles = ["ASSIGNEE", "HELPER"];
      }
      break;

    case "CHRISTIAN_LIFE":
      if (
        item.title.toLowerCase().includes("estudio bíblico") ||
        item.title.toLowerCase().includes("estudio biblico")
      ) {
        allowedRoles = ["CONDUCTOR", "READER"];
      } else {
        allowedRoles = ["ASSIGNEE"];
      }
      break;

    default:
      allowedRoles = ["ASSIGNEE"];
  }

  return ALL_ROLES.filter(
    (r) => allowedRoles.includes(r.value) && !takenRoles.has(r.value)
  );
}

/**
 * Sort sections in canonical meeting order
 */
export function sortSections(sections: WeekSection[]): WeekSection[] {
  return [...sections].sort(
    (a, b) =>
      (SECTION_ORDER[a.sectionType] ?? 99) -
      (SECTION_ORDER[b.sectionType] ?? 99)
  );
}

/**
 * Detect if a section is missing and needs a placeholder
 */
export function ensureSections(week: WeekDetail): WeekSection[] {
  const existingTypes = new Set(week.sections.map((s) => s.sectionType));
  const allTypes = [
    "PRESIDENT",
    "OPENING_PRAYER",
    "TREASURES",
    "BE_BETTER_TEACHERS",
    "CHRISTIAN_LIFE",
    "CLOSING_PRAYER",
  ];

  const result: WeekSection[] = [];

  for (const type of allTypes) {
    if (existingTypes.has(type)) {
      const section = week.sections.find((s) => s.sectionType === type)!;
      result.push(section);
    } else {
      // Create a placeholder section
      result.push({
        id: `__placeholder_${type}`,
        sectionType: type,
        order: SECTION_ORDER[type] ?? 99,
        items: [],
      });
    }
  }

  return result;
}

export function getPlaceholderConfig(sectionType: string) {
  switch (sectionType) {
    case "PRESIDENT":
      return {
        sectionType: "PRESIDENT",
        items: [{ title: "Presidente", itemType: "CONDUCTOR_READER", order: 1 }],
      };
    case "CLOSING_PRAYER":
      return {
        sectionType: "CLOSING_PRAYER",
        items: [{ title: "Oración final", itemType: "PRAYER", order: 1 }],
      };
    default:
      return {
        sectionType,
        items: [{ title: sectionType, itemType: "DISCUSSION", order: 1 }],
      };
  }
}

export function getPlaceholderLabel(sectionType: string): string {
  switch (sectionType) {
    case "PRESIDENT":
      return "presidente";
    case "CLOSING_PRAYER":
      return "oración final";
    default:
      return SECTION_TITLES[sectionType]?.toLowerCase() ?? sectionType.toLowerCase();
  }
}

export function getWeekNumberForDate(date: Date): number {
  const d = new Date(date);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  // Ajuste por el día de la semana en que empieza el año
  const dayOffset = start.getDay() * 86400000;
  const diff = d.getTime() - start.getTime() + dayOffset;
  const oneWeek = 604800000;
  return Math.min(Math.ceil(diff / oneWeek), 53);
}

export function getNearestMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // 0=Dom, 1=Lun, ..., 6=Sáb
  // Si es domingo (0) → volver 6 días; si no → volver (day-1) días
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00Z");
  return date.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekRangeLabel(startDateStr: string, endDateStr: string) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const startDay = startDate.getUTCDate();
  const endDay = endDate.getUTCDate();
  const month = endDate.toLocaleDateString("es-ES", { timeZone: "UTC", month: "long" });
  return { startDay, endDay, month };
}
