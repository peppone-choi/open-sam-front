'use client';

import { GameSessionProvider } from '@/providers/GameSessionProvider';

interface ServerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ server: string }>;
}

export default function ServerLayout({ children }: ServerLayoutProps) {
  return (
    <GameSessionProvider>
      {children}
    </GameSessionProvider>
  );
}




