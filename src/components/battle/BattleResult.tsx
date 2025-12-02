'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArmyInfo } from './BattleScene';
import type { BattleLogEntry } from './TurnBasedBattleMap';
import styles from './BattleResult.module.css';

// ===== 타입 =====
interface BattleResultProps {
  winner: 'player' | 'enemy';
  attackerInfo?: ArmyInfo;
  defenderInfo?: ArmyInfo;
  allyStats: {
    total: number;
    alive: number;
    killed: number;
    expGained?: number;
    meritGained?: number;
  };
  enemyStats: {
    total: number;
    alive: number;
    killed: number;
  };
  battleLogs?: BattleLogEntry[];
  rewards?: RewardItem[];
  onClose?: () => void;
  onReplay?: () => void;
}

interface RewardItem {
  id: string;
  name: string;
  type: 'item' | 'equipment' | 'gold' | 'exp';
  amount: number;
  icon?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// ===== 메인 컴포넌트 =====
export default function BattleResult({
  winner,
  attackerInfo,
  defenderInfo,
  allyStats,
  enemyStats,
  battleLogs = [],
  rewards = [],
  onClose,
  onReplay,
}: BattleResultProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'rewards' | 'log'>('summary');
  const [showDetails, setShowDetails] = useState(false);

  const isVictory = winner === 'player';

  // 계산된 통계
  const stats = useMemo(() => ({
    allyLosses: allyStats.total - allyStats.alive,
    enemyLosses: enemyStats.total - enemyStats.alive,
    allyKillRate: allyStats.total > 0 
      ? Math.round((allyStats.killed / allyStats.total) * 100) 
      : 0,
    survivalRate: allyStats.total > 0 
      ? Math.round((allyStats.alive / allyStats.total) * 100) 
      : 0,
  }), [allyStats, enemyStats]);

  return (
    <motion.div
      className={styles.resultOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.resultModal}
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* 결과 헤더 */}
        <div className={`${styles.resultHeader} ${isVictory ? styles.victory : styles.defeat}`}>
          <motion.div
            className={styles.resultIcon}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            {isVictory ? '🏆' : '💔'}
          </motion.div>

          <motion.h1
            className={styles.resultTitle}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isVictory ? '승리!' : '패배...'}
          </motion.h1>

