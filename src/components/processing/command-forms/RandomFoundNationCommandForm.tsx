'use client';

import React, { useState, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';

interface NationType {
  type: string;
  name: string;
  pros: string;
  cons: string;
}

interface RandomFoundNationCommandFormProps {
  commandName: string;
  available건국?: boolean;
  nationTypes?: Record<string, NationType>;
  colors?: string[];
  onSubmit: (args: { colorType: number; nationName: string; nationType: string }) => void;
  onCancel: () => void;
}

export default function RandomFoundNationCommandForm({
  commandName,
  available건국 = true,
  nationTypes = {},
  colors = [],
  onSubmit,
  onCancel
}: RandomFoundNationCommandFormProps) {
  const [nationName, setNationName] = useState('');
  const [selectedColorID, setSelectedColorID] = useState(0);
  const [selectedNationType, setSelectedNationType] = useState<string>(
    Object.values(nationTypes)[0]?.type || ''
  );

  const nationTypesOptions = useMemo(() => {
    return Object.values(nationTypes).map(type => ({
      value: type.type,
      label: type.name
    }));
  }, [nationTypes]);

  const handleSubmit = () => {
    if (!available건국) {
      alert('더 이상 건국은 불가능합니다.');
      return;
    }

    if (!nationName.trim()) {
      alert('국명을 입력해주세요.');
      return;
    }

    if (nationName.length > 18) {
      alert('국명은 18자 이하여야 합니다.');
      return;
    }

    if (!selectedNationType) {
      alert('성향을 선택해주세요.');
      return;
    }

    onSubmit({
      colorType: selectedColorID,
      nationName: nationName.trim(),
      nationType: selectedNationType
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
          무작위 공백지 중, 소도시에서 나라를 세웁니다.
        </div>

        <div className={styles.nationTypesList}>
          <h3>국가 성향:</h3>
          <ul className={styles.nationTypes}>
            {Object.values(nationTypes).map((type) => (
              <li key={type.type} className={styles.nationTypeItem}>
                <div className={styles.nationTypeName}>- {type.name}:</div>
                <div className={styles.nationTypePros}>
                  <span style={{ color: 'cyan' }}>{type.pros}</span>
                </div>
                <div className={styles.nationTypeCons}>
                  <span style={{ color: 'magenta' }}>{type.cons}</span>
                </div>
              </li>
            ))}
          </ul>
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
              {colors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`${styles.toggleButton} ${selectedColorID === index ? styles.active : ''}`}
                  onClick={() => setSelectedColorID(index)}
                  style={{
                    backgroundColor: color,
                    color: '#fff',
                    border: selectedColorID === index ? '2px solid #007bff' : '1px solid #6c757d'
                  }}
                >
                  {index}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formField}>
            <label>성향:</label>
            <select
              className={styles.selectInput}
              value={selectedNationType}
              onChange={(e) => setSelectedNationType(e.target.value)}
            >
              {nationTypesOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitButton}
          >
            {commandName}
          </button>
        </div>
      </div>
    </div>
  );
}


