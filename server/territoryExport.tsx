'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'
import type { TerritoryRange, PdfExportResult } from '@/types'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ── UTILITY ──

/**
 * Formatea una fecha a DD/MM/YYYY
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Devuelve el nombre base (Name_N) para un slot de territorio.
 *
 * El PDF S-13-S tiene 10 slots (2 páginas × 5 columnas).
 * Cada columna tiene 25 filas de asignaciones.
 * Los nombres se distribuyen en step=5 por columna:
 *
 * Página 1 (slots 0-4):
 *   Slot 0 (Terr_1, col 1): Name_001, Name_006, Name_011...Name_121
 *   Slot 1 (Terr_2, col 2): Name_002, Name_007, Name_012...Name_122
 *   Slot 4 (Terr_5, col 5): Name_005, Name_010, Name_015...Name_125
 *
 * Página 2 (slots 5-9):
 *   Slot 5 (Terr_6, col 1): Name_126, Name_131...Name_246
 *   Slot 9 (Terr_10, col 5): Name_130, Name_135...Name_250
 */
function getBaseNameForSlot(slotIdx: number): number {
  // Slot 0-4 → página 1 (base 1-5), Slot 5-9 → página 2 (base 126-130)
  return slotIdx < 5 ? slotIdx + 1 : slotIdx + 121
}

// ── RANGES ──

/**
 * Obtiene los rangos de 10 territorios disponibles.
 * Siempre genera rangos completos: 1-10, 11-20, 21-30...
 * El último rango se ajusta al próximo múltiplo de 10 del máximo territorio.
 */
export async function getAvailableTerritoryRanges(): Promise<TerritoryRange[]> {
  try {
    const tenantId = await getCurrentTenantId()
    const territories = await prisma.territory.findMany({
      where: { tenantId },
      select: { number: true },
      orderBy: { number: 'asc' },
    })

    if (territories.length === 0) return []

    const maxNumber = territories[territories.length - 1].number
    const maxRangeEnd = Math.ceil(maxNumber / 10) * 10
    const ranges: TerritoryRange[] = []

    for (let start = 1; start <= maxRangeEnd; start += 10) {
      const end = start + 9
      const count = territories.filter(t => t.number >= start && t.number <= end).length

      ranges.push({
        start,
        end,
        label: `${start}-${end}`,
        count,
      })
    }

    return ranges
  } catch (error) {
    console.error('Error al obtener rangos de territorios:', error)
    return []
  }
}

// ── PDF GENERATION ──

/**
 * Obtiene los territorios de un rango con sus asignaciones completadas en un período
 * y genera un PDF rellenando la plantilla S-13-S
 */
