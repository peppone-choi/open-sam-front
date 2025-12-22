'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { FilterPanel, FilterSelect, FilterInput } from '@/components/common/FilterPanel';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface General {
  no: number;
  name: string;
  npc: number;
  nation: number;
  city: number;
  officer_level: number;
  permission?: string;
  dedication?: number;
}

interface Kingdom {
  nation: number;
  name: string;
  color: string;
  type?: string | { id?: string; name?: string };
  typeInfo?: { name?: string; pros?: string; cons?: string };
  level?: number;
  power?: number;
  capital?: number;
  gold?: number;
  rice?: number;
  tech?: number;
  gennum?: number;
  cities?: Record<number, string>;
  generals?: General[];
  [key: string]: any;
}

// =============================================================================
// Constants - 작위, 직위, 성향
// =============================================================================

const NATION_LEVELS: Record<number, string> = {
  0: '방랑군',
  1: '호족',
  2: '방백',
  3: '주자사',
  4: '주목',
  5: '승상',
  6: '공',
  7: '왕',
  8: '황제',
};

const NATION_TYPES: Record<string, { name: string; description: string }> = {
  neutral: { name: '중립', description: '' },
  confucianism: { name: '유가', description: '농상↑ 민심↑ / 쌀수입↓' },
  legalism: { name: '법가', description: '금수입↑ 치안↑ / 인구↓ 민심↓' },
  militarism: { name: '병가', description: '기술↑ 수성↑ / 인구↓ 민심↓' },
  mohism: { name: '묵가', description: '수성↑ / 기술↓' },
  logicians: { name: '명가', description: '기술↑ 인구↑ / 쌀수입↓ 수성↓' },
  diplomatists: { name: '종횡가', description: '전략↑ 수성↑ / 금수입↓ 농상↓' },
  yinyang: { name: '음양가', description: '농상↑ 인구↑ / 기술↓ 전략↓' },
  taoism: { name: '도가', description: '인구↑ / 기술↓ 치안↓' },
  bandits: { name: '도적', description: '계략↑ / 금수입↓ 치안↓ 민심↓' },
  buddhism: { name: '불가', description: '민심↑ 수성↑ / 금수입↓' },
  taoism_religious: { name: '오두미도', description: '쌀수입↑ 인구↑ / 기술↓ 수성↓ 농상↓' },
  taiping: { name: '태평도', description: '인구↑ 민심↑ / 기술↓ 수성↓' },
  virtue: { name: '덕가', description: '치안↑ 인구↑ 민심↑ / 쌀수입↓ 수성↓' },
};

// 직위 (officer_level별, 작위별)
const OFFICER_TITLES: Record<number, Record<number | string, string>> = {
  0: { default: '재야' },
  1: { default: '일반' },
  2: { default: '종사' },
  3: { default: '군사' },
  4: { default: '성주' },
  5: { 1: '백장', 2: '주부', 3: '도위', 4: '영군', 5: '토역장군', 6: '안국장군', 7: '후장군', 8: '표기장군', default: '편장군' },
  6: { 1: '정장', 2: '군사마', 3: '교위', 4: '호군', 5: '파로장군', 6: '중서령', 7: '전장군', 8: '거기장군', default: '잡호장군' },
  7: { 1: '서좌', 2: '선봉장', 3: '비장군', 4: '진북장군', 5: '진서장군', 6: '우장군', 7: '상서령', 8: '사공', default: '상서령' },
  8: { 1: '현승', 2: '아문장', 3: '편장군', 4: '진남장군', 5: '진동장군', 6: '좌장군', 7: '위장군', 8: '사도', default: '사방장군' },
  9: { 1: '현위', 2: '부장군', 3: '도독', 4: '장사', 5: '군사중랑장', 6: '광록훈', 7: '어사대부', 8: '태위', default: '구경' },
  10: { 0: '행동대장', 1: '도위', 2: '교위', 3: '중랑장', 4: '호위대장', 5: '상장군', 6: '대도독', 7: '대장군', 8: '대사마', default: '대장군' },
  11: { 0: '부두목', 1: '참모', 2: '주부', 3: '치중', 4: '별가', 5: '녹상서사', 6: '공국상', 7: '상국', 8: '승상', default: '승상' },
  12: { 0: '두목', 1: '호족', 2: '방백', 3: '주자사', 4: '주목', 5: '승상', 6: '공', 7: '왕', 8: '황제', default: '군주' },
};

