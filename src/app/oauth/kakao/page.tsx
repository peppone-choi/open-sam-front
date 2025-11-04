'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';

export default function KakaoOAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams?.get('code');

  useEffect(() => {
    if (code) {
      handleOAuthCallback();
    } else {
      router.push('/oauth/fail');
    }
  }, [code]);

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




