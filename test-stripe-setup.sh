#!/bin/bash

# Script para testar setup do Stripe localmente

echo "🧪 Verificando setup do Stripe..."
echo ""

# Verificar se o .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Crie o arquivo .env com as chaves do Stripe"
    exit 1
fi

# Verificar variáveis necessárias
echo "📋 Verificando variáveis de ambiente..."

check_var() {
    if grep -q "^$1=" .env; then
        value=$(grep "^$1=" .env | cut -d '=' -f2)
        if [ "$value" = "whsec_your_webhook_secret_here" ] || [ -z "$value" ]; then
            echo "⚠️  $1: Não configurado (usando placeholder)"
            return 1
        else
            echo "✅ $1: Configurado"
            return 0
        fi
    else
        echo "❌ $1: Não encontrado no .env"
        return 1
    fi
}

check_var "PUBLIC_STRIPE_KEY"
check_var "STRIPE_SECRET_KEY"
webhook_ok=$(check_var "STRIPE_WEBHOOK_SECRET")
check_var "SITE_URL"

echo ""

# Verificar se as chaves são de test
if grep -q "pk_test" .env; then
    echo "✅ Usando chaves de TEST (correto para desenvolvimento)"
else
    echo "⚠️  Não detectadas chaves de test - verifique se está usando pk_test_ e sk_test_"
fi

echo ""
echo "🔧 Próximos passos:"
echo ""

if [ $? -eq 1 ]; then
    echo "1. Configure o Stripe CLI:"
    echo "   stripe listen --forward-to localhost:4321/api/stripe-webhook"
    echo ""
    echo "2. Copie o webhook secret (whsec_...) e adicione ao .env"
    echo ""
    echo "3. Reinicie o servidor: npm run dev"
    echo ""
fi

echo "Para iniciar os testes:"
echo ""
echo "Terminal 1 (Servidor):"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Stripe CLI):"
echo "  stripe listen --forward-to localhost:4321/api/stripe-webhook"
echo ""
echo "Navegador:"
echo "  http://localhost:4321/pt/"
echo ""
echo "📖 Veja GUIA_TESTES_STRIPE.md para instruções completas"
