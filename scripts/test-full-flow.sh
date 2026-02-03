#!/bin/bash
# ===========================================
# Script de Teste Completo - Fluxo WhatsApp -> Demanda
# Simula uma conversa completa para criar demanda
# ===========================================

echo "🧪 TESTE COMPLETO: Fluxo WhatsApp → IA → Demanda"
echo "================================================"
echo ""

BACKEND_URL="http://localhost:3000/api/v1/whatsapp/webhook"
PHONE="5584999999999@s.whatsapp.net"
TIMESTAMP=$(date +%s)

# Função para enviar mensagem
send_message() {
    local message="$1"
    local msg_id="MSG$(date +%s%N | cut -c1-10)"
    
    echo "📤 Enviando: \"$message\""
    
    curl -s -X POST "$BACKEND_URL" \
      -H "Content-Type: application/json" \
      -d "{
        \"event\": \"messages.upsert\",
        \"instance\": \"ouvidoria_parnamirim\",
        \"data\": {
          \"key\": {
            \"remoteJid\": \"$PHONE\",
            \"fromMe\": false,
            \"id\": \"$msg_id\"
          },
          \"pushName\": \"Maria Silva\",
          \"message\": {
            \"conversation\": \"$message\"
          },
          \"messageType\": \"conversation\",
          \"messageTimestamp\": $TIMESTAMP
        }
      }" | jq . 2>/dev/null || echo "OK"
    
    echo ""
    sleep 2
}

# Início da conversa
echo "👋 PASSO 1: Iniciando conversa..."
send_message "Olá"

echo "📋 PASSO 2: Selecionando opção 1 (nova demanda)..."
send_message "1"

echo "🏛️ PASSO 3: Selecionando categoria 1..."
send_message "1"

echo "📝 PASSO 4: Descrevendo o problema..."
send_message "Existe um buraco muito grande na Rua das Flores, número 150, próximo à padaria. O buraco está causando acidentes e precisa ser consertado urgentemente."

echo "📍 PASSO 5: Informando localização..."
send_message "Rua das Flores, 150 - Centro, Parnamirim/RN"

echo "✅ PASSO 6: Confirmando demanda..."
send_message "1"

echo ""
echo "================================================"
echo "✅ TESTE COMPLETO!"
echo ""
echo "📋 Verifique:"
echo "   1. Logs do backend para ver o processamento"
echo "   2. Dashboard em http://localhost:5173"
echo "   3. API de demandas: curl http://localhost:3000/api/v1/demands"
echo ""
echo "🔍 Consultar demandas criadas:"
echo "   curl -s http://localhost:3000/api/v1/demands | jq '.data[] | {protocol, title, status}'"
echo ""
