'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  startYear: number;
  version: string;
  order: number;
}

export default function AdminScenarioPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate | null>(null);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const result = await SammoAPI.GetPhpScenarios();
      if (result.success) {
        setScenarios(result.data.scenarios);
      } else {
        showToast('시나리오 목록을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || '오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadScenarioDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      // API endpoint: GET /api/scenarios/:scenarioId
      const response = await fetch(`/api/scenarios/${id.replace('/', '%2F')}`);
      const result = await response.json();
      
      if (result.success) {
        setScenarioData(result.data);
      } else {
        showToast('시나리오 상세 정보를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast('상세 정보 로드 중 오류 발생', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    void loadScenarios();
  }, [loadScenarios]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="시 나 리 오 관 리" reloadable onReload={loadScenarios} />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 shadow-lg h-[calc(100vh-200px)] flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              📂 시나리오 목록 ({scenarios.length})
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              ) : scenarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">목록이 비어있습니다.</div>
              ) : (
                scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScenario(s);
                      void loadScenarioDetail(s.id);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all border",
                      selectedScenario?.id === s.id
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-mono text-gray-500">#{s.order}</span>
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono">{s.id.split('/')[0]}</span>
                    </div>
                    <div className="font-bold text-sm truncate">{s.title}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{s.startYear}년 시작</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Scenario Detail / Editor Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-blue-400">{selectedScenario.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{selectedScenario.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                    💾 저장
                  </button>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-lg border border-white/10 transition-colors">
                    📥 내보내기
                  </button>
                </div>
              </div>

              {loadingDetail ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : scenarioData ? (
                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-350px)] pr-2 custom-scrollbar">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">시작 연도</div>
                      <div className="text-lg font-mono text-white">{scenarioData.startYear || scenarioData.metadata?.startYear}</div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">국가 수</div>
                      <div className="text-lg font-mono text-white">{scenarioData.nations?.length || 0}</div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">장수 수</div>
                      <div className="text-lg font-mono text-white">{scenarioData.generals?.length || 0}</div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">맵</div>
                      <div className="text-lg font-mono text-white">{scenarioData.mapName || 'Basic'}</div>
                    </div>
                  </div>

                  {/* JSON Editor (Temporary Placeholder) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">RAW DATA (JSON)</label>
                    <div className="bg-black/60 rounded-xl border border-white/10 overflow-hidden font-mono text-xs leading-relaxed">
                      <textarea
                        value={JSON.stringify(scenarioData, null, 2)}
                        readOnly
                        className="w-full h-[400px] p-4 bg-transparent text-blue-300 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-white/10"
                      />
                    </div>
                  </div>

                  {/* Quick Info Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                      <h4 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">🚩 국가 정보</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {scenarioData.nations?.map((n: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                            <span className="font-bold" style={{ color: n.color }}>{n.name}</span>
                            <span className="text-gray-500">{n.capital}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                      <h4 className="text-sm font-bold text-gray-300 mb-3 border-b border-white/5 pb-2">👤 주요 장수</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {scenarioData.generals?.slice(0, 20).map((g: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded">
                            <span className="text-gray-200">{g.name}</span>
                            <span className="text-gray-500">LV.{g.explevel || 1}</span>
                          </div>
                        ))}
                        {(scenarioData.generals?.length || 0) > 20 && (
                          <div className="text-[10px] text-center text-gray-600 pt-2">그 외 {(scenarioData.generals?.length || 0) - 20}명...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <span className="text-5xl mb-4">📜</span>
                  <p>정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900/30 border border-white/5 border-dashed rounded-xl h-[calc(100vh-200px)] flex flex-col items-center justify-center text-gray-500 px-8 text-center">
              <div className="text-6xl mb-6 opacity-20">📜</div>
              <h3 className="text-xl font-bold mb-2">시나리오를 선택해주세요</h3>
              <p className="max-w-md">좌측 목록에서 편집하거나 확인하고 싶은 시나리오를 선택하면 상세 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
