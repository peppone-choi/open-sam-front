/**
 * Jest 테스트 설정 파일
 * 모든 테스트 전에 실행됩니다.
 */

import '@testing-library/jest-dom';

// DOM 환경 모킹
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// requestAnimationFrame 모킹
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

// WebGL 모킹
const mockWebGLContext = {
  getExtension: jest.fn(),
  getParameter: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  createTexture: jest.fn(),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  viewport: jest.fn(),
  clearColor: jest.fn(),
  clear: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
};

HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((type: string) => {
  if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
});

// ResizeObserver 모킹
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Performance API 모킹
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  } as unknown as Performance;
}

// 콘솔 경고 억제 (선택적)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  // Three.js 관련 경고 억제
  if (typeof args[0] === 'string' && args[0].includes('THREE.')) {
    return;
  }
  originalWarn.apply(console, args);
};

// 전역 테스트 유틸리티
export {};




