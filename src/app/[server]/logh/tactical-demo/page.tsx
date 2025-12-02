'use client';

/**
 * 전술 전투 데모 페이지
 * /[server]/logh/tactical-demo
 */

import { useState } from 'react';
import TacticalBattleCanvasLazy from '@/components/logh/tactical-battle/TacticalBattleCanvas.dynamic';
import { allDemoFleets, battleScenarios } from '@/components/logh/tactical-battle/demo-data';

export default function TacticalDemoPage({
  params,
}: {
  params: { server: string };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scenario, setScenario] = useState<'iserlohn' | 'vermillion'>('iserlohn');
  
  const currentScenario = battleScenarios[scenario];
  const fleets = [...currentScenario.allianceFleets, ...currentScenario.empireFleets];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* 헤더 */}
      <header className="border-b border-cyan-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-cyan-400">
            전술 전투 시스템 데모
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            은하영웅전설 스타일 실시간 전술 전투 UI
          </p>
        </div>
      </header>
      
      {/* 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        {/* 시나리오 선택 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">시나리오 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(battleScenarios).map(([key, sc]) => (
              <button
                key={key}
                onClick={() => setScenario(key as 'iserlohn' | 'vermillion')}
                className={`p-4 rounded-lg border transition-all text-left ${
                  scenario === key
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="font-bold text-lg">{sc.name}</div>
                <div className="text-sm opacity-70 mt-1">{sc.description}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-red-400">
                    동맹: {sc.allianceFleets.length}함대
                  </span>
                  <span className="text-blue-400">
                    제국: {sc.empireFleets.length}함대
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* 전투 시작 버튼 */}
        <div className="text-center">
          <button
            onClick={() => setIsOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all transform hover:scale-105"
          >
            🚀 전술 전투 시작
          </button>
        </div>
        
        {/* 조작 가이드 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 마우스 조작 */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-cyan-400 font-bold mb-3">🖱️ 마우스 조작</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex justify-between">
                <span>좌클릭</span>
                <span className="text-gray-500">함대 선택</span>
              </li>
              <li className="flex justify-between">
                <span>Shift+드래그</span>
                <span className="text-gray-500">박스 선택</span>
              </li>
              <li className="flex justify-between">
                <span>Ctrl+클릭</span>
                <span className="text-gray-500">다중 선택</span>
              </li>
              <li className="flex justify-between">
                <span>우클릭</span>
                <span className="text-gray-500">빠른 이동</span>
              </li>
              <li className="flex justify-between">
                <span>더블클릭</span>
                <span className="text-gray-500">전체 선택</span>
              </li>
              <li className="flex justify-between">
                <span>휠</span>
                <span className="text-gray-500">줌 인/아웃</span>
              </li>
            </ul>
          </div>
          
          {/* 이동 단축키 */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-green-400 font-bold mb-3">🎯 이동 명령</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">F</kbd>
                <span className="text-gray-500">이동</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">D</kbd>
                <span className="text-gray-500">평행이동</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">S</kbd>
                <span className="text-gray-500">선회</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">A</kbd>
                <span className="text-gray-500">정지</span>
              </li>
            </ul>
          </div>
          
          {/* 공격 단축키 */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-red-400 font-bold mb-3">⚔️ 공격 명령</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">R</kbd>
                <span className="text-gray-500">공격</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">E</kbd>
                <span className="text-gray-500">일제 사격</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">W</kbd>
                <span className="text-gray-500">연속 공격</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">Q</kbd>
                <span className="text-gray-500">공격 중지</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">Z</kbd>
                <span className="text-gray-500">진형 변경</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-2 py-0.5 bg-gray-700 rounded">T</kbd>
                <span className="text-gray-500">후퇴</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* 기능 설명 */}
        <div className="mt-8 bg-gray-800/30 rounded-lg p-6 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-4">✨ 주요 기능</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <div className="text-white font-medium">10000×10000 맵</div>
                <div className="text-gray-500 text-sm">연속좌표 대규모 전장</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <div className="text-white font-medium">진형 시스템</div>
                <div className="text-gray-500 text-sm">5가지 전술 진형</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📡</span>
              <div>
                <div className="text-white font-medium">실시간 동기화</div>
                <div className="text-gray-500 text-sm">WebSocket 기반</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎮</span>
              <div>
                <div className="text-white font-medium">직관적 조작</div>
                <div className="text-gray-500 text-sm">키보드 단축키 지원</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* 전술 전투 Canvas */}
      {isOpen && (
        <TacticalBattleCanvasLazy
          sessionId={params.server}
          battleId={`demo-${scenario}-${Date.now()}`}
          playerFaction="alliance"
          initialFleets={fleets}
          onClose={() => setIsOpen(false)}
          onBattleEnd={(winner) => {
            alert(`전투 종료! 승자: ${winner}`);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}

