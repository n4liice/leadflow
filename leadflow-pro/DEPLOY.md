# LeadFlow Pro - Guia de Deploy em Produção

## Pré-requisitos

- VPS com Docker e Docker Compose instalados
- Conta no Cloudflare (para DNS e Workers)
- Conta no Supabase (já configurada)
- Repositório no GitHub

---

## 1. Deploy da Edge Function (Supabase)

A Edge Function `verify-password` é responsável pela autenticação segura com bcrypt.

### 1.1 Instalar Supabase CLI

```bash
npm install -g supabase
```

### 1.2 Login e Link do Projeto

```bash
supabase login
supabase link --project-ref nrlnukkkrgtcnrsozbea
```

### 1.3 Deploy da Edge Function

```bash
cd leadflow-pro
supabase functions deploy verify-password
```

### 1.4 Migrar Senhas Existentes (Opcional)

Se você já tem usuários com senhas em texto plano, eles serão migrados automaticamente no próximo login bem-sucedido. A Edge Function detecta senhas sem hash e as converte para bcrypt.

Para migrar manualmente todas as senhas de uma vez, execute no Supabase SQL Editor:

```sql
-- CUIDADO: Execute apenas se souber as senhas atuais em texto plano
-- Este é um exemplo - você precisará adaptar para sua situação

-- Opção 1: Resetar todas as senhas para um valor temporário
-- (usuários precisarão trocar depois)
-- UPDATE leadflow_usuarios SET senha = '$2a$10$...' WHERE senha NOT LIKE '$2%';

-- Opção 2: Deixar a migração automática acontecer nos próximos logins
-- (recomendado - não requer ação)
```

---

## 2. Configurar Cloudflare Worker

O Worker funciona como proxy seguro para os webhooks do n8n.

### 2.1 Criar o Worker

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **Workers & Pages** → **Create Application** → **Create Worker**
3. Nome: `leadflow-webhook-proxy`
4. Cole o código de `cloudflare-worker/worker.js`
5. Clique em **Deploy**

### 2.2 Configurar Variáveis de Ambiente

No Worker, vá em **Settings** → **Variables**:

| Variável | Valor |
|----------|-------|
| `N8N_WEBHOOK_LAUNCH` | URL completa do webhook de launch no n8n |
| `N8N_WEBHOOK_PAUSE` | URL completa do webhook de pause no n8n |
| `N8N_WEBHOOK_RESUME` | URL completa do webhook de resume no n8n |
| `N8N_WEBHOOK_VALIDATE_PHONE` | URL completa do webhook de validação |
| `WEBHOOK_SECRET` | Chave secreta para assinatura HMAC |
| `ALLOWED_ORIGIN` | `https://leadflow.vistalivretech.com.br` |

### 2.3 Configurar Custom Domain (Opcional)

1. No Worker, vá em **Settings** → **Triggers** → **Custom Domains**
2. Adicione: `leadflow-proxy.vistalivretech.workers.dev`

---

## 3. Configurar DNS no Cloudflare

### 3.1 Adicionar Domínio

1. No Cloudflare, vá em **DNS** → **Records**
2. Adicione registro tipo **A**:
   - Name: `leadflow`
   - IPv4: `[IP da sua VPS]`
   - Proxy status: **Proxied** (nuvem laranja)

### 3.2 Configurar SSL

1. Vá em **SSL/TLS** → **Overview**
2. Selecione modo: **Full (strict)**
3. Em **Edge Certificates**:
   - Always Use HTTPS: **ON**
   - Minimum TLS Version: **1.2**

---

## 4. Configurar GitHub Secrets

No repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions**:

| Secret | Descrição |
|--------|-----------|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_USER` | Usuário SSH (ex: `root` ou `deploy`) |
| `VPS_SSH_KEY` | Chave privada SSH (conteúdo completo) |
| `VITE_SUPABASE_URL` | `https://nrlnukkkrgtcnrsozbea.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sua anon key do Supabase |
| `VITE_WEBHOOK_PROXY_URL` | `https://leadflow-webhook-proxy.[seu-account].workers.dev` |