          <motion.p
            className={styles.resultSubtitle}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isVictory 
              ? '전투에서 승리하였습니다!' 
              : '아군이 패배하였습니다.'}
          </motion.p>
        </div>

        {/* 탭 네비게이션 */}
        <div className={styles.tabNav}>
          {['summary', 'rewards', 'log'].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab === 'summary' && '📊 요약'}
              {tab === 'rewards' && '🎁 보상'}
              {tab === 'log' && '📜 로그'}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className={styles.tabContent}>
          <AnimatePresence mode="wait">
            {/* 요약 탭 */}
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                className={styles.summaryTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* 양측 비교 */}
                <div className={styles.comparison}>
                  {/* 아군 */}
                  <div className={styles.teamCard + ' ' + styles.ally}>
                    <div 
                      className={styles.teamBadge}
                      style={{ backgroundColor: attackerInfo?.nationColor || '#3b82f6' }}
                    >
                      {attackerInfo?.nationName || '아군'}
                    </div>
                    <div className={styles.teamStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>생존</span>
                        <span className={styles.statValue + ' ' + styles.positive}>
                          {allyStats.alive}/{allyStats.total}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>격파</span>
                        <span className={styles.statValue + ' ' + styles.success}>
                          {allyStats.killed}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>손실</span>
                        <span className={styles.statValue + ' ' + styles.negative}>
                          {stats.allyLosses}
                        </span>
                      </div>
                    </div>
                    <div className={styles.rateBar}>
                      <div 
                        className={styles.rateBarFill + ' ' + styles.survival}
                        style={{ width: `${stats.survivalRate}%` }}
                      />
                      <span className={styles.rateText}>{stats.survivalRate}% 생존</span>
                    </div>
                  </div>

                  {/* VS */}
                  <div className={styles.vsCenter}>VS</div>

                  {/* 적군 */}
                  <div className={styles.teamCard + ' ' + styles.enemy}>
                    <div 
                      className={styles.teamBadge}
                      style={{ backgroundColor: defenderInfo?.nationColor || '#ef4444' }}
                    >
                      {defenderInfo?.nationName || '적군'}
                    </div>
                    <div className={styles.teamStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>생존</span>
                        <span className={styles.statValue}>
                          {enemyStats.alive}/{enemyStats.total}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>격파</span>
                        <span className={styles.statValue}>
                          {enemyStats.killed}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>손실</span>
                        <span className={styles.statValue + ' ' + styles.negative}>
                          {stats.enemyLosses}
                        </span>
                      </div>
                    </div>
                    <div className={styles.rateBar}>
                      <div 
                        className={styles.rateBarFill + ' ' + styles.enemy}
                        style={{ width: `${(enemyStats.alive / enemyStats.total) * 100}%` }}
                      />
                      <span className={styles.rateText}>
                        {Math.round((enemyStats.alive / enemyStats.total) * 100)}% 생존
                      </span>
                    </div>
                  </div>
                </div>

                {/* 획득 보상 미리보기 */}
                {isVictory && (allyStats.expGained || allyStats.meritGained) && (
                  <div className={styles.quickRewards}>
                    {allyStats.expGained && (
                      <div className={styles.quickRewardItem}>
                        <span className={styles.rewardIcon}>⭐</span>
                        <span className={styles.rewardLabel}>경험치</span>
                        <span className={styles.rewardValue}>+{allyStats.expGained}</span>
                      </div>
                    )}
                    {allyStats.meritGained && (
                      <div className={styles.quickRewardItem}>
                        <span className={styles.rewardIcon}>🎖️</span>
                        <span className={styles.rewardLabel}>공적</span>
                        <span className={styles.rewardValue}>+{allyStats.meritGained}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* 보상 탭 */}
            {activeTab === 'rewards' && (
              <motion.div
                key="rewards"
                className={styles.rewardsTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {rewards.length > 0 ? (
                  <div className={styles.rewardsList}>
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={reward.id}
                        className={`${styles.rewardCard} ${styles[reward.rarity || 'common']}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={styles.rewardItemIcon}>
                          {reward.icon || getRewardIcon(reward.type)}
                        </div>
                        <div className={styles.rewardItemInfo}>
                          <span className={styles.rewardItemName}>{reward.name}</span>
                          <span className={styles.rewardItemAmount}>x{reward.amount}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noRewards}>
                    {isVictory 
                      ? '획득한 보상이 없습니다.'
                      : '패배하여 보상을 받지 못했습니다.'}
                  </div>
                )}
              </motion.div>
            )}

            {/* 로그 탭 */}
            {activeTab === 'log' && (
              <motion.div
                key="log"
                className={styles.logTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className={styles.logList}>
                  {battleLogs.length > 0 ? (
                    battleLogs.map((log, index) => (
                      <div
                        key={log.id || index}
                        className={`${styles.logEntry} ${styles[`log_${log.type}`]}`}
                      >
                        <span className={styles.logIcon}>{getLogIcon(log.type)}</span>
                        <span className={styles.logText}>{log.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noLogs}>전투 로그가 없습니다.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 액션 버튼 */}
        <div className={styles.actionButtons}>
          {onReplay && (
            <button className={styles.replayBtn} onClick={onReplay}>
              🔄 다시하기
            </button>
          )}
          <button className={styles.confirmBtn} onClick={onClose}>
            ✓ 확인
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== 헬퍼 함수 =====
function getRewardIcon(type: string): string {
  const icons: Record<string, string> = {
    item: '📦',
    equipment: '⚔️',
    gold: '💰',
    exp: '⭐',
  };
  return icons[type] || '🎁';
}

function getLogIcon(type: string): string {
  const icons: Record<string, string> = {
    phase: '🏁',
    move: '🚶',
    attack: '⚔️',
    damage: '💥',
    critical: '⭐',
    evade: '💨',
    death: '💀',
    info: 'ℹ️',
  };
  return icons[type] || '•';
}


