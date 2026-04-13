export const getFloorColor = (deviceName: string): string => {
  if (deviceName.includes("(P1)")) return "floor-p1 border";
  if (deviceName.includes("(P2)")) return "floor-p2 border";
  if (deviceName.includes("(P3)")) return "floor-p3 border";
  return "bg-muted text-muted-foreground border-border";
};

export const getFloorColorBadge = (deviceName: string): string => {
  if (deviceName.includes("(P1)")) return "bg-[hsl(var(--floor-1-bg))] text-[hsl(var(--floor-1-text))]";
  if (deviceName.includes("(P2)")) return "bg-[hsl(var(--floor-2-bg))] text-[hsl(var(--floor-2-text))]";
  if (deviceName.includes("(P3)")) return "bg-[hsl(var(--floor-3-bg))] text-[hsl(var(--floor-3-text))]";
  return "bg-muted text-muted-foreground";
};

export const getFloorAccent = (piso: number | string): string => {
  const p = String(piso);
  if (p === '1') return "bg-[hsl(var(--floor-1-accent))]";
  if (p === '2') return "bg-[hsl(var(--floor-2-accent))]";
  if (p === '3') return "bg-[hsl(var(--floor-3-accent))]";
  return "bg-muted-foreground";
};

export const getFloorPisoStyle = (pisoNum: string) => {
  const styles: Record<string, { name: string; bg: string; text: string; border: string; accent: string }> = {
    '1': { name: 'PAPEL', bg: 'bg-[hsl(var(--floor-1-bg))]', text: 'text-[hsl(var(--floor-1-text))]', border: 'border-[hsl(var(--floor-1-border))]', accent: 'bg-[hsl(var(--floor-1-accent))]' },
    '2': { name: 'MADERA', bg: 'bg-[hsl(var(--floor-2-bg))]', text: 'text-[hsl(var(--floor-2-text))]', border: 'border-[hsl(var(--floor-2-border))]', accent: 'bg-[hsl(var(--floor-2-accent))]' },
    '3': { name: 'TEXTIL', bg: 'bg-[hsl(var(--floor-3-bg))]', text: 'text-[hsl(var(--floor-3-text))]', border: 'border-[hsl(var(--floor-3-border))]', accent: 'bg-[hsl(var(--floor-3-accent))]' },
  };
  return styles[pisoNum] || styles['1'];
};

export const getGroupColor = (num: number | null): string => {
  if (!num) return "bg-muted text-muted-foreground border-border";
  if (num === 1) return "bg-[hsl(var(--floor-1-accent))] text-white border-[hsl(var(--floor-1-accent))]";
  if (num === 2) return "bg-[hsl(var(--floor-2-accent))] text-white border-[hsl(var(--floor-2-accent))]";
  if (num === 3) return "bg-[hsl(var(--floor-3-accent))] text-white border-[hsl(var(--floor-3-accent))]";
  return "bg-primary text-primary-foreground border-primary";
};
