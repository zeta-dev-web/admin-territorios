import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import {
  ScrapedSectionDTO,
  ScrapedItemDTO,
  ScrapeResult,
  SECTION_TITLE_MAP,
  SectionType,
  detectItemType,
  detectRequiresStudentHelper,
} from "@/types/scraper.types";

const ITEM_COUNTERS: Record<SectionType, { current: number }> = {
  PRESIDENT: { current: 0 },
  OPENING_PRAYER: { current: 0 },
  TREASURES: { current: 0 },
  BE_BETTER_TEACHERS: { current: 0 },
  CHRISTIAN_LIFE: { current: 0 },
  CLOSING_PRAYER: { current: 0 },
};

const WOL_BASE_URL = "https://wol.jw.org";
const WOL_MEETINGS_URL = `${WOL_BASE_URL}/es/wol/meetings/r4/lp-s`;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export async function scrapeWeekProgram(
  weekNumber: number,
  year: number
): Promise<ScrapeResult> {
  try {
    const weekPageHtml = await fetchWithRetry(
      `${WOL_MEETINGS_URL}/${year}/${weekNumber}`
    );
    const workbookUrl = findWorkbookUrl(weekPageHtml);
    if (!workbookUrl) {
      return {
        success: false,
        error: `No se encontró la guía de actividades para la semana ${weekNumber} del ${year}`,
      };
    }
    const workbookHtml = await fetchWithRetry(workbookUrl);
    const sections = parseWorkbookSections(workbookHtml);
    if (sections.length === 0) {
      return {
        success: false,
        error: `No se pudo extraer el contenido para la semana ${weekNumber} del ${year}`,
      };
    }
    
    // Extract biblical reading from the page
    const { biblicalReading } = extractDateRangeAndReading(workbookHtml, year);
    
    return {
      success: true,
      data: { 
        weekNumber, 
        year, 
        biblicalReading: biblicalReading || undefined,
        sections 
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido durante el scraping";
    return { success: false, error: message };
  }
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("Max retries reached");
}

function findWorkbookUrl(html: string): string | null {
  const $ = cheerio.load(html);
  const mwbLink = $(`[class*="pub-mwb"] a[href]`).first();
  if (mwbLink.length > 0) {
    const href = mwbLink.attr("href");
    if (href) return href.startsWith("http") ? href : `${WOL_BASE_URL}${href}`;
  }
  const allLinks = $("a[href]");
  for (let i = 0; i < allLinks.length; i++) {
    const link = $(allLinks[i]);
    const href = link.attr("href") || "";
    const text = link.text().toLowerCase();
    if (
      href.includes("pub-mwb") ||
      href.includes("/d/r4/lp-s/202") ||
      text.includes("guía de actividades") ||
      text.includes("vida y ministerio")
    ) {
      return href.startsWith("http") ? href : `${WOL_BASE_URL}${href}`;
    }
  }
  return null;
}

/**
 * Parse workbook HTML using comprehensive heading detection.
 * 
 * Uses find('h2, h3') to capture ALL headings regardless of nesting depth.
 * Processes them in document order to associate items with their sections.
 * Gets description content between headings using nextUntil scoped to headings.
 */
function parseWorkbookSections(html: string): ScrapedSectionDTO[] {
  // Reset item counters for this parse
  for (const key of Object.keys(ITEM_COUNTERS) as SectionType[]) {
    ITEM_COUNTERS[key].current = 0;
  }

  const $ = cheerio.load(html);
  const bodyTxt = $(".bodyTxt");
  if (bodyTxt.length === 0) return [];

  // Get ALL headings in document order, regardless of nesting
  const allHeadings = bodyTxt.find("h2, h3");
  
  /** Collect headings with their index in document order */
  const headingEntries: { index: number; type: "h2" | "h3"; el: Element }[] = [];
  allHeadings.each((_idx: number, el: Element) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === "h2" || tag === "h3") {
      headingEntries.push({ index: _idx, type: tag, el });
    }
  });

  const sections: ScrapedSectionDTO[] = [];
  let currentSectionType: SectionType | null = null;
  let currentSectionTitle = "";
  let currentItemEls: Element[] = [];
  let beforeSectionItemEls: Element[] = [];
  let foundFirstSection = false;

  for (const entry of headingEntries) {
    if (entry.type === "h2") {
      const title = $(entry.el).text().trim().toUpperCase();
      const sectionType = mapSectionTitle(title);

      if (sectionType) {
        // Save previous section
        if (currentSectionType && currentItemEls.length > 0) {
          sections.push({
            sectionType: currentSectionType,
            title: currentSectionTitle,
            items: parseItems($, currentItemEls, entry.el, currentSectionType),
          });
          currentItemEls = [];
        } else if (!foundFirstSection && beforeSectionItemEls.length > 0) {
          // Items before first section = opening
          sections.push({
            sectionType: "OPENING_PRAYER",
            title: "APERTURA",
            items: parseItems($, beforeSectionItemEls, entry.el, "OPENING_PRAYER"),
          });
          beforeSectionItemEls = [];
        }

        foundFirstSection = true;
        currentSectionType = sectionType;
        currentSectionTitle = title;
        // Reset counter for new section
        ITEM_COUNTERS[sectionType].current = 0;
      }
    } else if (entry.type === "h3") {
      if (foundFirstSection) {
        currentItemEls.push(entry.el);
      } else {
        beforeSectionItemEls.push(entry.el);
      }
    }
  }

  // Last section items
  if (currentSectionType && currentItemEls.length > 0) {
    sections.push({
      sectionType: currentSectionType,
      title: currentSectionTitle,
      items: parseItems($, currentItemEls, null, currentSectionType),
    });
  }

  // Fallback if nothing found
  if (sections.length === 0) {
    return parseAlternative($);
  }

  return sections;
}

