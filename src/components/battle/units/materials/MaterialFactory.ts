import {
  MeshStandardMaterial,
  Color,
  Texture,
  CanvasTexture,
} from 'three';

// ===== 텍스처 생성기 (Canvas API) =====
function createProceduralTexture(
  baseColor: string, 
  type: 'metal' | 'fabric' | 'skin' | 'leather' | 'wood' | 'gold' | 'rust'
): Texture {
  // 서버 사이드 렌더링 시 Canvas 사용 불가 방어 코드
  if (typeof document === 'undefined') {
    return new Texture();
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return new Texture();

  // 1. 베이스 컬러
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // 2. 노이즈 & 질감 추가
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  let noiseIntensity = 20;
  
  switch(type) {
    case 'metal': noiseIntensity = 30; break;
    case 'leather': noiseIntensity = 40; break;
    case 'wood': noiseIntensity = 25; break;
    case 'fabric': noiseIntensity = 15; break;
    case 'skin': noiseIntensity = 10; break;
    case 'gold': noiseIntensity = 20; break;
    case 'rust': noiseIntensity = 50; break;
  }

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * noiseIntensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // 3. 특수 패턴 추가
  // 금속/가죽: 스크래치
  if (type === 'metal' || type === 'leather' || type === 'gold') {
    ctx.strokeStyle = (type === 'metal' || type === 'gold') 
      ? 'rgba(255,255,255,0.3)' 
      : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50);
      ctx.stroke();
    }
  }

  // 나무: 나이테/결
  if (type === 'wood') {
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < size; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(i + 20, size/3, i - 20, size*2/3, i, size);
      ctx.stroke();
    }
  }

  // 천: 격자무늬
  if (type === 'fabric') {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < size; i += 4) {
      ctx.fillRect(i, 0, 1, size);
      ctx.fillRect(0, i, size, 1);
    }
  }

  // 녹슨 금속: 얼룩
  if (type === 'rust') {
    ctx.fillStyle = 'rgba(100, 50, 20, 0.4)';
    for (let i = 0; i < 20; i++) {
      const r = Math.random() * 30 + 10;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new CanvasTexture(canvas);
  return texture;
}

// ===== 재질 캐시 및 팩토리 =====
const materialCache: Record<string, MeshStandardMaterial> = {};

export const MaterialFactory = {
  get: (color: string, type: 'metal' | 'fabric' | 'skin' | 'leather' | 'wood' | 'gold' | 'rust'): MeshStandardMaterial => {
    const key = `${color}-${type}`;
    if (materialCache[key]) return materialCache[key];

    const texture = createProceduralTexture(color, type);
    
    let roughness = 0.8;
    let metalness = 0.0;

    switch(type) {
      case 'metal':
        roughness = 0.5;
        metalness = 0.8;
        break;
      case 'gold':
        roughness = 0.3;
        metalness = 1.0;
        break;
      case 'leather':
        roughness = 0.7;
        metalness = 0.1;
        break;
      case 'skin':
        roughness = 0.9;
        metalness = 0.0;
        break;
      case 'wood':
        roughness = 0.9;
        metalness = 0.0;
        break;
      case 'rust':
        roughness = 1.0;
        metalness = 0.2;
        break;
    }

    const mat = new MeshStandardMaterial({
      map: texture,
      color: new Color(color),
      roughness,
      metalness,
    });

    materialCache[key] = mat;
    return mat;
  },
  
  // 자주 쓰는 색상 프리셋
  PRESETS: {
    SKIN: '#dcb898',
    IRON: '#5a5a5a',
    STEEL: '#7a7a7a',
    DARK_IRON: '#2a2a2a',
    GOLD: '#ffd700',
    LEATHER_BROWN: '#4a3b2a',
    LEATHER_BLACK: '#1a1a1a',
    WOOD: '#5c4033',
    WOOD_DARK: '#3d2b1f',
    RUST: '#8b4513',
    BAMBOO: '#d4c4a8',
    YELLOW_TURBAN: '#eab308',
    RED_TASSEL: '#dc2626',
  }
};
