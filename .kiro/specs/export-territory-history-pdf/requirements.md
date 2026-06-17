# Requirements Document

## Introduction

Este documento especifica los requerimientos para la funcionalidad de exportación del historial de asignaciones de territorios en formato PDF. La funcionalidad debe replicar exactamente el formato del documento oficial S-13-S "Registro de asignación de territorio", permitiendo a los administradores generar reportes impresos del historial completo de asignaciones organizados por rangos de territorios.

El PDF generado debe ser visualmente idéntico al formulario S-13-S, con páginas que contengan 5 columnas de territorios cada una, donde cada columna muestra el historial cronológico de todas las asignaciones (tanto a conductores como personales) para un territorio específico.

## Glossary

- **Territory_Export_System**: El sistema que genera documentos PDF con el historial de asignaciones
- **S13S_Document**: Documento PDF que replica el formato oficial S-13-S "Registro de asignación de territorio"
- **Territory_Range**: Un conjunto de 10 territorios consecutivos (ej: 1-10, 11-20)
- **Assignment_History**: El registro completo de todas las asignaciones (conductor y personal) de un territorio
- **Territory_Column**: Una columna en el PDF que muestra el historial de un territorio específico
- **PDF_Page**: Una página del documento que contiene 5 columnas de territorios
- **Conductor_Assignment**: Asignación de un territorio a un conductor (modelo Assignment)
- **Personal_Assignment**: Asignación personal de un territorio a un miembro de grupo (modelo PersonalAssignment)
- **History_Page**: La página de administración ubicada en /admin/history
- **Export_UI**: La interfaz de usuario para seleccionar rangos y generar PDFs
- **PDF_Generator**: El componente del sistema que genera los archivos PDF
- **Assignment_Record**: Un registro individual en el historial que incluye nombre del asignado y fechas

## Requirements

### Requirement 1: Selección de Rango de Territorios

**User Story:** Como administrador, quiero seleccionar un rango de territorios para exportar, para poder generar documentos PDF organizados por bloques de 10 territorios.

#### Acceptance Criteria

1. WHEN el administrador accede a History_Page, THE Export_UI SHALL mostrar un botón o control para iniciar la exportación
2. WHEN el administrador activa la exportación, THE Export_UI SHALL mostrar una lista de rangos disponibles basados en los territorios existentes
3. THE Export_UI SHALL calcular rangos de 10 territorios consecutivos (1-10, 11-20, 21-30, etc.)
4. THE Export_UI SHALL permitir seleccionar múltiples rangos simultáneamente
5. WHEN no existen territorios en el sistema, THE Export_UI SHALL mostrar un mensaje indicando que no hay datos para exportar
6. THE Export_UI SHALL mostrar cuántos territorios contiene cada rango disponible

### Requirement 2: Generación de Documento PDF Formato S-13-S

**User Story:** Como administrador, quiero que el PDF generado replique exactamente el formato S-13-S oficial, para mantener consistencia con los documentos físicos existentes.

#### Acceptance Criteria

1. WHEN el usuario confirma la exportación, THE PDF_Generator SHALL crear un S13S_Document
2. THE S13S_Document SHALL tener el título "Registro de asignación de territorio" en el encabezado
3. THE S13S_Document SHALL contener exactamente 10 territorios por documento
4. THE S13S_Document SHALL distribuir los territorios en 2 páginas (5 territorios por página)
5. WHEN el Territory_Range contiene menos de 10 territorios, THE PDF_Generator SHALL completar el documento con columnas vacías
6. THE S13S_Document SHALL incluir campos de encabezado para "Modelo: Nombre del publicador" y fechas de entrega/devolución
7. THE PDF_Generator SHALL usar tipografía y espaciado consistente con el formulario S-13-S original

### Requirement 3: Estructura de Columnas por Territorio

**User Story:** Como administrador, quiero que cada territorio tenga su propia columna con todas sus asignaciones, para poder ver el historial completo de cada territorio de forma organizada.

#### Acceptance Criteria

1. THE PDF_Page SHALL contener exactamente 5 Territory_Column por página
2. THE Territory_Column SHALL mostrar "Núm. de terr." seguido del número del territorio en el encabezado
3. THE Territory_Column SHALL contener filas para mostrar múltiples Assignment_Record
4. WHEN un territorio no tiene asignaciones, THE Territory_Column SHALL mostrar solo el encabezado con filas vacías
5. THE Territory_Column SHALL tener bordes visibles que separen cada columna
6. THE Territory_Column SHALL tener un ancho uniforme distribuido equitativamente en la página

### Requirement 4: Formato de Registros de Asignación

**User Story:** Como administrador, quiero que cada asignación muestre el nombre del asignado y las fechas claramente, para poder identificar quién tuvo el territorio y por cuánto tiempo.

#### Acceptance Criteria

