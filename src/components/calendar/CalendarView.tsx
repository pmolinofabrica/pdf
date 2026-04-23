import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAgentCalendar } from '@/hooks/useAgentCalendar';
import { Plus, Trash2, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LOGO_BASE64 } from '../../assets/logo';

interface CalendarViewProps {
  selectedAgentId: number | null;
  selectedMonth: string;
  residentName: string;
}

const DEFAULT_COMMENT = "Para comunicarte con El Molino, Fábrica Cultural enviá un correo a <strong>elmolino.residencias@gmail.com</strong>";

export const CalendarView: React.FC<CalendarViewProps> = ({ selectedAgentId, selectedMonth, residentName }) => {
  const { convocatorias, isLoading } = useAgentCalendar(selectedAgentId, selectedMonth);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const [comments, setComments] = useState<string[]>(() => {
    const saved = localStorage.getItem('calendar_comments');
    return saved ? JSON.parse(saved) : [DEFAULT_COMMENT];
  });

  useEffect(() => {
    localStorage.setItem('calendar_comments', JSON.stringify(comments));
  }, [comments]);

  const addCommentRow = () => setComments([...comments, ""]);
  const removeCommentRow = (index: number) => {
    setComments(comments.filter((_, i: number) => i !== index));
  };
  const updateCommentRow = (index: number, newText: string) => {
    const next = [...comments];
    next[index] = newText;
    setComments(next);
  };  // Estilos de turnos actualizados: Jerarquía completa y compatible con HSL
  const getShiftStyles = (l: string) => {
    const label = l?.toLowerCase() || '';
    if (label.includes('apertura')) {
      return ['bg-[hsl(var(--pdf-apertura-bg))] text-[hsl(var(--pdf-apertura-text))]', 'bg-[hsl(var(--pdf-apertura-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('capacitación') && label.includes('general')) {
      return ['bg-[hsl(var(--pdf-general-bg))] text-white', 'bg-[hsl(var(--pdf-general-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('interna') || label.includes('capacitación')) {
      return ['bg-[hsl(var(--pdf-interna-bg))] text-[hsl(var(--pdf-interna-text))]', 'bg-[hsl(var(--pdf-interna-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('general')) {
      return ['bg-[hsl(var(--pdf-general-bg))] text-white', 'bg-[hsl(var(--pdf-general-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('mañana')) {
      return ['bg-[hsl(var(--pdf-manana-bg))] text-[hsl(var(--pdf-manana-text))]', 'bg-[hsl(var(--pdf-manana-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('tarde')) {
      return ['bg-[hsl(var(--pdf-tarde-bg))] text-white', 'bg-[hsl(var(--pdf-tarde-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('intermedio')) {
      return ['bg-[hsl(var(--pdf-intermedio-bg))] text-white', 'bg-[hsl(var(--pdf-intermedio-bg))]/30 text-k-on-surface'];
    }
    if (label.includes('descanso')) {
      return ['bg-[hsl(var(--pdf-descanso-bg))] text-white', 'bg-[hsl(var(--pdf-descanso-bg))]/30 text-k-on-surface'];
    }
    return ['bg-[hsl(var(--pdf-primary))] text-white', 'bg-[hsl(var(--pdf-primary))]/30 text-k-on-surface'];
  };

  const daysOfWeek = [
    { key: 'Mon', label: 'Lunes' },
    { key: 'Tue', label: 'Martes' },
    { key: 'Wed', label: 'Miércoles' },
    { key: 'Thu', label: 'Jueves' },
    { key: 'Fri', label: 'Viernes' },
    { key: 'Sat', label: 'Sábado' },
    { key: 'Sun', label: 'Domingo' }
  ];

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || isExporting) return;
    
    setIsExporting(true);
    const oldScrollY = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const element = pdfRef.current;
      
      await new Promise(resolve => setTimeout(resolve, 800));
      if (document.fonts) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#faf9f6',
        logging: false,
        windowWidth: 1440,
        onclone: (clonedDoc) => {
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            let css = styleTags[i].textContent || '';
            css = css.replace(/(oklab|oklch|color\-mix|color)\([^)]+\)/g, 'transparent');
            styleTags[i].textContent = css;
          }

          const fontStyle = clonedDoc.createElement('style');
          fontStyle.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..900&family=Manrope:wght@200..800&display=swap');
            h1, .font-headline { font-family: "Space Grotesk", sans-serif !important; }
            body, .font-body { font-family: "Manrope", sans-serif !important; }
          `;
          clonedDoc.head.appendChild(fontStyle);

          const bakedColors: Record<string, { solid: string, light: string, text: string }> = {
            '--pdf-apertura-bg': { solid: '#86efac', light: '#dcfce7', text: '#14532d' },
            '--pdf-interna-bg': { solid: '#7dd3fc', light: '#e0f2fe', text: '#0c4a6e' },
            '--pdf-general-bg': { solid: '#0369a1', light: '#bae6fd', text: '#ffffff' },
            '--pdf-descanso-bg': { solid: '#9ca3af', light: '#f3f4f6', text: '#ffffff' },
            '--pdf-manana-bg': { solid: '#fae047', light: '#fef08a', text: '#713f12' },
            '--pdf-tarde-bg': { solid: '#a855f7', light: '#e9d5ff', text: '#ffffff' },
            '--pdf-intermedio-bg': { solid: '#f97316', light: '#fed7aa', text: '#ffffff' },
            '--pdf-primary': { solid: '#3751c1', light: '#bfdbfe', text: '#ffffff' }
          };

          clonedDoc.querySelectorAll('.flex-col.shadow-xl').forEach(shiftContainer => {
            const container = shiftContainer as HTMLElement;
            const header = container.children[0] as HTMLElement;
            const body = container.children[1] as HTMLElement;
            
            if (header && body) {
              const classStr = header.className || '';
              Object.entries(bakedColors).forEach(([cssVar, colors]) => {
                if (classStr.includes(cssVar)) {
                  header.style.backgroundColor = colors.solid;
                  header.style.color = colors.text;
                  body.style.backgroundColor = colors.light;
                  body.style.color = '#1f2937';
                  body.style.backgroundImage = 'none';
                  body.style.borderTop = '1px solid rgba(0,0,0,0.1)';
                }
              });
            }
          });

          clonedDoc.querySelectorAll('button, .blur-3xl, .absolute.opacity-5').forEach(el => {
            (el as HTMLElement).style.display = 'none';
            (el as HTMLElement).style.visibility = 'hidden';
            (el as HTMLElement).style.opacity = '0';
          });
          
          const mainContainer = clonedDoc.querySelector('.max-w-\\[1440px\\]');
          if (mainContainer) {
            (mainContainer as HTMLElement).style.width = '1440px';
            (mainContainer as HTMLElement).style.minWidth = '1440px';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 8;
      
      // LOGO INJECTION NATIVO
      const logoWidth = 40;
      const logoHeight = 22.5; 
      const centerX = (pdfWidth - logoWidth) / 2;
      pdf.addImage(LOGO_BASE64, 'PNG', centerX, margin, logoWidth, logoHeight);

      // Calculando márgen inferior para el tablero de HTML renderizado
      const topOffset = margin + logoHeight + 5; // Separación 5mm abajo del logo
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - topOffset - margin;

      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const xOffset = (pdfWidth - imgWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, topOffset, imgWidth, imgHeight, undefined, 'FAST');
      
      const cleanName = residentName.trim().replace(/\s+/g, '_') || 'Residente';
      const cleanMonth = selectedMonth.replace(/\s+/g, '_');
      pdf.save(`${cleanName}_${cleanMonth}.pdf`);

    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('Error en la descarga del PDF. Por favor intenta de nuevo. (Detalle: ' + error.message + ')');
    } finally {
      window.scrollTo(0, oldScrollY);
      setIsExporting(false);
    }
  };

  const monthNames: Record<string, number> = {
    "Enero": 0, "Febrero": 1, "Marzo": 2, "Abril": 3,
    "Mayo": 4, "Junio": 5, "Julio": 6, "Agosto": 7,
    "Septiembre": 8, "Octubre": 9, "Noviembre": 10, "Diciembre": 11
  };

  const calendarData = useMemo(() => {
    const [monthName, yearStr] = selectedMonth.split(' ');
    const year = Number(yearStr);
    const month = monthNames[monthName] ?? 4;

    const firstDayDate = new Date(year, month, 1);
    const lastDayDate = new Date(year, month + 1, 0);
    
    const firstDayOfWeek = firstDayDate.getDay(); 
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push({ day: null });
    }

    const totalDays = lastDayDate.getDate();
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayConvocatorias = convocatorias.filter((c: any) => c.fecha === dateStr);
      days.push({ day: i, convocatorias: dayConvocatorias });
    }

    return { days, monthName };
  }, [selectedMonth, convocatorias]);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-k-on-surface font-body selection:bg-k-secondary selection:text-white pt-24 pb-12 relative overflow-hidden">
      <div className="absolute top-40 -left-20 w-64 h-64 rounded-full bg-k-secondary opacity-5 blur-3xl"></div>
      <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-k-primary opacity-5 blur-3xl"></div>

      <div ref={pdfRef} className="max-w-[1440px] mx-auto px-8 relative z-10 bg-[#faf9f6]">
        <div className="flex justify-between items-end mb-16 relative">
          <h1 className="font-headline text-[80px] leading-none font-black tracking-tighter text-k-on-surface uppercase relative z-10">
            {calendarData.monthName}
          </h1>
          <h1 className="font-headline text-[80px] leading-none font-black tracking-tighter text-k-on-surface uppercase relative z-10 text-right">
            {residentName}
          </h1>
          
          <div className="absolute -top-16 right-0 z-50">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`flex items-center gap-4 px-8 py-4 bg-k-on-surface text-white hover:bg-k-primary transition-all duration-500 shadow-2xl group relative overflow-hidden ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-center gap-3">
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:bounce" />}
                <span className="font-headline font-black text-xs uppercase tracking-[0.2em]">
                  {isExporting ? 'Procesando...' : 'Descargar PDF'}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div 
          className="grid grid-cols-2 md:grid-cols-7 gap-0 bg-k-surface-container-lowest shadow-sm"
          style={{ borderTop: '4px solid #2c2f30' }}
        >
          {daysOfWeek.map((day) => (
            <div key={day.key} className="p-4 border-r border-[hsl(var(--pdf-border))] font-headline font-black text-[24px] tracking-[0.2em] uppercase text-k-on-surface-variant last:border-r-0">
              {day.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-0 border-l border-[hsl(var(--pdf-border))] shadow-lg bg-white">
          {calendarData.days.map((dayInfo: any, idx: number) => {
            const [monthName] = selectedMonth.split(' ');
            const mm = (monthNames[monthName] + 1).toString().padStart(2, '0');
            const displayDate = dayInfo.day ? `${String(dayInfo.day).padStart(2, '0')}/${mm}` : '';

            return (
              <div 
                key={idx} 
                className={`min-h-[160px] border-r border-b border-[hsl(var(--pdf-border))] p-3 transition-colors relative flex flex-col ${
                  dayInfo.day 
                    ? 'hover:bg-k-surface-container-low cursor-pointer bg-k-surface-container-lowest' 
                    : ''
                }`}
                style={!dayInfo.day ? { backgroundColor: 'rgba(230, 232, 234, 0.2)' } : {}}
              >
                {dayInfo.day && (
                  <>
                    <span 
                      className="font-headline text-[24px] font-black select-none mb-1 block"
                      style={{ color: 'rgba(44, 47, 48, 0.8)' }}
                    >
                      {displayDate}
                    </span>
                    
                    <div className="z-10 w-full flex flex-col">
                      {dayInfo.convocatorias?.map((c: any) => {
                        const isDescanso = c.etiqueta?.toLowerCase().includes('descanso');
                        
                        if (isDescanso) {
                          return (
                            <div 
                              key={c.id_convocatoria}
                              className="h-12 w-auto -mx-3 mb-2 shrink-0 border-y border-k-on-surface/10 bg-[hsl(var(--pdf-descanso-bg))]"
                              title="Descanso"
                            />
                          );
                        }

                        const [labelClass, scheduleClass] = getShiftStyles(c.etiqueta);
                        const hasTime = c.hora_inicio && c.hora_fin && c.hora_inicio !== '00:00:00';

                        return (
                          <div 
                            key={c.id_convocatoria}
                            className="flex flex-col shadow-xl overflow-hidden group hover:scale-[1.03] transition-transform duration-200 mb-2 shrink-0"
                          >
                            <div className={`px-1 py-2 ${labelClass}`}>
                              <div className="font-headline font-black text-[24px] uppercase leading-tight tracking-tighter break-words" style={{ wordBreak: 'break-word' }}>
                                {c.etiqueta || 'S/D'}
                              </div>
                            </div>
                            <div 
                              className={`px-1 py-1.5 ${scheduleClass} border-t`}
                              style={scheduleClass.includes('/') ? { borderTopColor: 'rgba(0,0,0,0.1)' } : { borderTopColor: 'rgba(0,0,0,0.1)' }} 
                            >
                              <div className="font-headline text-[24px] font-black tracking-tight flex flex-wrap items-center gap-1 uppercase">
                                {hasTime ? (
                                  <>
                                    <span>{c.hora_inicio.substring(0, 5)}</span>
                                    <span className="opacity-40">—</span>
                                    <span>{c.hora_fin.substring(0, 5)}</span>
                                  </>
                                ) : (
                                  <span>Horario a confirmar</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          
          {Array.from({ length: (7 - (calendarData.days.length % 7)) % 7 }).map((_, i) => (
            <div 
              key={`empty-end-${i}`} 
              className="min-h-[160px] border-r border-b border-[hsl(var(--pdf-border))]"
              style={{ backgroundColor: 'rgba(230, 232, 234, 0.2)' }}
            ></div>
          ))}
        </div>

        <div className="mt-20 border-t-4 border-k-on-surface pt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-black text-2xl tracking-tighter uppercase text-k-on-surface flex items-center gap-3">
              <span className="w-8 h-[2px] bg-k-primary"></span>
              Comentarios y Notas
            </h3>
            {!isExporting && (
              <button 
                onClick={addCommentRow}
                className="group flex items-center gap-2 px-4 py-2 bg-k-on-surface text-white hover:bg-k-primary transition-colors duration-300"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span className="font-headline font-black text-[10px] uppercase tracking-widest">Añadir Renglón</span>
              </button>
            )}
          </div>

          <div className="space-y-0">
            {comments.map((comment: string, idx: number) => (
              <div 
                key={idx} 
                className="group relative flex items-center border-b hover:bg-k-surface-container-low/30 transition-colors"
                style={{ borderBottomColor: 'rgba(117, 119, 120, 0.3)' }}
              >
                <div 
                  className="flex-1 py-4 px-2 font-body text-[30px] outline-none min-h-[56px] focus:bg-white transition-colors"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateCommentRow(idx, e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: comment }}
                />
                {!isExporting && (
                  <button 
                    onClick={() => removeCommentRow(idx)}
                    className="p-3 text-k-outline opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    title="Eliminar renglón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* High Contrast Schedule Strip (Contexto) */}
        {!isLoading && convocatorias.length === 0 && selectedAgentId && (
          <div className="mt-12 p-8 bg-k-surface-container-low border-l-4 border-k-secondary font-body">
            <p className="text-k-on-surface-variant font-medium">No hay convocatorias registradas para este residente en {calendarData.monthName}.</p>
          </div>
        )}
      </div>

      {/* Floating Decorative Elements */}
      <div className="fixed top-1/2 right-0 -translate-y-1/2 flex flex-col gap-12 pr-4 pointer-events-none opacity-20">
        <div className="w-24 h-[2px] bg-k-secondary rotate-45"></div>
        <div className="w-24 h-[2px] bg-k-primary -rotate-45"></div>
        <div className="w-24 h-[2px] bg-k-tertiary rotate-12"></div>
      </div>
    </div>
  );
};
