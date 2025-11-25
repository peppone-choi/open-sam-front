'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

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

export default function BoardRequestPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [articles, setArticles] = useState<BoardArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newArticle, setNewArticle] = useState({ title: '', text: '' });
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetBoardArticles({ isSecret: false });
      if (result.result) {
        const articlesArray = Array.isArray(result.articles) 
          ? result.articles 
          : Object.values(result.articles || {});
        // 필터링 로직이 필요하다면 추가
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
        isSecret: false,
        title: `[건의/제안] ${newArticle.title}`,
        text: newArticle.text,
        session_id: serverID,
      });

      if (result.result) {
        setNewArticle({ title: '', text: '' });
        setIsWriting(false);
        await loadArticles();
      } else {
        showToast(result.reason || '게시물 등록에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('게시물 등록에 실패했습니다.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg sticky top-4 z-10">
           <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              건의/제안
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
                 {isWriting ? '작성 취소' : '새 건의 작성'}
              </button>
           </div>
        </div>

        {isWriting && (
          <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/5 px-4 py-3 border-b border-white/5 font-bold text-sm text-gray-300">
              새 건의 작성
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
                <textarea
                  placeholder="건의/제안 내용을 상세히 입력해주세요"
                  value={newArticle.text}
                  onChange={(e) => setNewArticle({ ...newArticle, text: e.target.value })}
                  className="w-full min-h-[200px] bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors placeholder-gray-600 resize-y"
                  rows={10}
                />
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
                <div className="bg-white/[0.02] px-4 py-3 border-b border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 border border-white/10 overflow-hidden shrink-0">
                         <img 
                            src={article.author_icon || '/images/default-avatar.png'} 
                            alt={article.author} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }}
                         />
                      </div>
                      <div>
                         <div className="text-sm font-bold text-gray-200">{article.author}</div>
                         <div className="text-[10px] text-gray-500">{article.date}</div>
                      </div>
                   </div>
                   <div className="text-xs text-gray-500">#{article.no}</div>
                </div>
                <div className="p-5">
                   <h3 className="text-lg font-bold text-white mb-4 leading-tight">{article.title}</h3>
                   <div className="text-gray-300 text-sm leading-relaxed space-y-2 break-words prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: article.text }} />
                </div>
                {article.comment && article.comment.length > 0 && (
                  <div className="bg-black/20 border-t border-white/5 divide-y divide-white/5">
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

