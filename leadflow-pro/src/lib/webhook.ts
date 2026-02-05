/**
 * Utilitário para envio seguro de webhooks via Cloudflare Worker Proxy
 *
 * SEGURANÇA:
 * - URLs do n8n ficam ocultas no Cloudflare Worker
 * - Secret HMAC é gerenciado no Worker, não no frontend
 * - Frontend apenas envia payload para o proxy
 *
 * CONFIGURAÇÃO:
 * - VITE_WEBHOOK_PROXY_URL: URL do Cloudflare Worker
 *
 * FALLBACK (desenvolvimento local):
 * - Se VITE_WEBHOOK_PROXY_URL não estiver configurada,
 *   usa as URLs diretas do n8n (apenas para dev)
 */

// URL do Cloudflare Worker Proxy (produção)
const WEBHOOK_PROXY_URL = import.meta.env.VITE_WEBHOOK_PROXY_URL;

// Fallback para desenvolvimento local (URLs diretas do n8n)
const FALLBACK_URLS = {
  launch: import.meta.env.VITE_N8N_WEBHOOK_LAUNCH,
  pause: import.meta.env.VITE_N8N_WEBHOOK_PAUSE,
  resume: import.meta.env.VITE_N8N_WEBHOOK_RESUME,
  validate_phone: import.meta.env.VITE_N8N_WEBHOOK_VALIDATE_PHONE,
} as const;

const FALLBACK_SECRET = import.meta.env.VITE_N8N_WEBHOOK_SECRET;

export type WebhookAction = 'launch' | 'pause' | 'resume' | 'validate_phone';

interface WebhookPayload {
  campaign_id?: string;
  campanha?: {
    nome: string;
    qtd_disparos: number;
    status: string;
    data_inicio: string;
    horario_inicio?: string;
    horario_fim?: string;
    intervalo_minutos?: number;
    disparos_por_hora?: number;
  };
  leads?: Array<{
    id_lead: string;
    nome: string;
    telefone: string;
    condominio: string;
  }>;
  lead?: {
    id: string;
    nome: string;
    telefone: string;
    condominio: string | null;
    origem?: string | null;
  };
  [key: string]: unknown;
}

interface WebhookResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Gera assinatura HMAC SHA-256 para o payload (usado apenas no fallback)
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Envia webhook via Cloudflare Worker Proxy (produção)
 */
async function sendViaProxy(action: WebhookAction, payload: WebhookPayload): Promise<WebhookResult> {
  const url = `${WEBHOOK_PROXY_URL}/webhook/${action}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}

/**
 * Envia webhook diretamente para o n8n (fallback para desenvolvimento)
 */
async function sendDirect(action: WebhookAction, payload: WebhookPayload): Promise<WebhookResult> {
  const webhookUrl = FALLBACK_URLS[action];

  if (!webhookUrl) {
    return {
      success: false,
      error: `Webhook ${action} não configurado`,
    };
  }

  try {
    const timestamp = Date.now();
    const fullPayload = {
      ...payload,
      action,
      timestamp,
    };

    const payloadString = JSON.stringify(fullPayload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-Action': action,
    };

    if (FALLBACK_SECRET) {
      const signature = await generateSignature(payloadString, FALLBACK_SECRET);
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}

/**
 * Envia requisição para o webhook
 *
 * Em produção: usa Cloudflare Worker Proxy (seguro)
 * Em desenvolvimento: usa URLs diretas do n8n (fallback)
 *
 * @param action - Tipo de ação (launch, pause, resume, validate_phone)
 * @param payload - Dados a enviar
 * @returns Resultado da operação
 */
export async function sendWebhook(
  action: WebhookAction,
  payload: WebhookPayload
): Promise<WebhookResult> {
  // Produção: usar proxy
  if (WEBHOOK_PROXY_URL) {
    return sendViaProxy(action, payload);
  }

  // Desenvolvimento: fallback para URLs diretas
  return sendDirect(action, payload);
}

/**
 * Verifica se os webhooks estão configurados
 */
export function isWebhookConfigured(action?: WebhookAction): boolean {
  // Se proxy está configurado, assumir que está OK
  if (WEBHOOK_PROXY_URL) {
    return true;
  }

  // Fallback: verificar URLs diretas
  if (action) {
    return Boolean(FALLBACK_URLS[action]);
  }

  return Boolean(
    FALLBACK_URLS.launch &&
    FALLBACK_URLS.pause &&
    FALLBACK_URLS.resume
  );
}

/**
 * Verifica se está usando o proxy seguro
 */
export function isUsingSecureProxy(): boolean {
  return Boolean(WEBHOOK_PROXY_URL);
}

/**
 * Envia um lead individual para validação de telefone
 */
export async function validatePhoneWebhook(lead: {
  id: string;
  nome: string;
  telefone: string;
  condominio: string | null;
  origem?: string | null;
}): Promise<{ success: boolean; status?: string; error?: string }> {
  const result = await sendWebhook('validate_phone', { lead });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
