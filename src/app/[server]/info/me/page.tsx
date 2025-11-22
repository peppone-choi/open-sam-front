'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [loading, setLoading] = useState(true);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [frontInfo, setFrontInfo] = useState<any>(null);
  const [settings, setSettings] = useState({
    use_treatment: 10,
    use_auto_nation_turn: 1,
    defence_train: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [serverID]);

  async function loadUserData() {
    try {
      setLoading(true);
      
      const [basicInfoResult, frontInfoResult] = await Promise.all([
        SammoAPI.GetBasicInfo({ session_id: serverID }).catch(() => null),
        SammoAPI.GeneralGetFrontInfo({
          serverID: serverID || '',
          lastNationNoticeDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          lastGeneralRecordID: 0,
          lastGlobalHistoryID: 0,
        }).catch(() => null),
      ]);

      if (basicInfoResult?.result) {
        setBasicInfo(basicInfoResult);
      }

      if (frontInfoResult?.result && frontInfoResult.general) {
        setFrontInfo(frontInfoResult);
        setSettings({
          use_treatment: frontInfoResult.general.use_treatment || 10,
          use_auto_nation_turn: frontInfoResult.general.use_auto_nation_turn || 1,
          defence_train: frontInfoResult.general.defence_train === 999 || false,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    try {
      setSaving(true);
      const result = await SammoAPI.SetMySetting({
        session_id: serverID,
        use_treatment: settings.use_treatment,
        use_auto_nation_turn: settings.use_auto_nation_turn,
        defence_train: settings.defence_train ? 999 : 80,
      });

      if (result.result) {
        alert('설정이 저장되었습니다.');
      } else {
        alert(result.reason || '설정 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col p-3 bg-black/20 rounded-lg border border-white/5">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="내 정보&설정" reloadable onReload={loadUserData} />

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Info Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              기본 정보
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="장수명" value={frontInfo?.general?.name || basicInfo?.generalID || '-'} />
              <InfoItem label="국가" value={frontInfo?.nation?.name || basicInfo?.myNationID || '-'} />
              
              {frontInfo?.general && (
                <>
                  <InfoItem label="레벨" value={frontInfo.general.level || frontInfo.general.data?.level || 1} />
                  <InfoItem label="통솔" value={frontInfo.general.leadership || frontInfo.general.data?.leadership || 0} />
                  <InfoItem label="무력" value={frontInfo.general.strength || frontInfo.general.data?.strength || 0} />
                  <InfoItem label="지력" value={frontInfo.general.intel || frontInfo.general.data?.intel || 0} />
                </>
              )}
              
              {basicInfo && (
                <>
                  <InfoItem label="직위" value={frontInfo?.general?.officerLevelText || `레벨 ${basicInfo.officerLevel}`} />
                  <InfoItem label="권한" value={basicInfo.permission > 0 ? `권한 ${basicInfo.permission}` : '일반'} />
                  {basicInfo.isChief && <InfoItem label="지위" value="군주" />}
                </>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-green-500 rounded-full"></span>
              설정
            </h2>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <label className="flex items-center gap-3 p-4 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-black/30 transition-colors flex-1">
                  <input
                    type="checkbox"
                    checked={settings.defence_train}
                    onChange={(e) => setSettings({ ...settings, defence_train: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-white font-medium">수비 훈련 자동 수행</span>
                </label>

                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-medium text-gray-400">치료 시도 기준 (체력 %)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.use_treatment}
                    onChange={(e) => setSettings({ ...settings, use_treatment: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-medium text-gray-400">자동 국가 턴</label>
                  <select
                    value={settings.use_auto_nation_turn}
                    onChange={(e) => setSettings({ ...settings, use_auto_nation_turn: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  >
                    <option value={0} className="bg-gray-900">사용 안함</option>
                    <option value={1} className="bg-gray-900">사용</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      저장 중...
                    </div>
                  ) : '설정 저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
