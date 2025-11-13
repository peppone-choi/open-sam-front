/**
 * 실시간 전투 페이지
 * Phase 4 - 프론트엔드 UI
 */

'use client';

import { use, useState } from 'react';
import { useBattleSocket } from '../../../hooks/useBattleSocket';
import { BattleCanvas } from '../../../components/battle/BattleCanvas';

export default function BattlePage({ params }: { params: Promise<{ battleId: string }> }) {
  const resolvedParams = use(params);
  const { battleId } = resolvedParams;
  
  // TODO: 실제로는 로그인한 유저의 generalId 가져오기
  const [myGeneralId] = useState<number | undefined>(1);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const {
    isConnected,
    isJoined,
    battleState,
    error,
    logs,
    moveUnit,
    attackUnit,
    holdPosition,
    retreat
  } = useBattleSocket({
    battleId,
    generalId: myGeneralId
  });

  /**
   * 유닛 클릭 핸들러
   */
  const handleUnitClick = (unitId: number) => {
    console.log('[Battle] 유닛 클릭:', unitId);
    
    // 이미 선택된 유닛이면 공격 명령
    if (selectedUnitId && selectedUnitId !== unitId && myGeneralId) {
      // 내 유닛인지 확인
      const myUnit = battleState?.attackerUnits.find(u => u.generalId === selectedUnitId) ||
                     battleState?.defenderUnits.find(u => u.generalId === selectedUnitId);
      
      if (myUnit && myUnit.generalId === myGeneralId) {
        console.log('[Battle] 공격 명령:', selectedUnitId, '→', unitId);
        attackUnit(selectedUnitId, unitId);
        setSelectedUnitId(null);
        return;
      }
    }
    
    // 새 유닛 선택
    setSelectedUnitId(unitId);
  };

  /**
   * 맵 클릭 핸들러 (이동 명령)
   */
  const handleMapClick = (x: number, y: number) => {
    if (!selectedUnitId || !myGeneralId) {
      return;
    }

    // 내 유닛인지 확인
    const myUnit = battleState?.attackerUnits.find(u => u.generalId === selectedUnitId) ||
                   battleState?.defenderUnits.find(u => u.generalId === selectedUnitId);
    
    if (myUnit && myUnit.generalId === myGeneralId) {
      console.log('[Battle] 이동 명령:', selectedUnitId, '→', { x, y });
      moveUnit(selectedUnitId, { x, y });
      setSelectedUnitId(null);
    }
  };

  /**
   * 명령 버튼 핸들러
   */
  const handleHold = () => {
    if (selectedUnitId && myGeneralId) {
      holdPosition(selectedUnitId);
      setSelectedUnitId(null);
    }
  };

  const handleRetreat = () => {
    if (selectedUnitId && myGeneralId) {
      retreat(selectedUnitId);
      setSelectedUnitId(null);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
      <h1>실시간 전투</h1>
      
      {/* 연결 상태 */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>
        <div>Socket 연결: {isConnected ? '✅ 연결됨' : '❌ 연결 안 됨'}</div>
        <div>전투 참가: {isJoined ? '✅ 참가함' : '⏳ 대기 중'}</div>
        {error && <div style={{ color: '#ff4444' }}>오류: {error}</div>}
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 왼쪽: Canvas */}
        <div>
          <BattleCanvas
            battleState={battleState}
            selectedUnitId={selectedUnitId}
            onUnitClick={handleUnitClick}
            onMapClick={handleMapClick}
            myGeneralId={myGeneralId}
          />
          
          {/* 명령 버튼 */}
          {selectedUnitId && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleHold}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🛡️ 대기
              </button>
              <button
                onClick={handleRetreat}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#664',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🏃 후퇴
              </button>
              <button
                onClick={() => setSelectedUnitId(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                ❌ 선택 해제
              </button>
            </div>
          )}
          
          {/* 조작 안내 */}
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px', fontSize: '14px' }}>
            <h3>조작 방법:</h3>
            <ul>
              <li>🖱️ 유닛 클릭: 선택</li>
              <li>🖱️ 빈 공간 클릭: 이동 명령</li>
              <li>🖱️ 적 유닛 클릭 (선택 후): 공격 명령</li>
              <li>🛡️ 대기: 제자리 고수</li>
              <li>🏃 후퇴: AI가 후퇴 경로 계산</li>
            </ul>
            {selectedUnitId && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#444', borderRadius: '5px' }}>
                선택된 유닛 ID: {selectedUnitId}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 로그 & 정보 */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          {/* 유닛 정보 */}
          {battleState && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#333', borderRadius: '5px' }}>
              <h3>전투 정보</h3>
              <div style={{ fontSize: '14px' }}>
                <div>맵 크기: {battleState.map.width} x {battleState.map.height}</div>
                <div>현재 턴: {battleState.currentTurn}</div>
                <hr style={{ margin: '10px 0', borderColor: '#555' }} />
                <div>
                  <strong>공격군:</strong> {battleState.attackerUnits.length}명
                  <ul>
                    {battleState.attackerUnits.map(unit => (
                      <li key={unit.generalId} style={{ fontSize: '12px', marginTop: '5px' }}>
                        {unit.generalName}: {unit.troops}/{unit.maxTroops} (사기: {unit.morale.toFixed(0)})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>방어군:</strong> {battleState.defenderUnits.length}명
                  <ul>
                    {battleState.defenderUnits.map(unit => (
                      <li key={unit.generalId} style={{ fontSize: '12px', marginTop: '5px' }}>
                        {unit.generalName}: {unit.troops}/{unit.maxTroops} (사기: {unit.morale.toFixed(0)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 전투 로그 */}
          <div style={{ padding: '15px', backgroundColor: '#333', borderRadius: '5px' }}>
            <h3>전투 로그</h3>
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                fontSize: '12px',
                backgroundColor: '#222',
                padding: '10px',
                borderRadius: '5px',
                fontFamily: 'monospace'
              }}
            >
              {logs.length === 0 ? (
                <div style={{ color: '#888' }}>로그가 없습니다...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '5px', color: '#0f0' }}>
                    {new Date().toLocaleTimeString()} - {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
