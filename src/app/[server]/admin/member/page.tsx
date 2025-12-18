'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  username: string;
  name: string;
  grade: number;
  createdAt: string;
  oauth_type?: string;
  block?: number;
}

const GRADE_LEVELS: Record<number, { label: string; color: string }> = {
  1: { label: '일반', color: 'text-gray-400' },
  2: { label: '후원자', color: 'text-blue-400' },
  3: { label: '운영진', color: 'text-purple-400' },
  5: { label: '어드민', color: 'text-orange-400' },
  6: { label: '슈퍼어드민', color: 'text-red-400' },
  9: { label: '개발자', color: 'text-cyan-400' },
};

export default function AdminMemberPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | ''>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGrade, setEditGrade] = useState(1);

  const loadMemberList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetMember({});
      if (result.result) {
        setMemberList(result.members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMemberList();
  }, [loadMemberList]);

  const filteredMembers = memberList.filter(m => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !m.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterGrade !== '' && m.grade !== filterGrade) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAction = async (action: string, memberId?: string) => {
    try {
      const targetIds = memberId ? [memberId] : selectedMembers;
      
      if (targetIds.length === 0) {
        showToast('회원을 선택해주세요', 'warning');
        return;
      }

      let successCount = 0;
      
      for (const id of targetIds) {
        const result = await SammoAPI.AdminUpdateUser({
          userID: id,
          action,
        });
        
        if (result.result) {
          successCount++;
        }
      }
      
      showToast(`${successCount}명 처리 완료`, 'success');
      setSelectedMembers([]);
      await loadMemberList();
      
    } catch (err: any) {
      console.error(err);
      showToast(err.message || '처리에 실패했습니다.', 'error');
    }
  };

  const handleUpdateGrade = async () => {
    if (!selectedMember) return;
    
    try {
      const result = await SammoAPI.AdminUpdateUser({
        userID: selectedMember.id,
        action: 'grade',
        data: { grade: editGrade },
      });
      
      if (result.result) {
        showToast('등급이 변경되었습니다', 'success');
        setShowEditModal(false);
        setSelectedMember(null);
        await loadMemberList();
      } else {
        showToast(result.reason || '변경에 실패했습니다', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '오류 발생', 'error');
    }
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setEditGrade(member.grade);
    setShowEditModal(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      <TopBackBar title="회 원 관 리" reloadable onReload={loadMemberList} />
      
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 전체 접속 제어 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-sm font-medium text-gray-400">전체 접속 제어</h3>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => handleAction('allow_all')} 
                className="px-4 py-2 bg-green-600/30 hover:bg-green-600/50 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-500/20"
              >
                ✅ 전체 접속 허용
              </button>
              <button 
                type="button" 
                onClick={() => handleAction('block_all')} 
                className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
              >
                🚫 전체 접속 제한
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="이름 또는 아이디 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            >
              <option value="">모든 등급</option>
              {Object.entries(GRADE_LEVELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            
            <span className="text-sm text-gray-400">
              총 <span className="text-white font-mono">{filteredMembers.length}</span>명
            </span>
          </div>
        </div>

        {/* 선택된 회원 액션 */}
        {selectedMembers.length > 0 && (
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm text-blue-300">
                {selectedMembers.length}명 선택됨
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction('allow')}
                  className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-400 rounded-lg text-xs font-medium transition-colors"
                >
                  접속 허용
                </button>
                <button 
                  onClick={() => handleAction('block')}
                  className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg text-xs font-medium transition-colors"
                >
                  접속 차단
                </button>
                <button 
                  onClick={() => setSelectedMembers([])}
                  className="px-3 py-1.5 bg-slate-600/30 hover:bg-slate-600/50 text-gray-400 rounded-lg text-xs font-medium transition-colors"
                >
                  선택 해제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 회원 목록 */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-gray-400 border-b border-white/5">
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded bg-slate-700 border-slate-600"
                      />
                    </th>
                    <th className="py-3 px-4 text-left">아이디</th>
                    <th className="py-3 px-4 text-left">이름</th>
                    <th className="py-3 px-4 text-center">등급</th>
                    <th className="py-3 px-4 text-center">로그인 방식</th>
                    <th className="py-3 px-4 text-center">가입일</th>
                    <th className="py-3 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.map((member) => {
                    const gradeInfo = GRADE_LEVELS[member.grade] || GRADE_LEVELS[1];
                    
                    return (
                      <tr 
                        key={member.id} 
                        className={cn(
                          "hover:bg-white/5 transition-colors",
                          selectedMembers.includes(member.id) && "bg-blue-900/20"
                        )}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => handleSelectMember(member.id)}
                            className="rounded bg-slate-700 border-slate-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-gray-400">{member.username}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {member.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn("text-xs font-medium", gradeInfo.color)}>
                            {gradeInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {member.oauth_type ? (
                            <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-gray-400">
                              {member.oauth_type}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">일반</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-400 text-xs font-mono">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={() => openEditModal(member)}
                            className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-xs transition-colors"
                          >
                            등급변경
                          </button>
                          <button 
                            onClick={() => handleAction('allow', member.id)}
                            className="px-3 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded text-xs transition-colors"
                          >
                            허용
                          </button>
                          <button 
                            onClick={() => handleAction('block', member.id)}
                            className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded text-xs transition-colors"
                          >
                            차단
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="text-3xl mb-2">👥</div>
                        회원 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 등급 변경 모달 */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              등급 변경 - {selectedMember.name || selectedMember.username}
            </h3>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">등급 선택</label>
              <select
                value={editGrade}
                onChange={(e) => setEditGrade(Number(e.target.value))}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              >
                {Object.entries(GRADE_LEVELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMember(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateGrade}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
