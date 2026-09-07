export type Publisher = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  gender: "MALE" | "FEMALE";
  isElder: boolean;
  isMinisterialServant: boolean;
  isBaptized: boolean;
};

export type PublisherAssignment = {
  id: string;
  role: "ASSIGNEE" | "STUDENT" | "HELPER" | "CONDUCTOR" | "READER";
  publisher: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    gender: "MALE" | "FEMALE";
  };
};

export type WeekItem = {
  id: string;
  title: string;
  itemType: string;
  order: number;
  timeMinutes?: number | null;
  songNumber?: number | null;
  requiresStudentHelper: boolean;
  assignments: PublisherAssignment[];
};

export type WeekSection = {
  id: string;
  sectionType: string;
  order: number;
  items: WeekItem[];
};

export type WeekDetail = {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  isConfirmed: boolean;
  scrapedAt: string | null;
  biblicalReading: string | null;
  weekType: WeekType;
  president: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  } | null;
  openingPrayer: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  } | null;
  sections: WeekSection[];
};

export type WeekType =
  | "REGULAR"
  | "REGIONAL_ASSEMBLY"
  | "CIRCUIT_ASSEMBLY"
  | "CIRCUIT_SUPERVISOR_VISIT";

export type SpecialAssignType = "president" | "prayer";

export type AssigningItemState = {
  item: WeekItem;
  sectionType: string;
  isPlaceholder: boolean;
};

export type WeekSummary = {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  isConfirmed: boolean;
  scrapedAt: string | null;
  biblicalReading: string | null;
  weekType: WeekType;
};