/**
 * Parse items from h3 elements, extracting content between current heading and next heading.
 */
function parseItems(
  $: CheerioAPI,
  itemElements: Element[],
  nextBoundary: Element | null,
  sectionType: SectionType
): ScrapedItemDTO[] {
  const result: ScrapedItemDTO[] = [];

  for (let i = 0; i < itemElements.length; i++) {
    const h3 = itemElements[i];
    const $h3 = $(h3);
    const fullText = $h3.text().trim();
    if (!fullText) continue;

    // Find the NEXT h3 or h2 in document order to bound the description
    let nextHeadingEl: Element | null = null;
    // First check if there's a next h3 in our items
    if (i + 1 < itemElements.length) {
      nextHeadingEl = itemElements[i + 1];
    } else if (nextBoundary) {
      nextHeadingEl = nextBoundary;
    }

    // Get content between this h3 and next heading
    // Walk next siblings until we hit nextHeading or a different context
    let description = "";
    let current = $h3.next();
    while (current.length > 0) {
      const currentEl = current.get(0);
      if (!currentEl) break;

      // Stop if we hit the next heading element
      if (nextHeadingEl && currentEl === nextHeadingEl) break;

      // Stop if this element IS a heading
      const tag = currentEl.tagName?.toLowerCase();
      if (tag === "h2" || tag === "h3") break;

      // Also check if this element CONTAINS a section heading (div > h2)
      if (current.find("h2").length > 0) break;

      const text = current.text().trim();
      if (text) description += text + "\n";
      current = current.next();
    }
    description = description.trim();

    const itemType = detectItemType(fullText, description);
    const requiresStudentHelper = detectRequiresStudentHelper(fullText, description);
    const timeMinutes = extractTimeMinutes(fullText + " " + description);
    const songNumber = extractSongNumber(fullText + " " + description);

    const title = fullText
      .replace(/\d+\s*mins?\.?\s*/gi, "")
      .replace(/\(\d+\s*min\.?\)/gi, "")
      .replace(/^\d+\.\s*/, "")
      .replace(/\(\s*\)/g, "")
      .trim();

    ITEM_COUNTERS[sectionType].current++;

    result.push({
      order: ITEM_COUNTERS[sectionType].current,
      title,
      itemType,
      description,
      requiresStudentHelper,
      timeMinutes: timeMinutes ?? undefined,
      songNumber: songNumber ?? undefined,
    });
  }

  return result;
}

