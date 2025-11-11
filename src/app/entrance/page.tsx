'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import styles from './page.module.css';

interface Server {
  serverID: string;
  name: string;
  korName: string;
  color: string;
  exists: boolean;
  enable: boolean;
  isunited?: number; // 레거시: 0: 운영중, 2: 폐쇄, 3: 천하통일
  status?: 'preparing' | 'running' | 'paused' | 'finished' | 'united'; // 새 상태 시스템
  statusText?: string; // 한글 상태 텍스트
  scenarioName?: string; // 시나리오 이름 (관리자가 덮어쓸 수 있음)
  hasCharacter?: boolean; // 캐릭터 존재 여부
  characterName?: string; // 캐릭터 이름
  characterNation?: string; // 캐릭터 국가
  generals?: Array<{ name: string; nation: string }>;
}

export default function EntrancePage() {
  const router = useRouter();
  const [serverList, setServerList] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notice, setNotice] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // 서버 상태와 사용자 정보 병렬 로드
      const [serverStatus, userInfoData] = await Promise.all([
        SammoAPI.GetServerStatus(),
        SammoAPI.GetUserInfo().catch(() => null),
      ]);

      if (serverStatus.result) {
        // 공지사항 설정
        if (serverStatus.notice) {
          setNotice(serverStatus.notice);
        }
        
        const serverListData = serverStatus.server.map((s: any) => ({
          serverID: s.name,
          name: s.name,
          korName: s.korName,
          color: s.color,
          exists: s.exists,
          enable: s.enable,
          isunited: s.isunited || 0,
          status: s.status || 'running',
          statusText: s.statusText || '운영중',
          scenarioName: s.scenarioName || '',
          hasCharacter: false, // 초기값
        }));
        
        setServerList(serverListData);

        // 각 서버별로 캐릭터 존재 여부 확인 (병렬로)
        // 로그인한 경우에만 캐릭터 체크
        if (userInfoData?.result) {
          const characterChecks = serverListData.map(async (server) => {
            try {
              const frontInfo = await SammoAPI.GeneralGetFrontInfo({
                serverID: server.serverID,
              });
              
              // success가 false이거나 general이 없으면 캐릭터 없음
              const hasCharacter = frontInfo.success === true && frontInfo.general && frontInfo.general.no > 0;
              const characterName = frontInfo.general?.name || '';
              const characterNation = frontInfo.nation?.name || '';
              
              return {
                serverID: server.serverID,
                hasCharacter,
                characterName,
                characterNation,
              };
            } catch (err: any) {
              // 401 에러나 다른 에러는 캐릭터 없음으로 처리
              return {
                serverID: server.serverID,
                hasCharacter: false,
              };
            }
          });

          const results = await Promise.all(characterChecks);
          
          // 결과 반영
          setServerList((prev) => {
            const updated = prev.map((server) => {
              const result = results.find((r) => r.serverID === server.serverID);
              return {
                ...server,
                hasCharacter: result?.hasCharacter ?? false,
                characterName: result?.characterName || '',
                characterNation: result?.characterNation || '',
              };
            });
            return updated;
          });
        } else {
          // 로그인하지 않은 경우 모든 서버에 캐릭터 없음으로 설정
          setServerList((prev) =>
            prev.map((server) => ({
              ...server,
              hasCharacter: false,
            }))
          );
        }
      }

      if (userInfoData?.result) {
        setUserInfo(userInfoData);
        const grade = parseInt(userInfoData.grade) || 0;
        setIsAdmin(grade >= 5 || userInfoData.acl !== '-');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      // 토큰 삭제
      localStorage.removeItem('token');
      // 쿠키에서도 토큰 삭제 (있는 경우)
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // 서버에 로그아웃 요청 (선택적)
      try {
        await SammoAPI.Logout();
      } catch (err) {
        // 서버 요청 실패해도 클라이언트 측 토큰은 삭제됨
      }
      
      // 로그인 페이지로 이동
      router.push('/');
    } catch (err) {
      console.error(err);
      // 에러가 있어도 토큰 삭제하고 로그인 페이지로 이동
      localStorage.removeItem('token');
      router.push('/');
    }
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.navbarBrand}>
          OpenSAM
        </Link>
      </nav>

      <div className={styles.content}>
        {isAdmin && (
          <>
            <div className={styles.globalAdminPanel}>
              <div className={`${styles.sectionTitle} bg2`}>전 역 관 리</div>
              <div className={styles.adminActions}>
                <Link href="/admin" className={styles.btn}>
                  회원 관리
                </Link>
                <Link href="/admin/error-log" className={styles.btn}>
                  에러 로그
                </Link>
              </div>
              <div className={styles.noticeEdit}>
                <label>전역 공지사항:</label>
                <textarea 
                  className={styles.noticeTextarea}
                  value={notice}
                  onChange={(e) => setNotice(e.target.value)}
                  rows={3}
                  placeholder="전역 공지사항을 입력하세요..."
                />
                <button 
                  type="button" 
                  className={styles.btn}
                  onClick={async () => {
                    // TODO: API 호출로 공지사항 저장
                    alert('공지사항 변경 기능은 추후 구현 예정입니다.');
                  }}
                >
                  공지 변경
                </button>
              </div>
            </div>
          </>
        )}
        
        <div className={styles.notice}>
          <span className={styles.noticeText} style={{ color: 'orange', fontSize: '2em' }}>
            {notice || '공지사항'}
          </span>
        </div>

        <table className={`${styles.serverListTable} tb_layout`}>
          <caption className={`${styles.caption} bg2`}>서 버 선 택</caption>
          <thead>
            <tr>
              <th className="bg1">서 버</th>
              <th className="bg1">정 보</th>
              <th className="bg1">캐릭터 이름</th>
              <th className="bg1">소속 국가</th>
              <th className="bg1">선 택</th>
              {isAdmin && <th className="bg1">관 리</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                  로딩 중...
                </td>
              </tr>
            ) : serverList.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  사용 가능한 서버가 없습니다.
                </td>
              </tr>
            ) : (
              serverList.map((server) => {
                // 상태 판단 (status 우선, isunited 폴백)
                const status = server.status || (
                  server.isunited === 2 ? 'preparing' :
                  server.isunited === 3 ? 'united' : 'running'
                );
                
                const isPreparing = status === 'preparing';
                const isPaused = status === 'paused';
                const isFinished = status === 'finished';
                const isUnited = status === 'united';
                const isRunning = status === 'running';
                
                // 입장 가능 여부
                const canJoin = isPreparing || isRunning;
                const canEnter = isRunning; // 장수 생성된 경우 입장
                
                // 상태 텍스트 및 색상
                const statusInfo = {
                  preparing: { text: '준비중', color: '#9C27B0' },
                  running: { text: '운영중', color: '#4CAF50' },
                  paused: { text: '폐쇄', color: '#f44336' },
                  finished: { text: '종료', color: '#999' },
                  united: { text: '천하통일', color: '#FFD700' }
                };
                const currentStatusInfo = statusInfo[status] || { text: '알 수 없음', color: '#666' };
                
                return (
                  <tr key={server.serverID}>
                    <td className={styles.serverName} style={{ padding: '0.5rem', textAlign: 'center' }}>{server.korName}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      {server.scenarioName || '-'}
                      {!isRunning && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          color: currentStatusInfo.color,
                          fontWeight: 'bold'
                        }}>
                          [{currentStatusInfo.text}]
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      {server.hasCharacter ? (
                        <span style={{ color: '#fff' }}>{server.characterName || '-'}</span>
                      ) : (
                        <span style={{ color: '#666' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      {server.hasCharacter ? (
                        <span style={{ color: server.color || '#fff' }}>{server.characterNation || '-'}</span>
                      ) : (
                        <span style={{ color: '#666' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                      {!canJoin ? (
                        <span className={styles.disabled} style={{ color: currentStatusInfo.color }}>
                          {currentStatusInfo.text}
                        </span>
                      ) : server.exists ? (
                        server.hasCharacter === true ? (
                          <Link href={`/${server.serverID}/game`} className={styles.selectBtn}>
                            입 장
                          </Link>
                        ) : (
                          <Link 
                            href={`/${server.serverID}/join`} 
                            className={styles.createBtn}
                            title={`${server.korName} 서버에 캐릭터 생성`}
                          >
                            캐릭터 생성
                          </Link>
                        )
                      ) : (
                        <span className={styles.disabled}>-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <Link 
                          href={`/${server.serverID}/admin`} 
                          className={styles.adminBtn}
                          title={`${server.korName} 서버 관리`}
                        >
                          🔧 관리
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="bg0">
                <div className={styles.footerInfo}>
                  <span className={styles.alert}>★ 1명이 2개 이상의 계정을 사용하거나 타 유저의 턴을 대신 입력하는 것이 적발될 경우 차단 될 수 있습니다.</span>
                  <br />
                  계정은 한번 등록으로 계속 사용합니다. 각 서버 리셋시 캐릭터만 새로 생성하면 됩니다.
                  <br /><br />
                  <strong>서버 안내:</strong><br />
                  • <span className={styles.mainServer}>OpenSAM</span>: 메인 서버입니다. 천하통일에 도전하여 명예의 전당에 올라봅시다!<br />
                  • <span className={styles.seasonServer}>시즌 서버</span>: 특정 시대/시나리오를 배경으로 진행되는 서버입니다.<br />
                  • <span className={styles.testServer}>테스트 서버</span>: 새로운 기능을 테스트하는 서버입니다. 기습적으로 열리고 닫힐 수 있습니다.
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className={styles.userInfo}>
          <div className={`${styles.sectionTitle} bg2`}>계 정 관 리</div>
          <div className={styles.actions}>
            <Link href="/user_info" className={styles.btn}>
              비밀번호 &amp; 전콘 &amp; 탈퇴
            </Link>
            <button type="button" onClick={handleLogout} className={styles.btn}>
              로 그 아 웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




