import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { blueprintId, lang, currency, amount } = body;

    // Obter chave secreta do Stripe das variáveis de ambiente
    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Stripe não configurado' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    // Obter URL do site
    const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: `Blueprint - ${blueprintId}`,
              description: lang === 'pt' 
                ? 'Diagramas técnicos profissionais em alta resolução' 
                : lang === 'es'
                ? 'Diagramas técnicos profesionales en alta resolución'
                : 'Professional high-resolution technical diagrams',
              images: [`${siteUrl}/blueprints/horta-preview.jpg`],
            },
            unit_amount: amount, // valor em centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/${lang}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}/blog`,
      metadata: {
        blueprintId,
        lang,
      },
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erro ao criar sessão Stripe:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar pagamento', 
        details: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
