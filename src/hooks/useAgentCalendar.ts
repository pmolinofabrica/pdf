import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConvocatoriaCalendario {
  id_convocatoria: number;
  fecha: string;
  etiqueta: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_agente: string;
}

export const useAgentCalendar = (agentId: number | null, selectedMonth: string) => {
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaCalendario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!agentId) {
      setConvocatorias([]);
      return;
    }

    async function fetchCalendarData() {
      setIsLoading(true);
      
      // Parse selectedMonth (e.g., "Mayo 2026")
      const monthNames: Record<string, string> = {
        "Enero": "01", "Febrero": "02", "Marzo": "03", "Abril": "04",
        "Mayo": "05", "Junio": "06", "Julio": "07", "Agosto": "08",
        "Septiembre": "09", "Octubre": "10", "Noviembre": "11", "Diciembre": "12"
      };
      
      const [monthStr, yearStr] = selectedMonth.split(" ");
      const mm = monthNames[monthStr] || "05";
      const startOfMonth = `${yearStr}-${mm}-01`;
      const lastDay = new Date(Number(yearStr), Number(mm), 0).getDate();
      const endOfMonth = `${yearStr}-${mm}-${lastDay}`;

      const { data, error } = await supabase
        .from('view_convocatoria_calendario')
        .select('*')
        .eq('id_agente', agentId)
        .gte('fecha', startOfMonth)
        .lte('fecha', endOfMonth);

      if (error) {
        console.error('Error fetching agent calendar data:', error);
      } else {
        console.log(`Fetched ${data?.length || 0} convocatorias for agent ${agentId} in ${selectedMonth}`);
        setConvocatorias(data || []);
      }
      setIsLoading(false);
    }

    fetchCalendarData();
  }, [agentId, selectedMonth]);

  return { convocatorias, isLoading };
};
