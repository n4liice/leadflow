/**
 * LeadFlow Pro - Cloudflare Worker: Webhook Proxy
 * ================================================
 *
 * Este Worker atua como proxy seguro entre o frontend e o n8n.
 * As URLs reais do n8n ficam ocultas aqui, não no código do frontend.
 *
 * CONFIGURAÇÃO:
 * 1. Crie um Worker no Cloudflare Dashboard
 * 2. Cole este código
 * 3. Configure as variáveis de ambiente (Settings > Variables):
 *    - N8N_WEBHOOK_LAUNCH: URL do webhook de lançamento
 *    - N8N_WEBHOOK_PAUSE: URL do webhook de pausa
 *    - N8N_WEBHOOK_RESUME: URL do webhook de retomada
 *    - N8N_WEBHOOK_VALIDATE_PHONE: URL do webhook de validação
 *    - WEBHOOK_SECRET: Chave secreta para assinatura HMAC
 *    - ALLOWED_ORIGIN: Domínio permitido (ex: https://leadflow.vistalivretech.com.br)
 */

// Mapeamento de ações para variáveis de ambiente
const ACTION_TO_ENV = {
  launch: 'N8N_WEBHOOK_LAUNCH',
  pause: 'N8N_WEBHOOK_PAUSE',
  resume: 'N8N_WEBHOOK_RESUME',
  validate_phone: 'N8N_WEBHOOK_VALIDATE_PHONE',
};

/**
 * Gera assinatura HMAC SHA-256
 */
async function generateHMAC(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retorna headers CORS
 */
function getCorsHeaders(origin, allowedOrigin) {
  // Em desenvolvimento, permitir localhost
  const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
  const isAllowed = origin === allowedOrigin || isLocalhost;

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handler principal
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://leadflow.vistalivretech.com.br';
    const corsHeaders = getCorsHeaders(origin, allowedOrigin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Apenas POST é permitido
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extrair ação da URL: /webhook/{action}
    const pathMatch = url.pathname.match(/^\/webhook\/(\w+)$/);
    if (!pathMatch) {
      return new Response(
        JSON.stringify({ error: 'Endpoint inválido. Use /webhook/{action}' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const action = pathMatch[1];

    // Verificar se ação é válida
    if (!ACTION_TO_ENV[action]) {
      return new Response(
        JSON.stringify({ error: `Ação desconhecida: ${action}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Obter URL do n8n das variáveis de ambiente
    const webhookUrl = env[ACTION_TO_ENV[action]];
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: `Webhook ${action} não configurado no Worker` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      // Ler body da requisição
      const body = await request.text();
      const timestamp = Date.now();

      // Preparar headers para o n8n
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Webhook-Action': action,
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
      };

      // Adicionar assinatura HMAC se secret estiver configurado
      if (env.WEBHOOK_SECRET) {
        const signature = await generateHMAC(body + timestamp, env.WEBHOOK_SECRET);
        headers['X-Webhook-Signature'] = signature;
      }

      // Encaminhar requisição para o n8n
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body,
      });

      // Retornar resposta do n8n
      const responseData = await response.text();
      let jsonResponse;

      try {
        jsonResponse = JSON.parse(responseData);
      } catch {
        jsonResponse = { raw: responseData };
      }

      return new Response(
        JSON.stringify({
          success: response.ok,
          status: response.status,
          data: jsonResponse,
        }),
        {
          status: response.ok ? 200 : response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Erro no proxy:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar requisição', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
