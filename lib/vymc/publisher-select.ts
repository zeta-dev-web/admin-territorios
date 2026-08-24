export const PUBLISHER_SELECT = {
  id: true, firstName: true, lastName: true, phone: true,
  gender: true, isBaptized: true, isElder: true,
  isMinisterialServant: true, isPioneer: true, isConductor: true,
  lastAssignedAt: true, groupId: true,
  group: { select: { name: true } },
} as const
