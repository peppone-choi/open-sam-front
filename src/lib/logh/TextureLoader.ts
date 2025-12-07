/**
 * LOGH 텍스처 로더
 * 
 * DDS 텍스처를 로드하고 Three.js 텍스처로 변환
 * PNG/WebP 폴백 지원
 */

import * as THREE from 'three';

// DDS 파일 매직 넘버
const DDS_MAGIC = 0x20534444; // "DDS "

// DDS 픽셀 포맷 플래그
const DDPF_ALPHAPIXELS = 0x1;
const DDPF_FOURCC = 0x4;
const DDPF_RGB = 0x40;

// FourCC 코드
const FOURCC_DXT1 = 0x31545844; // "DXT1"
const FOURCC_DXT3 = 0x33545844; // "DXT3"
const FOURCC_DXT5 = 0x35545844; // "DXT5"

interface DDSHeader {
  magic: number;
  size: number;
  flags: number;
  height: number;
  width: number;
  pitchOrLinearSize: number;
  depth: number;
  mipmapCount: number;
  format: {
    size: number;
    flags: number;
    fourCC: number;
    rgbBitCount: number;
    rMask: number;
    gMask: number;
    bMask: number;
    aMask: number;
  };
}

/**
 * DDS 파일 헤더 파싱
 */
function parseDDSHeader(buffer: ArrayBuffer): DDSHeader | null {
  const view = new DataView(buffer);
  
  const magic = view.getUint32(0, true);
  if (magic !== DDS_MAGIC) {
    console.warn('Not a valid DDS file');
    return null;
  }
  
  return {
    magic,
    size: view.getUint32(4, true),
    flags: view.getUint32(8, true),
    height: view.getUint32(12, true),
    width: view.getUint32(16, true),
    pitchOrLinearSize: view.getUint32(20, true),
    depth: view.getUint32(24, true),
    mipmapCount: Math.max(1, view.getUint32(28, true)),
    format: {
      size: view.getUint32(76, true),
      flags: view.getUint32(80, true),
      fourCC: view.getUint32(84, true),
      rgbBitCount: view.getUint32(88, true),
      rMask: view.getUint32(92, true),
      gMask: view.getUint32(96, true),
      bMask: view.getUint32(100, true),
      aMask: view.getUint32(104, true),
    },
  };
}

/**
 * DDS를 RGBA 데이터로 디코딩 (DXT1/DXT3/DXT5)
 */
function decodeDXT(buffer: ArrayBuffer, header: DDSHeader): Uint8Array | null {
  const width = header.width;
  const height = header.height;
  const fourCC = header.format.fourCC;
  
  // 헤더 크기: magic(4) + header(124) = 128 bytes
  const dataOffset = 128;
  const data = new Uint8Array(buffer, dataOffset);
  
  const output = new Uint8Array(width * height * 4);
  
  const blockWidth = Math.max(1, Math.floor((width + 3) / 4));
  const blockHeight = Math.max(1, Math.floor((height + 3) / 4));
  
  let blockSize: number;
  let decompressBlock: (block: Uint8Array, output: Uint8Array, outOffset: number, stride: number) => void;
  
  if (fourCC === FOURCC_DXT1) {
    blockSize = 8;
    decompressBlock = decompressDXT1Block;
  } else if (fourCC === FOURCC_DXT3) {
    blockSize = 16;
    decompressBlock = decompressDXT3Block;
  } else if (fourCC === FOURCC_DXT5) {
    blockSize = 16;
    decompressBlock = decompressDXT5Block;
  } else {
    console.warn('Unsupported DDS format:', fourCC.toString(16));
    return null;
  }
  
  for (let by = 0; by < blockHeight; by++) {
    for (let bx = 0; bx < blockWidth; bx++) {
      const blockIndex = (by * blockWidth + bx) * blockSize;
      const block = data.subarray(blockIndex, blockIndex + blockSize);
      
      const outX = bx * 4;
      const outY = by * 4;
      
      for (let py = 0; py < 4 && outY + py < height; py++) {
        for (let px = 0; px < 4 && outX + px < width; px++) {
          const outOffset = ((outY + py) * width + (outX + px)) * 4;
          decompressBlock(block, output, outOffset, py * 4 + px);
        }
      }
    }
  }
  
  return output;
}

