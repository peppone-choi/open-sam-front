#!/bin/bash

# OpenSAM 레거시 코드 검색 스크립트
# 마이그레이션이 필요한 PHP/Knex 코드 탐지

WORKSPACE="/mnt/d/opensam/open-sam-backend"
REPORT_FILE="legacy-report.txt"

cd "$WORKSPACE"

echo "========================================"
echo "OpenSAM 레거시 코드 분석"
echo "분석 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# 1. db.table() 호출
echo ""
echo "1. Knex db.table() 호출:"
DB_TABLE_COUNT=$(grep -r "db\.table" src/ 2>/dev/null | wc -l || echo 0)
echo "   발견: $DB_TABLE_COUNT개"
if [ $DB_TABLE_COUNT -gt 0 ]; then
    echo "   위치:"
    grep -rn "db\.table" src/ 2>/dev/null | head -20
fi

# 2. as any 사용
echo ""
echo "2. 'as any' 타입 단언:"
AS_ANY_COUNT=$(grep -r " as any" src/ 2>/dev/null | wc -l || echo 0)
echo "   발견: $AS_ANY_COUNT개"
if [ $AS_ANY_COUNT -gt 0 ]; then
    echo "   위치:"
    grep -rn " as any" src/ 2>/dev/null | head -20
fi

# 3. PHP 파일
echo ""
echo "3. 남은 PHP 파일:"
PHP_COUNT=$(find src/ -name "*.php" 2>/dev/null | wc -l || echo 0)
echo "   발견: $PHP_COUNT개"
if [ $PHP_COUNT -gt 0 ]; then
    find src/ -name "*.php" 2>/dev/null | head -20
fi

# 4. require/module.exports (CommonJS)
echo ""
echo "4. CommonJS 패턴 (require/module.exports):"
COMMONJS_COUNT=$(grep -rE "(^require\(|module\.exports)" src/ 2>/dev/null | wc -l || echo 0)
echo "   발견: $COMMONJS_COUNT개"

# 5. TODO/FIXME 주석
echo ""
echo "5. TODO/FIXME 마커:"
TODO_COUNT=$(grep -rE "(TODO|FIXME)" src/ 2>/dev/null | wc -l || echo 0)
echo "   발견: $TODO_COUNT개"

# 6. any 타입 (전체)
echo ""
echo "6. 'any' 타입 사용:"
ANY_TYPE_COUNT=$(grep -rE ": any" src/ 2>/dev/null | wc -l || echo 0)
echo "   발견: $ANY_TYPE_COUNT개"

# 요약
echo ""
echo "========================================"
echo "요약"
echo "========================================"
echo "Knex 호출:     $DB_TABLE_COUNT"
echo "as any:        $AS_ANY_COUNT"
echo "PHP 파일:      $PHP_COUNT"
echo "CommonJS:      $COMMONJS_COUNT"
echo "TODO/FIXME:    $TODO_COUNT"
echo "any 타입:      $ANY_TYPE_COUNT"
echo ""
TOTAL=$((DB_TABLE_COUNT + AS_ANY_COUNT + PHP_COUNT))
echo "총 마이그레이션 항목: $TOTAL"
echo "========================================"

# 파일로 저장
{
    echo "OpenSAM 레거시 코드 분석 리포트"
    echo "생성 시간: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "Knex 호출:     $DB_TABLE_COUNT"
    echo "as any:        $AS_ANY_COUNT"
    echo "PHP 파일:      $PHP_COUNT"
    echo "CommonJS:      $COMMONJS_COUNT"
    echo "TODO/FIXME:    $TODO_COUNT"
    echo "any 타입:      $ANY_TYPE_COUNT"
    echo "총 마이그레이션 항목: $TOTAL"
} > "$REPORT_FILE"

echo ""
echo "리포트가 $REPORT_FILE 에 저장되었습니다."
