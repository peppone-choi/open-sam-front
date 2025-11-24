/**
 * Dynamic Three.js loader
 * Centralizes Three.js imports to enable code splitting
 */

let threeModule: typeof import('three') | null = null;

export async function loadThree() {
  if (!threeModule) {
    threeModule = await import('three');
  }
  return threeModule;
}

export type ThreeModule = typeof import('three');
