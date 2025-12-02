'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { useToast } from '@/contexts/ToastContext';
import { useSocket } from '@/hooks/useSocket';
import styles from './MessagePanel.module.css';

import type { ColorSystem } from '@/types/colorSystem';

interface MessagePanelProps {
  generalID: number;
  generalName: string;
  nationID: number;
  permissionLevel: number;
  serverID?: string;
  nationColor?: string;
  colorSystem?: ColorSystem;
}

interface Message {
  id: number;
  type: string;
  src_general_id?: number;
  src_general_name?: string;
  src_general_picture?: string;
  src_general_imgsvr?: number;
  src_nation_id?: number;
  src_nation_name?: string;
  dest_general_id?: number;
  dest_general_name?: string;
  dest_nation_id?: number;
  dest_nation_name?: string;
  text: string;
  date: string;
  read?: boolean;
}

type MessageType = 'system' | 'public' | 'national' | 'private' | 'diplomacy';

interface Contact {
  mailbox: number;
  name: string;
  color: number;
  general: Array<[number, string, number]>;
}

// 아이콘 경로 가져오기
function getIconPath(imgsvr: number, picture: string): string {
  if (!picture) return '';
  // 실제 이미지 서버 경로 구성
  // imgsvr이 있으면 해당 서버 사용, 없으면 기본 경로
  if (imgsvr && imgsvr > 0) {
    return `/api/general/icon/${imgsvr}/${picture}`;
  }
  return `/image/general/${picture}.png`;
}

