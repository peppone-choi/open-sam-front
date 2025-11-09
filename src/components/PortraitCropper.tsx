/**
 * Portrait Cropper Component
 * 초상화 이미지 크롭
 * 
 * NOTE: react-easy-crop 의존성 미설치로 임시 비활성화
 */

import React from 'react';

interface PortraitCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

/**
 * 임시 구현 - react-easy-crop 설치 후 정상 구현 예정
 */
export default function PortraitCropper({ imageSrc, onCropComplete, onCancel }: PortraitCropperProps) {
  return (
    <div className="portrait-cropper">
      <div className="text-center p-4">
        <p>이미지 크롭 기능은 준비중입니다.</p>
        <p className="text-sm text-gray-500 mt-2">(react-easy-crop 의존성 설치 필요)</p>
        <div className="mt-4 flex gap-2 justify-center">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
