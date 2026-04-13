export interface DeviceInfo {
  id: string;
  name: string;
  min: number;
  max: number;
  piso: number;
}

export interface ResidentInfo {
  id: number;
  name: string;
  caps: Record<string, string>; // deviceId -> earliest ISO date
}

export interface AssignmentEntry {
  id: number;
  name: string;
  score?: number;
  numero_grupo: number | null;
  acompana_grupo: boolean;
}

export type AssignmentsMatrix = Record<string, Record<string, AssignmentEntry[]>>; // uiDate -> deviceId -> assignments
export type CalendarMatrix = Record<string, Record<string, number>>; // uiDate -> deviceId -> capacity
export type ConvocadosMap = Record<string, number[]>; // uiDate -> list of agent IDs
export type InasistenciasMap = Record<string, { id_agente: number; motivo: string }[]>; // uiDate -> list of absences

export interface VisitaInfo {
  id_asignacion: number;
  nombre_institucion: string;
  cantidad_personas: number;
  rango_etario: string;
  estado: string;
  numero_grupo: number[] | null;
}

export type VisitasByDateMap = Record<string, VisitaInfo[]>;
