import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);
      try {
        const { error: err } = await signIn(email, password);
        if (err) setError(err.message);
      } catch (e: any) {
        setError("Error de conexión con la base de datos.");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-warm-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Menú del Día</h1>
            <p className="text-sm font-medium text-muted-foreground">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-shake">
                ⚠️ {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Email</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-warm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-[10px] font-bold text-muted-foreground/60">
            © 2026 El Molino — Fábrica Cultural
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
