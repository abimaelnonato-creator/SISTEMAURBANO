/**
 * Serviço de Personalidade Humanizada - Bot SEMSUR
 * Gera respostas naturais sem emojis
 */
import { Injectable } from '@nestjs/common';
import {
  SAUDACOES,
  CONFIRMACOES,
  TRANSICOES,
  EMPATIA,
  CORRECOES_ABREVIACOES,
  PALAVRAS_FRUSTRACAO,
  PALAVRAS_URGENCIA,
  PALAVRAS_SATISFACAO,
  INTENCOES,
} from './personality.constants';

export type HumorType = 'muito_frustrado' | 'frustrado' | 'urgente' | 'satisfeito' | 'confuso' | 'apressado' | 'neutro';
export type EmpatiaType = 'problema' | 'agradecimento' | 'espera' | 'entusiasmo' | 'compreensao';

@Injectable()
export class PersonalityService {
  
  /**
   * Obtém saudação baseada no horário atual
   */
  getSaudacao(): string {
    const hora = new Date().getHours();
    let periodo: keyof typeof SAUDACOES;
    
    if (hora >= 0 && hora < 5) {
      periodo = 'madrugada';
    } else if (hora >= 5 && hora < 12) {
      periodo = 'manha';
    } else if (hora >= 12 && hora < 18) {
      periodo = 'tarde';
    } else {
      periodo = 'noite';
    }
    
    const opcoes = SAUDACOES[periodo];
    return this.random(opcoes);
  }

  /**
   * Obtém confirmação aleatória
   */
  getConfirmacao(): string {
    return this.random(CONFIRMACOES);
  }

  /**
   * Obtém transição aleatória
   */
  getTransicao(): string {
    return this.random(TRANSICOES);
  }

  /**
   * Obtém expressão de empatia por tipo
   */
  getEmpatia(tipo: EmpatiaType): string {
    const opcoes = EMPATIA[tipo] || EMPATIA.problema;
    return this.random(opcoes);
  }

  /**
   * Normaliza texto com abreviações
   */
  normalizarTexto(texto: string): string {
    let normalizado = texto.toLowerCase();
    
    for (const [abrev, completo] of Object.entries(CORRECOES_ABREVIACOES)) {
      const regex = new RegExp(`\\b${abrev}\\b`, 'gi');
      normalizado = normalizado.replace(regex, completo);
    }
    
    return normalizado;
  }

  /**
   * Detecta humor/emoção do usuário
   */
  detectarHumor(texto: string): HumorType {
    const textoLower = texto.toLowerCase();
    
    // Análise de intensidade
    const intensificadores = (textoLower.match(/muito|demais|super|mega|hiper|extremamente/g) || []).length;
    const exclamacoes = (texto.match(/!/g) || []).length;
    const capslock = (texto.match(/[A-Z]{3,}/g) || []).length;
    
    // Score de frustração
    let scoreFrustrado = PALAVRAS_FRUSTRACAO.filter(p => textoLower.includes(p)).length;
    scoreFrustrado += intensificadores * 0.5 + exclamacoes * 0.3 + capslock * 0.5;
    
    if (scoreFrustrado >= 2) return 'muito_frustrado';
    if (scoreFrustrado >= 1) return 'frustrado';
    if (PALAVRAS_URGENCIA.some(p => textoLower.includes(p))) return 'urgente';
    if (PALAVRAS_SATISFACAO.some(p => textoLower.includes(p))) return 'satisfeito';
    
    // Palavras de confusão
    const confuso = ['não entendi', 'como assim', 'que', 'hã', 'como', 'onde', 'quando', 'qual', 'dúvida', 'não sei', 'confus', 'perdid'];
    if (confuso.some(p => textoLower.includes(p))) return 'confuso';
    
    // Palavras de pressa
    const apressado = ['rápido', 'logo', 'depressa', 'correndo', 'tô com pressa', 'não tenho tempo', 'seja breve'];
    if (apressado.some(p => textoLower.includes(p))) return 'apressado';
    
    return 'neutro';
  }

