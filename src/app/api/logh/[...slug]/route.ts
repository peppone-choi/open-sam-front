import { NextRequest, NextResponse } from 'next/server';

const BACKEND_TARGET = (process.env.BACKEND_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const USE_QA_MOCKS = process.env.LOGH_QA_MOCKS === '1' || process.env.NEXT_PUBLIC_LOGH_USE_MOCKS === '1';

const MOCK_COMMANDER = {
  id: 'cmd-001',
  name: 'Yang Wen-li',
  faction: 'alliance' as const,
  rank: 'Fleet Admiral',
  commandPoints: 8,
  stats: { command: 98, tactics: 95, strategy: 99, politics: 82 },
  supplies: 12000,
  fleetId: 'FLEET-AL-01',
  position: { x: 12, y: 8, z: 1 },
};

const MOCK_STRATEGIC_FLEETS = [
  {
    fleetId: 'FLEET-AL-01',
    name: '13th Fleet',
    faction: 'alliance',
    strategicPosition: { x: 4, y: 3 },
    status: 'idle',
    isInCombat: false,
    totalShips: 5200,
  },
  {
    fleetId: 'FLEET-IM-01',
    name: 'Imperial Vanguard',
    faction: 'empire',
    strategicPosition: { x: 7, y: 4 },
    status: 'moving',
    isInCombat: true,
    totalShips: 6400,
  },
];

const MOCK_TACTICAL_FLEETS = [
  {
    fleetId: 'FLEET-AL-01',
    totalShips: 5200,
    formation: 'standard',
    tacticalPosition: { x: 2200, y: 5100, heading: 45 },
  },
  {
    fleetId: 'FLEET-IM-01',
    totalShips: 6400,
    formation: 'spindle',
    tacticalPosition: { x: 7800, y: 5200, heading: 225 },
  },
];

const MOCK_FLEET_DETAIL = {
  id: 'FLEET-AL-01',
  name: '13th Fleet',
  commanderName: 'Yang Wen-li',
  faction: 'alliance',
  gridX: 4,
  gridY: 3,
  size: 5200,
  status: 'idle',
  formation: 'standard',
  totalShips: 5200,
  supplies: 9200,
  ammo: 8700,
  morale: 96,
  ships: Array.from({ length: 5 }).map((_, idx) => ({
    id: `ship-${idx + 1}`,
    name: idx === 0 ? 'Hyperion' : `Escort-${idx}`,
    type: idx === 0 ? 'battleship' : 'destroyer',
    durability: 100,
    maxDurability: 100,
    crew: 100,
    maxCrew: 100,
    energy: 90,
    maxEnergy: 100,
    status: 'active',
  })),
};

const MOCK_STAR_SYSTEMS = [
  {
    id: 'odin',
    name: 'Odin',
    gridX: 20,
    gridY: 12,
    faction: 'alliance',
    planets: [
      { id: 'odin-alpha', name: 'Odin Prime', type: 'planet', population: 900000000 },
    ],
  },
  {
    id: 'isar',
    name: 'Isarl',
    gridX: 32,
    gridY: 8,
    faction: 'empire',
    planets: [
      { id: 'isar-fort', name: 'Isarl Fortress', type: 'fortress', population: 1200000000 },
    ],
  },
];

const MOCK_TACTICAL_BATTLE = {
  id: 'test-battle-1',
  gridId: 'sector-7',
  phase: 'engagement',
  factions: [
    { code: 'alliance', label: '자유혹성동맹', commanderIds: ['cmd-001'], unitCount: 5200 },
    { code: 'empire', label: '은하제국', commanderIds: ['cmd-999'], unitCount: 6400 },
  ],
  fleets: MOCK_TACTICAL_FLEETS,
};

const MOCK_MAP_GRID = {
  gridSize: { width: 10, height: 6 },
  grid: Array.from({ length: 6 }).map(() => Array.from({ length: 10 }).map(() => 1)),
};

const MOCK_ECONOMY_STATE = {
  data: {
    treasury: 150000,
    income: 5000,
    expense: 3200,
    ledger: [
      { date: '801.01.01', description: 'Fleet Maintenance', value: -1200 },
      { date: '801.01.01', description: 'Tax Revenue (Odin)', value: 3500 },
    ],
  },
};

const MOCK_ECONOMY_EVENTS = {
  data: [
    { id: 'eco-1', title: 'Odin Trade Hub', type: 'positive', value: +1200 },
  ],
};

const MOCK_COMM_LIST = { data: [] };

interface MockResult {
  body: any;
  status?: number;
}

export async function GET(req: NextRequest, context: { params: { slug?: string[] } }) {
  return handleRequest(req, context);
}

export async function POST(req: NextRequest, context: { params: { slug?: string[] } }) {
  return handleRequest(req, context);
}

async function handleRequest(req: NextRequest, context: { params: { slug?: string[] } }) {
  const slug = (context.params.slug ?? []).join('/');
  if (USE_QA_MOCKS) {
    const mock = getMockResponse(slug, req);
    if (mock) {
      return NextResponse.json(mock.body, { status: mock.status ?? 200 });
    }
  }
  return proxyToBackend(req, slug);
}

function getMockResponse(slug: string, req: NextRequest): MockResult | null {
  const path = slug.replace(/\/$/, '');
  if (path.startsWith('galaxy/commanders')) {
    return {
      body: {
        success: true,
        data: [
          {
            no: 1,
            name: MOCK_COMMANDER.name,
            rank: MOCK_COMMANDER.rank,
            faction: MOCK_COMMANDER.faction,
            commandPoints: { personal: 100, military: 100 },
          },
        ],
      },
    };
  }

  if (path.startsWith('galaxy/systems')) {
    return { body: { data: MOCK_STAR_SYSTEMS } };
  }

  if (path.startsWith('galaxy/fleets')) {
    return {
      body: {
        data: MOCK_STRATEGIC_FLEETS.map((fleet) => ({
          id: fleet.fleetId,
          commanderName: fleet.name,
          faction: fleet.faction,
          gridX: fleet.strategicPosition.x,
          gridY: fleet.strategicPosition.y,
          size: fleet.totalShips,
          status: fleet.status,
        })),
      },
    };
  }

  if (path.startsWith('galaxy/tactical-battles')) {
    if (path.endsWith('/resolve')) {
      return { body: { success: true, winner: 'alliance', log: ['AUTO RESOLVE (mock)'] } };
    }
    return { body: { success: true, data: { ...MOCK_TACTICAL_BATTLE, id: path.split('/')[2] } } };
  }

  if (path.startsWith('tactical-maps/')) {
    return { body: { success: true, data: { fleets: MOCK_TACTICAL_FLEETS } } };
  }

  if (path === 'map/grid') {
    return { body: { success: true, data: MOCK_MAP_GRID } };
  }

  if (path === 'my-commander') {
    return { body: MOCK_COMMANDER };
  }

  if (path === 'fleet/my') {
    return { body: { success: true, data: MOCK_FLEET_DETAIL } };
  }

  if (path.startsWith('fleet/')) {
    return { body: MOCK_FLEET_DETAIL };
  }

  if (path === 'command/execute') {
    return { body: { success: true, message: 'Mock command executed' } };
  }

  if (path === 'economy/state') {
    return { body: MOCK_ECONOMY_STATE };
  }

  if (path === 'economy/events') {
    return { body: MOCK_ECONOMY_EVENTS };
  }

  if (path.startsWith('comm/messages') || path.startsWith('comm/handshakes') || path.startsWith('comm/address-book')) {
    return { body: MOCK_COMM_LIST };
  }

  return null;
}

async function proxyToBackend(req: NextRequest, slug: string) {
  const target = new URL(`${BACKEND_TARGET}/api/logh/${slug}`);
  target.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  headers.set('host', target.host);

  let body: Buffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buffer = await req.arrayBuffer();
    body = buffer.byteLength ? Buffer.from(buffer) : undefined;
  }

  const response = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(response.headers);
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
