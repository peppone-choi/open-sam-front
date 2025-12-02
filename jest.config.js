/** @type {import('jest').Config} */
const config = {
  displayName: 'open-sam-front',
  testEnvironment: 'jsdom',
  
  // 모듈 경로 별칭 설정
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // TypeScript 변환
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
  ],
  
  // 무시할 패턴
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
  ],
  
  // 커버리지 설정 - 테스트가 작성된 핵심 파일들
  collectCoverageFrom: [
    // battle 어댑터 (기존 테스트)
    'src/lib/battle/adapters/BattleDataAdapter.ts',
    'src/lib/battle/adapters/ResultAdapter.ts',
    'src/lib/battle/adapters/UnitAdapter.ts',
    'src/lib/battle/adapters/GeneralAdapter.ts',
    'src/lib/battle/sync/ResultCalculator.ts',
    // 스토어 (신규 테스트)
    'src/stores/voxelBattleStore.ts',
    'src/stores/gameStore.ts',
    'src/stores/sammoStore.ts',
    // 훅 (신규 테스트)
    'src/hooks/useBattleSocket.ts',
    // UI 컴포넌트 (신규 테스트)
    'src/components/ui/button.tsx',
    // 제외 패턴
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.tsx',
  ],
  // 커버리지 임계값 (필요 시 활성화)
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 40,
  //     lines: 40,
  //     statements: 40,
  //   },
  // },
  
  // 설정 파일
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  
  // 모듈 확장자
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 변환 무시
  transformIgnorePatterns: [
    '/node_modules/(?!(three|@react-three|phaser)/)',
  ],
  
  // 타임아웃
  testTimeout: 10000,
  
  // 모듈 디렉토리
  moduleDirectories: ['node_modules', 'src'],
};

module.exports = config;

