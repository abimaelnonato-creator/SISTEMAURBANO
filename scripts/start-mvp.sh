#!/bin/bash
# ===========================================
# Script de Teste MVP - Sistema de Gestão Urbana
# Parnamirim/RN
# ===========================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   🏛️  TESTE MVP - SISTEMA DE GESTÃO URBANA                  ║"
echo "║   Parnamirim/RN                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
print_step "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi
print_success "Docker está rodando"

# Start containers
print_step "Iniciando containers (PostgreSQL, Redis, Evolution API)..."
docker-compose up -d

# Wait for containers to be ready
print_step "Aguardando containers ficarem prontos..."
sleep 10

# Check container status
print_step "Verificando status dos containers..."
docker-compose ps

# Check PostgreSQL
print_step "Verificando PostgreSQL..."
if docker exec parnamirim_postgres pg_isready -U parnamirim -d gestao_urbana > /dev/null 2>&1; then
    print_success "PostgreSQL está pronto"
else
    print_warning "PostgreSQL ainda não está pronto, aguardando mais..."
    sleep 5
fi

# Check Redis
print_step "Verificando Redis..."
if docker exec parnamirim_redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis está pronto"
else
    print_warning "Redis ainda não está pronto"
fi

# Check Evolution API
print_step "Verificando Evolution API..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    print_success "Evolution API está rodando em http://localhost:8080"
else
    print_warning "Evolution API ainda está iniciando..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   📋 PRÓXIMOS PASSOS                                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Configurar banco de dados:"
echo "   cd api && npx prisma migrate dev && npx prisma db seed"
echo ""
echo "2. Iniciar backend:"
echo "   cd api && npm start"
echo ""
echo "3. Iniciar frontend (em outro terminal):"
echo "   npm run dev"
echo ""
echo "4. Criar instância WhatsApp no Evolution:"
echo "   curl -X POST http://localhost:8080/instance/create \\"
echo "     -H 'apikey: PARNAMIRIM_KEY_2024' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"instanceName\":\"ouvidoria_parnamirim\",\"qrcode\":true}'"
echo ""
echo "5. Conectar WhatsApp:"
echo "   Acesse: http://localhost:8080/manager"
echo "   Login com API Key: PARNAMIRIM_KEY_2024"
echo "   Escaneie o QR Code com seu celular"
echo ""
echo "6. Testar o sistema:"
echo "   - Backend: http://localhost:3000/api/docs"
echo "   - Frontend: http://localhost:5173"
echo "   - Login: admin@parnamirim.rn.gov.br / admin123"
echo ""
