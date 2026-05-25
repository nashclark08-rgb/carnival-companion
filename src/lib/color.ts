function hexToRgb(hex: string): [number, number, number] | null {
  const c = hex.trim().replace(/^#/, "");
  if (c.length === 3) {
    const r = parseInt(c[0] + c[0], 16);
    const g = parseInt(c[1] + c[1], 16);
    const b = parseInt(c[2] + c[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }
  if (c.length === 6) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }
  return null;
}

export function relativeLuminance(hex: string | undefined): number {
  if (!hex) return 0;
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const norm = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = rgb.map(norm);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const LIGHT_TEXT = "#ffffff";
const DARK_TEXT = "#0f172a";

export function contrastingTextColor(
  bg: string | undefined,
  fallbackForUnknown: string = LIGHT_TEXT,
): string {
  if (!bg) return fallbackForUnknown;
  const lum = relativeLuminance(bg);
  if (lum === 0 && bg !== "#000000" && bg !== "#000") return fallbackForUnknown;
  return lum > 0.5 ? DARK_TEXT : LIGHT_TEXT;
}

export function isLightColor(hex: string | undefined): boolean {
  return relativeLuminance(hex) > 0.5;
}

export function readableBorderColor(
  bg: string | undefined,
  preferred: string | undefined,
): string {
  if (!preferred) return "rgba(15, 23, 42, 0.15)";
  const bgLight = isLightColor(bg);
  const borderLight = isLightColor(preferred);
  if (bgLight && borderLight) return "rgba(15, 23, 42, 0.25)";
  return preferred;
}
