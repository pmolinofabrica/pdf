import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
// import { Lock, Unlock } from 'lucide-react'; // Not used in provided snippet but imported
import { getFloorColor } from '@/lib/floor-utils';
import { useAuth } from '@/hooks/useAuth';
import type { AssignmentEntry } from '@/types/assignments';
import { VisitBlock } from './VisitBadge';

// Importaciones para PDF
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface MenuViewProps {
  data: any;
  year: string;
  isLocked?: boolean;
  onLock?: (locked: boolean) => void;
}

const pisoNames: Record<number, string> = { 1: 'Piso 1 — Papel', 2: 'Piso 2 — Madera', 3: 'Piso 3 — Textil' };

export const MenuView: React.FC<MenuViewProps> = ({ data, year, isLocked = false, onLock }) => {
  const { signOut } = useAuth();
  const { 
    dbDevices, assignmentsDb, activeDates, convocadosDb, convocadosCountDb, 
    isAgentAbsent, agentGroups, tipoOrganizacionMap, setTipoOrganizacionMap, 
    calendarDb, allResidentsDb, turnoFilter, dateTurnoMap, setIsLoading, 
    refresh, visitasByDate 
  } = data;

  const isNonApertura = turnoFilter === 'tarde' || turnoFilter === 'manana';
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Referencia para capturar el PDF
  const pdfRef = useRef<HTMLDivElement>(null);

  const currentDate = activeDates[selectedDateIdx] || activeDates[0] || '';
  const orgType = tipoOrganizacionMap[currentDate] || 'dispositivos fijos';

  // Función de escalamiento inteligente para ajustar a UNA página A4
  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    
    const oldScrollY = window.scrollY;
    
    try {
      window.scrollTo(0, 0);
      const element = pdfRef.current;
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const captureWidth = 1050; 
      
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: element.scrollHeight,
        windowWidth: captureWidth,
        onclone: (clonedDoc) => {
          // 1. Limpieza de CSS (Precisa para no borrar el Layout)
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            let css = styleTags[i].textContent || '';
            css = css.replace(/(oklab|oklch|color\-mix|color)\([^)]+\)/g, 'transparent');
            styleTags[i].textContent = css;
          }

          // 2. Anti-Truncado
          const antiTruncateStyle = clonedDoc.createElement('style');
          antiTruncateStyle.textContent = `
            .truncate, [class*="truncate"] {
              overflow: visible !important;
              text-overflow: clip !important;
              white-space: normal !important;
              display: block !important;
            }
            select { 
              appearance: auto !important; 
              width: auto !important; 
              min-width: 180px !important;
              padding-right: 10px !important;
            }
          `;
          clonedDoc.head.appendChild(antiTruncateStyle);
          
          const el = clonedDoc.getElementById('pdf-root');
          if (el) {
            let parent = el.parentElement;
            while (parent) {
              parent.style.maxWidth = 'none';
              parent.style.width = '100%';
              parent = parent.parentElement;
            }
            
            el.style.width = `${captureWidth}px`;
            el.style.backgroundColor = '#ffffff';
            el.style.padding = '35px'; // Reducimos margen para ganar espacio vertical
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      
      // Cálculo de proporciones para ajustar a UNA página
      let finalWidth = pdfPageWidth;
      let finalHeight = (canvas.height * finalWidth) / canvas.width;
      
      // Si el alto excede la página, reducimos escala proporcionalmente
      const margin = 10; // 10mm de margen total
      if (finalHeight > (pdfPageHeight - margin)) {
        finalHeight = pdfPageHeight - margin;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
      }
      
      // Centramos horizontalmente si el ancho es menor al de la página
      const xOffset = (pdfPageWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, 5, finalWidth, finalHeight, undefined, 'FAST');
      pdf.save(`Menu_${currentDate.replace(/\//g, '-')}.pdf`);
      
    } catch (error: any) {
      console.error('PDF ERROR:', error);
      alert('Error en PDF: ' + (error?.message || 'Fallo de renderizado') + '.');
    } finally {
      window.scrollTo(0, oldScrollY);
      setIsExporting(false);
    }
  };

  // El manejo de fecha ahora es solo a través del selector central, 
  // pero mantengo la lógica de apoyo si hiciera falta.

  // When locked, only allow dates from today backwards
  const isDateFuture = useCallback((dateStr: string) => {
    if (!dateStr) return false;
    const [d, m] = dateStr.split('/').map(Number);
    const now = new Date();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();
    if (m > todayMonth) return true;
    if (m === todayMonth && d > todayDay) return true;
    return false;
  }, []);

  const canSelectDate = (dateStr: string) => {
    if (!isLocked) return true;
    return !isDateFuture(dateStr);
  };

  const prevDate = () => {
    let next = selectedDateIdx - 1;
    while (next >= 0 && isLocked && isDateFuture(activeDates[next])) next--;
    if (next >= 0) setSelectedDateIdx(next);
  };
  const nextDate = () => {
    let next = selectedDateIdx + 1;
    while (next < activeDates.length && isLocked && isDateFuture(activeDates[next])) next++;
    if (next < activeDates.length) setSelectedDateIdx(next);
  };

  const dateAssignments = assignmentsDb[currentDate] || {};
  const convocados = convocadosDb[currentDate] || [];
  const convocadosCount = convocadosCountDb[currentDate] || 0;

  const assignedIds = new Set<number>();
  Object.values(dateAssignments).forEach((arr: any) => {
    arr.forEach((r: any) => assignedIds.add(r.id));
  });

  const pisoGroups: Record<number, any[]> = {};
  dbDevices.forEach((dev: any) => {
    const assignments: AssignmentEntry[] = dateAssignments[dev.id] || [];
    if (assignments.length === 0) return;
    const p = dev.piso || 0;
    if (!pisoGroups[p]) pisoGroups[p] = [];
    pisoGroups[p].push(dev);
  });

  let totalAssigned = 0;
  let totalCupos = 0;
  dbDevices.forEach((dev: any) => {
    const cupo = calendarDb[currentDate]?.[dev.id] || dev.max;
    if (cupo == null || cupo <= 0) return; 
    const assigned = (dateAssignments[dev.id] || []).length;
    totalAssigned += assigned;
    totalCupos += cupo;
  });
  const totalVacant = totalCupos - totalAssigned;

  const absentAssigned: { name: string; device: string }[] = [];
  Object.entries(dateAssignments).forEach(([devId, arr]: [string, any]) => {
    const devObj = dbDevices.find((dd: any) => dd.id === devId);
    arr.forEach((r: any) => {
      if (isAgentAbsent(r.id, currentDate)) {
        absentAssigned.push({ name: r.name, device: devObj?.name || devId });
      }
    });
  });

  const freeConvocados = convocados.filter((id: number) => !assignedIds.has(id));
  const absentFreeIds = freeConvocados.filter((id: number) => isAgentAbsent(id, currentDate));
  const actuallyFree = freeConvocados.filter((id: number) => !isAgentAbsent(id, currentDate));
  const freeConvocadosNames = actuallyFree.map((id: number) => {
    const res = allResidentsDb?.find((r: any) => r.id === id);
    return res ? res.name : `#${id}`;
  });
  const absentFreeNames = absentFreeIds.map((id: number) => {
    const res = allResidentsDb?.find((r: any) => r.id === id);
    return res ? res.name : `#${id}`;
  });

  const restingCount = (allResidentsDb?.length || 0) - convocadosCount;

  const pisoAccent = (p: number) =>
    p === 1 ? 'bg-[hsl(var(--floor-1-accent))]'
    : p === 2 ? 'bg-[hsl(var(--floor-2-accent))]'
    : 'bg-[hsl(var(--floor-3-accent))]';

  const pisoBorder = (p: number) =>
    p === 1 ? 'border-[hsl(var(--floor-1-border))] bg-[hsl(var(--floor-1-bg))]'
    : p === 2 ? 'border-[hsl(var(--floor-2-border))] bg-[hsl(var(--floor-2-bg))]'
    : 'border-[hsl(var(--floor-3-border))] bg-[hsl(var(--floor-3-bg))]';

  const isRotacionCompleta = orgType === 'rotacion completa';

  const distinctGroups = useMemo(() => {
    if (!isRotacionCompleta) return [];
    const groups = new Set<number>();
    Object.values(dateAssignments).forEach((arr: any) => {
      arr.forEach((r: any) => {
        if (r.numero_grupo != null) groups.add(r.numero_grupo);
      });
    });
    return Array.from(groups).sort();
  }, [dateAssignments, isRotacionCompleta]);

  return (
    <main className="flex-1 overflow-auto bg-muted/30 absolute inset-0">
      <div className={`mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 ${isLocked ? 'max-w-4xl' : 'max-w-5xl'}`}>
        
        {/* ── Controles Superiores (Fuera del PDF) ── */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 flex justify-center">
            <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
              {isLocked ? 'El Molino Fábrica Cultural' : 'Menú del Día'}
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Generando...' : 'PDF'}
            </button>

            <button 
              onClick={signOut}
              className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-bold border border-border hover:bg-accent transition-colors"
              title="Cerrar Sesión"
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── CONTENEDOR A EXPORTAR A PDF ── */}
        <div ref={pdfRef} id="pdf-root" className="bg-white rounded-xl pb-4">
          
          {/* ── Date Selector ── */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 bg-card rounded-xl border border-border p-2.5 sm:p-3 shadow-warm">
            <button onClick={prevDate} disabled={selectedDateIdx === 0} data-html2canvas-ignore
              className="p-1.5 sm:p-2 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors border border-border flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center min-w-0">
              <div className="relative inline-block group">
                <select
                  value={selectedDateIdx}
                  onChange={(e) => setSelectedDateIdx(parseInt(e.target.value))}
                  className="appearance-none bg-transparent text-xl sm:text-2xl font-black text-foreground tracking-tight pr-8 outline-none cursor-pointer border-b-2 border-transparent hover:border-primary/30 transition-all text-center"
                >
                  {activeDates.map((date: string, idx: number) => (
                    <option key={date} value={idx} className="bg-card text-base font-bold">
                      {date}
                    </option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1 flex-wrap">
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">👥 Conv. {convocadosCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-[hsl(var(--score-high-text))]">✅ Asig. {totalAssigned}</span>
                {totalVacant > 0 && <span className="text-[10px] sm:text-xs font-bold text-destructive">⚠️ Vac. {totalVacant}</span>}
                {freeConvocados.length > 0 && <span className="text-[10px] sm:text-xs font-bold text-[hsl(var(--score-mid-text))]">🆓 Libres {actuallyFree.length}</span>}
              </div>
            </div>
            <button onClick={nextDate} disabled={selectedDateIdx >= activeDates.length - 1 || (isLocked && !canSelectDate(activeDates[selectedDateIdx + 1]))} data-html2canvas-ignore
              className="p-1.5 sm:p-2 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors border border-border flex-shrink-0">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ══════ VISITAS GRUPALES ══════ */}
          {(visitasByDate?.[currentDate] || []).length > 0 && (
            <div className="mb-4 sm:mb-6">
              <VisitBlock visitas={visitasByDate[currentDate]} locked={isLocked} interactive={isNonApertura} onGroupChange={() => refresh()} />
            </div>
          )}

          {/* ══════ ASSIGNED DEVICES BY PISO ══════ */}
          {Object.entries(pisoGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([piso, devices]) => (
            <div key={piso} className={`mb-4 sm:mb-6 rounded-xl border-2 overflow-hidden ${pisoBorder(Number(piso))}`}>
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/30 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${pisoAccent(Number(piso))}`} />
                <span className="font-black text-xs sm:text-sm tracking-wide">{pisoNames[Number(piso)] || `Piso ${piso}`}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3">
                {(devices as any[]).map((dev: any) => {
                  const assignments: AssignmentEntry[] = dateAssignments[dev.id] || [];
                  const cupo = calendarDb[currentDate]?.[dev.id] || dev.max;
                  const isUnder = assignments.length < dev.min;
                  const isFull = assignments.length >= cupo;

                  return (
                    <div key={dev.id} className={`bg-card rounded-lg border-2 overflow-hidden transition-all ${
                      isUnder ? 'border-destructive/40' : isFull ? 'border-[hsl(var(--score-high-border))]' : 'border-border'
                    }`}>
                      <div className={`px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 ${getFloorColor(dev.name)}`}>
                        <span className="font-bold text-xs sm:text-sm truncate">{isLocked ? dev.name.replace(/\s*\(P\d\)\s*/g, '') : dev.name}</span>
                        <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                           isFull ? 'score-high' : 'bg-muted'
                        }`}>
                          {assignments.length}/{cupo}
                        </span>
                      </div>
                      
                      <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
                        {assignments.map((res: any, i: number) => {
                          const absent = isAgentAbsent(res.id, currentDate);
                          return (
                            <div key={i} className={`flex items-center justify-between px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md border text-[11px] sm:text-xs ${
                              absent ? 'bg-muted border-dashed border-muted-foreground/30 opacity-60' : 'bg-card border-border'
                            }`}>
                              <span className={`font-bold truncate ${absent ? 'line-through text-muted-foreground' : ''}`}>
                                {absent && '🚫 '}{res.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ══════ ABSENT ASSIGNED ══════ */}
          {(absentAssigned.length > 0 || absentFreeNames.length > 0) && (
            <div className="mb-4 sm:mb-6 rounded-xl border-2 border-[hsl(var(--score-mid-border))] bg-[hsl(var(--score-mid-bg))] overflow-hidden">
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[hsl(var(--score-mid-border))]/50 flex items-center gap-2">
                <span className="text-sm sm:text-base">🚫</span>
                <span className="font-black text-xs sm:text-sm tracking-wide text-[hsl(var(--score-mid-text))]">Inasistencias ({absentAssigned.length + absentFreeNames.length})</span>
              </div>
              <div className="p-2 sm:p-3 space-y-1">
                {absentAssigned.map((item, i) => (
                  <div key={`assigned-${i}`} className="flex items-center justify-between px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md border border-[hsl(var(--score-mid-border))]/30 bg-card text-[11px] sm:text-xs">
                    <span className="font-bold line-through text-muted-foreground truncate">{item.name}</span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-[hsl(var(--score-mid-text))] flex-shrink-0 ml-2">{item.device}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════ FREE CONVOCADOS ══════ */}
          {freeConvocadosNames.length > 0 && (
            <div className="mb-4 sm:mb-6 rounded-xl border-2 border-[hsl(var(--floor-1-border))] bg-[hsl(var(--floor-1-bg))] overflow-hidden">
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[hsl(var(--floor-1-border))]/50 flex items-center gap-2">
                <span className="text-sm sm:text-base">🆓</span>
                <span className="font-black text-xs sm:text-sm tracking-wide text-[hsl(var(--floor-1-text))]">Convocados Libres ({freeConvocadosNames.length})</span>
              </div>
              <div className="p-2 sm:p-3 flex flex-wrap gap-1.5 sm:gap-2">
                {freeConvocadosNames.map((name: string, i: number) => (
                  <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[hsl(var(--floor-1-border))]/30 bg-card text-[10px] sm:text-xs font-bold text-[hsl(var(--floor-1-text))]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
};

function getGroupDotColor(num: number | null): string {
  if (num === 1) return 'bg-[hsl(var(--floor-1-accent))]';
  if (num === 2) return 'bg-[hsl(var(--floor-2-accent))]';
  if (num === 3) return 'bg-[hsl(var(--floor-3-accent))]';
  return 'bg-primary';
}
