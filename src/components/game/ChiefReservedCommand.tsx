'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './PartialReservedCommand.module.css';
import CommandSelectDialog from './CommandSelectDialog';
import type { ColorSystem } from '@/types/colorSystem';

interface ChiefReservedCommandProps {
  serverID: string;
  colorSystem?: ColorSystem;
}

interface ChiefTurnCommand {
  action: string;
  brief: string;
  arg: any;
  year?: number;
  month?: number;
  time?: string;
}

interface CommandItem {
  value: string;
  simpleName: string;
  reqArg: number;
  possible: boolean;
  compensation: number;
  title: string;
}

interface CommandTableCategory {
  category: string;
  values: CommandItem[];
}

const MAX_CHIEF_TURN = 2; // GameConst.maxChiefTurn와 동일하게 유지

export default function ChiefReservedCommand({ serverID, colorSystem }: ChiefReservedCommandProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChiefTurnCommand[]>([]);
  const [officerLevel, setOfficerLevel] = useState<number | null>(null);
  const [isChief, setIsChief] = useState(false);
  const [serverTime, setServerTime] = useState<Date>(new Date());

  const [generalId, setGeneralId] = useState<number | null>(null);
  const [commandTable, setCommandTable] = useState<CommandTableCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurnIndex, setEditingTurnIndex] = useState<number | null>(null);
  const [selectedTurns, setSelectedTurns] = useState<number[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 국가/사령턴 정보
      const nationTurnPromise = SammoAPI.NationCommandGetReservedCommand({ serverID });
      // 내 기본 정보 (장수 ID, 수뇌 여부)
      const basicInfoPromise = SammoAPI.GetBasicInfo({ session_id: serverID });

      const [nationTurn, basicInfo] = await Promise.all([nationTurnPromise, basicInfoPromise]);

      if (!basicInfo.result) {
        throw new Error('게임 정보를 불러오는데 실패했습니다.');
      }

      setIsChief(basicInfo.isChief);
      setOfficerLevel(basicInfo.officerLevel ?? null);
      setGeneralId(basicInfo.generalID ?? null);

      if (!nationTurn.success || !nationTurn.result) {
        setError(nationTurn.message || '사령턴 정보를 불러오는데 실패했습니다.');
        setTurns([]);
      } else {
        setServerTime(new Date(nationTurn.date || new Date()));

        let targetChief: any = null;
        if (nationTurn.chiefList) {
          if (nationTurn.officerLevel && nationTurn.chiefList[nationTurn.officerLevel]) {
            targetChief = nationTurn.chiefList[nationTurn.officerLevel];
          } else {
            const levels = Object.keys(nationTurn.chiefList);
            if (levels.length > 0) {
              targetChief = nationTurn.chiefList[Number(levels[0])];
            }
          }
        }

        const baseTime = new Date(nationTurn.lastExecute || new Date());
        const termMinutes = nationTurn.turnTerm || 60;
        const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const cmds: ChiefTurnCommand[] = [];

        for (let idx = 0; idx < MAX_CHIEF_TURN; idx++) {
          const turnObj = targetChief?.turn?.[idx] || {
            action: '휴식',
            brief: '휴식',
            arg: {},
          };

          const turnTime = new Date(baseTime.getTime() + (idx + 1) * termMinutes * 60 * 1000);
          const timeStr = kstFormatter.format(turnTime);

          cmds.push({
            ...turnObj,
            year: nationTurn.year,
            month: nationTurn.month,
            time: timeStr,
          });
        }

        setTurns(cmds);
      }

      // 사령부 전용 명령 테이블 (NationCommand의 commandList 사용)
      if (nationTurn.commandList && Array.isArray(nationTurn.commandList)) {
        setCommandTable(nationTurn.commandList as CommandTableCategory[]);
      } else {
        setCommandTable([]);
      }
    } catch (err: any) {
      console.error('[ChiefReservedCommand] loadData error:', err);
      setError(err.message || '사령턴 정보를 불러오는데 실패했습니다.');
      setTurns([]);
      setCommandTable([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!serverID) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverID]);

  const openDialogForTurn = (idx: number) => {
    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      return;
    }

    // 선택이 없다면 클릭한 턴만 선택
    setSelectedTurns((prev) => (prev.length === 0 ? [idx] : prev));
    setEditingTurnIndex(idx);
    setIsDialogOpen(true);
  };

  const handleSelectCommand = async (command: CommandItem) => {
    if (editingTurnIndex === null) return;

    if (!isChief) {
      alert('사령턴 편집 권한이 없습니다.');
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns([]);
      return;
    }

    const turnList = (selectedTurns.length > 0 ? selectedTurns : [editingTurnIndex]).sort((a, b) => a - b);

    // 파라미터가 필요한 명령(reqArg > 0)은 /processing으로 보내서 인자를 입력받는다
    if (command.reqArg > 0) {
      const turnListParam = turnList.join('_');
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns([]);
      router.push(
        `/${serverID}/processing/${encodeURIComponent(command.value)}?turnList=${turnListParam}&is_chief=true`
      );
      return;
    }

    // 인자 없는 명령은 즉시 NationCommand로 예약 (복수 턴이면 일괄 예약)
    try {
      let result;
      if (turnList.length > 1) {
        result = await SammoAPI.NationCommandReserveBulkCommand({
          serverID,
          commands: [
            {
              turnList,
              action: command.value,
              arg: {},
            },
          ],
        });
      } else {
        result = await SammoAPI.NationCommandReserveCommand({
          serverID,
          action: command.value,
          turnList,
          arg: {},
        });
      }

      if (result.success && result.result) {
        await loadData();
      } else {
        alert(result.reason || result.message || '사령턴 등록에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('[ChiefReservedCommand] handleSelectCommand error:', err);
      alert(err.message || '사령턴 등록에 실패했습니다.');
    } finally {
      setIsDialogOpen(false);
      setEditingTurnIndex(null);
      setSelectedTurns([]);
    }
  };

  if (loading && turns.length === 0) {
    return (
      <div
        className={styles.commandPad}
        style={{
          borderColor: colorSystem?.border,
          backgroundColor: colorSystem?.pageBg,
        }}
      >
        <div
          className={styles.header}
          style={{
            backgroundColor: colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
            fontWeight: 'bold',
          }}
        >
          <h4>사령턴</h4>
        </div>
        <div
          className={styles.content}
          style={{
            color: colorSystem?.textMuted,
            backgroundColor: colorSystem?.pageBg,
          }}
        >
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={styles.commandPad}
        style={{
          borderColor: colorSystem?.border,
          backgroundColor: colorSystem?.pageBg,
        }}
      >
        <div
          className={styles.header}
          style={{
            backgroundColor: colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
            fontWeight: 'bold',
          }}
        >
          <h4>사령턴</h4>
        </div>
        <div
          className={styles.content}
          style={{
            color: colorSystem?.textMuted,
            backgroundColor: colorSystem?.pageBg,
          }}
        >
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.commandPad}
      style={{
        borderColor: colorSystem?.border,
        color: colorSystem?.text,
        backgroundColor: colorSystem?.pageBg,
      }}
    >
      <div className={styles.toolbar}>
        <div className={styles.clock}>
          {serverTime.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        {officerLevel && (
          <span style={{ fontSize: '0.75rem' }}>내 관직 레벨: {officerLevel}</span>
        )}
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => setSelectedTurns([])}
          disabled={selectedTurns.length === 0}
        >
          선택 해제
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={async () => {
            if (!isChief) {
              alert('사령턴 편집 권한이 없습니다.');
              return;
            }
            const input = window.prompt('반복 간격을 입력하세요 (1~12 턴)', '1');
            if (input === null) return;
            const amount = parseInt(input, 10);
            if (!Number.isInteger(amount) || amount < 1 || amount > 12) {
              alert('1~12 사이의 정수를 입력해주세요.');
              return;
            }
            try {
              const res = await SammoAPI.NationCommandRepeatCommand({
                serverID,
                amount,
              });
              if (res.success) {
                await loadData();
              } else {
                alert(res.message || '반복 적용에 실패했습니다.');
              }
            } catch (err: any) {
              console.error('[ChiefReservedCommand] repeat error:', err);
              alert(err.message || '반복 적용에 실패했습니다.');
            }
          }}
          disabled={!isChief}
        >
          반복
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={async () => {
            if (!isChief) {
              alert('사령턴 편집 권한이 없습니다.');
              return;
            }
            const input = window.prompt('당기기(+n) / 미루기(-n) 값을 입력하세요 (-12 ~ 12, 0 제외)', '1');
            if (input === null) return;
            const amount = parseInt(input, 10);
            if (!Number.isInteger(amount) || amount === 0 || amount < -12 || amount > 12) {
              alert('-12 ~ 12 사이의 0이 아닌 정수를 입력해주세요.');
              return;
            }
            try {
              const res = await SammoAPI.NationCommandPushCommand({
                serverID,
                amount,
              });
              if (res.success) {
                await loadData();
              } else {
                alert(res.message || '당기기/미루기에 실패했습니다.');
              }
            } catch (err: any) {
              console.error('[ChiefReservedCommand] push/pull error:', err);
              alert(err.message || '당기기/미루기에 실패했습니다.');
            }
          }}
          disabled={!isChief}
        >
          당기기/미루기
        </button>
        <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
          선택: {selectedTurns.length}턴
        </span>
        {!isChief && (
          <span style={{ fontSize: '0.75rem', color: '#f87171', marginLeft: '0.5rem' }}>
            (수뇌가 아니라 편집이 제한됩니다)
          </span>
        )}
      </div>

      {!isDialogOpen && (
        <div className={`${styles.commandTableWrapper} ${styles.noScroll}`}>
          <div
            className={styles.commandTable}
            style={{
              backgroundColor: colorSystem?.pageBg,
            }}
          >
            {/* 턴 번호 */}
            <div className={styles.turnNumberColumn}>
              {turns.map((_, idx) => (
                <div
                  key={idx}
                  className={`${styles.turnCell} ${selectedTurns.includes(idx) ? 'selected' : ''}`}
                  style={{
                    backgroundColor: 'transparent',
                    color: colorSystem?.text,
                    borderColor: colorSystem?.border,
                  }}
                  onClick={() => {
                    setSelectedTurns((prev) =>
                      prev.includes(idx) ? prev.filter((t) => t !== idx) : [...prev, idx]
                    );
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* 년월 */}

            <div className={styles.yearMonthColumn}>
              {turns.map((cmd, idx) => (
                <div
                  key={idx}
                  className={styles.yearMonthCell}
                  style={{
                    backgroundColor: 'transparent',
                    color: colorSystem?.text,
                    borderColor: colorSystem?.border,
                  }}
                >
                  {cmd.year && cmd.month ? `${cmd.year}年 ${cmd.month}月` : ''}
                </div>
              ))}
            </div>

            {/* 시간 */}
            <div className={styles.timeColumn}>
              {turns.map((cmd, idx) => (
                <div
                  key={idx}
                  className={styles.timeCell}
                  style={{
                    backgroundColor: 'transparent',
                    color: colorSystem?.text,
                    borderColor: colorSystem?.border,
                  }}
                >
                  {cmd.time ?? ''}
                </div>
              ))}
            </div>

            {/* 명령 */}
            <div className={styles.commandColumn}>
              {turns.map((cmd, idx) => {
                const briefText =
                  typeof cmd.brief === 'string'
                    ? cmd.brief
                    : cmd.brief
                    ? String(cmd.brief)
                    : '휴식';
                return (
                  <div
                    key={idx}
                    className={styles.commandCell}
                    title={briefText}
                    style={{
                      backgroundColor: 'transparent',
                      color: colorSystem?.text,
                      borderColor: colorSystem?.border,
                    }}
                  >
                    {briefText}
                  </div>
                );
              })}
            </div>

            {/* 수정 버튼 */}
            <div className={styles.actionColumn}>
              {turns.map((_, idx) => (
                <div
                  key={idx}
                  className={styles.actionCell}
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colorSystem?.border,
                  }}
                >
                  <button
                    type="button"
                    className={styles.editButton}
                    disabled={!isChief}
                    title={
                      isChief
                        ? '사령턴 수정'
                        : '수뇌가 아니라 사령턴을 수정할 수 없습니다.'
                    }
                    style={{
                      backgroundColor: colorSystem?.buttonBg,
                      color: colorSystem?.buttonText,
                      borderColor: colorSystem?.border,
                    }}
                    onClick={() => openDialogForTurn(idx)}
                  >
                    ✎
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isDialogOpen && (
        <div className={styles.dialogWrapper}>
          <CommandSelectDialog
            commandTable={commandTable}
            isOpen={isDialogOpen}
            turnIndex={editingTurnIndex ?? undefined}
            turnYear={editingTurnIndex !== null ? turns[editingTurnIndex]?.year : undefined}
            turnMonth={editingTurnIndex !== null ? turns[editingTurnIndex]?.month : undefined}
            turnTime={editingTurnIndex !== null ? turns[editingTurnIndex]?.time : undefined}
            nationColor={undefined}
            colorSystem={colorSystem}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingTurnIndex(null);
            }}
            onSelectCommand={handleSelectCommand}
          />
        </div>
      )}
    </div>
  );
}
