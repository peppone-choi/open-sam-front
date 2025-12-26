'use client';

import React, { useEffect, useCallback } from 'react';
import styles from './MugBattle.module.css';
import BattleMap from './BattleMap';
import { convertLog } from '@/utils/convertLog';

interface MugBattleLayoutProps {
    battleData: any;
    onAction: (action: string) => void;
    onToggleMode: () => void;
}

export const MugBattleLayout: React.FC<MugBattleLayoutProps> = ({
    battleData,
    onAction,
    onToggleMode,
}) => {
    const unitsArray = Array.from(battleData.units.values() as any[]);
    const currentUnit = unitsArray[battleData.activeUnitIndex] || unitsArray[0];

    // 키보드 단축키 처리
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();
            switch (key) {
                case 'F': onAction('FIRE'); break;
                case 'H': onAction('AMBUSH'); break;
                case 'B': onAction('DUEL'); break;
                case 'M': onAction('MOVE'); break;
                case 'A': onAction('ATTACK'); break;
                case 'D': onAction('DEFEND'); break;
                case 'S': onAction('STONE'); break;
                case 'W': onAction('WAIT'); break;
                case 'X': onToggleMode(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onAction, onToggleMode]);

    return (
        <div className={styles.mugContainer}>
            {/* 1. 좌측 패널: 지역 정보 & 장수 상태 */}
            <aside className={styles.leftPanel}>
                <div className={styles.window}>
                    <div className={styles.windowHeader}>
                        <span>지 역</span>
                        <span>X</span>
                    </div>
                    <div className={styles.windowContent}>
                        <div className={styles.statBox}>
                            <div className={styles.statRow}><span>인 구</span> <span>{battleData.city?.pop?.[0] || '5,681,818'}</span></div>
                            <div className={styles.statRow}><span>강수량</span> <span>{battleData.weather === 'rain' ? '많음' : '보통'}</span></div>
                            <div className={styles.statRow}><span>백성충성심</span> <span>{battleData.city?.trust || '93'}</span></div>
                            <div className={styles.statRow}><span>성 채</span> <span>{battleData.city?.wall?.[0] || '180'}</span></div>
                        </div>
                    </div>
                </div>

                <div className={styles.window}>
                    <div className={styles.windowHeader}>
                        <span>장수상태</span>
                        <span>X</span>
                    </div>
                    <div className={styles.windowContent}>
                        <div className={styles.statBox}>
                            <div className={styles.statRow}><span>경 험</span> <span>{currentUnit?.experience || '1,117,255'}</span></div>
                            <div className={styles.statRow}><span>무 력</span> <span>{currentUnit?.force || currentUnit?.strength || '875'}</span></div>
                            <div className={styles.statRow}><span>지 능</span> <span>{currentUnit?.intellect || currentUnit?.intelligence || '769'}</span></div>
                            <div className={styles.statRow}><span>통솔력</span> <span>{currentUnit?.leadership || '406'}</span></div>
                            <div className={styles.statRow}><span>피로도</span> <span>0</span></div>
                        </div>
                        <button className={styles.classicButton} style={{ marginTop: '8px', width: '100%' }}>아이템 주기</button>
                    </div>
                </div>
            </aside>

            {/* 2. 중앙 패널: 전술 맵 */}
            <main className={styles.middlePanel}>
                <div className={styles.window} style={{ height: '100%' }}>
                    <div className={styles.windowHeader}>
                        <span>게임(G) 서비스(S) 윈도우(W) 옵션(O) 맵(M) 도움말(H)</span>
                        <button onClick={onToggleMode} className={styles.classicButton} style={{ padding: '0 4px', fontSize: '10px' }}>MODERN VIEW</button>
                    </div>
                    <div className={styles.mapViewport} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
                        <div style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}>
                            <BattleMap
                                units={unitsArray}
                                width={40}
                                height={40}
                                editable={false}
                                showCutscenes={false}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. 우측 패널: 부대 정보 & 명령 그리드 */}
            <aside className={styles.rightPanel}>
                <div className={styles.window}>
                    <div className={styles.windowHeader}>
                        <span>얼 굴</span>
                        <span>X</span>
                    </div>
                    <div className={styles.windowContent}>
                        <div className={styles.portrait}>
                            {currentUnit?.portraitUrl ? (
                                <img src={currentUnit.portraitUrl} alt={currentUnit.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ color: 'white', padding: '10px', fontSize: '10px' }}>[ No Portrait ]</div>
                            )}
                        </div>
                        <div className={styles.statBox}>
                            <div className={styles.statRow}><span>참가자</span> <span>{currentUnit?.name || '조운'}</span></div>
                            <div className={styles.statRow}><span>현지역</span> <span>전장</span></div>
                            <div className={styles.statRow}><span>소속</span> <span>{currentUnit?.type === 'attacker' ? '공격군' : '방어군'}</span></div>
                        </div>
                    </div>
                </div>

                <div className={styles.window}>
                    <div className={styles.windowHeader}>
                        <span>군 마</span>
                        <span>X</span>
                    </div>
                    <div className={styles.windowContent}>
                        <div className={styles.statBox}>
                            <div className={styles.statRow}><span>군대수</span> <span>{currentUnit?.crew?.toLocaleString() || '274,209'}</span></div>
                            <div className={styles.statRow}><span>사 기</span> <span>75</span></div>
                            <div className={styles.statRow}><span>훈련도</span> <span>100</span></div>
                        </div>
                    </div>
                </div>

                <div className={styles.window}>
                    <div className={styles.windowHeader}>
                        <span>전 쟁</span>
                        <span>X</span>
                    </div>
                    <div className={styles.windowContent}>
                        <div className={styles.commandGrid}>
                            <button className={styles.classicButton} onClick={() => onAction('DUEL')}>일기투(B)</button>
                            <button className={styles.classicButton} onClick={() => onAction('FIRE')}>화계(F)</button>
                            <button className={styles.classicButton} onClick={() => onAction('AMBUSH')}>매복(H)</button>
                            <button className={styles.classicButton} onClick={() => onAction('MOVE')}>이동(M)</button>
                            <button className={styles.classicButton} onClick={() => onAction('ATTACK')}>공격(A)</button>
                            <button className={styles.classicButton} onClick={() => onAction('DEFEND')}>방어(D)</button>
                            <button className={styles.classicButton} onClick={() => onAction('STONE')}>낙석(S)</button>
                            <button className={styles.classicButton} onClick={() => onAction('WAIT')}>대기(W)</button>
                            <button className={styles.classicButton} onClick={onToggleMode}>종료(X)</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 4. 하단 패널: 클래식 로그 */}
            <footer className={styles.bottomPanel} style={{ height: '180px' }}>
                <div className={styles.window} style={{ height: '100%' }}>
                    <div className={styles.windowHeader}>
                        <span>메 시 지</span>
                        <span>X</span>
                    </div>
                    <div className={styles.logArea}>
                        {battleData.battleLog && battleData.battleLog.length > 0 ? (
                            battleData.battleLog.map((log: any, idx: number) => {
                                const logText = typeof log === 'string' ? log : log.text;
                                return (
                                    <div 
                                        key={idx} 
                                        style={{ marginBottom: '2px' }}
                                        dangerouslySetInnerHTML={{ __html: `** ${convertLog(logText)}` }}
                                    />
                                );
                            })
                        ) : (
                            <>
                                <div>** 전투가 시작되었습니다. **</div>
                                <div>** 명령을 내려주십시오. **</div>
                            </>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};
