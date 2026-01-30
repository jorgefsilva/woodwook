import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request }) => {
  try {
    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe não configurado corretamente');
      return new Response('Webhook Error', { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Obter signature do header
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    // Obter raw body
    const body = await request.text();

    let event: Stripe.Event;

    try {
      // Verificar assinatura do webhook
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle o evento
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extrair metadata
        const { blueprintId, lang } = session.metadata || {};
        const customerEmail = session.customer_details?.email;

        console.log('Pagamento completado:', {
          blueprintId,
          lang,
          customerEmail,
          sessionId: session.id,
        });

        // AQUI: Implementar lógica de envio de email com blueprint
        // Exemplo: await sendBlueprintEmail(customerEmail, blueprintId, lang);
        
        // Por enquanto, apenas log
        console.log(`TODO: Enviar blueprint ${blueprintId} para ${customerEmail}`);
        
        break;

      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded');
        break;

      case 'payment_intent.payment_failed':
        console.log('PaymentIntent failed');
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
};
