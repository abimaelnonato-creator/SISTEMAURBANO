# 🏛️ Sistema de Gestão Urbana - Parnamirim/RN

## MVP - Primeiro Teste Funcional

Este é o sistema mínimo viável para testar o fluxo completo:
1. **Cidadão envia mensagem no WhatsApp**
2. **IA classifica a demanda**
3. **Demanda aparece no painel web**
4. **Dashboard mostra estatísticas em tempo real**

---

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js** 18+ 
- **npm** ou **yarn**

---

## 🚀 Instalação Rápida

### 1. Subir os containers (PostgreSQL, Redis, Evolution API)

```bash
docker-compose up -d
```

Aguarde ~30 segundos para todos os serviços iniciarem.

### 2. Configurar o Backend

```bash
cd api

# Instalar dependências
npm install

# Gerar cliente Prisma
npx prisma generate

# Criar tabelas no banco
npx prisma migrate dev --name init

# Popular com dados iniciais
npx prisma db seed
```

### 3. Iniciar o Backend

```bash
cd api
npm start
```

O backend estará disponível em: http://localhost:3000

### 4. Iniciar o Frontend (em outro terminal)

```bash
# Na raiz do projeto
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:5173

---

## 📱 Configurar WhatsApp (Evolution API)

### 1. Criar instância

```bash
curl -X POST http://localhost:8080/instance/create \
  -H 'apikey: PARNAMIRIM_KEY_2024' \
  -H 'Content-Type: application/json' \
  -d '{"instanceName":"ouvidoria_parnamirim","qrcode":true}'
```

### 2. Conectar WhatsApp

Acesse o Manager: http://localhost:8080/manager

- Use a API Key: `PARNAMIRIM_KEY_2024`
- Escaneie o QR Code com seu celular

### 3. Verificar conexão

```bash
curl -X GET http://localhost:8080/instance/connectionState/ouvidoria_parnamirim \
  -H 'apikey: PARNAMIRIM_KEY_2024'
```

---

## 🧪 Testar o Sistema

### Credenciais de Acesso

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@parnamirim.rn.gov.br | admin123 |
| Coordenador | coordenador@parnamirim.rn.gov.br | coord123 |
| Operador | operador.semoi@parnamirim.rn.gov.br | operator123 |

### URLs

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| Evolution API | http://localhost:8080 |
| Evolution Manager | http://localhost:8080/manager |

### Testar Webhook (simular mensagem WhatsApp)

```bash
chmod +x scripts/test-webhook.sh
./scripts/test-webhook.sh
```

### Testar Fluxo Completo

```bash
chmod +x scripts/test-full-flow.sh
./scripts/test-full-flow.sh
```

---

## 📊 Verificar Demandas Criadas

### Via API

```bash
# Listar todas as demandas
curl http://localhost:3000/api/v1/demands | jq

# Ver dashboard
curl http://localhost:3000/api/v1/dashboard/summary | jq
```

### Via Frontend

1. Acesse http://localhost:5173
2. Faça login com admin@parnamirim.rn.gov.br / admin123
3. Navegue para "Demandas" no menu lateral

---

## 🏗️ Arquitetura

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  WhatsApp User   │────▶│  Evolution API   │────▶│  NestJS Backend  │
│                  │     │  (port 8080)     │     │  (port 3000)     │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                         ┌─────────────────────────────────┼─────────────────────────────────┐
                         │                                 │                                 │
                         ▼                                 ▼                                 ▼
                ┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
                │                  │              │                  │              │                  │
                │   PostgreSQL     │              │      Redis       │              │   AI Service     │
                │   (port 5432)    │              │   (port 6379)    │              │  (classificação) │
                │                  │              │                  │              │                  │
                └──────────────────┘              └──────────────────┘              └──────────────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │                  │
                                                  │  React Frontend  │
                                                  │  (port 5173)     │
                                                  │                  │
                                                  └──────────────────┘
```

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs -f

# Reiniciar containers
docker-compose down
docker-compose up -d
```

### Erro de banco de dados

```bash
cd api

# Resetar banco
npx prisma migrate reset --force

# Recriar schema
npx prisma migrate dev --name init
npx prisma db seed
```

### Evolution API não conecta

1. Verifique se o container está rodando: `docker ps`
2. Verifique os logs: `docker logs parnamirim_evolution`
3. Tente recriar a instância

---

## 📁 Estrutura do Projeto

```
sistmurbano/
├── docker-compose.yml      # Containers (PostgreSQL, Redis, Evolution)
├── .env                    # Variáveis de ambiente do frontend
├── api/                    # Backend NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── modules/        # Módulo AI
│   │   └── presentation/   # Controllers, Services
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── .env
├── src/                    # Frontend React
│   ├── pages/
│   ├── components/
│   ├── store/
│   └── lib/api.ts
└── scripts/                # Scripts de teste
    ├── start-mvp.sh
    ├── test-webhook.sh
    └── test-full-flow.sh
```

---

## ✅ Checklist do Teste

- [ ] Containers rodando (`docker ps`)
- [ ] Backend iniciado (http://localhost:3000/api/health)
- [ ] Frontend iniciado (http://localhost:5173)
- [ ] WhatsApp conectado (QR Code escaneado)
- [ ] Enviar mensagem de teste no WhatsApp
- [ ] Verificar demanda criada no dashboard
- [ ] Alterar status da demanda
- [ ] Verificar notificação no WhatsApp

---

## 📞 Suporte

Em caso de dúvidas, verifique:
1. Logs do backend: Terminal onde rodou `npm start`
2. Logs dos containers: `docker-compose logs -f`
3. Console do navegador (F12)

**Desenvolvido para a Prefeitura de Parnamirim/RN** 🏛️
