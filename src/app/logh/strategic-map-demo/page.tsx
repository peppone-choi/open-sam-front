'use client';

import React, { useState } from 'react';
import StrategicMap from '@/components/logh/StrategicMap';

/**
 * LOGH Strategic Map Demo Page
 * Manual P.31 - ワープ航行の概念
 * Backend Fleet Movement - Warp Error Randomization UI Integration
 */

export default function StrategicMapDemoPage() {
  const [sessionId] = useState('demo-session-logh-001');
  const [characterId] = useState('char-reinhard-001');

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-lg p-4 shadow-xl">
          <h1 className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
            <span className="text-3xl">🌌</span>
            銀河英雄伝説 VII - 戦略マップ
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manual P.31 - ワープ航行の概念 | GAL-245 Warp Error Randomization
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-black/60 border border-cyan-500/20 rounded-lg p-4 space-y-2">
          <h2 className="text-lg font-bold text-cyan-400">操作方法</h2>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>
              <span className="text-cyan-300 font-bold">艦隊をクリック</span> - 艦隊を選択
            </li>
            <li>
              <span className="text-cyan-300 font-bold">Shift + クリック</span> - 選択した艦隊をワープ
            </li>
            <li>
              <span className="text-yellow-300 font-bold">地形危険度</span> - プラズマ嵐(赤)、星雲(黄)、小惑星帯(黄)
            </li>
            <li>
              <span className="text-orange-300 font-bold">ワープ誤差</span> - 危険地形では最大±2グリッドの誤差が発生
            </li>
          </ul>
        </div>

        {/* Strategic Map */}
        <div className="bg-black border-2 border-cyan-500/50 rounded-lg overflow-hidden shadow-2xl shadow-cyan-500/20">
          <StrategicMap
            sessionId={sessionId}
            characterId={characterId}
            onFleetClick={(fleet) => {
              console.log('Fleet clicked:', fleet);
            }}
            onCellClick={(x, y) => {
              console.log('Cell clicked:', x, y);
            }}
          />
        </div>

        {/* Feature Status */}
        <div className="bg-gradient-to-r from-green-900/40 to-blue-900/40 border border-green-500/30 rounded-lg p-4">
          <h2 className="text-lg font-bold text-green-400 mb-3">実装済み機能</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/40 border border-green-500/20 rounded p-2">
              <div className="text-green-400 font-bold">✓ 地形タイプ可視化</div>
              <div className="text-gray-400 text-xs">通常空間、プラズマ嵐、星雲、小惑星帯</div>
            </div>
            <div className="bg-black/40 border border-green-500/20 rounded p-2">
              <div className="text-green-400 font-bold">✓ 危険度バッジ表示</div>
              <div className="text-gray-400 text-xs">赤(高)、黄(中)の視覚的表示</div>
            </div>
            <div className="bg-black/40 border border-green-500/20 rounded p-2">
              <div className="text-green-400 font-bold">✓ ワープダイアログ</div>
              <div className="text-gray-400 text-xs">座標入力、危険度評価、確認ボタン</div>
            </div>
            <div className="bg-black/40 border border-green-500/20 rounded p-2">
              <div className="text-green-400 font-bold">✓ ワープ誤差表示</div>
              <div className="text-gray-400 text-xs">誤差ベクトル、実際の到着位置</div>
            </div>
            <div className="bg-black/40 border border-green-500/20 rounded p-2">
              <div className="text-green-400 font-bold">✓ API連動</div>
              <div className="text-gray-400 text-xs">POST /api/logh/galaxy/fleets/:fleetId/movements</div>
            </div>
            <div className="bg-black/40 border border-green-500/20 rounded p-2">
              <div className="text-green-400 font-bold">✓ Manual P.31準拠</div>
              <div className="text-gray-400 text-xs">ワープ航行の概念完全実装</div>
            </div>
          </div>
        </div>

        {/* Backend Status */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-4">
          <h2 className="text-lg font-bold text-blue-400 mb-3">Backend連動状況</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">
                RealtimeMovement.service.ts:143-164 - applyWarpVariance()
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">
                GalaxyValidation.service.ts:150-185 - assessTerrain()
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">
                galaxy.route.ts:252-335 - POST /fleets/:fleetId/movements
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">
                galaxy.route.ts (新規) - GET /terrain (地形評価API)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
