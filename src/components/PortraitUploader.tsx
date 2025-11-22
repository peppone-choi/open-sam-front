/**
 * Portrait Uploader Component
 * 포트레잇 업로드 및 크롭 통합 컴포넌트
 */

import React, { useState, useCallback } from 'react';
import PortraitCropper from './PortraitCropper';
import { COMMON_TEXT, PORTRAIT_TEXT } from '@/constants/uiText';

interface PortraitUploaderProps {
  generalId: number;
  sessionId: string;
  currentPortrait?: string;
  onUploadSuccess: (portraitUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export const PortraitUploader: React.FC<PortraitUploaderProps> = ({
  generalId,
  sessionId,
  currentPortrait,
  onUploadSuccess,
  onUploadError
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const onCropComplete = useCallback(async (croppedBlob: Blob) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('portrait', croppedBlob, 'portrait.png');
      formData.append('generalId', generalId.toString());
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/portraits/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(PORTRAIT_TEXT.uploadFailed);
      }

      const data = await response.json();
      onUploadSuccess(data.portraitUrl);
      setImageSrc(null);
    } catch (error: any) {
      console.error(`${PORTRAIT_TEXT.uploadErrorLog}:`, error);
      onUploadError?.(PORTRAIT_TEXT.uploadFailed);
    } finally {
      setUploading(false);
    }
  }, [generalId, sessionId, onUploadSuccess, onUploadError]);

  const onCropCancel = useCallback(() => {
    setImageSrc(null);
  }, []);

  return (
    <div>
      {imageSrc ? (
        <PortraitCropper
          imageSrc={imageSrc}
          onCropComplete={onCropComplete}
          onCancel={onCropCancel}
        />
      ) : (
        <div className="flex flex-col items-center">
          {currentPortrait && (
            <div className="mb-4">
              <img
                src={currentPortrait}
                alt={COMMON_TEXT.characterAlt}
                className="w-[156px] h-[210px] object-cover rounded border-2 border-gray-600"
              />
            </div>
          )}
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded inline-flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
            </svg>
            <span>포트레잇 업로드</span>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              disabled={uploading}
            />
          </label>
          
          <p className="mt-2 text-sm text-gray-500">
            156x210px (26:35 비율)로 자동 변환됩니다
          </p>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">업로드 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};
