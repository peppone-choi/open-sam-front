'use client';

import { useEffect } from 'react';
import { Gin7Layout } from '@/components/gin7/layout';
import { useGin7Store } from '@/stores/gin7Store';

export default function Gin7RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrate = useGin7Store((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <Gin7Layout>{children}</Gin7Layout>;
}

