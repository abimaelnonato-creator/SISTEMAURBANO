// ===== EVENTOS DE WEBHOOK DA EVOLUTION API =====

export type WebhookEventType =
  | 'application.startup'
  | 'qrcode.updated'
  | 'connection.update'
  | 'messages.set'
  | 'messages.upsert'
  | 'messages.update'
  | 'messages.delete'
  | 'send.message'
  | 'contacts.set'
  | 'contacts.upsert'
  | 'contacts.update'
  | 'presence.update'
  | 'chats.set'
  | 'chats.upsert'
  | 'chats.update'
  | 'chats.delete'
  | 'groups.upsert'
  | 'groups.update'
  | 'group-participants.update'
  | 'labels.edit'
  | 'labels.association'
  | 'call'
  | 'errors';

export interface BaseWebhookEvent {
  event: WebhookEventType;
  instance: string;
  destination?: string;
  date_time: string;
  server_url: string;
  apikey: string;
}

export interface QRCodeUpdatedEvent extends BaseWebhookEvent {
  event: 'qrcode.updated';
  data: {
    qrcode: {
      pairingCode?: string;
      code: string;
      base64: string;
      count: number;
    };
  };
}

export interface ConnectionUpdateEvent extends BaseWebhookEvent {
  event: 'connection.update';
  data: {
    instance: string;
    state: 'open' | 'connecting' | 'close';
    statusReason?: number;
  };
}

export interface MessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
  participant?: string;
}

export interface MessageContent {
  conversation?: string;
  extendedTextMessage?: {
    text: string;
    contextInfo?: any;
  };
  imageMessage?: {
    url?: string;
    mimetype: string;
    caption?: string;
    fileSha256?: string;
    fileLength?: number;
    height?: number;
    width?: number;
    mediaKey?: string;
    directPath?: string;
    jpegThumbnail?: string;
  };
  videoMessage?: {
    url?: string;
    mimetype: string;
    caption?: string;
    fileSha256?: string;
    fileLength?: number;
    seconds?: number;
    mediaKey?: string;
    directPath?: string;
    jpegThumbnail?: string;
  };
  audioMessage?: {
    url?: string;
    mimetype: string;
    fileSha256?: string;
    fileLength?: number;
    seconds?: number;
    ptt?: boolean;
    mediaKey?: string;
    directPath?: string;
  };
  documentMessage?: {
    url?: string;
    mimetype: string;
    title?: string;
    fileSha256?: string;
    fileLength?: number;
    pageCount?: number;
    mediaKey?: string;
    directPath?: string;
    fileName?: string;
  };
  locationMessage?: {
    degreesLatitude: number;
    degreesLongitude: number;
    name?: string;
    address?: string;
  };
  contactMessage?: {
    displayName: string;
    vcard: string;
  };
  buttonsResponseMessage?: {
    selectedButtonId: string;
    selectedDisplayText: string;
  };
  listResponseMessage?: {
    title: string;
    singleSelectReply: {
      selectedRowId: string;
    };
  };
  reactionMessage?: {
    key: MessageKey;
    text: string;
  };
}

export interface MessageData {
  key: MessageKey;
  pushName?: string;
  message: MessageContent;
  messageType:
    | 'conversation'
    | 'extendedTextMessage'
    | 'imageMessage'
    | 'videoMessage'
    | 'audioMessage'
    | 'documentMessage'
    | 'locationMessage'
    | 'contactMessage'
    | 'buttonsResponseMessage'
    | 'listResponseMessage'
    | 'reactionMessage'
    | 'stickerMessage';
  messageTimestamp: number;
  instanceId?: string;
  source: 'ios' | 'android' | 'web';
}

export interface MessagesUpsertEvent extends BaseWebhookEvent {
  event: 'messages.upsert';
  data: MessageData;
}

export interface MessagesUpdateEvent extends BaseWebhookEvent {
  event: 'messages.update';
  data: {
    key: MessageKey;
    update: {
      status: 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';
    };
  };
}

export interface MessagesDeleteEvent extends BaseWebhookEvent {
  event: 'messages.delete';
  data: {
    key: MessageKey;
  };
}

export interface PresenceUpdateEvent extends BaseWebhookEvent {
  event: 'presence.update';
  data: {
    id: string;
    presences: {
      [key: string]: {
        lastKnownPresence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
        lastSeen?: number;
      };
    };
  };
}

export interface CallEvent extends BaseWebhookEvent {
  event: 'call';
  data: {
    id: string;
    from: string;
    status: 'offer' | 'accept' | 'reject' | 'timeout';
    isVideo: boolean;
    isGroup: boolean;
  };
}

export interface ErrorEvent extends BaseWebhookEvent {
  event: 'errors';
  data: {
    error: string;
    message: string;
    statusCode?: number;
  };
}

export type WebhookEvent =
  | QRCodeUpdatedEvent
  | ConnectionUpdateEvent
  | MessagesUpsertEvent
  | MessagesUpdateEvent
  | MessagesDeleteEvent
  | PresenceUpdateEvent
  | CallEvent
  | ErrorEvent;

// ===== HELPER PARA EXTRAIR CONTEÚDO =====
export function extractMessageText(message: MessageContent): string | null {
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;
  if (message.documentMessage?.title) return message.documentMessage.title;
  return null;
}

export function extractMediaInfo(message: MessageContent): {
  type: 'image' | 'video' | 'audio' | 'document' | null;
  url?: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
} | null {
  if (message.imageMessage) {
    return {
      type: 'image',
      url: message.imageMessage.url,
      mimetype: message.imageMessage.mimetype,
      caption: message.imageMessage.caption,
    };
  }
  if (message.videoMessage) {
    return {
      type: 'video',
      url: message.videoMessage.url,
      mimetype: message.videoMessage.mimetype,
      caption: message.videoMessage.caption,
    };
  }
  if (message.audioMessage) {
    return {
      type: 'audio',
      url: message.audioMessage.url,
      mimetype: message.audioMessage.mimetype,
    };
  }
  if (message.documentMessage) {
    return {
      type: 'document',
      url: message.documentMessage.url,
      mimetype: message.documentMessage.mimetype,
      fileName: message.documentMessage.fileName,
    };
  }
  return null;
}

export function extractPhoneNumber(remoteJid: string): string {
  // Remove @s.whatsapp.net ou @g.us
  return remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '');
}

export function isGroupMessage(remoteJid: string): boolean {
  return remoteJid.endsWith('@g.us');
}
