/**
 * Portrait Cropper Component
 * HOI4 스타일 26:35 비율 포트레잇 크롭 UI
 */

import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

interface PortraitCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

const PORTRAIT_ASPECT = 26 / 35; // 0.742857...

export const PortraitCropper: React.FC<PortraitCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = new Image();
      image.src = imageSrc;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // HOI4 스타일 크기로 설정
      canvas.width = 156;
      canvas.height = 210;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        156,
        210
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/png', 0.9);
    } catch (error) {
      console.error('Error creating cropped image:', error);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-4">
          포트레잇 크롭 (26:35 비율)
        </h2>
        
        <div className="relative w-full h-96 bg-black rounded">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={PORTRAIT_ASPECT}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="rect"
            showGrid={true}
            style={{
              containerStyle: {
                borderRadius: '0.5rem'
              }
            }}
          />
        </div>

        <div className="mt-4">
          <label className="text-white text-sm mb-2 block">확대/축소</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={createCroppedImage}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            완료
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            취소
          </button>
        </div>

        <div className="mt-4 text-gray-400 text-sm">
          <p>• 최종 크기: 156 x 210 픽셀 (HOI4 스타일)</p>
          <p>• 비율: 26:35 (세로형 포트레잇)</p>
          <p>• 마우스 휠로 확대/축소 가능</p>
        </div>
      </div>
    </div>
  );
};