// DXT1 블록 디코딩
function decompressDXT1Block(block: Uint8Array, output: Uint8Array, outOffset: number, pixelIndex: number): void {
  const c0 = block[0] | (block[1] << 8);
  const c1 = block[2] | (block[3] << 8);
  
  const r0 = ((c0 >> 11) & 0x1f) * 255 / 31;
  const g0 = ((c0 >> 5) & 0x3f) * 255 / 63;
  const b0 = (c0 & 0x1f) * 255 / 31;
  
  const r1 = ((c1 >> 11) & 0x1f) * 255 / 31;
  const g1 = ((c1 >> 5) & 0x3f) * 255 / 63;
  const b1 = (c1 & 0x1f) * 255 / 31;
  
  const codes = block[4] | (block[5] << 8) | (block[6] << 16) | (block[7] << 24);
  const code = (codes >> (pixelIndex * 2)) & 0x3;
  
  let r: number, g: number, b: number, a = 255;
  
  if (c0 > c1) {
    switch (code) {
      case 0: r = r0; g = g0; b = b0; break;
      case 1: r = r1; g = g1; b = b1; break;
      case 2: r = (2 * r0 + r1) / 3; g = (2 * g0 + g1) / 3; b = (2 * b0 + b1) / 3; break;
      case 3: r = (r0 + 2 * r1) / 3; g = (g0 + 2 * g1) / 3; b = (b0 + 2 * b1) / 3; break;
      default: r = g = b = 0;
    }
  } else {
    switch (code) {
      case 0: r = r0; g = g0; b = b0; break;
      case 1: r = r1; g = g1; b = b1; break;
      case 2: r = (r0 + r1) / 2; g = (g0 + g1) / 2; b = (b0 + b1) / 2; break;
      case 3: r = g = b = 0; a = 0; break;
      default: r = g = b = 0;
    }
  }
  
  output[outOffset] = r;
  output[outOffset + 1] = g;
  output[outOffset + 2] = b;
  output[outOffset + 3] = a;
}

// DXT3 블록 디코딩
function decompressDXT3Block(block: Uint8Array, output: Uint8Array, outOffset: number, pixelIndex: number): void {
  // 알파는 처음 8바이트
  const alphaIndex = Math.floor(pixelIndex / 2);
  const alphaShift = (pixelIndex % 2) * 4;
  const alpha = ((block[alphaIndex] >> alphaShift) & 0xf) * 17;
  
  // 컬러는 DXT1과 동일 (8바이트 오프셋)
  const colorBlock = block.subarray(8);
  decompressDXT1Block(colorBlock, output, outOffset, pixelIndex);
  output[outOffset + 3] = alpha;
}

// DXT5 블록 디코딩
function decompressDXT5Block(block: Uint8Array, output: Uint8Array, outOffset: number, pixelIndex: number): void {
  const a0 = block[0];
  const a1 = block[1];
  
  // 알파 인덱스 (48비트 = 6바이트)
  const alphaIndices = block[2] | (block[3] << 8) | (block[4] << 16) |
                       (block[5] << 24) | ((block[6] | (block[7] << 8)) * 0x100000000);
  const alphaCode = (alphaIndices >> (pixelIndex * 3)) & 0x7;
  
  let alpha: number;
  if (a0 > a1) {
    switch (alphaCode) {
      case 0: alpha = a0; break;
      case 1: alpha = a1; break;
      case 2: alpha = (6 * a0 + 1 * a1) / 7; break;
      case 3: alpha = (5 * a0 + 2 * a1) / 7; break;
      case 4: alpha = (4 * a0 + 3 * a1) / 7; break;
      case 5: alpha = (3 * a0 + 4 * a1) / 7; break;
      case 6: alpha = (2 * a0 + 5 * a1) / 7; break;
      case 7: alpha = (1 * a0 + 6 * a1) / 7; break;
      default: alpha = 0;
    }
  } else {
    switch (alphaCode) {
      case 0: alpha = a0; break;
      case 1: alpha = a1; break;
      case 2: alpha = (4 * a0 + 1 * a1) / 5; break;
      case 3: alpha = (3 * a0 + 2 * a1) / 5; break;
      case 4: alpha = (2 * a0 + 3 * a1) / 5; break;
      case 5: alpha = (1 * a0 + 4 * a1) / 5; break;
      case 6: alpha = 0; break;
      case 7: alpha = 255; break;
      default: alpha = 0;
    }
  }
  
  // 컬러는 DXT1과 동일 (8바이트 오프셋)
  const colorBlock = block.subarray(8);
  decompressDXT1Block(colorBlock, output, outOffset, pixelIndex);
  output[outOffset + 3] = alpha;
}

