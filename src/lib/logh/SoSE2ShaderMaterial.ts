/**
 * SoSE2 (Sins of a Solar Empire 2) 커스텀 셰이더 머티리얼
 * 
 * SoSE 텍스처 포맷:
 * - Diffuse (Color): RGB = 색상, Alpha = 팀 컬러 마스크
 * - Data: R = specular, G = self illumination, B = reflection, A = bloom
 * - Normal: DXT5_NM 포맷
 */

import * as THREE from 'three';

// 진영 색상 정의
export const FACTION_COLORS = {
  empire: new THREE.Color(0xFFD700),   // 금색 (은하제국)
  alliance: new THREE.Color(0x4169E1), // 파란색 (자유행성동맹)
  neutral: new THREE.Color(0x808080),  // 회색 (중립)
};

// SoSE2 셰이더 - 버텍스 셰이더
const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

// SoSE2 셰이더 - 프래그먼트 셰이더
const fragmentShader = `
uniform sampler2D diffuseMap;
uniform sampler2D dataMap;
uniform sampler2D normalMap;
uniform vec3 teamColor;
uniform float teamColorIntensity;
uniform vec3 ambientLightColor;
uniform vec3 directionalLightColor;
uniform vec3 directionalLightDir;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // Diffuse 텍스처 샘플링
  vec4 diffuseSample = texture2D(diffuseMap, vUv);
  vec3 baseColor = diffuseSample.rgb;
  float teamColorMask = diffuseSample.a; // Alpha = 팀 컬러 마스크
  
  // 팀 컬러 적용 (alpha 마스크 기반)
  vec3 finalColor = mix(baseColor, teamColor * baseColor, teamColorMask * teamColorIntensity);
  
  // Data 텍스처 샘플링 (있는 경우)
  #ifdef USE_DATA_MAP
    vec4 dataSample = texture2D(dataMap, vUv);
    float specularIntensity = dataSample.r;
    float selfIllumination = dataSample.g;
    float reflectionIntensity = dataSample.b;
    float bloomIntensity = dataSample.a;
    
    // Self illumination 적용
    finalColor += baseColor * selfIllumination * 0.5;
  #endif
  
  // 기본 조명 계산
  vec3 normal = normalize(vNormal);
  float NdotL = max(dot(normal, directionalLightDir), 0.0);
  
  vec3 lighting = ambientLightColor + directionalLightColor * NdotL;
  finalColor *= lighting;
  
  // Specular 계산 (있는 경우)
  #ifdef USE_DATA_MAP
    vec3 viewDir = normalize(vViewPosition);
    vec3 halfDir = normalize(directionalLightDir + viewDir);
    float NdotH = max(dot(normal, halfDir), 0.0);
    float specular = pow(NdotH, 32.0) * specularIntensity;
    finalColor += directionalLightColor * specular * 0.3;
  #endif
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export interface SoSE2MaterialOptions {
  diffuseMap: THREE.Texture;
  dataMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  teamColor?: THREE.Color;
  teamColorIntensity?: number;
}

/**
 * SoSE2 커스텀 셰이더 머티리얼 생성
 */
export function createSoSE2Material(options: SoSE2MaterialOptions): THREE.ShaderMaterial {
  const {
    diffuseMap,
    dataMap,
    normalMap,
    teamColor = FACTION_COLORS.neutral,
    teamColorIntensity = 1.0,
  } = options;

  const defines: Record<string, boolean> = {};
  if (dataMap) defines.USE_DATA_MAP = true;
  if (normalMap) defines.USE_NORMAL_MAP = true;

  const uniforms = {
    diffuseMap: { value: diffuseMap },
    dataMap: { value: dataMap || null },
    normalMap: { value: normalMap || null },
    teamColor: { value: teamColor },
    teamColorIntensity: { value: teamColorIntensity },
    ambientLightColor: { value: new THREE.Color(0x404040) },
    directionalLightColor: { value: new THREE.Color(0xffffff) },
    directionalLightDir: { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    defines,
    side: THREE.DoubleSide,
  });

  return material;
}

/**
 * 팀 컬러 업데이트
 */
export function updateTeamColor(material: THREE.ShaderMaterial, color: THREE.Color): void {
  if (material.uniforms.teamColor) {
    material.uniforms.teamColor.value = color;
    material.needsUpdate = true;
  }
}









