# 📱 GUIA DE CONEXÃO DO WHATSAPP

## Pré-requisitos
1. Docker e Docker Compose instalados
2. Número de WhatsApp Business (recomendado) ou pessoal
3. Smartphone com WhatsApp instalado

## Passo a Passo

### 1. Subir os containers
```bash
docker-compose up -d
```

### 2. Verificar se tudo está rodando
```bash
docker-compose ps
```

### 3. Acessar o painel da Evolution API
Abra no navegador: http://localhost:8080/manager

Credenciais padrão:
- API Key: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO

### 4. Conectar o WhatsApp

**Opção A - Via Painel Admin (Recomendado)**
1. Acesse o painel administrativo do sistema
2. Vá em Configurações > WhatsApp
3. Clique em "Conectar WhatsApp"
4. Escaneie o QR Code com o WhatsApp

**Opção B - Via Script**
```bash
npm run setup:whatsapp
# ou
npx ts-node scripts/setup-whatsapp.ts
```

**Opção C - Via API**
```bash
# Criar instância
curl -X POST "http://localhost:8080/instance/create" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "ouvidoria_parnamirim",
    "qrcode": true
  }'

# Obter QR Code
curl "http://localhost:8080/instance/connect/ouvidoria_parnamirim" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO"
```

### 5. Escanear o QR Code
1. Abra o WhatsApp no celular
2. Vá em Configurações > Aparelhos conectados
3. Clique em "Conectar um aparelho"
4. Escaneie o QR Code exibido

### 6. Verificar conexão
```bash
curl "http://localhost:8080/instance/connectionState/ouvidoria_parnamirim" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO"
```

Resposta esperada:
```json
{
  "instance": "ouvidoria_parnamirim",
  "state": "open"
}
```

## Troubleshooting

### QR Code não aparece
```bash
# Reiniciar a instância
curl -X POST "http://localhost:8080/instance/restart/ouvidoria_parnamirim" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO"
```

### Conexão caiu
O sistema tentará reconectar automaticamente. Se não funcionar:
```bash
# Deslogar
curl -X DELETE "http://localhost:8080/instance/logout/ouvidoria_parnamirim" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO"

# Reconectar
curl "http://localhost:8080/instance/connect/ouvidoria_parnamirim" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO"
```

### Deletar instância e recomeçar
```bash
curl -X DELETE "http://localhost:8080/instance/delete/ouvidoria_parnamirim" \
  -H "apikey: PARNAMIRIM_EVOLUTION_API_KEY_2024_MUDAR_EM_PRODUCAO"
```

## Logs úteis
```bash
# Logs da Evolution API
docker-compose logs -f evolution-api

# Logs da API principal
docker-compose logs -f api
```

## Webhook
O webhook está configurado para: `http://api:3000/whatsapp/webhook`

Eventos monitorados:
- `MESSAGES_UPSERT` - Novas mensagens recebidas
- `MESSAGES_UPDATE` - Atualizações de status
- `CONNECTION_UPDATE` - Mudanças na conexão
- `QRCODE_UPDATED` - Novo QR Code gerado
- `CALL` - Chamadas recebidas (rejeitadas automaticamente)