function mapSectionTitle(title: string): SectionType | null {
  const normalized = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(SECTION_TITLE_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return null;
}

function extractSongNumber(text: string): number | null {
  const match = text.match(/(?:canción|canción)\s*(?:n\.?º|número|num|°)?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function extractTimeMinutes(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:min|mins|minutos|min\.)/i);
  return match ? parseInt(match[1], 10) : null;
}

function parseAlternative($: CheerioAPI): ScrapedSectionDTO[] {
  const sections: ScrapedSectionDTO[] = [];
  const patterns: { regex: RegExp; type: SectionType }[] = [
    { regex: /tesoros?\s*de?\s*la?\s*biblia/i, type: "TREASURES" },
    { regex: /seamos?\s*mejores?\s*(maestros?|predicadores?)/i, type: "BE_BETTER_TEACHERS" },
    { regex: /(nuestra?\s*)?vida?\s*cristiana/i, type: "CHRISTIAN_LIFE" },
  ];
  const lines = $(".bodyTxt").text().split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  let currentSection: ScrapedSectionDTO | null = null;
  for (const line of lines) {
    const matched = patterns.find((p) => p.regex.test(line));
    if (matched) {
      if (currentSection) sections.push(currentSection);
      currentSection = { sectionType: matched.type, title: line, items: [] };
    } else if (currentSection && line.length > 10) {
      ITEM_COUNTERS[currentSection.sectionType].current++;
      currentSection.items.push({
        order: ITEM_COUNTERS[currentSection.sectionType].current,
        title: line.substring(0, 150),
        itemType: detectItemType(line, ""),
        description: line,
        requiresStudentHelper: detectRequiresStudentHelper(line, ""),
      });
    }
  }
  if (currentSection) sections.push(currentSection);
  return sections;
}

/**
 * A candidate string looks like a scripture reference ("JEREMÍAS 26-28",
 * "PROVERBIOS 12", "1 CORINTIOS 5-7") and not like a meeting section title.
 */
function looksLikeScriptureReference(candidate: string): boolean {
  if (!candidate || candidate.length <= 3 || candidate.length >= 50) return false;
  if (!/^[A-ZÁÉÍÓÚÑ0-9\s,\-]+$/i.test(candidate)) return false;

  const normalized = candidate.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isSectionTitle = Object.keys(SECTION_TITLE_MAP).some((key) =>
    normalized.includes(key)
  );
  return !isSectionTitle;
}

export function extractDateRangeAndReading(
  html: string, referenceYear?: number
): { startDate: Date | null; endDate: Date | null; biblicalReading: string | null } {
  const $ = cheerio.load(html);
  const h1Text = $("h1").first().text().trim();
  if (!h1Text) return { startDate: null, endDate: null, biblicalReading: null };
  
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  
  // Extract date range
  const match = h1Text.match(/(\d+)\s*de\s*(\w+)\s*a\s*(\d+)\s*de\s*(\w+)/i);
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  
  if (match) {
    const startDay = parseInt(match[1], 10);
    const startMonth = months[match[2].toLowerCase()];
    const endDay = parseInt(match[3], 10);
    const endMonth = months[match[4].toLowerCase()];
    if (startMonth !== undefined && endMonth !== undefined) {
      const year = referenceYear ?? new Date().getFullYear();
      startDate = new Date(year, startMonth, startDay);
      endDate = new Date(year, endMonth, endDay);
    }
  }
  
  // Extract biblical reading (usually after the date, second line of h1 or next element)
  let biblicalReading: string | null = null;
  const h1Lines = h1Text.split('\n').map(l => l.trim()).filter(l => l);

  // Check if there's a second line in h1 that looks like a biblical book
  if (h1Lines.length > 1 && looksLikeScriptureReference(h1Lines[1])) {
    biblicalReading = h1Lines[1];
  }

  // If not found in h1, check next sibling element
  if (!biblicalReading) {
    const h1Element = $("h1").first();
    const nextElement = h1Element.next();
    if (nextElement.length > 0) {
      const nextText = nextElement.text().trim();
      if (looksLikeScriptureReference(nextText)) {
        biblicalReading = nextText;
      }
    }
  }

  // Last resort: scan h2 headings for a short scripture reference.
  // On wol.jw.org the reading usually sits in its own h2 right after
  // the week heading, but not always as a direct sibling of the h1.
  if (!biblicalReading) {
    $("h2").each((_idx: number, el: Element) => {
      const candidate = $(el).text().trim();
      if (looksLikeScriptureReference(candidate)) {
        biblicalReading = candidate;
        return false; // stop iteration
      }
    });
  }

  return { startDate, endDate, biblicalReading };
}

export async function getAvailableWeeks(): Promise<{ weekNumber: number; year: number }[]> {
  try {
    const html = await fetchWithRetry(WOL_MEETINGS_URL);
    const $ = cheerio.load(html);
    const weeks: { weekNumber: number; year: number }[] = [];
    $('a[href*="/lp-s/"]').each((_idx: number, el: Element) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/\/lp-s\/(\d{4})\/(\d+)$/);
      if (match) {
        const foundYear = parseInt(match[1], 10);
        const weekNum = parseInt(match[2], 10);
        if (foundYear >= 2020 && weekNum >= 1 && weekNum <= 53 && !weeks.some((w) => w.year === foundYear && w.weekNumber === weekNum)) {
          weeks.push({ year: foundYear, weekNumber: weekNum });
        }
      }
    });
    return weeks.sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber);
  } catch {
    return [];
  }
}
