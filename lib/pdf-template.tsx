import React from "react";
import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Fonts are bundled with the project (public/fonts) so PDF generation works
// identically on any platform (Windows dev, Linux server, Docker, Vercel).
// Liberation Sans is metric-compatible with Arial and licensed under SIL OFL.
const fontDirectory = path.join(process.cwd(), "public/fonts");
const fontFiles = {
  regular: path.join(fontDirectory, "LiberationSans-Regular.ttf"),
  bold: path.join(fontDirectory, "LiberationSans-Bold.ttf"),
  italic: path.join(fontDirectory, "LiberationSans-Italic.ttf"),
  boldItalic: path.join(fontDirectory, "LiberationSans-BoldItalic.ttf"),
};
const hasEmbeddedFont = Object.values(fontFiles).every((fontFile) => fs.existsSync(fontFile));

if (hasEmbeddedFont) {
  Font.register({
    family: "VYMC Sans",
    fonts: [
      { src: fontFiles.regular, fontWeight: 400 },
      { src: fontFiles.bold, fontWeight: 700 },
      { src: fontFiles.italic, fontStyle: "italic", fontWeight: 400 },
      { src: fontFiles.boldItalic, fontStyle: "italic", fontWeight: 700 },
    ],
  });
}

const pdfFontFamily = hasEmbeddedFont ? "VYMC Sans" : "Helvetica";

// Helper function to format congregation name
const formatCongregationName = (name: string): string => {
  if (!name) return "";
  if (name.toLowerCase().startsWith("congregación")) {
    return name;
  }
  return `Congregación ${name}`;
};

const styles = StyleSheet.create({
  page: {
    padding: "0.5cm",
    paddingTop: "1cm",
    fontSize: 9,
    fontFamily: pdfFontFamily,
  },
  header: {
    flexDirection: "column",
    marginBottom: 6,
    borderBottom: "1pt solid black",
    paddingBottom: 3,
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  congregationName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  pageTitle: {
    fontSize: 12,
    textAlign: "right",
  },
  weekTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  president: {
    fontSize: 9,
  },
  timeRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 9,
  },
  sectionHeader: {
    backgroundColor: "#666666",
    color: "white",
    padding: 3,
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 2,
  },
  sectionHeaderTreasures: {
    backgroundColor: "#4a4a4a",
  },
  sectionHeaderTeachers: {
    backgroundColor: "#c69c3c",
  },
  sectionHeaderLife: {
    backgroundColor: "#7d2a4e",
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 9,
    alignItems: "flex-start",
  },
  itemNumber: {
    width: "8pt",
    flexShrink: 0,
  },
  itemTitle: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  itemRole: {
    width: "100pt",
    fontSize: 8,
    color: "#4A5568",
    textAlign: "right",
    paddingRight: 3,
    flexShrink: 0,
  },
  itemAssignee: {
    width: "220pt",
    fontSize: 9,
    textAlign: "right",
    flexShrink: 0,
  },
  songRow: {
    flexDirection: "row",
    marginTop: 2,
    marginBottom: 2,
    fontSize: 9,
  },
});

type AssignmentData = {
  publisherName: string;
  role: string;
};

type ItemData = {
  order: number;
  title: string;
  timeMinutes?: number;
  songNumber?: number;
  itemType: string;
  requiresStudentHelper: boolean;
  assignments: AssignmentData[];
};

type SectionData = {
  sectionType: string;
  title: string;
  items: ItemData[];
};

type WeekData = {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  presidentName?: string;
  openingPrayerName?: string;
  closingPrayerName?: string;
  openingSongNumber?: number;
  closingSongNumber?: number;
  biblicalReading?: string;
  weekType?: string;
  sections: SectionData[];
};

type PDFDocumentProps = {
  congregationName: string;
  weeks: WeekData[];
};

const getSectionTitle = (type: string): string => {
  switch (type) {
    case "OPENING_PRAYER":
      return "APERTURA";
    case "TREASURES":
      return "TESOROS DE LA BIBLIA";
    case "BE_BETTER_TEACHERS":
      return "SEAMOS MEJORES MAESTROS";
    case "CHRISTIAN_LIFE":
      return "NUESTRA VIDA CRISTIANA";
    case "CLOSING_PRAYER":
      return "CIERRE";
    default:
      return type;
  }
};

const getSectionStyle = (type: string) => {
  switch (type) {
    case "TREASURES":
      return [styles.sectionHeader, styles.sectionHeaderTreasures];
    case "BE_BETTER_TEACHERS":
      return [styles.sectionHeader, styles.sectionHeaderTeachers];
    case "CHRISTIAN_LIFE":
      return [styles.sectionHeader, styles.sectionHeaderLife];
    default:
      return styles.sectionHeader;
  }
};

const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  
  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const month = months[end.getUTCMonth()];
  
  return `${startDay}-${endDay} DE ${month}`;
};

