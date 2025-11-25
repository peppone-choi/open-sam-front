'use client';

import { useState, useEffect } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { loghApi } from '@/lib/api/logh';
import { CommandType, UserProfile } from '@/types/logh';
import { useToast } from '@/contexts/ToastContext';

// Command Interface Definitions
interface CommandOption {
  label: string;
  value: string | number;
}

interface CommandDefinition {
  id: CommandType;
  name: string;
  category: 'movement' | 'combat' | 'domestic' | 'diplomacy' | 'special';
  cpCost: number;
  description: string;
  options?: {
    type: 'select' | 'number' | 'text';
    label: string;
    key: string;
    choices?: CommandOption[];
    min?: number;
    max?: number;
  }[];
}

const COMMAND_LIST: CommandDefinition[] = [
  {
    id: 'move',
    name: '함대 이동',
    category: 'movement',
    cpCost: 2,
    description: '지정한 좌표로 함대를 이동시킵니다.',
    options: [
      { type: 'number', label: 'X 좌표', key: 'x', min: 0, max: 99 },
      { type: 'number', label: 'Y 좌표', key: 'y', min: 0, max: 49 },
    ]
  },
  {
    id: 'warp',
    name: '워프',
    category: 'movement',
    cpCost: 5,
    description: '장거리 도약 항법을 사용하여 빠르게 이동합니다. (에너지 소모 큼)',
    options: [
      { type: 'number', label: 'X 좌표', key: 'x', min: 0, max: 99 },
      { type: 'number', label: 'Y 좌표', key: 'y', min: 0, max: 49 },
    ]
  },
  {
    id: 'attack',
    name: '공격',
    category: 'combat',
    cpCost: 3,
    description: '사거리 내의 적 함대를 공격합니다.',
    options: [
      { type: 'select', label: '목표 함대', key: 'targetId', choices: [] }, // Dynamic
    ]
  },
  {
    id: 'tactics',
    name: '진형 변경',
    category: 'combat',
    cpCost: 1,
    description: '함대의 진형을 변경하여 전투 효율을 조정합니다.',
    options: [
      { 
        type: 'select', 
        label: '진형 선택', 
        key: 'formation', 
        choices: [
          { label: '표준 진형 (밸런스)', value: 'standard' },
          { label: '돌격 진형 (공격↑ 방어↓)', value: 'assault' },
          { label: '방어 진형 (방어↑ 기동↓)', value: 'defense' },
          { label: '포위 진형 (명중↑)', value: 'encircle' },
        ] 
      },
    ]
  },
  {
    id: 'personnel',
    name: '징병',
    category: 'domestic',
    cpCost: 3,
    description: '거주 행성에서 병력을 모집합니다.',
    options: [
      { type: 'number', label: '모집 수', key: 'amount', min: 100, max: 10000 },
    ]
  },
  {
    id: 'supply',
    name: '보급',
    category: 'domestic',
    cpCost: 2,
    description: '보급 기지에서 물자를 보충합니다.',
  },
];

export default function LoghCommandsPage() {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCommand, setSelectedCommand] = useState<CommandDefinition | null>(null);
  const [commandParams, setCommandParams] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [commander, setCommander] = useState<UserProfile | null>(null);

  // Load commander info
  useEffect(() => {
    const fetchInfo = async () => {
        try {
            const data = await loghApi.getUserProfile();
            setCommander(data);
        } catch (e) {
            console.error('제독 정보를 불러오는 중 오류가 발생했습니다', e);
        }
    };
    fetchInfo();
  }, []);

  // Filter commands by category
  const filteredCommands = selectedCategory === 'all' 
    ? COMMAND_LIST 
    : COMMAND_LIST.filter(cmd => cmd.category === selectedCategory);

  const handleCommandSelect = (cmd: CommandDefinition) => {
    setSelectedCommand(cmd);
    setCommandParams({});
  };

  const handleParamChange = (key: string, value: any) => {
    setCommandParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const executeCommand = async () => {
    if (!selectedCommand) return;
    
    setIsExecuting(true);
    try {
      // Use the API
      const result = await loghApi.executeCommand('default', selectedCommand.id, commandParams);
      
      if (result.success) {
          showToast(`명령 실행 완료: ${selectedCommand.name}`, 'success');
          setSelectedCommand(null);
          setCommandParams({});
          // Refresh commander info
          const data = await loghApi.getUserProfile();
          setCommander(data);
      } else {
          showToast(`명령 실패: ${result.message}`, 'error');
      }
    } catch (error: any) {
      showToast(`오류 발생: ${error.message}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-6 lg:p-8">
      <TopBackBar title="작전 커맨드 센터" backUrl="/logh/game" />
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Command Selection */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 p-4 bg-gray-900/50 rounded-xl border border-white/5">
            {['all', 'movement', 'combat', 'domestic'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors",
                  selectedCategory === cat 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {cat === 'all' ? '전체' : 
                 cat === 'movement' ? '이동' : 
                 cat === 'combat' ? '전투' : 
                 cat === 'domestic' ? '내정' : '기타'}
              </button>
            ))}
          </div>

          {/* Command List */}
          <div className="space-y-2">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleCommandSelect(cmd)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-200 flex justify-between items-center group",
                  selectedCommand?.id === cmd.id
                    ? "bg-blue-900/30 border-blue-500 ring-1 ring-blue-500/50"
                    : "bg-gray-900/50 border-white/5 hover:border-white/20 hover:bg-gray-800/50"
                )}
              >
                <div>
                  <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                    {cmd.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{cmd.category.toUpperCase()}</div>
                </div>
                <div className="px-2 py-1 bg-black/40 rounded text-xs font-mono text-purple-400 border border-purple-500/20">
                  필요 포인트 {cmd.cpCost}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Command Detail & Execution */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 h-full flex flex-col">
            {selectedCommand ? (
              <>
                <div className="border-b border-white/10 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                      {selectedCommand.name}
                      <span className="text-sm font-normal px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded border border-purple-500/30">
                        소모 포인트: {selectedCommand.cpCost}
                      </span>
                    </h2>

                  <p className="text-gray-400 text-sm leading-relaxed">
                    {selectedCommand.description}
                  </p>
                </div>

                <div className="flex-1 space-y-6">
                  {selectedCommand.options?.map((opt) => (
                    <div key={opt.key} className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">{opt.label}</label>
                      {opt.type === 'select' ? (
                        <select
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                          onChange={(e) => handleParamChange(opt.key, e.target.value)}
                        >
                          <option value="" className="bg-gray-900">선택하세요</option>
                          {opt.choices?.map((choice) => (
                            <option key={choice.value} value={choice.value} className="bg-gray-900">
                              {choice.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={opt.type}
                          min={opt.min}
                          max={opt.max}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                          placeholder={`${opt.label} 입력`}
                          onChange={(e) => handleParamChange(opt.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                  
                  {!selectedCommand.options && (
                    <div className="p-4 bg-blue-900/20 rounded-lg text-blue-300 text-sm border border-blue-500/20">
                      이 명령은 추가 설정 없이 즉시 실행됩니다.
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedCommand(null)}
                    className="px-6 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={executeCommand}
                    disabled={isExecuting}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isExecuting ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        실행 중...
                      </>
                    ) : (
                      '명령 실행'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 py-20">
                <div className="text-6xl opacity-20">🚀</div>
                <p className="text-lg">좌측 목록에서 명령을 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
