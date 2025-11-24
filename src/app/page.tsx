'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';

// OTP Modal Component
function OtpModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 rounded-2xl bg-background-secondary border border-white/10 shadow-2xl transform transition-all scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">인증 코드 필요</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="mb-6 text-gray-300 text-sm leading-relaxed">
          <p className="mb-2">인증 코드가 필요합니다.</p>
          <p className="mb-2">카카오톡의 ‘나와의 채팅’란을 확인해 주세요.</p>
          <p className="text-xs text-gray-500">(별도의 알림[소리, 진동, 숫자]이 발생하지 않습니다.)</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(code); }} className="space-y-4">
          <div>
            <label htmlFor="otp_code" className="block text-sm font-medium text-gray-400 mb-1">인증 코드</label>
            <input
              type="number"
              id="otp_code"
              className="w-full px-4 py-3 rounded-lg bg-background-tertiary border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-white placeholder-gray-600 transition-all"
              placeholder="인증 코드를 입력하세요"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
              취소
            </button>
            <button type="submit" className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 transition-all">
              제출
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  
  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{username: string, password: string} | null>(null);

  // Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Server Info (for Iframe)
  const [runningServer, setRunningServer] = useState<{name: string} | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 토큰 및 서버 상태 확인
  useEffect(() => {
    async function init() {
      try {
        // 1. 토큰 체크
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const userInfo = await SammoAPI.GetUserInfo();
            if (userInfo.result) {
              router.push('/entrance');
              return;
            }
          } catch {
            localStorage.removeItem('token');
          }
        }

        // 2. 최근 서버 정보 가져오기 (Iframe용)
        // API가 없다면 기본적으로 체크하지 않음. 여기서는 예시로 구현.
        // const serverStatus = await SammoAPI.GetServerStatus();
        // if(serverStatus.result && serverStatus.server.length > 0) {
        //    const active = serverStatus.server.find((s: any) => s.enable);
        //    if(active) setRunningServer({ name: active.name });
        // }

      } catch (err) {
        console.error('초기화 실패:', err);
      } finally {
        setChecking(false);
      }
    }
    init();
  }, [router]);

  async function handleLogin(e?: React.FormEvent, otpCode?: string) {
    if (e) e.preventDefault();
    
    const loginId = username || pendingLogin?.username;
    const loginPw = password || pendingLogin?.password;

    if (!loginId || !loginPw) {
      setError('계정명과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await SammoAPI.LoginByID({
        username: loginId,
        password: loginPw,
        otp: otpCode // OTP 코드가 있으면 함께 전송
      });

      if (result.result) {
        // 로그인 성공
        if (result.reqOTP) {
          // OTP 필요 -> 모달 표시하고 현재 정보 저장
          setPendingLogin({ username: loginId, password: loginPw });
          setShowOtpModal(true);
          setLoading(false);
        } else {
          // 토큰 저장
          if (result.token) {
            localStorage.setItem('token', result.token);
          }
          router.push('/entrance');
        }
      } else {
        setError(result.reason || '로그인에 실패했습니다.');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
      setLoading(false);
    }
  }

  const handleOtpSubmit = (code: string) => {
    setShowOtpModal(false);
    handleLogin(undefined, code);
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 로직 (환경변수 등 필요)
    // 현재는 알림만 표시
    alert('카카오 로그인은 현재 설정 중입니다.');
    // window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=...&response_type=code`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-main relative overflow-hidden selection:bg-primary selection:text-white font-sans">
      {/* OTP Modal */}
      <OtpModal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} onSubmit={handleOtpSubmit} />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-30" />

      <nav className="w-full p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto">
        <div className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary drop-shadow-sm">
          오픈삼국 OpenSAM
        </div>
        {/* Mobile Menu Button could go here */}
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Column: Title & Intro */}
          <div className="text-center lg:text-left space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-2xl leading-tight">
              전략의 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">새로운 지평</span>
            </h1>
            <p className="text-foreground-muted text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
              실시간으로 진행되는 삼국지 웹게임.<br/>
              천하통일의 대업을 이루고 역사에 이름을 남기세요.
            </p>
            
            {/* Iframe Section (Conditional) */}
            {runningServer && (
               <div className="hidden lg:block mt-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 h-[300px] relative group">
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    <p>실시간 지도 프리뷰 ({runningServer.name})</p>
                  </div>
                  {/* 실제 구현 시 iframe src 연결 */}
                  <iframe 
                    src={`/${runningServer.name}/recent_map.php`} 
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                    title="Recent Map"
                  />
               </div>
            )}
          </div>

          {/* Right Column: Login Card */}
          <div className="w-full max-w-md mx-auto lg:mr-0">
            <div className="rounded-2xl bg-background-secondary/80 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/5 transition-all duration-300 hover:shadow-primary/10 p-8">
              <div className="flex flex-col space-y-1.5 mb-8">
                <h3 className="text-2xl font-bold text-white">로그인</h3>
                <p className="text-sm text-foreground-muted">계정 정보를 입력하고 전장에 합류하세요</p>
              </div>

              <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-foreground-dim pl-1">
                    계정명
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    autoFocus
                    className={cn(
                      "flex h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm",
                      "focus:border-primary focus:bg-black/30 focus:ring-1 focus:ring-primary outline-none transition-all duration-200",
                      "text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-foreground-dim pl-1">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={cn(
                      "flex h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm",
                      "focus:border-primary focus:bg-black/30 focus:ring-1 focus:ring-primary outline-none transition-all duration-200",
                      "text-white placeholder:text-white/20"
                    )}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center animate-in fade-in slide-in-from-top-1" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0" aria-label="오류 아이콘"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-[auto_1fr_auto] gap-2 pt-2">
                  {/* Kakao Login Button */}
                  <button
                    type="button"
                    onClick={handleKakaoLogin}
                    className="w-12 h-12 rounded-lg bg-[#FEE500] hover:bg-[#FDD835] flex items-center justify-center text-[#000000] transition-colors shadow-lg"
                    aria-label="카카오톡으로 로그인"
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                       <path d="M12 3C5.925 3 1 6.925 1 11.775c0 2.9 1.75 5.475 4.475 7.05-.2.75-.725 2.725-.825 3.125-.125.45.175.45.35.3.225-.15 3.55-2.325 4.15-2.7.55.075 1.125.125 1.7.125 6.075 0 11-3.925 11-8.775C22 6.925 17.075 3 12 3z"/>
                    </svg>
                  </button>

                  {/* Main Login Button */}
                  <button 
                    type="submit" 
                    disabled={loading || checking} 
                    className={cn(
                      "h-12 rounded-lg bg-primary text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    )}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="로딩 중">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>처리 중...</span>
                      </>
                    ) : '로그인'}
                  </button>

                  {/* Dropdown Menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className={cn(
                        "w-12 h-12 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center justify-center",
                        showDropdown && "bg-white/10 ring-2 ring-white/10"
                      )}
                      aria-label="추가 옵션"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </button>
                    
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 rounded-lg bg-background-tertiary border border-white/10 shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <Link href="/user_info/password?action=reset" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          비밀번호 초기화
                        </Link>
                        <Link href="/register" className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                          회원가입
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-foreground-muted">
                © 2025 • Team OpenSAM <br/>
                <span className="text-xs opacity-50">Chrome, Edge, Firefox 최적화</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="p-6 text-center text-sm text-foreground-dim relative z-10 border-t border-white/5 bg-background-main/50 backdrop-blur-sm">
         <div className="flex justify-center gap-6">
           <Link href="/terms.2.html" className="hover:text-primary transition-colors">개인정보처리방침</Link>
           <Link href="/terms.1.html" className="hover:text-primary transition-colors">이용약관</Link>
         </div>
      </footer>
    </div>
  );
}
