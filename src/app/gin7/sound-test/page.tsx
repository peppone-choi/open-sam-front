'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGin7AudioVFX, useGin7UISound } from '@/hooks/useGin7Audio';
import type { Gin7BattlePhase } from '@/lib/gin7/audio';

/**
 * Gin7 Sound & VFX 테스트 페이지
 */
export default function SoundTestPage() {
  const { audio, vfx, initializeAll, onBattleEvent } = useGin7AudioVFX();
  const uiSound = useGin7UISound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [testLog, setTestLog] = useState<string[]>([]);

  const log = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  }, []);

  // 오디오 초기화
  const handleInitialize = async () => {
    log('🔊 오디오 시스템 초기화 중...');
    const result = await initializeAll();
    if (result) {
      log('✅ 오디오 시스템 초기화 완료!');
    } else {
      log('❌ 오디오 시스템 초기화 실패');
    }
  };

  // BGM 테스트
  const handleBGMTest = (phase: Gin7BattlePhase) => {
    audio.setPhase(phase);
    log(`🎵 BGM 전환: ${phase}`);
  };

  // SFX 테스트
  const handleSFXTest = (type: string) => {
    const position = { x: Math.random() * 100, y: 0, z: Math.random() * 100 };
    
    switch (type) {
      case 'beam':
        audio.playSFX('beam_fire', position);
        vfx.beamImpact(position, { x: 0, y: 1, z: 0 });
        log('⚡ 빔 발사 SFX + VFX');
        break;
      case 'missile':
        audio.playSFX('missile_launch', position);
        setTimeout(() => {
          audio.playSFX('explosion_medium', position);
          vfx.missileImpact(position);
          log('💥 미사일 충돌 SFX + VFX');
        }, 500);
        log('🚀 미사일 발사 SFX');
        break;
      case 'explosion':
        audio.playSFX('explosion_large', position);
        vfx.unitDestroyed(position, 'large');
        log('💥 대폭발 SFX + VFX');
        break;
      case 'shield':
        audio.playSFX('shield_hit', position);
        vfx.shieldHit(position, { x: 0, y: 1, z: 0 });
        log('🛡️ 쉴드 피격 SFX + VFX');
        break;
      case 'shield_break':
        audio.playSFX('shield_break', position);
        vfx.shieldBreak(position);
        log('💔 쉴드 붕괴 SFX + VFX');
        break;
      case 'warp':
        audio.playSFX('warp_in', position);
        vfx.warpIn(position, { x: 0, y: 0, z: 1 });
        log('🌀 와프 진입 SFX + VFX');
        break;
    }
  };

  // UI 사운드 테스트
  const handleUITest = (type: string) => {
    switch (type) {
      case 'click':
        uiSound.playClick();
        log('🖱️ UI 클릭');
        break;
      case 'hover':
        uiSound.playHover();
        log('🖱️ UI 호버');
        break;
      case 'notification':
        uiSound.playNotification();
        log('🔔 알림');
        break;
      case 'alert':
        uiSound.playAlert();
        log('⚠️ 경고');
        break;
    }
  };

  // 화면 효과 테스트
  const handleScreenEffect = (type: string) => {
    switch (type) {
      case 'shake':
        vfx.shake(15, 0.5);
        log('📳 화면 흔들림');
        break;
      case 'flash':
        vfx.flash({ r: 255, g: 200, b: 100 }, 0.3);
        log('✨ 플래시');
        break;
      case 'danger':
        vfx.danger(2);
        log('🔴 위험 비네트');
        break;
      case 'victory':
        vfx.victory();
        audio.setPhase('victory');
        log('🏆 승리 효과');
        break;
      case 'defeat':
        vfx.defeat();
        audio.setPhase('defeat');
        log('💀 패배 효과');
        break;
    }
  };

  // 전투 이벤트 시뮬레이션
  const handleBattleEvent = (eventType: string) => {
    const position = { x: 50, y: 0, z: 50 };
    const direction = { x: 0, y: 1, z: 0 };
    
    onBattleEvent({
      type: eventType,
      data: { position, direction, size: 'large' },
    });
    
    log(`📡 전투 이벤트: ${eventType}`);
  };

  // VFX 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      // VFX 업데이트
      vfx.update(deltaTime);

      // 캔버스 클리어
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 화면 효과 적용
      const transform = vfx.getScreenTransform?.() ?? { offsetX: 0, offsetY: 0 };
      const overlay = vfx.getScreenOverlay?.() ?? { 
        flash: { r: 0, g: 0, b: 0, a: 0 },
        vignette: { intensity: 0, color: { r: 0, g: 0, b: 0 } },
      };

      ctx.save();
      ctx.translate(transform.offsetX, transform.offsetY);

      // 그리드 그리기
      ctx.strokeStyle = '#1a2040';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 파티클 렌더링
      const particles = vfx.getActiveParticles?.() ?? [];
      for (const particle of particles) {
        const screenX = (particle.x / 100) * canvas.width;
        const screenY = canvas.height - (particle.y / 100) * canvas.height;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha})`;
        ctx.fill();
      }

      ctx.restore();

      // 플래시 오버레이
      if (overlay.flash.a > 0) {
        ctx.fillStyle = `rgba(${overlay.flash.r}, ${overlay.flash.g}, ${overlay.flash.b}, ${overlay.flash.a})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 비네트 오버레이
      if (overlay.vignette.intensity > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(${overlay.vignette.color.r}, ${overlay.vignette.color.g}, ${overlay.vignette.color.b}, ${overlay.vignette.intensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 상태 표시
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`파티클: ${particles.length}`, 10, 20);
      ctx.fillText(`오디오: ${audio.initialized ? '✅' : '❌'}`, 10, 35);
      ctx.fillText(`페이즈: ${audio.currentPhase}`, 10, 50);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [vfx, audio]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔊 Gin7 Sound & VFX 테스트</h1>
        
        {/* 초기화 */}
        <div className="mb-6">
          <button
            onClick={handleInitialize}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg"
          >
            🎵 오디오 시스템 초기화 (클릭 필수!)
          </button>
          <span className="ml-4 text-gray-400">
            {audio.initialized ? '✅ 초기화됨' : '❌ 초기화 필요'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 왼쪽: 컨트롤 */}
          <div className="space-y-6">
            {/* BGM 테스트 */}
            <section className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">🎵 BGM 전환 테스트</h2>
              <div className="flex flex-wrap gap-2">
                {(['strategic', 'tactical_calm', 'tactical_tension', 'tactical_battle', 'victory', 'defeat'] as Gin7BattlePhase[]).map((phase) => (
                  <button
                    key={phase}
                    onClick={() => handleBGMTest(phase)}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded"
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </section>

            {/* SFX 테스트 */}
            <section className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">⚡ SFX + VFX 테스트</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleSFXTest('beam')} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded">
                  빔 발사
                </button>
                <button onClick={() => handleSFXTest('missile')} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded">
                  미사일
                </button>
                <button onClick={() => handleSFXTest('explosion')} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
                  대폭발
                </button>
                <button onClick={() => handleSFXTest('shield')} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded">
                  쉴드 피격
                </button>
                <button onClick={() => handleSFXTest('shield_break')} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                  쉴드 붕괴
                </button>
                <button onClick={() => handleSFXTest('warp')} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded">
                  와프
                </button>
              </div>
            </section>

            {/* UI 사운드 테스트 */}
            <section className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">🖱️ UI 사운드 테스트</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleUITest('click')} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded">
                  클릭
                </button>
                <button onClick={() => handleUITest('hover')} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded">
                  호버
                </button>
                <button onClick={() => handleUITest('notification')} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded">
                  알림
                </button>
                <button onClick={() => handleUITest('alert')} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
                  경고
                </button>
              </div>
            </section>

            {/* 화면 효과 테스트 */}
            <section className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">🎬 화면 효과 테스트</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleScreenEffect('shake')} className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded">
                  흔들림
                </button>
                <button onClick={() => handleScreenEffect('flash')} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded">
                  플래시
                </button>
                <button onClick={() => handleScreenEffect('danger')} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
                  위험
                </button>
                <button onClick={() => handleScreenEffect('victory')} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded">
                  승리
                </button>
                <button onClick={() => handleScreenEffect('defeat')} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded">
                  패배
                </button>
              </div>
            </section>

            {/* 전투 이벤트 테스트 */}
            <section className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">📡 전투 이벤트 연동 테스트</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleBattleEvent('BATTLE_START')} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                  BATTLE_START
                </button>
                <button onClick={() => handleBattleEvent('BEAM_FIRE')} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded">
                  BEAM_FIRE
                </button>
                <button onClick={() => handleBattleEvent('SHIELD_HIT')} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded">
                  SHIELD_HIT
                </button>
                <button onClick={() => handleBattleEvent('UNIT_DESTROYED')} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded">
                  UNIT_DESTROYED
                </button>
                <button onClick={() => handleBattleEvent('WARP_IN')} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded">
                  WARP_IN
                </button>
              </div>
            </section>

            {/* 볼륨 조절 */}
            <section className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">🔈 볼륨 조절</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">마스터: {Math.round(audio.masterVolume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audio.masterVolume * 100}
                    onChange={(e) => audio.setMasterVolume(Number(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">BGM: {Math.round(audio.musicVolume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audio.musicVolume * 100}
                    onChange={(e) => audio.setMusicVolume(Number(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">SFX: {Math.round(audio.sfxVolume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audio.sfxVolume * 100}
                    onChange={(e) => audio.setSfxVolume(Number(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={audio.toggleMute}
                  className={`px-4 py-2 rounded ${audio.muted ? 'bg-red-600' : 'bg-gray-600'}`}
                >
                  {audio.muted ? '🔇 음소거 중' : '🔊 음소거'}
                </button>
              </div>
            </section>
          </div>

          {/* 오른쪽: 캔버스 + 로그 */}
          <div className="space-y-4">
            {/* VFX 캔버스 */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">🎆 VFX 미리보기</h2>
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
                className="w-full rounded border border-gray-700"
              />
            </div>

            {/* 로그 */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-3">📋 테스트 로그</h2>
              <div className="h-64 overflow-y-auto bg-gray-900 p-3 rounded text-sm font-mono">
                {testLog.length === 0 ? (
                  <p className="text-gray-500">로그가 없습니다. 버튼을 클릭해보세요!</p>
                ) : (
                  testLog.map((msg, i) => (
                    <div key={i} className="text-gray-300">{msg}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








