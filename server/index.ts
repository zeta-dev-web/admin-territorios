/**
 * Server Actions - Índice de exportaciones
 * 
 * Este archivo centraliza todas las server actions del sistema
 * para facilitar su importación en los componentes.
 */

// Asignaciones
export {
  createAssignment,
  getActiveAssignments,
  getAssignmentById,
  completeAssignment,
  returnAssignment,
  getCompletedAssignmentsHistory,
  deleteAssignment,
} from './assignments'

// Registros Diarios
export {
  createDailyRecord,
  getDailyRecordsByAssignment,
  getDailyRecordsByDriver,
  deleteDailyRecord,
} from './dailyRecords'

// Dashboard y Métricas
export {
  getDashboardMetrics,
  getTerritoryProgress,
  getAssignmentBlocks,
  getGeneralStats,
} from './dashboard'

// Grupos
export {
  createGroup,
  getAllGroups,
  updateGroup,
  deleteGroup,
} from './groups'

// Integrantes
export {
  createMember,
  getMembersByGroup,
  updateMember,
  deleteMember,
  toggleMemberDriver,
} from './members'

// Asignaciones Personales
export {
  createPersonalAssignment,
  returnPersonalAssignment,
  getActivePersonalAssignments,
  getPersonalAssignmentsByTerritory,
  getPersonalAssignmentsByMember,
  deletePersonalAssignment,
} from './personalAssignments'

// Asignaciones Unificadas
export {
  getUnifiedAssignments,
  getUnifiedHistory,
  returnUnifiedAssignment,
  deleteHistoryRecord,
} from './unifiedAssignments'

// Conductores
export {
  createDriver,
  getAllDrivers,
  getDriversByGroup,
  getDriverById,
  updateDriver,
  deleteDriver,
  getAllDriversForSelect,
} from './drivers'

// Territorios
export {
  createTerritory,
  getAllTerritories,
  getTerritoryById,
  getTerritoryByNumber,
  updateTerritory,
  addBlocksToTerritory,
  deleteTerritory,
  getAllTerritoriesForSelect,
} from './territories'
