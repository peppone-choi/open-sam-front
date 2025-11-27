'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isBrightColor } from '@/utils/isBrightColor';

/**
 * 텍스트 내 URL을 링크로 변환 (linkify-string 대체)
 */
function linkifyStr(text: string, options?: { target?: string }): string {
  const urlPattern = /(https?:\/\/[^\s<]+)/gi;
  const target = options?.target ? ` target="${options.target}"` : '';
  return text.replace(urlPattern, `<a href="$1"${target} rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>`);
}

/** 메시지 타입 */
export type MsgType = 'public' | 'national' | 'private' | 'diplomacy';

/** 메시지 대상 정보 */
export interface MsgTarget {
  id: number;
  name: string;
  nation: string;
  nation_id: number;
  color: string;
  icon?: string;
}

/** 메시지 옵션 */
export interface MsgOption {
  hide?: boolean;
  invalid?: boolean;
  delete?: number;
  overwrite?: number[];
  deletable?: boolean;
  action?: string;
}

/** 메시지 아이템 */
export interface MsgItem {
  id: number;
  msgType: MsgType;
  src: MsgTarget;
  dest?: MsgTarget;
  text: string;
  time: string;
  option: MsgOption;
}

interface MessagePlateProps {
  message: MsgItem;
  generalID: number;
  generalName: string;
  nationID: number;
  permissionLevel: number;
  deleted?: boolean;
  onSetTarget?: (type: MsgType, target: MsgTarget) => void;
  onRequestRefresh?: () => void;
  onDelete?: (msgId: number) => Promise<void>;
  onAccept?: (msgId: number) => Promise<void>;
  onDecline?: (msgId: number) => Promise<void>;
}

const DEFAULT_ICON = '/image/default.jpg';

/**
 * MessagePlate - 개별 메시지 표시 컴포넌트
 * Vue의 MessagePlate.vue와 동등한 기능 제공
 */
