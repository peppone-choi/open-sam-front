'use client';

import { useState, useEffect } from 'react';
import { loghApi } from '@/lib/api/logh';
import { Handshake, AddressBookEntry } from '@/types/comm';

interface MessengerPanelProps {
  sessionId: string;
  characterId: string;
  characterName: string;
  onNewHandshake?: (count: number) => void;
}

export function MessengerPanel({
  sessionId,
  characterId,
  characterName,
  onNewHandshake,
}: MessengerPanelProps) {
  const [handshakes, setHandshakes] = useState<Handshake[]>([]);
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [showHandshakeModal, setShowHandshakeModal] = useState(false);
  const [targetCharacterId, setTargetCharacterId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [handshakesData, addressData] = await Promise.all([
        loghApi.getHandshakes(sessionId, characterId),
        loghApi.getAddressBook(sessionId, characterId),
      ]);
      setHandshakes(handshakesData);
      setAddressBook(addressData);

      // Notify parent of pending handshakes
      const pending = handshakesData.filter(
        (h) => h.status === 'pending' && h.targetCharacterId === characterId
      );
      onNewHandshake?.(pending.length);
    } catch (error: any) {
      console.error('Failed to load messenger data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId, characterId]);

  const handleRequestHandshake = async () => {
    if (!targetCharacterId.trim()) {
      alert('상대 캐릭터 ID를 입력해주세요.');
      return;
    }

    try {
      await loghApi.requestHandshake(sessionId, characterId, targetCharacterId);
      alert('명함 교환 요청을 보냈습니다.');
      setShowHandshakeModal(false);
      setTargetCharacterId('');
      loadData();
    } catch (error: any) {
      console.error('Failed to request handshake:', error);
      alert(`명함 교환 요청 실패: ${error.message}`);
    }
  };

  const handleRespondHandshake = async (handshakeId: string, action: 'accepted' | 'rejected') => {
    try {
      await loghApi.respondHandshake(sessionId, handshakeId, characterId, action);
      alert(action === 'accepted' ? '명함 교환을 승인했습니다.' : '명함 교환을 거절했습니다.');
      loadData();
    } catch (error: any) {
      console.error('Failed to respond to handshake:', error);
      alert(`명함 교환 응답 실패: ${error.message}`);
    }
  };

  const pendingReceived = handshakes.filter(
    (h) => h.status === 'pending' && h.targetCharacterId === characterId
  );
  const pendingSent = handshakes.filter(
    (h) => h.status === 'pending' && h.requesterCharacterId === characterId
  );

  return (
    <div className="flex flex-col h-full bg-[#050510] border border-[#333]">
      {/* Header */}
      <div className="p-3 border-b border-[#333] bg-[#101520] flex justify-between items-center">
        <h3 className="text-[#FFD700] font-bold">메신저 (명함 교환)</h3>
        <button
          onClick={() => setShowHandshakeModal(true)}
          className="px-3 py-1 text-sm border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20"
        >
          + 명함 교환 요청
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading ? (
          <div className="text-center text-[#666] py-8">로딩 중...</div>
        ) : (
          <>
            {/* Pending Received */}
            {pendingReceived.length > 0 && (
              <div className="border border-[#FFD700] bg-[#FFD700]/5 p-3 rounded">
                <h4 className="text-[#FFD700] font-bold mb-2 text-sm">
                  받은 명함 교환 요청 ({pendingReceived.length})
                </h4>
                <div className="space-y-2">
                  {pendingReceived.map((h) => (
                    <div
                      key={h.handshakeId}
                      className="bg-[#101520] p-2 rounded flex justify-between items-center"
                    >
                      <div>
                        <div className="text-[#E0E0E0] font-bold">{h.requesterName}</div>
                        <div className="text-xs text-[#666]">
                          {new Date(h.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondHandshake(h.handshakeId, 'accepted')}
                          className="px-3 py-1 text-xs border border-[#10B981] text-[#10B981] hover:bg-[#10B981]/20"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleRespondHandshake(h.handshakeId, 'rejected')}
                          className="px-3 py-1 text-xs border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/20"
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Sent */}
            {pendingSent.length > 0 && (
              <div className="border border-[#1E90FF] bg-[#1E90FF]/5 p-3 rounded">
                <h4 className="text-[#1E90FF] font-bold mb-2 text-sm">
                  보낸 명함 교환 요청 ({pendingSent.length})
                </h4>
                <div className="space-y-2">
                  {pendingSent.map((h) => (
                    <div key={h.handshakeId} className="bg-[#101520] p-2 rounded">
                      <div className="text-[#E0E0E0] font-bold">{h.targetName}</div>
                      <div className="text-xs text-[#666]">
                        대기 중 - {new Date(h.createdAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address Book */}
            <div className="border border-[#333] p-3 rounded">
              <h4 className="text-[#9CA3AF] font-bold mb-2 text-sm">
                주소록 ({addressBook.length}/100)
              </h4>
              {addressBook.length === 0 ? (
                <div className="text-center text-[#666] py-4 text-sm">
                  아직 주소록이 비어있습니다.
                  <br />
                  명함 교환을 통해 연락처를 추가하세요.
                </div>
              ) : (
                <div className="space-y-1">
                  {addressBook.map((entry) => (
                    <div
                      key={entry.entryId}
                      className="bg-[#101520] p-2 rounded hover:bg-[#1E90FF]/10 cursor-pointer"
                    >
                      <div className="text-[#E0E0E0] text-sm">{entry.contactName}</div>
                      <div className="text-xs text-[#666]">ID: {entry.contactCharacterId}</div>
                    </div>
                  ))}
                </div>
              )}
              {addressBook.length >= 90 && (
                <div className="mt-2 text-xs text-[#FFD700] border border-[#FFD700] p-2 rounded bg-[#FFD700]/5">
                  ⚠️ 주소록이 거의 가득 찼습니다. (최대 100개)
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Handshake Request Modal */}
      {showHandshakeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#101520] border border-[#1E90FF] p-6 rounded-lg w-96">
            <h3 className="text-[#1E90FF] font-bold mb-4">명함 교환 요청</h3>
            <p className="text-[#9CA3AF] text-sm mb-4">
              상대방이 승인하면 서로의 주소록에 자동으로 추가됩니다.
            </p>
            <div className="mb-4">
              <label className="block text-[#9CA3AF] text-sm mb-2">상대 캐릭터 ID</label>
              <input
                type="text"
                value={targetCharacterId}
                onChange={(e) => setTargetCharacterId(e.target.value)}
                placeholder="캐릭터 ID 입력"
                className="w-full px-3 py-2 bg-[#050510] border border-[#333] text-[#E0E0E0] focus:outline-none focus:border-[#1E90FF]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowHandshakeModal(false);
                  setTargetCharacterId('');
                }}
                className="px-4 py-2 border border-[#666] text-[#9CA3AF] hover:bg-[#666]/20"
              >
                취소
              </button>
              <button
                onClick={handleRequestHandshake}
                className="px-4 py-2 border border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/20"
              >
                요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
