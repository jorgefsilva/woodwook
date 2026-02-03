# Configuração do Cloudflare Pages

## No Dashboard do Cloudflare Pages

### Build Settings

- **Framework preset**: Astro
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (deixar vazio ou por defeito)
- **Node version**: 18 ou superior

### Environment Variables (Production & Preview)

Adicionar estas variáveis:

```
PUBLIC_STRIPE_KEY=pk_live_seu_key_aqui
STRIPE_SECRET_KEY=sk_live_seu_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
SITE_URL=https://woodwork.tdshome.pt
NODE_VERSION=18
```

### Importante

1. Não precisa de `wrangler.toml` - o Cloudflare Pages gere tudo automaticamente
2. Não precisa de `wrangler deploy` - o deploy é automático via Git
3. O ficheiro `_routes.json` em `/public` controla quais rotas vão para o Worker

## Ficheiros importantes criados:

- **public/_routes.json**: Define quais URLs são assets estáticos vs SSR
- **public/_headers**: Define cache headers para assets
- **astro.config.mjs**: Configurado com `mode: 'directory'` para Cloudflare

## Como fazer deploy:

1. Commit e push para o teu repositório Git
2. O Cloudflare Pages deteta automaticamente e faz build
3. Verifica os logs de build no dashboard

## Testar localmente:

```bash
npm install
npm run build
npm run preview
```

## Se o CSS não carregar:

1. Verifica no Network tab do browser se os pedidos a `/_astro/*.css` retornam 200
2. Verifica se o `_routes.json` está em `dist/` após o build
3. Verifica as variáveis de ambiente no Cloudflare Dashboard
4. Faz purge do cache do Cloudflare se necessário

## Debug:

Se houver problemas, verifica os logs em:
Cloudflare Dashboard → Workers & Pages → [teu projeto] → View build log
