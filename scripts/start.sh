#!/bin/bash

# ==============================================
# 🚀 SistmUrbano - Script de Inicialização
# ==============================================

echo "🚀 Iniciando SistmUrbano..."

# Carregar NVM e usar Node.js v20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 > /dev/null 2>&1

cd /Users/abimaelsilva/Documents/sistmurbano

# Criar pasta de logs se não existir
mkdir -p logs

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker não está rodando. Iniciando..."
    open -a Docker
    echo "⏳ Aguardando Docker iniciar (30s)..."
    sleep 30
fi

# Subir containers do banco de dados
echo "🐘 Subindo PostgreSQL e Redis..."
cd api && docker-compose up -d && cd ..

# Aguardar banco ficar pronto
echo "⏳ Aguardando banco de dados..."
sleep 5

# Parar processos anteriores do PM2
pm2 delete all 2>/dev/null

# Iniciar com PM2
echo "🔄 Iniciando serviços com PM2..."
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo ""
echo "📊 Status dos serviços:"
pm2 status

echo ""
echo "🌐 Acesse:"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000"
echo ""
echo "📱 WhatsApp conectado: 5584 7601-3532"
echo ""
echo "💡 Comandos úteis:"
echo "   pm2 status          - Ver status"
echo "   pm2 logs            - Ver logs em tempo real"
echo "   pm2 restart all     - Reiniciar tudo"
echo "   pm2 stop all        - Parar tudo"
echo ""
