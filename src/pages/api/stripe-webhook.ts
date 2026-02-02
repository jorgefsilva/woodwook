import type { APIRoute } from 'astro';
import Stripe from 'stripe';

// Simular um "banco de dados" de pagamentos
// Em produção, usar Cloudflare D1, KV, ou Durable Objects
const payments = new Map<string, {
  sessionId: string;
  blueprintId: string;
  email: string;
  lang: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  timestamp: number;
}>();

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isDevelopment = !webhookSecret || webhookSecret === 'whsec_your_webhook_secret_here';

    if (isDevelopment) {
      console.warn('⚠️  MODO DESENVOLVIMENTO: Webhook sem validação de assinatura');
      console.warn('⚠️  Configure STRIPE_WEBHOOK_SECRET para produção!');
    }

    let event: Stripe.Event;

    if (isDevelopment) {
      // Modo desenvolvimento: aceitar sem validação
      const body = await request.json();
      event = body as Stripe.Event;
    } else {
      // Modo produção: validar assinatura
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        console.error('❌ Webhook sem assinatura');
        return new Response('No signature', { status: 400 });
      }

      const body = await request.text();

      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log('✅ Assinatura do webhook validada');
      } catch (err: any) {
        console.error('❌ Falha na validação da assinatura:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const processingTime = Date.now() - startTime;
    const response = await handleWebhookEvent(event);
    
    console.log(`⏱️  Webhook processado em ${processingTime}ms`);
    
    return response;

  } catch (error: any) {
    console.error('❌ Erro fatal no webhook:', {
      error: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function handleWebhookEvent(event: Stripe.Event) {
  console.log(`📨 Webhook recebido: ${event.type} (ID: ${event.id})`);

  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event);
      
    case 'checkout.session.expired':
      return handleCheckoutExpired(event);
      
    case 'payment_intent.succeeded':
      return handlePaymentSucceeded(event);
      
    case 'payment_intent.payment_failed':
      return handlePaymentFailed(event);
      
    case 'charge.refunded':
      return handleChargeRefunded(event);
      
    default:
      console.log(`ℹ️  Evento não tratado: ${event.type}`);
      return new Response(
        JSON.stringify({ received: true, handled: false }), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  const { blueprintId, lang } = session.metadata || {};
  const customerEmail = session.customer_details?.email;
  const amount = session.amount_total;
  const currency = session.currency;

  console.log('✅ Checkout completado:', {
    sessionId: session.id,
    blueprintId,
    lang,
    email: customerEmail,
    amount: amount ? (amount / 100).toFixed(2) : 'N/A',
    currency: currency?.toUpperCase(),
    paymentStatus: session.payment_status,
  });

  if (!blueprintId || !customerEmail || !lang) {
    console.error('❌ Dados incompletos no checkout:', {
      blueprintId: !!blueprintId,
      customerEmail: !!customerEmail,
      lang: !!lang,
    });
    
    return new Response(
      JSON.stringify({ error: 'Missing required metadata' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verificar se pagamento foi confirmado
  if (session.payment_status !== 'paid') {
    console.warn('⚠️  Checkout completado mas pagamento não confirmado:', session.payment_status);
    
    payments.set(session.id, {
      sessionId: session.id,
      blueprintId,
      email: customerEmail,
      lang,
      status: 'pending',
      amount: amount || 0,
      currency: currency || 'usd',
      timestamp: Date.now(),
    });
    
    return new Response(
      JSON.stringify({ received: true, status: 'pending' }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Salvar pagamento como completo
  payments.set(session.id, {
    sessionId: session.id,
    blueprintId,
    email: customerEmail,
    lang,
    status: 'completed',
    amount: amount || 0,
    currency: currency || 'usd',
    timestamp: Date.now(),
  });

  console.log('💾 Pagamento salvo com sucesso');
  console.log('📧 Blueprint liberado para:', customerEmail);
  console.log('🎯 Blueprint ID:', blueprintId);
  
  // TODO: Enviar email com link de download
  // await sendBlueprintEmail(customerEmail, blueprintId, lang, session.id);
  
  return new Response(
    JSON.stringify({ received: true, status: 'completed' }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleCheckoutExpired(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  console.log('⏰ Checkout expirado:', {
    sessionId: session.id,
    email: session.customer_details?.email,
  });
  
  return new Response(
    JSON.stringify({ received: true, status: 'expired' }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.log('✅ Pagamento confirmado:', {
    id: paymentIntent.id,
    amount: (paymentIntent.amount / 100).toFixed(2),
    currency: paymentIntent.currency.toUpperCase(),
  });
  
  return new Response(
    JSON.stringify({ received: true }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  console.error('❌ Pagamento falhou:', {
    id: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message || 'Unknown error',
  });
  
  return new Response(
    JSON.stringify({ received: true, status: 'failed' }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  
  console.warn('💸 Reembolso processado:', {
    id: charge.id,
    amount: (charge.amount_refunded / 100).toFixed(2),
    currency: charge.currency.toUpperCase(),
  });
  
  // TODO: Revogar acesso ao blueprint se necessário
  
  return new Response(
    JSON.stringify({ received: true, status: 'refunded' }), 
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// Função auxiliar para obter pagamento (usado em verify-payment)
export function getPayment(sessionId: string) {
  return payments.get(sessionId);
}
