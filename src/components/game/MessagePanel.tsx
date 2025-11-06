'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { useToast } from '@/contexts/ToastContext';
import styles from './MessagePanel.module.css';

interface MessagePanelProps {
  generalID: number;
  generalName: string;
  nationID: number;
  permissionLevel: number;
  serverID?: string;
}

interface Message {
  id: number;
  type: string;
  src_general_id?: number;
  src_general_name?: string;
  src_nation_id?: number;
  src_nation_name?: string;
  dest_general_id?: number;
  dest_general_name?: string;
  dest_nation_id?: number;
  dest_nation_name?: string;
  text: string;
  date: string;
}

type MessageType = 'public' | 'national' | 'private' | 'diplomacy';

interface Contact {
  mailbox: number;
  name: string;
  color: number;
  general: Array<[number, string, number]>;
}

export default function MessagePanel({
  generalID,
  generalName,
  nationID,
  permissionLevel,
  serverID,
}: MessagePanelProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<MessageType>('public');
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
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    loadMessages(true);
  }, [activeTab, generalID, serverID]);

  useEffect(() => {
    if (showSendForm) {
      loadContacts();
    }
  }, [showSendForm]);

  async function loadMessages(reset: boolean = false) {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const limit = 15;

      const result = await SammoAPI.MessageGetMessages({
        serverID,
        type: activeTab,
        limit,
        offset: currentOffset,
      });

      if (result.success && result.messages) {
        if (reset) {
          setMessages(result.messages);
        } else {
          setMessages(prev => [...prev, ...result.messages]);
        }
        
        setHasMore(result.hasMore ?? result.messages.length >= limit);
        setOffset(currentOffset + result.messages.length);
      } else {
        setError(result.message || '메시지를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError('메시지를 불러오는데 실패했습니다.');
      if (reset) {
        setMessages([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadMessages(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (scrollHeight - scrollTop <= clientHeight + 50) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

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

  const formatMessageText = (msg: Message): string => {
    let sender = '';
    if (msg.src_general_name) {
      sender = msg.src_general_name;
      if (msg.src_nation_name) {
        sender += `(${msg.src_nation_name})`;
      }
    } else if (msg.src_nation_name) {
      sender = msg.src_nation_name;
    } else {
      sender = '알 수 없음';
    }

    return `【${sender}】${msg.text}`;
  };

  return (
    <div className={styles.messagePanel}>
      <div className={styles.messagePanelHeader}>
        <div
          className={`${styles.boardHeader} ${activeTab === 'public' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('public');
            setShowSendForm(false);
          }}
        >
          전체
        </div>
        <div
          className={`${styles.boardHeader} ${activeTab === 'national' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('national');
            setShowSendForm(false);
          }}
        >
          국가
        </div>
        <div
          className={`${styles.boardHeader} ${activeTab === 'private' ? styles.active : ''}`}
          onClick={() => {
            setActiveTab('private');
            setShowSendForm(false);
          }}
        >
          개인
        </div>
        {permissionLevel >= 1 && (
          <div
            className={`${styles.boardHeader} ${activeTab === 'diplomacy' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('diplomacy');
              setShowSendForm(false);
            }}
          >
            외교
          </div>
        )}
      </div>
      <div className={styles.messagePanelBody}>
        {showSendForm ? (
          <div className={styles.sendForm}>
            <div className={styles.sendFormHeader}>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowSendForm(false);
                  setSendText('');
                  setSendError(null);
                  setSelectedMailbox(0);
                  setSelectedGeneralId(0);
                }}
              >
                ✕
              </button>
              <h3>메시지 전송</h3>
            </div>
            {(activeTab === 'diplomacy' || activeTab === 'private') && (
              <div className={styles.sendFormSelect}>
                {activeTab === 'diplomacy' ? (
                  <select
                    value={selectedMailbox}
                    onChange={(e) => setSelectedMailbox(Number(e.target.value))}
                    className={styles.selectBox}
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
            />
            {sendError && (
              <div className={styles.sendError}>{sendError}</div>
            )}
            <div className={styles.sendFormActions}>
              <button
                onClick={handleSendMessage}
                disabled={sendLoading}
                className={styles.sendButton}
              >
                {sendLoading ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.messageListHeader}>
              <button
                className={styles.sendMessageButton}
                onClick={() => setShowSendForm(true)}
              >
                메시지 작성
              </button>
            </div>
            {loading ? (
              <div className={styles.messagePlaceholder}>로딩 중...</div>
            ) : error ? (
              <div className={styles.messagePlaceholder} style={{ color: 'red' }}>
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.messagePlaceholder}>메시지가 없습니다.</div>
            ) : (
              <div 
                className={styles.messageList} 
                ref={messageListRef}
                onScroll={handleScroll}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={styles.messageItem}>
                    <div className={styles.messageDate}>
                      {msg.date ? new Date(msg.date).toLocaleString('ko-KR') : ''}
                    </div>
                    <div className={styles.messageText}>{formatMessageText(msg)}</div>
                  </div>
                ))}
                {hasMore && (
                  <div className={styles.loadMoreContainer}>
                    <button
                      className={styles.loadMoreButton}
                      onClick={handleLoadMore}
                      disabled={loadingMore}
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
