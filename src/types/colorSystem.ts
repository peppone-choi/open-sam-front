export interface ColorSystem {
  // 배경
  pageBg: string;          // 페이지 배경
  
  // 테두리
  border: string;          // 테두리 (진하게)
  borderLight: string;     // 연한 테두리
  
  // 버튼/인터랙션 (국가색 기반)
  buttonBg: string;        // 버튼 배경 (국가색 A0)
  buttonHover: string;     // 버튼 호버 (국가색 C0)
  buttonActive: string;    // 버튼 액티브 (국가색 FF - 완전 불투명)
  buttonText: string;      // 버튼 글자색 (밝은 배경에는 어두운 글자, 어두운 배경에는 밝은 글자)
  activeBg: string;        // 액티브/선택 (국가색 FF)
  
  // 글자색 (국가색 기반 - 밝기 자동 조정)
  text: string;            // 기본 글자색 (국가색 어두운 버전)
  textMuted: string;       // 보조 글자색 (국가색 반투명)
  textDim: string;         // 희미한 글자색 (국가색 더 투명)
  
  // 강조색
  accent: string;          // 일반 강조 (국가색 원색)
  accentBright: string;    // 밝은 강조
  success: string;         // 긍정/성공 (초록 고정)
  warning: string;         // 경고 (국가색 변형)
  error: string;           // 부정/오류 (빨강 고정)
  info: string;            // 정보 (국가색 변형)
  special: string;         // 특수 (국가색 변형)
}

/**
 * HEX 색상을 RGB로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * RGB를 HEX로 변환
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('');
}

/**
 * 색상의 밝기(luminance) 계산 (0.0 ~ 1.0)
 * 0.0 = 완전 어두움, 1.0 = 완전 밝음
 */
function calculateLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5; // 기본값
  
  // sRGB to linear RGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  // 상대 밝기 계산
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * RGB를 HSL로 변환
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * HSL을 RGB로 변환
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * 색상을 어둡게 만들기 (amount: 0.0 ~ 1.0)
 */
export function darkenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    rgb.r * (1 - amount),
    rgb.g * (1 - amount),
    rgb.b * (1 - amount)
  );
}

/**
 * 색상의 색조(Hue)를 이동시키기
 * @param hex 원본 색상
 * @param degrees 색조 이동 각도 (-180 ~ 180)
 */
function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees + 360) % 360;
  
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * 채도 조정
 */
function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * 밝기 조정
 */
function adjustLightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * 글자색으로 사용할 수 있도록 색상 조정
 * - 밝은 색상(노란색 등): 어둡게 변환
 * - 어두운 색상: 그대로 사용
 */
export function adjustColorForText(hex: string): string {
  const luminance = calculateLuminance(hex);
  
  // 밝기가 0.5 이상이면 어둡게 조정
  if (luminance > 0.5) {
    // 밝기에 따라 어둡게 하는 정도 조정
    const darkenAmount = 0.3 + (luminance - 0.5) * 0.6; // 0.3 ~ 0.6
    return darkenColor(hex, darkenAmount);
  }
  
  // 어두운 색상은 그대로 사용
  return hex;
}

/**
 * 국가색 기반으로 강조색 생성
 */
export function makeAccentColors(nationColor: string) {
  return {
    // 성공: 초록 고정 (긍정 = 범용)
    success: '#2e7d32',
    
    // 에러: 빨강 고정 (부정 = 범용)
    error: '#c62828',
    
    // 경고: 국가색을 주황 방향으로 이동 + 채도 증가
    warning: adjustSaturation(shiftHue(nationColor, 30), 20),
    
    // 정보: 국가색을 파랑 방향으로 이동
    info: shiftHue(nationColor, -120),
    
    // 특수: 국가색을 보라 방향으로 이동
    special: shiftHue(nationColor, 120),
    
    // 밝은 강조: 국가색 + 밝기 증가 + 채도 증가
    accentBright: adjustLightness(adjustSaturation(nationColor, 30), 10),
  };
}