const SORT_OPTIONS = [
  { value: 'power', label: '국력순' },
  { value: 'name', label: '이름순' },
  { value: 'cities', label: '도시 수' },
  { value: 'generals', label: '장수 수' },
  { value: 'level', label: '작위순' },
];

// =============================================================================
// Helper Functions
// =============================================================================

function getContrastColor(hexColor: string) {
  if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}

function getNationType(type?: string | { id?: string; name?: string }): { name: string; description: string } {
  if (!type) return NATION_TYPES.neutral;
  // type이 객체인 경우 (백엔드에서 {id, name} 형태로 올 수 있음)
  if (typeof type === 'object') {
    const typeId = type.id || '';
    return NATION_TYPES[typeId] || { name: type.name || '중립', description: '' };
  }
  return NATION_TYPES[type] || NATION_TYPES.neutral;
}

function getNationLevel(level?: number): string {
  return NATION_LEVELS[level ?? 0] || NATION_LEVELS[0];
}

function getOfficerTitle(officerLevel: number, nationLevel: number): string {
  const titles = OFFICER_TITLES[officerLevel];
  if (!titles) return '일반';
  return titles[nationLevel] || titles.default || '일반';
}

function formatGeneralName(name: string, npc: number): React.ReactNode {
  if (npc >= 2) {
    return <span className="text-gray-500">{name}</span>;
  }
  if (npc === 1) {
    return <span className="text-cyan-400">{name}</span>;
  }
  return <span className="text-yellow-300 font-semibold">{name}</span>;
}

// =============================================================================
// Components
// =============================================================================