export default function MessagePanel({
  generalID,
  generalName,
  nationID,
  permissionLevel,
  serverID,
  nationColor,
  colorSystem,
}: MessagePanelProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<MessageType>('system');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendText, setSendText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<number>(0);
  const [selectedGeneralId, setSelectedGeneralId] = useState<number>(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState<Record<MessageType, number>>({
    system: 0,
    public: 0,
    national: 0,
    private: 0,
    diplomacy: 0,
  });
  const [lastReadMsgId, setLastReadMsgId] = useState<Record<string, number>>({
    private: 0,
    diplomacy: 0,
  });
  const messageListRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  // 자동 갱신 설정 (Vue와 동일한 2.5초 간격 체크, 5초 실제 갱신)
  const AUTO_REFRESH_INTERVAL = 2500;
  const MIN_REFRESH_GAP = 5000;

  // Socket.io 연결 (실시간 메시지 수신)
  const socketOptions = useMemo(() => ({ 
    sessionId: serverID, 
    autoConnect: !!serverID 
  }), [serverID]);
  const { socket, isConnected, subscribe } = useSocket(socketOptions);

  // nationID 변경 시 재야인데 국가/외교 탭이면 전체 탭으로 전환
  useEffect(() => {
    if (nationID === 0 && (activeTab === 'national' || activeTab === 'diplomacy')) {
      setActiveTab('public');
    }
  }, [nationID]);

  // 자동 갱신 타이머 설정
  useEffect(() => {
    const startAutoRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastRefreshRef.current >= MIN_REFRESH_GAP) {
          loadMessages(true, true); // silent refresh
        }
      }, AUTO_REFRESH_INTERVAL);
    };

    startAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [activeTab, generalID, serverID]);

  useEffect(() => {
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    loadMessages(true);
  }, [activeTab, generalID, serverID]);

  // Socket.io 실시간 메시지 수신
  useEffect(() => {
    if (!socket || !isConnected) return;

    // 새 메시지 이벤트 핸들러
    const handleNewMessage = (data: {
      messageId?: number;
      id?: number;
      type?: string;
      channelType?: string;
      text?: string;
      message?: string;
      senderName?: string;
      src_general_name?: string;
      src_nation_name?: string;
      date?: string;
      [key: string]: any;
    }) => {
      // 현재 탭과 메시지 타입이 일치하는지 확인
      const msgType = data.type || data.channelType || 'public';
      const shouldShow = activeTab === msgType || 
        (activeTab === 'public' && msgType === 'all') ||
        (activeTab === 'system' && msgType === 'system');

      if (!shouldShow) return;

      // 새 메시지 객체 생성
      const newMessage: Message = {
        id: data.messageId || data.id || Date.now(),
        type: msgType,
        src_general_name: data.senderName || data.src_general_name,
        src_nation_name: data.src_nation_name,
        text: data.text || data.message || '',
        date: data.date || new Date().toISOString(),
        ...data
      };

      // 중복 체크 후 메시지 추가
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;
        return [newMessage, ...prev];
      });

      // 새 메시지 알림
      const senderInfo = newMessage.src_general_name || newMessage.src_nation_name || '알 수 없음';
      showToast(`새 메시지: ${senderInfo}`, 'info');
    };

    // 이벤트 구독
    const unsubscribe = subscribe('message:new', handleNewMessage);
    
    // 외교 메시지 이벤트도 구독
    const unsubscribeDiplomacy = subscribe('nation:diplomacy', (data: any) => {
      if (activeTab === 'diplomacy') {
        handleNewMessage({ ...data, type: 'diplomacy' });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeDiplomacy();
    };
  }, [socket, isConnected, activeTab, subscribe, showToast]);

  useEffect(() => {
    if (showSendForm) {
      loadContacts();
    }
  }, [showSendForm]);

  async function loadMessages(reset: boolean = false, silent: boolean = false) {
    try {
      if (reset && !silent) {
        setLoading(true);
        setOffset(0);
      } else if (!reset) {
        setLoadingMore(true);
      }
      if (!silent) {
        setError(null);
      }
      
      // 자동 갱신 시간 기록
      lastRefreshRef.current = Date.now();

      const currentOffset = reset ? 0 : offset;
      const limit = 15;

      const result = await SammoAPI.MessageGetMessages({
        serverID,
        general_id: generalID,
        type: activeTab,
        limit,
        offset: currentOffset,
      });

      if (result.success && result.messages) {
        if (reset) {
          // silent refresh일 때 새 메시지만 추가 (기존 메시지 유지하며 중복 제거)
          if (silent && messages.length > 0) {
            const existingIds = new Set(messages.map(m => m.id));
            const newMessages = result.messages.filter(m => !existingIds.has(m.id));
            if (newMessages.length > 0) {
              setMessages(prev => [...newMessages, ...prev]);
              // 새 메시지 알림 (Toast)
              showToast(`새 메시지 ${newMessages.length}개`, 'info');
            }
          } else {
            setMessages(result.messages || []);
          }
        } else {
          setMessages(prev => [...prev, ...(result.messages || [])]);
        }
        
        if (!silent) {
          setHasMore(result.hasMore ?? (result.messages?.length || 0) >= limit);
          setOffset(currentOffset + result.messages.length);
        }
      } else if (!silent) {
        setError(result.message || '메시지를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      if (!silent) {
        setError('메시지를 불러오는데 실패했습니다.');
        if (reset) {
          setMessages([]);
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setLoadingMore(false);
    }
  }

  // 메시지 읽음 표시 API 호출
  async function markMessagesAsRead(type: 'private' | 'diplomacy', msgId: number) {
    if (!serverID || msgId <= lastReadMsgId[type]) return;
    
    try {
      const result = await SammoAPI.ReadLatestMessage({
        type,
        msgID: msgId,
        serverID,
      });
      
      if (result.result) {
        setLastReadMsgId(prev => ({
          ...prev,
          [type]: Math.max(prev[type], msgId)
        }));
        
        // 읽음 처리된 메시지 업데이트
        setMessages(prev => prev.map(m => 
          m.id <= msgId ? { ...m, read: true } : m
        ));
        
        // 읽지 않은 메시지 수 업데이트
        setUnreadCount(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1)
        }));
      }
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }

  // 탭 전환 시 읽음 처리
  useEffect(() => {
    if ((activeTab === 'private' || activeTab === 'diplomacy') && messages.length > 0) {
      const latestMsg = messages[0];
      if (latestMsg && !latestMsg.read) {
        markMessagesAsRead(activeTab, latestMsg.id);
      }
    }
  }, [activeTab, messages]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMessages(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (scrollHeight - scrollTop <= clientHeight + 50) {
      handleLoadMore();
    }
  };

  async function loadContacts() {
    try {
      const result = await SammoAPI.GetContactList({ serverID });
      if (result.success && result.nation) {
        setContacts(result.nation);
      }
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
    }
  }

  async function handleSendMessage() {
    if (!sendText.trim()) {
      setSendError('메시지 내용을 입력하세요.');
      return;
    }

    try {
      setSendLoading(true);
      setSendError(null);

      let mailbox = 0;
      
      if (activeTab === 'public') {
        mailbox = 0;
      } else if (activeTab === 'national') {
        mailbox = 1000000 + nationID;
      } else if (activeTab === 'diplomacy') {
        if (selectedMailbox < 1000000) {
          setSendError('대상 국가를 선택하세요.');
          setSendLoading(false);
          return;
        }
        mailbox = selectedMailbox;
      } else if (activeTab === 'private') {
        if (selectedGeneralId <= 0) {
          setSendError('대상 장수를 선택하세요.');
          setSendLoading(false);
          return;
        }
        mailbox = selectedGeneralId;
      }

      const result = await SammoAPI.MessageSendMessage({
        serverID,
        general_id: generalID,
        mailbox,
        to_general_id: activeTab === 'private' ? selectedGeneralId : undefined,
        text: sendText,
        type: activeTab,
      });

      if (result.success && result.result) {
        setSendText('');
        setShowSendForm(false);
        setSelectedMailbox(0);
        setSelectedGeneralId(0);
        showToast('메시지를 전송했습니다.', 'success');
        await loadMessages(true);
      } else {
        const errorMsg = result.reason || result.message || '메시지 전송에 실패했습니다.';
        setSendError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setSendError('메시지 전송에 실패했습니다.');
      showToast('메시지 전송에 실패했습니다.', 'error');
    } finally {
      setSendLoading(false);
    }
  }

  const formatSenderName = (msg: Message): string => {
    let sender = '';
    if (msg.src_general_name) {
      sender = msg.src_general_name;
      if (msg.src_nation_name) {
        sender += ` (${msg.src_nation_name})`;
      }
    } else if (msg.src_nation_name) {
      sender = msg.src_nation_name;
    } else {
      sender = '알 수 없음';
    }
    return sender;
  };

  return (
    <div 
      className={styles.messagePanel}
      style={{
        borderColor: colorSystem?.border || '#444',
        backgroundColor: colorSystem?.pageBg,
      }}
    >
      <div className={styles.messagePanelHeader}>
        <div
          className={`${styles.boardHeader} ${styles.systemTab} ${activeTab === 'system' ? styles.active : ''}`}
          style={{
            backgroundColor: activeTab === 'system' ? colorSystem?.error : colorSystem?.buttonBg,
            color: activeTab === 'system' ? '#fff' : colorSystem?.buttonText,
          }}
          onClick={() => {
            setActiveTab('system');
            setShowSendForm(false);
          }}
        >
          🔔 시스템
        </div>
        <div
          className={`${styles.boardHeader} ${activeTab === 'public' ? styles.active : ''}`}
          style={{
            backgroundColor: activeTab === 'public' ? colorSystem?.buttonHover : colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
          }}
          onClick={() => {
            setActiveTab('public');
            setShowSendForm(false);
          }}
        >
          전체
        </div>
        {nationID !== 0 && (
          <div
            className={`${styles.boardHeader} ${activeTab === 'national' ? styles.active : ''}`}
            style={{
              backgroundColor: activeTab === 'national' ? colorSystem?.buttonHover : colorSystem?.buttonBg,
              color: colorSystem?.buttonText,
            }}
            onClick={() => {
              setActiveTab('national');
              setShowSendForm(false);
            }}
          >
            국가
          </div>
        )}
        <div
          className={`${styles.boardHeader} ${activeTab === 'private' ? styles.active : ''}`}
          style={{
            backgroundColor: activeTab === 'private' ? colorSystem?.buttonHover : colorSystem?.buttonBg,
            color: colorSystem?.buttonText,
            position: 'relative',
          }}
          onClick={() => {
            setActiveTab('private');
            setShowSendForm(false);
          }}
        >
          개인
          {unreadCount.private > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: colorSystem?.error || '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 5px',
              borderRadius: '9999px',
              minWidth: '16px',
              textAlign: 'center',
            }}>
              {unreadCount.private > 99 ? '99+' : unreadCount.private}
            </span>
          )}
        </div>
        {nationID !== 0 && permissionLevel >= 1 && (
          <div
            className={`${styles.boardHeader} ${activeTab === 'diplomacy' ? styles.active : ''}`}
            style={{
              backgroundColor: activeTab === 'diplomacy' ? colorSystem?.buttonHover : colorSystem?.buttonBg,
              color: colorSystem?.buttonText,
              position: 'relative',
            }}
            onClick={() => {
              setActiveTab('diplomacy');
              setShowSendForm(false);
            }}
          >
            외교
            {unreadCount.diplomacy > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: colorSystem?.error || '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 5px',
                borderRadius: '9999px',
                minWidth: '16px',
                textAlign: 'center',
              }}>
                {unreadCount.diplomacy > 99 ? '99+' : unreadCount.diplomacy}
              </span>
            )}
          </div>
        )}
      </div>
      <div className={styles.messagePanelBody}>
        {showSendForm ? (
          <div className={styles.sendForm} style={{ backgroundColor: colorSystem?.pageBg }}>
            <div className={styles.sendFormHeader} style={{ borderColor: colorSystem?.border }}>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowSendForm(false);
                  setSendText('');
                  setSendError(null);
                  setSelectedMailbox(0);
                  setSelectedGeneralId(0);
                }}
                style={{ color: colorSystem?.text }}
              >
                ✕
              </button>
              <h3 style={{ color: colorSystem?.text }}>메시지 전송</h3>
            </div>
            {(activeTab === 'diplomacy' || activeTab === 'private') && (
              <div className={styles.sendFormSelect}>
                {activeTab === 'diplomacy' ? (
                  <select
                    value={selectedMailbox}
                    onChange={(e) => setSelectedMailbox(Number(e.target.value))}
                    className={styles.selectBox}
                    style={{
                      backgroundColor: colorSystem?.buttonBg,
                      color: colorSystem?.buttonText,
                      borderColor: colorSystem?.border,
                    }}
                  >
                    <option value={0}>대상 국가 선택</option>
                    {contacts
                      .filter((c) => c.mailbox >= 1000000 && c.mailbox - 1000000 !== nationID)
                      .map((contact) => (
                        <option key={contact.mailbox} value={contact.mailbox}>
                          {contact.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    value={selectedGeneralId}
                    onChange={(e) => setSelectedGeneralId(Number(e.target.value))}
                    className={styles.selectBox}
                    style={{
                      backgroundColor: colorSystem?.buttonBg,
                      color: colorSystem?.buttonText,
                      borderColor: colorSystem?.border,
                    }}
                  >
                    <option value={0}>대상 장수 선택</option>
                    {contacts.map((contact) =>
                      contact.general
                        .filter(([genId]) => genId !== generalID)
                        .map(([genId, genName]) => (
                          <option key={genId} value={genId}>
                            {contact.name !== '재야' ? `${contact.name} - ` : ''}
                            {genName}
                          </option>
                        ))
                    )}
                  </select>
                )}
              </div>
            )}
            <textarea
              value={sendText}
              onChange={(e) => setSendText(e.target.value)}
              placeholder="메시지 내용을 입력하세요..."
              className={styles.sendTextarea}
              rows={5}
              style={{
                backgroundColor: colorSystem?.buttonBg,
                color: colorSystem?.buttonText,
                borderColor: colorSystem?.border,
              }}
            />
            {sendError && (
              <div className={styles.sendError}>{sendError}</div>
            )}
            <div className={styles.sendFormActions}>
              <button
                onClick={handleSendMessage}
                disabled={sendLoading}
                className={styles.sendButton}
                style={{
                  backgroundColor: colorSystem?.buttonBg,
                  color: colorSystem?.buttonText,
                  borderColor: colorSystem?.border,
                }}
              >
                {sendLoading ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab !== 'system' && (
              <div className={styles.messageListHeader}>
                <button
                  className={styles.sendMessageButton}
                  style={{ 
                    backgroundColor: colorSystem?.buttonBg,
                    color: colorSystem?.text,
                  }}
                  onClick={() => setShowSendForm(true)}
                >
                  메시지 작성
                </button>
              </div>
            )}
            {loading ? (
              <div className={styles.messagePlaceholder} style={{ color: colorSystem?.textMuted }}>로딩 중...</div>
            ) : error ? (
              <div className={styles.messagePlaceholder} style={{ color: colorSystem?.error }}>
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.messagePlaceholder} style={{ color: colorSystem?.textMuted }}>메시지가 없습니다.</div>
            ) : (
              <div 
                className={styles.messageList} 
                ref={messageListRef}
                onScroll={handleScroll}
              >
                {messages.map((msg) => {
                  const messageClass = `${styles.messageItem} ${
                    msg.type === 'system' ? styles.systemMessage :
                    msg.type === 'diplomacy' ? styles.diplomacyMessage :
                    msg.type === 'national' ? styles.nationalMessage :
                    msg.type === 'private' ? styles.privateMessage :
                    styles.publicMessage
                  }`;
                  const isUnread = !msg.read && (msg.type === 'private' || msg.type === 'diplomacy');
                  return (
                    <div 
                      key={msg.id} 
                      style={{
                        backgroundColor: isUnread ? 'rgba(59, 130, 246, 0.1)' : colorSystem?.pageBg,
                        border: '1px solid ' + (isUnread ? 'rgba(59, 130, 246, 0.3)' : (colorSystem?.borderLight || '#444')),
                        borderLeft: '3px solid ' + (
                          msg.type === 'system' ? colorSystem?.error : 
                          msg.type === 'national' ? colorSystem?.success : 
                          msg.type === 'diplomacy' ? colorSystem?.special :
                          isUnread ? '#3b82f6' :
                          colorSystem?.border
                        ),
                        borderRadius: '4px',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        position: 'relative',
                      }}
                    >
                      {isUnread && (
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%',
                        }} title="읽지 않음" />
                      )}
                      <div 
                        className={messageClass}
                        style={{
                          color: colorSystem?.text,
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        {msg.src_general_id && (
                          <div style={{ 
                            width: '46.8px', 
                            height: '63px', 
                            flexShrink: 0,
                            backgroundColor: '#1a1a1a',
                            border: '1px solid ' + (colorSystem?.border || '#666'),
                            borderRadius: '2px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img
                              src={msg.src_general_picture ? getIconPath(msg.src_general_imgsvr || 0, msg.src_general_picture) : '/default_portrait.png'}
                              alt={msg.src_general_name || '장수'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default_portrait.png';
                              }}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                            gap: '0.5rem',
                          }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: colorSystem?.buttonText,
                              fontSize: '0.875rem',
                              backgroundColor: colorSystem?.buttonBg,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '3px',
                            }}>
                              {formatSenderName(msg)}
                            </div>
                            <div className={styles.messageDate} style={{ 
                              color: colorSystem?.textDim,
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                            }}>
                              {msg.date ? new Date(msg.date).toLocaleString('ko-KR') : ''}
                            </div>
                          </div>
                          <div 
                            className={styles.messageText} 
                            style={{ 
                              color: colorSystem?.text,
                              backgroundColor: 'transparent',
                              border: '1px solid ' + (colorSystem?.borderLight || '#444'),
                              padding: '0.5rem',
                              borderRadius: '4px',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              minHeight: 'auto',
                              maxHeight: 'none',
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className={styles.loadMoreContainer}>
                    <button
                      className={styles.loadMoreButton}
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      style={{
                        backgroundColor: colorSystem?.buttonBg,
                        color: colorSystem?.buttonText,
                        borderColor: colorSystem?.border,
                      }}
                    >
                      {loadingMore ? '로딩 중...' : '더보기'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
