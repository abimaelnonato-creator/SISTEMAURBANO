// ===== INTERFACES PARA EVOLUTION API v2 =====

export interface EvolutionInstance {
  instanceName: string;
  instanceId?: string;
  status: 'open' | 'connecting' | 'close';
  serverUrl?: string;
  apikey?: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  number?: string;
}

export interface CreateInstancePayload {
  instanceName: string;
  qrcode?: boolean;
  number?: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  token?: string;
  webhook?: {
    url: string;
    byEvents?: boolean;
    base64?: boolean;
    headers?: Record<string, string>;
    events?: string[];
  };
  websocket?: {
    enabled: boolean;
    events?: string[];
  };
  rabbitmq?: {
    enabled: boolean;
  };
  chatwoot?: {
    enabled: boolean;
  };
  settings?: {
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
  };
}

export interface QRCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

export interface ConnectionState {
  instance: string;
  state: 'open' | 'connecting' | 'close';
}

export interface SendTextPayload {
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

export interface SendMediaPayload {
  number: string;
  mediatype: 'image' | 'video' | 'audio' | 'document';
  mimetype?: string;
  caption?: string;
  media: string; // URL ou Base64
  fileName?: string;
  delay?: number;
}

export interface SendButtonsPayload {
  number: string;
  title: string;
  description: string;
  footer?: string;
  buttons: Array<{
    type: 'reply' | 'call' | 'url';
    displayText: string;
    id?: string;
    phoneNumber?: string;
    url?: string;
  }>;
}

export interface SendListPayload {
  number: string;
  title: string;
  description: string;
  buttonText: string;
  footerText?: string;
  sections: Array<{
    title: string;
    rows: Array<{
      title: string;
      description?: string;
      rowId: string;
    }>;
  }>;
}

export interface SendLocationPayload {
  number: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface SendReactionPayload {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  reaction: string;
}

export interface MessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
  status: string;
  error?: string;
}

export interface ChatResponse {
  id: string;
  remoteJid: string;
  pushName?: string;
  profilePicUrl?: string;
  unreadCount?: number;
  lastMessageTimestamp?: number;
}

export interface ContactResponse {
  id: string;
  pushName?: string;
  profilePictureUrl?: string;
  number: string;
}

export interface ProfilePictureResponse {
  profilePictureUrl: string;
}

export interface InstanceSettings {
  rejectCall: boolean;
  msgCall: string;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
}

