'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from '../page.module.css';

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
    <div className={styles.container}>
      <TopBackBar title="패치 내역" reloadable onReload={loadArticles} />

      <div id="board" className={styles.board}>
        {loading ? (
          <div className="center">로딩 중...</div>
        ) : articles.length === 0 ? (
          <div className="center">패치 내역이 없습니다.</div>
        ) : (
          articles.map((article) => (
            <div key={article.no} className={styles.article}>
              <div className={`${styles.articleHeader} bg1`}>
                <div className={styles.authorName}>{article.author}</div>
                <div className={styles.articleTitle}>{article.title}</div>
                <div className={styles.date}>{article.date.slice(5, 16)}</div>
              </div>
              <div className={styles.articleContent}>
                <div className={styles.authorIcon}>
                  <img src={article.author_icon || '/images/default-avatar.png'} alt={article.author} width="64" height="64" />
                </div>
                <div className={styles.text} dangerouslySetInnerHTML={{ __html: article.text }} />
                {article.comment && article.comment.length > 0 && (
                  <div className={styles.comments}>
                    {article.comment.map((comment: BoardComment) => (
                      <div key={comment.no} className={styles.commentItem}>
                        <div className={styles.commentAuthor}>{comment.author}</div>
                        <div className={styles.commentText}>{comment.text}</div>
                        <div className={styles.commentDate}>{comment.date.slice(5, 16)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

