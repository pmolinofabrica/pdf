import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Agente {
  id_agente: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
}

export const useAgentes = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgentes() {
      if (!supabase) {
        setAgentes([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('datos_personales')
        .select('id_agente, nombre, apellido')
        .eq('cohorte', 2026)
        .eq('activo', true)
        .order('apellido', { ascending: true });

      if (error) {
        console.error('Error fetching agentes:', error);
      } else {
        const mappedAgentes = (data || []).map(a => ({
          ...a,
          nombre_completo: `${a.apellido} ${a.nombre}`
        }));
        setAgentes(mappedAgentes);
      }
      setIsLoading(false);
    }

    fetchAgentes();
  }, []);

  return { agentes, isLoading };
};
