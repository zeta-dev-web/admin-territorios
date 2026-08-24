"use client";

import { Check, MessageCircle, Music, Pencil, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  SECTION_COLORS,
  SECTION_TEXT_COLORS,
  SECTION_TITLES,
  ROLE_BADGES,
  ROLE_LABELS,
  getAvailableRolesForItem,
  getPlaceholderLabel,
} from "@/components/vymc/week-display-config";
import type {
  PublisherAssignment,
  WeekItem,
  WeekSection,
} from "@/types/week-detail";
import type { WhatsAppShareData } from './whatsapp-share-data'

type SpecialPublisher = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

function getPartnerGender(
  item: WeekItem,
  role: string
): "MALE" | "FEMALE" | null {
  if (!["ASSIGNEE", "HELPER"].includes(role)) return null;
  const pairedRole = role === "HELPER" ? "ASSIGNEE" : "HELPER";
  const partner = item.assignments.find((assignment) => assignment.role === pairedRole);
  return partner ? partner.publisher.gender : null;
}

type WeekSectionCardProps = {
  section: WeekSection;
  openingItem: WeekItem | null;
  openingPrayerPublisher: SpecialPublisher | null;
  conclusionItem: WeekItem | null;
  closingPrayerItem: WeekItem | null;
  onAssign: (
    item: WeekItem,
    sectionType: string,
    isPlaceholder: boolean,
    preSelectedRole?: string
  ) => Promise<void> | void;
  onRemoveAssignment: (assignmentId: string) => Promise<void> | void;
  onAiAssigned: () => Promise<void> | void;
  onChangeOpeningPrayer: () => void;
  onShareWhatsApp?: (data: WhatsAppShareData) => void;
  editingItemId: string | null;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
  onStartEditingTitle: (itemId: string, currentTitle: string) => void;
  onCancelEditingTitle: () => void;
  onSaveEditingTitle: () => void;
  isUpdatingTitle: boolean;
};

