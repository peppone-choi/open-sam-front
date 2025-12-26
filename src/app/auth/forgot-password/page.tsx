'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SammoAPI } from '@/lib/api/sammo';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [step, setStep] = useState<1 | 2>(1); // 1: Request, 2: Reset
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      showToast('계정명과 이메일을 입력해주세요.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await (SammoAPI as any).request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        }),
      });

      if (result.result) {
        showToast('인증 코드가 이메일로 발송되었습니다.', 'success');
        setStep(2);
      } else {
        showToast(result.error || '요청에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp || !formData.newPassword) {
      showToast('모든 정보를 입력해주세요.', 'warning');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다.', 'warning');
      return;
    }

    if (formData.newPassword.length < 8) {
      showToast('비밀번호는 최소 8자 이상이어야 합니다.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await (SammoAPI as any).request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      if (result.result) {
        showToast('비밀번호가 초기화되었습니다. 새로운 비밀번호로 로그인해주세요.', 'success');
        router.push('/');
      } else {
        showToast(result.error || '초기화에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-main p-4">
      <div className="w-full max-w-md bg-background-secondary rounded-2xl border border-white/10 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">비밀번호 초기화</h1>
        <p className="text-foreground-muted text-sm mb-8">
          {step === 1 
            ? '계정명과 가입 시 입력한 이메일을 입력해주세요.' 
            : '이메일로 받은 인증 코드를 입력하고 새 비밀번호를 설정하세요.'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground-dim uppercase tracking-wider pl-1">계정명</label>
              <input
                type="text"
                className="w-full h-12 rounded-lg bg-black/20 border border-white/10 px-4 text-white outline-none focus:border-primary transition-all"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground-dim uppercase tracking-wider pl-1">이메일</label>
              <input
                type="email"
                className="w-full h-12 rounded-lg bg-black/20 border border-white/10 px-4 text-white outline-none focus:border-primary transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {loading ? '처리 중...' : '인증 코드 요청'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground-dim uppercase tracking-wider pl-1">인증 코드</label>
              <input
                type="text"
                className="w-full h-12 rounded-lg bg-black/20 border border-white/10 px-4 text-white outline-none focus:border-primary transition-all text-center text-xl tracking-widest"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground-dim uppercase tracking-wider pl-1">새 비밀번호</label>
              <input
                type="password"
                className="w-full h-12 rounded-lg bg-black/20 border border-white/10 px-4 text-white outline-none focus:border-primary transition-all"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="New Password"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground-dim uppercase tracking-wider pl-1">비밀번호 확인</label>
              <input
                type="password"
                className="w-full h-12 rounded-lg bg-black/20 border border-white/10 px-4 text-white outline-none focus:border-primary transition-all"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm Password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {loading ? '처리 중...' : '비밀번호 변경'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full h-12 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
            >
              이전으로
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
