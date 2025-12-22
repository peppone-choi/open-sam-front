'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

type ServerStatus = 'preparing' | 'running' | 'paused' | 'finished' | 'united' | string;
type ServerStatusKey = 'preparing' | 'running' | 'paused' | 'finished' | 'united';

type AdminAction =
  | 'serverName'
  | 'scenario'
  | 'scenarioText'
  | 'serverDescription'
  | 'serverCnt'
  | 'msg'
  | 'log'
  | 'starttime'
  | 'maxgeneral'
  | 'maxnation'
  | 'startyear'
  | 'warDeclareYear'
  | 'warDeployYear'
  | 'allowNpcPossess'
  | 'turnterm'
  | 'tacticalMaxTurns'
  | 'status'
  | 'resetScenario'
  // PHP game_env 추가 액션
  | 'npcmode'
  | 'extended_general'
  | 'fiction'
  | 'show_img_level'
  | 'genius'
  | 'block_general_create'
  | 'develcost';

type AdminActionValue = string | number | boolean | undefined;

interface AdminGameSettings {
  serverName?: string;
  scenario?: string;
  scenarioText?: string;
  serverDescription?: string;
  serverCnt?: number;
  msg?: string;
  log?: string;
  starttime?: string;
  turntime?: string;
  maxgeneral?: number;
  maxnation?: number;
  startyear?: number;
  year?: number;
  month?: number;
  allowNpcPossess?: boolean;
  turnterm?: number;
  status?: ServerStatus;
  openingPartYear?: number;
  warDeclareYear?: number;
  warDeployYear?: number;
  // 전술전투 설정
  tacticalMaxTurns?: number;
  tacticalTurnTimeLimit?: number;
  // PHP game_env 추가 필드
  npcmode?: number;            // NPC 모드 (0=일반, 1=빠른삭턴)
  extended_general?: number;   // 확장 장수 (0=비활성, 1=활성)
  fiction?: number;            // 픽션 모드 (0=정사, 1=픽션)
  show_img_level?: number;     // 이미지 레벨 (0~3)
  genius?: number;             // 천재 제한
  block_general_create?: number; // 장수 생성 제한 (0=허용, 1=제한)
  killturn?: number;           // 삭턴 (자동 계산)
  develcost?: number;          // 내정/이동 비용
  init_year?: number;          // 초기 년도
  init_month?: number;         // 초기 월
}

interface ScenarioTemplate {
  id: string;
  title: string;
  startYear: number;
  mapName: string;
}

interface AdminUpdatePayload extends Record<string, string | number | boolean | undefined> {
  session_id: string;
  serverName?: string;
  scenario?: string;
  serverDescription?: string;
  msg?: string;
  log?: string;
  starttime?: string;
  maxgeneral?: number;
  maxnation?: number;
  startyear?: number;
  warDeclareYear?: number;
  warDeployYear?: number;
  allowNpcPossess?: boolean;
  turnterm?: number;
  tacticalMaxTurns?: number;
  status?: ServerStatus;
  scenarioId?: string;
  // PHP game_env 추가 필드
  npcmode?: number;
  extended_general?: number;
  fiction?: number;
  show_img_level?: number;
  genius?: number;
  block_general_create?: number;
  develcost?: number;
}

