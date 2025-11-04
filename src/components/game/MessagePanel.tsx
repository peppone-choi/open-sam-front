'use client';

import React, { useState, useEffect } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
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

export default function MessagePanel({
  generalID,
  generalName,
  nationID,
  permissionLevel,
  serverID,
}: MessagePanelProps) {
  const [activeTab, setActiveTab] = useState<MessageType>('public');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [activeTab, generalID, serverID]);

  async function loadMessages() {
    try {
      setLoading(true);
      setError(null);

      // GetRecentMessage API 호출
      const result = await SammoAPI.GetRecentMessage({
        serverID,
        type: activeTab,
        limit: 15,
      });

      if (result.success && result.messages) {
        setMessages(result.messages);
      } else {
        setError(result.message || '메시지를 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError('메시지를 불러오는데 실패했습니다.');
      setMessages([]);
    } finally {
      setLoading(false);
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
          onClick={() => setActiveTab('public')}
        >
          전체
        </div>
        <div
          className={`${styles.boardHeader} ${activeTab === 'national' ? styles.active : ''}`}
          onClick={() => setActiveTab('national')}
        >
          국가
        </div>
        <div
          className={`${styles.boardHeader} ${activeTab === 'private' ? styles.active : ''}`}
          onClick={() => setActiveTab('private')}
        >
          개인
        </div>
        {permissionLevel >= 1 && (
          <div
            className={`${styles.boardHeader} ${activeTab === 'diplomacy' ? styles.active : ''}`}
            onClick={() => setActiveTab('diplomacy')}
          >
            외교
          </div>
        )}
      </div>
      <div className={styles.messagePanelBody}>
        {loading ? (
          <div className={styles.messagePlaceholder}>로딩 중...</div>
        ) : error ? (
          <div className={styles.messagePlaceholder} style={{ color: 'red' }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.messagePlaceholder}>메시지가 없습니다.</div>
        ) : (
          <div className={styles.messageList}>
            {messages.map((msg) => (
              <div key={msg.id} className={styles.messageItem}>
                <div className={styles.messageDate}>
                  {msg.date ? new Date(msg.date).toLocaleString('ko-KR') : ''}
                </div>
                <div className={styles.messageText}>{formatMessageText(msg)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
