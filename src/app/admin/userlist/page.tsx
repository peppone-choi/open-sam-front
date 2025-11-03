'use client';

import React, { useState, useEffect } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminUserListPage() {
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    loadUserList();
  }, []);

  async function loadUserList() {
    try {
      setLoading(true);
      // API 호출 로직 필요
      setUserList([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUserAction(action: string, userID?: number) {
    try {
      // API 호출 로직 필요
      alert('처리되었습니다.');
      await loadUserList();
    } catch (err) {
      console.error(err);
      alert('처리에 실패했습니다.');
    }
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="관리자 사용자 목록" />
      {loading ? (
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      ) : (
        <div className={styles.content}>
          <div className={styles.userList}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>등급</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user) => (
                  <tr key={user.no}>
                    <td>{user.name}</td>
                    <td>{user.grade}</td>
                    <td>{user.status}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleUserAction('edit', user.no)}
                        className={styles.button}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


