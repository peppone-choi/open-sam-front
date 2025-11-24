'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });
  const [terms1, setTerms1] = useState('');
  const [terms2, setTerms2] = useState('');
  const [agreeTerms1, setAgreeTerms1] = useState(false);
  const [agreeTerms2, setAgreeTerms2] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 약관 내용 불러오기
    async function loadTerms() {
      try {
        const [t1Response, t2Response] = await Promise.all([
          fetch('/terms.1.html'),
          fetch('/terms.2.html')
        ]);
        
        if (t1Response.ok) {
          const text = await t1Response.text();
          setTerms1(text);
        }
        if (t2Response.ok) {
          const text = await t2Response.text();
          setTerms2(text);
        }
      } catch (err) {
        console.error('약관 로드 실패:', err);
      }
    }
    loadTerms();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.nickname) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!agreeTerms1 || !agreeTerms2) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await SammoAPI.Register({
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname,
        secret_agree: agreeTerms1,
        secret_agree2: agreeTerms2,
        third_use: agreeThirdParty,
      });

      if (result.result) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        router.push('/');
      } else {
        setError(result.reason || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-main relative overflow-hidden selection:bg-primary selection:text-white font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-20" />

      <nav className="w-full p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary hover:opacity-80 transition-opacity">
          오픈삼국 OpenSAM
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">회원가입</h1>
            <p className="text-foreground-muted">OpenSAM에 오신 것을 환영합니다</p>
          </div>

          <div className="bg-background-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 계정명 */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-bold text-foreground-dim uppercase tracking-wider pl-1">
                  계정명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="계정명을 입력하세요"
                  autoFocus
                  className={cn(
                    "flex h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm",
                    "focus:border-primary focus:bg-black/30 focus:ring-1 focus:ring-primary outline-none transition-all",
                    "text-white placeholder:text-white/20"
                  )}
                  required
                />
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-foreground-dim uppercase tracking-wider pl-1">
                  비밀번호 <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="비밀번호 (최소 6자)"
                  className={cn(
                    "flex h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm",
                    "focus:border-primary focus:bg-black/30 focus:ring-1 focus:ring-primary outline-none transition-all",
                    "text-white placeholder:text-white/20"
                  )}
                  required
                  minLength={6}
                />
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-bold text-foreground-dim uppercase tracking-wider pl-1">
                  비밀번호 확인 <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={cn(
                    "flex h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm",
                    "focus:border-primary focus:bg-black/30 focus:ring-1 focus:ring-primary outline-none transition-all",
                    "text-white placeholder:text-white/20"
                  )}
                  required
                  minLength={6}
                />
              </div>

              {/* 닉네임 */}
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-bold text-foreground-dim uppercase tracking-wider pl-1">
                  닉네임 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="닉네임을 입력하세요"
                  className={cn(
                    "flex h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm",
                    "focus:border-primary focus:bg-black/30 focus:ring-1 focus:ring-primary outline-none transition-all",
                    "text-white placeholder:text-white/20"
                  )}
                  required
                />
                <p className="text-xs text-foreground-dim pl-1">
                  깃수가 종료될때 공개됩니다. 장수명과는 다르게 닉네임은 계속해서 고정되니 신중하게 정해주세요.
                </p>
              </div>

              {/* 약관 1 */}
              <div className="space-y-3 border-t border-white/10 pt-6">
                <label className="text-sm font-bold text-foreground-dim uppercase tracking-wider">
                  이용 약관 <span className="text-red-400">*</span>
                </label>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 max-h-48 overflow-y-auto text-sm text-gray-400 leading-relaxed">
                  {terms1 ? (
                    <div dangerouslySetInnerHTML={{ __html: terms1 }} />
                  ) : (
                    <p>약관을 불러오는 중...</p>
                  )}
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="secret_agree"
                      checked={agreeTerms1}
                      onChange={(e) => setAgreeTerms1(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      required
                    />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    이용 약관에 동의합니다.
                  </span>
                </label>
              </div>

              {/* 약관 2 */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground-dim uppercase tracking-wider">
                  개인정보 제공 및 이용에 대한 동의 <span className="text-red-400">*</span>
                </label>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 max-h-48 overflow-y-auto text-sm text-gray-400 leading-relaxed">
                  {terms2 ? (
                    <div dangerouslySetInnerHTML={{ __html: terms2 }} />
                  ) : (
                    <p>약관을 불러오는 중...</p>
                  )}
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="secret_agree2"
                    checked={agreeTerms2}
                    onChange={(e) => setAgreeTerms2(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    required
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    개인정보 제공 및 이용에 동의합니다.
                  </span>
                </label>
              </div>

              {/* 약관 3 (선택) */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground-dim uppercase tracking-wider">
                  개인정보의 제3자 수집 이용 제공에 대한 동의 <span className="text-gray-500">(선택)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="third_use"
                    checked={agreeThirdParty}
                    onChange={(e) => setAgreeThirdParty(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    개인정보의 제3자 수집 이용 제공에 동의합니다.
                  </span>
                </label>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center animate-in fade-in" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0" aria-label="오류 아이콘"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* 제출 버튼 */}
              <button 
                type="submit" 
                disabled={loading} 
                className={cn(
                  "w-full h-12 rounded-lg bg-primary text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                )}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="로딩 중">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : '가입하기'}
              </button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-sm text-foreground-muted">
                이미 계정이 있으신가요?{" "}
                <Link href="/" className="font-medium text-primary hover:text-primary-hover underline-offset-4 hover:underline transition-colors">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="p-6 text-center text-sm text-foreground-dim relative z-10 border-t border-white/5 bg-background-main/50 backdrop-blur-sm">
        <div className="flex justify-center gap-6">
          <a href="/terms.2.html" className="hover:text-primary transition-colors">개인정보처리방침</a>
          <a href="/terms.1.html" className="hover:text-primary transition-colors">이용약관</a>
        </div>
        <p className="mt-2">© 2025 • Team OpenSAM</p>
        <p className="text-xs mt-1 opacity-50">Chrome, Edge, Firefox 최적화</p>
      </footer>
    </div>
  );
}
