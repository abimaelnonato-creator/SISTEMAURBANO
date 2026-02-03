#!/bin/bash

# ==============================================
# 🛑 SistmUrbano - Script de Parada
# ==============================================

echo "🛑 Parando SistmUrbano..."

cd /Users/abimaelsilva/Documents/sistmurbano

# Parar processos do PM2
pm2 stop all

echo ""
echo "✅ Sistema parado!"
echo ""
echo "💡 Para iniciar novamente: ./scripts/start.sh"
echo ""
