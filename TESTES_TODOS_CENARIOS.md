# 🧪 Guia Completo de Testes - Todos os Cenários

## 🎯 Sistema Atualizado

### O que mudou:
- ✅ **PDFs → PNGs**: Blueprints agora são imagens PNG
- ✅ **Validação robusta**: Todos os endpoints validam entrada
- ✅ **Logs detalhados**: Cada etapa registra logs coloridos
- ✅ **Tratamento de erros**: Mensagens claras para cada cenário
- ✅ **Production-ready**: Código pronto para produção

## 📋 Pré-requisitos

```bash
cd /Users/jorge/projects/PD/claude/diy-woodworking-blog

# 1. Verificar .env
cat .env | grep STRIPE

# Deve ter:
# PUBLIC_STRIPE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_... (será gerado pelo Stripe CLI)
# SITE_URL=http://localhost:4321
```

## 🚀 Setup Inicial

### Terminal 1 - Stripe CLI
```bash
stripe listen --forward-to localhost:4321/api/stripe-webhook
```

**Copie o webhook secret** (whsec_...) e adicione ao `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Terminal 2 - Servidor
```bash
# Rebuild após atualizar .env
rm -rf dist .astro
npm run build

# Iniciar servidor
npm run dev
```

## 🧪 Cenário 1: Pagamento Bem-Sucedido ✅

### Passos:
1. Abra: http://localhost:4321/pt/blog
2. Clique em "Horta Vertical de Madeira"
3. Role até o paywall
4. Clique em "🔓 Desbloquear Blueprints"
5. Preencha no Stripe Checkout:
   ```
   Email: sucesso@test.com
   Cartão: 4242 4242 4242 4242
   Data: 12/34
   CVC: 123
   Nome: Teste Sucesso
   CEP: 12345
   ```
6. Clique em "Pagar"

### Resultado Esperado:

**Terminal Stripe CLI:**
```
✔️  Received event: checkout.session.completed
✔️  [200] POST http://localhost:4321/api/stripe-webhook
```

**Terminal Servidor:**
```
💳 Criando sessão de checkout: {
  blueprintId: 'horta-madeira-1-dia',
  lang: 'pt',
  currency: 'eur',
  amount: '5.00'
}
✅ Sessão criada com sucesso

📨 Webhook recebido: checkout.session.completed
✅ Checkout completado: {
  sessionId: 'cs_test_...',
  blueprintId: 'horta-madeira-1-dia',
  email: 'sucesso@test.com',
  amount: '5.00',
  currency: 'EUR',
  paymentStatus: 'paid'
}
💾 Pagamento salvo com sucesso
📧 Blueprint liberado para: sucesso@test.com

🔍 Verificando pagamento: cs_test_...
✅ Pagamento verificado com sucesso

📥 Download iniciado: {
  blueprint: 'horta-madeira-1-dia',
  filename: 'horta-vertical-madeira-blueprint.png',
  size: 'XXX KB'
}
✅ Token validado
```

**Navegador:**
- ✅ Redireciona para `/pt/success?session_id=cs_test_...`
- ✅ Mostra "Pagamento Confirmado!"
- ✅ Exibe email e blueprint ID
- ✅ Botão "Baixar Blueprint (PNG)" visível
- ✅ Botão "Visualizar Blueprint" visível
- ✅ Clicar em "Baixar" → PNG baixa
- ✅ Clicar em "Visualizar" → Modal com imagem

## 🧪 Cenário 2: Pagamento Recusado ❌

### Passos:
1-4. Mesmo do Cenário 1
5. Preencha:
   ```
   Email: recusado@test.com
   Cartão: 4000 0000 0000 0002
   Data: 12/34
   CVC: 123
   ```
6. Clique em "Pagar"

### Resultado Esperado:

**Stripe Checkout:**
```
❌ "Your card was declined."
```

**Terminal Servidor:**
```
💳 Criando sessão de checkout...
✅ Sessão criada com sucesso

📨 Webhook recebido: payment_intent.payment_failed
❌ Pagamento falhou: {
  id: 'pi_...',
  error: 'Your card was declined'
}
```

**Navegador:**
- ✅ Permanece no Stripe Checkout
- ✅ Mostra mensagem de erro do Stripe
- ✅ Permite tentar novamente
- ✅ NÃO redireciona para /success

## 🧪 Cenário 3: 3D Secure (Autenticação) 🔐

### Passos:
1-4. Mesmo do Cenário 1
5. Preencha:
   ```
   Email: 3dsecure@test.com
   Cartão: 4000 0025 0000 3155
   Data: 12/34
   CVC: 123
   ```
6. Clique em "Pagar"

### Resultado Esperado:

**Stripe Checkout:**
```
📱 Modal de autenticação aparece
```

**Ação:** Clique em "Complete authentication"

**Terminal Servidor:**
```
💳 Criando sessão de checkout...
✅ Sessão criada

[Após autenticação bem-sucedida]
📨 Webhook recebido: checkout.session.completed
✅ Checkout completado
💾 Pagamento salvo
```

**Navegador:**
- ✅ Modal de autenticação aparece
- ✅ Após clicar "Complete" → Redireciona para /success
- ✅ Download funciona normalmente

## 🧪 Cenário 4: Insuficiente Fundos 💸

### Passos:
1-4. Mesmo do Cenário 1
5. Preencha:
   ```
   Email: semfundos@test.com
   Cartão: 4000 0000 0000 9995
   Data: 12/34
   CVC: 123
   ```

### Resultado Esperado:
- ✅ Erro: "Your card has insufficient funds"
- ✅ Não redireciona
- ✅ Permite tentar novamente

## 🧪 Cenário 5: Cartão Expirado 📅

### Passos:
1-4. Mesmo do Cenário 1
5. Preencha:
   ```
   Email: expirado@test.com
   Cartão: 4000 0000 0000 0069
   Data: 12/34
   CVC: 123
   ```

### Resultado Esperado:
- ✅ Erro: "Your card has expired"
- ✅ Não redireciona

## 🧪 Cenário 6: Cancelar Checkout ↩️

### Passos:
1-4. Mesmo do Cenário 1
5. Clique em "← Back" no Stripe Checkout

### Resultado Esperado:

**Terminal Servidor:**
```
💳 Criando sessão de checkout...
✅ Sessão criada

