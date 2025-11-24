'use client';

import { useEffect, useState } from 'react';
import { loghApi } from '@/lib/api/logh';

interface OccupationStatus {
  planetId: string;
  planetName: string;
  controllingFaction: 'empire' | 'alliance' | 'rebel' | 'neutral';
  occupationProgress: number;
  defenseStrength: number;
  garrisonUnits: number;
  supplyLines: string[];
  status: 'contested' | 'secured' | 'under_siege';
}

interface SupplyBatch {
  batchId: string;
  type: 'fuel' | 'ammunition' | 'rations' | 'medical';
  quantity: number;
  location: string;
  assignedUnits: string[];
  status: 'available' | 'deployed' | 'exhausted';
}

interface WarehouseStock {
  warehouseId: string;
  planetId: string;
  faction: 'empire' | 'alliance' | 'rebel';
  inventory: {
    fuel: number;
    ammunition: number;
    rations: number;
    medical: number;
    equipment: number;
  };
  capacity: number;
  lastUpdated: string;
}

interface GroundCombatState {
  battleId: string;
  gridCoordinates: { x: number; y: number };
  combatPhase: 'landing' | 'engagement' | 'occupation' | 'withdrawal' | 'completed';
  occupationStatus: OccupationStatus[];
  supplyBatches: SupplyBatch[];
  warehouseStocks: WarehouseStock[];
  lastUpdateAt: string;
}

interface GroundCombatHUDProps {
  battleId: string;
  sessionId?: string;
}

