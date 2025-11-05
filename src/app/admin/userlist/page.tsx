'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
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
      const result = await SammoAPI.AdminGetUserList();
      if (result.result) {
        setUserList(result.users);
      }
    } catch (err) {
      console.error(err);
      alert('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUserAction(action: string, userID?: number) {
    if (!userID) return;

    try {
      const result = await SammoAPI.AdminUpdateUser({
        userID,
        action,
      });

      if (result.result) {
        alert('처리되었습니다.');
        await loadUserList();
      } else {
        alert(result.reason || '처리에 실패했습니다.');
      }
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




