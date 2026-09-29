"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, MoreVertical, Music, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WhatsAppIcon } from "@/components/vymc/whatsapp-icon";
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
  onRemoveOpeningPrayer?: () => void;
  onShareWhatsApp?: (data: WhatsAppShareData) => void;
  editingItemId: string | null;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
  onStartEditingTitle: (itemId: string, currentTitle: string) => void;
  onCancelEditingTitle: () => void;
  onSaveEditingTitle: () => void;
  isUpdatingTitle: boolean;
  onAddItem?: (section: WeekSection) => void;
  onDeleteItem?: (item: WeekItem) => void;
  onMoveItem?: (itemId: string, swapWithItemId: string) => void;
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
    <span className="inline-flex items-center gap-1.5">
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
        <button type="button" onClick={onRemove} className="hover:opacity-70" title="Quitar">
          <X className="w-3 h-3" />
        </button>
      </span>
      {onShareWhatsApp && (
        <button
          type="button"
          onClick={onShareWhatsApp}
          aria-label="Notificar por WhatsApp"
          title="Notificar por WhatsApp"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] border border-[#128C4B]/50 text-[#ffffff] shadow-sm hover:bg-[#1eb457] transition-colors"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </button>
      )}
    </span>
  );
}

function ItemActions({
  item,
  prevItem,
  nextItem,
  onMoveItem,
  onStartEditingTitle,
  onDeleteItem,
  buttonClassName,
  iconClassName,
}: {
  item: WeekItem;
  prevItem: WeekItem | null;
  nextItem: WeekItem | null;
  onMoveItem?: (itemId: string, swapWithItemId: string) => void;
  onStartEditingTitle: (itemId: string, currentTitle: string) => void;
  onDeleteItem?: (item: WeekItem) => void;
  buttonClassName: (tone: "neutral" | "danger") => string;
  iconClassName: string;
}) {
  return (
    <>
      {onMoveItem && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => prevItem && onMoveItem(item.id, prevItem.id)}
                disabled={!prevItem}
                aria-label="Subir tema"
                className={buttonClassName("neutral")}
              >
                <ChevronUp className={iconClassName} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Subir tema</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => nextItem && onMoveItem(item.id, nextItem.id)}
                disabled={!nextItem}
                aria-label="Bajar tema"
                className={buttonClassName("neutral")}
              >
                <ChevronDown className={iconClassName} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bajar tema</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onStartEditingTitle(item.id, item.title)}
            aria-label="Editar título"
            className={buttonClassName("neutral")}
          >
            <Pencil className={iconClassName} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Editar título</p>
        </TooltipContent>
      </Tooltip>
      {onDeleteItem && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onDeleteItem(item)}
              aria-label="Eliminar tema"
              className={buttonClassName("danger")}
            >
              <Trash2 className={iconClassName} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar tema</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

const itemSideButtonClass = (tone: "neutral" | "danger") =>
  `inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm transition-all disabled:opacity-30 disabled:cursor-default ${
    tone === "danger"
      ? "text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 hover:shadow-md"
      : "text-gray-500 hover:text-primary hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
  }`;

