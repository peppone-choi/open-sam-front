/**
 * WCAG 2.1 색상 대비 유틸리티
 * AA 기준: 일반 텍스트 4.5:1, 큰 텍스트 3:1
 * AAA 기준: 일반 텍스트 7:1, 큰 텍스트 4.5:1
 */

/**
 * HEX 색상을 RGB로 변환
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // # 제거 및 3자리 HEX 처리
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 상대 휘도(Relative Luminance) 계산
 * WCAG 2.1 공식 사용
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 두 색상 간의 대비율 계산
 * @returns 1:1 ~ 21:1 범위의 대비율
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 레벨별 대비율 기준
 */
export const WCAG_CONTRAST_RATIOS = {
  /** AA 기준: 일반 텍스트 */
  AA_NORMAL: 4.5,
  /** AA 기준: 큰 텍스트 (18pt 이상 또는 14pt 볼드) */
  AA_LARGE: 3.0,
  /** AAA 기준: 일반 텍스트 */
  AAA_NORMAL: 7.0,
  /** AAA 기준: 큰 텍스트 */
  AAA_LARGE: 4.5,
  /** UI 컴포넌트 및 그래픽 */
  UI_COMPONENT: 3.0,
};

/**
 * WCAG 준수 여부 확인
 */
export function checkWCAGCompliance(
  foreground: string,
  background: string,
  options: {
    isLargeText?: boolean;
    level?: 'AA' | 'AAA';
  } = {}
): {
  ratio: number;
  passes: boolean;
  requiredRatio: number;
  level: string;
} {
  const { isLargeText = false, level = 'AA' } = options;
  const ratio = getContrastRatio(foreground, background);
  
  let requiredRatio: number;
  if (level === 'AAA') {
    requiredRatio = isLargeText ? WCAG_CONTRAST_RATIOS.AAA_LARGE : WCAG_CONTRAST_RATIOS.AAA_NORMAL;
  } else {
    requiredRatio = isLargeText ? WCAG_CONTRAST_RATIOS.AA_LARGE : WCAG_CONTRAST_RATIOS.AA_NORMAL;
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= requiredRatio,
    requiredRatio,
    level: `${level} (${isLargeText ? 'Large Text' : 'Normal Text'})`,
  };
}

/**
 * 대비율을 만족하는 색상 조정
 * @param foreground 전경색
 * @param background 배경색
 * @param targetRatio 목표 대비율
 * @returns 조정된 전경색
 */
export function adjustColorForContrast(
  foreground: string,
  background: string,
  targetRatio: number = WCAG_CONTRAST_RATIOS.AA_NORMAL
): string {
  const currentRatio = getContrastRatio(foreground, background);
  if (currentRatio >= targetRatio) return foreground;

  const bgLuminance = getRelativeLuminance(background);
  const rgb = hexToRgb(foreground);
  if (!rgb) return foreground;

  // 배경이 밝으면 전경을 어둡게, 어두우면 밝게
  const shouldLighten = bgLuminance < 0.5;
  
  let adjusted = { ...rgb };
  const step = shouldLighten ? 5 : -5;
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    adjusted = {
      r: Math.max(0, Math.min(255, adjusted.r + step)),
      g: Math.max(0, Math.min(255, adjusted.g + step)),
      b: Math.max(0, Math.min(255, adjusted.b + step)),
    };

    const newHex = rgbToHex(adjusted.r, adjusted.g, adjusted.b);
    const newRatio = getContrastRatio(newHex, background);
    
    if (newRatio >= targetRatio) {
      return newHex;
    }
    
    iterations++;
  }

  // 최대 반복 후에도 목표 도달 못하면 검정 또는 흰색 반환
  return shouldLighten ? '#ffffff' : '#000000';
}

/**
 * RGB를 HEX로 변환
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(c => Math.round(c).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 프로젝트 색상 시스템 검증
 */
export function validateColorSystem(): {
  valid: { name: string; ratio: number }[];
  invalid: { name: string; ratio: number; required: number }[];
} {
  // 프로젝트의 주요 색상 조합
  const colorPairs: { name: string; fg: string; bg: string; isLarge?: boolean }[] = [
    { name: 'Primary Button', fg: '#ffffff', bg: '#6366f1' },
    { name: 'Secondary Button', fg: '#ffffff', bg: '#ec4899' },
    { name: 'Main Text on Dark', fg: '#E0E0E0', bg: '#050510' },
    { name: 'Muted Text on Dark', fg: '#9CA3AF', bg: '#050510' },
    { name: 'Dim Text on Dark', fg: '#64748b', bg: '#050510' },
    { name: 'Error Text', fg: '#ff6b6b', bg: '#050510' },
    { name: 'Success Text', fg: '#55efc4', bg: '#050510' },
    { name: 'Warning Text', fg: '#ffeaa7', bg: '#050510' },
    { name: 'Info Text', fg: '#74b9ff', bg: '#050510' },
    { name: 'Link on Dark', fg: '#6366f1', bg: '#050510' },
    { name: 'Card Title', fg: '#ffffff', bg: '#101520' },
    { name: 'Card Body', fg: '#E0E0E0', bg: '#101520' },
  ];

  const valid: { name: string; ratio: number }[] = [];
  const invalid: { name: string; ratio: number; required: number }[] = [];

  colorPairs.forEach(({ name, fg, bg, isLarge }) => {
    const { ratio, passes, requiredRatio } = checkWCAGCompliance(fg, bg, { isLargeText: isLarge });
    
    if (passes) {
      valid.push({ name, ratio });
    } else {
      invalid.push({ name, ratio, required: requiredRatio });
    }
  });

  return { valid, invalid };
}

/**
 * CSS 변수에서 색상 추출 (브라우저 환경)
 */
export function getCSSVariableColor(variableName: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  
  return value || null;
}

/**
 * 색상이 어두운지 밝은지 판단
 */
export function isDarkColor(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.5;
}

/**
 * 색상에 적합한 텍스트 색상 반환 (검정 또는 흰색)
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isDarkColor(backgroundColor) ? '#ffffff' : '#000000';
}


