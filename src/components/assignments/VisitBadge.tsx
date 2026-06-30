import React, { useState } from 'react';
import type { VisitaInfo } from '@/types/assignments';
import { supabase } from '@/integrations/supabase/client';
// import { toast } from 'sonner'; // User didn't specify sonner, I'll use simple alert or console
import { getGroupColor } from '@/lib/floor-utils';

interface VisitBadgeProps {
  visitas: VisitaInfo[];
  compact?: boolean;
  locked?: boolean;
  onGroupChange?: (id_asignacion: number, grupos: number[] | null) => void;
  interactive?: boolean;
}

const estadoStyle: Record<string, string> = {
  confirmada: 'bg-[hsl(var(--score-high-bg))] text-[hsl(var(--score-high-text))] border-[hsl(var(--score-high-border))]',
  confirmado: 'bg-[hsl(var(--score-high-bg))] text-[hsl(var(--score-high-text))] border-[hsl(var(--score-high-border))]',
  asignada: 'bg-[hsl(var(--floor-2-bg))] text-[hsl(var(--floor-2-text))] border-[hsl(var(--floor-2-border))]',
  asignado: 'bg-[hsl(var(--floor-2-bg))] text-[hsl(var(--floor-2-text))] border-[hsl(var(--floor-2-border))]',
  pendiente: 'bg-[hsl(var(--score-mid-bg))] text-[hsl(var(--score-mid-text))] border-[hsl(var(--score-mid-border))]',
  en_espera: 'bg-[hsl(var(--score-mid-bg))] text-[hsl(var(--score-mid-text))] border-[hsl(var(--score-mid-border))]',
};

const estadoLabel: Record<string, string> = {
  confirmada: '✅ Confirmada',
  confirmado: '✅ Confirmado',
  asignada: '📋 Asignada',
  asignado: '📋 Asignado',
  pendiente: '⏳ Pendiente',
  en_espera: '⏳ En espera',
};

export const VisitBlock: React.FC<VisitBadgeProps> = ({ visitas, compact = false, locked = false, onGroupChange, interactive = false }) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  if (visitas.length === 0) return null;

  const handleGroupToggle = async (id_asignacion: number, currentGroups: number[] | null, toggleGroup: number) => {
    if (!supabase) {
      console.error('Supabase no esta configurado.');
      return;
    }

    const current = currentGroups || [];
    let newGroups: number[];
    if (current.includes(toggleGroup)) {
      newGroups = current.filter(g => g !== toggleGroup);
    } else {
      newGroups = [...current, toggleGroup].sort();
    }
    const finalValue = newGroups.length > 0 ? newGroups : null;
    
    try {
      const { error } = await supabase
        .from('asignaciones_visita')
        .update({ numero_grupo: finalValue })
        .eq('id_asignacion', id_asignacion);
      if (error) throw error;
      onGroupChange?.(id_asignacion, finalValue);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
    }
  };

  if (compact) {
    return (
      <div className="space-y-1">
        {visitas.map(v => (
          <div key={v.id_asignacion} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] sm:text-xs ${estadoStyle[v.estado] || estadoStyle.pendiente}`}>
            <span className="font-bold truncate">{v.nombre_institucion || 'Sin nombre'}</span>
            <span className="text-[9px] flex-shrink-0">👥{v.cantidad_personas}</span>
            {v.numero_grupo && v.numero_grupo.length > 0 && (
              <span className="inline-flex gap-0.5">
                {v.numero_grupo.map(g => (
                  <span key={g} className={`text-[8px] px-1 py-0.5 rounded font-mono border ${getGroupColor(g)}`}>G{g}</span>
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[hsl(var(--floor-2-border))] bg-[hsl(var(--floor-2-bg))] overflow-hidden">
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[hsl(var(--floor-2-border))]/50 flex items-center gap-2">
        <span className="text-sm sm:text-base">🏫</span>
        <span className="font-black text-xs sm:text-sm tracking-wide text-[hsl(var(--floor-2-text))]">
          Visitas Grupales ({visitas.length})
        </span>
      </div>
      <div className="p-2 sm:p-3 space-y-1.5">
        {visitas.map(v => {
          const isEditing = editingId === v.id_asignacion;
          const currentGroups = v.numero_grupo || [];
          return (
            <div key={v.id_asignacion} className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border ${estadoStyle[v.estado] || estadoStyle.pendiente}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px] sm:text-xs truncate">
                  {v.nombre_institucion || 'Sin nombre'}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isEditing ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(g => (
                        <button key={g} onClick={() => handleGroupToggle(v.id_asignacion, v.numero_grupo, g)}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border transition-all hover:scale-110 ${
                            currentGroups.includes(g) ? 'ring-2 ring-primary font-bold' : 'opacity-60'
                          } ${getGroupColor(g)}`}>
                          G{g}
                        </button>
                      ))}
                      <button onClick={() => setEditingId(null)}
                        className="text-[9px] px-1 py-0.5 rounded font-mono border bg-card text-foreground border-border">
                        ✓
                      </button>
                    </div>
                  ) : currentGroups.length > 0 ? (
                    <span
                      onClick={interactive && !locked ? () => setEditingId(v.id_asignacion) : undefined}
                      className={`inline-flex gap-0.5 ${interactive && !locked ? 'cursor-pointer' : ''}`}>
                      {currentGroups.map(g => (
                        <span key={g} className={`text-[9px] px-1 py-0.5 rounded font-mono border ${getGroupColor(g)}`}>G{g}</span>
                      ))}
                    </span>
                  ) : interactive && !locked ? (
                    <button
                      onClick={() => setEditingId(v.id_asignacion)}
                      className="text-[9px] px-1 py-0.5 rounded font-mono border border-dashed border-muted-foreground/40 text-muted-foreground">
                      +G
                    </button>
                  ) : null}
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border bg-card/50">
                    {estadoLabel[v.estado] || v.estado}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
