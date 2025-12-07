'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Dynamic import to avoid SSR issues with Three.js
const TacticalBattleView = dynamic(
  () => import('@/components/gin7/tactical/TacticalBattleView'),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

// ============================================================
// Loading Screen
// ============================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-bold text-white">전술 전투 로딩 중...</h1>
        <p className="text-sm text-white/60">3D 전투 환경을 준비하고 있습니다</p>
      </div>
    </div>
  );
}

// ============================================================
// Demo Mode (for testing without backend)
// ============================================================

function DemoConfig() {
  const [config, setConfig] = useState({
    sessionId: 'demo-session',
    factionId: 'empire',
    commanderId: 'demo-commander',
    battleId: 'demo-battle',
  });
  
  const [started, setStarted] = useState(false);
  
  if (started) {
    return (
      <TacticalBattleView
        sessionId={config.sessionId}
        factionId={config.factionId}
        commanderId={config.commanderId}
        battleId={config.battleId}
        className="h-screen"
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">GIN7 전술 전투</h1>
          <p className="text-sm text-white/60 mt-2">데모 모드 설정</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/70 mb-1">세션 ID</label>
            <input
              type="text"
              value={config.sessionId}
              onChange={(e) => setConfig((c) => ({ ...c, sessionId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-white/70 mb-1">진영</label>
            <select
              value={config.factionId}
              onChange={(e) => setConfig((c) => ({ ...c, factionId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="empire">은하제국</option>
              <option value="alliance">자유행성동맹</option>
              <option value="phezzan">페잔</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-white/70 mb-1">지휘관 ID</label>
            <input
              type="text"
              value={config.commanderId}
              onChange={(e) => setConfig((c) => ({ ...c, commanderId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <div>
            <label className="block text-xs text-white/70 mb-1">전투 ID (선택)</label>
            <input
              type="text"
              value={config.battleId}
              onChange={(e) => setConfig((c) => ({ ...c, battleId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="비워두면 대기 상태로 시작"
            />
          </div>
        </div>
        
        <button
          onClick={() => setStarted(true)}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors"
        >
          전투 시작
        </button>
        
        <div className="text-center">
          <p className="text-xs text-white/40">
            실제 전투에 참여하려면 백엔드 서버가 실행 중이어야 합니다
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

function TacticalPageContent() {
  const searchParams = useSearchParams();
  
  const sessionId = searchParams.get('sessionId');
  const factionId = searchParams.get('factionId');
  const commanderId = searchParams.get('commanderId');
  const battleId = searchParams.get('battleId');
  
  // If query params are provided, use them directly
  if (sessionId && factionId && commanderId) {
    return (
      <TacticalBattleView
        sessionId={sessionId}
        factionId={factionId}
        commanderId={commanderId}
        battleId={battleId || undefined}
        className="h-screen"
      />
    );
  }
  
  // Otherwise show demo config
  return <DemoConfig />;
}

export default function TacticalPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TacticalPageContent />
    </Suspense>
  );
}








