export type VymcPublisher = {
  id: string
  firstName: string
  lastName: string
  phone?: string | null
  gender: "MALE" | "FEMALE"
  isElder: boolean
  isMinisterialServant: boolean
  isPioneer: boolean
  isBaptized: boolean
  isConductor?: boolean
  groupId?: string | null
  group?: { name: string } | null
}

export type FilterValue = "ALL" | "true" | "false"
