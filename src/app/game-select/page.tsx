'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * OpenSAM 게임 선택 페이지
 *
 * 삼국지 또는 은하영웅전설 선택
 */
export default function GameSelectPage() {
  const [selectedGame, setSelectedGame] = useState<'sangokushi' | 'logh' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold text-center mb-4">OpenSAM</h1>
        <p className="text-xl text-center text-gray-400 mb-16">
          범용 전략 게임 엔진
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 삼국지 카드 */}
          <div
            className={`bg-gradient-to-br from-red-900 to-red-700 rounded-lg p-8 cursor-pointer transition-transform hover:scale-105 ${
              selectedGame === 'sangokushi' ? 'ring-4 ring-yellow-400' : ''
            }`}
            onClick={() => setSelectedGame('sangokushi')}
          >
            <h2 className="text-4xl font-bold mb-4">삼국지</h2>
            <p className="text-lg mb-6">
              코에이 삼국지11 기반 전략 시뮬레이션
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚔️</span>
                <span>장수 시스템: 조조, 유비, 관우 등 명장</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏰</span>
                <span>도시 점령 & 내정 시스템</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                <span>병종 상성: 창병, 극병, 기병, 궁병</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <span>능력치: 통솔, 무력, 지력, 정치, 매력</span>
              </div>
            </div>

            {selectedGame === 'sangokushi' && (
              <Link
                href="/entrance"
                className="block w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-center hover:bg-yellow-400 transition"
              >
                로비 입장 →
              </Link>
            )}
          </div>

          {/* 은하영웅전설 카드 */}
          <div
            className={`bg-gradient-to-br from-blue-900 to-purple-700 rounded-lg p-8 cursor-pointer transition-transform hover:scale-105 ${
              selectedGame === 'logh' ? 'ring-4 ring-blue-400' : ''
            }`}
            onClick={() => setSelectedGame('logh')}
          >
            <h2 className="text-4xl font-bold mb-4">은하영웅전설</h2>
            <p className="text-lg mb-6">
              gin7manual.txt 기반 우주 전략 시뮬레이션
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🚀</span>
                <span>함대 시스템: 라인하르트, 양 웬리</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">🪐</span>
                <span>행성 점령 & 우주 작전</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                <span>워프 항행 & RTS 전술 게임</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎖️</span>
                <span>계급 시스템 & 직무 권한 카드</span>
              </div>
            </div>

            {selectedGame === 'logh' && (
              <Link
                href="/logh/entrance"
                className="block w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-center hover:bg-blue-400 transition"
              >
                로비 입장 →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">OpenSAM 특징</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-2">🎮</div>
              <h4 className="font-bold mb-2">범용 엔진</h4>
              <p className="text-sm text-gray-400">
                삼국지와 은하영웅전설을 동시에 지원하는 통합 게임 엔진
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-bold mb-2">데몬 기반</h4>
              <p className="text-sm text-gray-400">
                L1/L2 캐시 + 데몬 턴 처리 시스템으로 고성능 보장
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-2">🌐</div>
              <h4 className="font-bold mb-2">웹 기반</h4>
              <p className="text-sm text-gray-400">
                Next.js 14 + TypeScript로 현대적인 웹 게임 경험 제공
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
