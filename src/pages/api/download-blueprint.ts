import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BLUEPRINTS: Record<string, { 
  filename: string; 
  title: string;
  imagePath: string;
}> = {
  'horta-madeira-1-dia': {
    filename: 'horta-vertical-madeira-blueprint.png',
    title: 'Horta Vertical de Madeira - Blueprint Completo',
    imagePath: 'blueprints/protected/test.png',
  },
  'huerto-madera-1-dia': {
    filename: 'huerto-vertical-madera-blueprint.png',
    title: 'Huerto Vertical de Madera - Blueprint Completo',
    imagePath: 'blueprints/protected/test.png',
  },
  'wooden-garden-1-day': {
    filename: 'wooden-vertical-garden-blueprint.png',
    title: 'Wooden Vertical Garden - Complete Blueprint',
    imagePath: 'blueprints/protected/test.png',
  },
};

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const token = url.searchParams.get('token');
    const blueprintId = url.searchParams.get('blueprint');

    if (!token || !blueprintId) {
      console.error('❌ Download failed: Missing token or blueprint ID');
      return new Response('Missing token or blueprint ID', { status: 400 });
    }

    // Validar token
    try {
      const decoded = atob(token);
      const [sessionId, tokenBlueprintId, timestamp] = decoded.split(':');
      
      // Verificar se o token não expirou (24 horas)
      const tokenAge = Date.now() - parseInt(timestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (tokenAge > twentyFourHours) {
        console.error('❌ Download failed: Token expired', {
          tokenAge: Math.floor(tokenAge / 1000 / 60 / 60) + 'h',
          maxAge: '24h',
        });
        return new Response('Download link expired. Please contact support.', { status: 403 });
      }

      // Verificar se o blueprint no token corresponde ao solicitado
      if (tokenBlueprintId !== blueprintId) {
        console.error('❌ Download failed: Blueprint ID mismatch', {
          expected: tokenBlueprintId,
          provided: blueprintId,
        });
        return new Response('Invalid blueprint ID', { status: 403 });
      }

      console.log('✅ Token validado:', {
        sessionId: sessionId.substring(0, 20) + '...',
        blueprintId,
        age: Math.floor(tokenAge / 1000 / 60) + ' minutos',
      });

    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return new Response('Invalid token', { status: 403 });
    }

    // Buscar blueprint
    const blueprint = BLUEPRINTS[blueprintId];
    
    if (!blueprint) {
      console.error('❌ Blueprint not found:', blueprintId);
      return new Response('Blueprint not found', { status: 404 });
    }

    // Ler o arquivo de imagem
    const publicPath = join(process.cwd(), 'public', blueprint.imagePath);
    
    try {
      const imageBuffer = await readFile(publicPath);
      
      console.log('✅ Download iniciado:', {
        blueprint: blueprintId,
        filename: blueprint.filename,
        size: Math.round(imageBuffer.length / 1024) + 'KB',
      });

      return new Response(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${blueprint.filename}"`,
          'Content-Length': imageBuffer.length.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      });

    } catch (error) {
      console.error('❌ Error reading blueprint file:', error);
      return new Response('Blueprint file not found. Please contact support.', { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Download error:', error);
    return new Response('Download failed. Please try again or contact support.', { status: 500 });
  }
};
