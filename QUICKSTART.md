# 🚀 Setup Rápido - SSR Edition

## 1️⃣ Instalação (1 minuto)

```bash
cd diy-woodworking-blog
npm install
```

## 2️⃣ Configurar Stripe (2 minutos)

```bash
cp .env.example .env
```

Edite `.env`:

```env
PUBLIC_STRIPE_KEY=pk_test_sua_chave_aqui
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
SITE_URL=http://localhost:4321
```

**Obter chaves Stripe:**
1. [stripe.com](https://stripe.com) → Criar conta
2. Dashboard → Developers → API keys
3. Copiar Publishable key e Secret key

## 3️⃣ Rodar (30 segundos)

```bash
npm run dev
```

✅ Acesse http://localhost:4321

## 🧪 Testar Funcionalidades

### Testar Paywall
1. Vá para `/pt/blog/horta-madeira-1-dia`
2. Role até o final
3. Clique "Comprar Blueprints"
4. Será redirecionado para Stripe Checkout

### Testar API SSR
```bash
curl -X POST http://localhost:4321/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"blueprintId":"test","lang":"pt","currency":"eur","amount":500}'
```

## 🚀 Deploy Cloudflare Pages

### Via Dashboard

1. Push para GitHub
2. [dash.cloudflare.com](https://dash.cloudflare.com)
3. Pages → Create → Connect Git
4. Build: `npm run build` | Output: `dist`
5. Environment variables:
   - `PUBLIC_STRIPE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SITE_URL`

### Via CLI

```bash
npm install -g wrangler
wrangler login
npm run deploy
```

## 🎯 Configurar Webhook (Produção)

1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-site.pages.dev/api/stripe-webhook`
3. Events: `checkout.session.completed`
4. Copiar webhook secret
5. Adicionar em Cloudflare env vars

## 📝 Próximos Passos

1. ✅ Testar checkout local
2. ✅ Deploy Cloudflare
3. ✅ Configurar webhook
4. ✅ Implementar envio de email
5. ✅ Adicionar seus blueprints
6. ✅ Customizar conteúdo

## 🐛 Problemas Comuns

**API retorna erro 500**
→ Verifique se STRIPE_SECRET_KEY está em .env

**Webhook falha**
→ Configure STRIPE_WEBHOOK_SECRET

**Build falha**
→ `rm -rf node_modules && npm install`

---

**Tempo total: ~5 minutos**

Para docs completa, veja **README.md**
