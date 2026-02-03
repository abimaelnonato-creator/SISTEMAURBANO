#!/bin/bash
# ===========================================
# Script de Teste do Webhook WhatsApp
# Simula mensagem recebida do Evolution API
# ===========================================

echo "🧪 Testando Webhook WhatsApp"
echo ""

# URL do backend
BACKEND_URL="http://localhost:3000/api/v1/whatsapp/webhook"

# Simular mensagem "1" (opção registrar demanda)
echo "📤 Enviando mensagem de teste (simulação de mensagem do WhatsApp)..."
echo ""

# Simular mensagem de boas-vindas
curl -X POST "$BACKEND_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "ouvidoria_parnamirim",
    "data": {
      "key": {
        "remoteJid": "5584999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST123456"
      },
      "pushName": "Cidadão Teste",
      "message": {
        "conversation": "Olá"
      },
      "messageType": "conversation",
      "messageTimestamp": '$(date +%s)'
    }
  }'

echo ""
echo ""
echo "✅ Webhook testado!"
echo ""
echo "📋 Verifique os logs do backend para ver o processamento"
echo "📊 Acesse o dashboard em http://localhost:5173 para ver as demandas"
echo ""
