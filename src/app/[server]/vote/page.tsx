'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface VoteOption {
  optionID?: number;
  text: string;
  count: number;
}

interface VoteComment {
  commentID: number;
  generalID: number;
  generalName: string;
  nationName?: string;
  text: string;
  date: string;
}

interface VoteDetail {
  voteID: number;
  title: string;
  options: VoteOption[];
  multipleOptions?: number;
  endDate?: string;
  isEnded: boolean;
  mySelection?: number[];
  comments?: VoteComment[];
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

// 색상 생성 함수
function formatVoteColor(idx: number): string {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400',
  ];
  return colors[idx % colors.length];
}

function isBrightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export default function VotePage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [voteList, setVoteList] = useState<Map<number, VoteSummary>>(new Map());
  const [currentVoteID, setCurrentVoteID] = useState<number | null>(null);
  const [voteDetail, setVoteDetail] = useState<VoteDetail | null>(null);
  
  // 투표 선택 상태
  const [singlePick, setSinglePick] = useState<number>(0);
  const [multiPick, setMultiPick] = useState<number[]>([]);
  
  // 댓글 상태
  const [newComment, setNewComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // 투표 가능 여부
  const canVote = useMemo(() => {
    if (!voteDetail) return false;
    if (voteDetail.mySelection && voteDetail.mySelection.length > 0) return false;
    if (voteDetail.isEnded) return false;
    return true;
  }, [voteDetail]);

  // 다중 선택 가능 개수
  const maxSelections = useMemo(() => {
    if (!voteDetail) return 1;
    if (voteDetail.multipleOptions === 0) return voteDetail.options.length;
    return voteDetail.multipleOptions || 1;
  }, [voteDetail]);

  // 총 투표수
  const totalVotes = useMemo(() => {
    if (!voteDetail) return 0;
    return voteDetail.options.reduce((sum, opt) => sum + (opt.count || 0), 0);
  }, [voteDetail]);

  // 투표 목록 로드
  const loadVoteList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.VoteGetVoteList();
      if (result.result && result.votes) {
        const newMap = new Map<number, VoteSummary>();
        
        // result.votes가 배열인지 객체인지 확인
        if (Array.isArray(result.votes)) {
          result.votes.forEach((vote: any) => {
            const id = vote.id || vote.voteID;
            newMap.set(id, {
              id,
              title: vote.title || vote.brief,
              startDate: vote.startDate,
              endDate: vote.endDate,
            });
          });
        } else {
          // 객체인 경우 (Vue 버전과 호환)
          Object.entries(result.votes).forEach(([key, vote]: [string, any]) => {
            const id = parseInt(key);
            newMap.set(id, {
              id,
              title: vote.title,
              startDate: vote.startDate,
              endDate: vote.endDate,
            });
          });
        }
        
        setVoteList(newMap);
        
        // 첫 번째 투표 선택
        if (newMap.size > 0 && !currentVoteID) {
          const firstID = newMap.keys().next().value;
          if (firstID !== undefined) {
            setCurrentVoteID(firstID);
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast('투표 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentVoteID, showToast]);

  // 투표 상세 로드
  const loadVoteDetail = useCallback(async (voteID: number) => {
    try {
      const result = await SammoAPI.VoteGetVoteDetail({ voteID, serverID });
      if (result.result && result.vote) {
        setVoteDetail(result.vote);
        // 선택 초기화
        setSinglePick(0);
        setMultiPick([]);
      }
    } catch (err) {
      console.error(err);
      showToast('투표 상세를 불러오는데 실패했습니다.', 'error');
    }
  }, [serverID, showToast]);

  // 투표 제출
  const handleSubmitVote = async () => {
    if (!voteDetail || !canVote || processing) return;
    
    const selection = maxSelections === 1 ? [singlePick] : multiPick;
    
    if (selection.length === 0) {
      showToast('옵션을 선택해주세요.', 'warning');
      return;
    }
    
    try {
      setProcessing(true);
      const result = await SammoAPI.VoteVote({
        voteID: voteDetail.voteID,
        option: selection[0], // 기본 API는 단일 옵션만 지원
      });

      if (result.result) {
        showToast('투표가 완료되었습니다!', 'success');
        loadVoteDetail(voteDetail.voteID);
      } else {
        showToast(result.reason || '투표에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('투표에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // 댓글 제출
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voteDetail || !newComment.trim() || processing) return;
    
    try {
      setProcessing(true);
      const result = await SammoAPI.VoteAddComment({
        voteID: voteDetail.voteID,
        text: newComment,
        serverID,
      });

      if (result.result) {
        showToast('댓글이 등록되었습니다.', 'success');
        setNewComment('');
        loadVoteDetail(voteDetail.voteID);
      } else {
        showToast(result.reason || '댓글 등록에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('댓글 등록에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // 다중 선택 처리
  const handleMultiPickChange = (idx: number, checked: boolean) => {
    if (checked) {
      if (multiPick.length >= maxSelections) {
        showToast(`${maxSelections}개까지만 선택할 수 있습니다.`, 'warning');
        return;
      }
      setMultiPick([...multiPick, idx]);
    } else {
      setMultiPick(multiPick.filter(i => i !== idx));
    }
  };

  // 초기 로드
  useEffect(() => {
    loadVoteList();
  }, [loadVoteList]);

  // 투표 선택 변경 시 상세 로드
  useEffect(() => {
    if (currentVoteID) {
      loadVoteDetail(currentVoteID);
    }
  }, [currentVoteID, loadVoteDetail]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <TopBackBar title="설문 조사" reloadable onReload={loadVoteList} />
        
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-pulse text-gray-400 font-bold">로딩 중...</div>
          </div>
        ) : (
          <>
            {/* 현재 투표 */}
            {voteDetail ? (
              <div className="space-y-4">
                {/* 투표 헤더 */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-blue-600 px-4 py-3 text-center font-bold text-white">
                    설문 조사 (투표 참여 시 금 보상 + 유니크 추첨!)
                  </div>
                  
                  <div className="p-6">
                    {/* 제목 */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-1">설문 제목</div>
                      <h2 className="text-xl font-bold text-white">
                        {voteDetail.title}
                        {maxSelections > 1 && (
                          <span className="text-sm font-normal text-blue-400 ml-2">
                            ({maxSelections}개 선택 가능)
                          </span>
                        )}
                      </h2>
                    </div>
                    
                    {/* 게시자 */}
                    {voteDetail.opener && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">게시자</div>
                        <div className="text-gray-300">{voteDetail.opener}</div>
                      </div>
                    )}

                    {/* 투표 옵션 */}
                    <div className="space-y-2 mb-6">
                      {voteDetail.options.map((option, idx) => {
                        const percent = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0;
                        const bgColor = formatVoteColor(idx);
                        
                        return (
                          <div key={idx} className="relative">
                            <label
                              className={cn(
                                "flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 relative z-10",
                                canVote
                                  ? maxSelections === 1
                                    ? singlePick === idx
                                      ? "bg-blue-900/30 border-blue-500/50"
                                      : "bg-black/20 border-white/5 hover:bg-white/5"
                                    : multiPick.includes(idx)
                                      ? "bg-blue-900/30 border-blue-500/50"
                                      : "bg-black/20 border-white/5 hover:bg-white/5"
                                  : "bg-black/20 border-white/5"
                              )}
                            >
                              {canVote && (
                                maxSelections === 1 ? (
                                  <input
                                    type="radio"
                                    name="vote"
                                    checked={singlePick === idx}
                                    onChange={() => setSinglePick(idx)}
                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 mr-3"
                                  />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={multiPick.includes(idx)}
                                    onChange={(e) => handleMultiPickChange(idx, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 mr-3"
                                  />
                                )
                              )}
                              {!canVote && (
                                <div
                                  className="w-6 h-6 rounded text-center text-xs font-bold flex items-center justify-center mr-3"
                                  style={{
                                    backgroundColor: bgColor,
                                    color: isBrightColor(bgColor) ? '#000' : '#fff',
                                  }}
                                >
                                  {idx + 1}
                                </div>
                              )}
                              <span className="flex-1 text-sm text-gray-300">
                                {typeof option === 'string' ? option : option.text}
                              </span>
                              <span className="text-xs text-gray-500 tabular-nums ml-2">
                                {option.count || 0}명 ({percent.toFixed(1)}%)
                              </span>
                            </label>
                            
                            {/* 결과 프로그레스 바 */}
                            {!canVote && totalVotes > 0 && (
                              <div
                                className="absolute left-0 top-0 bottom-0 rounded-lg opacity-20 transition-all"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: bgColor,
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 투표율 & 버튼 */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="text-sm text-gray-400">
                        투표율: {totalVotes}명
                        {voteDetail.userCnt && (
                          <span> / {voteDetail.userCnt}명 ({((totalVotes / voteDetail.userCnt) * 100).toFixed(1)}%)</span>
                        )}
                      </div>
                      {canVote && (
                        <button
                          type="button"
                          onClick={handleSubmitVote}
                          disabled={processing || (maxSelections === 1 ? false : multiPick.length === 0)}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing ? '처리 중...' : '투표하기'}
                        </button>
                      )}
                      {!canVote && voteDetail.isEnded && (
                        <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded">종료됨</span>
                      )}
                      {!canVote && voteDetail.mySelection && voteDetail.mySelection.length > 0 && (
                        <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-500/30">투표 완료</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2 text-center font-bold text-white border-b border-white/10">
                    댓글
                  </div>
                  
                  <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                    {voteDetail.comments && voteDetail.comments.length > 0 ? (
                      voteDetail.comments.map((comment, idx) => (
                        <div key={comment.commentID || idx} className="flex gap-3 py-2 border-b border-white/5 last:border-b-0">
                          <div className="text-xs text-gray-500 tabular-nums w-6">{idx + 1}.</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {comment.nationName && (
                                <span className="text-xs text-gray-500">{comment.nationName}</span>
                              )}
                              <span className="text-sm font-bold text-gray-300">{comment.generalName}</span>
                              <span className="text-xs text-gray-600">{comment.date?.substring(5, 16)}</span>
                            </div>
                            <div className="text-sm text-gray-400">{comment.text}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        아직 댓글이 없습니다.
                      </div>
                    )}
                  </div>
                  
                  {/* 댓글 입력 */}
                  <form onSubmit={handleSubmitComment} className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="submit"
                        disabled={processing || !newComment.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        댓글 달기
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
                진행중인 설문이 없습니다.
              </div>
            )}

            {/* 이전 설문 목록 */}
            {voteList.size > 0 && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 text-center font-bold text-white">
                  이전 설문 조사
                </div>
                <div className="p-4 space-y-2">
                  {Array.from(voteList.entries()).map(([voteID, vote]) => (
                    <button
                      key={voteID}
                      type="button"
                      onClick={() => setCurrentVoteID(voteID)}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg transition-colors",
                        currentVoteID === voteID
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-black/20 text-gray-400 hover:bg-white/5 hover:text-gray-300"
                      )}
                    >
                      <span className="font-medium">{vote.title}</span>
                      {vote.startDate && (
                        <span className="text-xs text-gray-500 ml-2">({vote.startDate})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
