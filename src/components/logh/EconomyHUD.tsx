'use client';

import React, { useEffect, useState } from 'react';
import { EconomyState, EconomyEvent } from '@/types/logh';
import { loghApi } from '@/lib/api/logh';

interface EconomyHUDProps {
  sessionId: string;
  characterId?: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export default function EconomyHUD({
  sessionId,
  characterId,
  className = '',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds default
}: EconomyHUDProps) {
  const [economyState, setEconomyState] = useState<EconomyState | null>(null);
  const [events, setEvents] = useState<EconomyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEconomyData = async () => {
    try {
      setError(null);
      const [stateData, eventsData] = await Promise.all([
        loghApi.getEconomyState(sessionId, characterId),
        loghApi.getEconomyEvents(sessionId, characterId, 10),
      ]);
      
      setEconomyState(stateData);
      setEvents(eventsData.events || []);
    } catch (err: any) {
      console.error('Failed to fetch economy data:', err);
      setError(err.message || 'Failed to load economy data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEconomyData();

    if (autoRefresh) {
      const interval = setInterval(fetchEconomyData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sessionId, characterId, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className={`bg-gray-900/80 border border-cyan-500/30 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-cyan-500/20 rounded w-1/3"></div>
          <div className="h-20 bg-cyan-500/10 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-cyan-500/10 rounded"></div>
            <div className="h-4 bg-cyan-500/10 rounded"></div>
            <div className="h-4 bg-cyan-500/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-4 ${className}`}>
        <div className="text-red-400 text-sm">
          <div className="font-semibold mb-1">Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getEventIcon = (type: EconomyEvent['type']) => {
    switch (type) {
      case 'tax':
        return '💰';
      case 'subsidy':
        return '💸';
      case 'logistics':
        return '📦';
      case 'trade':
        return '🔄';
      case 'penalty':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const getEventColor = (amount: number) => {
    return amount >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`bg-gray-900/80 border border-cyan-500/30 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-cyan-900/30 border-b border-cyan-500/30 px-4 py-2">
        <h3 className="text-cyan-300 font-semibold text-sm flex items-center gap-2">
          <span className="text-lg">💎</span>
          <span>Galaxy Treasury</span>
        </h3>
      </div>

      {/* Treasury Display */}
      {economyState && (
        <div className="p-4 border-b border-cyan-500/20">
          <div className="grid grid-cols-2 gap-3">
            {/* Main Treasury */}
            <div className="col-span-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-lg p-3 border border-cyan-500/20">
              <div className="text-xs text-cyan-300/70 mb-1">Current Balance</div>
              <div className="text-2xl font-bold text-cyan-300">
                {formatNumber(economyState.treasury)}
                <span className="text-sm text-cyan-400/70 ml-2">Credits</span>
              </div>
            </div>

            {/* Tax Rate */}
            <div className="bg-gray-800/50 rounded-lg p-2 border border-cyan-500/10">
              <div className="text-xs text-cyan-300/70 mb-1">Tax Rate</div>
              <div className="text-lg font-semibold text-cyan-300">
                {(economyState.taxRate * 100).toFixed(1)}%
              </div>
            </div>

            {/* Supply Budget */}
            <div className="bg-gray-800/50 rounded-lg p-2 border border-cyan-500/10">
              <div className="text-xs text-cyan-300/70 mb-1">Supply Budget</div>
              <div className="text-lg font-semibold text-cyan-300">
                {formatNumber(economyState.supplyBudget)}
              </div>
            </div>

            {/* Trade Index */}
            <div className="bg-gray-800/50 rounded-lg p-2 border border-cyan-500/10">
              <div className="text-xs text-cyan-300/70 mb-1">Trade Index</div>
              <div className="text-lg font-semibold text-cyan-300">
                {economyState.tradeIndex.toFixed(2)}
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-800/50 rounded-lg p-2 border border-cyan-500/10">
              <div className="text-xs text-cyan-300/70 mb-1">Status</div>
              <div className={`text-sm font-semibold ${
                economyState.status === 'active' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {economyState.status === 'active' ? '🟢 Active' : '🟡 Stub'}
              </div>
            </div>
          </div>

          {economyState.note && (
            <div className="mt-3 text-xs text-cyan-300/50 italic">
              {economyState.note}
            </div>
          )}
        </div>
      )}

      {/* Event Feed */}
      <div className="p-4">
        <h4 className="text-cyan-300/90 text-xs font-semibold mb-3 flex items-center gap-2">
          <span>📋</span>
          <span>Recent Transactions</span>
          <span className="ml-auto text-cyan-400/50">({events.length})</span>
        </h4>

        {events.length === 0 ? (
          <div className="text-center text-cyan-300/50 text-sm py-6">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.eventId}
                className="bg-gray-800/30 border border-cyan-500/10 rounded-lg p-2.5 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{getEventIcon(event.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-xs font-semibold text-cyan-300/90">
                        {event.summary}
                      </div>
                      <div className={`text-xs font-bold flex-shrink-0 ${getEventColor(event.amount)}`}>
                        {event.amount >= 0 ? '+' : ''}{formatNumber(event.amount)}
                      </div>
                    </div>
                    
                    {event.description && (
                      <div className="text-xs text-cyan-300/60 mb-1">
                        {event.description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-cyan-300/40">
                      {event.createdBy?.displayName && (
                        <span>👤 {event.createdBy.displayName}</span>
                      )}
                      {event.faction && (
                        <span className="uppercase">{event.faction}</span>
                      )}
                      <span className="ml-auto">{formatDate(event.createdAt)}</span>
                    </div>

                    {(event.supplyImpact !== 0 || event.tradeImpact !== 0) && (
                      <div className="mt-1.5 flex gap-2 text-xs">
                        {event.supplyImpact !== 0 && (
                          <span className={`${event.supplyImpact! > 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                            📦 {event.supplyImpact! > 0 ? '+' : ''}{event.supplyImpact}
                          </span>
                        )}
                        {event.tradeImpact !== 0 && (
                          <span className={`${event.tradeImpact! > 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                            🔄 {event.tradeImpact! > 0 ? '+' : ''}{event.tradeImpact?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Last Update */}
      <div className="px-4 py-2 bg-gray-900/50 border-t border-cyan-500/20 text-xs text-cyan-300/40 text-center">
        {autoRefresh ? `Auto-refresh every ${refreshInterval / 1000}s` : 'Manual refresh only'}
      </div>
    </div>
  );
}
