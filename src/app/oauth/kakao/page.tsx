'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';

function KakaoOAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams?.get('code');
  const token = searchParams?.get('token');
  const success = searchParams?.get('success');
  const error = searchParams?.get('error');
  const mode = searchParams?.get('mode');

  useEffect(() => {
    if (success === 'true') {
      if (mode === 'reset') {
        alert('임시 비밀번호가 카카오톡으로 전송되었습니다.');
        router.push('/');
        return;
      }
      if (token) {
        localStorage.setItem('token', token);
        router.push('/entrance');
        return;
      }
    }

    if (success === 'false' || error) {
      console.error('Kakao login failed:', error);
      router.push('/oauth/fail');
      return;
    }

    if (code) {
      handleOAuthCallback();
    } else {
      // code도 없고 token도 없으면 실패로 간주 (단, 초기 로딩 시 제외)
      if (searchParams && searchParams.toString()) {
         router.push('/oauth/fail');
      }
    }
  }, [code, token, success, error]);

  async function handleOAuthCallback() {
    if (!code) {
      router.push('/oauth/fail');
      return;
    }

    try {
      const result = await SammoAPI.OAuthKakaoCallback({ code });
      
      if (result.result) {
        router.push('/entrance');
      } else {
        // 회원가입이 필요한 경우
        router.push(`/oauth/kakao/join?code=${code}`);
      }
    } catch (err) {
      console.error(err);
      router.push('/oauth/fail');
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div>카카오 인증 처리 중...</div>
    </div>
  );
}

export default function KakaoOAuthPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>}>
      <KakaoOAuthContent />
    </Suspense>
  );
}




