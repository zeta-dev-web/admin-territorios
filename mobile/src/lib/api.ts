const DEFAULT_API_URL = 'https://territoriosapp.duckdns.org/api/mobile';

export const MOBILE_API_URL = (
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL
).replace(/\/$/, '');

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  action?: string;
  data?: T;
  message?: string;
  code?: string;
}

export class MobileApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
    this.code = code;
  }
}

export async function mobileAction<T>(
  action: string,
  params: Record<string, unknown> = {},
  token?: string | null,
): Promise<T> {
  const response = await fetch(MOBILE_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, params }),
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf')) {
    return (await response.blob()) as T;
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new MobileApiError(
      payload.message || 'No se pudo completar la operación',
      response.status,
      payload.code,
    );
  }

  return payload.data as T;
}

export interface MobileUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
  tenantId: string;
  congregationName: string | null;
  termsAccepted: boolean;
}

export interface LoginData {
  token: string;
  expiresIn: number;
  user: MobileUser;
}

export interface GeneralStats {
  totalTerritories: number;
  totalDrivers: number;
  totalGroups: number;
  activeAssignments: number;
  completedAssignments: number;
  totalAssignments: number;
}

export interface DashboardMetrics {
  activeTerritoriesProgress: Array<{
    territoryId: string;
    territoryNumber: number;
    assignmentId: string;
    driverName: string;
    startDate: string;
    totalBlocks: number;
    completedBlocks: number;
    progressPercentage: number;
  }>;
  atrasados: Array<{
    territoryId: string;
    territoryNumber: number;
    daysSinceLastAssignment: number | null;
  }>;
  territoryFrequency: Array<{
    territoryId: string;
    territoryNumber: number;
    completedAssignments: number;
  }>;
}

export interface UnifiedAssignment {
  id: string;
  type: 'CONDUCTOR' | 'PERSONAL';
  territoryId: string;
  territoryNumber: number;
  territoryDescription: string | null;
  assigneeId: string;
  assigneeName: string;
  groupName: string;
  assignedDate: string;
  endDate: string | null;
  isActive: boolean;
  blocksTotal?: number;
  blocksCompleted?: number;
  notes?: string | null;
}

export interface Territory {
  id: string;
  number: number;
  description: string | null;
  blocks: Array<{ id: string; letter: string }>;
  group: { id: string; name: string };
  assignments?: Array<{ id: string; driver: { name: string } }>;
  personalAssignments?: Array<{ id: string; member: { name: string } }>;
  lastAssignmentDate?: string | null;
}

export interface GroupMember {
  id: string;
  name: string;
  groupId: string;
  isDriver?: boolean;
  personalAssignments?: Array<{ id: string; territory: { number: number } }>;
}

export interface Group {
  id: string;
  name: string;
  superintendent: string | null;
  auxiliary: string | null;
  drivers: Array<{ id: string; name: string; _count?: { assignments: number } }>;
  members: GroupMember[];
}

export interface Driver {
  id: string;
  name: string;
  groupId: string;
  group: { id: string; name: string };
  assignments?: Array<{ id: string; isCompleted: boolean; territory: { number: number } }>;
  _count?: { assignments: number; dailyRecords: number };
}

export interface MemberOption {
  id: string;
  name: string;
  group: { name: string };
}

export interface TerritoryMap {
  id: string;
  type: 'GENERAL' | 'GROUP';
  groupId: string | null;
  group?: { id: string; name: string } | null;
  images: Array<{ id: string; url: string; order: number }>;
}

export interface HistoryAssignment extends UnifiedAssignment {
  isCompleted: boolean;
}

export interface AssignmentBlockStatus {
  id: string;
  letter: string;
  isCompleted: boolean;
  lastWorkedDate?: string | null;
}

export interface AssignmentBlocksData {
  assignment: {
    id: string;
    territory: { number: number; description: string | null };
    driver: { id: string; name: string; group: { name: string } };
  };
  blocks: AssignmentBlockStatus[];
}

export interface TerritoryRange {
  start: number;
  end: number;
  label: string;
  count: number;
}
