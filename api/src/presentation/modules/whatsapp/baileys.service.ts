import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage,
  getContentType,
  WAMessage,
} from '@whiskeysockets/baileys';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require('qrcode-terminal');
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';

export interface MensagemRecebida {
  telefone: string;
  jid: string; // JID original para responder (pode ser @s.whatsapp.net ou @lid)
  nome: string;
  texto?: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'sticker';
  mediaBuffer?: Buffer;
  mimeType?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  messageKey: proto.IMessageKey;
  timestamp: number;
}

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('📱 Baileys');
  private socket: WASocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private authPath = path.join(process.cwd(), 'whatsapp-auth');
  
  // Callback para processar mensagens
  private messageHandler: ((msg: MensagemRecebida) => Promise<void>) | null = null;

  async onModuleInit() {
    this.printBanner();
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.socket) {
      this.socket.end(undefined);
    }
  }

  private printBanner() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║   📱 WHATSAPP BOT - Conexão Direta (Baileys)                  ║');
    console.log('║   🤖 Gemini 2.0 Flash | Texto | Áudio | Imagem | Vídeo        ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');
  }

  async connect(): Promise<void> {
    try {
      // Garantir que o diretório de autenticação existe
      if (!fs.existsSync(this.authPath)) {
        fs.mkdirSync(this.authPath, { recursive: true });
      }

      // Carregar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      // Criar socket com configurações otimizadas
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Vamos usar nosso próprio QR
        logger: pino({ level: 'silent' }), // Silenciar logs do Baileys
        browser: ['SEMSUR Bot', 'Chrome', '120.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
      });

      // Eventos de conexão
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR Code
        if (qr) {
          console.log('\n');
          console.log('╔════════════════════════════════════════════════════════════════╗');
          console.log('║                                                                ║');
          console.log('║   📲 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP               ║');
          console.log('║                                                                ║');
          console.log('╚════════════════════════════════════════════════════════════════╝');
          console.log('\n');
          qrcode.generate(qr, { small: true });
          console.log('\n');
          this.logger.log('⏳ Aguardando leitura do QR Code...');
        }

        // Conexão estabelecida
        if (connection === 'open') {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          const user = this.socket?.user;
          const numero = user?.id?.split(':')[0] || user?.id?.split('@')[0] || 'Desconhecido';
          
          console.log('\n');
          console.log('╔════════════════════════════════════════════════════════════════╗');
          console.log('║                                                                ║');
          console.log('║   ✅ WHATSAPP CONECTADO COM SUCESSO!                          ║');
          console.log(`║   📞 Número: ${numero.padEnd(47)}║`);
          console.log('║   🤖 Bot ATIVO e pronto para receber mensagens               ║');
          console.log('║                                                                ║');
          console.log('╚════════════════════════════════════════════════════════════════╝');
          console.log('\n');
          
          this.logger.log(`🟢 Conectado como: ${numero}`);
        }

        // Desconexão
        if (connection === 'close') {
          this.isConnected = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          if (statusCode === DisconnectReason.loggedOut) {
            this.logger.warn('❌ Sessão encerrada. Removendo credenciais...');
            // Limpar credenciais para novo QR
            if (fs.existsSync(this.authPath)) {
              fs.rmSync(this.authPath, { recursive: true, force: true });
            }
            // Reconectar para gerar novo QR
            setTimeout(() => this.connect(), 3000);
          } else if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.logger.warn(`🔄 Reconectando... Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), 5000);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('❌ Máximo de tentativas de reconexão atingido');
          }
        }
      });

      // Salvar credenciais
      this.socket.ev.on('creds.update', saveCreds);

      // Mensagens recebidas
      this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          // Ignorar mensagens enviadas por nós mesmos
          if (msg.key.fromMe) continue;
          
          // Ignorar mensagens de status/broadcast
          if (msg.key.remoteJid === 'status@broadcast') continue;
          
          // Ignorar mensagens de grupos (opcional - pode remover se quiser suportar grupos)
          if (msg.key.remoteJid?.endsWith('@g.us')) continue;

          await this.processarMensagem(msg);
        }
      });

    } catch (error) {
      this.logger.error(`Erro ao conectar: ${error.message}`);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 5000);
      }
    }
  }

  private async processarMensagem(msg: WAMessage): Promise<void> {
    try {
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid) return;

      // Extrair número de telefone (pode ser LID ou número real)
      const telefone = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
      const nome = msg.pushName || 'Usuário';
      const timestamp = msg.messageTimestamp as number || Date.now() / 1000;

      // Determinar tipo de mensagem
      const messageContent = msg.message;
      if (!messageContent) return;

      const contentType = getContentType(messageContent);
      
      let mensagem: MensagemRecebida = {
        telefone,
        jid: remoteJid, // Preservar JID original para responder corretamente
        nome,
        tipo: 'texto',
        messageKey: msg.key,
        timestamp,
      };

      // Processar por tipo
      switch (contentType) {
        case 'conversation':
        case 'extendedTextMessage':
          mensagem.tipo = 'texto';
          mensagem.texto = messageContent.conversation || 
                          messageContent.extendedTextMessage?.text || '';
          break;

        case 'imageMessage':
          mensagem.tipo = 'imagem';
          mensagem.caption = messageContent.imageMessage?.caption || '';
          mensagem.mimeType = messageContent.imageMessage?.mimetype || 'image/jpeg';
          try {
            mensagem.mediaBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
          } catch (e) {
            this.logger.warn(`Não foi possível baixar imagem: ${e.message}`);
          }
          break;

        case 'audioMessage':
          mensagem.tipo = 'audio';
          mensagem.mimeType = messageContent.audioMessage?.mimetype || 'audio/ogg';
          try {
            mensagem.mediaBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
          } catch (e) {
            this.logger.warn(`Não foi possível baixar áudio: ${e.message}`);
          }
          break;

        case 'videoMessage':
          mensagem.tipo = 'video';
          mensagem.caption = messageContent.videoMessage?.caption || '';
          mensagem.mimeType = messageContent.videoMessage?.mimetype || 'video/mp4';
          try {
            mensagem.mediaBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
          } catch (e) {
            this.logger.warn(`Não foi possível baixar vídeo: ${e.message}`);
          }
          break;

        case 'documentMessage':
        case 'documentWithCaptionMessage':
          mensagem.tipo = 'documento';
          const docMsg = messageContent.documentMessage || 
                        messageContent.documentWithCaptionMessage?.message?.documentMessage;
          mensagem.caption = docMsg?.caption || docMsg?.fileName || '';
          mensagem.mimeType = docMsg?.mimetype || 'application/octet-stream';
          try {
            mensagem.mediaBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
          } catch (e) {
            this.logger.warn(`Não foi possível baixar documento: ${e.message}`);
          }
          break;

        case 'locationMessage':
        case 'liveLocationMessage':
          mensagem.tipo = 'localizacao';
          const locMsg = messageContent.locationMessage || messageContent.liveLocationMessage;
          mensagem.latitude = locMsg?.degreesLatitude ?? undefined;
          mensagem.longitude = locMsg?.degreesLongitude ?? undefined;
          break;

        case 'stickerMessage':
          mensagem.tipo = 'sticker';
          mensagem.mimeType = messageContent.stickerMessage?.mimetype || 'image/webp';
          try {
            mensagem.mediaBuffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
          } catch (e) {
            this.logger.warn(`Não foi possível baixar sticker: ${e.message}`);
          }
          break;

        default:
          this.logger.debug(`Tipo de mensagem não suportado: ${contentType}`);
          return;
      }

      // Log da mensagem recebida
      this.logMensagemRecebida(mensagem);

      // Chamar handler se configurado
      if (this.messageHandler) {
        await this.messageHandler(mensagem);
      }

    } catch (error) {
      this.logger.error(`Erro ao processar mensagem: ${error.message}`);
    }
  }

  private logMensagemRecebida(msg: MensagemRecebida): void {
    const hora = new Date().toLocaleTimeString('pt-BR');
    const tipoEmoji = {
      texto: '💬',
      imagem: '🖼️',
      audio: '🎵',
      video: '🎬',
      documento: '📄',
      localizacao: '📍',
      sticker: '🎨',
    };

    console.log('\n');
    console.log(`╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║  ${tipoEmoji[msg.tipo]} MENSAGEM RECEBIDA - ${hora.padEnd(40)}║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  📞 De: ${msg.nome} (${msg.telefone})`.padEnd(65) + '║');
    console.log(`║  📝 Tipo: ${msg.tipo.toUpperCase()}`.padEnd(65) + '║');
    
    if (msg.texto) {
      const textoTruncado = msg.texto.length > 45 ? msg.texto.substring(0, 45) + '...' : msg.texto;
      console.log(`║  💬 Conteúdo: ${textoTruncado}`.padEnd(65) + '║');
    }
    if (msg.caption) {
      const captionTruncado = msg.caption.length > 40 ? msg.caption.substring(0, 40) + '...' : msg.caption;
      console.log(`║  📝 Legenda: ${captionTruncado}`.padEnd(65) + '║');
    }
    if (msg.latitude && msg.longitude) {
      console.log(`║  🌍 Coords: ${msg.latitude.toFixed(6)}, ${msg.longitude.toFixed(6)}`.padEnd(65) + '║');
    }
    if (msg.mediaBuffer) {
      const sizeKB = (msg.mediaBuffer.length / 1024).toFixed(1);
      console.log(`║  📦 Tamanho: ${sizeKB} KB`.padEnd(65) + '║');
    }
    
    console.log(`╚══════════════════════════════════════════════════════════════╝`);
    console.log('\n');
  }

  // ============ MÉTODOS PÚBLICOS ============

  /**
   * Registrar handler para processar mensagens
   */
  onMessage(handler: (msg: MensagemRecebida) => Promise<void>): void {
    this.messageHandler = handler;
    this.logger.log('✅ Handler de mensagens registrado');
  }

  /**
   * Enviar mensagem de texto
   */
  async enviarTexto(telefone: string, texto: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      this.logger.error('❌ WhatsApp não está conectado');
      return false;
    }

    try {
      // Formatar número
      const jid = this.formatarJid(telefone);
      
      await this.socket.sendMessage(jid, { text: texto });
      
      this.logger.log(`✅ Mensagem enviada para ${telefone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);
      return false;
    }
  }

  /**
   * Enviar imagem
   */
  async enviarImagem(telefone: string, imageBuffer: Buffer, caption?: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      this.logger.error('❌ WhatsApp não está conectado');
      return false;
    }

    try {
      const jid = this.formatarJid(telefone);
      
      await this.socket.sendMessage(jid, {
        image: imageBuffer,
        caption: caption || '',
      });
      
      this.logger.log(`✅ Imagem enviada para ${telefone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar imagem: ${error.message}`);
      return false;
    }
  }

  /**
   * Enviar áudio (voz)
   */
  async enviarAudio(telefone: string, audioBuffer: Buffer): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      this.logger.error('❌ WhatsApp não está conectado');
      return false;
    }

    try {
      const jid = this.formatarJid(telefone);
      
      await this.socket.sendMessage(jid, {
        audio: audioBuffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true, // Enviar como mensagem de voz
      });
      
      this.logger.log(`✅ Áudio enviado para ${telefone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar áudio: ${error.message}`);
      return false;
    }
  }

  /**
   * Enviar documento
   */
  async enviarDocumento(telefone: string, docBuffer: Buffer, filename: string, mimetype: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      this.logger.error('❌ WhatsApp não está conectado');
      return false;
    }

    try {
      const jid = this.formatarJid(telefone);
      
      await this.socket.sendMessage(jid, {
        document: docBuffer,
        fileName: filename,
        mimetype: mimetype,
      });
      
      this.logger.log(`✅ Documento enviado para ${telefone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar documento: ${error.message}`);
      return false;
    }
  }

  /**
   * Enviar localização
   */
  async enviarLocalizacao(telefone: string, latitude: number, longitude: number, nome?: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      this.logger.error('❌ WhatsApp não está conectado');
      return false;
    }

    try {
      const jid = this.formatarJid(telefone);
      
      await this.socket.sendMessage(jid, {
        location: {
          degreesLatitude: latitude,
          degreesLongitude: longitude,
          name: nome || '',
        },
      });
      
      this.logger.log(`✅ Localização enviada para ${telefone}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar localização: ${error.message}`);
      return false;
    }
  }

  /**
   * Marcar mensagem como lida
   */
  async marcarComoLida(messageKey: proto.IMessageKey): Promise<void> {
    if (!this.socket || !this.isConnected) return;

    try {
      await this.socket.readMessages([messageKey]);
    } catch (error) {
      // Ignorar erros de leitura
    }
  }

  /**
   * Mostrar "digitando..."
   */
  async mostrarDigitando(telefone: string): Promise<void> {
    if (!this.socket || !this.isConnected) return;

    try {
      const jid = this.formatarJid(telefone);
      await this.socket.sendPresenceUpdate('composing', jid);
    } catch (error) {
      // Ignorar erros
    }
  }

  /**
   * Mostrar "gravando áudio..."
   */
  async mostrarGravandoAudio(telefone: string): Promise<void> {
    if (!this.socket || !this.isConnected) return;

    try {
      const jid = this.formatarJid(telefone);
      await this.socket.sendPresenceUpdate('recording', jid);
    } catch (error) {
      // Ignorar erros
    }
  }

  /**
   * Parar de mostrar "digitando..." ou "gravando..."
   */
  async pararDigitando(telefone: string): Promise<void> {
    if (!this.socket || !this.isConnected) return;

    try {
      const jid = this.formatarJid(telefone);
      await this.socket.sendPresenceUpdate('paused', jid);
    } catch (error) {
      // Ignorar erros
    }
  }

  /**
   * Verificar se está conectado
   */
  estaConectado(): boolean {
    return this.isConnected;
  }

  /**
   * Obter número conectado
   */
  getNumeroConectado(): string | null {
    if (!this.socket?.user) return null;
    return this.socket.user.id.split(':')[0] || this.socket.user.id.split('@')[0];
  }

  /**
   * Desconectar
   */
  async desconectar(): Promise<void> {
    if (this.socket) {
      await this.socket.logout();
      this.socket = null;
      this.isConnected = false;
      this.logger.log('🔴 Desconectado do WhatsApp');
    }
  }

  /**
   * Reconectar (gerar novo QR)
   */
  async reconectar(): Promise<void> {
    await this.desconectar();
    // Limpar credenciais
    if (fs.existsSync(this.authPath)) {
      fs.rmSync(this.authPath, { recursive: true, force: true });
    }
    await this.connect();
  }

  // ============ MÉTODOS PRIVADOS ============

  private formatarJid(telefone: string): string {
    // Se já tem @lid ou @s.whatsapp.net, retornar como está
    if (telefone.includes('@')) {
      return telefone;
    }
    
    // Remover caracteres não numéricos
    let numero = telefone.replace(/\D/g, '');
    
    // Se parece ser um LID (número muito grande, > 15 dígitos)
    if (numero.length > 15) {
      return `${numero}@lid`;
    }
    
    // Adicionar código do país se não tiver
    if (!numero.startsWith('55') && numero.length <= 11) {
      numero = '55' + numero;
    }
    
    return `${numero}@s.whatsapp.net`;
  }
}
