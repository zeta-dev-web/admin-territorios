export type AssignmentEligibilityPublisher = {
  gender: "MALE" | "FEMALE" | null;
  isElder: boolean;
  isMinisterialServant: boolean;
  isBaptized: boolean | null;
};

type AssignmentEligibilityInput = {
  sectionType: string;
  itemType?: string;
  role?: string;
};

export function isBrother(
  publisher: AssignmentEligibilityPublisher
): boolean {
  return publisher.gender === "MALE";
}

export function isLeadershipPublisher(
  publisher: AssignmentEligibilityPublisher
): boolean {
  return isBrother(publisher) &&
    (publisher.isElder || publisher.isMinisterialServant);
}

export function isBaptizedBrother(
  publisher: AssignmentEligibilityPublisher
): boolean {
  return isBrother(publisher) && publisher.isBaptized === true;
}

export function canAssignPublisher(
  publisher: AssignmentEligibilityPublisher,
  { sectionType, itemType, role }: AssignmentEligibilityInput
): boolean {
  if (role === "READER") return isBaptizedBrother(publisher);

  if (itemType === "PRAYER") return isLeadershipPublisher(publisher);

  if (sectionType === "PRESIDENT" || sectionType === "OPENING_PRAYER") {
    return isLeadershipPublisher(publisher);
  }

  if (sectionType === "CHRISTIAN_LIFE") {
    return isLeadershipPublisher(publisher);
  }

  if (sectionType === "TREASURES") {
    if (itemType === "READING") return isBrother(publisher);
    return isLeadershipPublisher(publisher);
  }

  if (sectionType === "BE_BETTER_TEACHERS" && itemType === "SPEECH") {
    return isBaptizedBrother(publisher);
  }

  return true;
}

export function getEligibilityDescription({
  sectionType,
  itemType,
  role,
}: AssignmentEligibilityInput): string {
  if (role === "READER") return "Cualquier hermano bautizado";

  if (itemType === "PRAYER") {
    return "Solo ancianos o siervos ministeriales";
  }

  if (sectionType === "PRESIDENT" || sectionType === "OPENING_PRAYER") {
    return "Solo ancianos o siervos ministeriales";
  }

  if (sectionType === "CHRISTIAN_LIFE") {
    return "Solo ancianos o siervos ministeriales";
  }

  if (sectionType === "TREASURES" && itemType === "READING") {
    return "Cualquier hermano";
  }

  if (sectionType === "BE_BETTER_TEACHERS" && itemType === "SPEECH") {
    return "Cualquier hermano bautizado";
  }

  if (sectionType === "TREASURES") {
    return "Solo ancianos o siervos ministeriales";
  }

  return "Todos los publicadores";
}
