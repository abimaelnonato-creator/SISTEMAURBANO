# 🏛️ Sistema de Gestão Urbana - Parnamirim/RN

Sistema completo de gestão de demandas urbanas para a Prefeitura Municipal de Parnamirim/RN.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-proprietary-red)

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Deploy](#deploy)
- [API](#api)
- [Contribuição](#contribuição)

## 🎯 Visão Geral

O Sistema de Gestão Urbana é uma plataforma integrada para:
- Recebimento de demandas da população via WhatsApp, web e outros canais
- Classificação automática por IA
- Encaminhamento para secretarias responsáveis
- Monitoramento de SLA e desempenho
- Relatórios e dashboards em tempo real

## ✨ Funcionalidades

### 📱 Frontend (React)
- Dashboard interativo com métricas em tempo real
- Gestão completa de demandas (CRUD)
- Mapa geolocalizado com PostGIS
- PWA para instalação em dispositivos móveis
- Modo offline com sincronização
- Interface responsiva e tema escuro

### 🔧 Backend (NestJS)
- API RESTful com documentação Swagger
- Autenticação JWT com refresh tokens
- WebSocket para atualizações em tempo real
- Sistema de filas (Bull/Redis) para processamento assíncrono
- Integração com WhatsApp (Evolution API)
- Classificação de demandas por IA (OpenAI)
- Upload de arquivos (MinIO/S3)
- Auditoria completa de ações

### 🤖 IA & Automação
- Classificação automática de demandas
- Extração de localização do texto
- Análise de imagens
- Sugestão de respostas automáticas

## 🛠️ Tecnologias

### Frontend
- **React 19** + TypeScript
- **Vite** - Build tool
- **TailwindCSS 4** - Estilização
- **Zustand** - Gerenciamento de estado
- **React Router 7** - Roteamento
- **Recharts** - Gráficos
- **Leaflet** - Mapas

### Backend
- **NestJS 11** - Framework Node.js
- **Prisma 5.22** - ORM
- **PostgreSQL 15** + PostGIS - Banco de dados
- **Redis 7** - Cache e filas
- **BullMQ** - Sistema de filas
- **Socket.io** - WebSocket
- **OpenAI** - IA para classificação

### Infraestrutura
- **Docker** + Docker Compose
- **MinIO** - Armazenamento S3
- **Nginx** - Reverse proxy
- **Evolution API** - WhatsApp

## 🚀 Instalação

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- npm ou yarn

### Desenvolvimento Local

1. **Clone o repositório:**
```bash
git clone https://github.com/prefeitura-parnamirim/gestao-urbana.git
cd gestao-urbana
```

2. **Configure as variáveis de ambiente:**
```bash
# Backend
cp api/.env.example api/.env

# Frontend
echo "VITE_API_URL=http://localhost:3000/api" > .env.local
```

3. **Inicie os serviços Docker:**
```bash
cd api
docker-compose up -d
```

4. **Instale as dependências e inicie:**
```bash
# Backend
cd api
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# Frontend (novo terminal)
cd ..
npm install
npm run dev
```

5. **Acesse:**
- Frontend: http://localhost:5173
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- pgAdmin: http://localhost:5050

### Contas de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@parnamirim.rn.gov.br | admin123 |
| Coordenador | coordenador@parnamirim.rn.gov.br | coord123 |
| Operador | operador.semoi@parnamirim.rn.gov.br | operator123 |

## 📁 Estrutura do Projeto

```
sistmurbano/
├── api/                    # Backend NestJS
│   ├── prisma/             # Schema e migrations
│   ├── src/
│   │   ├── infrastructure/ # Database, cache, queue, websocket
│   │   ├── modules/        # AI, Secretary, SLA, WhatsApp
│   │   ├── presentation/   # Controllers e DTOs
│   │   └── shared/         # Utilitários compartilhados
│   ├── docker/             # Configurações Docker
│   └── docker-compose.yml
│
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/              # Páginas da aplicação
│   ├── store/              # Estado global (Zustand)
│   ├── lib/                # Utilitários e API client
│   └── hooks/              # Custom hooks
│
├── public/                 # Assets públicos e PWA
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service Worker
│
└── scripts/                # Scripts de automação
```

## ⚙️ Configuração

### Variáveis de Ambiente (Backend)

Veja o arquivo completo em `api/.env.example`:

```env
# Essenciais
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
JWT_SECRET=sua-chave-secreta

# Integrações
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-api-key
OPENAI_API_KEY=sk-...

# Armazenamento
MINIO_ENDPOINT=localhost
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Variáveis de Ambiente (Frontend)

```env
VITE_API_URL=http://localhost:3000/api
```

## 🚢 Deploy

### Docker Compose (Produção)

1. **Configure o ambiente:**
```bash
cd api
cp .env.example .env.production
# Edite com valores de produção
```

2. **Configure SSL:**
```bash
mkdir -p docker/nginx/ssl
# Adicione fullchain.pem e privkey.pem
```

3. **Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **Migrations:**
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Build do Frontend

```bash
npm run build
# Os arquivos estarão em dist/
```

## 📚 API

A documentação completa da API está disponível em `/api/docs` (Swagger).

### Endpoints Principais

- `POST /api/v1/auth/login` - Autenticação
- `GET /api/v1/demands` - Listar demandas
- `POST /api/v1/demands` - Criar demanda
- `GET /api/v1/dashboard/summary` - Métricas do dashboard
- `POST /api/v1/whatsapp/webhook` - Webhook WhatsApp

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Rate limiting por IP
- CORS configurado
- Helmet para headers de segurança
- Validação de inputs
- Auditoria de ações
- Senhas hasheadas (bcrypt)

## 📊 Monitoramento

- Logs estruturados
- Health checks
- Métricas de performance
- Alertas de SLA

## 📄 Licença

Este software é propriedade da Prefeitura Municipal de Parnamirim/RN.
Uso restrito e não autorizado para distribuição externa.

---

**Desenvolvido para a Prefeitura Municipal de Parnamirim/RN** 🏛️
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
