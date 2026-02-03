import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GeminiService } from './gemini/gemini.service';
import { BaileysService, MensagemRecebida } from './baileys.service';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';
import * as fs from 'fs';
import * as path from 'path';

interface EstadoConversa {
  etapa: 'inicio' | 'coletando_descricao' | 'coletando_localizacao' | 'confirmando' | 'finalizado' | 'consulta_protocolo';
  descricao?: string;
  categoria?: string;
  localizacao?: { lat: number; lng: number };
  endereco?: string;
  bairro?: string;
  jid?: string; // JID completo para responder via WhatsApp
  ultimaInteracao: number;
  primeiraInteracao: number; // Quando a conversa começou
  contextoConversa: Array<{ role: 'user' | 'assistant'; content: string }>;
  midias: Array<{ tipo: string; buffer: Buffer; mimeType: string }>;
  querAudio?: boolean; // Se o usuário pediu resposta por áudio
  jaSeSaudou: boolean; // Se a LUMA já se apresentou
  ultimasRespostas: string[]; // Últimas 5 respostas para anti-loop
  avisouTimeout: boolean; // Se já avisou sobre timeout
  nomeUsuario?: string; // Nome do usuário para usar na conversa
  protocoloConsultado?: string; // Protocolo sendo consultado
}

@Injectable()
export class WhatsAppBotBaileysService implements OnModuleInit {
  private readonly logger = new Logger('🤖 BotGemini');
  private conversas: Map<string, EstadoConversa> = new Map();
  private botAtivo = true;
  private readonly TIMEOUT_CONVERSA = 30 * 60 * 1000; // 30 minutos para expirar conversa
  private readonly TIMEOUT_AVISO = 10 * 60 * 1000; // 10 minutos para avisar sobre inatividade

  constructor(
    private readonly baileysService: BaileysService,
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    // Registrar handler de mensagens
    this.baileysService.onMessage(async (msg) => {
      await this.processarMensagem(msg);
    });

    this.logger.log('✅ Bot Gemini inicializado e aguardando mensagens');
  }