  /**
   * Gera resposta empática baseada no humor
   */
  gerarRespostaEmpatica(humor: HumorType): string {
    const respostas: Record<HumorType, string[]> = {
      muito_frustrado: [
        'Olha, eu entendo MUITO sua frustração, de verdade. Vou fazer de tudo pra resolver isso o mais rápido possível, tá? Pode confiar.',
        'Poxa, você tem toda razão de estar assim. Vou priorizar seu caso agora mesmo. Me conta tudo que eu vou resolver.',
        'Ei, me desculpa por tudo isso que você tá passando. Sei que é muito chato. Vou pessoalmente acompanhar isso daqui.',
        'Nossa, imagino como deve ser difícil. Olha, vou anotar aqui como urgente e acompanhar de perto, tá? Não vou te deixar na mão.',
        'Ah, que situação complicada... Eu sinto muito mesmo. Vou fazer o possível e o impossível aqui, pode deixar.',
      ],
      frustrado: [
        'Entendo sua frustração, viu! Pode deixar que vou priorizar isso!',
        'Puxa, desculpa pelo transtorno! Vou fazer de tudo pra resolver rapidinho!',
        'Sei que tá difícil, mas fica tranquilo que vou te ajudar!',
        'Poxa, você tem razão de estar chateado. Vamos resolver isso juntos!',
        'Nossa, imagino como deve ser chato. Vamos cuidar disso!',
        'Entendo totalmente. Vou fazer o possível pra agilizar!',
        'Ah, que chato isso! Mas relaxa que vou resolver.',
        'Putz, ninguém merece né. Deixa comigo!',
        'Eu entendo, de verdade. Bora resolver isso logo!',
      ],
      urgente: [
        'Entendi a urgência! Vou marcar como prioridade alta!',
        'Isso é sério mesmo! Já tô anotando como urgente!',
        'Vou acelerar isso ao máximo! Prioridade total!',
        'Não se preocupa, vou tratar como emergência!',
        'Pode deixar, vou dar atenção especial pra isso!',
        'Eita, isso precisa ser resolvido logo! Já tô cuidando!',
        'Opa, entendi! Vou priorizar isso aqui, é urgente!',
      ],
      satisfeito: [
        'Que bom que consegui te ajudar! Fico muito feliz!',
        'Fico feliz em ajudar! Precisando, é só chamar!',
        'Valeu pela confiança! Tamo junto sempre!',
        'Obrigada pela paciência! Qualquer coisa, é só voltar!',
        'Fico contente que deu tudo certo!',
        'Ah que bom! Fico feliz demais!',
        'Eba! Que bom que resolveu!',
        'Ahh fico muito feliz! Obrigada por usar nosso serviço!',
      ],
      confuso: [
        'Opa, deixa eu te explicar melhor!',
        'Hmm, acho que não fui clara. Vou explicar de novo!',
        'Ah, desculpa a confusão! Deixa eu reformular...',
        'Eita, acho que me enrolei. Vou explicar direitinho!',
        'Opa, vou tentar ser mais clara!',
      ],
      apressado: [
        'Bora lá então, vou ser rápida!',
        'Entendi, vou direto ao ponto!',
        'Ok, vou agilizar! Rapidinho:',
        'Beleza, vou ser breve!',
        'Show, direto ao assunto então!',
      ],
      neutro: [
        'Beleza, vou te ajudar com isso!',
        'Pode deixar comigo!',
        'Bora resolver isso!',
        'Vou cuidar disso pra você!',
        'Tranquilo, já vou resolver!',
        'Deixa comigo!',
        'Opa, bora lá!',
        'Show, vamos resolver!',
        'Beleza, conta comigo!',
        'Certinho, vou te ajudar!',
      ],
    };
    
    const opcoes = respostas[humor] || respostas.neutro;
    return this.random(opcoes);
  }

  /**
   * Identifica intenção do usuário
   */
  identificarIntencao(texto: string): string | null {
    let textoNormalizado = texto.toLowerCase().trim();
    
    // Remove acentos
    textoNormalizado = textoNormalizado
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    for (const [intencao, palavras] of Object.entries(INTENCOES)) {
      for (const palavra of palavras) {
        const palavraNormalizada = palavra
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        if (textoNormalizado === palavraNormalizada || 
            textoNormalizado.includes(palavraNormalizada)) {
          return intencao;
        }
      }
    }
    
    return null;
  }

