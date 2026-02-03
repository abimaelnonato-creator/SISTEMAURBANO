# Sistema de Gestão Urbana - API

API Backend do Sistema de Gestão Urbana para a Prefeitura de Parnamirim/RN.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js para construção de APIs escaláveis
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL 15+** com **PostGIS** - Banco de dados relacional com suporte geoespacial
- **Redis** - Cache e gerenciamento de sessões
- **Socket.io** - WebSocket para atualizações em tempo real
- **JWT** - Autenticação stateless
- **Swagger** - Documentação automática da API

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório

```bash
cd api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário.

### 4. Inicie os serviços com Docker

```bash
docker-compose up -d
```

Isso irá iniciar:
- PostgreSQL com PostGIS (porta 5432)
- Redis (porta 6379)
- pgAdmin (porta 5050) - opcional
- Redis Commander (porta 8081) - opcional

### 5. Execute as migrations

```bash
npm run prisma:migrate
```

### 6. Execute o seed (dados iniciais)

```bash
npm run prisma:seed
```

### 7. Inicie o servidor de desenvolvimento

```bash
npm run start:dev
```

A API estará disponível em: `http://localhost:3000`

## 📚 Documentação da API

Acesse a documentação Swagger em: `http://localhost:3000/api/docs`

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação.

### Obter token

```bash
POST /api/v1/auth/login
{
  "email": "admin@parnamirim.rn.gov.br",
  "password": "admin123"
}
```

### Usar token

Inclua o header `Authorization: Bearer <token>` em todas as requisições autenticadas.

## 👥 Contas de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@parnamirim.rn.gov.br | admin123 |
| Coordenador | coordenador@parnamirim.rn.gov.br | coord123 |
| Operador | operador.semoi@parnamirim.rn.gov.br | operator123 |

## 📁 Estrutura do Projeto

```
api/
├── prisma/
│   ├── schema.prisma     # Schema do banco de dados
│   └── seed.ts           # Dados iniciais
├── src/
│   ├── infrastructure/   # Camada de infraestrutura
│   │   ├── database/     # Prisma service
│   │   ├── cache/        # Redis service
│   │   └── websocket/    # WebSocket gateway
│   ├── presentation/     # Camada de apresentação
│   │   └── modules/      # Módulos da API
│   │       ├── auth/         # Autenticação
│   │       ├── users/        # Usuários
│   │       ├── secretaries/  # Secretarias
│   │       ├── categories/   # Categorias
│   │       ├── demands/      # Demandas
│   │       ├── dashboard/    # Dashboard
│   │       ├── notifications/# Notificações
│   │       ├── reports/      # Relatórios
│   │       ├── geo/          # Geolocalização
│   │       └── whatsapp/     # Integração WhatsApp
│   ├── shared/           # Código compartilhado
│   │   ├── dto/          # DTOs genéricos
│   │   └── utils/        # Utilitários
│   ├── app.module.ts     # Módulo raiz
│   └── main.ts           # Bootstrap
├── docker-compose.yml    # Serviços Docker
└── .env.example          # Exemplo de variáveis
```

## 📡 Endpoints Principais

### Autenticação (`/auth`)
- `POST /login` - Login
- `POST /register` - Registro
- `POST /refresh` - Renovar token
- `POST /logout` - Logout
- `POST /forgot-password` - Recuperar senha

### Usuários (`/users`)
- `GET /` - Listar usuários
- `GET /me` - Dados do usuário logado
- `GET /:id` - Buscar por ID
- `POST /` - Criar usuário
- `PUT /:id` - Atualizar usuário
- `DELETE /:id` - Desativar usuário

### Secretarias (`/secretaries`)
- `GET /` - Listar secretarias
- `GET /active` - Secretarias ativas com categorias
- `GET /:id` - Detalhes
- `GET /:id/stats` - Estatísticas
- `POST /` - Criar
- `PUT /:id` - Atualizar

### Categorias (`/categories`)
- `GET /` - Listar categorias
- `GET /secretary/:id` - Por secretaria
- `GET /:id` - Detalhes
- `POST /` - Criar
- `PUT /:id` - Atualizar

