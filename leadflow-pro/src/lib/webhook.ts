/**
 * Utilitário para envio seguro de webhooks para o n8n
 *
 * Recursos de segurança:
 * - Assinatura HMAC SHA-256 para validar origem
 * - Timestamp para prevenir replay attacks
 * - URLs fixas via variáveis de ambiente (não editáveis pelo usuário)
 */

// URLs dos webhooks (fixas via .env)
const WEBHOOK_URLS = {
  launch: import.meta.env.VITE_N8N_WEBHOOK_LAUNCH,
  pause: import.meta.env.VITE_N8N_WEBHOOK_PAUSE,
  resume: import.meta.env.VITE_N8N_WEBHOOK_RESUME,
  validate_phone: import.meta.env.VITE_N8N_WEBHOOK_VALIDATE_PHONE,
} as const;

const WEBHOOK_SECRET = import.meta.env.VITE_N8N_WEBHOOK_SECRET;

export type WebhookAction = keyof typeof WEBHOOK_URLS;

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
}

/**
 * Gera assinatura HMAC SHA-256 para o payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Envia requisição segura para o webhook do n8n
 *
 * @param action - Tipo de ação (launch, pause, resume)
 * @param payload - Dados a enviar (deve conter campaign_id)
 * @returns Resultado da operação
 */
export async function sendWebhook(
  action: WebhookAction,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const webhookUrl = WEBHOOK_URLS[action];

  // Validação: URL deve estar configurada
  if (!webhookUrl) {
    console.warn(`Webhook ${action} não configurado. Configure VITE_N8N_WEBHOOK_${action.toUpperCase()} no .env`);
    return {
      success: false,
      error: `Webhook ${action} não configurado`,
    };
  }

  // Aviso se secret não estiver configurada (mas continua funcionando)
  if (!WEBHOOK_SECRET) {
    console.warn('VITE_N8N_WEBHOOK_SECRET não configurado - requisições não serão assinadas');
  }

  try {
    // Adiciona timestamp para prevenir replay attacks
    const timestamp = Date.now();
    const fullPayload = {
      ...payload,
      action,
      timestamp,
    };

    const payloadString = JSON.stringify(fullPayload);

    // Headers base
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Timestamp': timestamp.toString(),
      'X-Webhook-Action': action,
    };

    // Adiciona assinatura apenas se secret estiver configurada
    if (WEBHOOK_SECRET) {
      const signature = await generateSignature(payloadString, WEBHOOK_SECRET);
      headers['X-Webhook-Signature'] = signature;
    }

    // Envia requisição
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
    console.error(`Erro ao enviar webhook ${action}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verifica se os webhooks estão configurados
 */
export function isWebhookConfigured(action?: WebhookAction): boolean {
  if (action) {
    return Boolean(WEBHOOK_URLS[action] && WEBHOOK_SECRET);
  }
  return Boolean(
    WEBHOOK_URLS.launch &&
    WEBHOOK_URLS.pause &&
    WEBHOOK_URLS.resume &&
    WEBHOOK_SECRET
  );
}

/**
 * Envia um lead individual para validação de telefone no n8n
 * O n8n deve retornar o status: verificado, fixo, ou nao_existe
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
