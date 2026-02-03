// ===== CONSTANTES DO MÓDULO WHATSAPP =====

export const WHATSAPP_QUEUES = {
  INCOMING: 'whatsapp-incoming',
  OUTGOING: 'whatsapp-outgoing',
  MEDIA: 'whatsapp-media',
} as const;

export const WHATSAPP_EVENTS = {
  // Eventos que queremos processar
  MESSAGES_UPSERT: 'messages.upsert',
  MESSAGES_UPDATE: 'messages.update',
  CONNECTION_UPDATE: 'connection.update',
  QRCODE_UPDATED: 'qrcode.updated',
  CALL: 'call',
  ERRORS: 'errors',
} as const;

export const MESSAGE_STATUS = {
  PENDING: 'PENDING',
  SERVER_ACK: 'SERVER_ACK',
  DELIVERY_ACK: 'DELIVERY_ACK',
  READ: 'READ',
  PLAYED: 'PLAYED',
} as const;

export const CONVERSATION_STATE = {
  IDLE: 'idle',
  AWAITING_DESCRIPTION: 'awaiting_description',
  AWAITING_LOCATION: 'awaiting_location',
  AWAITING_PHOTO: 'awaiting_photo',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  COMPLETED: 'completed',
} as const;

export const SESSION_TIMEOUT_MINUTES = 30;

export const MAX_RETRIES = 3;

export const RATE_LIMIT = {
  MAX_MESSAGES_PER_MINUTE: 30,
  MAX_MESSAGES_PER_HOUR: 500,
} as const;

// Prefixo para protocolo de demandas
export const PROTOCOL_PREFIX = 'PNM';

// Regex para detectar comandos do usuário
export const COMMAND_PATTERNS = {
  STATUS: /^(status|consultar|acompanhar)\s*(pnm[-\s]?\d{4}[-\s]?\d{5})?$/i,
  HELP: /^(ajuda|menu|opcoes|opções|oi|olá|ola|bom dia|boa tarde|boa noite|início|inicio)$/i,
  CANCEL: /^(cancelar|sair|voltar|parar)$/i,
  YES: /^(sim|s|confirmo|confirmar|ok|pode|1)$/i,
  NO: /^(não|nao|n|cancelar|2)$/i,
};

// Aliases para compatibilidade
export const QUEUE_NAMES = {
  INCOMING_MESSAGE: WHATSAPP_QUEUES.INCOMING,
  OUTGOING_MESSAGE: WHATSAPP_QUEUES.OUTGOING,
  MEDIA_PROCESSING: WHATSAPP_QUEUES.MEDIA,
} as const;

export const MEDIA_LIMITS = {
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_AUDIO_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_DOCUMENT_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

export const TIMEOUTS = {
  TYPING_DELAY: 1000, // 1 segundo
  MIN_MESSAGE_DELAY: 500, // 500ms entre mensagens
  QR_CODE_EXPIRY: 40000, // 40 segundos
} as const;