export async function exportTerritoryHistoryPdf(
  startNumber: number,
  endNumber: number,
  fromMonth: number,
  fromYear: number,
  toMonth: number,
  toYear: number,
  includeActive: boolean = false
): Promise<PdfExportResult> {
  try {
    const tenantId = await getCurrentTenantId()

    // ── Validaciones ──
    if (startNumber < 1 || endNumber < startNumber || endNumber - startNumber > 9) {
      return {
        success: false,
        message: 'Rango de territorios inválido. Debe ser un rango de 1 a 10 territorios.',
      }
    }

    if (fromMonth < 1 || fromMonth > 12 || fromYear < 2000 || fromYear > 2100) {
      return { success: false, message: 'Mes/año de inicio inválido.' }
    }
    if (toMonth < 1 || toMonth > 12 || toYear < 2000 || toYear > 2100) {
      return { success: false, message: 'Mes/año de fin inválido.' }
    }

    const fromTotal = fromYear * 12 + fromMonth
    const toTotal = toYear * 12 + toMonth
    if (fromTotal > toTotal) {
      return { success: false, message: 'El mes de inicio no puede ser posterior al mes de fin.' }
    }

    // ── Consultar datos ──
    const fromDate = new Date(fromYear, fromMonth - 1, 1)
    const toDate = new Date(toYear, toMonth, 0, 23, 59, 59, 999)

    const territories = await prisma.territory.findMany({
      where: {
        number: { gte: startNumber, lte: endNumber },
        tenantId,
      },
      include: {
        assignments: {
          where: includeActive
            ? {
                OR: [
                  { endDate: { gte: fromDate, lte: toDate } },
                  { endDate: null },
                ],
              }
            : {
                endDate: { gte: fromDate, lte: toDate },
              },
          include: {
            publisher: { select: { firstName: true, lastName: true } },
          },
          orderBy: [
            { startDate: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        personalAssignments: {
          where: includeActive
            ? {
                OR: [
                  { returnedDate: { gte: fromDate, lte: toDate } },
                  { returnedDate: null },
                ],
              }
            : {
                returnedDate: { gte: fromDate, lte: toDate },
              },
          include: {
            publisher: { select: { firstName: true, lastName: true } },
          },
          orderBy: [
            { assignedDate: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
      orderBy: { number: 'asc' },
    })

    // ── Cargar plantilla PDF ──
    const templatePath = path.join(process.cwd(), 'templates', 'S-13-S.pdf')
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()

    // ── Mapear datos por territorio ──
    const territoryMap = new Map<number, { name: string; assigned: string; returned: string }[]>()

    territories.forEach(t => {
      const assignments: { name: string; assigned: string; returned: string }[] = []

      // Asignaciones de conductor
      t.assignments.forEach(a => {
        assignments.push({
          name: a.publisher ? `${a.publisher.firstName} ${a.publisher.lastName}`.trim() : '—',
          assigned: formatDate(a.startDate),
          returned: formatDate(a.endDate),
        })
      })

      // Asignaciones personales
      t.personalAssignments.forEach(pa => {
        assignments.push({
          name: pa.publisher ? `${pa.publisher.firstName} ${pa.publisher.lastName}`.trim() : '—',
          assigned: formatDate(pa.assignedDate),
          returned: formatDate(pa.returnedDate),
        })
      })

      // Ordenar por fecha de asignación (más antiguo primero → abajo en la columna)
      assignments.sort((a, b) => {
        const [aDay, aMon, aYear] = a.assigned.split('/').map(Number)
        const [bDay, bMon, bYear] = b.assigned.split('/').map(Number)
        const aTime = new Date(aYear, aMon - 1, aDay).getTime()
        const bTime = new Date(bYear, bMon - 1, bDay).getTime()
        return aTime - bTime
      })

      territoryMap.set(t.number, assignments)
    })

    // ── Rellenar campos del formulario ──

    // Para cada slot de territorio (0-9, representando startNumber a endNumber)
    for (let slotIdx = 0; slotIdx < 10; slotIdx++) {
      const territoryNum = startNumber + slotIdx
      const terrFieldIdx = slotIdx + 1 // Terr_1 to Terr_10

      // Rellenar número de territorio
      try {
        const terrField = form.getTextField(`Terr_${terrFieldIdx}`)
        terrField.setText(String(territoryNum))
      } catch {
        // Si el campo no existe, ignorar
      }

      // Obtener asignaciones para este territorio
      const assignments = territoryMap.get(territoryNum) || []

      // Obtener el índice base de Name para este slot
      // Los nombres se distribuyen en step=5 por columna
      const baseName = getBaseNameForSlot(slotIdx)

      // Rellenar Name y Date fields (máximo 25 filas por territorio)
      for (let rowIdx = 0; rowIdx < 25; rowIdx++) {
        // Cada fila de la columna: Name_N, Name_(N+5), Name_(N+10)... desde abajo hacia arriba
        const nameNum = baseName + 5 * rowIdx

        // A cada Name le corresponden 2 Date fields: Date_(2N-1) = asignación, Date_(2N) = devolución
        const assignedDateNum = 2 * nameNum - 1
        const returnedDateNum = 2 * nameNum

        const nameFieldName = `Name_${String(nameNum).padStart(3, '0')}`
        const assignedDateFieldName = `Date_${String(assignedDateNum).padStart(3, '0')}`
        const returnedDateFieldName = `Date_${String(returnedDateNum).padStart(3, '0')}`

        if (rowIdx < assignments.length) {
          const a = assignments[rowIdx]
          try {
            form.getTextField(nameFieldName).setText(a.name)
            form.getTextField(assignedDateFieldName).setText(a.assigned)
            form.getTextField(returnedDateFieldName).setText(a.returned)
          } catch {
            // Ignorar campos que no existan
          }
        } else {
          // Dejar vacío (no hay más asignaciones)
          try {
            form.getTextField(nameFieldName).setText('')
            form.getTextField(assignedDateFieldName).setText('')
            form.getTextField(returnedDateFieldName).setText('')
          } catch {
            // Ignorar
          }
        }
      }
    }

    // ── Aplanar formulario (flatten) para que no sea editable ──
    form.flatten()

    // ── Guardar PDF ──
    const pdfBytes = await pdfDoc.save()

    // ── Nombre del archivo ──
    const fromLabel = `${MONTH_NAMES[fromMonth - 1]}-${fromYear}`
    const toLabel = `${MONTH_NAMES[toMonth - 1]}-${toYear}`
    const periodStr = fromMonth === toMonth && fromYear === toYear
      ? fromLabel
      : `${fromLabel}_${toLabel}`
    const filename = `S-13-S_Territorios_${startNumber}-${endNumber}_${periodStr}.pdf`

    return {
      success: true,
      data: pdfBytes,
      filename,
    }
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al generar el PDF',
    }
  }
}
