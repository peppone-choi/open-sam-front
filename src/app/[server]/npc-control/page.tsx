'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import TopBackBar from '@/components/common/TopBackBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface NationPolicyState {
  values: Record<string, any>;
  priority: string[];
}

interface GeneralPolicyState {
  priority: string[];
}

interface NPCControlState {
  nationPolicy?: NationPolicyState;
  generalPolicy?: GeneralPolicyState;
}

const COMPLEX_POLICY_KEYS = ['CombatForce', 'SupportForce', 'DevelopForce'] as const;
type ComplexPolicyKey = (typeof COMPLEX_POLICY_KEYS)[number];

export default function NPCControlPage() {
  const params = useParams();
  const serverID = params?.server as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [control, setControl] = useState<NPCControlState | null>(null);
  const [nationPolicyValues, setNationPolicyValues] = useState<Record<string, any>>({});
  const [nationPriorityText, setNationPriorityText] = useState('');
  const [generalPriorityText, setGeneralPriorityText] = useState('');
  const [complexPolicyJSON, setComplexPolicyJSON] = useState<Record<ComplexPolicyKey, string>>({
    CombatForce: '{}',
    SupportForce: '[]',
    DevelopForce: '[]',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<null | 'nationPolicy' | 'nationPriority' | 'generalPriority'>(null);

  useEffect(() => {
    loadNPCData();
  }, [serverID]);

  const numericPolicyEntries = useMemo(() => {
    return Object.entries(nationPolicyValues).filter(([, value]) => typeof value === 'number');
  }, [nationPolicyValues]);

  async function loadNPCData() {
    try {
      setLoading(true);
      setErrorMessage(null);
      const result = await SammoAPI.GetNPCControl({ serverID });
      if (!result.result) {
        setErrorMessage(result.reason || 'NPC 정책 정보를 불러올 수 없습니다.');
        setControl(null);
        return;
      }

      const controlData: NPCControlState | null =
        (result.control as NPCControlState) ||
        (result.npcControl as NPCControlState) ||
        null;

      if (!controlData) {
        setErrorMessage('NPC 정책 정보가 비어 있습니다.');
        setControl(null);
        return;
      }

      setControl(controlData);
      const policyValues = controlData.nationPolicy?.values || {};
      setNationPolicyValues(policyValues);
      setNationPriorityText((controlData.nationPolicy?.priority || []).join('\n'));
      setGeneralPriorityText((controlData.generalPolicy?.priority || []).join('\n'));

      setComplexPolicyJSON({
        CombatForce: JSON.stringify(policyValues.CombatForce ?? {}, null, 2),
        SupportForce: JSON.stringify(
          Array.isArray(policyValues.SupportForce) ? policyValues.SupportForce : [],
          null,
          2
        ),
        DevelopForce: JSON.stringify(
          Array.isArray(policyValues.DevelopForce) ? policyValues.DevelopForce : [],
          null,
          2
        ),
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('NPC 정책 정보를 불러오는데 실패했습니다.');
      setControl(null);
    } finally {
      setLoading(false);
    }
  }

  const handlePolicyNumberChange = (key: string, value: string) => {
    setNationPolicyValues((prev) => ({
      ...prev,
      [key]: value === '' ? '' : Number(value),
    }));
  };

  const handleComplexPolicyChange = (key: ComplexPolicyKey, value: string) => {
    setComplexPolicyJSON((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const parseComplexPolicy = (): Record<string, any> | null => {
    const payload: Record<string, any> = { ...nationPolicyValues };

    for (const [key, value] of Object.entries(payload)) {
      if (value === '') {
        payload[key] = 0;
      }
      if (typeof value === 'number' && Number.isNaN(value)) {
        payload[key] = 0;
      }
    }

    for (const key of COMPLEX_POLICY_KEYS) {
      const raw = complexPolicyJSON[key];
      if (!raw.trim()) {
        payload[key] = key === 'CombatForce' ? {} : [];
        continue;
      }
      try {
        const parsed = JSON.parse(raw);
        payload[key] = parsed;
      } catch (err) {
        showToast(`${key} 값이 올바른 JSON 형식이 아닙니다.`, 'error');
        return null;
      }
    }
    return payload;
  };

  const handleSaveNationPolicy = async () => {
    const payload = parseComplexPolicy();
    if (!payload) {
      return;
    }
    setSavingSection('nationPolicy');
    try {
      const result = await SammoAPI.SetNPCControl({
        type: 'nationPolicy',
        control: payload,
        serverID,
      });

      if (result.result) {
        showToast(result.message || '국가 정책을 저장했습니다.', 'success');
        await loadNPCData();
      } else {
        showToast(result.reason || '국가 정책 저장에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('국가 정책 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSavePriority = async (type: 'nationPriority' | 'generalPriority') => {
    const text = type === 'nationPriority' ? nationPriorityText : generalPriorityText;
    const priorityList = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (priorityList.length === 0) {
      showToast('최소 한 개 이상의 명령을 입력해야 합니다.', 'warning');
      return;
    }

    setSavingSection(type === 'nationPriority' ? 'nationPriority' : 'generalPriority');
    try {
      const result = await SammoAPI.SetNPCControl({
        type,
        control: priorityList,
        serverID,
      });

      if (result.result) {
        showToast(result.message || '우선순위를 저장했습니다.', 'success');
        await loadNPCData();
      } else {
        showToast(result.reason || '우선순위 저장에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('우선순위 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  const resetPolicyInputs = () => {
    if (!control?.nationPolicy) return;
    const values = control.nationPolicy.values || {};
    setNationPolicyValues(values);
    setComplexPolicyJSON({
      CombatForce: JSON.stringify(values.CombatForce ?? {}, null, 2),
      SupportForce: JSON.stringify(
        Array.isArray(values.SupportForce) ? values.SupportForce : [],
        null,
        2
      ),
      DevelopForce: JSON.stringify(
        Array.isArray(values.DevelopForce) ? values.DevelopForce : [],
        null,
        2
      ),
    });
  };

  const resetPriority = (type: 'nation' | 'general') => {
    if (type === 'nation') {
      setNationPriorityText((control?.nationPolicy?.priority || []).join('\n'));
    } else {
      setGeneralPriorityText((control?.generalPolicy?.priority || []).join('\n'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 lg:p-8 font-sans">
      <TopBackBar title="NPC 정책" reloadable onReload={loadNPCData} />
      
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : errorMessage ? (
        <div className="flex justify-center items-center h-[50vh] text-red-400">
           {errorMessage}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Nation Policy Values */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">국가 정책 값</h2>
                <p className="text-sm text-gray-400 mt-1">숫자 입력은 최소 0 이상으로 자동 정규화됩니다.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {numericPolicyEntries.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">{key}</label>
                  <input
                    type="number"
                    value={value ?? 0}
                    onChange={(e) => handlePolicyNumberChange(key, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors text-white"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {COMPLEX_POLICY_KEYS.map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">{key} (JSON)</label>
                  <textarea
                    rows={6}
                    value={complexPolicyJSON[key]}
                    onChange={(e) => handleComplexPolicyChange(key, e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors text-gray-300 resize-y"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
              <button 
                type="button" 
                onClick={resetPolicyInputs}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
              >
                되돌리기
              </button>
              <button
                type="button"
                onClick={handleSaveNationPolicy}
                disabled={savingSection === 'nationPolicy'}
                className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {savingSection === 'nationPolicy' ? '저장 중...' : '국가 정책 저장'}
              </button>
            </div>
          </div>

          {/* Nation Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
              <div className="mb-4 pb-2 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">국가 행동 우선순위</h2>
                <p className="text-sm text-gray-400 mt-1">각 줄에 하나의 명령을 입력하세요.</p>
              </div>
              <textarea
                rows={12}
                value={nationPriorityText}
                onChange={(e) => setNationPriorityText(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-green-500/50 transition-colors text-gray-300 resize-none"
              />
              <div className="flex gap-4 mt-4 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => resetPriority('nation')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  되돌리기
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePriority('nationPriority')}
                  disabled={savingSection === 'nationPriority'}
                  className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {savingSection === 'nationPriority' ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            {/* General Priority */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
              <div className="mb-4 pb-2 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">장수 행동 우선순위</h2>
                <p className="text-sm text-gray-400 mt-1">필수 명령(예: 출병, 일반내정)을 포함해야 합니다.</p>
              </div>
              <textarea
                rows={12}
                value={generalPriorityText}
                onChange={(e) => setGeneralPriorityText(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-purple-500/50 transition-colors text-gray-300 resize-none"
              />
              <div className="flex gap-4 mt-4 pt-2 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => resetPriority('general')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  되돌리기
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePriority('generalPriority')}
                  disabled={savingSection === 'generalPriority'}
                  className="ml-auto px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {savingSection === 'generalPriority' ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