### Demandas (`/demands`)
- `GET /` - Listar demandas (com filtros)
- `GET /nearby` - Demandas próximas (geolocalização)
- `GET /protocol/:protocol` - Consultar por protocolo
- `GET /:id` - Detalhes
- `GET /:id/history` - Histórico
- `GET /:id/comments` - Comentários
- `POST /` - Criar demanda
- `POST /public` - Criar demanda (sem autenticação)
- `PUT /:id` - Atualizar
- `PATCH /:id/status` - Alterar status
- `PATCH /:id/assign` - Atribuir operador
- `POST /:id/comments` - Adicionar comentário

### Dashboard (`/dashboard`)
- `GET /summary` - Resumo geral
- `GET /charts` - Dados para gráficos
- `GET /status-distribution` - Distribuição por status
- `GET /category-distribution` - Distribuição por categoria
- `GET /secretary-ranking` - Ranking de secretarias
- `GET /recent-activity` - Atividades recentes
- `GET /alerts` - Alertas do sistema

### Relatórios (`/reports`)
- `GET /general` - Relatório geral
- `GET /secretary/:id` - Por secretaria
- `GET /performance` - Desempenho
- `GET /neighborhoods` - Por bairros
- `GET /export/csv` - Exportar CSV

### Geolocalização (`/geo`)
- `POST /geocode` - Endereço → Coordenadas
- `GET /reverse` - Coordenadas → Endereço
- `GET /neighborhoods` - Lista de bairros
- `GET /locations` - Demandas no mapa
- `GET /heatmap` - Dados para mapa de calor
- `GET /clusters` - Clusters para mapa

### WhatsApp (`/whatsapp`)
- `GET /webhook` - Verificação do webhook
- `POST /webhook` - Receber mensagens
- `POST /send-notification` - Enviar notificação

## 🔧 Scripts

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Prisma
npm run prisma:migrate   # Executar migrations
npm run prisma:seed      # Popular banco
npm run prisma:studio    # Interface visual
npm run prisma:generate  # Gerar client

# Testes
npm run test
npm run test:e2e
npm run test:cov
```

## 🐳 Docker

### Ambiente de desenvolvimento

```bash
docker-compose up -d
```

### Deploy em Produção

1. **Copie e configure o arquivo de ambiente:**
```bash
cp .env.example .env.production
# Edite .env.production com valores de produção
```

2. **Configure os certificados SSL:**
```bash
mkdir -p docker/nginx/ssl
# Copie seus certificados (fullchain.pem e privkey.pem)
```

3. **Inicie os serviços:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **Execute as migrations:**
```bash
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec api npx prisma db seed
```

### Serviços disponíveis

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| API (NestJS) | 3000 | Backend principal |
| PostgreSQL | 5432 | Banco de dados |
| Redis | 6379 | Cache e filas |
| MinIO | 9000/9001 | Armazenamento S3 |
| Evolution API | 8080 | WhatsApp |
| pgAdmin | 5050 | Admin do PostgreSQL |
| Redis Commander | 8081 | Admin do Redis |

### Comandos úteis

```bash
# Ver logs
docker-compose logs -f api

# Reiniciar API
docker-compose restart api

# Backup do banco
docker-compose exec postgres pg_dump -U admin parnamirim_gestao > backup.sql

# Acessar container
docker-compose exec api sh
```

## 📦 Deploy

### Variáveis de produção essenciais

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_HOST=...
JWT_SECRET=<chave-segura>
CORS_ORIGINS=https://sistema.parnamirim.rn.gov.br
```

### Build de produção

```bash
npm run build
npm run start:prod
```

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Rate limiting configurável
- CORS configurado
- Validação de dados com class-validator
- Sanitização de inputs

## 📊 Monitoramento

- Logs estruturados
- Métricas de performance
- Auditoria de ações
- Healthchecks

## 🤝 Contribuição

1. Faça um fork
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da Prefeitura Municipal de Parnamirim/RN.
