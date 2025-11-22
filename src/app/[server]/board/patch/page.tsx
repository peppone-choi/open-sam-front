'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
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

export default function BoardPatchPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [articles, setArticles] = useState<BoardArticle[]>([]);
  const [loading, setLoading] = useState(true);

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
        // 패치 내역만 필터링 (제목에 [패치] 포함)
        const patchArticles = articlesArray.filter((article: BoardArticle) => 
          article.title.includes('[패치]') || article.title.includes('패치')
        );
        setArticles(patchArticles);
      }
    } catch (err) {
      console.error(err);
      alert('게시물을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg sticky top-4 z-10">
           <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              패치 내역
           </h1>
           <button 
              onClick={loadArticles} 
              className="px-3 py-1.5 text-xs font-bold rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
           >
              갱신
           </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500 animate-pulse">로딩 중...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-white/5">
              패치 내역이 없습니다.
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

