import type { APIRoute } from 'astro';
import Stripe from 'stripe';

// Validação de blueprints permitidos
const VALID_BLUEPRINTS = [
  'horta-madeira-1-dia',
  'huerto-madera-1-dia',
  'wooden-garden-1-day',
];

const VALID_CURRENCIES = ['usd', 'eur'];
const VALID_LANGUAGES = ['pt', 'es', 'en'];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as {
      blueprintId: string;
      lang: string;
      currency: string;
      amount: number;
    };
    
    const { blueprintId, lang, currency, amount } = body;

    // Validações
    if (!blueprintId || !lang || !currency || !amount) {
      console.error('❌ Dados incompletos na requisição:', { blueprintId, lang, currency, amount });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['blueprintId', 'lang', 'currency', 'amount']
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_BLUEPRINTS.includes(blueprintId)) {
      console.error('❌ Blueprint inválido:', blueprintId);
      return new Response(
        JSON.stringify({ error: 'Invalid blueprint ID' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_CURRENCIES.includes(currency.toLowerCase())) {
      console.error('❌ Moeda inválida:', currency);
      return new Response(
        JSON.stringify({ error: 'Invalid currency' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_LANGUAGES.includes(lang)) {
      console.error('❌ Idioma inválido:', lang);
      return new Response(
        JSON.stringify({ error: 'Invalid language' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (amount < 50 || amount > 1000000) {
      console.error('❌ Valor inválido:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('💳 Criando sessão de checkout:', {
      blueprintId,
      lang,
      currency,
      amount: (amount / 100).toFixed(2),
    });

    // Obter chave secreta do Stripe
    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Obter URL do site
    const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';

    // Nomes dos produtos por idioma
    const productNames: Record<string, string> = {
      'pt': 'Blueprint - Horta Vertical de Madeira',
      'es': 'Blueprint - Huerto Vertical de Madera',
      'en': 'Blueprint - Wooden Vertical Garden',
    };

    const descriptions: Record<string, string> = {
      'pt': 'Diagrama técnico profissional em alta resolução com medidas exatas, lista de materiais e instruções passo a passo',
      'es': 'Diagrama técnico profesional en alta resolución con medidas exactas, lista de materiales e instrucciones paso a paso',
      'en': 'Professional high-resolution technical diagram with exact measurements, materials list and step-by-step instructions',
    };

    // Criar sessão de checkout
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: productNames[lang] || productNames['en'],
                description: descriptions[lang] || descriptions['en'],
                images: [`${siteUrl}/blueprints/horta-preview.jpg`],
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${siteUrl}/${lang}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/${lang}/blog/${blueprintId}`,
        metadata: {
          blueprintId,
          lang,
          environment: process.env.NODE_ENV || 'production',
        },
        customer_email: undefined, // Stripe perguntará no checkout
        billing_address_collection: 'auto',
        payment_intent_data: {
          metadata: {
            blueprintId,
            lang,
          },
        },
      });

      console.log('✅ Sessão criada com sucesso:', {
        sessionId: session.id,
        url: session.url ? 'presente' : 'ausente',
      });

      return new Response(
        JSON.stringify({ 
          id: session.id, 
          url: session.url 
        }), 
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );

    } catch (stripeError: any) {
      console.error('❌ Erro do Stripe ao criar sessão:', {
        type: stripeError.type,
        message: stripeError.message,
        code: stripeError.code,
      });

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          message: 'Please try again or contact support',
          details: process.env.NODE_ENV === 'development' ? stripeError.message : undefined,
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('❌ Erro fatal ao criar sessão:', {
      error: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
