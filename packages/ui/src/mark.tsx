// The app mark: four calendar days (full, half, leave, blank) on a coloured tile.
// Plain inline-styled divs so next/og (Satori) can render it to PNG for app icons.
// The glyph stays inside the middle 60%, so the same image works as a maskable icon.

// Employer: indigo tile. Employee: light tile with ink, so the two differ on a home screen.
export const MARK_COLORS = {
  employer: { background: "#2b3a8c", blank: "rgba(255,255,255,0.9)", soft: "rgba(255,255,255,0.16)" },
  employee: { background: "#f6f7f9", blank: "#1e2a4a", soft: "rgba(30,42,74,0.12)" },
} as const;
type Palette = (typeof MARK_COLORS)[keyof typeof MARK_COLORS];

const FULL = "#22c55e";
const HALF = "#f59e0b";
const LEAVE = "#ef4444";

export function AppMark({ size, colors }: { size: number; colors: Palette }) {
  const { background, blank, soft } = colors;
  const cell = Math.round(size * 0.26);
  const gap = Math.round(size * 0.06);
  const radius = Math.round(cell * 0.22);
  const border = Math.max(2, Math.round(cell * 0.12));
  const base = { width: cell, height: cell, borderRadius: radius, display: "flex" } as const;
  return (
    <div style={{ width: size, height: size, background, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        <div style={{ display: "flex", gap }}>
          <div style={{ ...base, background: FULL }} />
          <div style={{ ...base, backgroundImage: `linear-gradient(135deg, ${HALF} 50%, ${soft} 50%)` }} />
        </div>
        <div style={{ display: "flex", gap }}>
          <div style={{ ...base, border: `${border}px solid ${LEAVE}`, background: soft }} />
          <div style={{ ...base, background: blank }} />
        </div>
      </div>
    </div>
  );
}