📨 Webhook recebido: checkout.session.expired
⏰ Checkout expirado
```

**Navegador:**
- ✅ Redireciona para `/pt/blog/horta-madeira-1-dia`
- ✅ Paywall ainda visível
- ✅ Pode tentar novamente

## 🧪 Cenário 7: Link de Download Expirado ⏰

### Passos:
1. Complete um pagamento bem-sucedido
2. Copie a URL da página de sucesso
3. **Simular expiração**: Modifique o token manualmente ou espere 24h
4. Tente baixar

### Resultado Esperado:

**Terminal Servidor:**
```
❌ Download failed: Token expired {
  tokenAge: '25h',
  maxAge: '24h'
}
```

**Navegador:**
- ✅ Retorna erro 403
- ✅ Mensagem: "Download link expired. Please contact support."

## 🧪 Cenário 8: Token Inválido 🔒

### Passos:
1. Tente acessar: `http://localhost:4321/api/download-blueprint?token=invalido&blueprint=horta-madeira-1-dia`

### Resultado Esperado:

**Terminal Servidor:**
```
❌ Token validation failed
```

**Navegador:**
- ✅ Retorna erro 403
- ✅ Mensagem: "Invalid token"

## 🧪 Cenário 9: Sem Session ID ⚠️

### Passos:
1. Acesse diretamente: `http://localhost:4321/pt/success`

### Resultado Esperado:

**Navegador:**
- ✅ Mostra erro
- ✅ Mensagem: "No session ID provided in URL"
- ✅ Não trava a página

## 🧪 Cenário 10: Webhook Sem Autenticação (Dev Mode) 🛠️

### Passos:
1. **Remova** o `STRIPE_WEBHOOK_SECRET` do `.env`
2. Reinicie o servidor
3. Faça um pagamento

### Resultado Esperado:

**Terminal Servidor:**
```
⚠️  MODO DESENVOLVIMENTO: Webhook sem validação de assinatura
⚠️  Configure STRIPE_WEBHOOK_SECRET para produção!

📨 Webhook recebido: checkout.session.completed
✅ Checkout completado
```

- ✅ Webhook funciona sem validação
- ✅ Warning é exibido
- ✅ Download funciona

**Importante:** Adicione o secret de volta após o teste!

## 📊 Checklist Completo

### Setup
- [ ] Servidor rodando (`npm run dev`)
- [ ] Stripe CLI rodando (`stripe listen`)
- [ ] Webhook secret no `.env`
- [ ] Imagem test.png existe em `/public/blueprints/protected/`

### Pagamentos
- [ ] ✅ Pagamento bem-sucedido (4242)
- [ ] ❌ Pagamento recusado (0002)
- [ ] 🔐 3D Secure (3155)
- [ ] 💸 Fundos insuficientes (9995)
- [ ] 📅 Cartão expirado (0069)
- [ ] ↩️ Cancelar checkout

### Download
- [ ] 📥 Download via botão funciona
- [ ] 👁️ Visualizar em modal funciona
- [ ] ⏰ Token expirado retorna erro
- [ ] 🔒 Token inválido retorna erro
- [ ] 📧 Email e blueprint ID são exibidos

### Erros
- [ ] ⚠️ Sem session ID mostra erro
- [ ] ❌ Pagamento não confirmado mostra mensagem
- [ ] 🛠️ Modo dev (sem webhook secret) funciona

## 🎓 Cartões de Teste Stripe

```
✅ Sucesso:           4242 4242 4242 4242
❌ Recusado:          4000 0000 0000 0002
🔐 3D Secure:         4000 0025 0000 3155
💸 Sem fundos:        4000 0000 0000 9995
📅 Expirado:          4000 0000 0000 0069
⚡ Processamento:     4000 0000 0000 3220
🔄 Requer ação:       4000 0027 6000 3184
```

Mais cartões: https://stripe.com/docs/testing

## 🔍 Verificar Logs

### Ver todos os eventos no Stripe:
```bash
stripe logs tail
```

### Ver logs do servidor:
Os logs aparecem automaticamente no terminal do `npm run dev`

### Ver requests no navegador:
1. Abra DevTools (F12)
2. Aba "Network"
3. Filtre por "api"

## ✅ Critérios de Sucesso

Um teste é bem-sucedido quando:
1. ✅ Logs aparecem no terminal (coloridos e descritivos)
2. ✅ Webhook retorna 200 no Stripe CLI
3. ✅ Página de sucesso carrega corretamente
4. ✅ Download da imagem funciona
5. ✅ Erros são tratados graciosamente

## 🎉 Testes Completos!

Se você passou por todos os cenários:
- ✅ Sistema está production-ready
- ✅ Todos os casos de uso cobertos
- ✅ Logs ajudam no debugging
- ✅ Erros são tratados corretamente

## 🚀 Próximo Passo: Deploy

Depois de testar tudo localmente, você pode fazer deploy para produção!

Ver: `DEPLOY_PRODUCTION.md` (se disponível)
