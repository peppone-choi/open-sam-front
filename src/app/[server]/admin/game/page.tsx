'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import styles from './page.module.css';

export default function AdminGamePage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  
  // 폼 상태
  const [serverName, setServerName] = useState('');
  const [scenario, setScenario] = useState('');
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState('');
  const [starttime, setStarttime] = useState('');
  const [maxgeneral, setMaxgeneral] = useState(300);
  const [maxnation, setMaxnation] = useState(12);
  const [startyear, setStartyear] = useState(220);
  const [allowNpcPossess, setAllowNpcPossess] = useState(false);
  
  // 시나리오 목록
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  // (서버별 페이지에서는 전역 세션을 관리하지 않음)

  useEffect(() => {
    loadSettings();
    loadScenarios();
  }, [serverID]);

  async function loadScenarios() {
    try {
      const result = await SammoAPI.GetPhpScenarios();
      if (result.success) {
        setScenarios(result.data.scenarios);
      }
    } catch (err) {
      console.error('시나리오 목록 로드 실패:', err);
    }
  }
 

  async function loadSettings() {
    try {
      setLoading(true);
      const result = await SammoAPI.AdminGetGameInfo();
      if (result.result) {
        const data = result.gameInfo;
        console.log('[Admin] Loaded game info:', { isunited: data.isunited, data });
        setSettings(data);
        setServerName(data.serverName || '');
        setScenario(data.scenario || '');
        setMsg(data.msg || '');
        setStarttime(data.starttime ? data.starttime.substring(0, 19) : '');
        setMaxgeneral(data.maxgeneral || 300);
        setMaxnation(data.maxnation || 12);
        setStartyear(data.startyear || 220);
        setAllowNpcPossess(data.allowNpcPossess || false);
      }
    } catch (err) {
      console.error(err);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(action: string, value?: any) {
    try {
      let data: any = { session_id: serverID };
      
      switch (action) {
        case 'serverName':
          data.serverName = serverName;
          break;
        case 'scenario':
          data.scenario = scenario;
          break;
        case 'msg':
          data.msg = msg;
          break;
        case 'log':
          data.log = log;
          break;
        case 'starttime':
          data.starttime = starttime;
          break;
        case 'maxgeneral':
          data.maxgeneral = maxgeneral;
          break;
        case 'maxnation':
          data.maxnation = maxnation;
          break;
        case 'startyear':
          data.startyear = startyear;
          break;
        case 'allowNpcPossess':
          data.allowNpcPossess = allowNpcPossess;
          break;
        case 'turnterm':
          data.turnterm = value;
          break;
        case 'status':
          data.status = value; // preparing, running, paused, finished, united
          break;
        case 'resetScenario':
          data.scenarioId = value;
          break;
      }

      const result = await SammoAPI.AdminUpdateGame({ action, data });
      
      if (result.result) {
        alert('변경되었습니다');
        if (action === 'log') setLog(''); // 로그는 초기화
        
        // 시나리오 리셋 후 자동 새로고침
        if (action === 'resetScenario') {
          alert('시나리오가 초기화되었습니다. 페이지를 새로고침합니다.');
          window.location.reload();
        } else {
          loadSettings();
        }
      } else {
        alert(result.reason || '변경에 실패했습니다');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '오류가 발생했습니다');
    }
  }

  async function handleChangeStatus(status: string) {
    const statusLabels: Record<string, string> = {
      preparing: '준비중 (테스트)',
      running: '운영중',
      paused: '폐쇄',
      finished: '종료',
      united: '천하통일'
    };
    const statusText = statusLabels[status] || status;
    console.log('[Admin] Changing server status:', { status, statusText });
    if (confirm(`서버를 "${statusText}" 상태로 변경하시겠습니까?`)) {
      await handleSubmit('status', status);
    }
  }

  async function handleResetScenario() {
    if (!selectedScenarioId) {
      alert('시나리오를 선택해주세요');
      return;
    }
    
    const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
    if (!selectedScenario) return;
    
    if (confirm(`정말로 "${selectedScenario.title}" 시나리오로 서버를 초기화하시겠습니까?\n\n⚠️ 모든 장수/국가 데이터가 삭제됩니다!`)) {
      // 현재 세션의 turnterm을 함께 전달
      try {
        const data = { 
          session_id: serverID,
          scenarioId: selectedScenarioId,
          turnterm: settings.turnterm || 60  // 분 단위
        };
        const result = await SammoAPI.AdminUpdateGame({ action: 'resetScenario', data });
        
        if (result.result) {
          alert('시나리오가 초기화되었습니다. 페이지를 새로고침합니다.');
          window.location.reload();
        } else {
          alert(result.reason || '변경에 실패했습니다');
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || '오류가 발생했습니다');
      }
    }
  }
 

  if (loading) {
    return (
      <div className={styles.container}>
        <TopBackBar title="게 임 설 정" />
        <div className="center" style={{ padding: '2rem' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopBackBar title="게 임 설 정" />

      <table className={`tb_layout bg0`} style={{ width: '1000px', margin: '0 auto' }}>
        <tbody>
          <tr>
            <td colSpan={4} className="bg2" style={{ textAlign: 'center', padding: '0.8rem', fontSize: '1.1em' }}>
              ⚙️ 서버 상태 제어
            </td>
          </tr>
          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>서버 상태</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleChangeStatus('preparing')}
                style={{ 
                  marginRight: '0.5rem', 
                  padding: '0.5rem 1rem', 
                  backgroundColor: settings.status === 'preparing' ? '#9C27B0' : '#333', 
                  color: 'white', 
                  border: '1px solid #666', 
                  cursor: 'pointer',
                  fontWeight: settings.status === 'preparing' ? 'bold' : 'normal',
                  fontSize: '0.9em'
                }}
              >
                🔧 준비중
              </button>
              <button
                type="button"
                onClick={() => handleChangeStatus('running')}
                style={{ 
                  marginRight: '0.5rem', 
                  padding: '0.5rem 1rem', 
                  backgroundColor: settings.status === 'running' ? '#4CAF50' : '#333', 
                  color: 'white', 
                  border: '1px solid #666', 
                  cursor: 'pointer',
                  fontWeight: settings.status === 'running' ? 'bold' : 'normal',
                  fontSize: '0.9em'
                }}
              >
                ✅ 운영중
              </button>
              <button
                type="button"
                onClick={() => handleChangeStatus('paused')}
                style={{ 
                  marginRight: '0.5rem', 
                  padding: '0.5rem 1rem', 
                  backgroundColor: settings.status === 'paused' ? '#f44336' : '#333', 
                  color: 'white', 
                  border: '1px solid #666', 
                  cursor: 'pointer',
                  fontWeight: settings.status === 'paused' ? 'bold' : 'normal',
                  fontSize: '0.9em'
                }}
              >
                🔒 폐쇄
              </button>
              <button
                type="button"
                onClick={() => handleChangeStatus('finished')}
                style={{ 
                  marginRight: '0.5rem', 
                  padding: '0.5rem 1rem', 
                  backgroundColor: settings.status === 'finished' ? '#607D8B' : '#333', 
                  color: 'white', 
                  border: '1px solid #666', 
                  cursor: 'pointer',
                  fontWeight: settings.status === 'finished' ? 'bold' : 'normal',
                  fontSize: '0.9em'
                }}
              >
                🏁 종료
              </button>
              <button
                type="button"
                onClick={() => handleChangeStatus('united')}
                style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: settings.status === 'united' ? '#FFD700' : '#333', 
                  color: settings.status === 'united' ? '#000' : 'white', 
                  border: '1px solid #666', 
                  cursor: 'pointer',
                  fontWeight: settings.status === 'united' ? 'bold' : 'normal',
                  fontSize: '0.9em'
                }}
              >
                👑 천하통일
              </button>
              <br />
              <span style={{ marginTop: '0.5rem', display: 'inline-block', color: '#aaa', fontSize: '0.85em' }}>
                현재: <strong style={{ color: '#fff' }}>
                  {settings.status === 'preparing' && '🔧 준비중 (테스트 플레이 가능, 턴 진행 ❌)'}
                  {settings.status === 'running' && '✅ 운영중 (정상 운영)'}
                  {settings.status === 'paused' && '🔒 폐쇄 (접속 불가)'}
                  {settings.status === 'finished' && '🏁 종료 (게임 완료)'}
                  {settings.status === 'united' && '👑 천하통일 (게임 완료)'}
                  {!settings.status && '알 수 없음'}
                </strong>
              </span>
            </td>
          </tr>
          
          <tr>
            <td colSpan={4} className="bg2" style={{ textAlign: 'center', padding: '0.8rem', fontSize: '1.1em' }}>
              🎮 시나리오 초기화
            </td>
          </tr>
          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem', verticalAlign: 'top' }}>시나리오 선택</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                style={{ width: '500px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.5rem' }}
              >
                <option value="">-- 시나리오 선택 --</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.startYear}년)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleResetScenario}
                style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.5rem 1.5rem', 
                  backgroundColor: '#d32f2f', 
                  color: 'white', 
                  border: '1px solid #666', 
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⚠️ 서버 초기화
              </button>
              <div style={{ marginTop: '0.5rem', color: '#ff6b6b', fontSize: '0.9em' }}>
                ⚠️ 주의: 서버 초기화 시 모든 장수, 국가, 전쟁 데이터가 삭제되고 선택한 시나리오로 재설정됩니다.
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={4} className="bg2" style={{ textAlign: 'center', padding: '0.8rem', fontSize: '1.1em' }}>
              📝 서버 기본 정보
            </td>
          </tr>
          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>서버 이름</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="서버 표시 이름 (예: OpenSAM, 삼국지 184년)"
                style={{ width: '400px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('serverName')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경
              </button>
            </td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>시나리오/설명</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <input
                type="text"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="시나리오 설명 (예: 황건적의 난, 관도대전)"
                style={{ width: '400px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('scenario')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경
              </button>
            </td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>운영자메세지</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                style={{ width: '600px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('msg')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경
              </button>
            </td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>중원정세추가</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <input
                type="text"
                value={log}
                onChange={(e) => setLog(e.target.value)}
                maxLength={80}
                placeholder="중원정세 로그..."
                style={{ width: '600px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('log')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                로그쓰기
              </button>
            </td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>시작시간변경</td>
            <td style={{ padding: '0.5rem' }}>
              <input
                type="text"
                value={starttime}
                onChange={(e) => setStarttime(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm:ss"
                style={{ width: '180px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem', textAlign: 'right' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('starttime')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경1
              </button>
            </td>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>최근 갱신 시간</td>
            <td style={{ padding: '0.5rem' }}>&nbsp;{settings.turntime || '-'}</td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>최대 장수</td>
            <td style={{ padding: '0.5rem' }}>
              <input
                type="number"
                value={maxgeneral}
                onChange={(e) => setMaxgeneral(Number(e.target.value))}
                style={{ width: '60px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem', textAlign: 'right' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('maxgeneral')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경2
              </button>
            </td>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>최대 국가</td>
            <td style={{ padding: '0.5rem' }}>
              <input
                type="number"
                value={maxnation}
                onChange={(e) => setMaxnation(Number(e.target.value))}
                style={{ width: '60px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem', textAlign: 'right' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('maxnation')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경3
              </button>
            </td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>시작 년도</td>
            <td style={{ padding: '0.5rem' }}>
              <input
                type="number"
                value={startyear}
                onChange={(e) => setStartyear(Number(e.target.value))}
                style={{ width: '60px', backgroundColor: 'black', color: 'white', border: '1px solid #666', padding: '0.3rem', textAlign: 'right' }}
              />
              <button 
                type="button" 
                onClick={() => handleSubmit('startyear')}
                style={{ marginLeft: '0.5rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경4
              </button>
            </td>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>현재 년월</td>
            <td style={{ padding: '0.5rem' }}>{settings.year || 220}년 {settings.month || 1}월</td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>턴시간</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              {[1, 2, 5, 10, 20, 30, 60, 120].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSubmit('turnterm', term)}
                  style={{ marginRight: '0.3rem', padding: '0.3rem 0.8rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
                >
                  {term}분턴
                </button>
              ))}
              <span style={{ marginLeft: '1rem', color: '#aaa' }}>
                (현재: {settings.turnterm || 60}분)
              </span>
            </td>
          </tr>

          <tr>
            <td style={{ width: '110px', textAlign: 'right', padding: '0.5rem' }}>오리지널 캐릭터 플레이</td>
            <td colSpan={3} style={{ padding: '0.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allowNpcPossess}
                  onChange={(e) => setAllowNpcPossess(e.target.checked)}
                  style={{ marginRight: '0.5rem', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>오리지널 캐릭터 플레이 허용</span>
              </label>
              <button 
                type="button" 
                onClick={() => handleSubmit('allowNpcPossess')}
                style={{ marginLeft: '1rem', padding: '0.3rem 1rem', backgroundColor: '#333', color: 'white', border: '1px solid #666', cursor: 'pointer' }}
              >
                변경
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}




