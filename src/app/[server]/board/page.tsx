'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { cn } from '@/lib/utils';
import GamePageLayout from '@/components/layout/GamePageLayout';
import { useToast } from '@/contexts/ToastContext';

interface BoardArticle {
  no: number;
  nation_no: number;
  is_secret?: boolean;
  date: string;
  general_no: number;
  author: string;
  author_icon: string;
  title: string;
  text: string;
  comment: BoardComment[];
}

interface BoardComment {
  no: number;
  date: string;
  author: string;
  text: string;
}

function BoardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const isSecret = searchParams?.get('isSecret') === 'true';
  const { showToast } = useToast();

  const [articles, setArticles] = useState<BoardArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newArticle, setNewArticle] = useState({ title: '', text: '' });
  const [newComments, setNewComments] = useState<Record<number, string>>({});
  const [isWriting, setIsWriting] = useState(false);


  useEffect(() => {
    loadArticles();
  }, [isSecret]);

  async function loadArticles() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBoardArticles({ isSecret, session_id: serverID });
      if (result.result) {
        // articles가 객체일 수도 있고 배열일 수도 있음
        const articlesArray = Array.isArray(result.articles)
          ? result.articles
          : Object.values(result.articles || {});
        setArticles(articlesArray);
      }
    } catch (err) {
      console.error(err);
      showToast('게시물을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function submitArticle() {
    if (!newArticle.title || !newArticle.text) {
      showToast('제목과 내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      const result = await SammoAPI.PostBoardArticle({
        isSecret,
        title: newArticle.title,
        text: newArticle.text,
        session_id: serverID,
      });

      if (result.result) {
        setNewArticle({ title: '', text: '' });
        setIsWriting(false);
        showToast('게시물이 등록되었습니다.', 'success');
        await loadArticles();
      } else {
        showToast(result.reason || '게시물 등록에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('게시물 등록 중 오류가 발생했습니다.', 'error');
    }
  }

  async function submitComment(articleNo: number) {
    const text = newComments[articleNo]?.trim();
    if (!text) {
      showToast('댓글 내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      const result = await SammoAPI.PostBoardComment({
        documentNo: articleNo,
        text,
        isSecret,
        session_id: serverID,
      });

      if (result.result) {
        setNewComments((prev) => ({ ...prev, [articleNo]: '' }));
        showToast('댓글이 등록되었습니다.', 'success');
        await loadArticles();
      } else {
        showToast(result.reason || '댓글 등록에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('댓글 등록 중 오류가 발생했습니다.', 'error');
    }
  }


  const title = isSecret ? '기밀실' : '회의실';

  return (
    <div className="font-sans h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg sticky top-4 z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", isSecret ? "bg-red-500" : "bg-blue-500")}></span>
            {title}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={loadArticles}
              className="px-3 py-1.5 text-xs font-bold rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              갱신
            </button>
            <button
              onClick={() => setIsWriting(!isWriting)}
              className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              {isWriting ? '작성 취소' : '새 글 작성'}
            </button>
          </div>
        </div>

        {/* Write Form */}
        {isWriting && (
          <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/5 px-4 py-3 border-b border-white/5 font-bold text-sm text-gray-300">
              새 게시물 작성
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">제목</label>
                <input
                  type="text"
                  maxLength={250}
                  placeholder="제목을 입력하세요"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors placeholder-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">내용</label>
                <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden min-h-[200px]">
                  <TipTapEditor
                    content={newArticle.text}
                    onChange={(content) => setNewArticle({ ...newArticle, text: content })}
                    placeholder="내용을 입력하세요..."
                    serverID={serverID}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={submitArticle}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20"
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500 animate-pulse">로딩 중...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5">
              게시물이 없습니다.
            </div>
          ) : (
            articles.map((article) => (
              <div key={article.no} className="group bg-gray-900/40 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-lg">
                {/* Article Header */}
                <div className="bg-white/[0.02] px-4 py-3 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-800 border border-white/10 overflow-hidden shrink-0">
                      <img
                        src={article.author_icon || '/default_portrait.png'}
                        alt={article.author}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default_portrait.png';
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-200">{article.author}</div>
                      <div className="text-[10px] text-gray-500">{article.date}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">#{article.no}</div>
                </div>

                {/* Article Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-4 leading-tight">{article.title}</h3>
                  <div className="text-gray-300 text-sm leading-relaxed space-y-2 break-words prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: article.text }} />
                </div>

                {/* Comments Section */}
                <div className="bg-black/20 border-t border-white/5">
                  {article.comment && article.comment.length > 0 && (
                    <div className="divide-y divide-white/5">
                      {article.comment.map((comment: BoardComment) => (
                        <div key={comment.no} className="px-5 py-3 flex gap-3 hover:bg-white/[0.02] transition-colors">
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between mb-1">
                              <span className="text-xs font-bold text-blue-400">{comment.author}</span>
                              <span className="text-[10px] text-gray-600">{comment.date.slice(5, 16)}</span>
                            </div>
                            <div className="text-sm text-gray-400 leading-snug whitespace-pre-wrap break-words">{comment.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="p-3 flex gap-2 bg-black/10">
                    <input
                      type="text"
                      placeholder="댓글을 입력하세요..."
                      value={newComments[article.no] || ''}
                      onChange={(e) =>
                        setNewComments((prev) => ({ ...prev, [article.no]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          submitComment(article.no);
                        }
                      }}
                      className="flex-1 bg-gray-800/50 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:bg-gray-800 focus:border-blue-500/50 transition-colors placeholder-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => submitComment(article.no)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded transition-colors"
                    >
                      등록
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


export default function BoardPage() {
  return (
    <GamePageLayout>
      <Suspense fallback={<div className="p-8 text-center text-white">로딩 중...</div>}>
        <BoardContent />
      </Suspense>
    </GamePageLayout>
  );
}





