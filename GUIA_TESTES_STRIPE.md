# 🧪 Guia Completo de Testes com Stripe Sandbox

## 📋 Pré-requisitos

1. ✅ Stripe CLI instalado
2. ✅ Chaves de teste configuradas no `.env`
3. ✅ Projeto rodando localmente

## 🚀 Passo 1: Iniciar o Servidor Local

```bash
cd /Users/jorge/projects/PD/claude/diy-woodworking-blog

# Limpar e rebuild
rm -rf dist .astro
npm run build

# Iniciar servidor de desenvolvimento
npm run dev
```

O site estará disponível em: http://localhost:4321

## 🔌 Passo 2: Configurar Stripe CLI para Webhooks

Abra um **novo terminal** e execute:

```bash
# Login no Stripe CLI (se ainda não fez)
stripe login

# Fazer forward dos webhooks para seu localhost
stripe listen --forward-to localhost:4321/api/stripe-webhook
```

**IMPORTANTE:** Este comando vai gerar um **webhook signing secret**. Exemplo:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copie esse secret e atualize seu `.env`:

```bash
# No arquivo .env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Reinicie o servidor** após atualizar o `.env`:
```bash
# Ctrl+C no terminal do servidor e depois:
npm run dev
```

## 🧪 Passo 3: Testar o Fluxo Completo

### 3.1. Acessar o Site

1. Abra o navegador em: http://localhost:4321/pt/
2. Clique em "Ver Projetos" ou vá para: http://localhost:4321/pt/blog
3. Clique em um post (exemplo: Horta Vertical de Madeira)

### 3.2. Iniciar Checkout

1. Na página do blog post, role até encontrar o **Paywall** (ImagePaywall component)
2. Clique no botão "🔓 Desbloquear Blueprints"
3. Você será redirecionado para o Stripe Checkout

### 3.3. Preencher Dados de Teste

Use estes **cartões de teste** do Stripe:

**Pagamento Bem-Sucedido:**
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura (ex: 12/34)
CVC: Qualquer 3 dígitos (ex: 123)
CEP: Qualquer 5 dígitos (ex: 12345)
```

**Outros Cenários de Teste:**
- **Pagamento recusado:** 4000 0000 0000 0002
- **Requer autenticação 3D Secure:** 4000 0025 0000 3155
- **Cartão insuficiente:** 4000 0000 0000 9995

**Email de teste:**
```
teste@example.com
```

### 3.4. Completar Pagamento

1. Preencha os dados do cartão
2. Clique em "Pagar"
3. Você será redirecionado para: `http://localhost:4321/pt/success?session_id=cs_test_...`

### 3.5. Verificar Webhook

No terminal do **Stripe CLI**, você deve ver:

```
✔️  Received event: checkout.session.completed
✔️  Event sent to webhook endpoint
```

E no terminal do **servidor**, você deve ver logs:

```
📨 Webhook recebido: checkout.session.completed
✅ Pagamento completado: {
  blueprintId: 'horta-madeira-1-dia',
  lang: 'pt',
  customerEmail: 'teste@example.com',
  sessionId: 'cs_test_...'
}
💾 Pagamento salvo: cs_test_...
📧 Blueprint horta-madeira-1-dia liberado para teste@example.com
```

### 3.6. Fazer Download do Blueprint

Na página de sucesso:

1. ✅ Você verá "Pagamento Confirmado!"
2. ✅ Um botão "Baixar Blueprint Agora" aparecerá
3. ✅ Clique no botão para baixar o PDF
4. ✅ O PDF será baixado automaticamente

## 🔍 Verificações Importantes

### Terminal do Stripe CLI deve mostrar:
```
✔️  [200] POST http://localhost:4321/api/stripe-webhook
```

### Terminal do Servidor deve mostrar:
```
✅ Pagamento completado
💾 Pagamento salvo
📧 Blueprint liberado
```

### Navegador deve:
- ✅ Redirecionar para /pt/success
- ✅ Mostrar mensagem de sucesso
- ✅ Mostrar botão de download
- ✅ Download do PDF funcionar

## 🎯 Testar Diferentes Cenários

