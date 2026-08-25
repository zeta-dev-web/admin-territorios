import * as XLSX from "xlsx";

// ============================================
// TIPOS
// ============================================

export type ParsedPublisherRow = {
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: "MALE" | "FEMALE";
  isElder: boolean;
  isMinisterialServant: boolean;
  isPioneer: boolean;
  isBaptized: boolean;
};

export type PublisherParseResult = {
  rows: ParsedPublisherRow[];
  errors: Array<{ row: number; name: string; reason: string }>;
};

export type PublisherDirectoryRow = {
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: "MALE" | "FEMALE";
  isElder: boolean;
  isMinisterialServant: boolean;
  isPioneer: boolean;
  isBaptized: boolean;
  lastAssignedAt: Date | null;
};

export type WeeksHistoryRow = {
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  sectionTitle: string;
  partTitle: string;
  partOrder: number;
  roleLabel: string;
  publisherName: string;
};

// ============================================
// HELPERS DE NORMALIZACIÓN
// ============================================

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const TRUTHY_VALUES = new Set(["si", "x", "true", "1", "yes", "y", "verdadero"]);

function parseFlexibleBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = normalizeText(value);
  return TRUTHY_VALUES.has(normalized);
}

function mapGenderValue(value: unknown): "MALE" | "FEMALE" | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const maleWords = new Set([
    "hermano",
    "masculino",
    "varon",
    "hombre",
    "male",
  ]);
  const femaleWords = new Set([
    "hermana",
    "femenina",
    "femenino",
    "mujer",
    "female",
  ]);

  if (maleWords.has(normalized) || normalized === "h") return "MALE";
  if (femaleWords.has(normalized) || normalized === "m") return "FEMALE";
  return null;
}

function findColumn(
  record: Record<string, unknown>,
  aliases: string[]
): unknown {
  // Pass 1: exact normalized match
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = normalizeText(key);
    if (aliases.includes(normalizedKey)) return value;
  }
  // Pass 2: partial match for compound headers like "Teléfono / WhatsApp"
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = normalizeText(key);
    if (
      aliases.some(
        (alias) =>
          normalizedKey.includes(alias) ||
          (alias.length > 4 && alias.includes(normalizedKey))
      )
    ) {
      return value;
    }
  }
  return undefined;
}

function cellToString(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDisplayDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date + "T12:00:00Z") : date;
  return d.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================
// IMPORTACIÓN
// ============================================

const COLUMN_ALIASES = {
  firstName: ["nombre", "nombres", "first name"],
  lastName: ["apellido", "apellidos", "last name"],
  phone: ["telefono", "tel", "phone", "celular", "whatsapp"],
  gender: ["genero", "sexo", "gender"],
  isElder: ["anciano", "elder"],
  isMinisterialServant: [
    "siervo ministerial",
    "siervo",
    "ministerial servant",
  ],
  isPioneer: ["precursor", "precursora", "pioneer"],
  isBaptized: ["bautizado", "bautizada", "baptized"],
};

/**
 * Parse an uploaded .xlsx/.csv workbook into publisher rows.
 * Tolerant to accents, column order and common Spanish/English aliases.
 */
