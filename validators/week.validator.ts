import { z } from "zod";

export const weekCreateSchema = z
  .object({
    weekNumber: z
      .number()
      .int("El número de semana debe ser un número entero")
      .min(1, "El número de semana debe ser al menos 1")
      .max(53, "El número de semana no puede ser mayor a 53"),
    year: z
      .number()
      .int("El año debe ser un número entero")
      .min(2020, "El año debe ser al menos 2020")
      .max(2100, "El año no puede ser mayor a 2100"),
    startDate: z.coerce.date({
      message: "Fecha de inicio inválida",
    }),
    endDate: z.coerce.date({
      message: "Fecha de fin inválida",
    }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const daysDiff =
        (data.endDate.getTime() - data.startDate.getTime()) /
        (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    },
    {
      message: "El rango de fechas no puede ser mayor a 7 días",
      path: ["endDate"],
    }
  );

export const weekUpdateSchema = z
  .object({
    weekNumber: z
      .number()
      .int("El número de semana debe ser un número entero")
      .min(1, "El número de semana debe ser al menos 1")
      .max(53, "El número de semana no puede ser mayor a 53")
      .optional(),
    year: z
      .number()
      .int("El año debe ser un número entero")
      .min(2020, "El año debe ser al menos 2020")
      .max(2100, "El año no puede ser mayor a 2100")
      .optional(),
    startDate: z.coerce
      .date({
        message: "Fecha de inicio inválida",
      })
      .optional(),
    endDate: z.coerce
      .date({
        message: "Fecha de fin inválida",
      })
      .optional(),
    isConfirmed: z.boolean().optional(),
    presidentId: z.string().min(1, "ID de publicador inválido").nullable().optional(),
    openingPrayerId: z.string().min(1, "ID de publicador inválido").nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["endDate"],
    }
  );

export const weekSectionCreateSchema = z.object({
  weekId: z.string().uuid("ID de semana inválido"),
  sectionType: z.enum(
    [
      "PRESIDENT",
      "OPENING_PRAYER",
      "TREASURES",
      "BE_BETTER_TEACHERS",
      "CHRISTIAN_LIFE",
      "CLOSING_PRAYER",
    ],
    {
      message: "Tipo de sección inválido",
    }
  ),
  order: z.number().int().min(0, "El orden debe ser un número positivo"),
});

export const weekSectionUpdateSchema = z.object({
  sectionType: z
    .enum(
      [
        "PRESIDENT",
        "OPENING_PRAYER",
        "TREASURES",
        "BE_BETTER_TEACHERS",
        "CHRISTIAN_LIFE",
        "CLOSING_PRAYER",
      ],
      {
        message: "Tipo de sección inválido",
      }
    )
    .optional(),
  order: z
    .number()
    .int()
    .min(0, "El orden debe ser un número positivo")
    .optional(),
});

export const weekItemCreateSchema = z.object({
  weekSectionId: z.string().uuid("ID de sección inválido"),
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(500, "El título no puede exceder 500 caracteres")
    .trim(),
  itemType: z.enum(
    ["SPEECH", "READING", "DISCUSSION", "CONDUCTOR_READER", "PRAYER"],
    {
      message: "Tipo de item inválido",
    }
  ),
  order: z.number().int().min(0, "El orden debe ser un número positivo"),
  requiresStudentHelper: z.boolean().default(false),
});

export const weekItemUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(500, "El título no puede exceder 500 caracteres")
    .trim()
    .optional(),
  itemType: z
    .enum(["SPEECH", "READING", "DISCUSSION", "CONDUCTOR_READER", "PRAYER"], {
      message: "Tipo de item inválido",
    })
    .optional(),
  order: z
    .number()
    .int()
    .min(0, "El orden debe ser un número positivo")
    .optional(),
  requiresStudentHelper: z.boolean().optional(),
});

export type WeekCreateInput = z.infer<typeof weekCreateSchema>;
export type WeekUpdateInput = z.infer<typeof weekUpdateSchema>;
export type WeekSectionCreateInput = z.infer<typeof weekSectionCreateSchema>;
export type WeekSectionUpdateInput = z.infer<typeof weekSectionUpdateSchema>;
export type WeekItemCreateInput = z.infer<typeof weekItemCreateSchema>;
export type WeekItemUpdateInput = z.infer<typeof weekItemUpdateSchema>;
