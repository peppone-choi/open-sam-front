'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { gin7Api } from '@/lib/api/gin7';

/**
 * LOGH Warp Navigation Dialog
 * Manual P.31 - ワープ航行の概念
 */

interface WarpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: {
    fleetId: string;
    name: string;
    faction: string;
    strategicPosition: { x: number; y: number };
  } | null;
  targetCoordinates: { x: number; y: number } | null;
  sessionId: string;
  characterId: string;
  onWarpComplete?: (result: any) => void;
}

interface TerrainInfo {
  terrainType: string;
  hazardLevel: number;
  impassable: boolean;
}

export default function WarpDialog({
  isOpen,
  onClose,
  fleet,
  targetCoordinates,
  sessionId,
  characterId,
  onWarpComplete,
}: WarpDialogProps) {
  const [targetX, setTargetX] = useState<string>('');
  const [targetY, setTargetY] = useState<string>('');
  const [terrain, setTerrain] = useState<TerrainInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize target coordinates when dialog opens
  useEffect(() => {
    if (targetCoordinates) {
      setTargetX(String(targetCoordinates.x));
      setTargetY(String(targetCoordinates.y));
    }
  }, [targetCoordinates, isOpen]);

  // Fetch terrain info when coordinates change
  useEffect(() => {
    const x = parseInt(targetX, 10);
    const y = parseInt(targetY, 10);

    if (isNaN(x) || isNaN(y) || !isOpen) {
      setTerrain(null);
      return;
    }

    fetchTerrainInfo(x, y);
  }, [targetX, targetY, isOpen]);

  async function fetchTerrainInfo(x: number, y: number) {
    try {
      const response = await fetch(
        `/api/logh/galaxy/terrain?sessionId=${sessionId}&x=${x}&y=${y}`
      );
      const result = await response.json();
      if (result.success) {
        setTerrain(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch terrain info:', err);
    }
  }

  async function handleWarpConfirm() {
    if (!fleet) return;

    const x = parseInt(targetX, 10);
    const y = parseInt(targetY, 10);

    if (isNaN(x) || isNaN(y)) {
      setError('有効な座標を入力してください');
      return;
    }

    if (x < 0 || x >= 100 || y < 0 || y >= 50) {
      setError('座標が範囲外です (X: 0-99, Y: 0-49)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await gin7Api.moveFleet({
        sessionId,
        fleetId: fleet.fleetId,
        target: { x, y },
        controllerCharacterId: characterId,
      });

      if (result.success) {
        onWarpComplete?.(result.data);
        onClose();
      } else {
        setError('ワープに失敗しました');
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const hazardWarning = terrain
    ? terrain.hazardLevel >= 2
      ? '⚠️ 高危険度'
      : terrain.hazardLevel === 1
        ? '⚡ 中危険度'
        : '✓ 安全'
    : '';

  const terrainColor = terrain
    ? terrain.impassable
      ? 'text-red-500'
      : terrain.hazardLevel >= 2
        ? 'text-orange-500'
        : terrain.hazardLevel === 1
          ? 'text-yellow-500'
          : 'text-green-500'
    : 'text-gray-500';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900/30 to-gray-900 border-2 border-cyan-500/50 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-b border-cyan-500/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
              <span className="text-2xl">🛸</span>
              ワープ航行
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Fleet Info */}
          {fleet && (
            <div className="bg-black/40 border border-cyan-500/20 rounded p-3 space-y-1">
              <div className="text-sm text-gray-400">選択艦隊</div>
              <div className="text-lg font-bold text-white">{fleet.name}</div>
              <div className="text-sm text-gray-300">
                現在位置: ({Math.floor(fleet.strategicPosition.x)},{' '}
                {Math.floor(fleet.strategicPosition.y)})
              </div>
            </div>
          )}

          {/* Target Coordinates Input */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-cyan-300">
              目標座標 (Manual P.31)
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">X座標</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={targetX}
                  onChange={(e) => setTargetX(e.target.value)}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Y座標</label>
                <input
                  type="number"
                  min={0}
                  max={49}
                  value={targetY}
                  onChange={(e) => setTargetY(e.target.value)}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Terrain & Hazard Info */}
          {terrain && (
            <div
              className={cn(
                'bg-black/40 border rounded p-4 space-y-2',
                terrain.impassable
                  ? 'border-red-500/50'
                  : terrain.hazardLevel >= 2
                    ? 'border-orange-500/50'
                    : 'border-cyan-500/20'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">地形タイプ</span>
                <span className={cn('font-bold', terrainColor)}>
                  {terrain.terrainType === 'space'
                    ? '通常空間'
                    : terrain.terrainType === 'plasma-storm'
                      ? 'プラズマ嵐'
                      : terrain.terrainType === 'nebula'
                        ? '星雲'
                        : terrain.terrainType === 'asteroid-field'
                          ? '小惑星帯'
                          : terrain.terrainType === 'void'
                            ? '航行不能領域'
                            : '未知領域'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">危険レベル</span>
                <span className={cn('font-bold text-lg', terrainColor)}>
                  {hazardWarning}
                </span>
              </div>
              {terrain.hazardLevel > 0 && !terrain.impassable && (
                <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded px-2 py-1 mt-2">
                  ⚠️ ワープ誤差が発生する可能性があります (最大 ±{terrain.hazardLevel}{' '}
                  グリッド)
                </div>
              )}
              {terrain.impassable && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded px-2 py-1 mt-2">
                  ❌ この座標には進入できません
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-t border-cyan-500/30 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            onClick={handleWarpConfirm}
            disabled={isLoading || !fleet || (terrain?.impassable ?? false)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
          >
            {isLoading ? '処理中...' : 'ワープ実行'}
          </button>
        </div>
      </div>
    </div>
  );
}