/* Mobile: kebab menu with labeled actions (progressive disclosure) */
function ItemKebabMenu({
  item,
  prevItem,
  nextItem,
  onMoveItem,
  onStartEditingTitle,
  onDeleteItem,
}: {
  item: WeekItem;
  prevItem: WeekItem | null;
  nextItem: WeekItem | null;
  onMoveItem?: (itemId: string, swapWithItemId: string) => void;
  onStartEditingTitle: (itemId: string, currentTitle: string) => void;
  onDeleteItem?: (item: WeekItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  const menuBtn =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-gray-700 active:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-default";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Opciones del tema"
          aria-haspopup="menu"
          className="inline-flex items-center justify-center w-9 h-9 -mr-2 rounded-lg text-gray-500 active:bg-gray-100 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-56 p-1.5">
        <div role="menu" aria-label="Opciones del tema">
          {onMoveItem && (
            <>
              <button
                type="button"
                role="menuitem"
                disabled={!prevItem}
                onClick={run(() => prevItem && onMoveItem(item.id, prevItem.id))}
                className={menuBtn}
              >
                <ChevronUp className="w-4 h-4" />
                Subir tema
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!nextItem}
                onClick={run(() => nextItem && onMoveItem(item.id, nextItem.id))}
                className={menuBtn}
              >
                <ChevronDown className="w-4 h-4" />
                Bajar tema
              </button>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={run(() => onStartEditingTitle(item.id, item.title))}
            className={menuBtn}
          >
            <Pencil className="w-4 h-4" />
            Editar título
          </button>
          {onDeleteItem && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                role="menuitem"
                onClick={run(() => onDeleteItem(item))}
                className={`${menuBtn} text-red-600`}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar tema
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
  onRemoveOpeningPrayer,
  editingItemId,
  editingTitle,
  onEditingTitleChange,
  onStartEditingTitle,
  onCancelEditingTitle,
  onSaveEditingTitle,
  isUpdatingTitle,
  onAddItem,
  onDeleteItem,
  onMoveItem,
}: WeekSectionCardProps) {
  const isPlaceholder = section.id.startsWith("__placeholder_");
  const isOpeningPrayer = section.sectionType === "OPENING_PRAYER";
  const canAddItem =
    !isPlaceholder &&
    ["TREASURES", "BE_BETTER_TEACHERS", "CHRISTIAN_LIFE"].includes(section.sectionType);

  return (
    <Card className="border overflow-hidden">
      {/* Section Header */}
      <div
        className={`px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2 ${
          SECTION_COLORS[section.sectionType] ?? "bg-gray-100"
        } ${
          SECTION_TEXT_COLORS[section.sectionType] ?? "text-gray-800"
        }`}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          {SECTION_TITLES[section.sectionType] ?? section.sectionType}
        </h2>
        {canAddItem && onAddItem && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAddItem(section)}
                className="inline-flex items-center justify-center w-11 h-11 -my-3 rounded-full text-current opacity-70 hover:opacity-100 hover:bg-white/20 active:bg-white/30 transition-all"
                aria-label="Agregar tema fuera del programa"
              >
                <Plus className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Agregar tema fuera del programa</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Section Items */}
      <CardContent className="px-3 pb-2 pt-2 sm:px-5 sm:pb-3 sm:pt-3 bg-card">
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
            {/* Row 1: Song + Opening Prayer (stacked on mobile, side by side on desktop) */}
            <div className="flex flex-col items-start gap-1.5 px-2 py-1.5 rounded-lg sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3 sm:py-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 font-medium">
                  Canción {openingItem.songNumber}
                </span>
              </div>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm text-card-foreground font-medium mr-1">
                  Oración inicial
                </span>
                {openingPrayerPublisher ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white">
                      <span>
                        {openingPrayerPublisher.firstName} {openingPrayerPublisher.lastName}
                        {" · "}Asignado
                      </span>
                      <button
                        onClick={onRemoveOpeningPrayer ?? onChangeOpeningPrayer}
                        className="ml-1 hover:opacity-70"
                        title="Quitar y elegir otro"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
                        aria-label="Notificar por WhatsApp"
                        title="Notificar por WhatsApp"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] border border-[#128C4B]/50 text-[#ffffff] shadow-sm hover:bg-[#1eb457] transition-colors"
                      >
                        <WhatsAppIcon className="w-5 h-5" />
                      </button>
                    )}
                  </span>
                ) : (
                  <button
                    onClick={onChangeOpeningPrayer}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-muted transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Asignado
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Introduction words (time only, no assignment) */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg sm:px-3 sm:py-2">
              <span className="text-sm text-card-foreground font-medium">
                Palabras de introducción
              </span>
              {openingItem.timeMinutes != null && openingItem.timeMinutes > 0 && (
                <span className="text-xs text-muted-foreground">
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
          <div className="space-y-1 sm:space-y-1.5">
            {section.items
              .filter((item) => !(
                section.sectionType === "CHRISTIAN_LIFE" &&
                item.title.toLowerCase().includes("palabras de conclusión")
              ))
              .map((item, index, displayedItems) => {
                const availableRoles = getAvailableRolesForItem(
                  section.sectionType,
                  item
                );
                const isPureSong = !!item.songNumber && !item.timeMinutes;

                if (isPureSong) {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2"
                    >
                      <Music className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">
                        Canción {item.songNumber}
                      </span>
                    </div>
                  );
                }

                const prevItem = index > 0 ? displayedItems[index - 1] : null;
                const nextItem = index < displayedItems.length - 1 ? displayedItems[index + 1] : null;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted sm:gap-3 sm:px-3 sm:py-2"
                  >
                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-0.5 sm:mb-1">
                        {/* Title with edit functionality */}
                        {editingItemId === item.id ? (
                          <div className="flex min-w-0 flex-1 items-center gap-2">
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
                                  aria-label="Guardar título"
                                  className="inline-flex items-center justify-center w-11 h-11 -my-2 rounded-full text-green-600 hover:text-green-700 active:bg-green-100 disabled:opacity-50"
                                >
                                  <Check className="w-5 h-5" />
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
                                  aria-label="Cancelar edición"
                                  className="inline-flex items-center justify-center w-11 h-11 -my-2 rounded-full text-gray-400 hover:text-gray-600 active:bg-gray-200 disabled:opacity-50"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancelar (Esc)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="min-w-0 flex-1 text-sm text-card-foreground">
                            {item.title
                              .replace(/Canción\s*\d+\s*(y oración\s*)?\s*\|\s*/i, "")
                              .replace(/\s*\(\)\s*$/, "")}
                          </span>
                        )}

                        {/* Time - always show if present */}
                        {item.timeMinutes != null && item.timeMinutes > 0 && (
                          <span className="shrink-0 text-xs text-muted-foreground pt-0.5">
                            ({item.timeMinutes} min)
                          </span>
                        )}
                        {/* Mobile: kebab menu pinned top-right on the first line */}
                        {editingItemId !== item.id && (
                          <span className="shrink-0 -mt-2 md:hidden">
                            <ItemKebabMenu
                              item={item}
                              prevItem={prevItem}
                              nextItem={nextItem}
                              onMoveItem={onMoveItem}
                              onStartEditingTitle={onStartEditingTitle}
                              onDeleteItem={onDeleteItem}
                            />
                          </span>
                        )}
                      </div>

                      {/* Show assignments only for assignable items */}
                      {(!item.songNumber || item.timeMinutes != null) &&
                       !item.title.toLowerCase().includes("palabras de introducción") && (
                        <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
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
                                        : "text-gray-600 border-gray-300 hover:bg-muted"
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
                    {/* Desktop: actions at the right margin */}
                    {editingItemId !== item.id && (
                      <div className="hidden md:flex items-center gap-1.5 shrink-0">
                        <ItemActions
                          item={item}
                          prevItem={prevItem}
                          nextItem={nextItem}
                          onMoveItem={onMoveItem}
                          onStartEditingTitle={onStartEditingTitle}
                          onDeleteItem={onDeleteItem}
                          buttonClassName={itemSideButtonClass}
                          iconClassName="w-4 h-4"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

            {/* ---- Closing elements inside CHRISTIAN_LIFE ---- */}
            {section.sectionType === "CHRISTIAN_LIFE" && conclusionItem && (
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                {/* Palabras de conclusión */}
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg sm:px-3 sm:py-2">
                  <span className="text-sm text-card-foreground font-medium">
                    Palabras de conclusión
                  </span>
                  {conclusionItem.timeMinutes != null && conclusionItem.timeMinutes > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({conclusionItem.timeMinutes} min)
                    </span>
                  )}
                </div>

                {/* Closing song + Closing prayer (stacked on mobile, side by side on desktop) */}
                {conclusionItem.songNumber && (
                  <div className="flex flex-col items-start gap-2 py-2 px-3 rounded-lg sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium">
                        Canción {conclusionItem.songNumber}
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-1.5">
                      <span className="text-sm text-card-foreground font-medium mr-1">
                        Oración final
                      </span>
                      {closingPrayerItem?.assignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-1.5"
                        >
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white">
                            <span>
                              {assignment.publisher.firstName} {assignment.publisher.lastName}
                              {" · "}Asignado
                            </span>
                            <button
                              onClick={() => onRemoveAssignment(assignment.id)}
                              className="ml-1 hover:opacity-70"
                              title="Quitar"
                            >
                              <X className="w-3 h-3" />
                            </button>
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
                              aria-label="Notificar por WhatsApp"
                              title="Notificar por WhatsApp"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] border border-[#128C4B]/50 text-[#ffffff] shadow-sm hover:bg-[#1eb457] transition-colors"
                            >
                              <WhatsAppIcon className="w-5 h-5" />
                            </button>
                          )}
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
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-muted transition-colors"
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
                    <span className="text-sm text-card-foreground font-medium">
                      Oración final
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 ml-2">
                      {closingPrayerItem?.assignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className="inline-flex items-center gap-1.5"
                        >
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-600 text-white">
                            <span>
                              {assignment.publisher.firstName} {assignment.publisher.lastName}
                              {" · "}Asignado
                            </span>
                            <button
                              onClick={() => onRemoveAssignment(assignment.id)}
                              className="ml-1 hover:opacity-70"
                              title="Quitar"
                            >
                              <X className="w-3 h-3" />
                            </button>
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
                              aria-label="Notificar por WhatsApp"
                              title="Notificar por WhatsApp"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] border border-[#128C4B]/50 text-[#ffffff] shadow-sm hover:bg-[#1eb457] transition-colors"
                            >
                              <WhatsAppIcon className="w-5 h-5" />
                            </button>
                          )}
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
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-muted transition-colors"
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
