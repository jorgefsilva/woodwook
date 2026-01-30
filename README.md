# 🌿 DIY Woodworking & Garden Blog - SSR Edition

Blog multilíngue (PT/ES/EN) com **Server-Side Rendering (SSR)** usando Astro + Cloudflare Workers. Inclui paywall Stripe para blueprints em alta resolução com API integrada.

## 🚀 Features

- ✅ **SSR com Cloudflare Workers**: Renderização no servidor
- ✅ **API Stripe Integrada**: Endpoints `/api/create-checkout-session` e `/api/stripe-webhook`
- ✅ **Multilíngue**: PT/ES/EN com i18n routing
- ✅ **Paywall Nativo**: Imagens PNG protegidas por pagamento
- ✅ **SEO Completo**: Hreflang, schema, sitemap
- ✅ **Production Ready**: Configurado para Cloudflare Pages

## 📦 Tecnologias

- **Framework**: Astro 4.16+ (SSR mode)
- **Adapter**: @astrojs/cloudflare
- **Styling**: Tailwind CSS 3.4+
- **Payments**: Stripe SDK v14+
- **Runtime**: Cloudflare Workers
- **Deploy**: Cloudflare Pages

## 🛠️ Setup Local

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Stripe (gratuita)

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### Configurar Stripe

Edite `.env` e adicione suas chaves Stripe:

```env
PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=http://localhost:4321
```

**Obter chaves:**
1. Acesse [stripe.com/dashboard](https://dashboard.stripe.com)
2. Developers → API keys
3. Copie:
   - **Publishable key** → `PUBLIC_STRIPE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### Executar

```bash
npm run dev
```

Acesse `http://localhost:4321`

## 🏗️ Arquitetura SSR

### Como Funciona

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─ Página renderizada no servidor (SSR)
       │  ↓
┌──────▼──────────────────┐
│  Cloudflare Worker      │
│  (Astro SSR Runtime)    │
└──────┬──────────────────┘
       │
       ├─ API Endpoints
       │  ├─ /api/create-checkout-session
       │  └─ /api/stripe-webhook
       │
       ↓
┌──────────────┐
│    Stripe    │
└──────────────┘
```

### Endpoints API

#### POST `/api/create-checkout-session`

Cria sessão Stripe Checkout.

**Request:**
```json
{
  "blueprintId": "horta-vertical-pt",
  "lang": "pt",
  "currency": "eur",
  "amount": 500
}
```

**Response:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST `/api/stripe-webhook`

Recebe eventos do Stripe (checkout completado, etc).

**Headers:**
- `stripe-signature`: Assinatura do webhook

**Eventos suportados:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## 📁 Estrutura do Projeto

```
diy-woodworking-blog/
├── src/
│   ├── components/
│   │   ├── AmazonList.astro
│   │   └── ImagePaywall.astro    # Integrado com API
│   ├── content/
│   │   ├── pt/horta-madeira-1-dia.mdx
│   │   ├── es/huerto-madera-1-dia.mdx
│   │   └── en/wooden-garden-1-day.mdx
│   ├── i18n/
│   ├── layouts/Layout.astro
│   └── pages/
│       ├── api/                   # ← SSR API Endpoints
│       │   ├── create-checkout-session.ts
│       │   └── stripe-webhook.ts
│       ├── [lang]/
│       │   ├── index.astro
│       │   ├── success.astro
│       │   └── blog/
│       └── index.astro
├── public/
│   └── blueprints/
├── astro.config.mjs               # output: 'server'
├── wrangler.toml                  # Cloudflare config
└── package.json
```

## 🌐 Deploy Cloudflare Pages

### Método 1: Via Dashboard (Recomendado)

1. **Push código para GitHub/GitLab**

2. **Cloudflare Dashboard**
   - Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
   - Workers & Pages → Create application → Pages
   - Connect to Git → Selecione repositório

3. **Configurar Build**
   ```
   Build command: npm run build
   Build output directory: dist
   ```

4. **Environment Variables**
   
   Settings → Environment variables → Add variable:
   
   ```
   PUBLIC_STRIPE_KEY = pk_test_...
   STRIPE_SECRET_KEY = sk_test_...
   STRIPE_WEBHOOK_SECRET = whsec_...
   SITE_URL = https://your-site.pages.dev
   ```

5. **Deploy!**

### Método 2: Via CLI (Wrangler)

```bash
# Instalar Wrangler globalmente
npm install -g wrangler

# Login no Cloudflare
wrangler login

# Build
npm run build

# Deploy
npm run deploy
# ou: wrangler pages deploy dist
```

### Configurar Webhook Stripe (Produção)

1. **Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**:
   ```
   URL: https://your-site.pages.dev/api/stripe-webhook
   Events: checkout.session.completed
   ```
3. **Copiar Webhook Secret** → Adicionar em Cloudflare env vars

## 💳 Fluxo de Pagamento

1. **Usuário clica "Comprar Blueprints"**
2. **Frontend** chama `/api/create-checkout-session` (SSR)
3. **Backend** cria sessão Stripe e retorna `session.id`
4. **Frontend** redireciona para Stripe Checkout
5. **Usuário paga** no Stripe
6. **Stripe** redireciona para `/[lang]/success`
7. **Stripe** envia webhook para `/api/stripe-webhook`
8. **Backend** processa webhook e envia email com blueprint

## 📧 Enviar Blueprints Automaticamente

Edite `src/pages/api/stripe-webhook.ts`:

```typescript
case 'checkout.session.completed':
  const session = event.data.object;
  const { blueprintId, lang } = session.metadata;
  const customerEmail = session.customer_details?.email;
  
  // Implementar envio de email
  await sendBlueprintEmail(customerEmail, blueprintId, lang);
  break;
```

**Opções para enviar email:**

### A) Cloudflare Workers + SendGrid
```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${context.env.SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: { email: 'noreply@yoursite.com' },
    personalizations: [{
      to: [{ email: customerEmail }],
      dynamic_template_data: { blueprintId, lang }
    }],
    template_id: 'd-...'
  })
});
```

### B) Resend (Recomendado)
```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(context.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'DIY Blog <noreply@yoursite.com>',
  to: customerEmail,
  subject: 'Seus Blueprints Estão Prontos!',
  html: `<h1>Obrigado pela compra!</h1>
         <p>Acesse seus blueprints: <a href="...">Download</a></p>`
});
```

## 📝 Adicionar Novo Post

1. Crie arquivo MDX em `src/content/[lang]/`:

```mdx
---
title: "Seu Título"
description: "Descrição"
pubDate: 2026-01-20
author: "Autor"
blueprintId: "seu-projeto-pt"
tags: ["tag1", "tag2"]
---