### Cenário 1: Pagamento Bem-Sucedido (Principal)
```
Cartão: 4242 4242 4242 4242
Resultado: Download liberado ✅
```

### Cenário 2: Pagamento Recusado
```
Cartão: 4000 0000 0000 0002
Resultado: Volta para página de checkout com erro ❌
```

### Cenário 3: 3D Secure
```
Cartão: 4000 0025 0000 3155
Resultado: Modal de autenticação (clique em "Complete" para aprovar) ✅
```

### Cenário 4: Sem Session ID na URL
```
Acesse: http://localhost:4321/pt/success
Resultado: Erro "No session ID provided" ❌
```

## 🐛 Troubleshooting

### Problema: Webhook não recebe eventos

**Solução 1:** Verificar se Stripe CLI está rodando
```bash
# Terminal do Stripe CLI deve mostrar:
> Ready! You are using Stripe API Version [2023-10-16]
```

**Solução 2:** Verificar STRIPE_WEBHOOK_SECRET
```bash
# Deve estar no .env
cat .env | grep STRIPE_WEBHOOK_SECRET
```

**Solução 3:** Reiniciar servidor após mudanças no .env
```bash
# Ctrl+C no servidor
npm run dev
```

### Problema: Botão de download não aparece

**Console do navegador deve mostrar:**
```javascript
// Abra DevTools (F12) → Console
// Deve ver requisição para /api/verify-payment
```

**Solução:** Verificar se session_id está na URL
```
URL deve ser: /pt/success?session_id=cs_test_xxxxx
```

### Problema: Download não funciona

**Verificar endpoint:**
```bash
# Teste direto no navegador:
http://localhost:4321/api/download-blueprint?token=xxx&blueprint=horta-madeira-1-dia
```

**Logs do servidor devem mostrar:**
```
Download iniciado para blueprint: horta-madeira-1-dia
```

## 📊 Checklist Completo de Testes

- [ ] **Setup**
  - [ ] Servidor local rodando (npm run dev)
  - [ ] Stripe CLI rodando (stripe listen)
  - [ ] .env configurado com webhook secret
  
- [ ] **Navegação**
  - [ ] Homepage carrega
  - [ ] Blog carrega
  - [ ] Post individual carrega
  - [ ] Paywall é visível
  
- [ ] **Checkout**
  - [ ] Botão de checkout funciona
  - [ ] Redireciona para Stripe
  - [ ] Formulário aceita dados de teste
  - [ ] Consegue completar pagamento
  
- [ ] **Webhook**
  - [ ] Stripe CLI recebe evento
  - [ ] Webhook endpoint responde 200
  - [ ] Logs mostram pagamento salvo
  
- [ ] **Success Page**
  - [ ] Redireciona para /success com session_id
  - [ ] Mensagem de sucesso aparece
  - [ ] Loading state funciona
  - [ ] Botão de download aparece
  
- [ ] **Download**
  - [ ] Clique no botão funciona
  - [ ] PDF é baixado
  - [ ] PDF abre corretamente
  - [ ] Conteúdo do PDF está correto

## 🎓 Próximos Passos

Depois de testar localmente:

1. **Deploy para produção**
2. **Configurar webhook em Stripe Dashboard:**
   - URL: `https://woodwork.tdshome.pt/api/stripe-webhook`
   - Eventos: `checkout.session.completed`
3. **Substituir chaves de test por live keys**
4. **Adicionar PDFs reais** em `/public/blueprints/protected/`
5. **Implementar envio de email** (opcional, usando Resend ou similar)

## 📧 Simular Envio de Email (Opcional)

Para testar envio de email localmente, você pode adicionar logs:

```javascript
// No stripe-webhook.ts, adicione:
console.log('📧 Email seria enviado para:', customerEmail);
console.log('📎 Com link de download:', downloadUrl);
```

Em produção, integre com:
- **Resend** (resend.com)
- **SendGrid**
- **Postmark**
- **AWS SES**

## 🎉 Teste Completo Bem-Sucedido!

Se você conseguiu:
1. ✅ Fazer checkout
2. ✅ Ver webhook sendo recebido
3. ✅ Ver mensagem de sucesso
4. ✅ Baixar o PDF

**Parabéns! Todo o sistema está funcionando!** 🚀
