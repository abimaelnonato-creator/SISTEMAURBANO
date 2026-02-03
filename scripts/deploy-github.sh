#!/bin/bash

# ==============================================
# 📤 SistmUrbano - Script de Deploy (Subir Alterações)
# ==============================================

echo "📤 Subindo alterações para o GitHub..."

cd /Users/abimaelsilva/Documents/sistmurbano

# Verificar se há alterações
if [[ -z $(git status --porcelain) ]]; then
    echo "ℹ️  Não há alterações para enviar."
    exit 0
fi

# Mostrar alterações
echo ""
echo "📋 Alterações detectadas:"
git status --short
echo ""

# Pedir mensagem do commit
read -p "📝 Mensagem do commit: " COMMIT_MSG

if [[ -z "$COMMIT_MSG" ]]; then
    COMMIT_MSG="Atualização do sistema - $(date '+%d/%m/%Y %H:%M')"
fi

# Adicionar, commitar e enviar
git add -A
git commit -m "$COMMIT_MSG"
git push origin main

echo ""
echo "✅ Alterações enviadas para o GitHub!"
echo ""
echo "🔗 https://github.com/abimaelnonato-creator/SISTEMAURBANO"
echo ""
