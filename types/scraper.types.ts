/**
 * Types for the WOL (Watchtower Online Library) scraper
 */

/**
 * Represents a complete scraped weekly program
 */
export type ScrapedWeekDTO = {
  weekNumber: number;
  year: number;
  biblicalReading?: string;
  sections: ScrapedSectionDTO[];
};

/**
 * Represents a section within the meeting program (e.g., "Tesoros de la Biblia")
 */
export type ScrapedSectionDTO = {
  sectionType: SectionType;
  title: string;
  items: ScrapedItemDTO[];
};

/**
 * Represents an individual item/assignment within a section
 */
export type ScrapedItemDTO = {
  order: number;
  title: string;
  itemType: ItemType;
  description: string;
  requiresStudentHelper: boolean;
  timeMinutes?: number;
  songNumber?: number;
  bibleReading?: string;
};

/**
 * Section types that map to our database enum
 */
export type SectionType =
  | "PRESIDENT"
  | "OPENING_PRAYER"
  | "TREASURES"
  | "BE_BETTER_TEACHERS"
  | "CHRISTIAN_LIFE"
  | "CLOSING_PRAYER";

/**
 * Item types that map to our database enum
 */
export type ItemType =
  | "SPEECH"
  | "READING"
  | "DISCUSSION"
  | "CONDUCTOR_READER"
  | "PRAYER";

/**
 * Maps section title strings to SectionType enums
 */
export const SECTION_TITLE_MAP: Record<string, SectionType> = {
  "tesoros de la biblia": "TREASURES",
  "seamos mejores maestros": "BE_BETTER_TEACHERS",
  "seamos mejores predicadores": "BE_BETTER_TEACHERS",
  "nuestra vida cristiana": "CHRISTIAN_LIFE",
  "vida cristiana": "CHRISTIAN_LIFE",
};

/**
 * Maps item keywords to ItemType enums based on content analysis
 */
export function detectItemType(title: string, description: string): ItemType {
  const combined = `${title} ${description}`.toLowerCase();

  if (
    combined.includes("discurso") ||
    combined.includes("discurs") ||
    combined.includes("estudio de la atalaya")
  ) {
    return "SPEECH";
  }

  if (
    combined.includes("lectura") ||
    combined.includes("lector") ||
    combined.includes("reading")
  ) {
    return "READING";
  }

  if (
    combined.includes("conductor") ||
    combined.includes("conduce") ||
    combined.includes("dirige")
  ) {
    return "CONDUCTOR_READER";
  }

  if (
    combined.includes("oración") ||
    combined.includes("oracion") ||
    combined.includes("prayer")
  ) {
    return "PRAYER";
  }

  // Default to discussion for most interactive items
  return "DISCUSSION";
}

/**
 * Detects if an item requires a student-helper pair (2 assigned people)
 */
export function detectRequiresStudentHelper(
  title: string,
  description: string
): boolean {
  const combined = `${title} ${description}`.toLowerCase();

  return (
    combined.includes("estudiante") ||
    combined.includes("ayudante") ||
    combined.includes("alumno") ||
    combined.includes("helper") ||
    combined.includes("student")
  );
}

/**
 * Result of a scraping operation
 */
export type ScrapeResult =
  | {
      success: true;
      data: ScrapedWeekDTO;
    }
  | {
      success: false;
      error: string;
    };
