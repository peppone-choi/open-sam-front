'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { useToast } from '@/contexts/ToastContext';

interface UserData {
  no: string;
  name: string;
  grade: number;
  picture?: string;
  join_date?: string;
  block?: boolean;
  acl?: string;
  status?: string;
}

const GRADE_CONFIG: Record<number, { label: string; color: string; description: string }> = {
  1: { label: '일반', color: 'text-gray-400', description: '일반 사용자' },
  2: { label: '인증', color: 'text-blue-400', description: '인증된 사용자' },
  3: { label: 'VIP', color: 'text-purple-400', description: 'VIP 사용자' },
  4: { label: '모더', color: 'text-emerald-400', description: '게임 모더레이터' },
  5: { label: '관리자', color: 'text-orange-400', description: '서버 관리자' },
  6: { label: '최고관리자', color: 'text-red-400', description: '최고 관리자' },
};

export default function AdminUserListPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [filterBlocked, setFilterBlocked] = useState<boolean | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadUserList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetUserList();
      if (result.result) {
        setUserList(result.users || []);
      }
    } catch (err) {
      console.error(err);
      showToast('사용자 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUserList();
  }, [loadUserList]);

  // 필터링된 사용자 목록
  const filteredUsers = userList.filter((user) => {
    const matchesSearch =
      searchQuery === '' || user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === 'all' || user.grade === filterGrade;
    const matchesBlocked =
      filterBlocked === 'all' || (filterBlocked ? user.block === true : !user.block);
    return matchesSearch && matchesGrade && matchesBlocked;
  });

  // 등급 변경
  async function handleGradeChange(userId: string, newGrade: number) {
    if (!confirm(`이 사용자의 등급을 ${GRADE_CONFIG[newGrade]?.label || newGrade}(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      setProcessing(true);
      const result = await SammoAPI.AdminUpdateUser({
        userID: userId,
        action: 'grade',
        data: { grade: newGrade },
      });

      if (result.result) {
        showToast('등급이 변경되었습니다.', 'success');
        await loadUserList();
        setEditingUser(null);
      } else {
        showToast(result.reason || '등급 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('등급 변경에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  // 블록 토글
  async function handleBlockToggle(userId: string, currentlyBlocked: boolean) {
    const action = currentlyBlocked ? '차단 해제' : '차단';
    if (!confirm(`이 사용자를 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      setProcessing(true);
      const result = await SammoAPI.AdminUpdateUser({
        userID: userId,
        action: 'block',
        data: { block: !currentlyBlocked },
      });

      if (result.result) {
        showToast(`사용자가 ${action}되었습니다.`, 'success');
        await loadUserList();
      } else {
        showToast(result.reason || `${action}에 실패했습니다.`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(`${action}에 실패했습니다.`, 'error');
    } finally {
      setProcessing(false);
    }
  }

  // ACL 변경
  async function handleAclChange(userId: string, newAcl: string) {
    try {
      setProcessing(true);
      const result = await SammoAPI.AdminUpdateUser({
        userID: userId,
        action: 'acl',
        data: { acl: newAcl },
      });

      if (result.result) {
        showToast('권한이 변경되었습니다.', 'success');
        await loadUserList();
        setEditingUser(null);
      } else {
        showToast(result.reason || '권한 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('권한 변경에 실패했습니다.', 'error');
    } finally {
      setProcessing(false);
    }
  }

  const renderLoading = () => (
    <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-black/40 p-10 text-lg text-gray-300">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        로딩 중...
      </div>
    </div>
  );

  // 통계
  const stats = {
    total: userList.length,
    admins: userList.filter((u) => u.grade >= 5).length,
    blocked: userList.filter((u) => u.block).length,
    recent: userList.filter((u) => {
      if (!u.join_date) return false;
      const joinDate = new Date(u.join_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return joinDate > weekAgo;
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 text-gray-100">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">관리</p>
            <h1 className="mt-1 text-3xl font-bold text-white">사용자 관리</h1>
            <p className="text-sm text-gray-400">사용자 권한 및 제재 관리</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadUserList}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10 disabled:opacity-50"
            >
              🔄 새로고침
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-400/60 hover:bg-orange-500/10"
            >
              ← 관리자 패널
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">👥</span>
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-400">전체 사용자</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">👑</span>
              <span className="text-2xl font-bold text-orange-400">{stats.admins}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-400">관리자</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🚫</span>
              <span className="text-2xl font-bold text-red-400">{stats.blocked}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-400">차단됨</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">✨</span>
              <span className="text-2xl font-bold text-emerald-400">{stats.recent}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-400">최근 7일 가입</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사용자 이름으로 검색..."
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:border-orange-400/60 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
          <select
            value={filterGrade === 'all' ? 'all' : String(filterGrade)}
            onChange={(e) => setFilterGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-orange-400/60 focus:outline-none"
          >
            <option value="all">모든 등급</option>
            {Object.entries(GRADE_CONFIG).map(([grade, config]) => (
              <option key={grade} value={grade}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={filterBlocked === 'all' ? 'all' : String(filterBlocked)}
            onChange={(e) =>
              setFilterBlocked(e.target.value === 'all' ? 'all' : e.target.value === 'true')
            }
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-orange-400/60 focus:outline-none"
          >
            <option value="all">모든 상태</option>
            <option value="false">활성 사용자</option>
            <option value="true">차단된 사용자</option>
          </select>
        </div>

        {/* 사용자 목록 */}
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-orange-400/70">사용자</p>
              <h2 className="text-2xl font-semibold text-white">사용자 현황</h2>
            </div>
            <p className="text-sm text-gray-400">
              {searchQuery || filterGrade !== 'all' || filterBlocked !== 'all'
                ? `${filteredUsers.length}명 필터링됨`
                : `총 ${userList.length}명`}
            </p>
          </div>

          {loading ? (
            renderLoading()
          ) : filteredUsers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-gray-400">
              {searchQuery || filterGrade !== 'all' || filterBlocked !== 'all'
                ? '조건에 맞는 사용자가 없습니다.'
                : '등록된 사용자가 없습니다.'}
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-gray-400">
                    <th className="py-3 pr-4 font-semibold">사용자</th>
                    <th className="py-3 pr-4 font-semibold">등급</th>
                    <th className="py-3 pr-4 font-semibold">상태</th>
                    <th className="py-3 pr-4 font-semibold">가입일</th>
                    <th className="py-3 pr-4 font-semibold text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {filteredUsers.map((user) => {
                    const gradeConfig = GRADE_CONFIG[user.grade] || GRADE_CONFIG[1];

                    return (
                      <tr
                        key={user.no}
                        className={`hover:bg-white/5 ${user.block ? 'opacity-60' : ''}`}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 text-lg font-bold text-white">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.name}</p>
                              <p className="text-xs text-gray-500">ID: {user.no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${gradeConfig.color} bg-white/5`}
                          >
                            {gradeConfig.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {user.block ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                              🚫 차단됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                              ✓ 활성
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-400">
                          {user.join_date
                            ? new Date(user.join_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(user)}
                              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:border-blue-400/60 hover:bg-blue-500/10"
                            >
                              상세
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:border-orange-400/60 hover:bg-orange-500/10"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlockToggle(user.no, !!user.block)}
                              disabled={processing}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                                user.block
                                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'border-red-400/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              }`}
                            >
                              {user.block ? '해제' : '차단'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 상세 정보 모달 */}
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">사용자 상세</h3>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/30 to-purple-500/30 text-2xl font-bold text-white">
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{selectedUser.name}</p>
                    <p className="text-sm text-gray-400">ID: {selectedUser.no}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4">
                  <div>
                    <p className="text-xs text-gray-500">등급</p>
                    <p className={`font-semibold ${GRADE_CONFIG[selectedUser.grade]?.color || 'text-white'}`}>
                      {GRADE_CONFIG[selectedUser.grade]?.label || `등급 ${selectedUser.grade}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">상태</p>
                    <p className={selectedUser.block ? 'text-red-400' : 'text-emerald-400'}>
                      {selectedUser.block ? '차단됨' : '활성'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">가입일</p>
                    <p className="text-white">
                      {selectedUser.join_date
                        ? new Date(selectedUser.join_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ACL</p>
                    <p className="text-white">{selectedUser.acl || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 수정 모달 */}
        {editingUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">사용자 수정</h3>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/30 to-purple-500/30 text-xl font-bold text-white">
                    {editingUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-white">{editingUser.name}</p>
                    <p className="text-sm text-gray-400">ID: {editingUser.no}</p>
                  </div>
                </div>

                {/* 등급 변경 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">등급 변경</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(GRADE_CONFIG).map(([grade, config]) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => handleGradeChange(editingUser.no, Number(grade))}
                        disabled={processing || editingUser.grade === Number(grade)}
                        className={`rounded-lg border p-2 text-xs font-medium transition ${
                          editingUser.grade === Number(grade)
                            ? 'border-orange-400/60 bg-orange-500/20 text-orange-400'
                            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACL 변경 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">특수 권한 (ACL)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAclChange(editingUser.no, '-')}
                      disabled={processing || editingUser.acl === '-'}
                      className={`flex-1 rounded-lg border p-2 text-xs font-medium transition ${
                        !editingUser.acl || editingUser.acl === '-'
                          ? 'border-orange-400/60 bg-orange-500/20 text-orange-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      없음
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAclChange(editingUser.no, '*')}
                      disabled={processing || editingUser.acl === '*'}
                      className={`flex-1 rounded-lg border p-2 text-xs font-medium transition ${
                        editingUser.acl === '*'
                          ? 'border-red-400/60 bg-red-500/20 text-red-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      전체 권한 (*)
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    * 전체 권한은 모든 관리 기능에 접근할 수 있습니다.
                  </p>
                </div>

                {/* 차단 상태 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">계정 상태</label>
                  <button
                    type="button"
                    onClick={() => handleBlockToggle(editingUser.no, !!editingUser.block)}
                    disabled={processing}
                    className={`w-full rounded-lg border p-3 text-sm font-medium transition ${
                      editingUser.block
                        ? 'border-red-400/60 bg-red-500/20 text-red-400'
                        : 'border-emerald-400/60 bg-emerald-500/20 text-emerald-400'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {editingUser.block ? '🚫 현재 차단됨 - 클릭하여 해제' : '✓ 현재 활성 - 클릭하여 차단'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
