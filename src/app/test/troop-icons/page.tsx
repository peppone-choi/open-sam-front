'use client';

import React from 'react';
import { TroopIcon } from '@/components/common/TroopIcon';
import { TroopIconDisplay } from '@/components/common/TroopIconDisplay';

/**
 * 병종 아이콘 테스트 페이지
 * 삼국지 조조전 스타일의 모든 병종 아이콘을 확인할 수 있습니다
 */
export default function TroopIconsTestPage() {
  const unitTypes: Array<'FOOTMAN' | 'SPEARMAN' | 'ARCHER' | 'CAVALRY' | 'SIEGE' | 'WIZARD' | 'MIXED' | 'CASTLE'> = [
    'FOOTMAN',
    'SPEARMAN', 
    'ARCHER',
    'CAVALRY',
    'SIEGE',
    'WIZARD',
    'MIXED',
    'CASTLE'
  ];

  const sampleCrewtypes = [
    { value: 0, label: '간단매핑: 보병' },
    { value: 1, label: '간단매핑: 궁병' },
    { value: 2, label: '간단매핑: 기병' },
    { value: 3, label: '간단매핑: 귀병' },
    { value: 4, label: '간단매핑: 공성' },
    { value: 1100, label: '정규매핑: 보병' },
    { value: 1201, label: '정규매핑: 창병' },
    { value: 1301, label: '정규매핑: 궁병' },
    { value: 1401, label: '정규매핑: 기병' },
    { value: 1601, label: '정규매핑: 공성' },
    { value: 1701, label: '정규매핑: 귀병' },
    { value: 1501, label: '정규매핑: 복합' },
    { value: 1000, label: '정규매핑: 성벽' },
  ];

  return (
    <div style={{ 
      padding: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f7fafc'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        marginBottom: '8px',
        color: '#1a202c'
      }}>
        병종 아이콘 테스트
      </h1>
      <p style={{ 
        fontSize: '16px', 
        color: '#718096', 
        marginBottom: '40px' 
      }}>
        삼국지 조조전 스타일 16x16 픽셀 아트
      </p>

      {/* 기본 아이콘 그리드 */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#2d3748'
        }}>
          기본 병종 아이콘
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '24px',
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {unitTypes.map((type) => (
            <div key={type} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#f7fafc',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <TroopIcon type={type} size={64} />
              <span style={{ 
                marginTop: '12px', 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#4a5568'
              }}>
                {type}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 다양한 크기 */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#2d3748'
        }}>
          크기 변형 (보병 예시)
        </h2>
        
        <div style={{ 
          display: 'flex', 
          gap: '32px',
          alignItems: 'flex-end',
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {[16, 24, 32, 48, 64, 96, 128].map((size) => (
            <div key={size} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '8px'
            }}>
              <TroopIcon type="FOOTMAN" size={size} />
              <span style={{ fontSize: '12px', color: '#718096' }}>
                {size}px
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* TroopIconDisplay 컴포넌트 테스트 */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#2d3748'
        }}>
          Crewtype 매핑 테스트
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {sampleCrewtypes.map(({ value, label }) => (
            <div key={value} style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f7fafc',
              border: '1px solid #e2e8f0'
            }}>
              <TroopIconDisplay crewtype={value} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568' }}>
                  {label}
                </div>
                <div style={{ fontSize: '11px', color: '#a0aec0' }}>
                  crewtype: {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 라벨 포함 표시 */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#2d3748'
        }}>
          라벨 포함 표시
        </h2>
        
        <div style={{ 
          display: 'flex', 
          gap: '24px',
          flexWrap: 'wrap',
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {[0, 1, 2, 3, 4].map((crewtype) => (
            <TroopIconDisplay 
              key={crewtype} 
              crewtype={crewtype} 
              size={64} 
              showLabel={true}
            />
          ))}
        </div>
      </section>

      {/* 배경색 테스트 */}
      <section>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#2d3748'
        }}>
          다양한 배경에서의 표시
        </h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          {[
            { bg: '#ffffff', label: '흰색' },
            { bg: '#1a202c', label: '검정' },
            { bg: '#48bb78', label: '녹색' },
            { bg: '#4299e1', label: '파랑' }
          ].map(({ bg, label }) => (
            <div key={bg} style={{
              backgroundColor: bg,
              padding: '24px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '600',
                color: bg === '#ffffff' ? '#1a202c' : '#ffffff'
              }}>
                {label}
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <TroopIcon type="FOOTMAN" size={48} />
                <TroopIcon type="CAVALRY" size={48} />
                <TroopIcon type="WIZARD" size={48} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
