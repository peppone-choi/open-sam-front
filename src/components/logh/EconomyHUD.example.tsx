/**
 * Economy HUD Integration Example
 * 
 * This file demonstrates how to integrate the EconomyHUD component
 * into your game page or dashboard.
 */

import React from 'react';
import EconomyHUD from './EconomyHUD';
import GameAppShell from '../layout/GameAppShell';

// Example 1: Standalone Usage
export function EconomyHUDStandalone() {
  return (
    <div className="p-4 bg-gray-950 min-h-screen">
      <EconomyHUD 
        sessionId="galaxy-session-001"
        characterId="char-yang-wenli"
        autoRefresh={true}
        refreshInterval={30000}
      />
    </div>
  );
}

// Example 2: Game Sidebar Integration
export function GamePageWithEconomy() {
  const sessionId = "galaxy-session-001";
  const characterId = "char-yang-wenli";

  return (
    <GameAppShell
      header={
        <div className="p-4 text-cyan-300">
          <h1 className="text-xl font-bold">Galaxy Command Center</h1>
        </div>
      }
      leftColumn={
        <div className="space-y-4">
          {/* User Profile */}
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-500/30">
            <h3 className="text-cyan-300 font-semibold mb-2">Commander Profile</h3>
            <div className="text-sm text-cyan-300/70">
              <div>Yang Wen-li</div>
              <div>Alliance Fleet Commander</div>
            </div>
          </div>

          {/* Economy HUD */}
          <EconomyHUD 
            sessionId={sessionId}
            characterId={characterId}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </div>
      }
      mainColumn={
        <div className="p-4 text-cyan-300">
          <h2 className="text-lg font-semibold mb-4">Strategic Map</h2>
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            Main game view goes here
          </div>
        </div>
      }
      rightColumn={
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-cyan-500/30">
            <h3 className="text-cyan-300 font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">
                Fleet Command
              </button>
              <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">
                Operations
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}

// Example 3: Dashboard Panel
export function CommanderDashboard() {
  const sessionId = "galaxy-session-001";
  const characterId = "char-yang-wenli";

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold text-cyan-300 mb-6">Commander Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Economy Panel */}
        <div className="lg:col-span-1">
          <EconomyHUD 
            sessionId={sessionId}
            characterId={characterId}
            autoRefresh={true}
            refreshInterval={30000}
            className="h-full"
          />
        </div>

        {/* Fleet Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/80 border border-cyan-500/30 rounded-lg p-4 h-full">
            <h3 className="text-cyan-300 font-semibold mb-4">Fleet Status</h3>
            <div className="space-y-3 text-cyan-300/70 text-sm">
              <div className="flex justify-between">
                <span>13th Fleet</span>
                <span className="text-green-400">Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Total Ships</span>
                <span>5,000</span>
              </div>
              <div className="flex justify-between">
                <span>Formation</span>
                <span>Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operations Panel */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/80 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="text-cyan-300 font-semibold mb-4">Active Operations</h3>
            <div className="text-cyan-300/70 text-sm text-center py-8">
              No active operations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Example 4: Modal Integration
export function EconomyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-950 rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
          <h2 className="text-cyan-300 font-semibold text-lg">Galaxy Treasury</h2>
          <button 
            onClick={onClose}
            className="text-cyan-300 hover:text-cyan-100 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          <EconomyHUD 
            sessionId="galaxy-session-001"
            characterId="char-yang-wenli"
            autoRefresh={true}
            refreshInterval={10000}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-cyan-500/30">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 5: With Custom Refresh Control
export function EconomyHUDWithControl() {
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [refreshInterval, setRefreshInterval] = React.useState(30000);

  return (
    <div className="p-4 bg-gray-950 min-h-screen space-y-4">
      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-4 border border-cyan-500/30">
        <h3 className="text-cyan-300 font-semibold mb-3">Refresh Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-cyan-300/70 text-sm">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh enabled
          </label>
          
          {autoRefresh && (
            <div>
              <label className="block text-cyan-300/70 text-sm mb-1">
                Interval (seconds)
              </label>
              <select 
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(Number(e.target.value) * 1000)}
                className="w-full bg-gray-700 text-cyan-300 rounded px-3 py-2 text-sm"
              >
                <option value="10">10 seconds (fast)</option>
                <option value="30">30 seconds (normal)</option>
                <option value="60">60 seconds (slow)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Economy HUD */}
      <EconomyHUD 
        sessionId="galaxy-session-001"
        characterId="char-yang-wenli"
        autoRefresh={autoRefresh}
        refreshInterval={refreshInterval}
      />
    </div>
  );
}

// Export all examples
export default {
  Standalone: EconomyHUDStandalone,
  GamePage: GamePageWithEconomy,
  Dashboard: CommanderDashboard,
  Modal: EconomyModal,
  WithControl: EconomyHUDWithControl,
};