  /**
   * Humaniza texto adicionando variações naturais
   */
  humanizarTexto(texto: string, intensidade: 'baixa' | 'media' | 'alta' = 'media'): string {
    if (intensidade === 'baixa') return texto;
    
    let resultado = texto;
    
    // Chance de adicionar interjeição no início (15%) - sempre aplica para media e alta
    if (Math.random() < 0.15) {
      const interjeicoesInicio = ['Ah, ', 'Hmm, ', 'Olha, ', 'Então, ', 'Bom, ', 'Opa, ', 'Ei, ', 'Olha só, ', 'Bora, ', 'Vamos lá, '];
      resultado = this.random(interjeicoesInicio) + resultado.charAt(0).toLowerCase() + resultado.slice(1);
    }
    
    // Chance de adicionar expressão no final (20%)
    if (Math.random() < 0.2 && !resultado.endsWith('!') && !resultado.endsWith('?')) {
      const finais = [' viu', ' tá', ' ok', ' né', '', '', ' beleza', ' certo'];
      resultado = resultado.replace(/[.!?]?$/, this.random(finais));
    }
    
    // Variação de capitalização (25%)
    if (resultado.length > 0 && Math.random() < 0.25) {
      resultado = resultado.charAt(0).toLowerCase() + resultado.slice(1);
    }
    
    return resultado;
  }

  /**
   * Gera saudação completa para boas-vindas
   */
  gerarSaudacaoCompleta(nomeContato?: string): string {
    const saudacao = this.getSaudacao();
    const nome = nomeContato ? nomeContato.split(' ')[0] : '';
    
    const templates = [
      `${saudacao} Eu sou a Luma, trabalho aqui na SEMSUR de Parnamirim.${nome ? ` Prazer, ${nome}!` : ''}

Tô aqui pra te ajudar com qualquer problema de zeladoria da nossa cidade - buraco, luz queimada, mato alto, essas coisas, sabe?

Me conta: o que tá acontecendo? Pode digitar, mandar áudio ou até foto do problema!`,

      `Oie, ${saudacao.toLowerCase().replace('!', '')}!${nome ? ` ${nome}, ` : ' '}Aqui é a Luma da SEMSUR.

Como posso te ajudar hoje? Se tiver algum problema na cidade - rua, praça, iluminação - é só me falar!

Pode descrever, mandar foto ou áudio que eu entendo.`,

      `${saudacao} Aqui é a Luma, sua atendente da SEMSUR Parnamirim.${nome ? ` Fala, ${nome}!` : ''}

Precisa relatar algum problema? Luz apagada, buraco, lixo acumulado... é comigo mesmo!

Me conta o que tá rolando - pode ser texto, áudio ou foto.`,

      `${saudacao}${nome ? ` ${nome},` : ''} Sou a Luma, da SEMSUR.

Tô aqui pra registrar qualquer problema que você ver na cidade. Buraco na rua, poste apagado, mato alto...

Só me contar o que tá precisando!`,
    ];
    
    return this.random(templates);
  }

  /**
   * Gera menu principal
   */
  gerarMenu(): string {
    const menus = [
      `E aí, como posso te ajudar?

1 - Quero registrar um problema
2 - Ver minha solicitação
3 - Saber mais sobre a SEMSUR
4 - Falar com uma pessoa

Escolhe uma opção ou já me conta direto o que tá precisando!`,

      `Bora lá! O que você precisa?

1 - Registrar problema na cidade
2 - Consultar meu protocolo
3 - Info sobre a SEMSUR
4 - Atendente humano

Pode escolher o número ou já descrever o problema!`,

      `Tô pronta pra te ajudar!

1 - Reportar problema
2 - Consultar solicitação
3 - Sobre a SEMSUR
4 - Falar com atendente

Digita o número ou me conta direto o que precisa!`,

      `Como posso te ajudar hoje?

1 - Registrar um problema
2 - Acompanhar solicitação
3 - Conhecer a SEMSUR
4 - Falar com alguém

É só escolher ou me contar o que precisa.`,
    ];
    
    return this.random(menus);
  }