export function parsePublishersWorkbook(buffer: Buffer): PublisherParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return { rows: [], errors: [{ row: 1, name: "", reason: "El archivo no contiene hojas" }] };
  }

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows: ParsedPublisherRow[] = [];
  const errors: PublisherParseResult["errors"] = [];
  const seenInFile = new Set<string>();

  records.forEach((record, index) => {
    const rowNumber = index + 2; // +1 header, +1 base-1

    const rawFirstName = cellToString(findColumn(record, COLUMN_ALIASES.firstName));
    const rawLastName = cellToString(findColumn(record, COLUMN_ALIASES.lastName));

    // Completely empty row → ignore silently
    if (!rawFirstName && !rawLastName && !cellToString(findColumn(record, COLUMN_ALIASES.phone))) {
      return;
    }

    const displayName =
      `${rawFirstName} ${rawLastName}`.trim() || `(fila ${rowNumber})`;

    if (!rawFirstName) {
      errors.push({ row: rowNumber, name: displayName, reason: "Falta el nombre" });
      return;
    }
    if (!rawLastName) {
      errors.push({ row: rowNumber, name: displayName, reason: "Falta el apellido" });
      return;
    }
    if (rawFirstName.length > 100 || rawLastName.length > 100) {
      errors.push({ row: rowNumber, name: displayName, reason: "Nombre o apellido demasiado largo (máx. 100)" });
      return;
    }

    const gender = mapGenderValue(findColumn(record, COLUMN_ALIASES.gender));
    if (!gender) {
      errors.push({
        row: rowNumber,
        name: displayName,
        reason: 'Género no reconocido (usá "Hermano"/"Hermana", "H"/"M", "Masculino"/"Femenino")',
      });
      return;
    }

    const rawPhone = cellToString(findColumn(record, COLUMN_ALIASES.phone));
    if (rawPhone.length > 30) {
      errors.push({ row: rowNumber, name: displayName, reason: "El teléfono no puede exceder 30 caracteres" });
      return;
    }

    const duplicateKey = normalizeText(`${rawFirstName} ${rawLastName}`);
    if (seenInFile.has(duplicateKey)) {
      errors.push({ row: rowNumber, name: displayName, reason: "Nombre duplicado dentro del archivo" });
      return;
    }
    seenInFile.add(duplicateKey);

    rows.push({
      firstName: rawFirstName,
      lastName: rawLastName,
      phone: rawPhone || null,
      gender,
      isElder: parseFlexibleBoolean(findColumn(record, COLUMN_ALIASES.isElder)),
      isMinisterialServant: parseFlexibleBoolean(
        findColumn(record, COLUMN_ALIASES.isMinisterialServant)
      ),
      isPioneer: parseFlexibleBoolean(findColumn(record, COLUMN_ALIASES.isPioneer)),
      isBaptized: parseFlexibleBoolean(findColumn(record, COLUMN_ALIASES.isBaptized)),
    });
  });

  return { rows, errors };
}

// ============================================
// EXPORTACIÓN
// ============================================

function appendSheetFromAoa(workbook: XLSX.WorkBook, aoa: unknown[][], sheetName: string) {
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  sheet["!cols"] = aoa[0].map((_, colIndex) => {
    let maxWidth = 12;
    for (const row of aoa.slice(0, 200)) {
      const cellLength = String(row[colIndex] ?? "").length;
      if (cellLength > maxWidth) maxWidth = cellLength + 2;
    }
    return { wch: Math.min(maxWidth, 42) };
  });
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(output as ArrayBuffer);
}

/** Directorio de publicadores con estado y contacto. */
export function buildPublishersDirectoryWorkbook(
  publishers: PublisherDirectoryRow[]
): Buffer {
  const aoa: unknown[][] = [
    [
      "Nombre",
      "Apellido",
      "Teléfono / WhatsApp",
      "Género",
      "Anciano",
      "Siervo Ministerial",
      "Precursor",
      "Bautizado",
      "Última Asignación",
    ],
    ...publishers.map((p) => [
      p.firstName,
      p.lastName,
      p.phone ?? "",
      p.gender === "MALE" ? "Hermano" : "Hermana",
      p.isElder ? "Sí" : "No",
      p.isMinisterialServant ? "Sí" : "No",
      p.isPioneer ? "Sí" : "No",
      p.isBaptized ? "Sí" : "No",
      formatDisplayDate(p.lastAssignedAt),
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  appendSheetFromAoa(workbook, aoa, "Publicadores");
  return workbookToBuffer(workbook);
}

/** Plantilla de ejemplo para la importación masiva. */
export function buildPublishersTemplateWorkbook(): Buffer {
  const aoa: unknown[][] = [
    [
      "Nombre",
      "Apellido",
      "Teléfono",
      "Género",
      "Anciano",
      "Siervo Ministerial",
      "Precursor",
      "Bautizado",
    ],
    ["Juan", "Pérez", "+54 9 381 123-4567", "Hermano", "Sí", "No", "Sí", "Sí"],
    ["María", "Gómez", "", "Hermana", "No", "No", "No", "Sí"],
  ];

  const workbook = XLSX.utils.book_new();
  appendSheetFromAoa(workbook, aoa, "Plantilla");
  return workbookToBuffer(workbook);
}

/** Historial completo de asignaciones por semana. */
export function buildWeeksHistoryWorkbook(historyRows: WeeksHistoryRow[]): Buffer {
  const aoa: unknown[][] = [
    [
      "Año",
      "Semana",
      "Inicio",
      "Fin",
      "Sección",
      "Parte",
      "Orden",
      "Rol",
      "Publicador",
    ],
    ...historyRows.map((row) => [
      row.year,
      row.weekNumber,
      formatDisplayDate(row.startDate),
      formatDisplayDate(row.endDate),
      row.sectionTitle,
      row.partTitle,
      row.partOrder,
      row.roleLabel,
      row.publisherName,
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  appendSheetFromAoa(workbook, aoa, "Historial");
  return workbookToBuffer(workbook);
}
