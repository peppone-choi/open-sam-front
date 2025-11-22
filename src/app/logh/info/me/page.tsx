'use client';

import { useEffect, useState } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import { loghApi } from '@/lib/api/logh';
import { UserProfile } from '@/types/logh';
import { cn } from '@/lib/utils';

export default function LoghMyInfoPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await loghApi.getUserProfile();
      setProfile(data);
    } catch (e) {
      console.error('프로필 로드 실패', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400">
        제독 정보를 불러올 수 없습니다.
      </div>
    );
  }

  const factionColor = profile.faction === 'empire' ? 'text-yellow-400' : 'text-cyan-400';
  const factionName = profile.faction === 'empire' ? '은하제국' : '자유행성동맹';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-6 lg:p-8">
      <TopBackBar title="내 제독 정보" backUrl="/logh/game" />

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 프로필 카드 */}
        <div className="md:col-span-1 bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full mb-4 border-2 border-white/20 flex items-center justify-center overflow-hidden">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
          <div className={cn("text-sm font-bold uppercase tracking-wider mb-4", factionColor)}>
            {factionName} | {profile.rank}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm bg-black/30 p-3 rounded-lg">
            <div>
              <div className="text-gray-500">PCP (정치)</div>
              <div className="text-purple-400 font-mono font-bold text-lg">{profile.pcp}/{profile.maxPcp}</div>
            </div>
            <div>
              <div className="text-gray-500">MCP (군사)</div>
              <div className="text-red-400 font-mono font-bold text-lg">{profile.mcp}/{profile.maxMcp}</div>
            </div>
          </div>
        </div>

        {/* 상세 정보 및 직책 카드 */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Mockup */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">능력치</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '지휘력', val: 85, color: 'bg-blue-500' },
                { label: '전술안', val: 92, color: 'bg-red-500' },
                { label: '전략안', val: 88, color: 'bg-purple-500' },
                { label: '정치력', val: 45, color: 'bg-green-500' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{stat.label}</span>
                    <span className="font-bold text-white">{stat.val}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn("h-full", stat.color)} style={{ width: `${stat.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Cards */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
              <span>보유 직책 카드</span>
              <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">직책 카드</span>
            </h3>
            
            {profile.jobCards && profile.jobCards.length > 0 ? (
              <div className="space-y-3">
                {profile.jobCards.map((card) => (
                  <div key={card.id} className="bg-black/40 border border-white/10 p-4 rounded-lg flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                    <div>
                      <div className="font-bold text-white group-hover:text-blue-300 transition-colors">{card.title}</div>
                      <div className="text-xs text-gray-500 mt-1">요구 계급: {card.rankReq}</div>
                    </div>
                    <div className="flex gap-1">
                      {card.commands.map(cmd => (
                        <span key={cmd} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                          {cmd}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                보유 중인 직책 카드가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
