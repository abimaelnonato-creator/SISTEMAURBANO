import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface MediaInfo {
  type: 'image' | 'audio' | 'video' | 'document';
  mimeType: string;
  base64: string;
  url?: string;
  caption?: string;
  fileName?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger('📁 MediaService');
  private readonly evolutionUrl: string;
  private readonly evolutionKey: string;
  private readonly instanceName: string;

  constructor(private config: ConfigService) {
    this.evolutionUrl = this.config.get<string>('EVOLUTION_API_URL') || 'http://localhost:8085';
    this.evolutionKey = this.config.get<string>('EVOLUTION_API_KEY') || '';
    this.instanceName = this.config.get<string>('EVOLUTION_INSTANCE_NAME') || 'semsur';
  }

  /**
   * Baixa mídia do WhatsApp via Evolution API e converte para base64
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async downloadMedia(messageKey: any, message: any): Promise<MediaInfo | null> {
    try {
      // Identificar tipo de mídia
      const mediaType = this.getMediaType(message);
      if (!mediaType) {
        return null;
      }

      this.logger.log(`⬇️ Baixando ${mediaType.type}...`);

      // Obter URL da mídia via Evolution API
      const mediaUrl = await this.getMediaUrl(messageKey, mediaType.type);
      if (!mediaUrl) {
        this.logger.warn('⚠️ Não foi possível obter URL da mídia');
        return null;
      }

      // Baixar e converter para base64
      const base64 = await this.downloadAndConvert(mediaUrl);
      if (!base64) {
        return null;
      }

      this.logger.log(`✅ ${mediaType.type} baixado com sucesso (${Math.round(base64.length / 1024)}KB)`);

      return {
        type: mediaType.type,
        mimeType: mediaType.mimeType,
        base64,
        url: mediaUrl,
        caption: mediaType.caption,
        fileName: mediaType.fileName,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao baixar mídia: ${error}`);
      return null;
    }
  }

  /**
   * Identifica o tipo de mídia na mensagem
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getMediaType(message: any): { type: 'image' | 'audio' | 'video' | 'document'; mimeType: string; caption?: string; fileName?: string } | null {
    if (message.imageMessage) {
      return {
        type: 'image',
        mimeType: message.imageMessage.mimetype || 'image/jpeg',
        caption: message.imageMessage.caption,
      };
    }
    
    if (message.audioMessage) {
      return {
        type: 'audio',
        mimeType: message.audioMessage.mimetype || 'audio/ogg',
      };
    }
    
    if (message.videoMessage) {
      return {
        type: 'video',
        mimeType: message.videoMessage.mimetype || 'video/mp4',
        caption: message.videoMessage.caption,
      };
    }
    
    if (message.documentMessage) {
      return {
        type: 'document',
        mimeType: message.documentMessage.mimetype || 'application/octet-stream',
        fileName: message.documentMessage.fileName,
      };
    }

    // PTT (Push to Talk) - mensagem de voz
    if (message.pttMessage) {
      return {
        type: 'audio',
        mimeType: 'audio/ogg',
      };
    }

    return null;
  }

  /**
   * Obtém URL de download da mídia via Evolution API
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  private async getMediaUrl(messageKey: any, _mediaType: string): Promise<string | null> {
    try {
      // Evolution API v2 - endpoint para obter base64 da mídia
      const response = await fetch(
        `${this.evolutionUrl}/chat/getBase64FromMediaMessage/${this.instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': this.evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              key: messageKey,
            },
          }),
        }
      );

      if (!response.ok) {
        // Tentar método alternativo
        return await this.getMediaUrlAlternative(messageKey);
      }

      const data = await response.json();
      
      // Se a API retornar base64 diretamente, criar URL temporária
      if (data.base64) {
        return `data:${data.mimetype || 'application/octet-stream'};base64,${data.base64}`;
      }

      return data.url || null;
    } catch (error) {
      this.logger.error(`Erro ao obter URL: ${error}`);
      return null;
    }
  }

  /**
   * Método alternativo para obter mídia
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getMediaUrlAlternative(messageKey: any): Promise<string | null> {
    try {
      // Tentar via endpoint de download
      const response = await fetch(
        `${this.evolutionUrl}/message/downloadMediaMessage/${this.instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': this.evolutionKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: messageKey }),
        }
      );

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.base64 ? `data:${data.mimetype};base64,${data.base64}` : null;
    } catch {
      return null;
    }
  }

  /**
   * Baixa arquivo de URL e converte para base64
   */
  private async downloadAndConvert(url: string): Promise<string | null> {
    try {
      // Se já é base64 (data URL)
      if (url.startsWith('data:')) {
        const base64Part = url.split(',')[1];
        return base64Part;
      }

      // Baixar arquivo
      const response = await fetch(url);
      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      this.logger.error(`Erro ao converter para base64: ${error}`);
      return null;
    }
  }

  /**
   * Extrai base64 diretamente da mensagem (quando disponível)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async extractMediaFromMessage(message: any): Promise<MediaInfo | null> {
    try {
      // Verificar se a mídia já está inline na mensagem
      if (message.imageMessage?.jpegThumbnail) {
        // Thumbnail está disponível, mas precisamos da imagem completa
        // Neste caso, precisamos usar a API para baixar
      }

      // Para Evolution API, a mídia geralmente precisa ser baixada separadamente
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Salva mídia localmente (opcional)
   */
  async saveMediaLocally(mediaInfo: MediaInfo, protocol: string): Promise<string | null> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'whatsapp', protocol);
      fs.mkdirSync(uploadDir, { recursive: true });

      const extension = this.getExtensionFromMimeType(mediaInfo.mimeType);
      const fileName = `${Date.now()}.${extension}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(mediaInfo.base64, 'base64');
      fs.writeFileSync(filePath, buffer);

      this.logger.log(`💾 Mídia salva: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Erro ao salvar mídia: ${error}`);
      return null;
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'video/mp4': 'mp4',
      'video/3gpp': '3gp',
      'application/pdf': 'pdf',
    };
    return mimeMap[mimeType] || 'bin';
  }
}
