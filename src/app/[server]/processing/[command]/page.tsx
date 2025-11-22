import React, { Suspense } from 'react';
import CommandProcessingClient from './CommandProcessingClient';

type PageParams = { server: string; command: string };
type PageSearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  params: PageParams | Promise<PageParams>;
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
}

function getFirstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function CommandProcessingPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});

  const serverID = resolvedParams.server;
  const command = decodeURIComponent(resolvedParams.command);
  const turnListParam = getFirstValue(resolvedSearchParams?.turnList);
  const isChief = getFirstValue(resolvedSearchParams?.is_chief) === 'true';
  const generalIdRaw = getFirstValue(resolvedSearchParams?.general_id);
  const generalIdParam = generalIdRaw ? Number(generalIdRaw) : undefined;

  return (
    <Suspense fallback={<div className="center" style={{ padding: '2rem' }}>로딩 중...</div>}>
      <CommandProcessingClient
        serverID={serverID}
        command={command}
        turnListParam={turnListParam}
        isChief={isChief}
        generalIdParam={Number.isFinite(generalIdParam) ? generalIdParam : undefined}
      />
    </Suspense>
  );
}



