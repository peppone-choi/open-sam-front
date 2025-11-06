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

export default function BoardTipPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [articles, setArticles] = useState<BoardArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newArticle, setNewArticle] = useState({ title: '', text: '' });

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
        setArticles(articlesArray);
      }
    } catch (err) {
      console.error(err);
      alert('게시물을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function submitArticle() {
    if (!newArticle.title || !newArticle.text) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      const result = await SammoAPI.PostBoardArticle({
        isSecret: false,
        title: `[팁/강좌] ${newArticle.title}`,
        text: newArticle.text,
      });

      if (result.result) {
        setNewArticle({ title: '', text: '' });
        await loadArticles();
      } else {
        alert(result.reason || '게시물 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('게시물 등록에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="팁/강좌" reloadable onReload={loadArticles} />

      <div id="newArticle" className="bg0">
        <div className={`${styles.newArticleHeader} bg2 center`}>새 게시물 작성</div>
        <div className={styles.newArticleForm}>
          <div className={`${styles.formRow} row`}>
            <div className={`${styles.label} bg1 center`}>제목</div>
            <div className={styles.input}>
              <input
                type="text"
                maxLength={250}
                placeholder="제목"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                className={styles.titleInput}
              />
            </div>
          </div>
          <div className={`${styles.formRow} row`}>
            <div className={`${styles.label} bg1 center`}>내용</div>
            <div className={styles.input}>
              <textarea
                placeholder="팁이나 강좌 내용을 입력해주세요"
                value={newArticle.text}
                onChange={(e) => setNewArticle({ ...newArticle, text: e.target.value })}
                className={styles.contentInput}
                rows={10}
              />
            </div>
          </div>
          <div className={styles.submitRow}>
            <button type="button" onClick={submitArticle} className={styles.submitBtn}>
              등록
            </button>
          </div>
        </div>
      </div>

      <div id="board" className={styles.board}>
        {loading ? (
          <div className="center">로딩 중...</div>
        ) : articles.length === 0 ? (
          <div className="center">게시물이 없습니다.</div>
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