  private async processarMensagem(msg: MensagemRecebida): Promise<void> {
    if (!this.botAtivo) {
      this.logger.debug('Bot desativado, ignorando mensagem');
      return;
    }

    const { telefone, jid, nome, tipo, texto, mediaBuffer, mimeType, caption, latitude, longitude, messageKey } = msg;

    try {
      // Marcar como lida
      await this.baileysService.marcarComoLida(messageKey);

      // Mostrar "digitando..." - usar JID original
      await this.baileysService.mostrarDigitando(jid);

      // Verificar se tem conversa antiga para decidir se precisa avisar timeout
      const stateExistente = this.conversas.get(telefone);
      const tempoInativo = stateExistente ? (Date.now() - stateExistente.ultimaInteracao) : 0;
      const precisaAvisarTimeout = stateExistente && !stateExistente.avisouTimeout && tempoInativo > this.TIMEOUT_AVISO;

      // Obter ou criar estado da conversa (passar JID e nome para salvar)
      const state = this.getOrCreateState(telefone, jid, nome);

      // Se passou mais de 10 minutos, avisar sobre reinício
      if (precisaAvisarTimeout) {
        const minutos = Math.floor(tempoInativo / 60000);
        await this.enviarResposta(jid, `Opa! Passou ${minutos} minutos sem resposta, então vou reiniciar nossa conversa pra ficar mais organizado, beleza? Me conta, no que posso te ajudar?`);
        state.avisouTimeout = true;
        // Limpar estado para recomeçar, mas manter nome
        state.etapa = 'inicio';
        state.descricao = undefined;
        state.categoria = undefined;
        state.endereco = undefined;
        state.localizacao = undefined;
        state.midias = [];
        state.contextoConversa = [];
        state.jaSeSaudou = true; // Já cumprimentou no aviso
        state.ultimaInteracao = Date.now();
        await this.baileysService.pararDigitando(jid);
        return; // Esperar próxima mensagem
      }

      // Processar por tipo de mensagem
      let resposta: string;

      switch (tipo) {
        case 'texto':
          resposta = await this.processarTexto(telefone, nome, texto || '', state);
          break;

        case 'audio':
          resposta = await this.processarAudio(telefone, nome, mediaBuffer, mimeType, state);
          break;

        case 'imagem':
          resposta = await this.processarImagem(telefone, nome, mediaBuffer, mimeType, caption, state);
          break;

        case 'video':
          resposta = await this.processarVideo(telefone, nome, mediaBuffer, mimeType, caption, state);
          break;

        case 'localizacao':
          resposta = await this.processarLocalizacao(telefone, nome, latitude, longitude, state);
          break;

        case 'sticker':
          resposta = await this.processarSticker(telefone, nome, state);
          break;

        case 'documento':
          resposta = await this.processarDocumento(telefone, nome, caption, state);
          break;

        default:
          resposta = 'Desculpe, não consegui processar esse tipo de mensagem. Por favor, envie texto, foto, áudio, vídeo ou sua localização.';
      }

      // Parar "digitando..." e enviar resposta - usar JID original
      await this.baileysService.pararDigitando(jid);
      
      if (resposta) {
        // Verificar anti-loop: não enviar resposta muito similar às últimas
        resposta = this.evitarRepeticao(resposta, state);
        
        // Verificar se o usuário pediu resposta por áudio
        const pediuAudio = state.querAudio || (tipo === 'texto' && texto && this.geminiService.usuarioPediuAudio(texto));
        
        if (pediuAudio) {
          // Tentar enviar resposta em áudio
          const audioEnviado = await this.enviarRespostaEmAudio(jid, resposta);
          
          if (!audioEnviado) {
            // Fallback para texto se o áudio falhar
            await this.enviarResposta(jid, resposta);
          }
          
          // Resetar flag de áudio
          state.querAudio = false;
        } else {
          await this.enviarResposta(jid, resposta);
        }
        
        // Adicionar ao contexto e histórico de respostas
        state.contextoConversa.push({ role: 'assistant', content: resposta });
        state.ultimasRespostas.push(resposta);
        if (state.ultimasRespostas.length > 5) {
          state.ultimasRespostas.shift(); // Manter só as últimas 5
        }
        state.ultimaInteracao = Date.now();
        state.avisouTimeout = false; // Resetar flag de timeout
      }

    } catch (error) {
      this.logger.error(`Erro ao processar mensagem: ${error.message}`);
      await this.baileysService.pararDigitando(jid);
      await this.enviarResposta(jid, 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
    }
  }

  private getOrCreateState(telefone: string, jid?: string, nome?: string): EstadoConversa {
    let state = this.conversas.get(telefone);
    const agora = Date.now();
    
    // Verificar timeout de expiração (30 min) - apagar conversa
    if (state && (agora - state.ultimaInteracao) > this.TIMEOUT_CONVERSA) {
      this.conversas.delete(telefone);
      state = undefined;
    }

    if (!state) {
      state = {
        etapa: 'inicio',
        ultimaInteracao: agora,
        primeiraInteracao: agora,
        contextoConversa: [],
        midias: [],
        jid: jid,
        jaSeSaudou: false,
        ultimasRespostas: [],
        avisouTimeout: false,
        nomeUsuario: nome,
      };
      this.conversas.set(telefone, state);
    } else {
      // Verificar timeout de aviso (10 min) - avisar mas não apagar
      if (!state.avisouTimeout && (agora - state.ultimaInteracao) > this.TIMEOUT_AVISO) {
        state.avisouTimeout = true;
        // Marcar que precisa avisar sobre reinício
      }
      
      if (jid && !state.jid) {
        state.jid = jid;
      }
      if (nome && !state.nomeUsuario) {
        state.nomeUsuario = nome;
      }
    }

    return state;
  }

  private async processarTexto(telefone: string, nome: string, texto: string, state: EstadoConversa): Promise<string> {
    this.logger.log(`📝 Processando texto - Etapa: ${state.etapa}, JaSaudou: ${state.jaSeSaudou}, Texto: "${texto}"`);
    
    // Adicionar ao contexto
    state.contextoConversa.push({ role: 'user', content: texto });

    // Verificar comandos especiais
    const textoLower = texto.toLowerCase().trim();

    if (textoLower === 'cancelar' || textoLower === 'sair') {
      this.conversas.delete(telefone);
      return 'Certo, conversa cancelada. Se precisar de ajuda, é só me chamar!';
    }

    if (textoLower === 'menu' || textoLower === 'ajuda' || textoLower === 'help') {
      state.jaSeSaudou = true;
      return this.getMenuAjuda();
    }

    // Detectar intenção de consultar protocolo
    if (this.isIntencaoConsultaProtocolo(textoLower)) {
      // Verificar se já veio com número de protocolo
      const protocoloEncontrado = this.extrairProtocolo(texto);
      if (protocoloEncontrado) {
        return await this.consultarProtocolo(protocoloEncontrado, state);
      }
      // Pedir o protocolo
      state.etapa = 'consulta_protocolo';
      state.jaSeSaudou = true;
      return 'Claro! Me passa o número do protocolo que você recebeu quando fez a solicitação. É algo tipo 202601-ABC123.';
    }

    // Se está na etapa de consulta de protocolo, tentar extrair o protocolo
    if (state.etapa === 'consulta_protocolo') {
      const protocoloEncontrado = this.extrairProtocolo(texto);
      if (protocoloEncontrado) {
        return await this.consultarProtocolo(protocoloEncontrado, state);
      }
      return 'Não consegui identificar um protocolo válido. O formato é tipo 202601-ABC123. Pode verificar e me enviar novamente?';
    }

    // Saudação inicial simples (só "oi", "olá", etc)
    if (state.etapa === 'inicio' && this.isSaudacao(textoLower) && !this.contemInformacaoDemanda(texto)) {
      state.etapa = 'coletando_descricao';
      state.jaSeSaudou = true;
      this.logger.log(`👋 Saudação simples detectada, mudando etapa para: coletando_descricao`);
      return this.getSaudacao(nome);
    }

    // Se é a primeira mensagem e contém informação de demanda (sem saudação prévia)
    // A LUMA precisa se apresentar primeiro e reconhecer a demanda
    if (state.etapa === 'inicio' && !state.jaSeSaudou && this.contemInformacaoDemanda(texto)) {
      state.jaSeSaudou = true;
      state.etapa = 'coletando_descricao';
      this.logger.log(`🚀 Primeira mensagem já contém demanda! Apresentando LUMA...`);
      return await this.processarPrimeiraMensagemComDemanda(telefone, nome, texto, state);
    }

    // Usar Gemini para processar a mensagem
    this.logger.log(`🤖 Enviando para Gemini...`);
    return await this.processarComGemini(telefone, nome, texto, state);
  }

  /**
   * Processa primeira mensagem que já contém informação de demanda
   * Faz saudação + reconhecimento + pede o que falta
   */
  private async processarPrimeiraMensagemComDemanda(
    telefone: string,
    nome: string,
    texto: string,
    state: EstadoConversa
  ): Promise<string> {
    // Primeiro, analisar o que já foi enviado
    const contexto = `
Cidadão ${nome} acabou de enviar a PRIMEIRA mensagem, que parece ser uma demanda.
Esta é a mensagem: "${texto}"

IMPORTANTE: O cidadão AINDA NÃO foi saudado. Você precisa:
1. Se apresentar brevemente (Oi! Aqui é a Luma da SEMSUR de Parnamirim)
2. Reconhecer que parece ser uma demanda
3. Extrair o que já foi informado (descrição, endereço, bairro)
4. Perguntar o que falta de forma natural (sempre falta foto se não enviou)

NÃO repita informações que o cidadão já deu!
    `;

    const resultado = await this.geminiService.analisarTexto(texto, contexto);

    // Extrair informações
    if (resultado.demandInfo) {
      if (resultado.demandInfo.descricao) {
        state.descricao = resultado.demandInfo.descricao;
      }
      if (resultado.demandInfo.endereco) {
        state.endereco = resultado.demandInfo.endereco;
      }
      if (resultado.demandInfo.categoria) {
        state.categoria = resultado.demandInfo.categoria;
      }
      if ((resultado.demandInfo as any).bairro) {
        state.bairro = (resultado.demandInfo as any).bairro;
      }
    }

    // Montar resposta de apresentação
    const hora = new Date().getHours();
    let periodo = 'Olá';
    if (hora >= 5 && hora < 12) periodo = 'Bom dia';
    else if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
    else periodo = 'Boa noite';

    const saudacao = `${periodo}! Aqui é a Luma, da SEMSUR de Parnamirim.\n\n`;
    
    // Verificar o que falta
    const temDescricao = Boolean(state.descricao);
    const temEndereco = Boolean(state.endereco);

    let complemento = '';
    if (temDescricao && temEndereco) {
      complemento = `Entendi o problema: ${state.descricao}\nLocal: ${state.endereco}\n\nPra eu registrar, pode me mandar uma foto do problema?`;
    } else if (temDescricao && !temEndereco) {
      complemento = `Entendi o problema: ${state.descricao}\n\nPra eu registrar, preciso saber onde fica. Qual o endereço ou bairro?`;
    } else if (!temDescricao && temEndereco) {
      complemento = `Você mencionou ${state.endereco}. Pode me contar qual o problema que tá acontecendo aí?`;
    } else {
      complemento = resultado.text || 'Me parece que você quer fazer um registro, né? Me conta com mais detalhes o que tá acontecendo e onde fica.';
    }

    return saudacao + complemento;
  }

  /**
   * Verifica se o texto contém informações de demanda (não é só saudação)
   */
  private contemInformacaoDemanda(texto: string): boolean {
    const textoLower = texto.toLowerCase();
    
    // Palavras que indicam demanda
    const palavrasDemanda = [
      'buraco', 'buracos', 'poste', 'lâmpada', 'lampada', 'luz', 'iluminação', 'iluminacao',
      'lixo', 'entulho', 'sujeira', 'mato', 'capim', 'árvore', 'arvore', 'poda', 'galho',
      'bueiro', 'esgoto', 'água', 'agua', 'alagamento', 'enxurrada', 'calçada', 'calcada',
      'placa', 'sinalização', 'sinalizacao', 'rua', 'avenida', 'quebrado', 'quebrada',
      'problema', 'reclamar', 'reclamação', 'denunciar', 'denúncia', 'denuncia',
      'conserto', 'consertar', 'arrumar', 'arrumem', 'resolver', 'precisando',
      'tá caindo', 'ta caindo', 'tá estragado', 'ta estragado', 'não funciona', 'nao funciona',
      'praça', 'praca', 'parque', 'escola', 'creche', 'posto', 'hospital',
      'abandonado', 'abandonada', 'faz tempo', 'há dias', 'ha dias', 'semanas', 'meses'
    ];

    // Verificar se contém palavras de demanda
    const contemPalavra = palavrasDemanda.some(p => textoLower.includes(p));
    
    // Verificar se menciona localização
    const mencionaLocal = textoLower.includes('rua ') || 
                          textoLower.includes('av ') || 
                          textoLower.includes('avenida ') ||
                          textoLower.includes('bairro ') ||
                          textoLower.includes('próximo') ||
                          textoLower.includes('proximo') ||
                          textoLower.includes('perto de') ||
                          textoLower.includes('em frente') ||
                          textoLower.includes('esquina') ||
                          textoLower.includes('número') ||
                          textoLower.includes('numero');

    // Se tem palavra de demanda OU menção a local E texto tem mais de 15 caracteres
    return (contemPalavra || mencionaLocal) && texto.length > 15;
  }

  private async processarComGemini(telefone: string, nome: string, texto: string, state: EstadoConversa): Promise<string> {
    const contexto = this.construirContexto(state);

    this.logger.log(`🧠 Chamando Gemini para: "${texto.substring(0, 50)}..."`);
    
    try {
      // Adicionar timeout de 30 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Gemini demorou mais de 30s')), 30000);
      });

      const geminiPromise = this.geminiService.analisarTexto(texto, contexto);
      const resultado = await Promise.race([geminiPromise, timeoutPromise]);
      
      this.logger.log(`✅ Gemini respondeu: "${resultado.text?.substring(0, 100)}..."`);
      
      // Extrair informações da demanda do resultado
      if (resultado.demandInfo) {
        if (resultado.demandInfo.descricao) {
          state.descricao = resultado.demandInfo.descricao;
          state.etapa = 'coletando_localizacao';
          this.logger.log(`📋 Descrição salva: ${state.descricao}`);
        }
        if (resultado.demandInfo.endereco) {
          state.endereco = resultado.demandInfo.endereco;
          this.logger.log(`📍 Endereço salvo: ${state.endereco}`);
        }
        if (resultado.demandInfo.categoria) {
          state.categoria = resultado.demandInfo.categoria;
          this.logger.log(`🏷️ Categoria: ${state.categoria}`);
        }
        // Salvar bairro se identificado
        if ((resultado.demandInfo as any).bairro) {
          state.bairro = (resultado.demandInfo as any).bairro;
          this.logger.log(`🏘️ Bairro: ${state.bairro}`);
        }
      }

      // Verificar se deve criar demanda (tem descrição + endereço + foto)
      if (this.devecriarDemanda(resultado.text, state)) {
        this.logger.log(`Criando demanda automaticamente...`);
        const demanda = await this.criarDemandaAutomatica(telefone, nome, state);
        if (demanda) {
          this.conversas.delete(telefone);
          return `Pronto! Sua demanda foi registrada.\n\nProtocolo: ${demanda.protocol}\nProblema: ${state.descricao}\nLocal: ${state.endereco || 'Informado via GPS'}\n\nGuarde esse protocolo pra acompanhar o andamento. Obrigada pelo contato!`;
        }
      }

      // Se já tem descrição, verificar o que falta e pedir de forma natural
      if (state.descricao) {
        const temEndereco = Boolean(state.endereco) || Boolean(state.localizacao?.lat);
        const temFoto = state.midias.some(m => m.tipo === 'imagem' || m.tipo === 'video');
        
        // Pedir o que falta, um de cada vez
        if (!temFoto && !temEndereco) {
          return resultado.text || 'Entendi. Agora me manda uma foto do problema pra eu ver melhor a situação?';
        } else if (!temFoto) {
          return resultado.text || 'Beleza! Pode me mandar uma foto do problema?';
        } else if (!temEndereco) {
          return resultado.text || 'Certo! Onde fica isso? Pode me passar o endereço ou compartilhar a localização?';
        }
      }

      return resultado.text;
    } catch (error) {
      this.logger.error(`Erro Gemini: ${error.message}`);
      
      // Resposta fallback se Gemini falhar
      if (state.etapa === 'coletando_descricao') {
        return `Entendi, ${nome}! Me conta com mais detalhes o que tá acontecendo e onde fica (rua, bairro).`;
      }
      
      return 'Desculpa, tive um probleminha aqui. Pode repetir o que você disse?';
    }
  }

  private async processarAudio(
    telefone: string,
    nome: string,
    audioBuffer: Buffer | undefined,
    mimeType: string | undefined,
    state: EstadoConversa,
  ): Promise<string> {
    if (!audioBuffer) {
      return 'Opa, não consegui receber o áudio. Pode tentar enviar de novo?';
    }

    this.logger.log(`🎵 Processando áudio de ${nome} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

    try {
      // Converter buffer para base64
      const audioBase64 = audioBuffer.toString('base64');
      
      const resultado = await this.geminiService.analisarAudio(audioBase64, mimeType || 'audio/ogg');

      if (resultado.transcricao) {
        state.contextoConversa.push({ role: 'user', content: '[Áudio]: ' + resultado.transcricao });
      }
      
      // Extrair informações
      if (resultado.descricao) {
        state.descricao = resultado.descricao;
      }
      if (resultado.endereco) {
        state.endereco = resultado.endereco;
      }
      if (resultado.categoria) {
        state.categoria = resultado.categoria;
      }

      // Verificar se é primeira interação e precisa se apresentar
      let saudacao = '';
      if (!state.jaSeSaudou) {
        const hora = new Date().getHours();
        let periodo = 'Olá';
        if (hora >= 5 && hora < 12) periodo = 'Bom dia';
        else if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
        else periodo = 'Boa noite';
        saudacao = `${periodo}! Aqui é a Luma, da SEMSUR de Parnamirim.\n\n`;
        state.jaSeSaudou = true;
      }

      // Verificar se tem tudo pra criar demanda
      const temDescricao = Boolean(state.descricao);
      const temEndereco = Boolean(state.endereco) || Boolean(state.localizacao?.lat);
      const temFoto = state.midias.some(m => m.tipo === 'imagem' || m.tipo === 'video');

      if (temDescricao && temEndereco && temFoto) {
        // Tem tudo! Criar demanda
        const demanda = await this.criarDemandaAutomatica(telefone, nome, state);
        if (demanda) {
          this.conversas.delete(telefone);
          return `${saudacao}Pronto! Sua demanda foi registrada.\n\nProtocolo: ${demanda.protocol}\nProblema: ${state.descricao}\nLocal: ${state.endereco || 'Informado via GPS'}\n\nGuarde esse protocolo pra acompanhar o andamento. Obrigada pelo contato!`;
        }
      }

      // Verificar o que falta e pedir
      if (temDescricao && temEndereco && !temFoto) {
        return `${saudacao}Entendi o que você disse! Só preciso de uma foto do problema pra finalizar o registro.`;
      } else if (temDescricao && !temEndereco) {
        return `${saudacao}Entendi o problema! Agora me diz onde fica? Pode passar o endereço ou compartilhar a localização.`;
      } else if (!temDescricao) {
        // Gerar resposta genérica
        const resposta = await this.geminiService.gerarResposta(
          `Cidadão ${nome} enviou um áudio: "${resultado.transcricao}". Problema: ${resultado.descricao || 'não identificado'}`,
          { categoria: resultado.categoria, endereco: resultado.endereco }
        );
        return `${saudacao}${resposta}`;
      }

      // Gerar resposta
      const resposta = await this.geminiService.gerarResposta(
        `Cidadão ${nome} enviou um áudio: "${resultado.transcricao}". Problema: ${resultado.descricao || 'não identificado'}`,
        { categoria: resultado.categoria, endereco: resultado.endereco }
      );

      return `${saudacao}${resposta}`;
    } catch (error) {
      this.logger.error(`Erro ao processar áudio: ${error.message}`);
      return 'Não consegui entender o áudio. Pode digitar ou mandar de novo?';
    }
  }

  private async processarImagem(
    telefone: string,
    nome: string,
    imageBuffer: Buffer | undefined,
    mimeType: string | undefined,
    caption: string | undefined,
    state: EstadoConversa,
  ): Promise<string> {
    if (!imageBuffer) {
      return 'Opa, não consegui receber a imagem. Pode tentar enviar de novo?';
    }

    this.logger.log(`🖼️ Processando imagem de ${nome} (${(imageBuffer.length / 1024).toFixed(1)} KB)${caption ? ` - Legenda: "${caption}"` : ''}`);

    // Salvar mídia no estado
    state.midias.push({ tipo: 'imagem', buffer: imageBuffer, mimeType: mimeType || 'image/jpeg' });

    try {
      // Converter buffer para base64
      const imageBase64 = imageBuffer.toString('base64');
      
      const resultado = await this.geminiService.analisarImagem(imageBase64, mimeType || 'image/jpeg', caption);

      state.contextoConversa.push({ role: 'user', content: `[Imagem enviada] ${caption || resultado.descricao}` });

      // Extrair informações da imagem
      if (resultado.descricao && !state.descricao) {
        state.descricao = resultado.descricao;
      }
      if (resultado.endereco && !state.endereco) {
        state.endereco = resultado.endereco;
      }
      if (resultado.categoria) {
        state.categoria = resultado.categoria;
      }

      // Se veio com legenda, extrair mais informações
      if (caption && caption.length > 10) {
        const analiseCaption = await this.geminiService.analisarTexto(caption, 
          `Esta é a legenda de uma foto enviada. Extrair endereço, bairro ou descrição adicional do problema.`
        );
        if (analiseCaption.demandInfo?.endereco && !state.endereco) {
          state.endereco = analiseCaption.demandInfo.endereco;
        }
        if ((analiseCaption.demandInfo as any)?.bairro && !state.bairro) {
          state.bairro = (analiseCaption.demandInfo as any).bairro;
        }
      }

      // Verificar se precisa se apresentar
      let saudacao = '';
      if (!state.jaSeSaudou) {
        const hora = new Date().getHours();
        let periodo = 'Olá';
        if (hora >= 5 && hora < 12) periodo = 'Bom dia';
        else if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
        else periodo = 'Boa noite';
        saudacao = `${periodo}! Aqui é a Luma, da SEMSUR de Parnamirim.\n\n`;
        state.jaSeSaudou = true;
      }

      // Verificar se pode criar demanda
      const temEndereco = Boolean(state.endereco) || Boolean(state.localizacao?.lat);
      const temDescricao = Boolean(state.descricao);
      
      if (temDescricao && temEndereco) {
        // Tem tudo, criar demanda!
        const demanda = await this.criarDemandaAutomatica(telefone, nome, state);
        if (demanda) {
          this.conversas.delete(telefone);
          return `${saudacao}Pronto! Sua demanda foi registrada.\n\nProtocolo: ${demanda.protocol}\nProblema: ${state.descricao}\nLocal: ${state.endereco || 'Informado via GPS'}\n\nGuarde esse protocolo pra acompanhar o andamento. Obrigada pelo contato!`;
        }
      }

      // Se não tem endereço, pedir
      if (!temEndereco) {
        if (temDescricao) {
          return `${saudacao}Recebi a foto! Vi que é um problema de ${state.descricao?.substring(0, 50) || 'serviço urbano'}. Onde fica isso? Me passa o endereço ou compartilha a localização.`;
        }
        return `${saudacao}Recebi a foto! Onde fica isso? Me passa o endereço ou compartilha a localização.`;
      }

      // Se não tem descrição mas tem foto e endereço, a foto já serve como descrição
      if (!temDescricao && temEndereco) {
        state.descricao = resultado.descricao || 'Problema identificado via foto';
        const demanda = await this.criarDemandaAutomatica(telefone, nome, state);
        if (demanda) {
          this.conversas.delete(telefone);
          return `${saudacao}Pronto! Sua demanda foi registrada.\n\nProtocolo: ${demanda.protocol}\nProblema: ${state.descricao}\nLocal: ${state.endereco || 'Informado via GPS'}\n\nGuarde esse protocolo pra acompanhar o andamento. Obrigada pelo contato!`;
        }
      }

      // Gerar resposta se tiver tudo menos algo
      const resposta = await this.geminiService.gerarResposta(
        `Cidadão ${nome} enviou uma imagem mostrando: ${resultado.descricao}. ${resultado.demandaDetectada ? 'É uma demanda de serviço urbano.' : ''}`,
        { categoria: resultado.categoria, endereco: resultado.endereco, urgencia: resultado.urgencia }
      );

      return `${saudacao}${resposta}`;
    } catch (error) {
      this.logger.error(`Erro ao processar imagem: ${error.message}`);
      return 'Recebi a imagem! Me conta o que tá acontecendo e onde fica pra eu registrar?';
    }
  }

  private async processarVideo(
    telefone: string,
    nome: string,
    videoBuffer: Buffer | undefined,
    mimeType: string | undefined,
    caption: string | undefined,
    state: EstadoConversa,
  ): Promise<string> {
    if (!videoBuffer) {
      return 'Opa, não consegui receber o vídeo. Pode tentar enviar de novo?';
    }

    // Limite de 10MB para processamento
    const maxSize = 10 * 1024 * 1024;
    if (videoBuffer.length > maxSize) {
      return `Esse vídeo tá um pouco grande (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB). Pode mandar um menor ou me descrever por texto?`;
    }

    this.logger.log(`🎬 Processando vídeo de ${nome} (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Salvar mídia
    state.midias.push({ tipo: 'video', buffer: videoBuffer, mimeType: mimeType || 'video/mp4' });

    try {
      // Converter buffer para base64
      const videoBase64 = videoBuffer.toString('base64');
      
      const resultado = await this.geminiService.analisarVideo(videoBase64, mimeType || 'video/mp4');

      state.contextoConversa.push({ role: 'user', content: `[Vídeo enviado] ${caption || resultado.descricao}` });

      // Extrair informações
      if (resultado.descricao) {
        state.descricao = resultado.descricao;
      }
      if (resultado.endereco) {
        state.endereco = resultado.endereco;
      }
      if (resultado.categoria) {
        state.categoria = resultado.categoria;
      }

      // Verificar se precisa se apresentar
      let saudacao = '';
      if (!state.jaSeSaudou) {
        const hora = new Date().getHours();
        let periodo = 'Olá';
        if (hora >= 5 && hora < 12) periodo = 'Bom dia';
        else if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
        else periodo = 'Boa noite';
        saudacao = `${periodo}! Aqui é a Luma, da SEMSUR de Parnamirim.\n\n`;
        state.jaSeSaudou = true;
      }

      // Verificar se tem tudo pra criar demanda
      const temDescricao = Boolean(state.descricao);
      const temEndereco = Boolean(state.endereco) || Boolean(state.localizacao?.lat);

      if (temDescricao && temEndereco) {
        // Tem tudo! Criar demanda
        const demanda = await this.criarDemandaAutomatica(telefone, nome, state);
        if (demanda) {
          this.conversas.delete(telefone);
          return `${saudacao}Pronto! Sua demanda foi registrada.\n\nProtocolo: ${demanda.protocol}\nProblema: ${state.descricao}\nLocal: ${state.endereco || 'Informado via GPS'}\n\nGuarde esse protocolo pra acompanhar o andamento. Obrigada pelo contato!`;
        }
      }

      // Pedir o que falta
      if (temDescricao && !temEndereco) {
        return `${saudacao}Recebi o vídeo! Vi o problema. Onde fica isso? Me passa o endereço ou compartilha a localização.`;
      }

      // Gerar resposta
      const resposta = await this.geminiService.gerarResposta(
        `Cidadão ${nome} enviou um vídeo mostrando: ${resultado.descricao}. ${resultado.demandaDetectada ? 'É uma demanda de serviço urbano.' : ''}`,
        { categoria: resultado.categoria, endereco: resultado.endereco, urgencia: resultado.urgencia }
      );

      return `${saudacao}${resposta}`;
    } catch (error) {
      this.logger.error(`Erro ao processar vídeo: ${error.message}`);
      return 'Recebi o vídeo! Me conta o que tá acontecendo e onde fica?';
    }
  }

  private async processarLocalizacao(
    telefone: string,
    nome: string,
    latitude: number | undefined,
    longitude: number | undefined,
    state: EstadoConversa,
  ): Promise<string> {
    if (!latitude || !longitude) {
      return 'Opa, não consegui capturar a localização. Pode tentar enviar de novo?';
    }

    this.logger.log(`📍 Localização recebida de ${nome}: ${latitude}, ${longitude}`);

    state.localizacao = { lat: latitude, lng: longitude };
    state.contextoConversa.push({ role: 'user', content: `[Localização: ${latitude}, ${longitude}]` });

    // Verificar se precisa se apresentar
    let saudacao = '';
    if (!state.jaSeSaudou) {
      const hora = new Date().getHours();
      let periodo = 'Olá';
      if (hora >= 5 && hora < 12) periodo = 'Bom dia';
      else if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
      else periodo = 'Boa noite';
      saudacao = `${periodo}! Aqui é a Luma, da SEMSUR de Parnamirim.\n\n`;
      state.jaSeSaudou = true;
    }

    // Tentar obter endereço aproximado
    let mensagemEndereco = '';
    try {
      const endereco = await this.geocodificarReverso(latitude, longitude);
      if (endereco) {
        state.endereco = endereco.endereco;
        state.bairro = endereco.bairro;
        mensagemEndereco = `Endereço aproximado: ${endereco.endereco}`;
        if (endereco.bairro) {
          mensagemEndereco += `\nBairro: ${endereco.bairro}`;
        }
      }
    } catch (e) {
      // Ignorar erro de geocodificação
    }

    // Verificar se já tem descrição e foto
    const temDescricao = Boolean(state.descricao);
    const temFoto = state.midias.some(m => m.tipo === 'imagem' || m.tipo === 'video');

    if (temDescricao && temFoto) {
      // Tem tudo! Criar demanda
      this.logger.log(`📝 Tudo completo, criando demanda automaticamente...`);
      const demanda = await this.criarDemandaAutomatica(telefone, nome, state);
      if (demanda) {
        this.conversas.delete(telefone);
        return `${saudacao}Pronto! Sua demanda foi registrada.\n\nProtocolo: ${demanda.protocol}\nProblema: ${state.descricao}\nLocal: ${state.endereco || `GPS: ${latitude}, ${longitude}`}\n\nGuarde esse protocolo pra acompanhar o andamento. Obrigada pelo contato!`;
      }
      return `${saudacao}Desculpa, deu um probleminha aqui. Pode tentar de novo?`;
    }

    if (temDescricao && !temFoto) {
      return `${saudacao}${mensagemEndereco}\n\nLocalização registrada! Agora só falta uma foto do problema pra eu finalizar o registro.`;
    }

    if (!temDescricao && temFoto) {
      return `${saudacao}${mensagemEndereco}\n\nLocalização registrada! Mas me conta, qual o problema que aparece na foto que você mandou?`;
    }

    return `${saudacao}Beleza, localização registrada!\n${mensagemEndereco}\n\nAgora me conta, qual o problema que você quer relatar?`;
  }

  private async processarSticker(telefone: string, nome: string, state: EstadoConversa): Promise<string> {
    const respostas = [
      'Haha, gostei! Em que posso te ajudar?',
      'Haha! Precisa de algo?',
      'Olá! Como posso ajudar hoje?',
    ];
    return respostas[Math.floor(Math.random() * respostas.length)];
  }

  private async processarDocumento(telefone: string, nome: string, caption: string | undefined, state: EstadoConversa): Promise<string> {
    return `Recebi o documento${caption ? ` "${caption}"` : ''}. No momento só consigo analisar imagens, vídeos e áudios. Pode descrever por texto o que você precisa?`;
  }

  private async enviarResposta(telefone: string, texto: string): Promise<void> {
    this.logger.log(`📤 Enviando resposta para ${telefone}: "${texto.substring(0, 100)}..."`);
    
    // Quebrar mensagens muito longas
    const maxLength = 4000;
    
    try {
      if (texto.length <= maxLength) {
        await this.baileysService.enviarTexto(telefone, texto);
      } else {
        // Dividir em partes
        const partes = texto.match(/.{1,4000}/gs) || [];
        for (const parte of partes) {
          await this.baileysService.enviarTexto(telefone, parte);
          await this.delay(500);
        }
      }
      this.logger.log(`✅ Resposta enviada com sucesso`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar resposta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia resposta em áudio usando Gemini TTS
   * Só é chamado quando o usuário pede explicitamente por áudio
   */
  private async  enviarRespostaEmAudio(telefone: string, texto: string): Promise<boolean> {
    this.logger.log(`🎤 Gerando resposta em áudio para ${telefone}...`);
    
    try {
      // Mostrar "gravando áudio..." enquanto gera o TTS
      await this.baileysService.mostrarGravandoAudio(telefone);
      
      // Gerar áudio usando Gemini TTS
      const audioPCM = await this.geminiService.gerarAudio(texto);
      
      if (!audioPCM) {
        this.logger.warn('⚠️ Não foi possível gerar áudio TTS');
        await this.baileysService.pararDigitando(telefone);
        return false;
      }

      // Converter PCM para formato OGG Opus usando ffmpeg
      const audioBuffer = await this.converterParaOggOpus(audioPCM);
      
      if (!audioBuffer) {
        this.logger.warn('⚠️ Não foi possível converter áudio');
        await this.baileysService.pararDigitando(telefone);
        return false;
      }

      // Parar "gravando..." antes de enviar
      await this.baileysService.pararDigitando(telefone);

      // Enviar áudio via WhatsApp
      const sucesso = await this.baileysService.enviarAudio(telefone, audioBuffer);
      
      if (sucesso) {
        this.logger.log(`✅ Resposta em áudio enviada com sucesso`);
      }
      
      return sucesso;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar áudio: ${error.message}`);
      await this.baileysService.pararDigitando(telefone);
      return false;
    }
  }

  /**
   * Converte áudio PCM para OGG Opus usando ffmpeg
   * PCM: 24kHz, mono, 16-bit → OGG Opus
   */
  private async converterParaOggOpus(pcmBuffer: Buffer): Promise<Buffer | null> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      // Criar arquivos temporários
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const pcmPath = path.join(tempDir, `audio_${timestamp}.pcm`);
      const oggPath = path.join(tempDir, `audio_${timestamp}.ogg`);
      
      // Salvar PCM
      fs.writeFileSync(pcmPath, pcmBuffer);
      
      // Converter usando ffmpeg
      // PCM: signed 16-bit little-endian, 24kHz, mono → OGG Opus
      const cmd = `ffmpeg -f s16le -ar 24000 -ac 1 -i "${pcmPath}" -c:a libopus -b:a 32k "${oggPath}" -y 2>/dev/null`;
      
      await execAsync(cmd);
      
      // Ler arquivo convertido
      const oggBuffer = fs.readFileSync(oggPath);
      
      // Limpar arquivos temporários
      fs.unlinkSync(pcmPath);
      fs.unlinkSync(oggPath);
      
      this.logger.log(`✅ Áudio convertido: ${(pcmBuffer.length / 1024).toFixed(1)}KB PCM → ${(oggBuffer.length / 1024).toFixed(1)}KB OGG`);
      
      return oggBuffer;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao converter áudio (ffmpeg pode não estar instalado): ${error.message}`);
      
      // Fallback: tentar enviar como MP3 se ffmpeg não estiver disponível
      // Alguns sistemas podem ter libmp3lame
      try {
        return await this.converterParaMp3(pcmBuffer);
      } catch {
        return null;
      }
    }
  }

  /**
   * Fallback: Converter PCM para MP3
   */
  private async converterParaMp3(pcmBuffer: Buffer): Promise<Buffer | null> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const pcmPath = path.join(tempDir, `audio_${timestamp}.pcm`);
      const mp3Path = path.join(tempDir, `audio_${timestamp}.mp3`);
      
      fs.writeFileSync(pcmPath, pcmBuffer);
      
      // Tentar converter para MP3
      const cmd = `ffmpeg -f s16le -ar 24000 -ac 1 -i "${pcmPath}" -c:a libmp3lame -b:a 64k "${mp3Path}" -y 2>/dev/null`;
      
      await execAsync(cmd);
      
      const mp3Buffer = fs.readFileSync(mp3Path);
      
      fs.unlinkSync(pcmPath);
      fs.unlinkSync(mp3Path);
      
      return mp3Buffer;
    } catch {
      return null;
    }
  }

  private async criarDemandaAutomatica(telefone: string, nome: string, state: EstadoConversa): Promise<any> {
    try {
      this.logger.log(`📝 Criando demanda: ${state.descricao?.substring(0, 50)}...`);
      
      // Buscar secretaria padrão (SEMSUR)
      const secretaria = await this.prisma.secretary.findFirst({
        where: { acronym: 'SEMSUR', isActive: true },
        include: { categories: { where: { isActive: true } } },
      });

      if (!secretaria) {
        this.logger.warn('❌ Secretaria SEMSUR não encontrada');
        // Buscar qualquer secretaria ativa
        const qualquerSecretaria = await this.prisma.secretary.findFirst({
          where: { isActive: true },
          include: { categories: { where: { isActive: true }, take: 1 } },
        });
        if (!qualquerSecretaria) {
          this.logger.error('❌ Nenhuma secretaria encontrada no sistema');
          return null;
        }
      }

      const secAtiva = secretaria || await this.prisma.secretary.findFirst({
        where: { isActive: true },
        include: { categories: { where: { isActive: true } } },
      });

      if (!secAtiva) return null;

      // Buscar categoria baseada na análise do Gemini
      let categoria = secAtiva.categories[0];
      if (state.categoria) {
        const categoriaEncontrada = secAtiva.categories.find(c => 
          c.slug.toLowerCase().includes(state.categoria!.toLowerCase()) ||
          c.name.toLowerCase().includes(state.categoria!.toLowerCase())
        );
        if (categoriaEncontrada) {
          categoria = categoriaEncontrada;
          this.logger.log(`🏷️ Categoria identificada: ${categoria.name}`);
        }
      }

      if (!categoria) {
        // Criar categoria padrão se não existir
        this.logger.warn('⚠️ Nenhuma categoria encontrada, usando padrão');
        categoria = await this.prisma.category.create({
          data: {
            name: 'Outros',
            slug: 'outros',
            description: 'Demandas gerais',
            secretaryId: secAtiva.id,
            priority: 'MEDIUM',
            slaDays: 15,
          },
        });
      }

      // Gerar protocolo único
      const protocol = this.generateProtocol();

      // Criar demanda no banco
      const demanda = await this.prisma.demand.create({
        data: {
          protocol,
          title: this.gerarTitulo(state.descricao || 'Demanda via WhatsApp'),
          description: state.descricao || 'Demanda registrada via WhatsApp',
          status: 'OPEN',
          priority: 'MEDIUM',
          source: 'WHATSAPP',
          requesterName: nome,
          requesterPhone: state.jid || telefone, // Salvar JID completo para poder responder
          secretaryId: secAtiva.id,
          categoryId: categoria.id,
          latitude: state.localizacao?.lat,
          longitude: state.localizacao?.lng,
          address: state.endereco,
          neighborhood: state.bairro,
          slaDeadline: new Date(Date.now() + categoria.slaDays * 24 * 60 * 60 * 1000),
        },
      });

      // 📸 Salvar anexos (imagens e vídeos)
      const imagensUrls: string[] = [];
      if (state.midias.length > 0) {
        this.logger.log(`📎 Salvando ${state.midias.length} anexo(s)...`);
        
        // Criar pasta de uploads se não existir
        const uploadsDir = path.join(process.cwd(), 'uploads', 'demands', demanda.id);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        for (let i = 0; i < state.midias.length; i++) {
          const midia = state.midias[i];
          try {
            // Determinar extensão pelo mimeType
            const extensao = this.getExtensaoFromMimeType(midia.mimeType);
            const filename = `anexo_${i + 1}${extensao}`;
            const filepath = path.join(uploadsDir, filename);
            
            // Salvar arquivo
            fs.writeFileSync(filepath, midia.buffer);
            
            // URL relativa para acesso via API
            const url = `/uploads/demands/${demanda.id}/${filename}`;
            imagensUrls.push(url);

            // Salvar no banco como attachment
            await this.prisma.attachment.create({
              data: {
                demandId: demanda.id,
                type: midia.tipo === 'imagem' ? 'IMAGE' : midia.tipo === 'video' ? 'VIDEO' : 'DOCUMENT',
                url: url,
                filename: filename,
                mimeType: midia.mimeType,
                size: midia.buffer.length,
              },
            });

            this.logger.log(`✅ Anexo salvo: ${filename} (${(midia.buffer.length / 1024).toFixed(1)} KB)`);
          } catch (err) {
            this.logger.error(`❌ Erro ao salvar anexo ${i + 1}: ${err.message}`);
          }
        }
      }

      this.logger.log(`
╔══════════════════════════════════════════════════════════════╗
║  ✅ DEMANDA CRIADA COM SUCESSO!                              ║
╠══════════════════════════════════════════════════════════════╣
║  📋 Protocolo: ${protocol.padEnd(43)}║
║  👤 Solicitante: ${nome.substring(0, 40).padEnd(41)}║
║  📞 Telefone: ${telefone.padEnd(44)}║
║  🏷️ Categoria: ${categoria.name.substring(0, 40).padEnd(43)}║
║  📍 Endereço: ${(state.endereco || 'GPS').substring(0, 40).padEnd(44)}║
║  📎 Anexos: ${String(imagensUrls.length).padEnd(47)}║
╚══════════════════════════════════════════════════════════════╝
`);

      // 🔔 Emitir evento via WebSocket para atualização em tempo real no frontend
      try {
        this.eventsGateway.emitDemandCreated({
          id: demanda.id,
          protocol: demanda.protocol,
          title: demanda.title,
          description: demanda.description,
          address: demanda.address,
          neighborhood: demanda.neighborhood,
          latitude: demanda.latitude,
          longitude: demanda.longitude,
          status: demanda.status,
          priority: demanda.priority,
          source: demanda.source,
          secretaryId: demanda.secretaryId,
          categoryId: demanda.categoryId,
          category: { name: categoria.name },
          requesterName: demanda.requesterName,
          createdAt: demanda.createdAt,
          images: imagensUrls, // 📸 Incluir URLs das imagens
        });
        this.logger.log('📡 Evento WebSocket emitido: demand:created');
      } catch (wsError) {
        this.logger.warn(`⚠️ Erro ao emitir WebSocket: ${wsError.message}`);
      }
      
      return demanda;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar demanda: ${error.message}`);
      this.logger.error(error.stack);
      return null;
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  private isSaudacao(texto: string): boolean {
    const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'eae', 'hello', 'hi', 'hey'];
    return saudacoes.some(s => texto.startsWith(s) || texto === s);
  }

  /**
   * Detecta se o usuário quer consultar o status de uma demanda
   */
  private isIntencaoConsultaProtocolo(texto: string): boolean {
    const palavrasConsulta = [
      'protocolo', 'consultar', 'consulta', 'status', 'andamento',
      'minha demanda', 'meu pedido', 'minha solicitação', 'minha solicitacao',
      'como está', 'como esta', 'como tá', 'como ta',
      'verificar', 'acompanhar', 'resultado', 'situação', 'situacao',
      'já resolveram', 'ja resolveram', 'foi resolvido', 'resolveu'
    ];
    return palavrasConsulta.some(p => texto.includes(p));
  }

  /**
   * Extrai número de protocolo do texto
   * Formato esperado: YYYYMM-XXXXXX (ex: 202601-ABC123)
   */
  private extrairProtocolo(texto: string): string | null {
    // Padrão do protocolo: 6 dígitos + hífen + 6 caracteres alfanuméricos
    const regex = /(\d{6}-[A-Z0-9]{6})/i;
    const match = texto.toUpperCase().match(regex);
    return match ? match[1] : null;
  }

  /**
   * Consulta o status de uma demanda pelo protocolo
   */
  private async consultarProtocolo(protocolo: string, state: EstadoConversa): Promise<string> {
    this.logger.log(`🔍 Consultando protocolo: ${protocolo}`);
    
    try {
      const demand = await this.prisma.demand.findUnique({
        where: { protocol: protocolo.toUpperCase() },
        include: {
          category: true,
          secretary: { select: { name: true, acronym: true } },
          history: { 
            orderBy: { createdAt: 'desc' }, 
            take: 3,
            include: {
              user: { select: { name: true } }
            }
          },
        },
      });
      
      if (!demand) {
        state.etapa = 'inicio';
        return `Não encontrei nenhuma demanda com o protocolo *${protocolo}*.\n\nVerifica se digitou certinho? O formato é tipo 202601-ABC123.\n\nSe precisar registrar uma nova demanda, é só me contar o problema!`;
      }
      
      // Formatar resposta
      const statusLabel = this.traduzirStatus(demand.status);
      const statusEmoji = this.getStatusEmoji(demand.status);
      const dataCriacao = new Date(demand.createdAt).toLocaleDateString('pt-BR');
      
      let resposta = `📋 *Consulta de Protocolo*\n\n`;
      resposta += `🔢 *Protocolo:* ${demand.protocol}\n`;
      resposta += `📝 *Problema:* ${demand.title || demand.description?.substring(0, 100)}\n`;
      resposta += `📍 *Local:* ${demand.address || demand.neighborhood || 'Não informado'}\n`;
      resposta += `${statusEmoji} *Status:* ${statusLabel}\n`;
      resposta += `🏛️ *Responsável:* ${demand.secretary?.name || 'SEMSUR'}\n`;
      resposta += `📅 *Registrada em:* ${dataCriacao}\n`;
      
      if (demand.resolvedAt) {
        const dataResolucao = new Date(demand.resolvedAt).toLocaleDateString('pt-BR');
        resposta += `✅ *Resolvida em:* ${dataResolucao}\n`;
      }
      
      // Adicionar últimas atualizações do histórico
      if (demand.history && demand.history.length > 0) {
        resposta += `\n📌 *Últimas atualizações:*\n`;
        for (const h of demand.history.slice(0, 3)) {
          const dataHist = new Date(h.createdAt).toLocaleDateString('pt-BR');
          const acao = this.traduzirAcaoHistorico(h.action);
          resposta += `• ${dataHist}: ${acao}`;
          if (h.user?.name) resposta += ` (${h.user.name})`;
          resposta += `\n`;
        }
      }
      
      resposta += `\nPrecisa de mais alguma coisa?`;
      
      // Resetar estado para início
      state.etapa = 'inicio';
      state.protocoloConsultado = protocolo;
      
      return resposta;
    } catch (error) {
      this.logger.error(`Erro ao consultar protocolo: ${error.message}`);
      state.etapa = 'inicio';
      return 'Desculpa, tive um probleminha ao consultar. Pode tentar novamente em alguns segundos?';
    }
  }

  /**
   * Traduz o status do banco para português amigável
   */
  private traduzirStatus(status: string): string {
    const labels: Record<string, string> = {
      'OPEN': '📬 Aberta - Aguardando análise',
      'IN_PROGRESS': '🔧 Em Andamento - Equipe trabalhando',
      'PENDING': '⏳ Pendente - Aguardando recursos',
      'WAITING_INFO': '❓ Aguardando Informação',
      'FORWARDED': '➡️ Encaminhada para outro setor',
      'RESOLVED': '✅ Resolvida',
      'CLOSED': '📁 Fechada',
      'CANCELLED': '❌ Cancelada',
    };
    return labels[status] || status;
  }

  /**
   * Retorna emoji apropriado para o status
   */
  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      'OPEN': '📬',
      'IN_PROGRESS': '🔧',
      'PENDING': '⏳',
      'WAITING_INFO': '❓',
      'FORWARDED': '➡️',
      'RESOLVED': '✅',
      'CLOSED': '📁',
      'CANCELLED': '❌',
    };
    return emojis[status] || '📋';
  }

  /**
   * Traduz ações do histórico
   */
  private traduzirAcaoHistorico(action: string): string {
    const acoes: Record<string, string> = {
      'CREATED': 'Demanda registrada',
      'STATUS_CHANGED': 'Status atualizado',
      'ASSIGNED': 'Atribuída a responsável',
      'COMMENT_ADDED': 'Comentário adicionado',
      'FORWARDED': 'Encaminhada',
      'RESOLVED': 'Marcada como resolvida',
      'REOPENED': 'Reaberta',
      'PRIORITY_CHANGED': 'Prioridade alterada',
    };
    return acoes[action] || action;
  }

  /**
   * Anti-loop: Evita repetir respostas similares
   */
  private evitarRepeticao(resposta: string, state: EstadoConversa): string {
    if (state.ultimasRespostas.length === 0) return resposta;
    
    const respostaLower = resposta.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Verificar se é muito similar às últimas respostas
    for (const ultimaResposta of state.ultimasRespostas) {
      const ultimaLower = ultimaResposta.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Calcular similaridade simples (% de palavras em comum)
      const palavrasNova = new Set(respostaLower.split(' ').filter(p => p.length > 3));
      const palavrasUltima = new Set(ultimaLower.split(' ').filter(p => p.length > 3));
      
      if (palavrasNova.size === 0 || palavrasUltima.size === 0) continue;
      
      let emComum = 0;
      palavrasNova.forEach(p => {
        if (palavrasUltima.has(p)) emComum++;
      });
      
      const similaridade = emComum / Math.max(palavrasNova.size, palavrasUltima.size);
      
      // Se muito similar (>70%), gerar variação
      if (similaridade > 0.7) {
        this.logger.log(`🔄 Anti-loop: resposta ${(similaridade * 100).toFixed(0)}% similar, gerando variação`);
        return this.gerarVariacaoResposta(resposta, state);
      }
    }
    
    return resposta;
  }

  /**
   * Gera variação de resposta para evitar repetição
   */
  private gerarVariacaoResposta(respostaOriginal: string, state: EstadoConversa): string {
    // Verificar o que falta
    const temDescricao = Boolean(state.descricao);
    const temEndereco = Boolean(state.endereco) || Boolean(state.localizacao?.lat);
    const temFoto = state.midias.some(m => m.tipo === 'imagem' || m.tipo === 'video');

    // Gerar resposta alternativa baseada no que falta
    if (!temFoto && !temEndereco && !temDescricao) {
      const opcoes = [
        'Me conta, qual problema você quer relatar?',
        'Posso te ajudar com algo? Me diz o que tá acontecendo.',
        'Tô aqui pra ajudar! Qual a situação?',
      ];
      return opcoes[Math.floor(Math.random() * opcoes.length)];
    }
    
    if (temDescricao && !temFoto && !temEndereco) {
      const opcoes = [
        'Beleza, entendi o problema. Agora preciso saber onde fica e ver uma foto, pode ser?',
        'Certo! Me manda o endereço e uma foto do local?',
        'Anotado. Onde exatamente isso tá acontecendo? E tem como mandar foto?',
      ];
      return opcoes[Math.floor(Math.random() * opcoes.length)];
    }
    
    if (temDescricao && temEndereco && !temFoto) {
      const opcoes = [
        'Quase lá! Só falta uma foto do problema pra eu registrar.',
        'Só preciso de uma foto pra finalizar o registro.',
        'Pode me mandar uma imagem do problema?',
      ];
      return opcoes[Math.floor(Math.random() * opcoes.length)];
    }
    
    if (temDescricao && !temEndereco && temFoto) {
      const opcoes = [
        'Vi a foto! Agora me diz onde fica isso?',
        'Recebi a imagem. Qual o endereço do local?',
        'Entendi pela foto. Pode me passar o endereço ou compartilhar a localização?',
      ];
      return opcoes[Math.floor(Math.random() * opcoes.length)];
    }

    // Se não se encaixa em nenhum caso, retorna original com pequena modificação
    return respostaOriginal.replace('Beleza', 'Certo').replace('Entendi', 'Anotei');
  }

  private getSaudacao(nome: string): string {
    const hora = new Date().getHours();
    let periodo = 'Olá';
    
    if (hora >= 5 && hora < 12) periodo = 'Bom dia';
    else if (hora >= 12 && hora < 18) periodo = 'Boa tarde';
    else periodo = 'Boa noite';

    return `${periodo}, ${nome}! Aqui é a Luma, da SEMSUR de Parnamirim.

Em que posso te ajudar hoje?`;
  }

  private getMenuAjuda(): string {
    return `Oi! Sou a Luma, da SEMSUR de Parnamirim. Posso te ajudar com:

📝 *Registrar problema* - Me conta o que tá acontecendo (buraco, poste apagado, lixo, poda, bueiro, etc)

🔍 *Consultar protocolo* - Digite "consultar" ou me envie o número do protocolo pra saber o status da sua demanda

Pra registrar uma nova solicitação, preciso de:
• Descrição do problema
• Endereço ou localização
• Uma foto do problema

No que posso te ajudar?`;
  }

  private construirContexto(state: EstadoConversa): string {
    if (state.contextoConversa.length === 0) return '';

    const ultimasMensagens = state.contextoConversa.slice(-6);
    let contexto = 'Contexto da conversa:\n';
    
    for (const msg of ultimasMensagens) {
      const role = msg.role === 'user' ? 'Cidadão' : 'Assistente';
      contexto += `${role}: ${msg.content}\n`;
    }

    if (state.descricao) contexto += `\nProblema relatado: ${state.descricao}`;
    if (state.localizacao) contexto += `\nLocalização: ${state.localizacao.lat}, ${state.localizacao.lng}`;
    if (state.endereco) contexto += `\nEndereço: ${state.endereco}`;

    return contexto;
  }

  private devecriarDemanda(resposta: string, state: EstadoConversa): boolean {
    // OBRIGATÓRIO: descrição + endereço + foto
    const temDescricao = Boolean(state.descricao);
    const temLocalizacaoGPS = Boolean(state.localizacao?.lat && state.localizacao?.lng);
    const temEnderecoTexto = Boolean(state.endereco);
    const temLocalizacao = temLocalizacaoGPS || temEnderecoTexto;
    const temFoto = state.midias.some(m => m.tipo === 'imagem' || m.tipo === 'video');
    
    this.logger.debug(`Verificando criacao demanda: desc=${temDescricao}, loc=${temLocalizacao}, foto=${temFoto}`);
    
    // Só cria demanda se tiver os 3: descrição + localização/endereço + foto
    return temDescricao && temLocalizacao && temFoto;
  }

  private generateProtocol(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${year}${month}-${random}`;
  }

  private gerarTitulo(descricao: string): string {
    const palavras = descricao.split(' ').slice(0, 8).join(' ');
    return palavras.length > 60 ? palavras.substring(0, 57) + '...' : palavras;
  }

  private getExtensaoFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/3gpp': '.3gp',
      'video/quicktime': '.mov',
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'application/pdf': '.pdf',
    };
    return mimeMap[mimeType] || '.bin';
  }

  private async geocodificarReverso(lat: number, lng: number): Promise<{ endereco: string; bairro?: string } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'SEMSUR-Bot/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const endereco = [
          addr.road,
          addr.house_number,
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town,
        ].filter(Boolean).join(', ');
        
        return {
          endereco: endereco || data.display_name,
          bairro: addr.suburb || addr.neighbourhood,
        };
      }
    } catch (e) {
      // Ignorar
    }
    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============ CONTROLE DO BOT ============

  ativarBot(): void {
    this.botAtivo = true;
    this.logger.log('✅ Bot ATIVADO');
  }

  desativarBot(): void {
    this.botAtivo = false;
    this.logger.log('❌ Bot DESATIVADO');
  }

  toggleBot(): boolean {
    this.botAtivo = !this.botAtivo;
    this.logger.log(`Bot ${this.botAtivo ? 'ATIVADO ✅' : 'DESATIVADO ❌'}`);
    return this.botAtivo;
  }

  getStatus(): { ativo: boolean; conectado: boolean; numero: string | null } {
    return {
      ativo: this.botAtivo,
      conectado: this.baileysService.estaConectado(),
      numero: this.baileysService.getNumeroConectado(),
    };
  }
}