export default function GroundCombatHUD({ battleId, sessionId }: GroundCombatHUDProps) {
  const [combatState, setCombatState] = useState<GroundCombatState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'occupation' | 'supplies' | 'warehouse'>('occupation');

  useEffect(() => {
    fetchCombatState();
    const interval = setInterval(fetchCombatState, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, [battleId, sessionId]);

  const fetchCombatState = async () => {
    try {
      setLoading(true);
      const response = await loghApi.getGroundCombatState(battleId, sessionId);
      if (response.success) {
        setCombatState(response.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ground combat state');
    } finally {
      setLoading(false);
    }
  };

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'empire':
        return 'text-red-400';
      case 'alliance':
        return 'text-blue-400';
      case 'rebel':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secured':
        return 'bg-green-500/20 border-green-500';
      case 'contested':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'under_siege':
        return 'bg-red-500/20 border-red-500';
      default:
        return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getSupplyStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-400';
      case 'deployed':
        return 'text-yellow-400';
      case 'exhausted':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading && !combatState) {
     return (
       <div
         className="fixed top-4 right-4 bg-black/90 border border-cyan-500 rounded-lg p-4 min-w-[400px]"
         role="status"
         aria-live="polite"
         aria-busy="true"
       >
         <div className="text-cyan-400 animate-pulse">Loading ground combat data...</div>
       </div>
     );
   }
 
   if (error) {
     return (
       <div
         className="fixed top-4 right-4 bg-black/90 border border-red-500 rounded-lg p-4 min-w-[400px]"
         role="alert"
         aria-live="assertive"
       >
         <div className="text-red-400">Error: {error}</div>
       </div>
     );
   }

 
   if (error) {
     return (
       <div
         className="fixed top-4 right-4 bg-black/90 border border-red-500 rounded-lg p-4 min-w-[400px]"
         role="alert"
         aria-live="assertive"
       >
         <div className="text-red-400">Error: {error}</div>
       </div>
     );
   }


  if (error) {
    return (
      <div className="fixed top-4 right-4 bg-black/90 border border-red-500 rounded-lg p-4 min-w-[400px]">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!combatState) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/90 border border-cyan-500 rounded-lg p-4 min-w-[500px] max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col backdrop-blur">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-cyan-500/30">
        <h2 className="text-cyan-400 font-bold text-lg mb-1">Ground Combat HUD</h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Battle: {combatState.battleId.substring(0, 8)}...</span>
          <span className="text-gray-400">
            Grid: ({combatState.gridCoordinates.x}, {combatState.gridCoordinates.y})
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500">Phase: </span>
            <span className="text-yellow-400 uppercase font-bold text-sm">
              {combatState.combatPhase}
            </span>
          </div>
          {/* 간단 요약 경고: 보급 고갈/공성 상태 */}
          <div className="flex gap-2">
            {combatState.supplyBatches.some((b) => b.status === 'exhausted') && (
              <span className="px-2 py-1 rounded bg-red-900/60 border border-red-500 text-red-200 font-semibold">
                보급 고갈 위험
              </span>
            )}
            {combatState.occupationStatus.some((o) => o.status === 'under_siege') && (
              <span className="px-2 py-1 rounded bg-orange-900/60 border border-orange-500 text-orange-200 font-semibold">
                포위/공성 상태
              </span>
            )}
          </div>
        </div>
      </div>


      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedTab('occupation')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedTab === 'occupation'
              ? 'bg-cyan-500 text-black'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          }`}
        >
          Occupation ({combatState.occupationStatus.length})
        </button>
        <button
          onClick={() => setSelectedTab('supplies')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedTab === 'supplies'
              ? 'bg-cyan-500 text-black'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          }`}
        >
          Supplies ({combatState.supplyBatches.filter((b) => b.status === 'available').length})
        </button>
        <button
          onClick={() => setSelectedTab('warehouse')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedTab === 'warehouse'
              ? 'bg-cyan-500 text-black'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          }`}
        >
          Warehouse ({combatState.warehouseStocks.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {selectedTab === 'occupation' && (
          <div className="space-y-3">
            {combatState.occupationStatus.map((occupation) => (
              <div
                key={occupation.planetId}
                className={`border rounded-lg p-3 ${getStatusColor(occupation.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white">{occupation.planetName}</h3>
                    <span className={`text-xs font-medium ${getFactionColor(occupation.controllingFaction)}`}>
                      {occupation.controllingFaction.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 uppercase">{occupation.status}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Occupation Progress</span>
                    <span>{occupation.occupationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${occupation.occupationProgress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Defense: </span>
                    <span className="text-white font-medium">{occupation.defenseStrength}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Garrison: </span>
                    <span className="text-white font-medium">{occupation.garrisonUnits}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Supply Lines: </span>
                    <span className="text-white font-medium">
                      {occupation.supplyLines.length || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'supplies' && (
          <div className="space-y-3">
            {combatState.supplyBatches.map((batch) => (
              <div
                key={batch.batchId}
                className="border border-cyan-500/30 rounded-lg p-3 bg-cyan-500/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white capitalize">{batch.type}</h3>
                    <span className="text-xs text-gray-400">{batch.location}</span>
                  </div>
                  <span className={`text-xs font-medium uppercase ${getSupplyStatusColor(batch.status)}`}>
                    {batch.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="text-white font-medium">{batch.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned Units:</span>
                    <span className="text-white font-medium">{batch.assignedUnits.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'warehouse' && (
          <div className="space-y-3">
            {combatState.warehouseStocks.map((warehouse) => {
              const totalStock = Object.values(warehouse.inventory).reduce(
                (sum, qty) => sum + qty,
                0
              );
              const usagePercent = (totalStock / warehouse.capacity) * 100;

              return (
                <div
                  key={warehouse.warehouseId}
                  className="border border-cyan-500/30 rounded-lg p-3 bg-cyan-500/5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white">Warehouse</h3>
                      <span className="text-xs text-gray-400">Planet: {warehouse.planetId}</span>
                    </div>
                    <span className={`text-xs font-medium ${getFactionColor(warehouse.faction)}`}>
                      {warehouse.faction.toUpperCase()}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Capacity</span>
                      <span>
                        {totalStock} / {warehouse.capacity} ({usagePercent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          usagePercent > 90
                            ? 'bg-red-500'
                            : usagePercent > 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Inventory Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(warehouse.inventory).map(([item, qty]) => (
                      <div key={item} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{item}:</span>
                        <span className="text-white font-medium">{qty}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Updated: {new Date(warehouse.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-cyan-500/30 text-xs text-gray-500">
        Last update: {new Date(combatState.lastUpdateAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
