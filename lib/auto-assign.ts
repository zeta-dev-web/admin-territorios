import { canAssignPublisher } from "@/lib/assignment-eligibility";

export type AutoAssignRole = "ASSIGNEE" | "HELPER" | "CONDUCTOR" | "READER";

export type AutoAssignCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | null;
  isElder: boolean;
  isMinisterialServant: boolean;
  isBaptized: boolean | null;
  lastAssignedAt: Date | null;
};

export type AutoAssignWeekItem = {
  id: string;
  title: string;
  itemType: string;
  order: number;
  requiresStudentHelper: boolean;
  assignments: Array<{ role: string; publisher: { gender: string | null } }>;
};

export type AutoAssignWeekSection = {
  sectionType: string;
  order: number;
  items: AutoAssignWeekItem[];
};

export type AutoAssignWeek = {
  id: string;
  startDate: Date;
  presidentId: string | null;
  openingPrayerId: string | null;
  sections: AutoAssignWeekSection[];
};

export type AutoAssignProposal =
  | {
      kind: "special";
      key: string;
      field: "presidentId" | "openingPrayerId";
      label: string;
      publisherId: string;
      publisherName: string;
    }
  | {
      kind: "assignment";
      key: string;
      weekItemId: string;
      itemTitle: string;
      sectionType: string;
      role: AutoAssignRole;
      publisherId: string;
      publisherName: string;
    };

export type AutoAssignPlan = {
  proposals: AutoAssignProposal[];
  skipped: string[];
};

function getRoles(
  sectionType: string,
  item: { itemType: string; requiresStudentHelper: boolean }
): AutoAssignRole[] {
  if (sectionType === "BE_BETTER_TEACHERS") {
    return item.itemType === "SPEECH"
      ? ["ASSIGNEE"]
      : item.requiresStudentHelper
        ? ["ASSIGNEE", "HELPER"]
        : ["ASSIGNEE"];
  }

  if (sectionType === "CHRISTIAN_LIFE" && item.itemType === "DISCUSSION") {
    return ["CONDUCTOR", "READER"];
  }

  return ["ASSIGNEE"];
}

function choosePublisher<T extends AutoAssignCandidate>(
  publishers: T[],
  usedThisWeek: Set<string>
) {
  const unused = publishers.filter((publisher) => !usedThisWeek.has(publisher.id));
  const pool = unused.length > 0 ? unused : publishers;

  return [...pool].sort((a, b) => {
    if (a.lastAssignedAt === null && b.lastAssignedAt !== null) return -1;
    if (a.lastAssignedAt !== null && b.lastAssignedAt === null) return 1;
    if (a.lastAssignedAt && b.lastAssignedAt) {
      const byDate = a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
      if (byDate !== 0) return byDate;
    }
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
  })[0];
}

const fullName = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`;

/**
 * Build the auto-assign draft for a week without touching the database.
 * Criteria (per roadmap):
 * 1. Theocratic eligibility filter (gender/baptism/appointment).
 * 2. Rotation priority: least recently assigned first.
 * 3. No publisher takes two parts in the same meeting.
 * 4. HELPER paired with an ASSIGNEE of the same gender.
 */
export function buildAutoAssignPlan(
  week: AutoAssignWeek,
  publishers: AutoAssignCandidate[]
): AutoAssignPlan {
  const usedThisWeek = new Set<string>();
  const skipped: string[] = [];
  const proposals: AutoAssignProposal[] = [];

  // Special slots: president + opening prayer
  const specialSlots: Array<{
    field: "presidentId" | "openingPrayerId";
    label: string;
    sectionType: string;
  }> = [
    { field: "presidentId", label: "Presidencia", sectionType: "PRESIDENT" },
    {
      field: "openingPrayerId",
      label: "Oración de apertura",
      sectionType: "OPENING_PRAYER",
    },
  ];

  for (const slot of specialSlots) {
    const currentId = week[slot.field];
    if (currentId) {
      usedThisWeek.add(currentId);
      continue;
    }
    const eligible = publishers.filter((publisher) =>
      canAssignPublisher(publisher, { sectionType: slot.sectionType })
    );
    const publisher = choosePublisher(eligible, usedThisWeek);
    if (!publisher) {
      skipped.push(slot.label);
      continue;
    }
    proposals.push({
      kind: "special",
      key: `special-${slot.field}`,
      field: slot.field,
      label: slot.label,
      publisherId: publisher.id,
      publisherName: fullName(publisher),
    });
    usedThisWeek.add(publisher.id);
  }

  // Sections in canonical meeting order
  const orderedSections = [...week.sections].sort((a, b) => a.order - b.order);

  for (const section of orderedSections) {
    for (const item of section.items) {
      const roles = getRoles(section.sectionType, item);
      for (const role of roles) {
        if (item.assignments.some((assignment) => assignment.role === role)) continue;

        const pairedRole =
          role === "HELPER" ? "ASSIGNEE" : role === "ASSIGNEE" ? "HELPER" : null;

        // Look for the pair in existing DB assignments first, then in
        // proposals created earlier during this same planning pass.
        type AssignmentProposal = Extract<AutoAssignProposal, { kind: "assignment" }>;
        const pairedAssignment: AutoAssignWeekItem["assignments"][number] | AssignmentProposal | undefined =
          pairedRole
            ? item.assignments.find((assignment) => assignment.role === pairedRole) ??
              proposals.find(
                (proposal): proposal is AssignmentProposal =>
                  proposal.kind === "assignment" &&
                  proposal.weekItemId === item.id &&
                  proposal.role === pairedRole
              )
            : undefined;

        let pairedGender: "MALE" | "FEMALE" | undefined;
        if (pairedAssignment) {
          if ("publisher" in pairedAssignment) {
            const gender = pairedAssignment.publisher.gender;
            pairedGender = gender === "MALE" || gender === "FEMALE" ? gender : undefined;
          } else {
            const gender = publishers.find(
              (p) => p.id === pairedAssignment.publisherId
            )?.gender;
            pairedGender = gender === "MALE" || gender === "FEMALE" ? gender : undefined;
          }
        }

        const eligible = publishers.filter((publisher) => {
          if (
            !canAssignPublisher(publisher, {
              sectionType: section.sectionType,
              itemType: item.itemType,
              role,
            })
          ) {
            return false;
          }
          return !pairedGender || pairedGender === publisher.gender;
        });

        const publisher = choosePublisher(eligible, usedThisWeek);
        if (!publisher) {
          skipped.push(`${item.title} (${role})`);
          continue;
        }

        proposals.push({
          kind: "assignment",
          key: `assignment-${item.id}-${role}`,
          weekItemId: item.id,
          itemTitle: item.title,
          sectionType: section.sectionType,
          role,
          publisherId: publisher.id,
          publisherName: fullName(publisher),
        });
        usedThisWeek.add(publisher.id);
      }
    }
  }

  return { proposals, skipped };
}
