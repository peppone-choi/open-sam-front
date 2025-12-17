'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';
import { useToast } from '@/contexts/ToastContext';

export default function IconManagePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentIcon, setCurrentIcon] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCurrentIcon();
  }, []);

  async function loadCurrentIcon() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetUserInfo();
      if (result.result) {
        setCurrentIcon(result.icon || null);
      }
    } catch (err) {
      console.error(err);
      showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 업로드 가능합니다.', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('파일 크기는 5MB 이하여야 합니다.', 'warning');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      showToast('파일을 선택해주세요.', 'warning');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('icon', selectedFile);

      const response = await fetch('/api/user/upload-icon', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (result.result) {
        showToast('전용 아이콘이 업로드되었습니다.', 'success');
        setCurrentIcon(result.url);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        showToast(result.reason || '업로드에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="전용 아이콘 관리" backUrl="/entrance" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>현재 전용 아이콘</h2>
            <div className={styles.currentIcon}>
              {currentIcon ? (
                <img src={currentIcon} alt="현재 전용 아이콘" className={styles.iconImage} />
              ) : (
                <div className={styles.noIcon}>등록된 전용 아이콘이 없습니다.</div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>새 전용 아이콘 업로드</h2>
            <div className={styles.uploadInfo}>
              <p className={styles.infoText}>
                권장 크기: <strong>156 x 210 픽셀</strong>
              </p>
              <p className={styles.infoText}>
                최대 파일 크기: 5MB
              </p>
              <p className={styles.infoText}>
                지원 형식: JPG, PNG, GIF
              </p>
            </div>

            <div className={styles.uploadArea}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="iconFileInput"
              />
              <label htmlFor="iconFileInput" className={styles.fileLabel}>
                파일 선택
              </label>
            </div>

            {previewUrl && (
              <div className={styles.previewSection}>
                <h3 className={styles.previewTitle}>미리보기</h3>
                <div className={styles.previewContainer}>
                  <img src={previewUrl} alt="미리보기" className={styles.previewImage} />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={styles.uploadButton}
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
