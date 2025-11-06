'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import styles from './PartialReservedCommand.module.css';
import { SammoAPI } from '@/lib/api/sammo';
import CommandSelectDialog from './CommandSelectDialog';
import { JosaUtil } from '@/lib/utils/josaUtil';

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
  const router = useRouter();
  const { showToast } = useToast();
  const [reservedCommands, setReservedCommands] = useState<ReservedCommand[]>([]);
  const [commandTable, setCommandTable] = useState<CommandTableCategory[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMaxTurn, setViewMaxTurn] = useState(23);
  const [loading, setLoading] = useState(true);
  const [selectedTurnIndices, setSelectedTurnIndices] = useState<Set<number>>(new Set());
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurnIndex, setEditingTurnIndex] = useState<number | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCommand, setBatchCommand] = useState<{
    action: string;
    arg: any;
    brief: string;
  } | null>(null);

  const MAX_TURN = 30;
  const FLIPPED_MAX_TURN = 23;

  useEffect(() => {
    loadData();
  }, [generalID, serverID]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservedResponse, commandTableResponse, mapResponse] = await Promise.all([
        SammoAPI.CommandGetReservedCommand({ serverID, general_id: generalID }).catch((err) => {
          console.error('명령 목록 API 에러:', err);
          return { success: false, turn: [] };
        }),
        SammoAPI.GetCommandTable({ serverID, general_id: generalID }).catch((err) => {
          console.error('명령 테이블 API 에러:', err);
          return { success: false, commandTable: [], reason: err.message };
        }),
        SammoAPI.GlobalGetMap({ serverID, neutralView: 0, showMe: 1 }).catch((err) => {
          console.error('맵 데이터 API 에러:', err);
          return { result: false, cityList: [] };
        }),
      ]);

      // MAX_TURN(30)까지 모든 턴을 채우기 (빈 턴도 포함)
      const commands: ReservedCommand[] = [];
      
      // 세션의 현재 년/월을 사용 (없으면 장수 년/월 사용)
      const sessionYear = reservedResponse.sessionYear || reservedResponse.year || 180;
      const sessionMonth = reservedResponse.sessionMonth || reservedResponse.month || 1;
      const turnTerm = reservedResponse.turnTerm || 60; // 분 단위 (PHP 버전과 동일)
      
      console.log('[PartialReservedCommand] API 응답:', {
        sessionYear,
        sessionMonth,
        generalYear: reservedResponse.year,
        generalMonth: reservedResponse.month,
        turnTerm,
        turnTime: reservedResponse.turnTime,
        success: reservedResponse.success
      });
      
      // baseTime은 UTC ISO 문자열이므로 Date 객체로 파싱
      // 백엔드에서 반환하는 turnTime은 UTC 시간
      const baseTime = new Date(reservedResponse.turnTime || Date.now());
      
      // 한국 시간대 포맷터 (한 번만 생성)
      const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // 세션의 현재 년/월부터 시작 (다음 턴부터 예약이므로 +1)
      // yearMonth = year * 12 + month - 1 (0부터 시작)
      let yearMonth = sessionYear * 12 + sessionMonth; // 다음 턴이므로 -1 하지 않음

      for (let idx = 0; idx < MAX_TURN; idx++) {
        // yearMonth로부터 년/월 계산
        const currentYear = Math.floor(yearMonth / 12);
        const currentMonth = (yearMonth % 12) + 1;

        // 시간 계산 (PHP 버전처럼 addMinutes 사용)
        // turnTerm은 분 단위이므로 분을 더해서 계산
        // baseTime (UTC)에 turnTerm * idx 분을 더함
        const turnTime = new Date(baseTime.getTime() + idx * turnTerm * 60 * 1000);
        
        // 한국 시간대(Asia/Seoul, UTC+9)로 변환하여 표시
        const timeStr = kstFormatter.format(turnTime);
        const [hours, minutes] = timeStr.split(':').map(s => s.padStart(2, '0'));

        // 해당 턴의 명령이 있으면 사용, 없으면 빈 턴(휴식)
        let cmd = (reservedResponse.success && reservedResponse.turn && reservedResponse.turn[idx]) 
          ? reservedResponse.turn[idx]
          : {
              action: '휴식',
              brief: '휴식',
              arg: {}
            };

        // brief가 없으면 arg를 보고 생성
        if (cmd.action !== '휴식' && !cmd.brief) {
          const action = cmd.action || '';
          const arg = cmd.arg || {};
          
          // 이동 계열 명령 (도시 선택)
          if (arg.destCityID && !arg.amount) {
            const cityName = mapResponse.result && mapResponse.cityList 
              ? mapResponse.cityList.find((c: any) => c.city === arg.destCityID)?.name 
              : null;
            if (cityName) {
              cmd.brief = `${JosaUtil.attachJosa(cityName, '으로')} ${action}`;
            } else {
              cmd.brief = `${JosaUtil.attachJosa('도시' + arg.destCityID, '으로')} ${action}`;
            }
          }
          // 물자원조, 발령, 인구이동 등 (도시 + 금액/인구)
          else if (arg.destCityID && arg.amount) {
            const cityName = mapResponse.result && mapResponse.cityList 
              ? mapResponse.cityList.find((c: any) => c.city === arg.destCityID)?.name 
              : null;
            const amountStr = arg.amount.toLocaleString();
            if (cityName) {
              cmd.brief = `${JosaUtil.attachJosa(cityName, '으로')} ${JosaUtil.attachJosa(amountStr, '을')} ${action}`;
            } else {
              cmd.brief = `${'도시' + arg.destCityID}${JosaUtil.pickJosa('도시', '으로')} ${JosaUtil.attachJosa(amountStr, '을')} ${action}`;
            }
          }
          // 장수대상임관 (장수 + 국가)
          else if ((arg.destGeneralID || arg.targetGeneralID) && arg.nationID) {
            const generalID = arg.destGeneralID || arg.targetGeneralID;
            cmd.brief = `${'장수' + generalID}${JosaUtil.pickJosa('장수', '을')} ${'국가' + arg.nationID}${JosaUtil.pickJosa('국가', '에')} ${action}`;
          }
          // 등용, 선양 등 (장수 선택)
          else if (arg.destGeneralID || arg.targetGeneralID) {
            const generalID = arg.destGeneralID || arg.targetGeneralID;
            cmd.brief = `${JosaUtil.attachJosa('장수' + generalID, '을')} ${action}`;
          }
          // 몰수, 포상, 증여 등 (장수 + 금액)
          else if (arg.generalID && arg.amount) {
            const amountStr = arg.amount.toLocaleString();
            cmd.brief = `${'장수' + arg.generalID}${JosaUtil.pickJosa('장수', '에게')} ${JosaUtil.attachJosa(amountStr, '을')} ${action}`;
          }
          // 임관 (국가 선택)
          else if (arg.nationID) {
            cmd.brief = `${JosaUtil.attachJosa('국가' + arg.nationID, '에')} ${action}`;
          }
          // 건국, 무작위건국 (국가 이름)
          else if (arg.nationName) {
            cmd.brief = `${JosaUtil.attachJosa(arg.nationName, '을')} ${action}`;
          }
          // 국호변경
          else if (arg.newName) {
            cmd.brief = `${JosaUtil.attachJosa(arg.newName, '으로')} ${action}`;
          }
          // 군량매매, 헌납 등 (금액만)
          else if (arg.amount) {
            const amountStr = arg.amount.toLocaleString();
            cmd.brief = `${JosaUtil.attachJosa(amountStr, '을')} ${action}`;
          }
          // 기본값
          else {
            cmd.brief = action;
          }
        } else if (!cmd.brief) {
          cmd.brief = cmd.action || '휴식';
        }

        commands.push({
          ...cmd,
          year: currentYear,
          month: currentMonth,
          time: `${hours}:${minutes}`,
        });

        // 다음 턴으로 (yearMonth 증가)
        yearMonth += 1;
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
    setIsBatchMode(false);
    setBatchCommand(null);
  };

  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedTurnIndices(new Set());
  };

  const toggleViewMaxTurn = () => {
    setViewMaxTurn(viewMaxTurn === FLIPPED_MAX_TURN ? MAX_TURN : FLIPPED_MAX_TURN);
  };

  const handlePullCommand = async () => {
    if (selectedTurnIndices.size === 0) {
      alert('당길 턴을 선택해주세요.');
      return;
    }

    try {
      const numGeneralID = Number(generalID);
      if (!numGeneralID || numGeneralID === 0 || isNaN(numGeneralID)) {
        alert(`명령 당기기 실패: 장수 ID가 유효하지 않습니다 (generalID: ${generalID})`);
        return;
      }

      const response = await SammoAPI.PullCommand({
        serverID,
        general_id: numGeneralID,
        turn_cnt: 1, // 1턴 당기기
      });

      if (response.success) {
        await loadData();
        setSelectedTurnIndices(new Set());
        showToast('명령을 당겼습니다.', 'success');
      } else {
        const errorMsg = response.message || '알 수 없는 오류';
        showToast(`명령 당기기 실패: ${errorMsg}`, 'error');
      }
    } catch (error: any) {
      console.error('명령 당기기 실패:', error);
      showToast(`명령 당기기 실패: ${error.message || '알 수 없는 오류'}`, 'error');
    }
  };

  const handlePushCommand = async () => {
    if (selectedTurnIndices.size === 0) {
      alert('미룰 턴을 선택해주세요.');
      return;
    }

    try {
      const numGeneralID = Number(generalID);
      if (!numGeneralID || numGeneralID === 0 || isNaN(numGeneralID)) {
        alert(`명령 미루기 실패: 장수 ID가 유효하지 않습니다 (generalID: ${generalID})`);
        return;
      }

      const response = await SammoAPI.PushCommand({
        serverID,
        general_id: numGeneralID,
        turn_cnt: 1, // 1턴 미루기
      });

      if (response.success) {
        await loadData();
        setSelectedTurnIndices(new Set());
        showToast('명령을 미뤘습니다.', 'success');
      } else {
        const errorMsg = response.message || '알 수 없는 오류';
        showToast(`명령 미루기 실패: ${errorMsg}`, 'error');
      }
    } catch (error: any) {
      console.error('명령 미루기 실패:', error);
      showToast(`명령 미루기 실패: ${error.message || '알 수 없는 오류'}`, 'error');
    }
  };

  const handleDeleteCommand = async () => {
    if (selectedTurnIndices.size === 0) {
      alert('삭제할 턴을 선택해주세요.');
      return;
    }

    const confirmMsg = `선택한 ${selectedTurnIndices.size}개 턴의 명령을 삭제(휴식으로 변경)하시겠습니까?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const numGeneralID = Number(generalID);
      if (!numGeneralID || numGeneralID === 0 || isNaN(numGeneralID)) {
        alert(`명령 삭제 실패: 장수 ID가 유효하지 않습니다 (generalID: ${generalID})`);
        return;
      }

      const turnList = Array.from(selectedTurnIndices);
      const response = await SammoAPI.DeleteCommand({
        serverID,
        general_id: numGeneralID,
        turn_list: turnList,
      });

      if (response.success) {
        await loadData();
        setSelectedTurnIndices(new Set());
        showToast('명령을 삭제했습니다.', 'success');
      } else {
        const errorMsg = response.reason || '알 수 없는 오류';
        showToast(`명령 삭제 실패: ${errorMsg}`, 'error');
      }
    } catch (error: any) {
      console.error('명령 삭제 실패:', error);
      showToast(`명령 삭제 실패: ${error.message || '알 수 없는 오류'}`, 'error');
    }
  };

  const handleTurnClick = (turnIdx: number, e: React.MouseEvent) => {
    if (!isEditMode && !isBatchMode) return;

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
      // 일반 클릭: 토글
      if (newSelected.has(turnIdx)) {
        newSelected.delete(turnIdx);
      } else {
        newSelected.add(turnIdx);
      }
    }

    setSelectedTurnIndices(newSelected);
  };

  const handleApplyBatchCommand = async () => {
    if (selectedTurnIndices.size === 0) {
      alert('적용할 턴을 선택해주세요.');
      return;
    }

    if (!batchCommand) {
      alert('적용할 명령을 먼저 선택해주세요.');
      return;
    }

    const confirmMsg = `선택한 ${selectedTurnIndices.size}개 턴에 "${batchCommand.brief}" 명령을 일괄 적용하시겠습니까?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const numGeneralID = Number(generalID);
      if (!numGeneralID || numGeneralID === 0 || isNaN(numGeneralID)) {
        alert(`명령 일괄 적용 실패: 장수 ID가 유효하지 않습니다 (generalID: ${generalID})`);
        return;
      }

      const turnList = Array.from(selectedTurnIndices);
      
      const response = await SammoAPI.CommandReserveBulkCommand({
        serverID,
        general_id: numGeneralID,
        commands: [{
          turnList,
          action: batchCommand.action,
          arg: batchCommand.arg,
        }],
      });

      if (response.success) {
        await loadData();
        setSelectedTurnIndices(new Set());
        setBatchCommand(null);
        showToast(`${selectedTurnIndices.size}개 턴에 명령이 일괄 적용되었습니다.`, 'success');
      } else {
        const errorMsg = response.reason || '알 수 없는 오류';
        showToast(`명령 일괄 적용 실패: ${errorMsg}`, 'error');
      }
    } catch (error: any) {
      console.error('명령 일괄 적용 실패:', error);
      showToast(`명령 일괄 적용 실패: ${error.message || '알 수 없는 오류'}`, 'error');
    }
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
      <div className={styles.toolbar}>
        <div className={styles.clock}>
          {serverTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <button
          className={styles.toolbarButton}
          onClick={toggleViewMaxTurn}
        >
          {viewMaxTurn === FLIPPED_MAX_TURN ? '펼치기' : '접기'}
        </button>
        <button
          className={`${styles.toolbarButton} ${isEditMode ? styles.active : ''}`}
          onClick={toggleEditMode}
          title="편집 모드 (턴 선택 가능)"
        >
          {isEditMode ? '편집 완료' : '편집'}
        </button>
        <button 
          className={styles.toolbarButton} 
          disabled={!isEditMode || selectedTurnIndices.size === 0} 
          title="당기기 (선택한 명령을 1턴 앞으로)"
          onClick={handlePullCommand}
        >
          당기기
        </button>
        <button 
          className={styles.toolbarButton} 
          disabled={!isEditMode || selectedTurnIndices.size === 0} 
          title="미루기 (선택한 명령을 1턴 뒤로)"
          onClick={handlePushCommand}
        >
          미루기
        </button>
        <button 
          className={styles.toolbarButton} 
          disabled={!isEditMode || selectedTurnIndices.size === 0} 
          title="삭제 (선택한 명령을 휴식으로 변경)"
          onClick={handleDeleteCommand}
        >
          삭제
        </button>
        <button
          className={`${styles.toolbarButton} ${isBatchMode ? styles.active : ''}`}
          onClick={toggleBatchMode}
          title="일괄 적용 모드 (여러 턴에 동일 명령 적용)"
        >
          {isBatchMode ? '일괄 완료' : '일괄 적용'}
        </button>
        {isBatchMode && (
          <>
            <button 
              className={styles.toolbarButton} 
              onClick={() => {
                setIsDialogOpen(true);
                setEditingTurnIndex(null);
              }}
              title="일괄 적용할 명령 선택"
            >
              {batchCommand ? `명령: ${batchCommand.brief}` : '명령 선택'}
            </button>
            <button 
              className={styles.toolbarButton} 
              disabled={selectedTurnIndices.size === 0 || !batchCommand} 
              title={batchCommand ? `선택한 턴에 "${batchCommand.brief}" 적용` : '명령을 먼저 선택하세요'}
              onClick={handleApplyBatchCommand}
            >
              적용 ({selectedTurnIndices.size}턴)
            </button>
          </>
        )}
      </div>

      {!isDialogOpen && (
        <div className={`${styles.commandTableWrapper} ${viewMaxTurn === MAX_TURN ? styles.scrollable : styles.noScroll}`}>
          <div className={`${styles.commandTable} ${isEditMode || isBatchMode ? styles.isEditMode : ''}`}>
            {/* 턴 번호 */}
            <div className={styles.turnNumberColumn}>
              {displayCommands.map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.turnCell} ${isEditMode || isBatchMode ? styles.turnCellEditable : ''} ${selectedTurnIndices.has(idx) ? styles.selected : ''}`}
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
            {!isEditMode && !isBatchMode && (
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
            turnIndex={editingTurnIndex}
            turnYear={editingTurnIndex !== null ? displayCommands[editingTurnIndex]?.year : undefined}
            turnMonth={editingTurnIndex !== null ? displayCommands[editingTurnIndex]?.month : undefined}
            turnTime={editingTurnIndex !== null ? displayCommands[editingTurnIndex]?.time : undefined}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingTurnIndex(null);
            }}
            onSelectCommand={async (command) => {
              // 일괄 적용 모드인 경우
              if (isBatchMode) {
                if (command.reqArg > 0) {
                  alert('일괄 적용 모드에서는 파라미터가 필요한 명령을 사용할 수 없습니다.');
                  setIsDialogOpen(false);
                  setEditingTurnIndex(null);
                  return;
                }

                setBatchCommand({
                  action: command.value,
                  arg: {},
                  brief: command.simpleName,
                });
                setIsDialogOpen(false);
                setEditingTurnIndex(null);
                alert(`"${command.simpleName}" 명령이 선택되었습니다. 적용할 턴을 선택한 후 "적용" 버튼을 눌러주세요.`);
                return;
              }

              // 기존 단일 턴 수정 모드
              if (editingTurnIndex !== null) {
                // reqArg > 0인 경우 파라미터 입력 페이지로 이동
                if (command.reqArg > 0) {
                  console.log('파라미터 입력 페이지로 이동:', {
                    command: command.value,
                    turnIndex: editingTurnIndex,
                    reqArg: command.reqArg,
                    generalID,
                  });
                  
                  // Close dialog first
                  setIsDialogOpen(false);
                  setEditingTurnIndex(null);
                  
                  // Navigate to parameter input page with generalID and turnIndex
                  router.push(`/${serverID}/processing/${command.value}?turnList=${editingTurnIndex}&is_chief=false&general_id=${generalID}`);
                  return;
                }

                // reqArg === 0인 경우 바로 명령 예약
                try {
                  // generalID 확인 및 숫자 변환
                  const numGeneralID = Number(generalID);
                  if (!numGeneralID || numGeneralID === 0 || isNaN(numGeneralID)) {
                    alert(`명령 예약 실패: 장수 ID가 유효하지 않습니다 (generalID: ${generalID}, 변환: ${numGeneralID})`);
                    return;
                  }
                  
                  console.log('명령 예약 요청 (파라미터 없음):', {
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
          <button
            className={styles.footerButton}
            onClick={() => loadData()}
            title="갱신"
          >
            갱신
          </button>
          <button
            className={styles.footerButton}
            onClick={() => window.location.href = '/'}
            title="로비로"
          >
            로비로
          </button>
        </div>
      )}
    </div>
  );
}
