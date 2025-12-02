'use client';

import React, { useState, useCallback } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './CommandForm.module.css';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SimpleCommandFormProps {
  commandName: string;
  description?: string;
  costGold?: number;
  costRice?: number;
  /**
   * -1: 평균 이하, 0: 평균, 1: 평균 이상 (PHP onCalcDomestic(score) 기준)
   */
  compensationStyle?: number | null;
  onSubmit: (args: Record<string, unknown>) => void;
  onCancel: () => void;
}

export default function SimpleCommandForm({
  commandName,
  description,
  costGold,
  costRice,
  compensationStyle,
  onSubmit,
  onCancel
}: SimpleCommandFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({});
    } finally {
      // 페이지 이동이 발생하므로 setState가 실행되지 않을 수 있음
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit]);
  const hasCostPreview =
    (typeof costGold === 'number' && costGold > 0) ||
    (typeof costRice === 'number' && costRice > 0) ||
    typeof compensationStyle === 'number';

  const renderEffectLabel = () => {
    if (typeof compensationStyle !== 'number') return null;
    if (compensationStyle > 0) return '평균 이상 효과 예상';
    if (compensationStyle < 0) return '평균 이하 효과 가능성';
    return '평균 수준 효과 예상';
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className="p-4">
        <Card className="w-full max-w-md mx-auto bg-[#1a1a1a]/50 border-white/10">
          <CardHeader className="pb-2">
            {/* Header content if needed, but TopBackBar handles the main title */}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`${styles.description} text-sm text-gray-300`}>
              {description || `${commandName} 명령을 실행합니다.`}
            </div>

            {hasCostPreview && (
              <div className={`${styles.description} space-y-1 text-sm text-gray-300`}>
                {typeof costGold === 'number' && costGold > 0 && (
                  <div>예상 자금 소모: {costGold.toLocaleString()}금</div>
                )}
                {typeof costRice === 'number' && costRice > 0 && (
                  <div>예상 군량 소모: {costRice.toLocaleString()}미</div>
                )}
                {renderEffectLabel() && <div>{renderEffectLabel()}</div>}
                <div className="text-xs opacity-80 mt-2">
                  실제 결과는 기술, 특기, 랜덤 요소에 따라 다소 변동될 수 있습니다.
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  처리 중...
                </span>
              ) : commandName}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