### Gerar chave SSH para deploy

```bash
# Na sua máquina local
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/leadflow_deploy

# Copie a chave pública para a VPS
ssh-copy-id -i ~/.ssh/leadflow_deploy.pub user@sua-vps

# O conteúdo de ~/.ssh/leadflow_deploy (privada) vai no secret VPS_SSH_KEY
```

---

## 5. Preparar a VPS

### 5.1 Instalar Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 5.2 Criar Diretório do Projeto

```bash
sudo mkdir -p /opt/leadflow
sudo chown $USER:$USER /opt/leadflow
cd /opt/leadflow
git clone https://github.com/seu-usuario/leadflow.git .
```

### 5.3 Criar arquivo .env

```bash
cat > /opt/leadflow/leadflow-pro/.env << 'EOF'
VITE_SUPABASE_URL=https://nrlnukkkrgtcnrsozbea.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key-aqui
VITE_WEBHOOK_PROXY_URL=https://leadflow-webhook-proxy.seu-account.workers.dev
EOF
```

### 5.4 Build e Start Manual (Primeiro Deploy)

```bash
cd /opt/leadflow/leadflow-pro
docker compose up -d --build
```

---

## 6. Deploy Automático

Após a configuração inicial, todo push na branch `main` irá:

1. Triggerar o GitHub Actions
2. Conectar via SSH na VPS
3. Fazer `git pull`
4. Rebuildar o container Docker
5. Reiniciar o serviço

---

## 7. Verificação Pós-Deploy

### Checklist de Segurança

- [ ] Acessar https://leadflow.vistalivretech.com.br
- [ ] Verificar que não há console.logs no DevTools (F12 → Console)
- [ ] Verificar que URLs do n8n NÃO aparecem no Network tab
- [ ] Testar login (deve funcionar com bcrypt)
- [ ] Testar disparo de campanha
- [ ] Verificar headers de segurança: https://securityheaders.com

### Comandos Úteis na VPS

```bash
# Ver logs do container
docker compose logs -f

# Reiniciar container
docker compose restart

# Rebuild forçado
docker compose up -d --build --force-recreate

# Ver status
docker compose ps
```

---

## Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (DNS + CDN)                       │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │ leadflow.vistalivre │    │ leadflow-webhook-proxy (Worker) │ │
│  │    tech.com.br      │    │   - Proxy para n8n             │ │
│  │    (DNS + SSL)      │    │   - HMAC Signature             │ │
│  └──────────┬──────────┘    └──────────────┬──────────────────┘ │
└─────────────┼───────────────────────────────┼───────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│         VPS             │    │            n8n                  │
│  ┌───────────────────┐  │    │  (Workflows de automação)       │
│  │ Docker Container  │  │    │                                 │
│  │  - nginx          │  │    └─────────────────────────────────┘
│  │  - React App      │  │
│  └───────────────────┘  │
└─────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │    PostgreSQL       │    │   Edge Function                 │ │
│  │  (leadflow_*)       │    │   verify-password (bcrypt)      │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Erro: "Erro ao conectar com o servidor" no login

1. Verifique se a Edge Function foi deployada: `supabase functions list`
2. Teste a função: `supabase functions invoke verify-password --body '{"email":"test@test.com","senha":"123"}'`

### Erro: Webhooks não funcionam

1. Verifique se o Worker está online no Cloudflare Dashboard
2. Teste o Worker diretamente: `curl -X POST https://seu-worker.workers.dev/webhook/launch -d '{}'`
3. Verifique as variáveis de ambiente do Worker

### Erro: Site não carrega

1. Verifique DNS: `nslookup leadflow.vistalivretech.com.br`
2. Verifique container: `docker compose ps`
3. Verifique logs: `docker compose logs -f`
