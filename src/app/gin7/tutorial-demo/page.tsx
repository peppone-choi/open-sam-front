'use client';

import { useState } from 'react';
import { MainContent } from '@/components/gin7/layout';
import { useTutorial, Tooltip, TooltipTerm, HelpCenter } from '@/components/gin7/tutorial';
import { useGin7TutorialStore } from '@/stores/gin7TutorialStore';
import { allTutorials, getTermByKeyword } from '@/data/gin7/tutorials';

export default function TutorialDemoPage() {
  const { startTutorial, isActive } = useTutorial();
  const { progress, resetTutorial } = useGin7TutorialStore();
  const [helpOpen, setHelpOpen] = useState(false);

  const pcpTerm = getTermByKeyword('PCP');
  const mcpTerm = getTermByKeyword('MCP');
  const empireTerm = getTermByKeyword('은하제국');

  return (
    <MainContent
      title="튜토리얼 시스템 데모"
      subtitle="Spotlight, Tooltip, Help Center 테스트"
    >
      <div className="space-y-8">
        {/* 튜토리얼 시작 버튼들 */}
        <section className="rounded-2xl border border-white/10 bg-space-panel/50 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">튜토리얼 시퀀스</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allTutorials.map((seq) => {
              const isCompleted = progress.completedSequences.includes(seq.id);
              const isSkipped = progress.skippedSequences.includes(seq.id);
              
              return (
                <button
                  key={seq.id}
                  onClick={() => startTutorial(seq.id)}
                  disabled={isActive}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    isCompleted 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : isSkipped
                        ? 'border-yellow-500/30 bg-yellow-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <h3 className="font-semibold text-foreground">{seq.name}</h3>
                  <p className="text-sm text-foreground-muted mt-1">{seq.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                      {seq.steps.length}단계
                    </span>
                    {seq.estimatedDuration && (
                      <span className="text-xs text-foreground-muted">
                        ~{Math.ceil(seq.estimatedDuration / 60)}분
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs text-green-400">✓ 완료</span>
                    )}
                    {isSkipped && (
                      <span className="text-xs text-yellow-400">건너뜀</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <button
            onClick={resetTutorial}
            className="mt-4 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            진행 상황 초기화
          </button>
        </section>

        {/* 툴팁 데모 */}
        <section className="rounded-2xl border border-white/10 bg-space-panel/50 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">툴팁 데모</h2>
          
          <div className="space-y-4">
            <p className="text-foreground-muted">
              <Tooltip content="간단한 텍스트 툴팁입니다.">
                <span className="border-b border-dotted border-foreground-muted cursor-help">
                  마우스를 올려보세요
                </span>
              </Tooltip>
              {' '}(단순 텍스트 툴팁)
            </p>

            <p className="text-foreground-muted">
              게임에서 행동을 하려면{' '}
              {pcpTerm && <TooltipTerm term="PCP" definition={pcpTerm} />}
              {' '}또는{' '}
              {mcpTerm && <TooltipTerm term="MCP" definition={mcpTerm} />}
              가 필요합니다. (용어 툴팁)
            </p>

            <p className="text-foreground-muted">
              {empireTerm && <TooltipTerm term="은하제국" definition={empireTerm} />}
              은 강력한 군사력을 가진 세력입니다. (세력 툴팁)
            </p>
          </div>
        </section>

        {/* 도움말 센터 */}
        <section className="rounded-2xl border border-white/10 bg-space-panel/50 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">도움말 센터</h2>
          
          <button
            onClick={() => setHelpOpen(true)}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            도움말 센터 열기
          </button>
          
          <p className="text-sm text-foreground-muted mt-2">
            또는 키보드에서 <kbd className="px-2 py-1 rounded bg-white/10 text-xs">?</kbd> 키를 누르세요
          </p>
        </section>

        {/* 테스트용 UI 요소들 */}
        <section className="rounded-2xl border border-white/10 bg-space-panel/50 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">테스트용 UI 요소</h2>
          <p className="text-sm text-foreground-muted mb-4">
            튜토리얼에서 하이라이트할 요소들 (data-tutorial 속성)
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              data-tutorial="topbar"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">상단 바</span>
            </div>
            <div 
              data-tutorial="cp-display"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">CP 표시</span>
            </div>
            <div 
              data-tutorial="notifications"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">알림</span>
            </div>
            <div 
              data-tutorial="sidemenu"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">사이드 메뉴</span>
            </div>
            <div 
              data-tutorial="menu-map"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">지도 메뉴</span>
            </div>
            <div 
              data-tutorial="galaxy-map"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">은하 지도</span>
            </div>
            <div 
              data-tutorial="minimap"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">미니맵</span>
            </div>
            <div 
              data-tutorial="menu-fleet"
              className="p-4 rounded-lg border border-white/10 bg-white/5 text-center"
            >
              <span className="text-sm text-foreground-muted">함대 메뉴</span>
            </div>
          </div>
        </section>
      </div>

      {/* 도움말 센터 모달 */}
      <HelpCenter isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </MainContent>
  );
}