  /**
   * Gera resposta de não entendimento
   */
  gerarNaoEntendi(): string {
    const respostas = [
      `Hmm, não consegui entender direito...

Pode explicar de outro jeito? Ou:
- Digita "menu" pra ver as opções
- Manda um áudio explicando
- Ou só conta o problema que eu te ajudo!`,

      `Opa, não peguei bem o que você quis dizer...

Tenta de novo? Pode digitar diferente, mandar áudio ou foto!`,

      `Desculpa, não entendi...

Me explica melhor? Pode ser por texto, áudio ou foto do problema!`,

      `Não consegui entender. Pode reformular?

Se quiser, digita "menu" que eu mostro as opções.`,

      `Hmm, não peguei... Pode explicar de outro jeito?`,
    ];
    
    return this.random(respostas);
  }

  /**
   * Gera resposta de despedida
   */
  gerarDespedida(): string {
    const despedidas = [
      `Até mais!

Se precisar, estamos aqui:
0800-2816400

Cuide-se!`,

      `Tchau tchau!

Volte sempre que precisar! A SEMSUR tá aqui pra ajudar.`,

      `Falou! Até a próxima!

Qualquer problema na cidade, já sabe: é só me chamar!`,

      `Valeu! Até mais!

Precisando, é só voltar.`,

      `Tchau! Fica com Deus!

Qualquer coisa, tô por aqui.`,
    ];
    
    return this.random(despedidas);
  }

  /**
   * Gera resposta de agradecimento
   */
  gerarAgradecimento(): string {
    const agradecimentos = [
      `${this.getEmpatia('agradecimento')}

A SEMSUR agradece seu contato! Juntos cuidamos de Parnamirim.

Se precisar de mais algo, é só chamar!`,

      `Imagina! Fico feliz em ajudar!

Qualquer coisa, estamos aqui! Valeu por cuidar da cidade com a gente!`,

      `Por nada! Foi um prazer!

Precisando, é só voltar. Até mais!`,

      `De nada! Precisando de mais alguma coisa, é só chamar.`,

      `Disponha! A SEMSUR tá aqui pra ajudar.`,
    ];
    
    return this.random(agradecimentos);
  }

  /**
   * Gera solicitação de atendente humano
   */
  gerarRespostaAtendente(): string {
    const respostas = [
      `Entendi! Vou te direcionar pra um atendente humano.

Enquanto isso, se for urgente:
0800-2816400

Atendimento: Segunda a Sexta, 8h às 17h

Aguarda um pouquinho que alguém vai te atender!`,

      `Claro! Deixa eu chamar alguém da equipe pra você...

Se não puder esperar:
0800-2816400 (grátis)

Horário: Seg-Sex, 8h-17h

Já já alguém te responde!`,

      `Pode deixar! Vou passar pra um atendente.

Se preferir ligar: 0800-2816400

Atendimento de segunda a sexta, 8h às 17h.`,
    ];
    
    return this.random(respostas);
  }

  /**
   * Gera confirmação de sucesso com protocolo
   */
  gerarSucessoDemanda(protocolo: string): string {
    const mensagens = [
      `Pronto, registrado com sucesso!

Seu protocolo é: ${protocolo}

Guarda esse número! Com ele você consulta o andamento.

Prazo estimado: 3 a 5 dias úteis pra análise

Nossa equipe vai verificar e você recebe atualizações aqui mesmo!

Posso ajudar em mais alguma coisa?`,

      `Demanda registrada!

Anota aí o seu protocolo: ${protocolo}

A galera da SEMSUR vai analisar e você fica sabendo das novidades por aqui.

Prazo médio: 3-5 dias úteis

Precisando de mais alguma coisa, é só chamar!`,

      `Tudo certo! Sua solicitação foi registrada.

Protocolo: ${protocolo}

Guarda esse número pra consultar depois. A equipe vai analisar e te dou retorno por aqui.

Prazo: 3 a 5 dias úteis.

Mais alguma coisa?`,
    ];
    
    return this.random(mensagens);
  }

  /**
   * Utilitário para selecionar item aleatório
   */
  private random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
