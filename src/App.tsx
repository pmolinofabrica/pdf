import { useState, useEffect } from 'react'
import { MenuView } from '@/components/assignments/MenuView'
import { CalendarView } from '@/components/calendar/CalendarView'
import { useMonthlyData } from '@/hooks/useMonthlyData'
import { useAgentes } from '@/hooks/useAgentes'
import { AuthGuard } from '@/components/AuthGuard'
import { Calendar as CalendarIcon, Clock, UserRound } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'calendar'>('menu')
  // Default to May 2026 (month posterior to current April)
  const [selectedMonth, setSelectedMonth] = useState('Mayo 2026')
  const [selectedTurno, setSelectedTurno] = useState('manana')
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null)
  
  const { data, isLoading } = useMonthlyData(selectedMonth, selectedTurno)
  const { agentes, isLoading: isLoadingAgentes } = useAgentes()

  // Generate all months for 2026
  const months2026 = [
    "Enero 2026", "Febrero 2026", "Marzo 2026", "Abril 2026",
    "Mayo 2026", "Junio 2026", "Julio 2026", "Agosto 2026",
    "Septiembre 2026", "Octubre 2026", "Noviembre 2026", "Diciembre 2026"
  ]

  // Set first agent as default when list loads
  useEffect(() => {
    if (agentes.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agentes[0].id_agente);
    }
  }, [agentes, selectedAgentId]);

  // Global Keyboard Shortcuts for switching residents natively
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when typing into editable inputs/textareas
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (activeTab === 'calendar' && agentes.length > 0) {
        const currentIndex = agentes.findIndex(a => a.id_agente === selectedAgentId);
        
        // Q: Anterior
        if (e.key.toLowerCase() === 'q') {
          if (currentIndex > 0) {
            setSelectedAgentId(agentes[currentIndex - 1].id_agente);
          }
        }
        // W: Siguiente
        if (e.key.toLowerCase() === 'w') {
          if (currentIndex !== -1 && currentIndex < agentes.length - 1) {
            setSelectedAgentId(agentes[currentIndex + 1].id_agente);
          } else if (currentIndex === -1) {
            setSelectedAgentId(agentes[0].id_agente);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, agentes, selectedAgentId]);

  if (isLoading || isLoadingAgentes) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted-foreground">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  if (!data || (!data.activeDates && !isLoading)) {
     // Optional: Don't block CalendarView even if activeDates is empty
     if (activeTab === 'menu') {
        return (
          <div className="flex items-center justify-center min-h-screen p-8 text-center bg-background">
             <div className="max-w-md space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Sin Datos Disponibles</h2>
                <p className="text-muted-foreground">No se encontraron asignaciones para la combinación seleccionada.</p>
                <button 
                  onClick={() => { setSelectedMonth('Mayo 2026'); setSelectedTurno('manana'); }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm"
                >
                  Restablecer
                </button>
             </div>
          </div>
        );
     }
  }

  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${activeTab === 'calendar' ? 'bg-k-surface' : 'bg-background'}`}>
      {/* Persistent Navigation & Controls Overlay */}
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Side: Dynamic Filters */}
        <div className="flex items-center gap-3 pointer-events-auto">
          
          {/* Menu Selectors: Month | Turno */}
          {activeTab === 'menu' && (
            <>
              <div className="flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-1.5 shadow-warm-lg backdrop-blur-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer text-foreground"
                >
                  {months2026.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-1.5 shadow-warm-lg backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <select 
                  value={selectedTurno} 
                  onChange={(e) => setSelectedTurno(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer text-foreground"
                >
                  <option value="apertura">Apertura al Público</option>
                  <option value="manana">Turno Mañana</option>
                  <option value="tarde">Turno Tarde</option>
                </select>
              </div>
            </>
          )}

          {/* Calendar Selectors: Residente | Month */}
          {activeTab === 'calendar' && (
            <>
              <div className="flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-1.5 shadow-warm-lg backdrop-blur-sm">
                <UserRound className="w-3.5 h-3.5 text-k-primary" />
                <select 
                  value={selectedAgentId || ''} 
                  onChange={(e) => setSelectedAgentId(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer text-foreground min-w-[150px]"
                >
                  {agentes.map(a => (
                    <option key={a.id_agente} value={a.id_agente}>
                      {a.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-1.5 shadow-warm-lg backdrop-blur-sm">
                <CalendarIcon className="w-3.5 h-3.5 text-k-primary" />
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer text-foreground"
                >
                  {months2026.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Right Side: View Switcher */}
        <div className="flex items-center p-1 bg-card/80 border border-border rounded-xl shadow-warm-lg backdrop-blur-sm pointer-events-auto">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${
              activeTab === 'menu' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Menú del día
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${
              activeTab === 'calendar' 
                ? 'bg-k-primary text-k-on-primary shadow-sm font-headline' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Calendario
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'menu' ? (
        <MenuView data={data} year="2026" />
      ) : (
        <CalendarView 
          selectedAgentId={selectedAgentId} 
          selectedMonth={selectedMonth} 
          residentName={agentes.find(a => a.id_agente === selectedAgentId)?.nombre_completo || ''}
        />
      )}
    </div>
  )
}

function Root() {
  return (
    <AuthGuard>
      <App />
    </AuthGuard>
  )
}

export default Root
