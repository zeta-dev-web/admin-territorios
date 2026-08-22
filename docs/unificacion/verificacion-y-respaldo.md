# Procedimiento de verificación y restauración — Unificación Territorios

Complementa `PLAN_UNIFICACION_TERRITORIOS_VYMC.md` (sección 11) y los
entregables de esta carpeta. Es el manual operativo para el responsable
de la migración.

---

## 1. Respaldo previo (obligatorio antes de cualquier migración)

En la VPS, con las variables de conexión de producción:

```bash
# Respaldo completo en formato comprimido (recomendado)
pg_dump "$DATABASE_URL" -Fc -f "respaldo-territorios-$(date +%Y%m%d-%H%M).dump"

# Verificar que el archivo no esté vacío y anotar su tamaño
ls -lh respaldo-territorios-*.dump
```

Regla del plan: **un respaldo no verificado no es un respaldo**.

## 2. Ensayo de restauración (obligatorio)

```bash
# Crear una base aislada de ensayo y restaurar el respaldo
createdb "territorios_ensayo"
pg_restore -d "territorios_ensayo" --no-owner --role=<rol> "respaldo-territorios-FECHA.dump"

# Apuntar DATABASE_URL a la base de ensayo y correr el diagnóstico:
DATABASE_URL="postgresql://...territorios_ensayo..." node scripts/diagnostico-territorios.mjs
```

Criterio de éxito: el diagnóstico sobre la base restaurada produce los
mismos totales que sobre producción.

## 3. Diagnóstico antes / después

El script `scripts/diagnostico-territorios.mjs` es de SOLO LECTURA
(abre transacción `READ ONLY`). Se ejecuta:

1. **Antes** de tocar cualquier cosa → guarda el `.json` como línea base.
2. **Después** de cada despliegue (A/B/C/D) → comparar totales.

Comparación automática de conteos entre dos reportes:

```bash
node scripts/comparar-diagnosticos.mjs diagnostics-output/diagnostico-BASE.json diagnostics-output/diagnostico-NUEVO.json
```

(Chequeos esperados: mismos totales por tabla; únicamente cambian
`publishers` y los `publisherId` completados, que deben crecer de 0.)

## 4. Conciliación de conteos (SQL directo)

Tras el backfill, estas consultas deben dar **cero filas**:

```sql
-- Miembros sin publicador asociado
SELECT m.id, m.name FROM "Member" m
LEFT JOIN "_MigracionMemberAPublisher" x ON x."memberId" = m.id
WHERE x."memberId" IS NULL;

-- Conductores sin publicador asociado
SELECT d.id, d.name FROM "Driver" d
LEFT JOIN "_MigracionDriverAPublisher" x ON x."driverId" = d.id
WHERE x."driverId" IS NULL;

-- Conductores cuyo publicador quedó sin la capacidad isConductor
SELECT d.name FROM "Driver" d
JOIN "_MigracionDriverAPublisher" x ON x."driverId" = d.id
JOIN "Publisher" p ON p.id = x."publisherId"
WHERE p."isConductor" = false;

-- Asignaciones personales sin publicador
SELECT COUNT(*) FROM "PersonalAssignment" WHERE "publisherId" IS NULL;

-- Asignaciones territoriales sin publicador
SELECT COUNT(*) FROM "Assignment" WHERE "publisherId" IS NULL;

-- Registros diarios sin publicador
SELECT COUNT(*) FROM "DailyRecord" WHERE "publisherId" IS NULL;

-- Publicadores apuntando a otra congregación que su grupo (inconsistencia)
SELECT p.id FROM "Publisher" p
JOIN "Group" g ON g.id = p."groupId"
WHERE g."tenantId" IS DISTINCT FROM p."tenantId";

-- Conteos que deben coincidir entre sí
SELECT
  (SELECT COUNT(*) FROM "Member")  AS miembros,
  (SELECT COUNT(*) FROM "_MigracionMemberAPublisher") AS miembros_migrados,
  (SELECT COUNT(*) FROM "Driver")  AS conductores,
  (SELECT COUNT(*) FROM "Publisher" WHERE "isConductor") AS publicadores_conductores;
```

`miembros = miembros_migrados` y `conductores ≤ publicadores_conductores`
(los conductores sin miembro asociado se crean como publicadores nuevos
y también quedan marcados con `isConductor = true`, por lo que la
segunda relación se verifica con el detalle del diagnóstico).

## 5. Plan de reversión por despliegue

| Despliegue | Qué contiene | Reversión |
|---|---|---|
| A — Expansión | Tabla Publisher + columnas publisherId + índices | Volver al deploy anterior; las tablas nuevas vacías no afectan nada |
| B — Backfill | Datos migrados + correspondencias | Detener backfill y volver al código anterior; Member/Driver siguen siendo la fuente |
| C — Lectura nuevas | Feature flag leyendo desde Publisher | Desactivar la bandera: se vuelve a leer Member/Driver sin restaurar nada |
| D — Consolidación | publisherId obligatorio, FKs validadas | Volver temporalmente a escritura compatible (los datos viejos aún existen) |
| E — Limpieza | DROP de Member/Driver | Último respaldo + export previo de tablas antiguas; requiere aprobación explícita |

Los comandos SQL de reversión de la migración aditiva están al final de
`migracion-aditiva-v1.sql`.

## 6. Checklist Go/No-Go antes de cada pasaje

- [ ] Respaldo creado y restauración ensayada
- [ ] Migraciones probadas sobre copia reciente de producción
- [ ] Cero referencias huérfanas (sección 2 del diagnóstico)
- [ ] Cero coincidencias ambiguas pendientes (sección 5 del diagnóstico)
- [ ] Conteos antes/después conciliados (sección 4 de este documento)
- [ ] Consultas siempre limitadas por congregación (`congregationId`)
- [ ] Humo de web y mobile aprobado contra la base ensayada
- [ ] Bandera de reversión disponible y probada
- [ ] Responsable y comandos de rollback documentados
- [ ] Monitoreo activo durante y después del despliegue

## 7. Notas específicas de este proyecto

- VYMC **no está en producción**: no existen coincidencias cruzadas
  Member/Driver ↔ Publisher-de-VYMC. Los publicadores nacen solo desde
  Territorios.
- Los nombres se dividen con la regla aprobada: **última palabra** =
  `lastName`, resto = `firstName`; una sola palabra → `lastName = ""`.
- El género no existe en Territorios: columna nullable hasta completar
  revisión manual.
- La limpieza destructiva (Despliegue E) queda fuera del primer pasaje
  a producción y exige un ciclo estable adicional.
