#!/bin/bash

# =====================================================
# Script de Deploy - Sistema de Gestão Urbana
# Prefeitura Municipal de Parnamirim/RN
# =====================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Sistema de Gestão Urbana - Parnamirim/RN          ║${NC}"
echo -e "${BLUE}║                    Deploy Script                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto!"
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado!"
fi

# Menu de opções
echo "Selecione a operação:"
echo "  1) Deploy Desenvolvimento"
echo "  2) Deploy Produção"
echo "  3) Build Frontend"
echo "  4) Backup do Banco de Dados"
echo "  5) Restaurar Backup"
echo "  6) Ver Logs"
echo "  7) Reiniciar Serviços"
echo "  8) Sair"
echo ""
read -p "Opção: " option

case $option in
    1)
        log "Iniciando deploy de desenvolvimento..."
        
        # Backend
        cd api
        log "Iniciando serviços Docker..."
        docker-compose up -d
        
        log "Aguardando serviços..."
        sleep 10
        
        log "Instalando dependências..."
        npm install
        
        log "Executando migrations..."
        npm run prisma:migrate
        
        log "Executando seed..."
        npm run prisma:seed || warning "Seed pode já ter sido executado"
        
        log "Iniciando API em modo desenvolvimento..."
        npm run start:dev &
        
        # Frontend
        cd ..
        log "Instalando dependências do frontend..."
        npm install
        
        log "Iniciando frontend..."
        npm run dev &
        
        success "Desenvolvimento iniciado!"
        echo ""
        echo "  🔹 Frontend: http://localhost:5173"
        echo "  🔹 API: http://localhost:3000"
        echo "  🔹 API Docs: http://localhost:3000/api/docs"
        echo "  🔹 pgAdmin: http://localhost:5050"
        echo ""
        ;;
        
    2)
        log "Iniciando deploy de produção..."
        
        # Verificar arquivo de ambiente
        if [ ! -f "api/.env.production" ]; then
            error "Arquivo api/.env.production não encontrado!"
        fi
        
        # Verificar certificados SSL
        if [ ! -f "api/docker/nginx/ssl/fullchain.pem" ]; then
            warning "Certificados SSL não encontrados em api/docker/nginx/ssl/"
            read -p "Continuar sem SSL? (s/n): " continueNoSSL
            if [ "$continueNoSSL" != "s" ]; then
                exit 1
            fi
        fi
        
        cd api
        
        log "Parando serviços existentes..."
        docker-compose -f docker-compose.prod.yml down || true
        
        log "Construindo imagens..."
        docker-compose -f docker-compose.prod.yml build
        
        log "Iniciando serviços..."
        docker-compose -f docker-compose.prod.yml up -d
        
        log "Aguardando serviços..."
        sleep 30
        
        log "Executando migrations..."
        docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
        
        success "Deploy de produção concluído!"
        echo ""
        echo "Verifique os logs com: docker-compose -f docker-compose.prod.yml logs -f"
        ;;
        
    3)
        log "Construindo frontend para produção..."
        
        npm run build
        
        success "Build concluído! Arquivos em dist/"
        echo ""
        echo "Para servir os arquivos, use um servidor web como Nginx."
        ;;
        
    4)
        log "Realizando backup do banco de dados..."
        
        BACKUP_FILE="backup_$(date +'%Y%m%d_%H%M%S').sql"
        
        cd api
        docker-compose exec -T postgres pg_dump -U admin parnamirim_gestao > "../backups/${BACKUP_FILE}"
        
        success "Backup salvo em backups/${BACKUP_FILE}"
        ;;
        
    5)
        log "Restaurando backup..."
        
        echo "Backups disponíveis:"
        ls -la backups/*.sql 2>/dev/null || error "Nenhum backup encontrado!"
        
        read -p "Nome do arquivo de backup: " backup_file
        
        if [ ! -f "backups/${backup_file}" ]; then
            error "Arquivo não encontrado!"
        fi
        
        cd api
        docker-compose exec -T postgres psql -U admin -d parnamirim_gestao < "../backups/${backup_file}"
        
        success "Backup restaurado!"
        ;;
        
    6)
        log "Exibindo logs..."
        
        echo "Qual serviço?"
        echo "  1) API"
        echo "  2) PostgreSQL"
        echo "  3) Redis"
        echo "  4) Evolution API"
        echo "  5) Todos"
        read -p "Opção: " log_option
        
        cd api
        
        case $log_option in
            1) docker-compose logs -f api ;;
            2) docker-compose logs -f postgres ;;
            3) docker-compose logs -f redis ;;
            4) docker-compose logs -f evolution-api ;;
            5) docker-compose logs -f ;;
            *) error "Opção inválida!" ;;
        esac
        ;;
        
    7)
        log "Reiniciando serviços..."
        
        cd api
        docker-compose restart
        
        success "Serviços reiniciados!"
        ;;
        
    8)
        echo "Até logo!"
        exit 0
        ;;
        
    *)
        error "Opção inválida!"
        ;;
esac

echo ""
log "Operação concluída!"
