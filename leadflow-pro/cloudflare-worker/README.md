# Cloudflare Worker - LeadFlow Webhook Proxy

Este worker atua como proxy seguro entre o frontend LeadFlow e o n8n, ocultando as URLs e secrets dos webhooks.

## Instalação

### 1. Criar o Worker

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navegue para **Workers & Pages** > **Create Application** > **Create Worker**
3. Dê o nome: `leadflow-webhook-proxy`
4. Clique em **Deploy**
5. Clique em **Edit code**
6. Substitua todo o código pelo conteúdo de `worker.js`
7. Clique em **Save and Deploy**

### 2. Configurar Variáveis de Ambiente

1. No Worker, vá para **Settings** > **Variables**
2. Adicione as seguintes variáveis (clique em **Add variable**):

| Nome | Valor | Encrypt |
|------|-------|---------|
| `N8N_WEBHOOK_LAUNCH` | URL completa do webhook de lançar campanha | ✅ |
| `N8N_WEBHOOK_PAUSE` | URL completa do webhook de pausar campanha | ✅ |
| `N8N_WEBHOOK_RESUME` | URL completa do webhook de retomar campanha | ✅ |
| `N8N_WEBHOOK_VALIDATE_PHONE` | URL completa do webhook de validar telefone | ✅ |
| `WEBHOOK_SECRET` | Sua chave secreta HMAC (mesma do n8n) | ✅ |
| `ALLOWED_ORIGIN` | `https://leadflow.vistalivretech.com.br` | ❌ |

3. Clique em **Save and Deploy**

### 3. Configurar Rota Customizada (Opcional)

Para usar um subdomínio como `api.vistalivretech.com.br`:

1. Vá para **Settings** > **Triggers** > **Custom Domains**
2. Adicione: `api.vistalivretech.com.br`

Ou use a URL padrão do Worker: `https://leadflow-webhook-proxy.<seu-account>.workers.dev`

## Uso

O frontend deve chamar:

```
POST https://leadflow-webhook-proxy.<account>.workers.dev/webhook/{action}
```

Ações disponíveis:
- `/webhook/launch` - Lançar campanha
- `/webhook/pause` - Pausar campanha
- `/webhook/resume` - Retomar campanha
- `/webhook/validate_phone` - Validar telefone

## Segurança

- URLs do n8n ficam ocultas no Worker
- Secret HMAC nunca chega ao navegador
- Origin é validado para bloquear requests de outros sites
- Assinatura HMAC é gerada no servidor, não no cliente

## Teste

```bash
curl -X POST https://leadflow-webhook-proxy.workers.dev/webhook/launch \
  -H "Content-Type: application/json" \
  -H "Origin: https://leadflow.vistalivretech.com.br" \
  -d '{"campaign_id": "test"}'
```
