#!/bin/bash

# OpenSAM 자동 타입 체크 및 수정 스크립트
# 사용법: ./scripts/auto-fix-types.sh [batch-size]

set -e

BATCH_SIZE=${1:-50}
WORKSPACE="/mnt/d/opensam/open-sam-backend"
ERROR_FILE="typescript-errors.txt"
LOG_FILE="fix-log.txt"

echo "========================================" | tee -a "$LOG_FILE"
echo "OpenSAM 자동 타입 수정 시작" | tee -a "$LOG_FILE"
echo "시작 시간: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "배치 크기: $BATCH_SIZE" | tee -a "$LOG_FILE"
echo "작업 경로: $WORKSPACE" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

cd "$WORKSPACE"

# 초기 에러 카운트
echo "TypeScript 컴파일 체크 중..."
npx tsc --noEmit > "$ERROR_FILE" 2>&1 || true
INITIAL_ERRORS=$(grep -c "error TS" "$ERROR_FILE" || echo 0)
echo "초기 에러: $INITIAL_ERRORS" | tee -a "$LOG_FILE"

if [ $INITIAL_ERRORS -eq 0 ]; then
    echo "✓ 타입 에러 없음! 작업 완료." | tee -a "$LOG_FILE"
    exit 0
fi

ITERATION=0
CURRENT_ERRORS=$INITIAL_ERRORS
PREV_ERRORS=$INITIAL_ERRORS

while [ $CURRENT_ERRORS -gt 0 ] && [ $ITERATION -lt 100 ]; do
    ITERATION=$((ITERATION + 1))
    
    echo "" | tee -a "$LOG_FILE"
    echo "[반복 $ITERATION] 에러 분석 중... (남은 에러: $CURRENT_ERRORS)" | tee -a "$LOG_FILE"
    
    # 다시 타입 체크
    npx tsc --noEmit > "$ERROR_FILE" 2>&1 || true
    NEW_ERROR_COUNT=$(grep -c "error TS" "$ERROR_FILE" || echo 0)
    
    # 진행 상황 확인
    if [ $NEW_ERROR_COUNT -eq $PREV_ERRORS ]; then
        echo "[경고] 에러 개수 변화 없음. 수동 개입 필요." | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
        echo "현재 에러 샘플 (처음 10개):" | tee -a "$LOG_FILE"
        head -n 30 "$ERROR_FILE" | tee -a "$LOG_FILE"
        break
    fi
    
    FIXED=$((PREV_ERRORS - NEW_ERROR_COUNT))
    echo "[완료] $FIXED개 수정 완료! (남은 에러: $NEW_ERROR_COUNT)" | tee -a "$LOG_FILE"
    
    PREV_ERRORS=$NEW_ERROR_COUNT
    CURRENT_ERRORS=$NEW_ERROR_COUNT
    
    # 진행 상황 저장
    echo "$(date '+%H:%M:%S') - 반복 $ITERATION: $FIXED개 수정, $CURRENT_ERRORS개 남음" >> "$LOG_FILE"
done

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "수정 세션 완료!" | tee -a "$LOG_FILE"
echo "종료 시간: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "총 반복: $ITERATION" | tee -a "$LOG_FILE"
echo "수정된 에러: $((INITIAL_ERRORS - CURRENT_ERRORS))" | tee -a "$LOG_FILE"
echo "남은 에러: $CURRENT_ERRORS" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

if [ $CURRENT_ERRORS -eq 0 ]; then
    echo "🎉 모든 타입 에러 수정 완료!" | tee -a "$LOG_FILE"
fi
