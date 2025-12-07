/**
 * Sins of a Solar Empire 2 .mesh 파일 파서
 * 
 * .mesh 파일을 파싱하여 Three.js BufferGeometry로 변환
 */

import * as THREE from 'three';

export interface ParsedVertex {
  position: [number, number, number];
  normal: [number, number, number];
  tangent: [number, number, number];
  color: number;
  uv: [number, number];
}

export interface ParsedTriangle {
  v0: number;
  v1: number;
  v2: number;
  material: number;
}

export interface ParsedPoint {
  dataString: string;
  position: [number, number, number];
}

export interface ParsedMaterial {
  diffuseTexture: string;
  normalTexture: string;
  selfIlluminationTexture: string;
}

export interface ParsedMesh {
  boundingRadius: number;
  maxExtents: [number, number, number];
  minExtents: [number, number, number];
  materials: ParsedMaterial[];
  points: ParsedPoint[];
  vertices: ParsedVertex[];
  triangles: ParsedTriangle[];
}

/**
 * .mesh 파일 텍스트를 파싱
 */
export function parseSoSE2Mesh(meshText: string): ParsedMesh {
  const lines = meshText.split(/\r?\n/);
  
  const result: ParsedMesh = {
    boundingRadius: 0,
    maxExtents: [0, 0, 0],
    minExtents: [0, 0, 0],
    materials: [],
    points: [],
    vertices: [],
    triangles: [],
  };

  let i = 0;
  
  const skipWhitespace = () => {
    while (i < lines.length && lines[i].trim() === '') i++;
  };
  
  const currentLine = () => lines[i]?.trim() || '';
  
  const parseVector3 = (str: string): [number, number, number] => {
    const match = str.match(/\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/);
    if (!match) return [0, 0, 0];
    return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
  };
  
  const parseValue = (line: string): string => {
    const parts = line.split(/\s+/);
    return parts.slice(1).join(' ').replace(/"/g, '');
  };

  while (i < lines.length) {
    const line = currentLine();
    
    if (line.startsWith('BoundingRadius')) {
      result.boundingRadius = parseFloat(parseValue(line));
    } else if (line.startsWith('MaxBoundingExtents')) {
      result.maxExtents = parseVector3(line);
    } else if (line.startsWith('MinBoundingExtents')) {
      result.minExtents = parseVector3(line);
    } else if (line.startsWith('NumMaterials')) {
      // 재질 파싱은 간략히 처리
    } else if (line.startsWith('Material') && !line.includes('Num')) {
      const mat: ParsedMaterial = {
        diffuseTexture: '',
        normalTexture: '',
        selfIlluminationTexture: '',
      };
      i++;
      while (i < lines.length && !currentLine().startsWith('Num') && !currentLine().startsWith('Point')) {
        const matLine = currentLine();
        if (matLine.startsWith('DiffuseTextureFileName')) {
          mat.diffuseTexture = parseValue(matLine);
        } else if (matLine.startsWith('NormalTextureFileName')) {
          mat.normalTexture = parseValue(matLine);
        } else if (matLine.startsWith('SelfIlluminationTextureFileName')) {
          mat.selfIlluminationTexture = parseValue(matLine);
        }
        i++;
      }
      result.materials.push(mat);
      continue;
    } else if (line === 'Point') {
      const point: ParsedPoint = {
        dataString: '',
        position: [0, 0, 0],
      };
      i++;
      while (i < lines.length && currentLine() !== 'Point' && !currentLine().startsWith('Num')) {
        const pointLine = currentLine();
        if (pointLine.startsWith('DataString')) {
          point.dataString = parseValue(pointLine);
        } else if (pointLine.startsWith('Position')) {
          point.position = parseVector3(pointLine);
        }
        i++;
        if (currentLine().startsWith('Orientation')) {
          // orientation 3줄 스킵
          i += 3;
        }
      }
      result.points.push(point);
      continue;
    } else if (line.startsWith('NumVertices')) {
      const numVertices = parseInt(parseValue(line));
      i++;
      
      for (let v = 0; v < numVertices && i < lines.length; v++) {
        if (currentLine() === 'Vertex') {
          i++;
          const vertex: ParsedVertex = {
            position: [0, 0, 0],
            normal: [0, 0, 0],
            tangent: [0, 0, 0],
            color: 0,
            uv: [0, 0],
          };
          
          while (i < lines.length && currentLine() !== 'Vertex' && !currentLine().startsWith('Num')) {
            const vLine = currentLine();
            if (vLine.startsWith('Position')) {
              vertex.position = parseVector3(vLine);
            } else if (vLine.startsWith('Normal')) {
              vertex.normal = parseVector3(vLine);
            } else if (vLine.startsWith('Tangent')) {
              vertex.tangent = parseVector3(vLine);
            } else if (vLine.startsWith('Color')) {
              vertex.color = parseInt(parseValue(vLine));
            } else if (vLine.startsWith('U0')) {
              vertex.uv[0] = parseFloat(parseValue(vLine));
            } else if (vLine.startsWith('V0')) {
              vertex.uv[1] = parseFloat(parseValue(vLine));
            }
            i++;
          }
          
          result.vertices.push(vertex);
        } else {
          i++;
        }
      }
      continue;
    } else if (line.startsWith('NumTriangles')) {
      const numTriangles = parseInt(parseValue(line));
      i++;
      
      for (let t = 0; t < numTriangles && i < lines.length; t++) {
        if (currentLine() === 'Triangle') {
          i++;
          const tri: ParsedTriangle = {
            v0: 0,
            v1: 0,
            v2: 0,
            material: 0,
          };
          
          while (i < lines.length && currentLine() !== 'Triangle' && !currentLine().startsWith('Num')) {
            const tLine = currentLine();
            if (tLine.startsWith('iVertex0')) {
              tri.v0 = parseInt(parseValue(tLine));
            } else if (tLine.startsWith('iVertex1')) {
              tri.v1 = parseInt(parseValue(tLine));
            } else if (tLine.startsWith('iVertex2')) {
              tri.v2 = parseInt(parseValue(tLine));
            } else if (tLine.startsWith('iMaterial')) {
              tri.material = parseInt(parseValue(tLine));
            }
            i++;
          }
          
          result.triangles.push(tri);
        } else {
          i++;
        }
      }
      continue;
    }
    
    i++;
  }
  
  return result;
}

/**
 * 파싱된 메쉬를 Three.js BufferGeometry로 변환
 */
export function createBufferGeometry(parsed: ParsedMesh): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // 버텍스 데이터 준비
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  
  // 인덱스 기반으로 버텍스 데이터 펼치기
  // X좌표 반전으로 DirectX→OpenGL 좌표계 변환
  for (const tri of parsed.triangles) {
    const v0 = parsed.vertices[tri.v0];
    const v1 = parsed.vertices[tri.v1];
    const v2 = parsed.vertices[tri.v2];
    
    if (!v0 || !v1 || !v2) continue;
    
    // v0 (X좌표 반전)
    positions.push(-v0.position[0], v0.position[1], v0.position[2]);
    normals.push(-v0.normal[0], v0.normal[1], v0.normal[2]);
    uvs.push(v0.uv[0], v0.uv[1]);
    
    // v1 (X좌표 반전)
    positions.push(-v1.position[0], v1.position[1], v1.position[2]);
    normals.push(-v1.normal[0], v1.normal[1], v1.normal[2]);
    uvs.push(v1.uv[0], v1.uv[1]);
    
    // v2 (X좌표 반전)
    positions.push(-v2.position[0], v2.position[1], v2.position[2]);
    normals.push(-v2.normal[0], v2.normal[1], v2.normal[2]);
    uvs.push(v2.uv[0], v2.uv[1]);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  
  geometry.computeBoundingSphere();
  
  return geometry;
}

/**
 * 인덱스를 사용한 최적화된 BufferGeometry 생성
 */
export function createIndexedBufferGeometry(parsed: ParsedMesh): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // 버텍스 데이터 (X좌표 반전으로 DirectX→OpenGL 좌표계 변환)
  const positions = new Float32Array(parsed.vertices.length * 3);
  const normals = new Float32Array(parsed.vertices.length * 3);
  const uvs = new Float32Array(parsed.vertices.length * 2);
  
  for (let i = 0; i < parsed.vertices.length; i++) {
    const v = parsed.vertices[i];
    positions[i * 3] = -v.position[0]; // X 반전
    positions[i * 3 + 1] = v.position[1];
    positions[i * 3 + 2] = v.position[2];
    
    normals[i * 3] = -v.normal[0]; // X 반전
    normals[i * 3 + 1] = v.normal[1];
    normals[i * 3 + 2] = v.normal[2];
    
    // UV 원본
    uvs[i * 2] = v.uv[0];
    uvs[i * 2 + 1] = v.uv[1];
  }
  
  // 인덱스 데이터 (원본 순서 유지)
  const indices = new Uint32Array(parsed.triangles.length * 3);
  for (let i = 0; i < parsed.triangles.length; i++) {
    const t = parsed.triangles[i];
    indices[i * 3] = t.v0;
    indices[i * 3 + 1] = t.v1;
    indices[i * 3 + 2] = t.v2;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  
  geometry.computeBoundingSphere();
  
  return geometry;
}

/**
 * 무기/엔진 포인트 추출
 */
export function extractWeaponPoints(parsed: ParsedMesh): ParsedPoint[] {
  return parsed.points.filter(p => p.dataString.startsWith('Weapon'));
}

export function extractExhaustPoints(parsed: ParsedMesh): ParsedPoint[] {
  return parsed.points.filter(p => p.dataString === 'Exhaust');
}

