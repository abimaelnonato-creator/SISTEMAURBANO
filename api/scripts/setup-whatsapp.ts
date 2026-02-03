/**
 * Script para configuração inicial do WhatsApp
 * Execute: npx ts-node scripts/setup-whatsapp.ts
 */

import axios from 'axios';
import * as readline from 'readline';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'ouvidoria_parnamirim';
const WEBHOOK_URL = process.env.EVOLUTION_WEBHOOK_URL || 'http://api:3000/whatsapp/webhook';

const api = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'apikey': EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

function displayQRCode(qrData: any) {
  console.log('=' .repeat(50));
  console.log('📱 ESCANEIE O QR CODE COM O WHATSAPP');
  console.log('=' .repeat(50));
  
  if (qrData.base64) {
    console.log('\n🔗 QR Code (Base64):');
    console.log('Acesse o painel admin ou use um decoder online.\n');
    console.log(qrData.base64.substring(0, 100) + '...\n');
  }
  
  if (qrData.code) {
    console.log('📋 Código para parear (se disponível):');
    console.log(qrData.pairingCode || 'N/A');
  }
  
  console.log('\n⏳ Aguardando leitura do QR Code...');
  console.log('   (O QR Code expira em 40 segundos)\n');
}

async function waitForConnection(): Promise<void> {
  let attempts = 0;
  const maxAttempts = 60; // 2 minutos

  while (attempts < maxAttempts) {
    try {
      const { data } = await api.get(`/instance/connectionState/${INSTANCE_NAME}`);
      
      if (data.state === 'open') {
        console.log('\n✅ WhatsApp conectado com sucesso!');
        
        // Obter informações do número conectado
        const { data: info } = await api.get(`/instance/fetchInstances`, {
          params: { instanceName: INSTANCE_NAME },
        });
        
        if (info?.owner) {
          console.log(`📱 Número conectado: ${info.owner}`);
        }
        
        return;
      }
      
      process.stdout.write('.');
      await sleep(2000);
      attempts++;
      
    } catch (error) {
      await sleep(2000);
      attempts++;
    }
  }
  
  console.log('\n⚠️  Timeout aguardando conexão. Tente novamente.');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🏛️  SETUP DO WHATSAPP - OUVIDORIA PARNAMIRIM\n');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar se Evolution API está acessível
    console.log('\n📡 Verificando conexão com Evolution API...');
    await api.get('/');
    console.log('✅ Evolution API está online!\n');

    // 2. Verificar se instância já existe
    console.log('🔍 Verificando instâncias existentes...');
    const { data: instances } = await api.get('/instance/fetchInstances');
    
    const existingInstance = instances?.find?.((i: any) => i.instanceName === INSTANCE_NAME);
    
    if (existingInstance) {
      console.log(`⚠️  Instância "${INSTANCE_NAME}" já existe.`);
      const action = await question('Deseja (R)econectar, (D)eletar e recriar, ou (C)ancelar? ');
      
      if (action.toLowerCase() === 'd') {
        console.log('🗑️  Deletando instância...');
        await api.delete(`/instance/delete/${INSTANCE_NAME}`);
        console.log('✅ Instância deletada!\n');
      } else if (action.toLowerCase() === 'r') {
        console.log('🔄 Reconectando...');
        const { data: qr } = await api.get(`/instance/connect/${INSTANCE_NAME}`);
        displayQRCode(qr);
        await waitForConnection();
        rl.close();
        return;
      } else {
        console.log('❌ Operação cancelada.');
        rl.close();
        return;
      }
    }

    // 3. Criar instância
    console.log(`\n📱 Criando instância "${INSTANCE_NAME}"...`);
    
    const instancePayload = {
      instanceName: INSTANCE_NAME,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: WEBHOOK_URL,
        byEvents: true,
        base64: true,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE',
          'CALL',
        ],
      },
      settings: {
        rejectCall: true,
        msgCall: 'Desculpe, não recebemos chamadas. Por favor, envie uma mensagem de texto.',
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        syncFullHistory: false,
      },
    };

    const { data: instance } = await api.post('/instance/create', instancePayload);
    console.log('✅ Instância criada com sucesso!\n');

    // 4. Obter QR Code
    console.log('📱 Gerando QR Code...\n');
    const { data: qrData } = await api.get(`/instance/connect/${INSTANCE_NAME}`);
    
    displayQRCode(qrData);
    
    // 5. Aguardar conexão
    await waitForConnection();

    console.log('\n' + '=' .repeat(50));
    console.log('✅ SETUP CONCLUÍDO COM SUCESSO!');
    console.log('=' .repeat(50));
    console.log('\nO WhatsApp está pronto para receber mensagens.');
    console.log('Acesse o painel administrativo para gerenciar as demandas.\n');

  } catch (error: any) {
    console.error('\n❌ Erro durante o setup:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}

main();