/**
 * 비압축 RGBA DDS 디코딩
 */
function decodeUncompressedRGBA(buffer: ArrayBuffer, header: DDSHeader): Uint8Array | null {
  const width = header.width;
  const height = header.height;
  const bitCount = header.format.rgbBitCount;
  
  if (bitCount !== 32) {
    console.warn('Unsupported bit count:', bitCount);
    return null;
  }
  
  const dataOffset = 128;
  const data = new Uint8Array(buffer, dataOffset);
  const output = new Uint8Array(width * height * 4);
  
  // BGRA -> RGBA 변환 (일반적인 DDS 비압축 포맷)
  for (let i = 0; i < width * height; i++) {
    const srcOffset = i * 4;
    const dstOffset = i * 4;
    
    // DDS는 보통 BGRA 순서
    output[dstOffset + 0] = data[srcOffset + 2]; // R <- B
    output[dstOffset + 1] = data[srcOffset + 1]; // G <- G
    output[dstOffset + 2] = data[srcOffset + 0]; // B <- R
    output[dstOffset + 3] = data[srcOffset + 3]; // A <- A
  }
  
  return output;
}

/**
 * DDS ArrayBuffer를 Three.js 텍스처로 변환
 */
export function loadDDSTexture(buffer: ArrayBuffer): THREE.DataTexture | null {
  const header = parseDDSHeader(buffer);
  if (!header) return null;
  
  let rgbaData: Uint8Array | null = null;
  
  // 압축 포맷 (DXT) 또는 비압축 포맷 구분
  const formatFlags = header.format.flags;
  
  if (formatFlags & DDPF_FOURCC) {
    // DXT 압축 포맷
    rgbaData = decodeDXT(buffer, header);
  } else if (formatFlags & DDPF_RGB) {
    // 비압축 RGB/RGBA 포맷
    rgbaData = decodeUncompressedRGBA(buffer, header);
  } else {
    console.warn('Unknown DDS format flags:', formatFlags.toString(16));
    return null;
  }
  
  if (!rgbaData) return null;
  
  const texture = new THREE.DataTexture(
    rgbaData,
    header.width,
    header.height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  
  // 기본은 선형 색상 공간 (노말맵, 데이터 텍스처 등에 적합)
  // diffuse 텍스처는 로드 후 별도로 sRGB 설정 필요
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.needsUpdate = true;
  texture.flipY = false; // flip 없음
  
  return texture;
}

/**
 * URL에서 DDS 텍스처 로드
 */
export async function loadDDSTextureFromUrl(url: string): Promise<THREE.DataTexture | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${url}`);
    
    const buffer = await response.arrayBuffer();
    return loadDDSTexture(buffer);
  } catch (error) {
    console.error('Failed to load DDS texture:', error);
    return null;
  }
}

/**
 * PNG 폴백과 함께 텍스처 로드
 */
export async function loadTextureWithFallback(
  ddsUrl: string,
  pngFallbackUrl?: string
): Promise<THREE.Texture | null> {
  // 먼저 DDS 시도
  const ddsTexture = await loadDDSTextureFromUrl(ddsUrl);
  if (ddsTexture) return ddsTexture;
  
  // PNG 폴백
  if (pngFallbackUrl) {
    const loader = new THREE.TextureLoader();
    try {
      return await loader.loadAsync(pngFallbackUrl);
    } catch (error) {
      console.error('Failed to load fallback PNG:', error);
    }
  }
  
  return null;
}

/**
 * 함선 텍스처 세트 로드 (diffuse, bump, data)
 */
export interface ShipTextureSet {
  diffuse: THREE.Texture | null;
  bump: THREE.Texture | null;
  data: THREE.Texture | null;
}

export async function loadShipTextures(
  basePath: string,
  textures: { diffuse: string; bump?: string; data?: string }
): Promise<ShipTextureSet> {
  const [diffuse, bump, data] = await Promise.all([
    loadDDSTextureFromUrl(`${basePath}/${textures.diffuse}`),
    textures.bump ? loadDDSTextureFromUrl(`${basePath}/${textures.bump}`) : Promise.resolve(null),
    textures.data ? loadDDSTextureFromUrl(`${basePath}/${textures.data}`) : Promise.resolve(null),
  ]);
  
  return { diffuse, bump, data };
}

