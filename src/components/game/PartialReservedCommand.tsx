'use client';

import React, { useState, useEffect } from 'react';
import styles from './PartialReservedCommand.module.css';
import { SammoAPI } from '@/lib/api/sammo';
import CommandSelectDialog from './CommandSelectDialog';

interface PartialReservedCommandProps {
  generalID: number;
  serverID: string;
}

interface ReservedCommand {
  action: string;
  brief: string;
  arg: any;
  year?: number;
  month?: number;
  time?: string;
  tooltip?: string;
  style?: Record<string, string>;
}

interface CommandTableCategory {
  category: string;
  values: Array<{
    value: string;
    simpleName: string;
    reqArg: number;
    possible: boolean;
    compensation: number;
    title: string;
  }>;
}

export default function PartialReservedCommand({ generalID, serverID }: PartialReservedCommandProps) {
  const [reservedCommands, setReservedCommands] = useState<ReservedCommand[]>([]);
  const [commandTable, setCommandTable] = useState<CommandTableCategory[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMaxTurn, setViewMaxTurn] = useState(14);
  const [loading, setLoading] = useState(true);
  const [selectedTurnIndices, setSelectedTurnIndices] = useState<Set<number>>(new Set());
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurnIndex, setEditingTurnIndex] = useState<number | null>(null);

  const MAX_TURN = 30;
  const FLIPPED_MAX_TURN = 14;

  useEffect(() => {
    loadData();
  }, [generalID, serverID]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservedResponse, commandTableResponse] = await Promise.all([
        SammoAPI.CommandGetReservedCommand({ serverID, general_id: generalID }).catch((err) => {
          console.error('명령 목록 API 에러:', err);
          return { success: false, turn: [] };
        }),
        SammoAPI.GetCommandTable({ serverID, general_id: generalID }).catch((err) => {
          console.error('명령 테이블 API 에러:', err);
          return { success: false, commandTable: [], reason: err.message };
        }),
      ]);

      // MAX_TURN(30)까지 모든 턴을 채우기 (빈 턴도 포함)
      const commands: ReservedCommand[] = [];
      const year = reservedResponse.year || 180;
      let month = reservedResponse.month || 1;
      const turnTerm = reservedResponse.turnTerm || 3600; // 초 단위
      const baseTime = new Date(reservedResponse.turnTime || Date.now());

      for (let idx = 0; idx < MAX_TURN; idx++) {
        let currentMonth = month + idx;
        while (currentMonth > 12) {
          currentMonth -= 12;
        }

        // 시간 계산
        const turnTime = new Date(baseTime.getTime() + idx * turnTerm * 1000);
        const hours = String(turnTime.getHours()).padStart(2, '0');
        const minutes = String(turnTime.getMinutes()).padStart(2, '0');

        // 해당 턴의 명령이 있으면 사용, 없으면 빈 턴(휴식)
        const cmd = (reservedResponse.success && reservedResponse.turn && reservedResponse.turn[idx]) 
          ? {
              ...reservedResponse.turn[idx],
              brief: reservedResponse.turn[idx].brief || reservedResponse.turn[idx].action || '휴식' // brief가 없으면 action 사용
            }
          : {
              action: '휴식',
              brief: '휴식',
              arg: {}
            };

        commands.push({
          ...cmd,
          year,
          month: currentMonth,
          time: `${hours}:${minutes}`,
        });
      }

      setReservedCommands(commands);
      setServerTime(new Date(reservedResponse.date || Date.now()));

      console.log('명령 테이블 응답:', {
        success: commandTableResponse.success,
        result: commandTableResponse.result,
        hasCommandTable: !!commandTableResponse.commandTable,
        commandTableType: typeof commandTableResponse.commandTable,
        commandTableLength: Array.isArray(commandTableResponse.commandTable) 
          ? commandTableResponse.commandTable.length 
          : 'not array',
        fullResponse: commandTableResponse
      });

      if (commandTableResponse.success && commandTableResponse.commandTable && Array.isArray(commandTableResponse.commandTable) && commandTableResponse.commandTable.length > 0) {
        console.log('명령 테이블 로드 성공:', commandTableResponse.commandTable.length, '개 카테고리');
        setCommandTable(commandTableResponse.commandTable);
      } else {
        console.warn('명령 테이블 로드 실패 또는 비어있음:', {
          success: commandTableResponse.success,
          result: commandTableResponse.result,
          hasCommandTable: !!commandTableResponse.commandTable,
          commandTableLength: Array.isArray(commandTableResponse.commandTable) 
            ? commandTableResponse.commandTable.length 
            : 'not array',
          reason: commandTableResponse.reason || commandTableResponse.message,
          fullResponse: commandTableResponse
        });
        // 명령 테이블이 없어도 기본 명령(휴식)은 사용 가능하도록 설정
        setCommandTable([]);
      }
    } catch (error) {
      console.error('명령 목록 로드 실패:', error);
      // 에러 발생 시에도 기본 휴식 명령으로 채우기
      const defaultCommands: ReservedCommand[] = [];
      for (let idx = 0; idx < MAX_TURN; idx++) {
        defaultCommands.push({
          action: '휴식',
          brief: '휴식',
          arg: {},
          year: 180,
          month: 1,
          time: '00:00',
        });
      }
      setReservedCommands(defaultCommands);
    } finally {
      setLoading(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedTurnIndices(new Set());
  };

  const toggleViewMaxTurn = () => {
    setViewMaxTurn(viewMaxTurn === FLIPPED_MAX_TURN ? MAX_TURN : FLIPPED_MAX_TURN);
  };

  const handleTurnClick = (turnIdx: number, e: React.MouseEvent) => {
    if (!isEditMode) return;

    const newSelected = new Set(selectedTurnIndices);
    if (e.shiftKey && selectedTurnIndices.size > 0) {
      // Shift 클릭: 범위 선택
      const min = Math.min(...Array.from(selectedTurnIndices), turnIdx);
      const max = Math.max(...Array.from(selectedTurnIndices), turnIdx);
      for (let i = min; i <= max; i++) {
        newSelected.add(i);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd 클릭: 토글
      if (newSelected.has(turnIdx)) {
        newSelected.delete(turnIdx);
      } else {
        newSelected.add(turnIdx);
      }
    } else {
      // 일반 클릭: 단일 선택
      newSelected.clear();
      newSelected.add(turnIdx);
    }

    setSelectedTurnIndices(newSelected);
  };

  // MAX_TURN까지 모든 턴을 표시 (빈 턴도 포함)
  // reservedCommands가 비어있어도 최소한의 빈 턴을 표시
  const displayCommands = reservedCommands.length > 0 
    ? reservedCommands.slice(0, viewMaxTurn)
    : Array.from({ length: viewMaxTurn }, (_, idx) => ({
        action: '휴식',
        brief: '휴식',
        arg: {},
        year: 180,
        month: 1,
        time: '00:00',
      }));

  if (loading && reservedCommands.length === 0) {
    return (
      <div className={styles.commandPad}>
        <div className={styles.header}>
          <h4>명령 목록</h4>
        </div>
        <div className={styles.content}>
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.commandPad}>
      <div className={styles.header}>
        <h4>명령 목록</h4>
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.toolbarButton}
          onClick={toggleEditMode}
        >
          {isEditMode ? '일반 모드로' : '고급 모드로'}
        </button>
        <div className={styles.clock}>
          {serverTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <button
          className={styles.toolbarButton}
          onClick={toggleViewMaxTurn}
        >
          {viewMaxTurn === FLIPPED_MAX_TURN ? '펼치기' : '접기'}
        </button>
      </div>

      {!isDialogOpen && (
        <div className={styles.commandTableWrapper}>
          <div className={`${styles.commandTable} ${isEditMode ? styles.isEditMode : ''}`}>
            {/* 턴 번호 */}
            <div className={styles.turnNumberColumn}>
              {displayCommands.map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.turnCell} ${isEditMode ? styles.turnCellEditable : ''} ${selectedTurnIndices.has(idx) ? styles.selected : ''}`}
                  onClick={(e) => handleTurnClick(idx, e)}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* 년월 */}
            <div className={styles.yearMonthColumn}>
              {displayCommands.map((cmd, idx) => (
                <div key={idx} className={styles.yearMonthCell}>
                  {cmd.year ? `${cmd.year}年` : ''} {cmd.month ? `${cmd.month}月` : ''}
                </div>
              ))}
            </div>

            {/* 시간 */}
            <div className={styles.timeColumn}>
              {displayCommands.map((cmd, idx) => (
                <div key={idx} className={styles.timeCell}>
                  {cmd.time || '-'}
                </div>
              ))}
            </div>

            {/* 명령 */}
            <div className={styles.commandColumn}>
              {displayCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className={styles.commandCell}
                  title={cmd.tooltip || cmd.brief}
                  style={cmd.style}
                  dangerouslySetInnerHTML={{ __html: cmd.brief || '휴식' }}
                />
              ))}
            </div>

            {/* 수정 버튼 (일반 모드) */}
            {!isEditMode && (
              <div className={styles.actionColumn}>
                {displayCommands.map((_, idx) => (
                  <div key={idx} className={styles.actionCell}>
                    <button
                      type="button"
                      className={styles.editButton}
                      disabled={false}
                      title="명령 수정"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('수정 버튼 클릭:', idx, 'commandTable:', commandTable.length);
                        setEditingTurnIndex(idx);
                        setIsDialogOpen(true);
                      }}
                    >
                      ✎
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isDialogOpen && (
        <div className={styles.dialogWrapper}>
          <CommandSelectDialog
            commandTable={commandTable}
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingTurnIndex(null);
            }}
            onSelectCommand={async (command) => {
              if (editingTurnIndex !== null) {
                try {
                  // generalID 확인 및 숫자 변환
                  const numGeneralID = Number(generalID);
                  if (!numGeneralID || numGeneralID === 0 || isNaN(numGeneralID)) {
                    alert(`명령 예약 실패: 장수 ID가 유효하지 않습니다 (generalID: ${generalID}, 변환: ${numGeneralID})`);
                    return;
                  }
                  
                  console.log('명령 예약 요청:', {
                    serverID,
                    general_id: numGeneralID,
                    general_id_type: typeof numGeneralID,
                    turn_idx: editingTurnIndex,
                    action: command.value,
                    brief: command.simpleName,
                  });
                  
                  // 명령 예약 API 호출
                  const response = await SammoAPI.CommandReserveCommand({
                    serverID,
                    general_id: numGeneralID,
                    turn_idx: editingTurnIndex,
                    action: command.value,
                    arg: {},
                    brief: command.simpleName,
                  });
                  
                  console.log('명령 예약 응답:', response);

                  if (response.success) {
                    // 데이터 다시 로드 (서버에서 최신 데이터 가져오기)
                    await loadData();
                  } else {
                    alert(`명령 예약 실패: ${response.reason || '알 수 없는 오류'}`);
                  }
                } catch (error: any) {
                  console.error('명령 예약 실패:', error);
                  alert(`명령 예약 실패: ${error.message || '알 수 없는 오류'}`);
                }
              }
              setIsDialogOpen(false);
              setEditingTurnIndex(null);
            }}
          />
        </div>
      )}

      {!isDialogOpen && (
        <div className={styles.footer}>
          <button className={styles.footerButton} disabled={!isEditMode}>
            당기기
          </button>
          <button className={styles.footerButton} disabled={!isEditMode}>
            미루기
          </button>
        </div>
      )}
    </div>
  );
}