import AmazonList from '../../components/AmazonList.astro';
import ImagePaywall from '../../components/ImagePaywall.astro';

# Conteúdo...

<ImagePaywall lang="pt" blueprintId="seu-projeto-pt" />
```

2. Adicione ao array de posts em:
   - `src/pages/[lang]/index.astro`
   - `src/pages/[lang]/blog/index.astro`

3. Adicione rota em `src/pages/[lang]/blog/[slug].astro`:
```typescript
export async function getStaticPaths() {
  return [
    // ...posts existentes
    { params: { lang: 'pt', slug: 'seu-projeto' } },
  ];
}
```

## 🖼️ Adicionar Blueprints

1. Crie PNG em alta resolução (2000x3000px+)
2. Salve em `public/blueprints/seu-projeto.png`
3. Crie preview: `public/blueprints/seu-projeto-preview.jpg`
4. Adicione no webhook para enviar arquivo após pagamento

## 🎯 Diferenças SSR vs Static

| Aspecto | Static (antes) | SSR (agora) |
|---------|---------------|-------------|
| Rendering | Build time | Request time |
| API Endpoints | ❌ Não suportado | ✅ Nativo |
| Variáveis secretas | ❌ Build time only | ✅ Runtime access |
| Stripe integration | ⚠️ Client-side | ✅ Server-side |
| Segurança | Médio | Alto |
| Webhooks | ❌ Precisa externa API | ✅ Nativo |

## 🔐 Segurança

- ✅ Chaves secretas apenas no servidor (Workers env)
- ✅ Stripe SDK server-side
- ✅ Webhook signature verification
- ✅ HTTPS obrigatório (Cloudflare)
- ✅ Rate limiting (Cloudflare)

## 🐛 Troubleshooting

### Erro: "STRIPE_SECRET_KEY não configurada"

**Causa**: Variável de ambiente não definida

**Solução**:
```bash
# Local: Adicione em .env
STRIPE_SECRET_KEY=sk_test_...

# Produção: Cloudflare Dashboard → Settings → Environment variables
```

### Erro: "Webhook signature verification failed"

**Causa**: Webhook secret incorreto ou body alterado

**Solução**:
1. Verifique `STRIPE_WEBHOOK_SECRET` está correto
2. No Stripe Dashboard, copie o secret do webhook criado
3. Atualize env var no Cloudflare

### Build falha: "Cannot find module 'stripe'"

**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### API retorna 500 em produção

**Debug**:
1. Cloudflare Dashboard → Workers & Pages → Seu projeto
2. Logs → Real-time logs
3. Verifique erros no console

## 📊 Monitoramento

### Cloudflare Analytics

- Workers & Pages → Seu projeto → Analytics
- Métricas: requests, duração, erros

### Stripe Dashboard

- Payments → Todos os pagamentos
- Webhooks → Log de eventos

## 🔧 Personalização

### Mudar Preços

Edite `src/i18n/[lang].json`:
```json
{
  "paywall": {
    "price": "€10"
  }
}
```

E em `ImagePaywall.astro`:
```typescript
data-amount={currency === 'eur' ? '1000' : '1000'}
```

### Adicionar Novo Idioma

1. Crie `src/i18n/fr.json`
2. Adicione em `src/i18n/index.ts`
3. Atualize `astro.config.mjs`
4. Crie posts em `src/content/fr/`

## 📄 Licença

MIT License

---

**Desenvolvido com ❤️ usando Astro SSR + Cloudflare Workers + Stripe**
