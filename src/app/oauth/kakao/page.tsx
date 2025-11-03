'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

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
    try {
      // API 호출 로직 필요
      // 카카오 OAuth 인증 처리
      router.push('/entrance');
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