1. THE Assignment_Record SHALL mostrar el nombre del asignado (conductor o miembro) en la parte superior de la celda
2. THE Assignment_Record SHALL mostrar la fecha de asignación en la esquina inferior izquierda de la celda
3. THE Assignment_Record SHALL mostrar la fecha de devolución en la esquina inferior derecha de la celda
4. WHEN una asignación no tiene fecha de devolución, THE Assignment_Record SHALL dejar vacío el espacio de fecha de devolución
5. THE Assignment_Record SHALL usar formato de fecha consistente (DD/MM/YYYY)
6. THE Assignment_Record SHALL tener bordes horizontales que separen cada registro

### Requirement 5: Inclusión de Todos los Tipos de Asignaciones

**User Story:** Como administrador, quiero que el PDF incluya tanto asignaciones a conductores como asignaciones personales, para tener un historial completo unificado.

#### Acceptance Criteria

1. THE PDF_Generator SHALL consultar ambos modelos Conductor_Assignment y Personal_Assignment
2. THE PDF_Generator SHALL combinar ambos tipos de asignaciones en una lista unificada por territorio
3. THE Assignment_Record SHALL mostrar el nombre del conductor o miembro según el tipo de asignación
4. THE PDF_Generator SHALL ordenar todas las asignaciones cronológicamente por fecha de asignación (más antigua primero)
5. WHEN un territorio tiene asignaciones de ambos tipos, THE Territory_Column SHALL mostrarlas todas sin distinción visual de tipo

### Requirement 6: Ordenamiento Cronológico del Historial

**User Story:** Como administrador, quiero que las asignaciones estén ordenadas cronológicamente, para poder seguir la secuencia temporal de uso de cada territorio.

#### Acceptance Criteria

1. THE PDF_Generator SHALL ordenar Assignment_Record por fecha de asignación ascendente (más antigua primero)
2. WHEN dos asignaciones tienen la misma fecha de asignación, THE PDF_Generator SHALL ordenar por fecha de creación ascendente
3. THE Territory_Column SHALL mostrar las asignaciones en orden desde la parte superior (más antigua) hacia abajo (más reciente)

### Requirement 7: Descarga del Archivo PDF

**User Story:** Como administrador, quiero descargar el PDF generado, para poder imprimirlo o compartirlo.

#### Acceptance Criteria

1. WHEN el PDF_Generator completa la generación, THE Territory_Export_System SHALL iniciar la descarga automática del archivo
2. THE Territory_Export_System SHALL nombrar el archivo con formato "S-13-S_Territorios_{rango}.pdf" (ej: "S-13-S_Territorios_1-10.pdf")
3. WHEN se exportan múltiples rangos, THE Territory_Export_System SHALL generar archivos separados para cada rango
4. THE Territory_Export_System SHALL usar tipo MIME "application/pdf"
5. IF la generación del PDF falla, THEN THE Territory_Export_System SHALL mostrar un mensaje de error descriptivo

### Requirement 8: Manejo de Territorios sin Historial

**User Story:** Como administrador, quiero que los territorios sin asignaciones aparezcan en el PDF, para mantener la numeración continua y tener plantillas listas para uso futuro.

#### Acceptance Criteria

1. WHEN un territorio en el Territory_Range no tiene asignaciones, THE Territory_Column SHALL mostrar el encabezado del territorio
2. THE Territory_Column SHALL contener filas vacías preparadas para escritura manual
3. THE S13S_Document SHALL incluir todos los territorios del rango seleccionado independientemente de si tienen historial

### Requirement 9: Interfaz de Usuario para Exportación

**User Story:** Como administrador, quiero una interfaz clara para exportar PDFs, para poder realizar la exportación de forma rápida e intuitiva.

#### Acceptance Criteria

1. THE Export_UI SHALL mostrar un botón prominente con icono y texto "Exportar a PDF" o similar
2. WHEN el usuario hace clic en el botón de exportación, THE Export_UI SHALL abrir un modal o panel de selección
3. THE Export_UI SHALL mostrar los rangos disponibles como opciones seleccionables (checkboxes o botones)
4. THE Export_UI SHALL mostrar un botón de confirmación "Generar PDF" o similar
5. WHEN el usuario genera el PDF, THE Export_UI SHALL mostrar un indicador de progreso o estado de generación
6. WHEN la generación se completa, THE Export_UI SHALL cerrar el modal automáticamente
7. THE Export_UI SHALL permitir cancelar la operación antes de confirmar la generación

### Requirement 10: Validación de Datos y Manejo de Errores

**User Story:** Como administrador, quiero que el sistema maneje errores apropiadamente, para entender qué salió mal si falla la exportación.

#### Acceptance Criteria

1. WHEN no hay territorios en el rango seleccionado, THE Territory_Export_System SHALL mostrar un mensaje informativo
2. IF ocurre un error durante la generación del PDF, THEN THE Territory_Export_System SHALL capturar el error y mostrar un mensaje descriptivo
3. IF ocurre un error en la consulta de datos, THEN THE Territory_Export_System SHALL mostrar un mensaje de error al usuario
4. THE Territory_Export_System SHALL registrar errores en los logs del sistema para diagnóstico
5. WHEN la descarga del PDF falla, THE Territory_Export_System SHALL permitir reintentar la generación
