import { Injectable, Logger } from '@nestjs/common';
import { CONVERSATION_STATE, SESSION_TIMEOUT_MINUTES } from '../constants/whatsapp.constants';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

interface ConversationSession {
  id: string;
  phone: string;
  state: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly SESSION_PREFIX = 'whatsapp:session:';
  private readonly SESSION_TTL = SESSION_TIMEOUT_MINUTES * 60; // em segundos

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Obter ou criar sessão de conversa
   */
  async getOrCreateSession(phone: string): Promise<ConversationSession> {
    const key = this.SESSION_PREFIX + phone;
    const existing = await this.redis.get(key);

    if (existing) {
      const session = JSON.parse(existing);
      // Renovar TTL
      await this.redis.expire(key, this.SESSION_TTL);
      return session;
    }

    // Criar nova sessão
    const session: ConversationSession = {
      id: `${phone}@s.whatsapp.net`,
      phone,
      state: CONVERSATION_STATE.IDLE,
      data: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));
    return session;
  }

  /**
   * Atualizar sessão
   */
  async updateSession(
    phone: string,
    updates: Partial<ConversationSession>,
  ): Promise<ConversationSession> {
    const session = await this.getOrCreateSession(phone);
    const updated = {
      ...session,
      ...updates,
      data: { ...session.data, ...updates.data },
      updatedAt: new Date(),
    };

    const key = this.SESSION_PREFIX + phone;
    await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(updated));
    
    return updated;
  }

  /**
   * Resetar sessão (voltar ao estado inicial)
   */
  async resetSession(phone: string): Promise<void> {
    const key = this.SESSION_PREFIX + phone;
    await this.redis.del(key);
  }

  /**
   * Obter sessão existente
   */
  async getSession(phone: string): Promise<ConversationSession | null> {
    const key = this.SESSION_PREFIX + phone;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Verificar se sessão está ativa
   */
  async isSessionActive(phone: string): Promise<boolean> {
    const key = this.SESSION_PREFIX + phone;
    return (await this.redis.exists(key)) === 1;
  }

  /**
   * Adicionar foto à sessão
   */
  async addPhoto(phone: string, photoUrl: string): Promise<void> {
    const session = await this.getOrCreateSession(phone);
    const photos = session.data.photos || [];
    photos.push(photoUrl);
    await this.updateSession(phone, { data: { photos } });
  }
}
