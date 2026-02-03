// Queue names constants
export const QUEUES = {
  WHATSAPP: 'whatsapp',
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  AI_CLASSIFICATION: 'ai-classification',
  FILE_PROCESSING: 'file-processing',
  SLA_CHECK: 'sla-check',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
