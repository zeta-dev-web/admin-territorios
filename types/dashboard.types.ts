export type DashboardTotals = {
  publishers: number;
  elders: number;
  ministerialServants: number;
  pioneers: number;
  weeks: number;
};

export type DashboardMonthStats = {
  year: number;
  month: number;
  label: string;
  totalParts: number;
  assignedParts: number;
  completionPercentage: number;
  newAssignments: number;
};

export type NextMeetingStats = {
  weekId: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  totalParts: number;
  assignedParts: number;
  presidentAssigned: boolean;
  openingPrayerAssigned: boolean;
};

export type RecentActivityItem = {
  id: string;
  kind: "assignment" | "import";
  description: string;
  detail?: string;
  createdAt: string;
  href: string;
};

export type DashboardStats = {
  totals: DashboardTotals;
  month: DashboardMonthStats;
  nextMeeting: NextMeetingStats | null;
  recentActivity: RecentActivityItem[];
};
