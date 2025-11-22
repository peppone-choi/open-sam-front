'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function AdminMemberPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [memberList, setMemberList] = useState<any[]>([]);

  useEffect(() => {
    loadMemberList();
  }, [serverID]);

  async function loadMemberList() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetMember({});
      if (result.result) {
        setMemberList(result.members);
      }
    } catch (err) {
      console.error(err);
      // alert('회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, memberID?: number) {
    try {
      const result = await SammoAPI.AdminUpdateUser({
        userID: memberID || 0,
        action,
      });

      if (result.result) {
        alert('처리되었습니다.');
        await loadMemberList();
      } else {
        alert(result.reason || '처리에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('처리에 실패했습니다.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="회 원 관 리" reloadable onReload={loadMemberList} />
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Global Actions */}
        <div className="flex gap-4 justify-end">
          <button 
            type="button" 
            onClick={() => handleAction('allow_all')} 
            className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            전체 접속허용
          </button>
          <button 
            type="button" 
            onClick={() => handleAction('block_all')} 
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            전체 접속제한
          </button>
        </div>

        {/* Member List */}
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-300 border-b border-white/5">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">이름</th>
                    <th className="py-3 px-4">등급</th>
                    <th className="py-3 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {memberList.map((member) => (
                    <tr key={member.no} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-gray-400">{member.no}</td>
                      <td className="py-3 px-4 font-medium text-white">{member.name}</td>
                      <td className="py-3 px-4 text-gray-300">{member.grade || '일반'}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button 
                          onClick={() => handleAction('allow', member.no)}
                          className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded text-xs transition-colors"
                        >
                          허용
                        </button>
                        <button 
                          onClick={() => handleAction('block', member.no)}
                          className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded text-xs transition-colors"
                        >
                          차단
                        </button>
                      </td>
                    </tr>
                  ))}
                  {memberList.length === 0 && (
                     <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
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
    </div>
  );
}
