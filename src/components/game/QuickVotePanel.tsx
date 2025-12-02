/**
 * 빠른 투표 참여 패널
 * 대시보드에서 바로 투표에 참여할 수 있는 컴팩트 UI
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import type { ColorSystem } from '@/types/colorSystem';

interface VoteOption {
  optionID?: number;
  text: string;
  count: number;
}

interface VoteDetail {
  voteID: number;
  title: string;
  options: VoteOption[];
  multipleOptions?: number;
  endDate?: string;
  isEnded: boolean;
  mySelection?: number[];
  totalVotes?: number;
  userCnt?: number;
  opener?: string;
}

interface VoteSummary {
  id: number;
  title: string;
  startDate?: string;
  endDate?: string;
}

// 투표 옵션 색상
const VOTE_COLORS = [
  '#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#6366F1', '#EC4899', '#14B8A6',
];

interface QuickVotePanelProps {
  serverID: string;
  colorSystem?: ColorSystem;
  className?: string;
  compact?: boolean;
  onVoteComplete?: () => void;
}

export function QuickVotePanel({
  serverID,
  colorSystem,
  className,
  compact = false,
  onVoteComplete,
}: QuickVotePanelProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voteList, setVoteList] = useState<VoteSummary[]>([]);
  const [currentVote, setCurrentVote] = useState<VoteDetail | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [multipleSelections, setMultipleSelections] = useState<number[]>([]);
  const [showAllVotes, setShowAllVotes] = useState(false);

  // 투표 가능 여부
  const canVote = useMemo(() => {
    if (!currentVote) return false;
    if (currentVote.mySelection && currentVote.mySelection.length > 0) return false;
    if (currentVote.isEnded) return false;
    return true;
  }, [currentVote]);

  // 다중 선택 가능 개수
  const maxSelections = useMemo(() => {
    if (!currentVote) return 1;
    if (currentVote.multipleOptions === 0) return currentVote.options.length;
    return currentVote.multipleOptions || 1;
  }, [currentVote]);

  // 총 투표수
  const totalVotes = useMemo(() => {
    if (!currentVote) return 0;
    return currentVote.options.reduce((sum, opt) => sum + (opt.count || 0), 0);
  }, [currentVote]);

  // 투표 목록 로드
  const loadVoteList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.VoteGetVoteList();
      
      if (result.result && result.votes) {
        const votes: VoteSummary[] = [];
        
        if (Array.isArray(result.votes)) {
          result.votes.forEach((vote: any) => {
            votes.push({
              id: vote.id || vote.voteID,
              title: vote.title || vote.brief,
              startDate: vote.startDate,
              endDate: vote.endDate,
            });
          });
        } else {
          Object.entries(result.votes).forEach(([key, vote]: [string, any]) => {
            votes.push({
              id: parseInt(key),
              title: vote.title,
              startDate: vote.startDate,
              endDate: vote.endDate,
            });
          });
        }

        setVoteList(votes);

        // 첫 번째 투표 상세 로드
        if (votes.length > 0) {
          await loadVoteDetail(votes[0].id);
        }
      }
    } catch (err) {
      console.error('투표 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  // 투표 상세 로드
  const loadVoteDetail = useCallback(async (voteID: number) => {
    try {
      const result = await SammoAPI.VoteGetVoteDetail({ voteID, serverID });
      if (result.result && result.vote) {
        setCurrentVote(result.vote);
        setSelectedOption(null);
        setMultipleSelections([]);
      }
    } catch (err) {
      console.error('투표 상세 로드 실패:', err);
    }
  }, [serverID]);

  // 투표 제출
  const handleSubmitVote = async () => {
    if (!currentVote || !canVote || submitting) return;

    const selection = maxSelections === 1 ? selectedOption : multipleSelections[0];
    
    if (selection === null || selection === undefined) {
      showToast('옵션을 선택해주세요.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const result = await SammoAPI.VoteVote({
        voteID: currentVote.voteID,
        option: selection,
      });

      if (result.result) {
        showToast('투표가 완료되었습니다! 🗳️', 'success');
        await loadVoteDetail(currentVote.voteID);
        onVoteComplete?.();
      } else {
        showToast(result.reason || '투표에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('투표 실패:', err);
      showToast('투표에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 다중 선택 핸들러
  const handleMultipleSelect = (idx: number, checked: boolean) => {
    if (checked) {
      if (multipleSelections.length >= maxSelections) {
        showToast(`최대 ${maxSelections}개까지만 선택할 수 있습니다.`, 'warning');
        return;
      }
      setMultipleSelections([...multipleSelections, idx]);
    } else {
      setMultipleSelections(multipleSelections.filter((i) => i !== idx));
    }
  };

  // 초기 로드
  useEffect(() => {
    loadVoteList();
  }, [loadVoteList]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={cn(
        'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
        className,
      )}>
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
        </div>
      </div>
    );
  }

  // 투표 없음
  if (!currentVote) {
    return (
      <div className={cn(
        'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
        className,
      )}>
        <div className="p-4 text-center">
          <div className="text-3xl mb-2">🗳️</div>
          <div className="text-sm text-gray-400">진행 중인 투표가 없습니다</div>
          <Link
            href={`/${serverID}/vote`}
            className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
          >
            이전 투표 보기 →
          </Link>
        </div>
      </div>
    );
  }

  // 컴팩트 모드
  if (compact) {
    return (
      <div className={cn(
        'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
        className,
      )}>
        {/* 헤더 */}
        <div className="px-4 py-3 border-b border-white/10 bg-purple-500/10">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>🗳️</span>
              진행 중 투표
              {!canVote && currentVote.mySelection?.length ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">완료</span>
              ) : null}
            </h3>
            <Link
              href={`/${serverID}/vote`}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              전체 보기
            </Link>
          </div>
        </div>

        {/* 투표 제목 */}
        <div className="p-3">
          <div className="text-sm font-medium text-white mb-2 line-clamp-2">
            {currentVote.title}
          </div>

          {/* 결과 또는 옵션 */}
          {!canVote ? (
            // 결과 표시
            <div className="space-y-1.5">
              {currentVote.options.slice(0, 3).map((option, idx) => {
                const percent = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0;
                const isMySelection = currentVote.mySelection?.includes(idx);
                
                return (
                  <VoteResultBar
                    key={idx}
                    text={typeof option === 'string' ? option : option.text}
                    percent={percent}
                    count={option.count || 0}
                    color={VOTE_COLORS[idx % VOTE_COLORS.length]}
                    isSelected={isMySelection}
                    compact
                  />
                );
              })}
              {currentVote.options.length > 3 && (
                <div className="text-[10px] text-gray-500 text-center">
                  +{currentVote.options.length - 3}개 옵션 더 보기
                </div>
              )}
            </div>
          ) : (
            // 투표 옵션
            <div className="space-y-1.5">
              {currentVote.options.slice(0, 4).map((option, idx) => (
                <label
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                    (maxSelections === 1 ? selectedOption === idx : multipleSelections.includes(idx))
                      ? 'bg-purple-500/20 border border-purple-500/40'
                      : 'bg-black/20 border border-white/5 hover:bg-black/30',
                  )}
                >
                  <input
                    type={maxSelections === 1 ? 'radio' : 'checkbox'}
                    name="vote-option"
                    checked={maxSelections === 1 ? selectedOption === idx : multipleSelections.includes(idx)}
                    onChange={(e) => {
                      if (maxSelections === 1) {
                        setSelectedOption(idx);
                      } else {
                        handleMultipleSelect(idx, e.target.checked);
                      }
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs text-gray-300 truncate">
                    {typeof option === 'string' ? option : option.text}
                  </span>
                </label>
              ))}
              
              <button
                type="button"
                onClick={handleSubmitVote}
                disabled={submitting || (maxSelections === 1 ? selectedOption === null : multipleSelections.length === 0)}
                className={cn(
                  'w-full py-2 rounded-lg text-xs font-bold transition-all',
                  'bg-purple-600 hover:bg-purple-500 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {submitting ? '처리 중...' : '투표하기'}
              </button>
            </div>
          )}

          {/* 투표율 */}
          <div className="mt-2 text-[10px] text-gray-500 text-center">
            참여: {totalVotes}명
            {currentVote.userCnt && ` / ${currentVote.userCnt}명 (${Math.round((totalVotes / currentVote.userCnt) * 100)}%)`}
          </div>
        </div>
      </div>
    );
  }

  // 전체 모드
  return (
    <div className={cn(
      'rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur overflow-hidden',
      className,
    )}>
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-white/10 bg-purple-500/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <span className="text-lg">🗳️</span>
            설문 조사
            {canVote && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 animate-pulse">
                참여 가능
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadVoteList}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-gray-400"
              aria-label="새로고침"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>
            <Link
              href={`/${serverID}/vote`}
              className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-purple-400 transition-colors"
            >
              전체 보기 →
            </Link>
          </div>
        </div>
      </div>

      {/* 투표 목록 선택 (여러 개일 때) */}
      {voteList.length > 1 && (
        <div className="px-4 py-2 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {voteList.map((vote) => (
              <button
                key={vote.id}
                type="button"
                onClick={() => loadVoteDetail(vote.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all',
                  currentVote?.voteID === vote.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10',
                )}
              >
                {vote.title.length > 15 ? `${vote.title.slice(0, 15)}...` : vote.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 투표 콘텐츠 */}
      <div className="p-4">
        {/* 투표 제목 */}
        <div className="mb-4">
          <h4 className="font-bold text-white mb-1">{currentVote.title}</h4>
          {currentVote.opener && (
            <div className="text-[11px] text-gray-500">게시자: {currentVote.opener}</div>
          )}
          {maxSelections > 1 && (
            <div className="text-[11px] text-purple-400 mt-1">
              최대 {maxSelections}개 선택 가능
            </div>
          )}
        </div>

        {/* 상태 뱃지 */}
        <div className="flex items-center gap-2 mb-4">
          {currentVote.isEnded && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">종료됨</span>
          )}
          {!canVote && currentVote.mySelection?.length && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">투표 완료</span>
          )}
        </div>

        {/* 투표 옵션 */}
        <AnimatePresence mode="wait">
          {canVote ? (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {currentVote.options.map((option, idx) => (
                <label
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                    (maxSelections === 1 ? selectedOption === idx : multipleSelections.includes(idx))
                      ? 'bg-purple-500/20 border-2 border-purple-500/50'
                      : 'bg-black/20 border-2 border-transparent hover:bg-black/30',
                  )}
                >
                  <input
                    type={maxSelections === 1 ? 'radio' : 'checkbox'}
                    name="vote-option-full"
                    checked={maxSelections === 1 ? selectedOption === idx : multipleSelections.includes(idx)}
                    onChange={(e) => {
                      if (maxSelections === 1) {
                        setSelectedOption(idx);
                      } else {
                        handleMultipleSelect(idx, e.target.checked);
                      }
                    }}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="flex-1 text-sm text-gray-300">
                    {typeof option === 'string' ? option : option.text}
                  </span>
                </label>
              ))}

              <button
                type="button"
                onClick={handleSubmitVote}
                disabled={submitting || (maxSelections === 1 ? selectedOption === null : multipleSelections.length === 0)}
                className={cn(
                  'w-full py-3 rounded-lg text-sm font-bold transition-all mt-4',
                  'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
                  'text-white shadow-lg shadow-purple-500/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                )}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    처리 중...
                  </span>
                ) : (
                  '투표하기 🗳️'
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {currentVote.options.map((option, idx) => {
                const percent = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0;
                const isMySelection = currentVote.mySelection?.includes(idx);
                
                return (
                  <VoteResultBar
                    key={idx}
                    text={typeof option === 'string' ? option : option.text}
                    percent={percent}
                    count={option.count || 0}
                    color={VOTE_COLORS[idx % VOTE_COLORS.length]}
                    isSelected={isMySelection}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 투표율 */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
          <span>
            참여: <span className="text-white font-medium">{totalVotes}</span>명
            {currentVote.userCnt && (
              <span> / {currentVote.userCnt}명</span>
            )}
          </span>
          {currentVote.userCnt && (
            <span className="text-purple-400">
              {Math.round((totalVotes / currentVote.userCnt) * 100)}% 참여
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// 투표 결과 바
function VoteResultBar({
  text,
  percent,
  count,
  color,
  isSelected,
  compact = false,
}: {
  text: string;
  percent: number;
  count: number;
  color: string;
  isSelected?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      'relative rounded-lg overflow-hidden',
      compact ? 'py-1.5 px-2' : 'py-2.5 px-3',
      isSelected && 'ring-2 ring-purple-500/50',
    )}>
      {/* 배경 바 */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      
      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSelected && (
            <span className="text-purple-400">✓</span>
          )}
          <span className={cn(
            'text-white',
            compact ? 'text-[11px]' : 'text-sm',
            isSelected && 'font-medium',
          )}>
            {text}
          </span>
        </div>
        <div className={cn(
          'tabular-nums',
          compact ? 'text-[10px]' : 'text-xs',
        )}>
          <span className="text-white font-medium">{percent.toFixed(1)}%</span>
          <span className="text-gray-500 ml-1">({count})</span>
        </div>
      </div>
    </div>
  );
}

export default QuickVotePanel;


