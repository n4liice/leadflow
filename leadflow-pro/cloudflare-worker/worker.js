/**
 * LeadFlow Pro - Cloudflare Worker Proxy
 * ============================================
 * Este worker atua como proxy seguro entre o frontend e o n8n.
 *
 * INSTALAÇÃO:
 * 1. Acesse https://dash.cloudflare.com/
 * 2. Vá em Workers & Pages > Create Application > Create Worker
 * 3. Dê o nome: leadflow-webhook-proxy
 * 4. Cole este código
 * 5. Configure as variáveis de ambiente (Settings > Variables):
 *    - N8N_WEBHOOK_LAUNCH: URL do webhook de lançar campanha
 *    - N8N_WEBHOOK_PAUSE: URL do webhook de pausar campanha
 *    - N8N_WEBHOOK_RESUME: URL do webhook de retomar campanha
 *    - N8N_WEBHOOK_VALIDATE_PHONE: URL do webhook de validar telefone
 *    - WEBHOOK_SECRET: Chave secreta para assinatura HMAC
 *    - ALLOWED_ORIGIN: https://leadflow.vistalivretech.com.br
 */

// Função para gerar assinatura HMAC SHA-256
async function generateHMAC(payload, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env, ctx) {
    // ============================================
    // CORS Preflight
    // ============================================
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Apenas POST é permitido
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        },
      });
    }

    // ============================================
    // Verificar Origin (proteção básica)
    // ============================================
    const origin = request.headers.get('Origin');
    if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
      // Em desenvolvimento, permitir localhost
      if (!origin?.includes('localhost') && !origin?.includes('127.0.0.1')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
          },
        });
      }
    }

    // ============================================
    // Extrair ação da URL
    // ============================================
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Esperado: /webhook/{action}
    if (pathParts.length < 2 || pathParts[0] !== 'webhook') {
      return new Response(JSON.stringify({ error: 'Invalid path. Use /webhook/{action}' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        },
      });
    }

    const action = pathParts[1];

    // ============================================
    // Mapear ação para URL do n8n
    // ============================================
    const webhookUrls = {
      launch: env.N8N_WEBHOOK_LAUNCH,
      pause: env.N8N_WEBHOOK_PAUSE,
      resume: env.N8N_WEBHOOK_RESUME,
      validate_phone: env.N8N_WEBHOOK_VALIDATE_PHONE,
    };

    const targetUrl = webhookUrls[action];

    if (!targetUrl) {
      return new Response(JSON.stringify({
        error: 'Invalid action',
        validActions: Object.keys(webhookUrls)
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        },
      });
    }

    // ============================================
    // Processar payload
    // ============================================
    let body;
    try {
      body = await request.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        },
      });
    }

    // ============================================
    // Gerar assinatura e timestamp
    // ============================================
    const timestamp = Date.now();
    const payloadWithMeta = JSON.stringify({
      ...JSON.parse(body || '{}'),
      action,
      timestamp,
    });

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-Action': action,
    };

    // Adicionar assinatura HMAC se secret estiver configurado
    if (env.WEBHOOK_SECRET) {
      const signature = await generateHMAC(payloadWithMeta, env.WEBHOOK_SECRET);
      headers['X-Webhook-Signature'] = signature;
    }

    // ============================================
    // Encaminhar para n8n
    // ============================================
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: payloadWithMeta,
      });

      const responseText = await response.text();

      // Retornar resposta do n8n
      return new Response(responseText, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to reach n8n',
        details: error.message
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        },
      });
    }
  },
};
