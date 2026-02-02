# 🧪 Teste Rápido - Sistema de Pagamento

## ⚡ Quick Start

```bash
# 1. Verificar setup
chmod +x test-stripe-setup.sh
./test-stripe-setup.sh

# 2. Terminal 1 - Servidor
npm run dev

# 3. Terminal 2 - Stripe Webhooks
stripe listen --forward-to localhost:4321/api/stripe-webhook

# 4. Navegador
# Abra: http://localhost:4321/pt/
```

## 💳 Cartão de Teste

```
Número: 4242 4242 4242 4242
Data: 12/34
CVC: 123
Email: teste@example.com
```

## 📋 Fluxo de Teste

1. ✅ Acesse http://localhost:4321/pt/blog
2. ✅ Clique em um post
3. ✅ Role até o paywall
4. ✅ Clique em "Desbloquear Blueprints"
5. ✅ Preencha com o cartão de teste
6. ✅ Complete o pagamento
7. ✅ Baixe o PDF na página de sucesso

## 📖 Documentação Completa

Veja `GUIA_TESTES_STRIPE.md` para instruções detalhadas.

## 🔍 Verificar se Funcionou

### No terminal do Stripe CLI:
```
✔️  Received event: checkout.session.completed
✔️  [200] POST http://localhost:4321/api/stripe-webhook
```

### No terminal do servidor:
```
📨 Webhook recebido: checkout.session.completed
✅ Pagamento completado
💾 Pagamento salvo
📧 Blueprint liberado
```

### No navegador:
- URL: `http://localhost:4321/pt/success?session_id=cs_test_...`
- Botão de download visível
- PDF baixa ao clicar

## 🎯 Endpoints Criados

- `/api/create-checkout-session` - Criar sessão de pagamento
- `/api/stripe-webhook` - Receber eventos do Stripe
- `/api/verify-payment` - Verificar se pagamento foi concluído
- `/api/download-blueprint` - Download protegido do PDF

## 🛠️ Arquivos Modificados

- `src/pages/api/stripe-webhook.ts` - ✅ Webhook handler completo
- `src/pages/api/verify-payment.ts` - ✅ Verificação de pagamento
- `src/pages/api/download-blueprint.ts` - ✅ Download protegido
- `src/pages/[lang]/success.astro` - ✅ Página de sucesso com download

## ❓ Problemas?

```bash
# Webhook não funciona?
1. Verifique se Stripe CLI está rodando
2. Copie o webhook secret para .env
3. Reinicie o servidor

# Download não funciona?
1. Verifique URL tem session_id
2. Abra DevTools (F12) e veja Console
3. Verifique logs do servidor
```
