import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildResidentCaps } from '@/lib/caps-builder';
import type {
  DeviceInfo, ResidentInfo, AssignmentEntry,
  AssignmentsMatrix, CalendarMatrix, ConvocadosMap, InasistenciasMap,
  VisitaInfo, VisitasByDateMap,
} from '@/types/assignments';

const getActiveCohorte = () => '2026'; 

export const useMonthlyData = (selectedMonth: string, turnoFilter = 'manana') => {
  const [dbDevices, setDbDevices] = useState<DeviceInfo[]>([]);
  const [assignmentsDb, setAssignmentsDb] = useState<AssignmentsMatrix>({});
  const [activeDates, setActiveDates] = useState<string[]>([]);
  const [convocadosCountDb, setConvocadosCountDb] = useState<Record<string, number>>({});
  const [convocadosDb, setConvocadosDb] = useState<ConvocadosMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [allResidentsDb, setAllResidentsDb] = useState<ResidentInfo[]>([]);
  const [inasistenciasDb, setInasistenciasDb] = useState<InasistenciasMap>({});
  const [tipoOrganizacionMap, setTipoOrganizacionMap] = useState<Record<string, string>>({});
  const [calendarDb, setCalendarDb] = useState<CalendarMatrix>({});
  const [visitasByDate, setVisitasByDate] = useState<VisitasByDateMap>({});
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = useCallback(() => setRefreshCounter(c => c + 1), []);

  const getMonthParts = useCallback(() => {
    const smParts = (selectedMonth || "Abril 2026").split(" ");
    const yFilt = smParts[1] || "2026";
    const monthNames: Record<string, string> = {
      "Enero": "01", "Febrero": "02", "Marzo": "03", "Abril": "04",
      "Mayo": "05", "Junio": "06", "Julio": "07", "Agosto": "08",
      "Septiembre": "09", "Octubre": "10", "Noviembre": "11", "Diciembre": "12"
    };
    const mmFilt = monthNames[smParts[0]] || "04";
    const startOfMonth = `${yFilt}-${mmFilt}-01`;
    const lastDay = new Date(Number(yFilt), Number(mmFilt), 0).getDate();
    const endOfMonth = `${yFilt}-${mmFilt}-${lastDay}`;
    return { yFilt, mmFilt, startOfMonth, endOfMonth };
  }, [selectedMonth]);

  const formatUiDate = (d: string | number, m: string | number) => {
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  };

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const { yFilt, mmFilt, startOfMonth, endOfMonth } = getMonthParts();

      const matchesTurnoFilter = (tipo: string): boolean => {
        const t = tipo.toLowerCase();
        if (turnoFilter === 'apertura') return t.includes('apertura');
        if (turnoFilter === 'tarde') return t.includes('turno tarde');
        if (turnoFilter === 'manana') return t.includes('turno mañana') || t.includes('turno manana');
        return true;
      };

      try {
        const [dispoRes, resiRes, turnosRes] = await Promise.all([
          supabase.from('dispositivos').select('*').eq('activo', true).neq('id_dispositivo', 999).order('piso_dispositivo'),
          supabase.from('datos_personales').select('*').eq('activo', true), // Relaxed cohorte filter to see if it helps
          supabase.from('turnos').select('id_turno, tipo_turno')
        ]);

        const mappedDevices = (dispoRes.data || []).map(d => ({
          id: String(d.id_dispositivo),
          name: `(P${d.piso_dispositivo || '?'}) ${d.nombre_dispositivo}`,
          min: d.cupo_minimo || 1,
          max: d.cupo_optimo || 1,
          piso: d.piso_dispositivo || 0
        }));
        setDbDevices(mappedDevices);

        const turnoTypeMap: Record<number, string> = {};
        turnosRes.data?.forEach(t => { turnoTypeMap[t.id_turno] = t.tipo_turno; });

        const [menuRes, menuSemanaRes, configRes, capsRep, partsRes, dispoCapsRes, allPlaniRes, allDiasRes] = await Promise.all([
          supabase.from('menu').select('*').gte('fecha_asignacion', startOfMonth).lte('fecha_asignacion', endOfMonth),
          supabase.from('menu_semana').select('*').gte('fecha_asignacion', startOfMonth).lte('fecha_asignacion', endOfMonth),
          supabase.from('configuracion_turnos').select('*').gte('fecha', startOfMonth).lte('fecha', endOfMonth),
          supabase.from('capacitaciones').select('*').limit(1000),
          supabase.from('capacitaciones_participantes').select('*').limit(5000),
          supabase.from('capacitaciones_dispositivos').select('*').limit(5000),
          supabase.from('planificacion').select('*').limit(5000),
          supabase.from('dias').select('*').gte('fecha', `${yFilt}-01-01`).lte('fecha', `${yFilt}-12-31`),
        ]);

        if (resiRes.data) {
          const { residentsMap } = buildResidentCaps({
            capData: capsRep.data || [],
            partsData: partsRes.data || [],
            dispoData: dispoCapsRes.data || [],
            diasData: allDiasRes.data || [],
            resiData: resiRes.data.filter(r => String(r.cohorte) === String(getActiveCohorte())),
          });
          setAllResidentsDb(Object.values(residentsMap));
        }

        const orgTypeMap: Record<string, string> = {};
        configRes.data?.forEach(cfg => {
          const [fy, fm, fd] = cfg.fecha.split('-');
          if (fy === yFilt && fm === mmFilt) orgTypeMap[formatUiDate(fd, fm)] = cfg.tipo_organizacion;
        });
        setTipoOrganizacionMap(orgTypeMap);

        const matrix: AssignmentsMatrix = {};
        const convMap: ConvocadosMap = {};
        const convCount: Record<string, number> = {};
        const nameDict: Record<number, string> = {};
        resiRes.data?.forEach(r => nameDict[r.id_agente] = `${r.apellido} ${r.nombre}`);

        const isAperturaMode = turnoFilter === 'apertura';
        const assignmentsSource = isAperturaMode ? (menuRes.data || []) : (menuSemanaRes.data || []);
        
        assignmentsSource.forEach(a => {
          if (!a.fecha_asignacion) return;

          // CRITICAL FIX: Skip turno filter for 'menu' table (Apertura mode)
          // because 'menu' table rows do not have id_turno column
          if (!isAperturaMode) {
            const tipo = turnoTypeMap[a.id_turno] || '';
            if (!matchesTurnoFilter(tipo)) return;
          }

          const [y, m, d] = a.fecha_asignacion.split("-");
          const uiDate = formatUiDate(d, m);

          if (!convMap[uiDate]) convMap[uiDate] = [];
          if (!convMap[uiDate].includes(a.id_agente)) {
            convMap[uiDate].push(a.id_agente);
            convCount[uiDate] = (convCount[uiDate] || 0) + 1;
          }

          if (a.id_dispositivo && a.id_dispositivo !== 999) {
            const dId = String(a.id_dispositivo);
            if (!matrix[uiDate]) matrix[uiDate] = {};
            if (!matrix[uiDate][dId]) matrix[uiDate][dId] = [];
            matrix[uiDate][dId].push({
              id: a.id_agente,
              name: nameDict[a.id_agente] || `ID ${a.id_agente}`,
              numero_grupo: a.numero_grupo ?? null,
              acompana_grupo: !!a.acompana_grupo
            });
          }
        });

        setAssignmentsDb(matrix);
        setConvocadosDb(convMap);
        setConvocadosCountDb(convCount);
        setActiveDates(Object.keys(convMap).sort());

        const [inasRes, calRes] = await Promise.all([
          supabase.from('inasistencias').select('*'),
          supabase.from('calendario_dispositivos').select('*').gte('fecha', startOfMonth).lte('fecha', endOfMonth)
        ]);

        const inasMap: InasistenciasMap = {};
        inasRes.data?.forEach(row => {
          const [y, m, d] = row.fecha_inasistencia.split('-');
          const uiDate = formatUiDate(d, m);
          if (!inasMap[uiDate]) inasMap[uiDate] = [];
          inasMap[uiDate].push({ id_agente: row.id_agente, motivo: row.motivo || 'otro' });
        });
        setInasistenciasDb(inasMap);

        const newCalendarDb: CalendarMatrix = {};
        calRes.data?.forEach(row => {
            const tipo = turnoTypeMap[row.id_turno] || '';
            if (!matchesTurnoFilter(tipo)) return;
            const [fy, fm, fd] = row.fecha.substring(0, 10).split('-');
            const uiDate = formatUiDate(fd, fm);
            if (!newCalendarDb[uiDate]) newCalendarDb[uiDate] = {};
            newCalendarDb[uiDate][String(row.id_dispositivo)] = row.cupo_objetivo || 0;
        });
        setCalendarDb(newCalendarDb);

        const { data: visitasData } = await supabase.from('asignaciones_visita')
            .select('*').in('estado', ['asignado', 'asignada', 'confirmado', 'confirmada']);
        
        const planiDateMap: Record<number, string> = {};
        allPlaniRes.data?.forEach(p => {
            const dia = allDiasRes.data?.find(d => d.id_dia === p.id_dia);
            if (dia) {
                const [y, m, d] = dia.fecha.split('-');
                planiDateMap[p.id_plani] = formatUiDate(d, m);
            }
        });

        const vMap: VisitasByDateMap = {};
        visitasData?.forEach(v => {
            const uiDate = planiDateMap[v.id_plani];
            if (!uiDate) return;
            if (!vMap[uiDate]) vMap[uiDate] = [];
            vMap[uiDate].push({
                id_asignacion: v.id_asignacion,
                nombre_institucion: v.nombre_institucion,
                cantidad_personas: v.cantidad_personas_original,
                rango_etario: v.rango_etario,
                estado: v.estado,
                numero_grupo: v.numero_grupo,
            });
        });
        setVisitasByDate(vMap);

      } catch (err) {
        console.error("Critical error in useMonthlyData:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [selectedMonth, turnoFilter, refreshCounter, getMonthParts]);

  const isAgentAbsent = useCallback((agentId: number, uiDate: string): boolean => {
    return (inasistenciasDb[uiDate] || []).some(x => x.id_agente === agentId);
  }, [inasistenciasDb]);

  return {
    dbDevices, assignmentsDb, activeDates, convocadosCountDb,
    convocadosDb, isLoading, setIsLoading, allResidentsDb,
    inasistenciasDb, tipoOrganizacionMap, calendarDb, visitasByDate,
    refresh, isAgentAbsent,
    data: {
        dbDevices, assignmentsDb, activeDates, convocadosCountDb,
        convocadosDb, isLoading, allResidentsDb,
        inasistenciasDb, tipoOrganizacionMap, calendarDb, visitasByDate,
        isAgentAbsent, refresh, turnoFilter
    }
  };
};