export default function MessagePlate({
  message,
  generalID,
  generalName,
  nationID,
  permissionLevel,
  deleted = false,
  onSetTarget,
  onRequestRefresh,
  onDelete,
  onAccept,
  onDecline,
}: MessagePlateProps) {
  const [isValidMsg, setIsValidMsg] = useState(true);
  const [isDeletable, setIsDeletable] = useState(false);

  const src = message.src;
  const dest = message.dest ?? {
    id: 0,
    name: '',
    nation: '재야',
    nation_id: 0,
    color: '#000000',
    icon: DEFAULT_ICON,
  };

  const srcColorType = isBrightColor(src.color) ? 'bright' : 'dark';
  const destColorType = isBrightColor(dest.color) ? 'bright' : 'dark';

  // 국가 타입 결정 (배경색용)
  const nationType = useMemo(() => {
    if (src.nation_id === dest.nation_id) return 'local';
    if (src.nation_id === nationID) return 'src';
    return 'dest';
  }, [src.nation_id, dest.nation_id, nationID]);

  // 메시지 유효성 검사
  const testValidMsg = useCallback(() => {
    if (deleted) return false;
    if (message.option.invalid) return false;
    return true;
  }, [deleted, message.option.invalid]);

  // 삭제 가능 여부 검사
  const testDeletable = useCallback(() => {
    if (deleted) return false;
    if (message.option.action) return false;
    if (src.id !== generalID) return false;
    if (message.option.invalid) return false;
    if (!(message.option.deletable ?? true)) return false;

    // 5분 이내만 삭제 가능
    const msgTime = new Date(message.time.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - msgTime.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;

    return diffMs < fiveMinutesMs;
  }, [deleted, message, src.id, generalID]);

  useEffect(() => {
    setIsValidMsg(testValidMsg());
    setIsDeletable(testDeletable());

    // 삭제 가능 시간 타이머
    if (testDeletable()) {
      const msgTime = new Date(message.time.replace(' ', 'T'));
      const fiveMinutesFromMsg = new Date(msgTime.getTime() + 5 * 60 * 1000);
      const now = new Date();
      const remainingMs = fiveMinutesFromMsg.getTime() - now.getTime();

      if (remainingMs > 0) {
        const timer = setTimeout(() => {
          setIsDeletable(false);
        }, remainingMs);
        return () => clearTimeout(timer);
      }
    }
  }, [message, deleted, testValidMsg, testDeletable]);

  // 버튼 활성화 여부
  const allowButton = useMemo(() => {
    if (message.msgType !== 'diplomacy') return true;
    if (permissionLevel >= 4) return true;
    return false;
  }, [message.msgType, permissionLevel]);

  // 이벤트 핸들러
  const handleSetTarget = (target: MsgTarget) => {
    onSetTarget?.(message.msgType, target);
  };

  const handleDelete = async () => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await onDelete?.(message.id);
      onRequestRefresh?.();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleAccept = async () => {
    if (!confirm('수락하시겠습니까?')) return;
    try {
      await onAccept?.(message.id);
      onRequestRefresh?.();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDecline = async () => {
    if (!confirm('거절하시겠습니까?')) return;
    try {
      await onDecline?.(message.id);
      onRequestRefresh?.();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  // 메시지 타입별 배경색
  const getBgColor = () => {
    const colors: Record<MsgType, Record<string, string>> = {
      private: { local: '#5d1e1a', src: '#5d1e1a', dest: '#5d461a' },
      public: { local: '#141c65', src: '#141c65', dest: '#141c65' },
      national: { local: '#00582c', src: '#70153b', dest: '#704615' },
      diplomacy: { local: '#00582c', src: '#70153b', dest: '#704615' },
    };
    return colors[message.msgType]?.[nationType] || '#141c65';
  };

  // 헤더 렌더링
  const renderHeader = () => {
    const { msgType } = message;

    // 개인 메시지
    if (msgType === 'private') {
      if (src.name === generalName) {
        return (
          <>
            <span className={`msg-target msg-${srcColorType}`} style={{ backgroundColor: src.color }}>나</span>
            <span className="msg-from-to">▶</span>
            <span
              role="button"
              className={`msg-target msg-${destColorType} cursor-pointer hover:opacity-80`}
              style={{ backgroundColor: dest.color }}
              onClick={() => handleSetTarget(dest)}
            >
              {dest.name}:{dest.nation} | ↩
            </span>
          </>
        );
      }
      return (
        <>
          <span
            role="button"
            className={`msg-target msg-${srcColorType} cursor-pointer hover:opacity-80`}
            style={{ backgroundColor: src.color }}
            onClick={() => handleSetTarget(src)}
          >
            {src.name}:{src.nation} | ↩
          </span>
          <span className="msg-from-to">▶</span>
          <span className={`msg-target msg-${destColorType}`} style={{ backgroundColor: dest.color }}>나</span>
        </>
      );
    }

    // 국가/외교 메시지 (같은 국가)
    if ((msgType === 'national' || msgType === 'diplomacy') && src.nation_id === dest.nation_id) {
      return (
        <span className={`msg-target msg-${srcColorType}`} style={{ backgroundColor: src.color }}>
          {src.name}
        </span>
      );
    }

    // 국가/외교 메시지 (수뇌부)
    if ((msgType === 'national' || msgType === 'diplomacy') && permissionLevel >= 4) {
      if (src.nation_id === nationID) {
        return (
          <>
            <span className={`msg-target msg-${srcColorType}`} style={{ backgroundColor: src.color }}>{src.name}</span>
            <span className="msg-from-to">▶</span>
            <span
              role="button"
              className={`msg-target msg-${destColorType} cursor-pointer hover:opacity-80`}
              style={{ backgroundColor: dest.color }}
              onClick={() => handleSetTarget(dest)}
            >
              {dest.nation} | ↩
            </span>
          </>
        );
      }
      return (
        <span
          role="button"
          className={`msg-target msg-${srcColorType} cursor-pointer hover:opacity-80`}
          style={{ backgroundColor: src.color }}
          onClick={() => handleSetTarget(src)}
        >
          {src.name}:{src.nation} | ↩
        </span>
      );
    }

    // 국가/외교 메시지 (일반)
    if (msgType === 'national' || msgType === 'diplomacy') {
      if (src.nation_id === nationID) {
        return (
          <>
            <span className={`msg-target msg-${srcColorType}`} style={{ backgroundColor: src.color }}>{src.name}</span>
            <span className="msg-from-to">▶</span>
            <span className={`msg-target msg-${destColorType}`} style={{ backgroundColor: dest.color }}>{dest.nation}</span>
          </>
        );
      }
      return (
        <span className={`msg-target msg-${srcColorType}`} style={{ backgroundColor: src.color }}>
          {src.name}:{src.nation}
        </span>
      );
    }

    // 전체 메시지
    if (src.id !== generalID) {
      return (
        <span
          role="button"
          className={`msg-target msg-${srcColorType} cursor-pointer hover:opacity-80`}
          style={{ backgroundColor: src.color }}
          onClick={() => handleSetTarget(src)}
        >
          {src.name}:{src.nation} | ↩
        </span>
      );
    }
    return (
      <span className={`msg-target msg-${srcColorType}`} style={{ backgroundColor: src.color }}>
        {src.name}
      </span>
    );
  };

  return (
    <div
      id={`msg_${message.id}`}
      className="w-full grid grid-cols-[64px_1fr] border-b border-gray-600 min-h-[64px] text-xs text-white break-all"
      style={{ backgroundColor: getBgColor() }}
      data-id={message.id}
    >
      {/* 아이콘 */}
      <div className="w-16 h-16 border-r border-gray-600">
        <img
          className="w-full h-full object-cover"
          src={src.icon || DEFAULT_ICON}
          alt=""
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_ICON;
          }}
        />
      </div>

      {/* 본문 */}
      <div className="p-1">
        {/* 헤더 */}
        <div className="font-bold mb-1 relative">
          {/* 삭제 버튼 */}
          {isDeletable && (
            <button
              type="button"
              className="absolute right-0 top-0 px-1 py-0.5 text-[8px] border border-yellow-500 text-yellow-500 rounded hover:bg-yellow-500 hover:text-black transition-colors"
              onClick={handleDelete}
            >
              ❌
            </button>
          )}
          
          {renderHeader()}
          <span className="text-[0.75em] font-normal ml-2">&lt;{message.time}&gt;</span>
        </div>

        {/* 내용 */}
        <div 
          className={`ml-2 mr-1 overflow-hidden ${!isValidMsg ? 'text-white/50' : ''}`}
          dangerouslySetInnerHTML={{
            __html: isValidMsg 
              ? linkifyStr(message.text, { target: '_blank' }) 
              : '삭제된 메시지입니다'
          }}
        />

        {/* 액션 버튼 (수락/거절) */}
        {message.option.action && (
          <div className="text-right mt-1 mr-1 space-x-2">
            <button
              type="button"
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              disabled={!allowButton}
              onClick={handleAccept}
            >
              수락
            </button>
            <button
              type="button"
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
              disabled={!allowButton}
              onClick={handleDecline}
            >
              거절
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .msg-target {
          margin: 2px;
          padding: 2px 3px;
          display: inline-block;
          box-shadow: 2px 2px black;
          border-radius: 3px;
        }
        .msg-bright {
          color: black;
        }
        .msg-dark {
          color: white;
        }
        .msg-from-to {
          display: inline-block;
          margin: 0 4px;
        }
      `}</style>
    </div>
  );
}

