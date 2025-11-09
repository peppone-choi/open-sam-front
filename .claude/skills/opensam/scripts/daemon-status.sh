#!/bin/bash
# OpenSAM 데몬 상태 확인

echo "========================================
OpenSAM 데몬 상태
$(date '+%Y-%m-%d %H:%M:%S')
========================================"

echo "
1. 커맨드 큐:"
redis-cli LLEN game:commands 2>/dev/null && echo "   대기 중" || echo "   Redis 연결 실패"

echo "
2. DB 저장 대기:"
redis-cli SCARD game:dirty 2>/dev/null && echo "   엔티티" || echo "   확인 불가"

echo "
3. 캐시 상태:"
redis-cli DBSIZE 2>/dev/null && echo "   총 키" || echo "   확인 불가"

echo "
4. 데몬 프로세스:"
pgrep -f "game-daemon" && echo "   ✓ 실행 중" || echo "   ✗ 중지됨"

echo "
========================================"
