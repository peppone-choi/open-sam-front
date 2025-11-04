export function isBrightColor(color: number | string | undefined): boolean {
  if (!color) return false;
  const hex = typeof color === 'number' 
    ? color.toString(16).padStart(6, '0') 
    : String(color).replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}