const formatAssignments = (
  assignments: AssignmentData[], 
  itemType: string, 
  requiresStudentHelper: boolean,
  itemTitle: string,
  sectionType: string
): { role: string; names: string } => {
  if (assignments.length === 0) return { role: "", names: "" };
  
  const grouped: { [key: string]: string[] } = {};
  assignments.forEach((a) => {
    if (!grouped[a.role]) grouped[a.role] = [];
    grouped[a.role].push(a.publisherName);
  });
  
  let role = "";
  let names = "";
  
  // Check for CONDUCTOR and READER first (Estudio bíblico)
  if (grouped["CONDUCTOR"] || grouped["READER"]) {
    if (grouped["CONDUCTOR"] && grouped["READER"]) {
      role = "Conductor/Lector:";
      names = `${grouped["CONDUCTOR"][0]}/${grouped["READER"][0]}`;
    } else if (grouped["CONDUCTOR"]) {
      role = "Conductor:";
      names = grouped["CONDUCTOR"][0];
    } else if (grouped["READER"]) {
      role = "Lector:";
      names = grouped["READER"][0];
    }
  }
  // (ASSIGNEE || STUDENT) + HELPER → "Estudiante/Ayudante:" only in BE_BETTER_TEACHERS
  else if ((grouped["ASSIGNEE"] || grouped["STUDENT"]) && grouped["HELPER"]) {
    if (sectionType === "BE_BETTER_TEACHERS") {
      role = "Estudiante/Ayudante:";
    } else {
      role = "";
    }
    const student = grouped["STUDENT"]?.[0] || grouped["ASSIGNEE"]?.[0] || "";
    const helper = grouped["HELPER"]?.[0] || "";
    names = [student, helper].filter(Boolean).join("/");
  }
  // Only HELPER
  else if (grouped["HELPER"]) {
    role = "Ayudante:";
    names = grouped["HELPER"].join("/");
  }
  // Only STUDENT
  else if (grouped["STUDENT"]) {
    // Label as Estudiante only for:
    // 1. TREASURES section + "Lectura de la Biblia" title
    // 2. BE_BETTER_TEACHERS section + SPEECH type
    const isLecturaBiblia = sectionType === "TREASURES" && itemTitle.toLowerCase().includes("lectura de la biblia");
    const isDiscurso = sectionType === "BE_BETTER_TEACHERS" && itemType === "SPEECH";
    
    if (isLecturaBiblia || isDiscurso) {
      role = "Estudiante:";
    } else {
      role = "";
    }
    names = grouped["STUDENT"].join("/");
  }
  // Only ASSIGNEE
  else if (grouped["ASSIGNEE"]) {
    // Label as Estudiante only for:
    // 1. TREASURES section + "Lectura de la Biblia" title
    // 2. BE_BETTER_TEACHERS section + SPEECH type
    const isLecturaBiblia = sectionType === "TREASURES" && itemTitle.toLowerCase().includes("lectura de la biblia");
    const isDiscurso = sectionType === "BE_BETTER_TEACHERS" && itemType === "SPEECH";
    
    if (isLecturaBiblia || isDiscurso) {
      role = "Estudiante:";
    } else {
      role = "";
    }
    names = grouped["ASSIGNEE"].join("/");
  }
  
  return { role, names };
};

// Helper function to truncate long titles
const truncateTitle = (title: string, maxLength: number = 70): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + "...";
};

