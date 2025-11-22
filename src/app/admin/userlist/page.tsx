'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';

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

  const renderLoading = () => (
    <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-black/40 p-10 text-lg text-gray-300">
      로딩 중...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <TopBackBar title="관리자 사용자 목록" />

        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">사용자</p>
              <h2 className="text-2xl font-semibold text-white">사용자 현황</h2>
            </div>
            <p className="text-sm text-gray-400">총 {userList.length}명</p>
          </div>

          {loading ? (
            renderLoading()
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-gray-400">
                    <th className="py-3 pr-4 font-semibold">이름</th>
                    <th className="py-3 pr-4 font-semibold">등급</th>
                    <th className="py-3 pr-4 font-semibold">상태</th>
                    <th className="py-3 pr-4 font-semibold">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {userList.map((user) => (
                    <tr key={user.no}>
                      <td className="py-3 pr-4 font-semibold text-white">{user.name}</td>
                      <td className="py-3 pr-4">{user.grade}</td>
                      <td className="py-3 pr-4 text-xs uppercase tracking-[0.3em] text-gray-400">{user.status}</td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => handleUserAction('edit', user.no)}
                          className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:border-orange-400/60 hover:bg-orange-500/10"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
