'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function SecretBoardPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    loadArticles();
  }, [serverID]);

  async function loadArticles() {
    try {
      setLoading(true);
      // API 호출 로직 필요 - isSecret=true로
      setArticles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="기밀실" reloadable onReload={loadArticles} />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.boardHeader}>
            <h2>기밀실</h2>
            <p>수뇌부만 접근 가능한 기밀 게시판입니다.</p>
          </div>
          <div className={styles.articleList}>
            {articles.map((article) => (
              <div key={article.id} className={styles.articleItem}>
                <div className={styles.articleTitle}>{article.title}</div>
                <div className={styles.articleInfo}>
                  작성자: {article.author} | 작성일: {article.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


