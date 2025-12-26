'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function UserInfoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [globalSalt, setGlobalSalt] = useState<string>('');
  
  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Delete Account
  const [deletePassword, setDeletePassword] = useState('');
  
  // Icon Management
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetUserInfo();
      if (result.result) {
        setUserData(result);
        setGlobalSalt(result.global_salt || '');
      } else {
        showToast('로그인이 필요합니다.', 'warning');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
      router.push('/entrance');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast('모든 필드를 입력해주세요.', 'warning');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다.', 'warning');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('새 비밀번호는 최소 6자 이상이어야 합니다.', 'warning');
      return;
    }

    try {
      const result = await SammoAPI.ChangePassword({
        password: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        globalSalt: globalSalt,
      });

      if (result.result) {
        showToast('비밀번호가 변경되었습니다.', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(result.reason || '비밀번호 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('비밀번호 변경에 실패했습니다.', 'error');
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!deletePassword) {
      showToast('비밀번호를 입력해주세요.', 'warning');
      return;
    }

    if (!confirm('정말로 계정을 삭제하시겠습니까?\n\n탈퇴시 1개월간 정보가 보존되며, 1개월간 재가입이 불가능합니다.')) {
      return;
    }

    try {
      const result = await SammoAPI.DeleteMe({
        password: deletePassword,
        globalSalt: globalSalt,
      });

      if (result.result) {
        showToast('계정이 삭제되었습니다.', 'success');
        localStorage.removeItem('token');
        router.push('/');
      } else {
        showToast(result.reason || '계정 삭제에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('계정 삭제에 실패했습니다.', 'error');
    }
  }

  async function handleExpandToken() {
    try {
      const result = await SammoAPI.ExpandLoginToken();
      if (result.result) {
        showToast('로그인 토큰이 연장되었습니다.', 'success');
        loadUserData();
      } else {
        showToast(result.reason || '토큰 연장에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('토큰 연장에 실패했습니다.', 'error');
    }
  }

  async function handleDisallowThirdUse() {
    if (!confirm('개인정보 3자 제공 동의를 철회하시겠습니까?')) {
      return;
    }
    
    try {
      const result = await SammoAPI.DisallowThirdUse();
      if (result.result) {
        showToast('개인정보 3자 제공 동의가 철회되었습니다.', 'success');
        loadUserData();
      } else {
        showToast(result.reason || '철회에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('철회에 실패했습니다.', 'error');
    }
  }

  function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (50KB)
      if (file.size > 50 * 1024) {
        showToast('파일 크기는 50KB 이하여야 합니다.', 'warning');
        return;
      }

      // 파일 형식 체크
      const allowedTypes = ['image/avif', 'image/webp', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showToast('avif, webp, jpg, gif, png 파일만 가능합니다.', 'warning');
        return;
      }

      setIconFile(file);
      
      // 미리보기
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleIconUpload(e: React.FormEvent) {
    e.preventDefault();
    
    if (!iconFile) {
      showToast('파일을 선택해주세요.', 'warning');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image_upload', iconFile);
      
      const result = await SammoAPI.ChangeIcon(formData);
      if (result.result) {
        showToast('아이콘이 변경되었습니다.', 'success');
        setIconFile(null);
        setIconPreview(null);
        loadUserData();
      } else {
        showToast(result.reason || '아이콘 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('아이콘 변경에 실패했습니다.', 'error');
    }
  }

  async function handleRemoveIcon() {
    if (!confirm('아이콘을 제거하시겠습니까?')) {
      return;
    }
    
    try {
      const result = await SammoAPI.DeleteIcon();
      if (result.result) {
        showToast('아이콘이 제거되었습니다.', 'success');
        loadUserData();
      } else {
        showToast(result.reason || '아이콘 제거에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('아이콘 제거에 실패했습니다.', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-white text-lg">사용자 정보를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main relative overflow-x-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0 bg-hero-pattern opacity-30 pointer-events-none -z-10" />

      {/* Header */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-background-main/80 backdrop-blur-md border-b border-white/5">
        <Link href="/entrance" className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary hover:opacity-80 transition-opacity">
          OpenSAM
        </Link>
        <Link href="/entrance" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-foreground-muted hover:text-white transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          돌아가기
        </Link>
      </nav>

      <div className="container mx-auto p-4 lg:p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">계정 관리</h1>
          <p className="text-foreground-muted">회원 정보 및 설정을 관리합니다</p>
        </div>

        <div className="space-y-6">
          
          {/* 회원 정보 */}
          <div className="bg-background-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              회원 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-foreground-dim uppercase tracking-wider">계정 ID</span>
                <p className="text-white font-medium">{userData.id}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-foreground-dim uppercase tracking-wider">닉네임</span>
                <p className="text-white font-medium">{userData.nickName || userData.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-foreground-dim uppercase tracking-wider">등급</span>
                <p className="text-white font-medium">등급 {userData.grade}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-foreground-dim uppercase tracking-wider">가입일시</span>
                <p className="text-white font-medium">{userData.join_date || '정보 없음'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-foreground-dim uppercase tracking-wider">인증 방식</span>
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{userData.oauth_type || '일반 로그인'}</p>
                  {(!userData.oauth_type || userData.oauth_type === 'NONE') && (
                    <button 
                      onClick={async () => {
                        try {
                          const redirectUri = window.location.origin + '/oauth/kakao';
                          const result = await SammoAPI.GetKakaoAuthUrl(redirectUri);
                          if (result.success && result.authUrl) {
                            window.location.href = result.authUrl;
                          } else {
                            showToast('카카오 연결 정보를 불러오는데 실패했습니다.', 'error');
                          }
                        } catch (error) {
                          showToast('카카오 연결 중 오류가 발생했습니다.', 'error');
                        }
                      }} 
                      className="text-xs px-2 py-1 rounded bg-[#FEE500] text-black hover:bg-[#FDD835] transition-all font-bold"
                    >
                      카카오 연결
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-foreground-dim uppercase tracking-wider">토큰 유효기간</span>
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{userData.token_valid_until || '정보 없음'}</p>
                  <button onClick={handleExpandToken} className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary hover:text-white transition-all">
                    연장
                  </button>
                </div>
              </div>
              {userData.third_use && (
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs text-foreground-dim uppercase tracking-wider">개인정보 3자 제공 동의</span>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{userData.third_use === 'Y' ? '동의함' : '동의 안함'}</p>
                    {userData.third_use === 'Y' && (
                      <button onClick={handleDisallowThirdUse} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                        철회
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-background-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              비밀번호 변경
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground-dim">현재 비밀번호</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={cn(
                    "w-full h-11 rounded-lg border border-white/10 bg-black/20 px-4 text-sm",
                    "focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                  )}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground-dim">새 비밀번호</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={cn(
                    "w-full h-11 rounded-lg border border-white/10 bg-black/20 px-4 text-sm",
                    "focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                  )}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground-dim">새 비밀번호 확인</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={cn(
                    "w-full h-11 rounded-lg border border-white/10 bg-black/20 px-4 text-sm",
                    "focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                  )}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="w-full h-11 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                비밀번호 변경
              </button>
            </form>
          </div>

          {/* 전용 아이콘 관리 */}
          <div className="bg-background-secondary/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              전용 아이콘 관리
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 현재 아이콘 */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground-dim">현재 아이콘</span>
                <div className="w-32 h-32 rounded-lg border border-white/10 bg-black/20 overflow-hidden flex items-center justify-center">
                  {userData.icon ? (
                    <img src={userData.icon} alt="Current Icon" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-foreground-dim">아이콘 없음</span>
                  )}
                </div>
              </div>

              {/* 새 아이콘 미리보기 */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground-dim">새 아이콘 미리보기</span>
                <div className="w-32 h-32 rounded-lg border border-white/10 bg-black/20 overflow-hidden flex items-center justify-center">
                  {iconPreview ? (
                    <img src={iconPreview} alt="New Icon Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-foreground-dim">선택된 파일 없음</span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleIconUpload} className="mt-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleIconFileChange}
                  accept=".avif,.webp,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-11 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                >
                  {iconFile ? iconFile.name : '파일 선택'}
                </button>
                <button type="submit" disabled={!iconFile} className="px-6 h-11 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  변경
                </button>
                <button type="button" onClick={handleRemoveIcon} className="px-6 h-11 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-bold transition-all">
                  제거
                </button>
              </div>
              <p className="text-xs text-foreground-dim">
                아이콘은 64x64 ~ 128x128 픽셀, 50KB 이하의 avif, webp, jpg, gif, png 파일만 가능합니다.
              </p>
            </form>
          </div>

          {/* 회원 탈퇴 */}
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              회원 탈퇴
            </h2>
            <p className="text-sm text-red-300 mb-4 leading-relaxed">
              탈퇴시 1개월간 정보가 보존되며, 1개월간 재가입이 불가능합니다.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-red-300">현재 비밀번호</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-lg border border-red-500/20 bg-black/20 px-4 text-sm",
                    "focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-white"
                  )}
                  required
                />
              </div>
              <button type="submit" className="w-full h-11 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                탈퇴 신청
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