function AssignmentBadge({
  assignment,
  badgeClassName,
  onRemove,
  onShareWhatsApp,
}: {
  assignment: PublisherAssignment;
  badgeClassName?: string;
  onRemove: () => void;
  onShareWhatsApp?: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${
        badgeClassName ?? "bg-gray-600 text-white"
      }`}
    >
      <span>
        {assignment.publisher.firstName} {assignment.publisher.lastName}
        {" · "}
        {ROLE_LABELS[assignment.role] ?? assignment.role}
      </span>
      {onShareWhatsApp && (
        <button
          type="button"
          onClick={onShareWhatsApp}
          className="text-emerald-300 hover:text-white transition-colors"
          title="Notificar por WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
      )}
      <button type="button" onClick={onRemove} className="hover:opacity-70" title="Quitar">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export function WeekSectionCard({
  section,
  openingItem,
  openingPrayerPublisher,
  conclusionItem,
  closingPrayerItem,
  onAssign,
  onRemoveAssignment,
  onAiAssigned,
  onShareWhatsApp,
  onChangeOpeningPrayer,
  editingItemId,
  editingTitle,
  onEditingTitleChange,
  onStartEditingTitle,
  onCancelEditingTitle,
  onSaveEditingTitle,
  isUpdatingTitle,
}: WeekSectionCardProps) {
  const isPlaceholder = section.id.startsWith("__placeholder_");
  const isOpeningPrayer = section.sectionType === "OPENING_PRAYER";

  return (
    <Card className="border overflow-hidden">
      {/* Section Header */}
      <div
        className={`px-5 py-2.5 ${
          SECTION_COLORS[section.sectionType] ?? "bg-gray-100"
        } ${
          SECTION_TEXT_COLORS[section.sectionType] ?? "text-gray-800"
        }`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          {SECTION_TITLES[section.sectionType] ?? section.sectionType}
        </h2>
      </div>

      {/* Section Items */}
      <CardContent className="pt-3 pb-3 px-5 bg-card">
        {isPlaceholder ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground/70 mb-3">
              Esta sección no tiene elementos asignables todavía.
            </p>
            <Button
              onClick={async () => {
                const fakeItem: WeekItem = {
                  id: `__new_${section.sectionType}`,
                  title: SECTION_TITLES[section.sectionType] ?? section.sectionType,
                  itemType: "DISCUSSION",
                  order: 1,
                  requiresStudentHelper: false,
                  assignments: [],
                };
                await onAssign(fakeItem, section.sectionType, true);
              }}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Asignar {getPlaceholderLabel(section.sectionType)}
            </Button>
          </div>
        ) : isOpeningPrayer && openingItem ? (
          /* ---- OPENING PRAYER: custom 2-row layout ---- */
          <div className="space-y-2">
            {/* Row 1: Song + Opening Prayer side by side */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 font-medium">
                  Canción {openingItem.songNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-900 font-medium mr-1">
                  Oración inicial
                </span>
                {openingPrayerPublisher ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white">
                    <span>
                      {openingPrayerPublisher.firstName} {openingPrayerPublisher.lastName}
                      {" · "}Asignado
                    </span>
                    {onShareWhatsApp && (
                      <button
                        type="button"
                        onClick={() =>
                          onShareWhatsApp({
                            publisherId: openingPrayerPublisher.id,
                            publisherName: `${openingPrayerPublisher.firstName} ${openingPrayerPublisher.lastName}`,
                            phone: openingPrayerPublisher.phone,
                            gender: "MALE",
                            role: "ASSIGNEE",
                            roleLabel: "Oración inicial",
                            partTitle: `Canción ${openingItem.songNumber} y oración de apertura`,
                            sectionTitle: "Apertura",
                            weekRangeText: "",
                            songNumber: openingItem.songNumber,
                          })
                        }
                        className="text-emerald-300 hover:text-white transition-colors ml-0.5"
                        title="Notificar por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={onChangeOpeningPrayer}
                      className="ml-1 hover:opacity-70"
                      title="Cambiar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={onChangeOpeningPrayer}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-blue-50 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Asignado
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Introduction words (time only, no assignment) */}
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg">
              <span className="text-sm text-gray-900 font-medium">
                Palabras de introducción
              </span>
              {openingItem.timeMinutes != null && openingItem.timeMinutes > 0 && (
                <span className="text-xs text-gray-500">
                  ({openingItem.timeMinutes} min)
                </span>
              )}
            </div>
          </div>
        ) : section.items.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground/70 italic">Sin elementos</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {section.items
              .filter((item) => !(
                section.sectionType === "CHRISTIAN_LIFE" &&
                item.title.toLowerCase().includes("palabras de conclusión")
              ))
              .map((item) => {
                const availableRoles = getAvailableRolesForItem(
                  section.sectionType,
                  item
                );
                const isPureSong = !!item.songNumber && !item.timeMinutes;

                if (isPureSong) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg"
                    >
                      <Music className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">
                        Canción {item.songNumber}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/70 transition-colors"
                  >
                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap mb-1">
                        {/* Title with edit functionality */}
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingTitle}
                              onChange={(e) => onEditingTitleChange(e.target.value)}
                              className="text-sm h-7 px-2"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onSaveEditingTitle();
                                if (e.key === "Escape") onCancelEditingTitle();
                              }}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={onSaveEditingTitle}
                                  disabled={isUpdatingTitle}
                                  className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Guardar (Enter)</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={onCancelEditingTitle}
                                  disabled={isUpdatingTitle}
                                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancelar (Esc)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-gray-900">
                              {item.title
                                .replace(/Canción\s*\d+\s*(y oración\s*)?\s*\|\s*/i, "")
                                .replace(/\s*\(\)\s*$/, "")}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onStartEditingTitle(item.id, item.title)}
                                  className="text-gray-400 hover:text-primary transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar título</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        {/* Time - always show if present */}
                        {item.timeMinutes != null && item.timeMinutes > 0 && (
                          <span className="text-xs text-gray-500">
                            ({item.timeMinutes} min)
                          </span>
                        )}
                      </div>

                      {/* Show assignments only for assignable items */}
                      {(!item.songNumber || item.timeMinutes != null) &&
                       !item.title.toLowerCase().includes("palabras de introducción") && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.assignments.map((assignment) => {
                            const assignedAssignment = item.assignments.find((a) => a.role === "ASSIGNEE");
                            const helperAssignment = item.assignments.find((a) => a.role === "HELPER");
                            const helperName = helperAssignment && helperAssignment.id !== assignment.id
                              ? `${helperAssignment.publisher.firstName} ${helperAssignment.publisher.lastName}`
                              : undefined;
                            const assignedName = assignment.role === "HELPER" && assignedAssignment
                              ? `${assignedAssignment.publisher.firstName} ${assignedAssignment.publisher.lastName}`
                              : undefined;

                            return (
                              <AssignmentBadge
                                key={assignment.id}
                                assignment={assignment}
                                badgeClassName={
                                  ROLE_BADGES[assignment.role] ?? "bg-gray-500 text-white"
                                }
                                onRemove={() => onRemoveAssignment(assignment.id)}
                                onShareWhatsApp={
                                  onShareWhatsApp
                                    ? () =>
                                        onShareWhatsApp({
                                          publisherId: assignment.publisher.id,
                                          publisherName: `${assignment.publisher.firstName} ${assignment.publisher.lastName}`,
                                          phone: assignment.publisher.phone,
                                          gender: assignment.publisher.gender,
                                          role: assignment.role,
                                          roleLabel: ROLE_LABELS[assignment.role] ?? assignment.role,
                                          partTitle: item.title
                                            .replace(/Canción\s*\d+\s*(y oración\s*)?\s*\|\s*/i, "")
                                            .replace(/\s*\(\)\s*$/, ""),
                                          sectionTitle: SECTION_TITLES[section.sectionType] ?? section.sectionType,
                                          weekRangeText: "",
                                          durationMinutes: item.timeMinutes,
                                          songNumber: item.songNumber,
                                          helperName,
                                          assignedName,
                                        })
                                    : undefined
                                }
                              />
                            );
                          })}

                          {/* Role-specific add buttons */}
                          {availableRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {availableRoles.map((role) => (
                                <div
                                  key={role.value}
                                  className="inline-flex items-center gap-0.5"
                                >
                                  <button
                                    onClick={() => {
                                      onAssign(
                                        item,
                                        section.sectionType,
                                        false,
                                        role.value
                                      );
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs border rounded transition-colors ${
                                      role.value === "HELPER" || role.value === "READER"
                                        ? "text-amber-700 border-amber-300 hover:bg-amber-200"
                                        : "text-gray-600 border-gray-300 hover:bg-gray-200"
                                    }`}
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    {role.label}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : item.assignments.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">
                              Sin asignación
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* ---- Closing elements inside CHRISTIAN_LIFE ---- */}
            {section.sectionType === "CHRISTIAN_LIFE" && conclusionItem && (
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                {/* Palabras de conclusión */}
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg">
                  <span className="text-sm text-gray-900 font-medium">
                    Palabras de conclusión
                  </span>
                  {conclusionItem.timeMinutes != null && conclusionItem.timeMinutes > 0 && (
                    <span className="text-xs text-gray-500">
                      ({conclusionItem.timeMinutes} min)
                    </span>
                  )}
                </div>

                {/* Closing song + Closing prayer side by side */}
                {conclusionItem.songNumber && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">
                        Canción {conclusionItem.songNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-900 font-medium mr-1">
                        Oración final
                      </span>
                      {closingPrayerItem?.assignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white"
                        >
                          <span>
                            {assignment.publisher.firstName} {assignment.publisher.lastName}
                            {" · "}Asignado
                          </span>
                          {onShareWhatsApp && (
                            <button
                              type="button"
                              onClick={() =>
                                onShareWhatsApp({
                                  publisherId: assignment.publisher.id,
                                  publisherName: `${assignment.publisher.firstName} ${assignment.publisher.lastName}`,
                                  phone: assignment.publisher.phone,
                                  gender: assignment.publisher.gender,
                                  role: assignment.role,
                                  roleLabel: "Oración final",
                                  partTitle: `Canción ${conclusionItem.songNumber} y oración final`,
                                  sectionTitle: "Vida Cristiana",
                                  weekRangeText: "",
                                  songNumber: conclusionItem.songNumber,
                                })
                              }
                              className="text-emerald-300 hover:text-white transition-colors ml-0.5"
                              title="Notificar por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveAssignment(assignment.id)}
                            className="ml-1 hover:opacity-70"
                            title="Quitar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {closingPrayerItem && (() => {
                        const takenRoles = new Set(closingPrayerItem.assignments.map((a) => a.role));
                        if (!takenRoles.has("ASSIGNEE")) {
                          return (
                            <div className="inline-flex items-center gap-0.5">
                              <button
                                onClick={() => {
                                  onAssign(closingPrayerItem, "CLOSING_PRAYER", false, "ASSIGNEE");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-blue-50 transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Asignado
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Closing prayer without song */}
                {!conclusionItem?.songNumber && (
                  <div className="flex items-center gap-2 py-2 px-3 rounded-lg">
                    <span className="text-sm text-gray-900 font-medium">
                      Oración final
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 ml-2">
                      {closingPrayerItem?.assignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white"
                        >
                          <span>
                            {assignment.publisher.firstName} {assignment.publisher.lastName}
                            {" · "}Asignado
                          </span>
                          {onShareWhatsApp && (
                            <button
                              type="button"
                              onClick={() =>
                                onShareWhatsApp({
                                  publisherId: assignment.publisher.id,
                                  publisherName: `${assignment.publisher.firstName} ${assignment.publisher.lastName}`,
                                  phone: assignment.publisher.phone,
                                  gender: assignment.publisher.gender,
                                  role: assignment.role,
                                  roleLabel: "Oración final",
                                  partTitle: "Oración final",
                                  sectionTitle: "Vida Cristiana",
                                  weekRangeText: "",
                                })
                              }
                              className="text-emerald-300 hover:text-white transition-colors ml-0.5"
                              title="Notificar por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveAssignment(assignment.id)}
                            className="ml-1 hover:opacity-70"
                            title="Quitar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {closingPrayerItem && (() => {
                        const takenRoles = new Set(closingPrayerItem.assignments.map((a) => a.role));
                        if (!takenRoles.has("ASSIGNEE")) {
                          return (
                            <div className="inline-flex items-center gap-0.5">
                              <button
                                onClick={() => {
                                  onAssign(closingPrayerItem, "CLOSING_PRAYER", false);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-blue-50 transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Asignado
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
