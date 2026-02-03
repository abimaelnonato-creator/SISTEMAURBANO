#!/bin/bash

# ==============================================
# 🔄 SistmUrbano - Script de Atualização
# ==============================================

echo "🔄 Atualizando SistmUrbano..."

cd /Users/abimaelsilva/Documents/sistmurbano

# Baixar atualizações do GitHub
echo "📥 Baixando atualizações do GitHub..."
git pull origin main

# Instalar novas dependências (se houver)
echo "📦 Verificando dependências do Frontend..."
npm install

echo "📦 Verificando dependências do Backend..."
cd api && npm install && cd ..

# Rodar migrations do banco (se houver)
echo "🗄️  Aplicando migrations do banco..."
cd api && npx prisma migrate deploy && cd ..

# Reiniciar serviços
echo "🔄 Reiniciando serviços..."
pm2 restart all

echo ""
echo "✅ Atualização concluída!"
echo ""
pm2 status
echo ""
