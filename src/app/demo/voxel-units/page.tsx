'use client';

import dynamic from 'next/dynamic';
import { 
  VOXEL_UNIT_DATABASE, 
  VOXEL_UNIT_CATEGORIES,
  VOXEL_PALETTE,
} from '@/components/battle/units/db/VoxelUnitDefinitions';

const VoxelUnitPreview = dynamic(
  () => import('@/components/battle/units/VoxelUnitPreview'),
  { 
    ssr: false,
    loading: () => <LoadingBox />,
  }
);

function LoadingBox() {
  return (
    <div style={{
      width: '100%',
      height: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0a0a12 0%, #12121f 100%)',
      borderRadius: 16,
      color: '#9ca3af',
      fontFamily: "'Pretendard', -apple-system, sans-serif",
    }}>
      ⏳ 복셀 엔진 로딩 중...
    </div>
  );
}

export default function VoxelUnitsDemo() {
  const totalUnits = Object.keys(VOXEL_UNIT_DATABASE).length;
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #05050a 0%, #0d0d15 50%, #0a0a12 100%)',
      padding: '48px 24px',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* 헤더 */}
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            background: 'rgba(234, 179, 8, 0.15)',
            borderRadius: 20,
            marginBottom: 16,
          }}>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#facc15',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              🎮 VOXEL UNIT SYSTEM
            </span>
          </div>
          
          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            color: '#f3f4f6',
            margin: '0 0 16px',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}>
            삼국지 복셀 유닛 빌더
          </h1>
          
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1.1rem', 
            maxWidth: 600,
            margin: '0 auto 24px',
            lineHeight: 1.6,
          }}>
            역사적 고증을 바탕으로 한 삼국지 복셀 유닛 시스템.<br/>
            7.5등신 리얼 비율과 상세한 장비 디테일을 구현합니다.
          </p>
          
          <div style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <StatBadge value={totalUnits} label="유닛 종류" />
            <StatBadge value="5" label="병종 카테고리" />
            <StatBadge value="9" label="국가 색상" />
            <StatBadge value="7.5" label="등신 비율" />
          </div>
        </header>

        {/* 메인 프리뷰 */}
        <section style={{ marginBottom: 48 }}>
          <VoxelUnitPreview width={1050} height={550} />
        </section>

        {/* 시스템 특징 */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 48,
        }}>
          <FeatureCard
            icon="📐"
            title="Grid Scale"
            items={[
              'Human: 32×32×48 복셀',
              'Horse: 48×80×64 복셀',
              'Siege: 80×120×90 복셀',
            ]}
          />
          <FeatureCard
            icon="🎨"
            title="Material Palette"
            items={[
              '철/녹/옻칠/청동 재질',
              '고증 기반 색상 팔레트',
              'PBR 머티리얼 적용',
            ]}
          />
          <FeatureCard
            icon="⚔️"
            title="Historical Accuracy"
            items={[
              '양당개(조끼형 찰갑)',
              '환수도(고리 자루 칼)',
              '극(창+낫 복합 무기)',
            ]}
          />
          <FeatureCard
            icon="🛡️"
            title="Equipment Detail"
            items={[
              '투구/갑옷/무기/방패',
              '탈것(말/낙타/늑대)',
              '공성 기계(충차/투석기)',
            ]}
          />
        </section>

        {/* 색상 팔레트 */}
        <section style={{
          padding: 28,
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 48,
        }}>
          <h2 style={{ 
            color: '#d1d5db', 
            fontSize: '1.1rem', 
            margin: '0 0 20px',
            fontWeight: 600,
          }}>
            🎨 Material Palette (고증 기반)
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}>
            <PaletteItem name="Iron (Worn)" color={VOXEL_PALETTE.IRON_BASE} />
            <PaletteItem name="Iron Highlight" color={VOXEL_PALETTE.IRON_HIGHLIGHT} />
            <PaletteItem name="Rust" color={VOXEL_PALETTE.RUST} />
            <PaletteItem name="Red Lacquer" color={VOXEL_PALETTE.LACQUER_RED} />
            <PaletteItem name="Black Lacquer" color={VOXEL_PALETTE.LACQUER_BLACK} />
            <PaletteItem name="Bronze" color={VOXEL_PALETTE.BRONZE} />
            <PaletteItem name="Patina" color={VOXEL_PALETTE.PATINA} />
            <PaletteItem name="Rattan" color={VOXEL_PALETTE.RATTAN} />
            <PaletteItem name="Old Wood" color={VOXEL_PALETTE.WOOD_OLD} />
            <PaletteItem name="Yellow Cloth" color={VOXEL_PALETTE.CLOTH_YELLOW} />
          </div>
        </section>

        {/* 카테고리별 유닛 목록 */}
        <section style={{
          padding: 28,
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 48,
        }}>
          <h2 style={{ 
            color: '#d1d5db', 
            fontSize: '1.1rem', 
            margin: '0 0 24px',
            fontWeight: 600,
          }}>
            📋 유닛 카테고리
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {Object.entries(VOXEL_UNIT_CATEGORIES).map(([key, cat]) => {
              const units = Object.values(VOXEL_UNIT_DATABASE).filter(u => u.category === key);
              return (
                <div key={key} style={{
                  padding: 16,
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                    <span style={{ 
                      color: '#e5e7eb', 
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}>
                      {cat.name}
                    </span>
                    <span style={{ 
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      marginLeft: 'auto',
                    }}>
                      {units.length}개
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}>
                    {units.slice(0, 6).map(unit => (
                      <div key={unit.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        padding: '4px 0',
                      }}>
                        <span style={{ color: '#9ca3af' }}>{unit.name}</span>
                        <span style={{ 
                          color: '#6b7280',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.7rem',
                        }}>
                          {unit.id}
                        </span>
                      </div>
                    ))}
                    {units.length > 6 && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280',
                        paddingTop: 4,
                      }}>
                        +{units.length - 6}개 더...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 코드 예시 */}
        <section style={{
          padding: 28,
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: 16,
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <h2 style={{ 
            color: '#e5e7eb', 
            fontSize: '1.1rem', 
            margin: '0 0 16px',
            fontWeight: 600,
          }}>
            💡 사용법
          </h2>
          <pre style={{
            background: '#0a0a12',
            padding: 20,
            borderRadius: 10,
            color: '#4ade80',
            fontSize: '0.8rem',
            overflow: 'auto',
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}>
{`import { buildVoxelUnitFromSpec, VOXEL_NATION_PALETTES } from './VoxelUnitBuilder';
import { VOXEL_UNIT_DATABASE } from './db/VoxelUnitDefinitions';

// ID로 유닛 생성
const unit = buildVoxelUnitFromSpec({
  unitId: 1117,  // 함진영
  primaryColor: VOXEL_NATION_PALETTES.wei.primary,
  secondaryColor: VOXEL_NATION_PALETTES.wei.secondary,
  scale: 1.2,
});

scene.add(unit);

// 유닛 정보 조회
const spec = VOXEL_UNIT_DATABASE[1117];
console.log(spec.name);        // "함진영"
console.log(spec.description); // "[Voxel_Human_Elite_Heavy] 침묵의 철벽..."`}
          </pre>
        </section>

        {/* 푸터 */}
        <footer style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.85rem',
        }}>
          <p>
            🏯 삼국지 복셀 유닛 시스템 | 역사적 고증 기반 디자인
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatBadge({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <span style={{
        fontSize: '1.8rem',
        fontWeight: 800,
        color: '#f3f4f6',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        fontWeight: 500,
      }}>
        {label}
      </span>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  items 
}: { 
  icon: string; 
  title: string; 
  items: string[];
}) {
  return (
    <div style={{
      padding: 24,
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 14,
      border: '1px solid rgba(255, 255, 255, 0.06)',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{icon}</div>
      <h3 style={{ 
        color: '#e5e7eb', 
        fontSize: '1rem', 
        margin: '0 0 12px',
        fontWeight: 600,
      }}>
        {title}
      </h3>
      <ul style={{
        margin: 0,
        paddingLeft: 18,
        color: '#9ca3af',
        fontSize: '0.85rem',
        lineHeight: 1.7,
      }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PaletteItem({ name, color }: { name: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 8,
      border: '1px solid rgba(255, 255, 255, 0.04)',
    }}>
      <div style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: color,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0,
      }} />
      <div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#d1d5db',
          fontWeight: 500,
        }}>
          {name}
        </div>
        <div style={{ 
          fontSize: '0.65rem', 
          color: '#6b7280',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {color}
        </div>
      </div>
    </div>
  );
}

