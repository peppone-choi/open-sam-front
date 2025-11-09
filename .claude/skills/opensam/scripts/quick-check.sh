#!/bin/bash

# OpenSAM 빠른 타입 체크 스크립트
# 현재 TypeScript 에러 개수만 빠르게 확인

WORKSPACE="/mnt/d/opensam/open-sam-backend"

cd "$WORKSPACE"

echo "TypeScript 타입 체크 중..."
echo ""

# 타입 체크 실행
npx tsc --noEmit > /tmp/tsc-errors.txt 2>&1 || true

# 에러 카운트
ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-errors.txt || echo 0)

if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ 타입 에러 없음!"
    exit 0
else
    echo "❌ 타입 에러: $ERROR_COUNT 개"
    echo ""
    echo "가장 많은 에러 타입 (Top 5):"
    grep "error TS" /tmp/tsc-errors.txt | sed 's/.*error \(TS[0-9]*\).*/\1/' | sort | uniq -c | sort -rn | head -5
    echo ""
    echo "전체 에러를 보려면: cat /tmp/tsc-errors.txt"
fi