/**
 * 색상이 밝은지 판단 (밝은 배경에서 흰 글자 대신 어두운 글자 필요)
 */
export function isBrightColor(hex: string): boolean {
  return calculateLuminance(hex) > 0.5;
}

/**
 * 대비 색상 생성 (밝은 색상 → 어두운 텍스트, 어두운 색상 → 밝은 텍스트)
 */
export function getContrastColor(hex: string): string {
  return isBrightColor(hex) ? '#1a1a2e' : '#f0f0f0';
}

/**
 * 색상을 밝게 만들기 (amount: 0.0 ~ 1.0)
 */
export function lightenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount
  );
}

/**
 * 색상에 알파값 추가 (HEX → RGBA 문자열)
 */
export function addAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * 국가색 기반으로 완전한 ColorSystem 생성
 * 다크 테마 기반 (어두운 배경 + 국가색 강조)
 */
export function createColorSystem(nationColor: string): ColorSystem {
  const luminance = calculateLuminance(nationColor);
  const isBright = luminance > 0.5;
  
  // 밝은 색상(금색, 노란색 등)은 어둡게 조정하여 가독성 확보
  const adjustedAccent = isBright
    ? darkenColor(nationColor, 0.15) // 살짝만 어둡게
    : nationColor;
  
  // 버튼 텍스트: 밝은 국가색이면 어두운 글자, 어두운 국가색이면 밝은 글자
  const buttonTextColor = getContrastColor(nationColor);
  
  // 텍스트용 국가색 (밝은 색상은 더 어둡게)
  const textAccent = adjustColorForText(nationColor);
  
  const accentColors = makeAccentColors(nationColor);
  
  return {
    // 배경 (다크 테마 고정)
    pageBg: '#0a0a14',
    
    // 테두리
    border: addAlpha(nationColor, 0.3),
    borderLight: addAlpha(nationColor, 0.15),
    
    // 버튼/인터랙션 (국가색 기반)
    buttonBg: addAlpha(nationColor, 0.6),
    buttonHover: addAlpha(nationColor, 0.8),
    buttonActive: nationColor,
    buttonText: buttonTextColor,
    activeBg: nationColor,
    
    // 글자색
    text: textAccent,
    textMuted: addAlpha(textAccent, 0.7),
    textDim: addAlpha(textAccent, 0.4),
    
    // 강조색
    accent: adjustedAccent,
    accentBright: accentColors.accentBright,
    success: accentColors.success,
    warning: accentColors.warning,
    error: accentColors.error,
    info: accentColors.info,
    special: accentColors.special,
  };
}

/**
 * ColorSystem을 CSS 변수로 변환
 */
export function colorSystemToCssVars(cs: ColorSystem): Record<string, string> {
  return {
    '--color-page-bg': cs.pageBg,
    '--color-border': cs.border,
    '--color-border-light': cs.borderLight,
    '--color-button-bg': cs.buttonBg,
    '--color-button-hover': cs.buttonHover,
    '--color-button-active': cs.buttonActive,
    '--color-button-text': cs.buttonText,
    '--color-active-bg': cs.activeBg,
    '--color-text': cs.text,
    '--color-text-muted': cs.textMuted,
    '--color-text-dim': cs.textDim,
    '--color-accent': cs.accent,
    '--color-accent-bright': cs.accentBright,
    '--color-success': cs.success,
    '--color-warning': cs.warning,
    '--color-error': cs.error,
    '--color-info': cs.info,
    '--color-special': cs.special,
  };
}

/**
 * CSS 변수를 DOM에 적용
 */
export function applyCssVars(vars: Record<string, string>, element?: HTMLElement): void {
  const target = element || document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}

/**
 * 기본 ColorSystem (국가 미선택 시)
 */
export const DEFAULT_COLOR_SYSTEM: ColorSystem = createColorSystem('#6366f1'); // Indigo
