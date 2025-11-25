'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HighRiskCommandConfirmModalProps {
  isOpen: boolean;
  title: string;
  brief: string;
  details?: string[];
  requireInputLabel?: string;
  expectedInput?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function HighRiskCommandConfirmModal({
  isOpen,
  title,
  brief,
  details = [],
  requireInputLabel,
  expectedInput,
  onConfirm,
  onCancel,
}: HighRiskCommandConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen, expectedInput]);

  const needsInput = Boolean(expectedInput && expectedInput.trim().length > 0);
  const canConfirm = !needsInput || inputValue.trim() === expectedInput!.trim();

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <DialogContent className="sm:max-w-md bg-[#14141a] border-red-500/50 text-gray-100 shadow-xl shadow-red-900/20">
        <DialogHeader className="items-center gap-2">
          <div className="p-3 rounded-full bg-red-500/10 text-red-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <DialogTitle className="text-xl font-bold text-red-100 text-center">{title}</DialogTitle>
          <DialogDescription className="text-gray-300 text-center break-words w-full">
            <span className="font-semibold text-gray-200">요약: </span>
            {brief}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {details.length > 0 && (
            <div className="space-y-1 text-sm text-gray-300 bg-black/20 p-3 rounded-md">
              {details.map((line, idx) => (
                <div key={idx} className="break-words">• {line}</div>
              ))}
            </div>
          )}

          <div className="rounded-md bg-red-900/30 px-3 py-2 text-xs text-red-200 border border-red-700/60 font-medium text-center">
            이 명령은 실행 후 되돌릴 수 없습니다.
          </div>

          {needsInput && (
            <div className="space-y-2">
              <p className="text-sm text-gray-200">
                {requireInputLabel || '안전을 위해 아래에 확인 문구를 입력해주세요.'}
              </p>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-black/40 border-white/20 text-gray-100 focus-visible:ring-red-500/50"
                placeholder={expectedInput}
              />
              <p className="text-[10px] text-gray-400">
                대소문자를 포함하여 정확히 입력해야 합니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between sm:space-x-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel} 
            className="flex-1 border-white/30 text-gray-100 hover:bg-white/10 hover:text-white"
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500"
          >
            확인 (실행)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
