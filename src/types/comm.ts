/**
 * Communication System Types
 * Based on gin7manual.txt P.15-P.17
 */

// Chat channel types (P.16)
export type ChannelType = 'spot' | 'fleet' | 'grid' | 'global';

// Message types
export interface ChatMessage {
  messageId: string;
  sessionId: string;
  channelType: ChannelType;
  scopeId?: string;
  senderCharacterId: string;
  senderName: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Mail types (P.15)
export interface Mail {
  mailId: string;
  sessionId: string;
  fromCharacterId: string;
  fromName: string;
  fromAddress: string; // personal or job-based address
  toCharacterId: string;
  toName: string;
  toAddress: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  replyToMailId?: string;
}

export interface MailBoxInfo {
  inbox: Mail[];
  outbox: Mail[];
  totalInbox: number;
  totalOutbox: number;
  inboxLimit: number; // 120 per manual
}

// Address book types (P.15)
export interface AddressBookEntry {
  entryId: string;
  sessionId: string;
  ownerCharacterId: string;
  contactCharacterId: string;
  contactName: string;
  contactAddress: string;
  addedAt: string;
}

// Handshake / Messenger types (P.16)
export type HandshakeStatus = 'pending' | 'accepted' | 'rejected';

export interface Handshake {
  handshakeId: string;
  sessionId: string;
  requesterCharacterId: string;
  requesterName: string;
  targetCharacterId: string;
  targetName: string;
  status: HandshakeStatus;
  createdAt: string;
  respondedAt?: string;
}

// Messenger connection state (P.16)
export interface MessengerConnection {
  connectionId: string;
  characterId: string;
  characterName: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Communication badge counts for real-time updates
export interface CommBadges {
  unreadMail: number;
  pendingHandshakes: number;
  newChatMessages: number; // per channel
}
