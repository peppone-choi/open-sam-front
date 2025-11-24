'use client';

import React, { useEffect, useState } from 'react';

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

  if (!isOpen) return null;

  const needsInput = Boolean(expectedInput && expectedInput.trim().length > 0);
  const canConfirm = !needsInput || inputValue.trim() === expectedInput!.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className="w-full max-w-md rounded-lg border border-white/20 bg-[#14141a] text-sm text-gray-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-center">{title}</h2>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="text-xs text-gray-300 break-words">
            <span className="font-semibold">요약:&nbsp;</span>
            <span>{brief}</span>
          </div>

          {details.length > 0 && (
            <div className="space-y-1 text-xs text-gray-200">
              {details.map((line, idx) => (
                <div key={idx} className="break-words">
                  • {line}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-md bg-red-900/30 px-3 py-2 text-xs text-red-200 border border-red-700/60">
            이 명령은 실행 후 되돌릴 수 없습니다.
          </div>

          {needsInput && (
            <div className="space-y-1 text-xs">
              <div className="text-gray-200">
                {requireInputLabel || '안전을 위해 아래에 확인 문구를 입력해주세요.'}
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="mt-1 w-full rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-gray-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="text-[10px] text-gray-400">
                대소문자를 포함하여 정확히 입력해야 합니다.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-white/10 px-5 py-3 text-sm">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded border border-white/30 px-3 py-2 text-gray-100 hover:bg-white/10 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={canConfirm ? onConfirm : undefined}
            className={`flex-1 rounded px-3 py-2 font-semibold transition-colors ${
              canConfirm
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'cursor-not-allowed bg-red-900/40 text-red-300/60'
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