export default function AdminGamePage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AdminGameSettings>({});
  
  // 폼 상태
  const [serverName, setServerName] = useState('');
  const [scenario, setScenario] = useState('');
  const [scenarioText, setScenarioText] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [serverCnt, setServerCnt] = useState(1);
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState('');
  const [starttime, setStarttime] = useState('');
  const [maxgeneral, setMaxgeneral] = useState(300);
  const [maxnation, setMaxnation] = useState(12);
  const [startyear, setStartyear] = useState(220);
  const [warDeclareYear, setWarDeclareYear] = useState(1);
  const [warDeployYear, setWarDeployYear] = useState(3);
  const [allowNpcPossess, setAllowNpcPossess] = useState(false);
  
  // 전술전투 설정
  const [tacticalMaxTurns, setTacticalMaxTurns] = useState(15);
  
  // PHP game_env 추가 필드
  const [npcmode, setNpcmode] = useState(0);
  const [extendedGeneral, setExtendedGeneral] = useState(0);
  const [fiction, setFiction] = useState(0);
  const [showImgLevel, setShowImgLevel] = useState(3);
  const [genius, setGenius] = useState(100);
  const [blockGeneralCreate, setBlockGeneralCreate] = useState(0);
  const [develcost, setDevelcost] = useState(20);
  
  // 시나리오 목록
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  const loadScenarios = useCallback(async () => {
    try {
      const result = await SammoAPI.GetPhpScenarios();
      if (result.success) {
        setScenarios(result.data.scenarios);
      } else {
        setScenarios([]);
      }
    } catch (error) {
      console.error('시나리오 목록 로드 실패:', error);
      setScenarios([]);
    }
  }, []);
 

  const loadSettings = useCallback(async () => {
    if (!serverID) {
      return;
    }

    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetGameInfo({ session_id: serverID });
      if (result.result) {
        const data = (result.gameInfo || {}) as AdminGameSettings;
        setSettings(data);
        setServerName(data.serverName || '');
        setScenario(data.scenario || '');
        setScenarioText(data.scenarioText || '');
        setServerDescription(data.serverDescription || '');
        setServerCnt(data.serverCnt || 1);
        setMsg(data.msg || '');
        setStarttime(data.starttime ? data.starttime.substring(0, 19) : '');
        setMaxgeneral(data.maxgeneral || 300);
        setMaxnation(data.maxnation || 12);
        setStartyear(data.startyear || 220);
        setWarDeclareYear(data.warDeclareYear ?? 1);
        setWarDeployYear(data.warDeployYear ?? 3);
        setAllowNpcPossess(!!data.allowNpcPossess);
        setTacticalMaxTurns(data.tacticalMaxTurns ?? 15);
        // PHP game_env 추가 필드
        setNpcmode(data.npcmode ?? 0);
        setExtendedGeneral(data.extended_general ?? 0);
        setFiction(data.fiction ?? 0);
        setShowImgLevel(data.show_img_level ?? 3);
        setGenius(data.genius ?? 100);
        setBlockGeneralCreate(data.block_general_create ?? 0);
        setDevelcost(data.develcost ?? 20);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [serverID]);

  useEffect(() => {
    void loadSettings();
    void loadScenarios();
  }, [loadScenarios, loadSettings]);

  const handleSubmit = useCallback(async (action: AdminAction, value?: AdminActionValue) => {
    if (!serverID) {
      showToast('서버 정보가 없습니다.', 'error');
      return;
    }

    try {
      const payload: AdminUpdatePayload = { session_id: serverID };
      switch (action) {
        case 'serverName':
          payload.serverName = serverName.trim();
          break;
        case 'scenario':
          payload.scenario = scenario.trim();
          break;
        case 'scenarioText':
          payload.scenarioText = scenarioText.trim();
          break;
        case 'serverDescription':
          payload.serverDescription = serverDescription.trim();
          break;
        case 'serverCnt':
          payload.serverCnt = serverCnt;
          break;
        case 'msg':
          payload.msg = msg;
          break;
        case 'log':
          payload.log = log;
          break;
        case 'starttime':
          payload.starttime = starttime;
          break;
        case 'maxgeneral':
          payload.maxgeneral = maxgeneral;
          break;
        case 'maxnation':
          payload.maxnation = maxnation;
          break;
        case 'startyear':
          payload.startyear = startyear;
          break;
        case 'warDeclareYear':
          payload.warDeclareYear = warDeclareYear;
          break;
        case 'warDeployYear':
          payload.warDeployYear = warDeployYear;
          break;
        case 'allowNpcPossess':
          payload.allowNpcPossess = allowNpcPossess;
          break;
        case 'turnterm':
          payload.turnterm = typeof value === 'number' ? value : Number(value ?? settings.turnterm ?? 60);
          break;
        case 'tacticalMaxTurns':
          payload.tacticalMaxTurns = typeof value === 'number' ? value : tacticalMaxTurns;
          break;
        case 'status':
          payload.status = (value as ServerStatus) || settings.status || 'running';
          break;
        case 'resetScenario':
          payload.scenarioId = (value as string) || selectedScenarioId;
          if (!payload.scenarioId) {
            showToast('시나리오를 선택해주세요', 'warning');
            return;
          }
          payload.turnterm = settings.turnterm || 60;
          break;
        // PHP game_env 추가 액션
        case 'npcmode':
          payload.npcmode = typeof value === 'number' ? value : npcmode;
          break;
        case 'extended_general':
          payload.extended_general = typeof value === 'number' ? value : extendedGeneral;
          break;
        case 'fiction':
          payload.fiction = typeof value === 'number' ? value : fiction;
          break;
        case 'show_img_level':
          payload.show_img_level = typeof value === 'number' ? value : showImgLevel;
          break;
        case 'genius':
          payload.genius = typeof value === 'number' ? value : genius;
          break;
        case 'block_general_create':
          payload.block_general_create = typeof value === 'number' ? value : blockGeneralCreate;
          break;
        case 'develcost':
          payload.develcost = typeof value === 'number' ? value : develcost;
          break;
        default:
          break;
      }

      const result = await SammoAPI.AdminUpdateGame({ action, data: payload });
      
      if (result.result) {
        showToast('변경되었습니다', 'success');
        if (action === 'log') {
          setLog('');
        }
        if (action === 'resetScenario') {
          showToast('시나리오가 초기화되었습니다. 페이지를 새로고침합니다.', 'success');
          window.location.reload();
        } else {
          void loadSettings();
        }
      } else {
        showToast(result.reason || '변경에 실패했습니다', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || '오류가 발생했습니다', 'error');
    }
  }, [allowNpcPossess, loadSettings, log, maxgeneral, maxnation, msg, scenario, scenarioText, serverCnt, serverDescription, selectedScenarioId, serverID, serverName, settings.status, settings.turnterm, showToast, starttime, startyear, warDeclareYear, warDeployYear, npcmode, extendedGeneral, fiction, showImgLevel, genius, blockGeneralCreate, develcost, tacticalMaxTurns]);

  const handleChangeStatus = useCallback((status: ServerStatusKey) => {
    const statusLabels: Record<ServerStatusKey, string> = {
      preparing: '준비중 (테스트)',
      running: '운영중',
      paused: '폐쇄',
      finished: '종료',
      united: '천하통일'
    };
    const statusText = statusLabels[status];
    if (confirm(`서버를 "${statusText}" 상태로 변경하시겠습니까?`)) {
      void handleSubmit('status', status);
    }
  }, [handleSubmit]);

  const handleResetScenario = useCallback(() => {
    if (!selectedScenarioId) {
      showToast('시나리오를 선택해주세요', 'warning');
      return;
    }
    
    const selectedScenario = scenarios.find((scenarioTemplate) => scenarioTemplate.id === selectedScenarioId);
    if (!selectedScenario) {
      showToast('선택한 시나리오를 찾을 수 없습니다.', 'error');
      return;
    }
    
    if (confirm(`정말로 "${selectedScenario.title}" 시나리오로 서버를 초기화하시겠습니까?\n\n⚠️ 모든 장수/국가 데이터가 삭제됩니다!`)) {
      void handleSubmit('resetScenario', selectedScenarioId);
    }
  }, [handleSubmit, scenarios, selectedScenarioId, showToast]);
 

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
        <TopBackBar title="게 임 설 정" />
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="게 임 설 정" reloadable onReload={loadSettings} />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Server Status Control */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">⚙️ 서버 상태 제어</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'preparing', label: '🔧 준비중', color: 'bg-purple-600 hover:bg-purple-700' },
              { key: 'running', label: '✅ 운영중', color: 'bg-green-600 hover:bg-green-700' },
              { key: 'paused', label: '🔒 폐쇄', color: 'bg-red-600 hover:bg-red-700' },
              { key: 'finished', label: '🏁 종료', color: 'bg-gray-600 hover:bg-gray-700' },
              { key: 'united', label: '👑 천하통일', color: 'bg-yellow-500 text-black hover:bg-yellow-400' },
            ].map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => handleChangeStatus(btn.key as ServerStatusKey)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all text-sm shadow",
                  settings.status === btn.key ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : "opacity-80 hover:opacity-100",
                  btn.color
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-gray-400">
            현재 상태: <strong className="text-white">
              {settings.status === 'preparing' && '🔧 준비중 (테스트 플레이 가능, 턴 진행 ❌)'}
              {settings.status === 'running' && '✅ 운영중 (정상 운영)'}
              {settings.status === 'paused' && '🔒 폐쇄 (접속 불가)'}
              {settings.status === 'finished' && '🏁 종료 (게임 완료)'}
              {settings.status === 'united' && '👑 천하통일 (게임 완료)'}
              {!settings.status && '알 수 없음'}
            </strong>
          </div>
        </div>

        {/* Scenario Reset */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg border-l-4 border-l-red-500">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">🎮 시나리오 초기화</h2>
          
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500/50 transition-colors text-white w-full"
            >
              <option value="" className="bg-gray-900">-- 시나리오 선택 --</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900">
                  {s.title} ({s.startYear}년)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleResetScenario}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow transition-colors whitespace-nowrap"
            >
              ⚠️ 서버 초기화
            </button>
          </div>
          <p className="mt-3 text-sm text-red-400">
            ⚠️ 주의: 서버 초기화 시 모든 장수, 국가, 전쟁 데이터가 삭제되고 선택한 시나리오로 재설정됩니다.
          </p>
        </div>

        {/* Basic Settings */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">📝 서버 기본 정보</h2>
          
          <div className="space-y-4">
            {/* 서버 이름 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-32 text-sm font-medium text-gray-400">서버 이름</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="서버 표시 이름 (게임 화면 상단에 표시)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                />
                <button 
                  onClick={() => void handleSubmit('serverName')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 시나리오 설명 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-32 text-sm font-medium text-gray-400">시나리오 설명</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  placeholder="시나리오 설명 (게임 화면 하단에 표시)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                />
                <button 
                  onClick={() => void handleSubmit('scenarioText')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 서버 설명 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-32 text-sm font-medium text-gray-400">서버 설명</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={serverDescription}
                  onChange={(e) => {
                    console.log('서버 설명 onChange:', e.target.value);
                    setServerDescription(e.target.value);
                  }}
                  placeholder="서버 설명 (로비 서버 안내에 표시)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                />
                <button 
                  onClick={() => {
                    console.log('서버 설명 변경 클릭, 현재값:', serverDescription);
                    void handleSubmit('serverDescription');
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 운영자 메시지 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-32 text-sm font-medium text-gray-400">운영자 메시지</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="공지사항 등"
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                />
                <button 
                  onClick={() => void handleSubmit('msg')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* Special Field: Log */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-32 text-sm font-medium text-gray-400">중원정세 추가</label>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={log}
                  onChange={(e) => setLog(e.target.value)}
                  maxLength={80}
                  placeholder="중원정세 로그..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                />
                <button 
                  onClick={() => void handleSubmit('log')}
                  className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-sm text-white transition-colors"
                >
                  로그쓰기
                </button>
              </div>
            </div>

            {/* Grid for numeric inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label className="w-32 text-sm font-medium text-gray-400">기수</label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={serverCnt}
                    min={1}
                    onChange={(e) => setServerCnt(Number(e.target.value))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-right focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  />
                  <span className="flex items-center text-gray-400 text-sm">기</span>
                  <button 
                    onClick={() => void handleSubmit('serverCnt')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label className="w-32 text-sm font-medium text-gray-400">최대 장수</label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={maxgeneral}
                    onChange={(e) => setMaxgeneral(Number(e.target.value))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-right focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  />
                  <button 
                    onClick={() => void handleSubmit('maxgeneral')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label className="w-32 text-sm font-medium text-gray-400">최대 국가</label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={maxnation}
                    onChange={(e) => setMaxnation(Number(e.target.value))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-right focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  />
                  <button 
                    onClick={() => void handleSubmit('maxnation')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label className="w-32 text-sm font-medium text-gray-400">시작 연도</label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={startyear}
                    onChange={(e) => setStartyear(Number(e.target.value))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-right focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  />
                  <button 
                    onClick={() => void handleSubmit('startyear')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-400">현재 년월</label>
                <div className="text-white font-mono">
                  {settings.year || 220}년 {settings.month || 1}월
                </div>
              </div>
            </div>

            {/* 전쟁 관련 년도 설정 */}
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold text-orange-400 mb-3">⚔️ 전쟁 관련 년도 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <label className="w-32 text-sm font-medium text-gray-400">선포 가능</label>
                  <div className="flex-1 flex gap-2 items-center">
                    <span className="text-gray-500 text-sm">+</span>
                    <input
                      type="number"
                      value={warDeclareYear}
                      min={0}
                      onChange={(e) => setWarDeclareYear(Number(e.target.value))}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-orange-500/50 transition-colors text-white"
                    />
                    <span className="text-gray-400 text-sm">년</span>
                    <button 
                      onClick={() => void handleSubmit('warDeclareYear')}
                      className="px-3 py-2 bg-orange-600/30 hover:bg-orange-600/50 rounded-lg text-sm text-white transition-colors"
                    >
                      변경
                    </button>
                    <span className="text-xs text-gray-500">
                      ({startyear + warDeclareYear}년~)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <label className="w-32 text-sm font-medium text-gray-400">출병 가능</label>
                  <div className="flex-1 flex gap-2 items-center">
                    <span className="text-gray-500 text-sm">+</span>
                    <input
                      type="number"
                      value={warDeployYear}
                      min={0}
                      onChange={(e) => setWarDeployYear(Number(e.target.value))}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-red-500/50 transition-colors text-white"
                    />
                    <span className="text-gray-400 text-sm">년</span>
                    <button 
                      onClick={() => void handleSubmit('warDeployYear')}
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 rounded-lg text-sm text-white transition-colors"
                    >
                      변경
                    </button>
                    <span className="text-xs text-gray-500">
                      ({startyear + warDeployYear}년~)
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                시작 연도 기준 상대 년도입니다. 예: 선포 가능 +1년 = {startyear}+1 = {startyear + 1}년부터 선전포고 가능
              </p>
            </div>

            {/* Turn Time */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400 mb-1">
                  턴 시간 설정 <span className="text-xs text-gray-500 font-normal">(현재: {settings.turnterm || 60}분)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 5, 10, 20, 30, 60, 120].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => void handleSubmit('turnterm', term)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm transition-colors",
                        settings.turnterm === term 
                          ? "bg-blue-600 text-white" 
                          : "bg-white/5 hover:bg-white/10 text-gray-300"
                      )}
                    >
                      {term}분
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tactical Battle Settings */}
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold text-cyan-400 mb-3">⚔️ 전술전투 설정</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <label className="w-40 text-sm font-medium text-gray-400">최대 전술턴 수</label>
                  <div className="flex-1 flex gap-2 items-center">
                    <input
                      type="number"
                      value={tacticalMaxTurns}
                      min={5}
                      max={50}
                      onChange={(e) => setTacticalMaxTurns(Number(e.target.value))}
                      className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-cyan-500/50 transition-colors text-white"
                    />
                    <span className="text-gray-400 text-sm">턴</span>
                    <button 
                      onClick={() => void handleSubmit('tacticalMaxTurns', tacticalMaxTurns)}
                      className="px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 rounded-lg text-sm text-white transition-colors"
                    >
                      변경
                    </button>
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>전략턴 시간:</span>
                    <span className="text-white">{settings.turnterm || 5}분</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mb-1">
                    <span>최대 전술턴:</span>
                    <span className="text-white">{settings.tacticalMaxTurns || tacticalMaxTurns}턴</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>전술턴당 시간:</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.max(10, Math.floor(((settings.turnterm || 5) * 60) / (settings.tacticalMaxTurns || tacticalMaxTurns)))}초
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  전술전투는 전략턴 시간 내에 완료되어야 합니다. 턴당 시간 = 전략턴(초) / 최대전술턴 (최소 10초)
                </p>
              </div>
            </div>

            {/* Allow NPC Possess */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNpcPossess}
                  onChange={(e) => setAllowNpcPossess(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm font-medium text-white">NPC 빙의 허용</span>
              </label>
              <button 
                onClick={() => void handleSubmit('allowNpcPossess')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
              >
                변경
              </button>
            </div>

          </div>
        </div>

        {/* Advanced Game Settings (PHP game_env compatible) */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg border-l-4 border-l-purple-500">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">🔧 고급 게임 설정 (PHP 호환)</h2>
          
          <div className="space-y-4">
            {/* NPC 모드 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-40 text-sm font-medium text-gray-400">NPC 모드</label>
              <div className="flex-1 flex gap-2">
                <select
                  value={npcmode}
                  onChange={(e) => setNpcmode(Number(e.target.value))}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                >
                  <option value={0} className="bg-gray-900">일반 (기본)</option>
                  <option value={1} className="bg-gray-900">빠른 삭턴 (삭턴 1/3)</option>
                </select>
                <button 
                  onClick={() => void handleSubmit('npcmode')}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 확장 장수 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-40 text-sm font-medium text-gray-400">확장 장수</label>
              <div className="flex-1 flex gap-2">
                <select
                  value={extendedGeneral}
                  onChange={(e) => setExtendedGeneral(Number(e.target.value))}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                >
                  <option value={0} className="bg-gray-900">비활성화 (기본)</option>
                  <option value={1} className="bg-gray-900">활성화 (추가 NPC 등장)</option>
                </select>
                <button 
                  onClick={() => void handleSubmit('extended_general')}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 픽션 모드 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-40 text-sm font-medium text-gray-400">픽션 모드</label>
              <div className="flex-1 flex gap-2">
                <select
                  value={fiction}
                  onChange={(e) => setFiction(Number(e.target.value))}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                >
                  <option value={0} className="bg-gray-900">정사 모드 (기본)</option>
                  <option value={1} className="bg-gray-900">픽션 모드 (랜덤 요소 증가)</option>
                </select>
                <button 
                  onClick={() => void handleSubmit('fiction')}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 이미지 레벨 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-40 text-sm font-medium text-gray-400">이미지 표시</label>
              <div className="flex-1 flex gap-2">
                <select
                  value={showImgLevel}
                  onChange={(e) => setShowImgLevel(Number(e.target.value))}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                >
                  <option value={0} className="bg-gray-900">이미지 없음</option>
                  <option value={1} className="bg-gray-900">기본 이미지만</option>
                  <option value={2} className="bg-gray-900">서버 이미지</option>
                  <option value={3} className="bg-gray-900">모든 이미지 (기본)</option>
                </select>
                <button 
                  onClick={() => void handleSubmit('show_img_level')}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 장수 생성 제한 */}
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <label className="w-40 text-sm font-medium text-gray-400">장수 생성</label>
              <div className="flex-1 flex gap-2">
                <select
                  value={blockGeneralCreate}
                  onChange={(e) => setBlockGeneralCreate(Number(e.target.value))}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                >
                  <option value={0} className="bg-gray-900">신규 생성 허용 (기본)</option>
                  <option value={1} className="bg-gray-900">신규 생성 제한 (빙의만 가능)</option>
                </select>
                <button 
                  onClick={() => void handleSubmit('block_general_create')}
                  className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                >
                  변경
                </button>
              </div>
            </div>

            {/* 숫자 입력 필드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-white/5">
              {/* 천재 제한 */}
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label className="w-32 text-sm font-medium text-gray-400">천재 제한</label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={genius}
                    min={0}
                    onChange={(e) => setGenius(Number(e.target.value))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-right focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                  />
                  <button 
                    onClick={() => void handleSubmit('genius')}
                    className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>

              {/* 내정 비용 */}
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <label className="w-32 text-sm font-medium text-gray-400">내정 비용</label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="number"
                    value={develcost}
                    min={1}
                    onChange={(e) => setDevelcost(Number(e.target.value))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-right focus:outline-none focus:border-purple-500/50 transition-colors text-white"
                  />
                  <button 
                    onClick={() => void handleSubmit('develcost')}
                    className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-white transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>

            {/* 정보 표시 */}
            <div className="bg-black/20 rounded-lg p-4 mt-4">
              <h4 className="text-sm font-bold text-purple-400 mb-2">📊 현재 설정 요약</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">삭턴:</span>
                  <span className="ml-2 text-white font-mono">{settings.killturn ?? Math.floor(4800 / (settings.turnterm || 60))}턴</span>
                </div>
                <div>
                  <span className="text-gray-400">초기 년월:</span>
                  <span className="ml-2 text-white font-mono">{settings.init_year ?? settings.startyear}년 {settings.init_month ?? 1}월</span>
                </div>
                <div>
                  <span className="text-gray-400">시즌:</span>
                  <span className="ml-2 text-white font-mono">1</span>
                </div>
                <div>
                  <span className="text-gray-400">내정 비용:</span>
                  <span className="ml-2 text-white font-mono">{settings.develcost ?? develcost}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ⚠️ 이 설정들은 PHP 게임 엔진과 호환됩니다. 변경 시 게임 밸런스에 영향을 줄 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
