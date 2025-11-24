'use client';

import React, { useEffect, useRef } from 'react';
import styles from './CommandSelectDialog.module.css';
import type { ColorSystem } from '@/types/colorSystem';
import CommandSelectForm, { CommandTableCategory, CommandItem } from './CommandSelectForm';

interface CommandSelectDialogProps {
  commandTable: CommandTableCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: CommandItem) => void;
  turnIndex?: number | null;
  turnYear?: number;
  turnMonth?: number;
  turnTime?: string;
  nationColor?: string;
  colorSystem?: ColorSystem;
}

export default function CommandSelectDialog({
  commandTable,
  isOpen,
  onClose,
  onSelectCommand,
  turnIndex = null,
  turnYear,
  turnMonth,
  turnTime,
  nationColor,
  colorSystem,
}: CommandSelectDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus dialog when opened, close on Escape
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-select-form-title"
        aria-describedby={turnIndex !== null ? 'command-select-form-description' : undefined}
        style={{ outline: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <CommandSelectForm
          commandTable={commandTable}
          onClose={onClose}
          onSelectCommand={(cmd) => {
              onSelectCommand(cmd);
              onClose();
          }}
          turnIndex={turnIndex}
          turnYear={turnYear}
          turnMonth={turnMonth}
          turnTime={turnTime}
          colorSystem={colorSystem}
        />
      </div>
    </div>
  );
}
