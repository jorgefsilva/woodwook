import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const GET: APIRoute = async ({ url }) => {
  try {
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      console.error('❌ Verificação falhou: session_id ausente');
      return new Response(JSON.stringify({ 
        error: 'Missing session_id',
        message: 'Session ID is required to verify payment'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Verificando pagamento:', sessionId.substring(0, 20) + '...');

    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return new Response(JSON.stringify({ 
        error: 'Configuration error',
        message: 'Stripe is not properly configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Buscar sessão no Stripe
    let session: Stripe.Checkout.Session;
    
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error: any) {
      console.error('❌ Erro ao buscar sessão no Stripe:', error.message);
      return new Response(JSON.stringify({ 
        error: 'Session not found',
        message: 'Could not find payment session. Please contact support.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📊 Status da sessão:', {
      id: session.id.substring(0, 20) + '...',
      paymentStatus: session.payment_status,
      status: session.status,
    });

    // Verificar status do pagamento
    if (session.payment_status !== 'paid') {
      console.warn('⚠️  Pagamento não confirmado:', session.payment_status);
      
      return new Response(JSON.stringify({ 
        error: 'Payment not completed',
        payment_status: session.payment_status,
        message: session.payment_status === 'unpaid' 
          ? 'Payment has not been completed yet' 
          : 'Payment is being processed. Please wait a moment and try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extrair informações
    const { blueprintId, lang } = session.metadata || {};
    const customerEmail = session.customer_details?.email;

    if (!blueprintId) {
      console.error('❌ Blueprint ID não encontrado nos metadados');
      return new Response(JSON.stringify({ 
        error: 'Blueprint not found',
        message: 'No blueprint associated with this payment'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gerar link de download seguro (válido por 24 horas)
    const downloadToken = btoa(`${sessionId}:${blueprintId}:${Date.now()}`);
    const downloadUrl = `/api/download-blueprint?token=${downloadToken}&blueprint=${blueprintId}`;

    console.log('✅ Pagamento verificado com sucesso:', {
      blueprintId,
      email: customerEmail,
      tokenExpires: '24 horas',
    });

    return new Response(JSON.stringify({ 
      success: true,
      blueprintId,
      lang: lang || 'pt',
      email: customerEmail,
      downloadUrl,
      expiresIn: 86400, // 24 horas em segundos
      amount: session.amount_total ? (session.amount_total / 100).toFixed(2) : null,
      currency: session.currency?.toUpperCase(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar pagamento:', {
      error: error.message,
      stack: error.stack,
    });
    
    return new Response(JSON.stringify({ 
      error: 'Verification failed',
      message: 'Failed to verify payment. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
