import type { ResidentInfo } from '@/types/assignments';

interface CapRow { id_cap: number; id_dia: number; id_turno: number | null; grupo: string | null }
interface PartRow { id_cap: number; id_agente: number; asistio: boolean | null }
interface DispoRow { id_cap: number; id_dispositivo: number }
interface DiaRow { id_dia: number; fecha: string }
interface ResiRow { id_agente: number; nombre: string; apellido: string }
interface ConvocadosMatrizRow { id_cap: number; id_agente: number }

export interface CapsBuilderInput {
  capData: CapRow[];
  partsData: PartRow[];
  dispoData: DispoRow[];
  diasData: DiaRow[];
  resiData: ResiRow[];
  convocadosMatriz?: ConvocadosMatrizRow[];
}

export interface CapsBuilderOutput {
  residentsMap: Record<number, ResidentInfo>;
  agentGroups: Record<string, string>;
}

export function buildResidentCaps(input: CapsBuilderInput): CapsBuilderOutput {
  const { capData, partsData, dispoData, diasData, resiData, convocadosMatriz } = input;

  const diasDict: Record<number, string> = {};
  diasData.forEach(d => { if (d.fecha) diasDict[d.id_dia] = d.fecha.substring(0, 10); });

  const capDates: Record<number, string> = {};
  const capGroups: Record<number, string> = {};
  capData.forEach(c => {
    const realDate = diasDict[c.id_dia];
    if (realDate) capDates[c.id_cap] = realDate;
    if (c.grupo) capGroups[c.id_cap] = c.grupo;
  });

  const capDispos: Record<number, number[]> = {};
  dispoData.forEach(cd => {
    if (!capDispos[cd.id_cap]) capDispos[cd.id_cap] = [];
    capDispos[cd.id_cap].push(cd.id_dispositivo);
  });

  const residentsMap: Record<number, ResidentInfo> = {};
  resiData.forEach(r => {
    residentsMap[r.id_agente] = {
      id: r.id_agente,
      name: `${r.apellido} ${r.nombre}`,
      caps: {},
    };
  });

  const assignCap = (agentId: number, deviceId: number, date: string) => {
    if (!residentsMap[agentId]) return;
    const dKey = String(deviceId);
    const existing = residentsMap[agentId].caps[dKey];
    if (!existing || date < existing) {
      residentsMap[agentId].caps[dKey] = date;
    }
  };

  const grupoCountMap: Record<string, Record<string, number>> = {};
  partsData.forEach(p => {
    if (p.asistio !== true) return;
    const cId = p.id_cap;
    const cDate = capDates[cId];
    const dispos = capDispos[cId] || [];
    if (capGroups[cId]) {
      const agId = String(p.id_agente);
      if (!grupoCountMap[agId]) grupoCountMap[agId] = {};
      const grp = capGroups[cId];
      grupoCountMap[agId][grp] = (grupoCountMap[agId][grp] || 0) + 1;
    }
    if (cDate) {
      dispos.forEach(dId => {
        assignCap(p.id_agente, dId, cDate);
      });
    }
  });

  if (convocadosMatriz && convocadosMatriz.length > 0) {
    convocadosMatriz.forEach(row => {
      const cDate = capDates[row.id_cap];
      const dispos = capDispos[row.id_cap] || [];
      if (cDate && dispos.length > 0) {
        dispos.forEach(dId => {
          assignCap(row.id_agente, dId, cDate);
        });
      }
    });
  }

  const agentGroups: Record<string, string> = {};
  Object.entries(grupoCountMap).forEach(([agId, counts]) => {
    let bestGroup = '';
    let bestCount = 0;
    Object.entries(counts).forEach(([grp, cnt]) => {
      if (cnt > bestCount) { bestCount = cnt; bestGroup = grp; }
    });
    if (bestGroup) agentGroups[agId] = bestGroup;
  });

  return { residentsMap, agentGroups };
}
