'use client';

import React, { useState, useEffect } from 'react';
import styles from './CommandSelectDialog.module.css';

interface CommandItem {
  value: string;
  simpleName: string;
  reqArg: number;
  possible: boolean;
  compensation: number;
  title: string;
}

interface CommandTableCategory {
  category: string;
  values: CommandItem[];
}

interface CommandSelectDialogProps {
  commandTable: CommandTableCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: CommandItem) => void;
}

export default function CommandSelectDialog({
  commandTable,
  isOpen,
  onClose,
  onSelectCommand,
}: CommandSelectDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (isOpen && commandTable.length > 0) {
      setSelectedCategory(commandTable[0].category);
    }
  }, [isOpen, commandTable]);

  if (!isOpen) {
    return null;
  }

  // 명령 테이블이 없으면 메시지 표시
  if (commandTable.length === 0) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h3>명령 선택</h3>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
            명령 테이블을 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  const selectedCategoryData = commandTable.find(cat => cat.category === selectedCategory);

  const handleCommandClick = (command: CommandItem) => {
    if (!command.possible) {
      return; // 불가능한 명령은 클릭 불가
    }
    onSelectCommand(command);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>명령 선택</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.categoryButtons}>
          {commandTable.map((category) => (
            <button
              key={category.category}
              className={`${styles.categoryButton} ${selectedCategory === category.category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.category)}
            >
              {category.category}
            </button>
          ))}
        </div>

        <div className={styles.commandList}>
          {selectedCategoryData && selectedCategoryData.values.map((command) => (
            <div
              key={command.value}
              className={`${styles.commandItem} ${!command.possible ? styles.disabled : ''}`}
              onClick={() => handleCommandClick(command)}
              title={command.title}
            >
              <div className={styles.commandBody}>
                <div className={styles.commandName}>
                  {command.simpleName}
                  {command.compensation > 0 && (
                    <span className={styles.compensatePositive}>▲</span>
                  )}
                  {command.compensation < 0 && (
                    <span className={styles.compensateNegative}>▼</span>
                  )}
                </div>
                <div className={styles.commandTitle}>
                  {command.title.startsWith(command.simpleName)
                    ? command.title.substring(command.simpleName.length)
                    : command.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

