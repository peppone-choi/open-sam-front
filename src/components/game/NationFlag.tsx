'use client';

import React, { useEffect, useRef, useState } from 'react';

interface NationFlagProps {
  color?: string;  // 국가 색상 (hex, 예: #dc143c)
  size?: number;   // 크기 (기본값: 48)
  animate?: boolean; // 애니메이션 여부 (기본값: true)
  className?: string;
}

// 깃대 이미지 (base64)
const POLE_DATA = 'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAASklEQVR4nGNggAJjBob/DEQAJmTO68vbCWpiIqQArwYehrvEaTBmYPh/5PIU0m3g1M1hJEkDyTbQBhAbYTAAdxLRGo0ZGP6TYgsAtYYOaLJ2oiQAAAAASUVORK5CYII=';

// 깃발 애니메이션 프레임 (base64)
const FLAG_FRAMES = [
  'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAoUlEQVR4nJ2RsQ0DIQxFPyg7UCMxgYdhJxqmYAsWoDkmQHLNFE4RGV3IXSLlN1jmv2+QgZOISPCPiEgU1rqUch12NuhZa10BZgdKKeKcg/cezLz63nuEEMxjB5xzb6Z9ut0bV0ZVSgl2b96ZVR/AN805YYlIRER+7aC1hpwzbO/dAMBxHOsCAJh51THGBRrg9VkFxxiiabvUA4REZC3s7mlPURhah4G0TjkAAAAASUVORK5CYII=',
  'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAqklEQVR4nJWRwQ2EMAwEh+skLfhFJfREH7xogQb4QAVGeaeKvQcyCuGEdH451o692kBVZib+LTPTG9i1A3cXwDAMAOz73r0CknQcx/UOEGAcx+dJd9eyLHJ3mZncXTEzM31a/wApJXLOzPMMQM750tyAulJKD/FPoBUEXEo5ATOTpFuUAdVw3/cnELFt2/bYBlBKYV1XoIq43h7JTNOktr/5DGvRhyD6+NAvWQV9+3e+cyQAAAAASUVORK5CYII=',
  'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAnklEQVR4nJWRsQ2FMAxEz2zCCpcmc7lhi0xBxQpZIE0yAVJqpjAFCoL8jwRX2bKf7mQDF5E0fNVnKMZoJO01uK6rxRitgf18+AeN4wgAUFX0bnJdJGnLstzgWiu2bUMI4dmhd/PeQ1XfAU3e+wMgaWb26iqqiqGUIgCQcz4zPymEcERyzkFEpJQi0zSh1voDppTudIvWapI2z/P5xNbvhIlYf3izhV4AAAAASUVORK5CYII=',
  'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAqklEQVR4nJWRwQ2EMAwEh+skLfhFJfREH7xogQb4QAVGeaeKvQcyCuGEdH451o692kBVZib+LTPTG9i1A3cXwDAMAOz73r0CknQcx/UOEGAcx+dJd9eyLHJ3mZncXTEzM31a/wApJXLOzPMMQM750tyAulJKD/FPoBUEXEo5ATOTpFuUAdVw3/cnELFt2/bYBlBKYV1XoIq43h7JTNOktr/5DGvRhyD6+NAvWQV9+3e+cyQAAAAASUVORK5CYII='
];

export default function NationFlag({ 
  color = '#FFFFFF',  // 기본값: 흰색 (공백지)
  size = 48, 
  animate = true,
  className = ''
}: NationFlagProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const poleImgRef = useRef<HTMLImageElement | null>(null);
  const flagFramesRef = useRef<HTMLImageElement[]>([]);

  // 이미지 로드
  useEffect(() => {
    const poleImg = new Image();
    poleImg.src = 'data:image/png;base64,' + POLE_DATA;
    poleImgRef.current = poleImg;

    const flagFrames = FLAG_FRAMES.map(data => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + data;
      return img;
    });
    flagFramesRef.current = flagFrames;

    let loadedCount = 0;
    const totalImages = 1 + flagFrames.length;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        setImagesLoaded(true);
      }
    };

    poleImg.onload = checkLoaded;
    flagFrames.forEach(img => {
      img.onload = checkLoaded;
    });

    return () => {
      poleImg.onload = null;
      flagFrames.forEach(img => {
        img.onload = null;
      });
    };
  }, []);

  // Hex to RGB 변환
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 128, g: 128, b: 128 };
  };

  // 깃발 그리기
  const drawFlag = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = 12;
    const height = 12;

    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);

    // 임시 캔버스에 먼저 그리기
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    // 1. 깃대 그리기
    if (poleImgRef.current) {
      tempCtx.drawImage(poleImgRef.current, 0, 0);
    }

    // 2. 현재 프레임의 깃발 그리기
    if (flagFramesRef.current[currentFrame]) {
      tempCtx.drawImage(flagFramesRef.current[currentFrame], 0, 0);
    }

    // 3. 픽셀 데이터 가져오기
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const targetColor = hexToRgb(color);

    // 4. 회색 픽셀을 색상으로 변경
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // 회색조 픽셀 감지 (깃발 부분)
      if (a > 0 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30 && r > 100) {
        // 밝기 비율
        const brightness = r / 255;

        // 색상 적용
        data[i] = targetColor.r * brightness;
        data[i + 1] = targetColor.g * brightness;
        data[i + 2] = targetColor.b * brightness;
      }
    }

    // 5. 최종 캔버스에 그리기
    ctx.putImageData(imageData, 0, 0);
  };

  // 색상이나 프레임 변경 시 다시 그리기
  useEffect(() => {
    if (imagesLoaded) {
      drawFlag();
    }
  }, [color, currentFrame, imagesLoaded]);

  // 애니메이션
  useEffect(() => {
    if (!animate || !imagesLoaded) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % FLAG_FRAMES.length);
    }, 1000); // 1초마다 프레임 전환

    return () => clearInterval(interval);
  }, [animate, imagesLoaded]);

  return (
    <canvas
      ref={canvasRef}
      width={12}
      height={12}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
      className={className}
    />
  );
}
