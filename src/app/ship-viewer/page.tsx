'use client';

import React, { useState, useCallback } from 'react';
import ShipMeshViewer from '@/components/logh/ShipMeshViewer';

// 함선 목록 (모드에서 가져온 것)
const SHIPS = {
  empire: [
    { id: 'emp_bb', name: '제국군 전함', mesh: 'empire_battleship' },
    { id: 'emp_bb_fast', name: '제국군 고속전함', mesh: 'empire_battleship_fast' },
    { id: 'emp_ca', name: '제국군 순양함', mesh: 'empire_cruiser' },
    { id: 'emp_dd', name: '제국군 구축함', mesh: 'empire_destroyer' },
    { id: 'emp_cv', name: '제국군 항공모함', mesh: 'empire_carrier' },
    { id: 'emp_valkyrie', name: '발퀴레', mesh: 'empire_walkure' },
    { id: 'emp_brunhild', name: '브륀힐트', mesh: 'GE_CommandShip_BrunhildUpgrade' },
    { id: 'emp_barbarossa', name: '바르바로사', mesh: 'GE_CommandShip_Barbarossa' },
    { id: 'emp_tristan', name: '트리스탄', mesh: 'GE_CommandShip_Tristan' },
    { id: 'emp_konigstiger', name: '쾨니히스티거', mesh: 'GE_CommandShip_KonigsTiger' },
  ],
  alliance: [
    { id: 'all_bb', name: '동맹군 전함', mesh: 'fpa_battleship' },
    { id: 'all_ca', name: '동맹군 순양함', mesh: 'fpa_cruiser' },
    { id: 'all_dd', name: '동맹군 구축함', mesh: 'fpa_destroyer' },
    { id: 'all_cv', name: '동맹군 항공모함', mesh: 'fpa_carrier' },
    { id: 'all_spartanian', name: '스파르타니안', mesh: 'fpa_spartanian' },
    { id: 'all_hyperion', name: '히페리온', mesh: 'FPA_CommandShip_Hyperion' },
    { id: 'all_triglav', name: '트리그라프', mesh: 'FPA_CommandShip_Triglav' },
    { id: 'all_krishna', name: '크리슈나', mesh: 'FPA_CommandShip_Krishna' },
  ],
  special: [
    { id: 'iserlohn', name: '이제를론 요새', mesh: 'iserlohn' },
  ],
};

export default function ShipViewerPage() {
  const [meshData, setMeshData] = useState<string | null>(null);
  const [selectedShip, setSelectedShip] = useState<{ name: string; mesh: string; faction: 'empire' | 'alliance' } | null>(null);
  const [showWeaponPoints, setShowWeaponPoints] = useState(false);
  const [showExhaustPoints, setShowExhaustPoints] = useState(true);

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setMeshData(text);
      setSelectedShip({
        name: file.name.replace('.mesh', ''),
        mesh: file.name,
        faction: file.name.toLowerCase().includes('fpa') ? 'alliance' : 'empire',
      });
    };
    reader.readAsText(file);
  }, []);

  // 폴더 업로드 핸들러 (여러 메쉬 파일)
  const handleFolderUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 첫 번째 .mesh 파일만 로드
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.mesh')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setMeshData(text);
          setSelectedShip({
            name: file.name.replace('.mesh', ''),
            mesh: file.name,
            faction: file.name.toLowerCase().includes('fpa') ? 'alliance' : 'empire',
          });
        };
        reader.readAsText(file);
        break;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          🚀 은하영웅전설 - 함선 메쉬 뷰어
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 왼쪽: 함선 목록 및 업로드 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 파일 업로드 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4">📁 메쉬 파일 업로드</h2>
              
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm text-gray-400">.mesh 파일 선택</span>
                  <input
                    type="file"
                    accept=".mesh"
                    onChange={handleFileUpload}
                    className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </label>

                <div className="text-xs text-gray-500">
                  또는 Gineiden 모드의 Mesh 폴더에서 .mesh 파일을 선택하세요.
                </div>
              </div>
            </div>

            {/* 옵션 */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4">⚙️ 표시 옵션</h2>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showWeaponPoints}
                    onChange={(e) => setShowWeaponPoints(e.target.checked)}
                    className="rounded"
                  />
                  <span>무기 장착점 표시</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showExhaustPoints}
                    onChange={(e) => setShowExhaustPoints(e.target.checked)}
                    className="rounded"
                  />
                  <span>엔진 분사점 표시</span>
                </label>
              </div>
            </div>

            {/* 함선 목록 (참고용) */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4">📋 함선 목록 (참고)</h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <h3 className="text-yellow-400 font-bold mb-2">🔴 제국군</h3>
                  <div className="space-y-1 text-sm">
                    {SHIPS.empire.map(ship => (
                      <div key={ship.id} className="text-gray-400 hover:text-white">
                        {ship.name} <span className="text-gray-600">({ship.mesh})</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-blue-400 font-bold mb-2">🔵 동맹군</h3>
                  <div className="space-y-1 text-sm">
                    {SHIPS.alliance.map(ship => (
                      <div key={ship.id} className="text-gray-400 hover:text-white">
                        {ship.name} <span className="text-gray-600">({ship.mesh})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-purple-400 font-bold mb-2">⭐ 특수</h3>
                  <div className="space-y-1 text-sm">
                    {SHIPS.special.map(ship => (
                      <div key={ship.id} className="text-gray-400 hover:text-white">
                        {ship.name} <span className="text-gray-600">({ship.mesh})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 3D 뷰어 */}
          <div className="lg:col-span-3">
            {meshData && selectedShip ? (
              <ShipMeshViewer
                meshData={meshData}
                shipName={selectedShip.name}
                faction={selectedShip.faction}
                width={900}
                height={700}
                showWeaponPoints={showWeaponPoints}
                showExhaustPoints={showExhaustPoints}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg h-[700px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🛸</div>
                  <div className="text-xl">메쉬 파일을 업로드하세요</div>
                  <div className="text-sm mt-2">
                    Gineiden 모드의 Mesh 폴더에서<br />
                    .mesh 파일을 선택하면 3D로 볼 수 있습니다.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📖 사용법</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>
              <strong>Gineiden Current v1.85</strong> 폴더의 <code className="bg-gray-700 px-2 py-1 rounded">Mesh</code> 폴더를 찾습니다.
            </li>
            <li>
              원하는 함선의 <code className="bg-gray-700 px-2 py-1 rounded">.mesh</code> 파일을 선택합니다.
              <br />
              <span className="text-sm text-gray-500">예: empire_battleship.mesh, FPA_CommandShip_Hyperion.mesh</span>
            </li>
            <li>
              3D 뷰에서 마우스로 회전/확대하여 함선을 확인합니다.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}




