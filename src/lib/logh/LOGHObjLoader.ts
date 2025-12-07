/**
 * LOGH OBJ 모델 로더
 * 
 * Three.js OBJLoader/MTLLoader를 사용해 Stellaris LOGH 함선 모델 로드
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

// 에셋 경로
const BASE_PATH = '/assets/logh-stellaris';
const OBJ_PATH = `${BASE_PATH}/obj`;
const TEXTURE_PATH = `${BASE_PATH}/textures-png`; // PNG로 변환된 텍스처

// 캐시
const modelCache = new Map<string, THREE.Group>();
const textureCache = new Map<string, THREE.Texture>();

// 로더 인스턴스
let objLoader: OBJLoader | null = null;
let mtlLoader: MTLLoader | null = null;
let textureLoader: THREE.TextureLoader | null = null;

/**
 * 로더 초기화
 */
function initLoaders(): void {
  if (!objLoader) {
    objLoader = new OBJLoader();
  }
  if (!mtlLoader) {
    mtlLoader = new MTLLoader();
    mtlLoader.setPath(OBJ_PATH + '/');
    // MTL 내 텍스처는 PNG 폴더에서 로드
    mtlLoader.setResourcePath(TEXTURE_PATH + '/');
  }
  if (!textureLoader) {
    textureLoader = new THREE.TextureLoader();
  }
}

/**
 * PNG 텍스처 로드 (DDS에서 변환됨)
 */
export async function loadTexture(filename: string): Promise<THREE.Texture> {
  // DDS 파일명을 PNG로 변환 (소문자)
  const pngFilename = filename.replace(/\.dds$/i, '.png').toLowerCase();
  
  const cached = textureCache.get(pngFilename);
  if (cached) return cached;

  initLoaders();
  
  return new Promise((resolve) => {
    const path = `${TEXTURE_PATH}/${pngFilename}`;
    textureLoader!.load(
      path,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(pngFilename, texture);
        resolve(texture);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load texture: ${pngFilename}`, error);
        // 실패 시 기본 텍스처 반환
        const defaultTexture = new THREE.Texture();
        resolve(defaultTexture);
      }
    );
  });
}

// loadDDSTexture는 TextureLoader에서 제공

/**
 * OBJ 모델 로드 (MTL 없이)
 */
export async function loadObjModel(modelName: string): Promise<THREE.Group> {
  const cached = modelCache.get(modelName);
  if (cached) return cached.clone();

  initLoaders();

  return new Promise((resolve, reject) => {
    const objPath = `${OBJ_PATH}/${modelName}.obj`;
    
    objLoader!.load(
      objPath,
      (object) => {
        // 회전 조정 (Stellaris Z-up → Three.js Y-up)
        object.rotation.x = -Math.PI / 2;
        
        modelCache.set(modelName, object);
        resolve(object.clone());
      },
      (progress) => {
        // 진행률 로깅 (선택적)
      },
      (error) => {
        console.error(`Failed to load OBJ model: ${modelName}`, error);
        reject(error);
      }
    );
  });
}

/**
 * OBJ + MTL 모델 로드
 */
export async function loadObjWithMtl(modelName: string): Promise<THREE.Group> {
  const cacheKey = `${modelName}_mtl`;
  const cached = modelCache.get(cacheKey);
  if (cached) return cached.clone();

  initLoaders();

  return new Promise((resolve, reject) => {
    const mtlPath = `${OBJ_PATH}/${modelName}.mtl`;
    const objPath = `${OBJ_PATH}/${modelName}.obj`;

    mtlLoader!.load(
      `${modelName}.mtl`,
      (materials) => {
        materials.preload();
        objLoader!.setMaterials(materials);
        
        objLoader!.load(
          objPath,
          (object) => {
            object.rotation.x = -Math.PI / 2;
            
            modelCache.set(cacheKey, object);
            resolve(object.clone());
          },
          undefined,
          (error) => {
            console.warn(`Failed to load OBJ with MTL, trying OBJ only: ${modelName}`);
            // MTL 로드 실패 시 OBJ만 로드
            loadObjModel(modelName).then(resolve).catch(reject);
          }
        );
      },
      undefined,
      (error) => {
        console.warn(`MTL not found, loading OBJ only: ${modelName}`);
        loadObjModel(modelName).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * OBJ 모델에 텍스처 적용
 */
export async function loadObjWithTextures(
  modelName: string,
  textures: {
    diffuse?: string;
    normal?: string;
    specular?: string;
  }
): Promise<THREE.Group> {
  const object = await loadObjModel(modelName);
  
  // 텍스처 로드 (DDS 파일명을 받아도 PNG로 변환됨)
  const [diffuseMap, normalMap, specularMap] = await Promise.all([
    textures.diffuse ? loadTexture(textures.diffuse) : Promise.resolve(null),
    textures.normal ? loadTexture(textures.normal) : Promise.resolve(null),
    textures.specular ? loadTexture(textures.specular) : Promise.resolve(null),
  ]);

  // 모든 메쉬에 재질 적용
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap: normalMap,
        metalnessMap: specularMap,
        metalness: 0.5,
        roughness: 0.5,
      });
      child.material = material;
    }
  });

  return object;
}

/**
 * 함선 모델 로드 헬퍼 - 팩션/타입으로 자동 텍스처 매핑
 */
export async function loadShipModel(
  modelId: string,
  options?: {
    useTextures?: boolean;
    color?: number;
  }
): Promise<THREE.Group> {
  const { useTextures = true, color } = options || {};
  
  // 텍스처 파일명 추측
  const baseName = modelId.replace('.obj', '');
  const textures = {
    diffuse: `${baseName}_diffuse.dds`,
    normal: `${baseName}_normal.dds`,
    specular: `${baseName}_specular.dds`,
  };

  try {
    if (useTextures) {
      return await loadObjWithTextures(baseName, textures);
    } else {
      const object = await loadObjModel(baseName);
      
      // 단색 재질 적용
      if (color !== undefined) {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color,
              metalness: 0.7,
              roughness: 0.3,
            });
          }
        });
      }
      
      return object;
    }
  } catch (error) {
    console.error(`Failed to load ship model: ${modelId}`, error);
    // 실패 시 기본 박스 반환
    const geometry = new THREE.BoxGeometry(1, 1, 2);
    const material = new THREE.MeshStandardMaterial({ color: color || 0x666666 });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    group.add(mesh);
    return group;
  }
}

/**
 * 모델 캐시 클리어
 */
export function clearModelCache(): void {
  modelCache.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  });
  modelCache.clear();
}

/**
 * 텍스처 캐시 클리어
 */
export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
}

/**
 * 전체 캐시 클리어
 */
export function clearAllCache(): void {
  clearModelCache();
  clearTextureCache();
}

export { OBJ_PATH, TEXTURE_PATH, BASE_PATH };

