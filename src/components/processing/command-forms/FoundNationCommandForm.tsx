'use client';

import React, { useState, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface NationType {
  id?: string;
  type: string;
  name: string;
  pros?: string;
  cons?: string;
  description?: string;
}

interface FoundNationCommandFormProps {
  commandName: string;
  available건국: boolean;
  nationTypes: Record<string, NationType>;
  colors: string[];
  onSubmit: (args: { nationName: string; nationType: string; colorType: number }) => void;
  onCancel: () => void;
}

export default function FoundNationCommandForm({
  commandName,
  available건국,
  nationTypes,
  colors,
  onSubmit,
  onCancel
}: FoundNationCommandFormProps) {
  // none만 제외한 국가 성향 필터링 (neutral은 유지)
  const selectableNationTypes = useMemo(() => {
    return Object.values(nationTypes).filter(
      type => type.id !== 'none'
    );
  }, [nationTypes]);

  const [nationName, setNationName] = useState('');
  const [selectedColorID, setSelectedColorID] = useState(0);
  const [selectedNationType, setSelectedNationType] = useState(
    selectableNationTypes[0]?.id || selectableNationTypes[0]?.type || 'confucianism'
  );

  const handleSubmit = () => {
    if (!nationName.trim()) {
      alert('국명을 입력해주세요.');
      return;
    }
    if (nationName.length > 18) {
      alert('국명은 18자 이하여야 합니다.');
      return;
    }
    if (selectedColorID < 0 || selectedColorID >= colors.length) {
      alert('색상을 선택해주세요.');
      return;
    }
    if (!selectedNationType) {
      alert('국가 성향을 선택해주세요.');
      return;
    }
    
    console.log('건국 명령 제출:', {
      nationName: nationName.trim(),
      nationType: selectedNationType,
      colorType: selectedColorID
    });
    
    onSubmit({
      nationName: nationName.trim(),
      nationType: selectedNationType,
      colorType: selectedColorID
    });
  };

  if (!available건국) {
    return (
      <div className={styles.container}>
        <TopBackBar title={commandName} onBack={onCancel} />
        <div className={styles.content}>
          <div className={styles.description}>
            더 이상 건국은 불가능합니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          현재 도시에서 나라를 세웁니다. 중, 소도시에서만 가능합니다.
        </div>

        {/* 국가 성향 목록 */}
        <div className={styles.nationTypesList}>
          <h3>국가 성향</h3>
          <div className={styles.nationTypes}>
            {selectableNationTypes.map((type) => {
              const description = type.description || '';
              const parts = description.split(' / ');
              const pros = parts[0] || type.pros || '';
              const cons = parts[1] || type.cons || '';
              
              return (
                <div key={type.id || type.type} className={styles.nationTypeItem}>
                  <strong>{type.name}</strong>{(pros || cons) ? ' : ' : ''}{pros && <span style={{ color: 'cyan' }}>{pros}</span>}{pros && cons && ' / '}{cons && <span style={{ color: 'magenta' }}>{cons}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label>국명:</label>
            <input
              type="text"
              className={styles.textInput}
              value={nationName}
              onChange={(e) => setNationName(e.target.value)}
              maxLength={18}
              placeholder="국명 입력"
            />
          </div>
          <div className={styles.formField}>
            <label>색상:</label>
            <div className={styles.colorSelect}>
              <select
                className={styles.selectInput}
                value={selectedColorID}
                onChange={(e) => setSelectedColorID(Number(e.target.value))}
              >
                {colors.map((color, idx) => (
                  <option key={idx} value={idx}>
                    색상 {idx + 1}
                  </option>
                ))}
              </select>
              <div
                className={styles.colorPreview}
                style={{ backgroundColor: colors[selectedColorID] || '#808080' }}
              >
                {colors[selectedColorID] || '#808080'}
              </div>
            </div>
          </div>
          <div className={styles.formField}>
            <label>성향:</label>
            <select
              className={styles.selectInput}
              value={selectedNationType}
              onChange={(e) => setSelectedNationType(e.target.value)}
            >
              {selectableNationTypes.map((type) => (
                <option key={type.id || type.type} value={type.id || type.type}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={handleSubmit} className={styles.submitButton}>
              {commandName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