function KingdomCard({ kingdom, rank }: { kingdom: Kingdom; rank: number }) {
  const textColor = getContrastColor(kingdom.color);
  const isTop3 = rank < 3;
  const nationLevel = kingdom.level ?? 0;
  // typeInfo가 있으면 직접 사용, 없으면 type에서 추출
  const nationType = kingdom.typeInfo 
    ? { name: kingdom.typeInfo.name || '중립', description: `${kingdom.typeInfo.pros || ''}${kingdom.typeInfo.cons ? ' / ' + kingdom.typeInfo.cons : ''}` }
    : getNationType(kingdom.type);
  
  // 장수 분류
  const chiefs: Record<number, General> = {};
  const ambassadors: string[] = [];
  const auditors: string[] = [];
  
  (kingdom.generals || []).forEach((general) => {
    if (general.officer_level >= 5) {
      chiefs[general.officer_level] = general;
    }
    if (general.permission === 'ambassador') {
      ambassadors.push(general.name);
    } else if (general.permission === 'auditor') {
      auditors.push(general.name);
    }
  });

  const cities = kingdom.cities || {};
  const cityCount = Object.keys(cities).length;
  const generalCount = kingdom.generals?.length || 0;

  return (
    <div className={cn(
      'bg-gray-900/70 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg',
      isTop3 && 'ring-2 ring-yellow-500/50'
    )}>
      {/* 헤더 - 국가명 */}
      <div
        className="py-3 px-4 text-center font-bold text-lg relative flex items-center justify-center gap-2"
        style={{ backgroundColor: kingdom.color, color: textColor }}
      >
        {isTop3 && (
          <span className="text-xl">
            {rank === 0 && '🥇'}
            {rank === 1 && '🥈'}
            {rank === 2 && '🥉'}
          </span>
        )}
        【 {kingdom.name} 】
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-4 text-sm border-b border-white/5">
        <div className="bg-gray-800/50 p-2 text-center text-gray-400">성 향</div>
        <div className="p-2 text-center text-yellow-400" title={nationType.description}>
          {nationType.name}
        </div>
        <div className="bg-gray-800/50 p-2 text-center text-gray-400">작 위</div>
        <div className="p-2 text-center text-white">{getNationLevel(nationLevel)}</div>
      </div>
      <div className="grid grid-cols-4 text-sm border-b border-white/5">
        <div className="bg-gray-800/50 p-2 text-center text-gray-400">국 력</div>
        <div className="p-2 text-center font-mono text-yellow-500">{kingdom.power?.toLocaleString() || 0}</div>
        <div className="bg-gray-800/50 p-2 text-center text-gray-400">장수/속령</div>
        <div className="p-2 text-center font-mono text-white">{generalCount} / {cityCount}</div>
      </div>

      {/* 수뇌부 (8명) */}
      <div className="grid grid-cols-4 text-xs border-b border-white/5">
        {[12, 11, 10, 9].map((level) => {
          const chief = chiefs[level];
          const title = getOfficerTitle(level, nationLevel);
          return (
            <React.Fragment key={level}>
              <div className="bg-gray-800/50 p-1.5 text-center text-gray-400">{title}</div>
              <div className="p-1.5 text-center">
                {chief ? formatGeneralName(chief.name, chief.npc) : <span className="text-gray-600">-</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="grid grid-cols-4 text-xs border-b border-white/5">
        {[8, 7, 6, 5].map((level) => {
          const chief = chiefs[level];
          const title = getOfficerTitle(level, nationLevel);
          return (
            <React.Fragment key={level}>
              <div className="bg-gray-800/50 p-1.5 text-center text-gray-400">{title}</div>
              <div className="p-1.5 text-center">
                {chief ? formatGeneralName(chief.name, chief.npc) : <span className="text-gray-600">-</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 외교권자 / 조언자 */}
      <div className="grid grid-cols-4 text-xs border-b border-white/5">
        <div className="bg-gray-800/50 p-1.5 text-center text-gray-400">외교권자</div>
        <div className="col-span-2 p-1.5 text-center text-cyan-300 truncate">
          {ambassadors.length > 0 ? ambassadors.join(', ') : '-'}
        </div>
        <div className="p-1.5 text-center">
          <span className="text-gray-400">조언자</span>{' '}
          <span className="text-white">{auditors.length}명</span>
        </div>
      </div>

      {/* 속령 일람 */}
      <div className="p-2 text-xs border-b border-white/5">
        <span className="text-gray-400">속령 일람 : </span>
        {nationLevel > 0 ? (
          Object.entries(cities).map(([cityId, cityName], idx) => (
            <span key={cityId}>
              {Number(cityId) === kingdom.capital ? (
                <span className="text-cyan-400">[{cityName}]</span>
              ) : (
                <span className="text-gray-300">{cityName}</span>
              )}
              {idx < Object.keys(cities).length - 1 && ', '}
            </span>
          ))
        ) : (
          <span className="text-yellow-400">
            {chiefs[12]?.city ? `현재 위치: 도시${chiefs[12].city}` : '-'}
          </span>
        )}
        {cityCount === 0 && <span className="text-gray-500">없음</span>}
      </div>

      {/* 장수 일람 */}
      <div className="p-2 text-xs">
        <span className="text-gray-400">장수 일람 : </span>
        {(kingdom.generals || []).map((general, idx) => (
          <span key={general.no}>
            {formatGeneralName(general.name, general.npc)}
            {idx < (kingdom.generals?.length || 0) - 1 && ', '}
          </span>
        ))}
        {generalCount === 0 && <span className="text-gray-500">없음</span>}
      </div>
    </div>
  );
}

function WanderingSection({ kingdom }: { kingdom: Kingdom | null }) {
  if (!kingdom) return null;

  const cities = kingdom.cities || {};
  const cityCount = Object.keys(cities).length;
  const generalCount = kingdom.generals?.length || 0;

  return (
    <div className="bg-gray-900/70 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg">
      <div className="py-3 px-4 text-center font-bold text-lg bg-gray-700">
        【 재 야 】
      </div>
      
      <div className="grid grid-cols-5 text-sm border-b border-white/5">
        <div className="col-span-2 p-3"></div>
        <div className="bg-gray-800/50 p-2 text-center text-gray-400">장 수</div>
        <div className="p-2 text-center font-mono text-white">{generalCount}</div>
        <div className="bg-gray-800/50 p-2 text-center text-gray-400">속 령</div>
      </div>
      <div className="grid grid-cols-5 text-sm border-b border-white/5">
        <div className="col-span-4"></div>
        <div className="p-2 text-center font-mono text-white">{cityCount}</div>
      </div>

      {/* 속령 일람 */}
      <div className="p-2 text-xs border-b border-white/5">
        <span className="text-gray-400">속령 일람 : </span>
        {Object.entries(cities).map(([cityId, cityName], idx) => (
          <span key={cityId} className="text-gray-300">
            {cityName}
            {idx < Object.keys(cities).length - 1 && ', '}
          </span>
        ))}
        {cityCount === 0 && <span className="text-gray-500">없음</span>}
      </div>

      {/* 장수 일람 */}
      <div className="p-2 text-xs">
        <span className="text-gray-400">장수 일람 : </span>
        {(kingdom.generals || []).map((general, idx) => (
          <span key={general.no}>
            {formatGeneralName(general.name, general.npc)}
            {idx < (kingdom.generals?.length || 0) - 1 && ', '}
          </span>
        ))}
        {generalCount === 0 && <span className="text-gray-500">없음</span>}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function KingdomListContent() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const sortBy = searchParams?.get('sort') || 'power';
  const searchQuery = searchParams?.get('q') || '';

  const [loading, setLoading] = useState(true);
  const [kingdomList, setKingdomList] = useState<Kingdom[]>([]);
  const [wandering, setWandering] = useState<Kingdom | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || (key === 'sort' && value === 'power')) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    loadKingdomList();
  }, [serverID]);

  async function loadKingdomList() {
    try {
      setLoading(true);
      const result = await SammoAPI.GetKingdomList();
      if (result.result && result.nations) {
        const nations: Kingdom[] = [];
        let wanderingNation: Kingdom | null = null;

        for (const [nationId, nation] of Object.entries(result.nations)) {
          const k = nation as Kingdom;
          if (Number(nationId) === 0) {
            wanderingNation = k;
          } else {
            nations.push(k);
          }
        }

        setKingdomList(nations);
        setWandering(wanderingNation);
      } else if (result.kingdomList) {
        // 레거시 호환
        setKingdomList(result.kingdomList);
      }
    } catch (err) {
      console.error(err);
      showToast('세력 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredKingdoms = useMemo(() => {
    let filtered = [...kingdomList];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((k) => k.name?.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'cities':
          return (Object.keys(b.cities || {}).length) - (Object.keys(a.cities || {}).length);
        case 'generals':
          return (b.generals?.length || 0) - (a.generals?.length || 0);
        case 'level':
          return (b.level || 0) - (a.level || 0);
        case 'power':
        default:
          return (b.power || 0) - (a.power || 0);
      }
    });

    return filtered;
  }, [kingdomList, sortBy, searchQuery]);

  function handleSearch() {
    updateParams({ q: localSearch || undefined });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <TopBackBar title="세 력 일 람" reloadable onReload={loadKingdomList} />

        <FilterPanel>
          <FilterSelect
            label="정렬"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(v) => updateParams({ sort: v })}
          />
          <FilterInput
            placeholder="세력명 검색..."
            value={localSearch}
            onChange={setLocalSearch}
            onSubmit={handleSearch}
          />
        </FilterPanel>

        <div className="text-sm text-gray-400">
          총 <span className="text-white font-bold">{filteredKingdoms.length}</span>개 세력
          {searchQuery && (
            <span className="ml-2">
              &quot;<span className="text-blue-400">{searchQuery}</span>&quot; 검색 결과
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredKingdoms.map((kingdom, idx) => (
              <KingdomCard key={kingdom.nation} kingdom={kingdom} rank={idx} />
            ))}

            {filteredKingdoms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🚩</div>
                {searchQuery ? '검색 결과가 없습니다.' : '활성화된 세력이 없습니다.'}
              </div>
            )}

            {/* 재야 섹션 */}
            {wandering && !searchQuery && <WanderingSection kingdom={wandering} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KingdomListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <KingdomListContent />
    </Suspense>
  );
}
