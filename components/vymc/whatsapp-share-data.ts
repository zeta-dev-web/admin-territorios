/** Tipo canónico compartido por tarjeta, página y diálogo. */
export type WhatsAppShareData = {
  publisherId?: string;
  publisherName: string;
  phone?: string | null;
  gender: "MALE" | "FEMALE";
  role: string;
  roleLabel: string;
  partTitle: string;
  sectionTitle: string;
  weekRangeText: string;
  durationMinutes?: number | null;
  songNumber?: number | null;
  biblicalReading?: string | null;
  helperName?: string | null;
  assignedName?: string | null;
};