// Component for rendering a single week
const WeekProgram = ({ 
  week, 
  isFirstOnPage 
}: { 
  week: WeekData; 
  isFirstOnPage: boolean;
}) => {
  let itemCounter = 0;
  const isAssemblyWeek = week.weekType === "REGIONAL_ASSEMBLY" || week.weekType === "CIRCUIT_ASSEMBLY";
  const specialTitle = week.weekType === "REGIONAL_ASSEMBLY"
    ? "ASAMBLEA REGIONAL"
    : week.weekType === "CIRCUIT_ASSEMBLY"
      ? "ASAMBLEA DE CIRCUITO"
      : week.weekType === "CIRCUIT_SUPERVISOR_VISIT"
        ? "VISITA DEL SUP. DE CIRCUITO"
        : "";
  
  return (
    <View style={{ marginTop: isFirstOnPage ? 0 : 10 }}>
      {/* Week Title with President */}
      <View style={styles.weekTitle}>
        <Text>
          {formatDateRange(week.startDate, week.endDate)}
          {specialTitle ? ` - ${specialTitle}` : ""}
          {week.biblicalReading ? ` | ${week.biblicalReading}` : ""}
        </Text>
        {week.presidentName && (
          <Text style={styles.president}>Presidente: {week.presidentName}</Text>
        )}
      </View>

      {/* Opening Song and Prayer */}
      {!isAssemblyWeek && <View style={styles.songRow}>
        <View style={{ flex: 1 }}>
          <Text>●Canción {week.openingSongNumber || "[Número]"}</Text>
        </View>
        {week.openingPrayerName && (
          <View style={styles.itemAssignee}>
            <Text>Oración: {week.openingPrayerName}</Text>
          </View>
        )}
      </View>}

      {/* Introduction */}
      {!isAssemblyWeek && <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <Text>●Palabras de introducción (1 min.)</Text>
        </View>
      </View>}

      {/* Sections */}
      {week.sections.map((section, sectionIndex) => {
        // Skip OPENING_PRAYER, PRESIDENT, and CLOSING_PRAYER sections
        if (
          section.sectionType === "OPENING_PRAYER" || 
          section.sectionType === "PRESIDENT" ||
          section.sectionType === "CLOSING_PRAYER"
        ) {
          return null;
        }

        return (
          <View key={sectionIndex}>
            {/* Section Header */}
            <View style={getSectionStyle(section.sectionType)}>
              <Text>{getSectionTitle(section.sectionType)}</Text>
            </View>

            {/* Section Items */}
            {section.items.map((item, itemIndex) => {
              // Skip the last song in CHRISTIAN_LIFE (it will be added manually with prayer)
              if (
                section.sectionType === "CHRISTIAN_LIFE" &&
                item.songNumber &&
                item.title.toLowerCase().includes("canción") &&
                itemIndex === section.items.length - 1
              ) {
                return null;
              }

              // Handle mid-section songs (don't number them)
              if (item.songNumber && item.title.toLowerCase().includes("canción")) {
                return (
                  <View key={itemIndex} style={styles.songRow}>
                    <View style={{ flex: 1 }}>
                      <Text>●Canción {item.songNumber}</Text>
                    </View>
                  </View>
                );
              }

              // Increment counter for numbered items
              itemCounter++;

              // Regular items with continuous numbering
              const assignmentData = formatAssignments(
                item.assignments, 
                item.itemType,
                item.requiresStudentHelper,
                item.title,
                section.sectionType
              );
              
              return (
                <View key={itemIndex} style={styles.itemRow}>
                  <View style={styles.itemNumber}>
                    <Text>{itemCounter}.</Text>
                  </View>
                  <View style={styles.itemTitle}>
                    <Text>
                      {truncateTitle(item.title)}
                      {item.timeMinutes ? ` (${item.timeMinutes} mins.)` : ""}
                    </Text>
                  </View>
                  {item.assignments.length > 0 && assignmentData.role && (
                    <View style={styles.itemRole}>
                      <Text>{assignmentData.role}</Text>
                    </View>
                  )}
                  {item.assignments.length > 0 && (
                    <View style={styles.itemAssignee}>
                      <Text>{assignmentData.names}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* If this is CHRISTIAN_LIFE section, add closing items inside */}
            {section.sectionType === "CHRISTIAN_LIFE" && (
              <>
                {/* Closing words */}
                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <Text>●Palabras de conclusión (3 mins.)</Text>
                  </View>
                </View>

                {/* Closing song and prayer */}
                <View style={styles.songRow}>
                  <View style={{ flex: 1 }}>
                    <Text>●Canción {week.closingSongNumber || "[Número]"}</Text>
                  </View>
                  {week.closingPrayerName && (
                    <View style={styles.itemAssignee}>
                      <Text>Oración: {week.closingPrayerName}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
};

export const generatePDFDocument = (congregationName: string, weeks: WeekData[]) => {
  // Group weeks in pairs (2 per page)
  const weekPairs: WeekData[][] = [];
  for (let i = 0; i < weeks.length; i += 2) {
    weekPairs.push(weeks.slice(i, i + 2));
  }

  return (
    <Document>
      {weekPairs.map((pair, pairIndex) => {
        // Get the month from the first week's start date
        const firstWeekDate = new Date(pair[0].startDate + "T12:00:00Z");
        const monthName = firstWeekDate.toLocaleDateString("es-ES", { 
          timeZone: "UTC", 
          month: "long" 
        }).toUpperCase();
        const year = firstWeekDate.getUTCFullYear();
        
        return (
          <Page key={pairIndex} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              {/* Month - Centered, Bold, Large */}
              <Text style={styles.monthHeader}>MES: {monthName} {year}</Text>
              
              {/* Congregation and Program Title - Same Line */}
              <View style={styles.infoRow}>
                <Text style={styles.congregationName}>{formatCongregationName(congregationName)}</Text>
                <Text style={styles.pageTitle}>Programa para la reunión Vida y Ministerio Cristianos</Text>
              </View>
            </View>

            {/* First week */}
            <WeekProgram week={pair[0]} isFirstOnPage={true} />

            {/* Divider if there's a second week */}
            {pair.length > 1 && (
              <View style={{ borderTop: "1pt dashed #999", marginVertical: 8 }} />
            )}

            {/* Second week (if exists) */}
            {pair.length > 1 && <WeekProgram week={pair[1]} isFirstOnPage={false} />}
          </Page>
        );
      })}
    </Document>
  );
};
