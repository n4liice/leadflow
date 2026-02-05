# LeadFlow Pro - Documentação Técnica Mestre

> **Versão:** 1.0.0
> **Última Atualização:** Fevereiro 2026
> **Arquitetura:** Feature-Based com Hooks Layer

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Projeto](#3-arquitetura-do-projeto)
4. [Mapeamento de Pastas](#4-mapeamento-de-pastas)
5. [Integração com n8n (Backend IA)](#5-integração-com-n8n-backend-ia)
6. [Persistência com Supabase](#6-persistência-com-supabase)
7. [Fluxo de Dados](#7-fluxo-de-dados)
8. [Sistema de Autenticação](#8-sistema-de-autenticação)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Diagramas de Arquitetura](#10-diagramas-de-arquitetura)
11. [Melhorias Recomendadas](#11-melhorias-recomendadas)

---

## 1. Visão Geral

**LeadFlow Pro** é uma plataforma de gestão de leads e automação de campanhas WhatsApp, desenvolvida para o mercado imobiliário. O sistema integra:

- **Frontend React** para interface de usuário
- **n8n** como orquestrador de workflows e processamento de IA
- **Supabase** (PostgreSQL) para persistência de dados

### Funcionalidades Principais

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Métricas consolidadas e visão geral do sistema |
| **Leads** | Gestão de contatos com validação de telefone via IA |
| **Captadores** | Gerenciamento de instâncias WhatsApp |
| **Campanhas** | Criação e execução de disparos em massa |
| **Monitor** | Acompanhamento em tempo real dos envios |
| **Pipeline** | Kanban para gestão do funil de vendas |
| **Templates** | Editor de mensagens com spintext |

---

## 2. Stack Tecnológica

### Dependências de Produção

| Pacote | Versão | Função |
|--------|--------|--------|
| `react` | ^18.3.1 | Framework de UI |
| `react-dom` | ^18.3.1 | Renderização DOM |
| `react-router-dom` | ^6.30.1 | Roteamento SPA |
| `@tanstack/react-query` | ^5.83.0 | Cache e gerenciamento de estado servidor |
| `@supabase/supabase-js` | ^2.93.3 | Cliente Supabase (banco + realtime) |
| `zod` | ^3.25.76 | Validação de schemas |
| `react-hook-form` | ^7.61.1 | Gerenciamento de formulários |
| `@hookform/resolvers` | ^3.10.0 | Integração zod + react-hook-form |
| `date-fns` | ^3.6.0 | Manipulação de datas |
| `recharts` | ^2.15.4 | Gráficos e visualizações |
| `sonner` | ^1.7.4 | Notificações toast |
| `lucide-react` | ^0.462.0 | Ícones |
| `tailwind-merge` | ^2.6.0 | Merge de classes Tailwind |
| `class-variance-authority` | ^0.7.1 | Variantes de componentes |
| `cmdk` | ^1.1.1 | Command palette |

### UI Components (Radix UI)

```
@radix-ui/react-accordion, alert-dialog, avatar, checkbox, collapsible,
context-menu, dialog, dropdown-menu, hover-card, label, menubar,
navigation-menu, popover, progress, radio-group, scroll-area, select,
separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip
```

### Dependências de Desenvolvimento

| Pacote | Versão | Função |
|--------|--------|--------|
| `vite` | ^5.4.19 | Build tool |
| `@vitejs/plugin-react-swc` | ^3.11.0 | Compilação React com SWC |
| `typescript` | ^5.8.3 | Tipagem estática |
| `vitest` | ^3.2.4 | Framework de testes |
| `tailwindcss` | ^3.4.17 | CSS utility-first |
| `eslint` | ^9.32.0 | Linting |

---

## 3. Arquitetura do Projeto

O projeto segue uma arquitetura **Feature-Based com Hooks Layer**, separando responsabilidades em camadas bem definidas:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │  Components │  │    UI Components        │  │
│  │  (Routes)   │  │  (Shared)   │  │  (Radix + shadcn/ui)    │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        STATE LAYER                               │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │  AuthContext    │  │  React Query (Cache + Mutations)    │   │
│  │  (Global Auth)  │  │  useLeads, useCampanhas, etc.       │   │
│  └────────┬────────┘  └──────────────────┬──────────────────┘   │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                           │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │   Supabase Client   │  │      Webhook Utilities          │   │
│  │  (Database + RT)    │  │  (n8n Communication)            │   │
│  └──────────┬──────────┘  └───────────────┬─────────────────┘   │
└─────────────┼─────────────────────────────┼─────────────────────┘
              │                             │
              ▼                             ▼
       ┌──────────────┐            ┌──────────────────┐
       │   Supabase   │            │       n8n        │
       │  (PostgreSQL)│            │   (Workflows)    │
       └──────────────┘            └──────────────────┘
```

---

## 4. Mapeamento de Pastas

```
leadflow-pro/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── ui/              # shadcn/ui (~60 componentes)
│   │   ├── AppSidebar.tsx   # Navegação lateral
│   │   ├── Layout.tsx       # Wrapper de layout
│   │   └── PrivateRoute.tsx # Proteção de rotas
│   │
│   ├── contexts/             # Estado global React
│   │   └── AuthContext.tsx  # Autenticação e sessão
│   │
│   ├── hooks/                # Custom hooks (React Query)
│   │   ├── useLeads.ts      # CRUD de leads
│   │   ├── useDisparos.ts   # Monitoramento de envios
│   │   ├── useCampanhas.ts  # Gestão de campanhas
│   │   ├── useCaptadores.ts # Instâncias WhatsApp
│   │   ├── usePipeline.ts   # Kanban/funil
│   │   ├── useTemplates.ts  # Templates de mensagem
│   │   └── useUsuarios.ts   # Gestão de usuários
│   │
│   ├── pages/                # Componentes de página (rotas)
│   │   ├── Dashboard.tsx    # Página inicial (admin)
│   │   ├── LeadsPage.tsx    # Gestão de leads
│   │   ├── CaptadoresPage.tsx
│   │   ├── CampanhasPage.tsx
│   │   ├── MonitorPage.tsx  # Tempo real
│   │   ├── PipelinePage.tsx # Kanban
│   │   ├── TemplatesPage.tsx
│   │   ├── AdminPage.tsx    # Configurações
│   │   └── LoginPage.tsx
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Singleton do cliente
│   │       └── types.ts     # Tipos auto-gerados
│   │
│   ├── lib/
│   │   ├── webhook.ts       # Comunicação com n8n
│   │   ├── spintext.ts      # Processamento de templates
│   │   └── utils.ts         # Utilitários gerais
│   │
│   ├── App.tsx              # Router principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
│
├── supabase/
│   └── migrations/           # Migrações SQL
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

### Papel de Cada Diretório

| Diretório | Responsabilidade |
|-----------|------------------|
| `components/ui/` | Biblioteca de componentes primitivos (shadcn/ui + Radix) |
| `components/` | Componentes de aplicação (Layout, Sidebar, PrivateRoute) |
| `contexts/` | Estado global via React Context (autenticação) |
| `hooks/` | Lógica de negócio e acesso a dados via React Query |
| `pages/` | Componentes de página vinculados às rotas |
| `integrations/` | Clientes de serviços externos (Supabase) |
| `lib/` | Utilitários puros (webhook, spintext, helpers) |
| `supabase/migrations/` | Versionamento do schema do banco |

---

## 5. Integração com n8n (Backend IA)

### Visão Geral

O n8n atua como backend de processamento, recebendo requisições do frontend para:
1. Disparar campanhas de mensagens
2. Validar números de telefone
3. Processar respostas com IA

### Endpoints de Webhook

| Ação | Variável de Ambiente | Descrição |
|------|---------------------|-----------|
| `launch` | `VITE_N8N_WEBHOOK_LAUNCH` | Inicia execução de campanha |
| `pause` | `VITE_N8N_WEBHOOK_PAUSE` | Pausa campanha em andamento |
| `resume` | `VITE_N8N_WEBHOOK_RESUME` | Retoma campanha pausada |
| `validate_phone` | `VITE_N8N_WEBHOOK_VALIDATE_PHONE` | Valida número de telefone |

### Estrutura de Requisição

```typescript
// Headers enviados em todas as requisições
{
  "Content-Type": "application/json",
  "X-Webhook-Timestamp": "1706745600000",      // Unix timestamp
  "X-Webhook-Action": "launch",                 // Tipo da ação
  "X-Webhook-Signature": "sha256_hash..."       // HMAC-SHA256
}
```

### Payload: Launch Campaign

```typescript
// POST para VITE_N8N_WEBHOOK_LAUNCH
{
  "campaign_id": "uuid-da-campanha",
  "campanha": {
    "nome": "Campanha Janeiro",
    "qtd_disparos": 500,
    "status": "ativa",
    "data_inicio": "2026-02-01",
    "horario_inicio": "08:00",
    "horario_fim": "18:00",
    "intervalo_minutos": 2,
    "disparos_por_hora": 30
  },
  "leads": [
    {
      "id_lead": "uuid-lead-1",
      "nome": "João Silva",
      "telefone": "5511999999999",
      "condominio": "Edifício Aurora"
    }
  ],
  "action": "launch",
  "timestamp": 1706745600000
}
```

### Payload: Validate Phone

```typescript
// POST para VITE_N8N_WEBHOOK_VALIDATE_PHONE
{
  "lead": {
    "id": "uuid-do-lead",
    "nome": "Maria Santos",
    "telefone": "5511988888888",
    "condominio": "Residencial Sol",
    "origem": "site"
  },
  "action": "validate_phone",
  "timestamp": 1706745600000
}
```

### Resposta Esperada do n8n

#### Validação de Telefone
```typescript
// O n8n deve atualizar diretamente no Supabase:
// leadflow_leads.status_telefone = "verificado" | "fixo" | "nao_existe" | "invalido"
// leadflow_leads.status_validacao = "validado" | "invalido"
```

#### Disparo de Mensagens
```typescript
// O n8n deve:
// 1. Criar registros em leadflow_disparos com status "pendente"
// 2. Atualizar para "enviando" ao processar
// 3. Atualizar para "enviado" ou "erro" após conclusão
// 4. Preencher erro_log em caso de falha
// 5. Marcar enviado_at com timestamp do envio
```

### Segurança dos Webhooks

```typescript
// Algoritmo de assinatura (webhook.ts)
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Validação no n8n:**
1. Extrair `X-Webhook-Signature` do header
2. Recalcular hash: `SHA256(body + WEBHOOK_SECRET)`
3. Comparar hashes (timing-safe comparison)
4. Validar timestamp para evitar replay attacks

---

## 6. Persistência com Supabase

### Schema do Banco de Dados

#### Tabela: `leadflow_usuarios`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK, auto-gerado |
| `user_id` | uuid | NULL | ID Supabase Auth (não usado) |
| `nome` | text | NOT NULL | Nome completo |
| `email` | text | NOT NULL | Email único |
| `senha` | text | NULL | Hash da senha |
| `role` | enum | NOT NULL | `admin` \| `captador` |
| `ativo` | boolean | NOT NULL | Status da conta |
| `created_at` | timestamptz | NOT NULL | Criação |
| `updated_at` | timestamptz | NOT NULL | Última atualização |

#### Tabela: `leadflow_leads`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `nome` | text | NOT NULL | Nome do lead |
| `telefone` | text | NOT NULL | Número WhatsApp |
| `condominio` | text | NULL | Nome do empreendimento |
| `origem` | text | NULL | Fonte do lead |
| `status_telefone` | text | NULL | Resultado da validação |
| `status_validacao` | enum | NOT NULL | `pendente` \| `validado` \| `invalido` |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_captadores`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `instancia` | text | NOT NULL | Nome da instância WhatsApp |
| `token` | text | NULL | Token de autenticação |
| `nome_captador` | text | NULL | Nome amigável |
| `telefone_cadastrado` | text | NULL | Número vinculado |
| `status_ativo` | boolean | NOT NULL | Instância online |
| `em_uso` | boolean | NOT NULL | Em uso por campanha |
| `id_usuario` | uuid | NULL | FK → leadflow_usuarios |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_campanhas`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `nome` | text | NOT NULL | Nome da campanha |
| `qtd_disparos` | integer | NOT NULL | Quantidade de mensagens |
| `status` | enum | NOT NULL | `rascunho` \| `ativa` \| `pausada` \| `concluida` |
| `data_inicio` | date | NULL | Data programada |
| `horario_inicio` | time | NULL | Início do horário de envio |
| `horario_fim` | time | NULL | Fim do horário de envio |
| `intervalo_minutos` | integer | NULL | Intervalo entre envios |
| `disparos_por_hora` | integer | NULL | Rate limit |
| `leads` | jsonb | NULL | Lista de leads selecionados |
| `templates` | jsonb | NULL | Templates vinculados |
| `id_captador` | uuid | NULL | FK → leadflow_captadores |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_disparos`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `id_campanha` | uuid | NOT NULL | FK → leadflow_campanhas |
| `id_captador` | uuid | NULL | FK → leadflow_captadores |
| `id_lead` | uuid | NULL | FK → leadflow_leads |
| `id_template` | uuid | NULL | FK → leadflow_templates |
| `nome` | text | NOT NULL | Nome do lead (snapshot) |
| `telefone` | text | NOT NULL | Telefone (snapshot) |
| `condominio` | text | NULL | Condomínio (snapshot) |
| `mensagem_enviada` | text | NULL | Mensagem final após spintext |
| `status_envio` | enum | NOT NULL | `pendente` \| `enviando` \| `enviado` \| `erro` |
| `erro_log` | text | NULL | Detalhes do erro |
| `enviado_at` | timestamptz | NULL | Timestamp do envio |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_templates`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `nome` | text | NOT NULL | Nome do template |
| `conteudo` | text | NOT NULL | Texto com spintext |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_campanha_templates`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `id_campanha` | uuid | NOT NULL | FK → leadflow_campanhas |
| `id_template` | uuid | NOT NULL | FK → leadflow_templates |
| `peso` | integer | NOT NULL | Peso para distribuição A/B |
| `created_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_pipeline`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `id_disparo` | uuid | NOT NULL | FK → leadflow_disparos (UNIQUE) |
| `id_captador` | uuid | NULL | FK → leadflow_captadores |
| `nome` | text | NOT NULL | Nome do lead |
| `telefone` | text | NOT NULL | Telefone do lead |
| `condominio` | text | NULL | Condomínio |
| `stage` | enum | NOT NULL | Stage atual do funil |
| `observacoes` | text | NULL | Notas do captador |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |

#### Tabela: `leadflow_pipeline_historico`
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | uuid | NOT NULL | PK |
| `id_pipeline` | uuid | NOT NULL | FK → leadflow_pipeline |
| `stage_anterior` | enum | NULL | Stage antes da mudança |
| `stage_novo` | enum | NOT NULL | Stage após mudança |
| `id_usuario` | uuid | NULL | FK → leadflow_usuarios |
| `movido_em` | timestamptz | NOT NULL | Timestamp da mudança |

### Enums do Banco

```sql
-- Status de campanhas
CREATE TYPE status_campanha AS ENUM ('rascunho', 'ativa', 'pausada', 'concluida');

-- Status de envio de mensagens
CREATE TYPE status_envio AS ENUM ('pendente', 'enviando', 'enviado', 'erro');

-- Status de validação de leads
CREATE TYPE leadflow_status_validacao AS ENUM ('pendente', 'validado', 'invalido');

-- Stages do pipeline/funil
CREATE TYPE stage_pipeline AS ENUM (
  'perdido',           -- Lead perdido
  'acompanhamento',    -- Em acompanhamento
  'indicacao',         -- Indicação recebida
  'qualificado',       -- Lead qualificado
  'coleta_dados',      -- Coletando dados
  'captacao_formalizada', -- Captação formalizada
  'agendamento'        -- Visita agendada
);
```

### Diagrama ER

```mermaid
erDiagram
    leadflow_usuarios ||--o{ leadflow_captadores : "possui"
    leadflow_usuarios ||--o{ leadflow_pipeline_historico : "registra"

    leadflow_captadores ||--o{ leadflow_campanhas : "executa"
    leadflow_captadores ||--o{ leadflow_disparos : "envia"
    leadflow_captadores ||--o{ leadflow_pipeline : "gerencia"

    leadflow_campanhas ||--o{ leadflow_disparos : "contém"
    leadflow_campanhas ||--o{ leadflow_campanha_templates : "usa"

    leadflow_templates ||--o{ leadflow_campanha_templates : "usado_em"
    leadflow_templates ||--o{ leadflow_disparos : "template_de"

    leadflow_leads ||--o{ leadflow_disparos : "recebe"

    leadflow_disparos ||--|| leadflow_pipeline : "gera"

    leadflow_pipeline ||--o{ leadflow_pipeline_historico : "histórico"

    leadflow_usuarios {
        uuid id PK
        text nome
        text email
        text senha
        enum role
        boolean ativo
    }

    leadflow_leads {
        uuid id PK
        text nome
        text telefone
        text condominio
        text origem
        enum status_validacao
    }

    leadflow_captadores {
        uuid id PK
        text instancia
        text token
        boolean status_ativo
        uuid id_usuario FK
    }

    leadflow_campanhas {
        uuid id PK
        text nome
        integer qtd_disparos
        enum status
        uuid id_captador FK
    }

    leadflow_disparos {
        uuid id PK
        uuid id_campanha FK
        uuid id_lead FK
        uuid id_captador FK
        enum status_envio
        text mensagem_enviada
    }

    leadflow_templates {
        uuid id PK
        text nome
        text conteudo
    }

    leadflow_pipeline {
        uuid id PK
        uuid id_disparo FK
        enum stage
        text observacoes
    }
```

### Configuração de Autenticação

O sistema utiliza **autenticação customizada** (não Supabase Auth):

```typescript
// Fluxo de login (AuthContext.tsx)
const signIn = async (email: string, senha: string) => {
  const { data, error } = await supabase
    .from("leadflow_usuarios")
    .select("id, nome, email, role, ativo")
    .eq("email", email.toLowerCase().trim())
    .eq("senha", senha)  // ⚠️ Comparação direta (ver melhorias)
    .eq("ativo", true)
    .maybeSingle();

  // Sessão salva em localStorage
  localStorage.setItem("leadflow_usuario", JSON.stringify(data));
};
```

### Row Level Security (RLS)

```sql
-- Políticas atuais permitem acesso público
-- A segurança é implementada na camada de aplicação
ALTER TABLE leadflow_usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON leadflow_usuarios FOR ALL USING (true);
```

---

## 7. Fluxo de Dados

### Diagrama de Ciclo de Vida de Requisição

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend React
    participant Q as React Query
    participant W as Webhook Utils
    participant N as n8n Workflow
    participant S as Supabase
    participant WA as WhatsApp API

    %% Fluxo de Criação de Campanha
    rect rgb(240, 248, 255)
        Note over U,S: Criação de Campanha
        U->>F: Cria campanha com leads
        F->>Q: useMutation (createCampanha)
        Q->>S: INSERT leadflow_campanhas
        S-->>Q: campanha criada
        Q-->>F: Atualiza cache
        F-->>U: Mostra campanha criada
    end

    %% Fluxo de Lançamento
    rect rgb(255, 248, 240)
        Note over U,WA: Lançamento de Campanha
        U->>F: Clica "Lançar"
        F->>W: sendWebhook('launch', payload)
        W->>W: Gera assinatura HMAC
        W->>N: POST /webhook/launch
        N->>S: Cria disparos (status: pendente)

        loop Para cada lead
            N->>S: UPDATE disparo (status: enviando)
            N->>WA: Envia mensagem WhatsApp
            WA-->>N: Resposta (sucesso/erro)
            N->>S: UPDATE disparo (status: enviado/erro)
        end

        N-->>W: 200 OK
        W-->>F: { success: true }
    end

    %% Fluxo Real-time
    rect rgb(240, 255, 240)
        Note over U,S: Atualização em Tempo Real
        S--)F: Realtime: disparo atualizado
        F->>Q: Invalida cache 'disparos'
        Q->>S: Refetch disparos
        S-->>Q: Lista atualizada
        Q-->>F: Atualiza estado
        F-->>U: UI reflete mudança
    end

    %% Fluxo Pipeline
    rect rgb(255, 240, 255)
        Note over N,S: Auto-criação Pipeline
        Note right of N: Lead respondeu
        N->>S: UPDATE lead (interacao: true)
        S->>S: Trigger: cria card pipeline
        S--)F: Realtime: novo card
    end
```

### Fluxo de Validação de Telefone

```mermaid
flowchart TD
    A[Admin seleciona lead] --> B[Clica 'Validar Telefone']
    B --> C{Webhook configurado?}
    C -->|Não| D[Exibe erro]
    C -->|Sim| E[sendWebhook validate_phone]
    E --> F[n8n recebe requisição]
    F --> G[Verifica assinatura HMAC]
    G -->|Inválida| H[Rejeita 401]
    G -->|Válida| I[Consulta API de validação]
    I --> J{Resultado}
    J -->|WhatsApp válido| K[status: verificado]
    J -->|Telefone fixo| L[status: fixo]
    J -->|Não existe| M[status: nao_existe]
    K --> N[UPDATE leadflow_leads]
    L --> N
    M --> N
    N --> O[Frontend recebe atualização]
    O --> P[UI mostra novo status]
```

### Fluxo de Autenticação

```mermaid
flowchart TD
    A[Usuário acessa app] --> B{Token no localStorage?}
    B -->|Não| C[Redireciona /login]
    B -->|Sim| D[Valida token no banco]
    D --> E{Usuário ativo?}
    E -->|Não| F[Remove token, vai /login]
    E -->|Sim| G[Carrega dados do usuário]
    G --> H{Role = admin?}
    H -->|Sim| I[Acesso total]
    H -->|Não| J[Busca captadores vinculados]
    J --> K[Acesso restrito: Monitor + Pipeline]

    subgraph Refresh
        L[Intervalo 10s] --> M[Revalida captadores]
        N[Realtime subscription] --> O[Atualiza estado]
    end
```

---

## 8. Sistema de Autenticação

### Roles e Permissões

| Role | Dashboard | Leads | Captadores | Campanhas | Monitor | Pipeline | Templates | Admin |
|------|:---------:|:-----:|:----------:|:---------:|:-------:|:--------:|:---------:|:-----:|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `captador` | ❌ | ❌ | ❌ | ❌ | ✅* | ✅* | ❌ | ❌ |

*\* Captadores veem apenas dados de suas próprias instâncias*

### Implementação do PrivateRoute

```typescript
// src/components/PrivateRoute.tsx
export function PrivateRoute({ children, requireAdmin = false }) {
  const { usuario, loading, isAdmin, captadores } = useAuth();

  if (loading) return <LoadingSpinner />;

  // Não autenticado
  if (!usuario) return <Navigate to="/login" />;

  // Rota admin, mas usuário é captador
  if (requireAdmin && !isAdmin) return <Navigate to="/monitor" />;

  // Captador sem instâncias vinculadas
  if (!isAdmin && captadores.length === 0) {
    return <EmptyState message="Nenhum captador vinculado" />;
  }

  return children;
}
```

---

## 9. Variáveis de Ambiente

### Arquivo `.env`

```bash
# ══════════════════════════════════════════════════════════════
# SUPABASE - Banco de Dados e Realtime
# ══════════════════════════════════════════════════════════════
VITE_SUPABASE_PROJECT_ID=seu_project_id
VITE_SUPABASE_URL=https://seu_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ══════════════════════════════════════════════════════════════
# N8N - Webhooks de Automação
# ══════════════════════════════════════════════════════════════
VITE_N8N_WEBHOOK_LAUNCH=https://seu-n8n.com/webhook/launch-campanha
VITE_N8N_WEBHOOK_PAUSE=https://seu-n8n.com/webhook/pause-campanha
VITE_N8N_WEBHOOK_RESUME=https://seu-n8n.com/webhook/resume-campanha
VITE_N8N_WEBHOOK_VALIDATE_PHONE=https://seu-n8n.com/webhook/validate-phone

# ══════════════════════════════════════════════════════════════
# SEGURANÇA - Chave para assinatura HMAC
# ══════════════════════════════════════════════════════════════
VITE_N8N_WEBHOOK_SECRET=sua_chave_secreta_aqui
```

### Tabela de Variáveis

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `VITE_SUPABASE_PROJECT_ID` | ✅ | ID do projeto Supabase |
| `VITE_SUPABASE_URL` | ✅ | URL da API Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Chave pública (anon key) |
| `VITE_N8N_WEBHOOK_LAUNCH` | ✅ | Endpoint para lançar campanhas |
| `VITE_N8N_WEBHOOK_PAUSE` | ✅ | Endpoint para pausar campanhas |
| `VITE_N8N_WEBHOOK_RESUME` | ✅ | Endpoint para retomar campanhas |
| `VITE_N8N_WEBHOOK_VALIDATE_PHONE` | ⚠️ | Endpoint para validação (opcional) |
| `VITE_N8N_WEBHOOK_SECRET` | ⚠️ | Chave HMAC (recomendado) |

---

## 10. Diagramas de Arquitetura

### Visão Macro do Sistema

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[Interface do Usuário]
        RQ[React Query Cache]
        WH[Webhook Client]
    end

    subgraph Backend["Backend (n8n)"]
        WF[Workflows de Automação]
        AI[Processamento IA]
        VAL[Validação de Telefone]
    end

    subgraph Database["Persistência (Supabase)"]
        PG[(PostgreSQL)]
        RT[Realtime Subscriptions]
        RLS[Row Level Security]
    end

    subgraph External["Serviços Externos"]
        WA[WhatsApp API]
        VALID[API Validação]
    end

    UI --> RQ
    RQ <--> PG
    UI --> WH
    WH --> WF
    WF --> AI
    WF --> VAL
    WF <--> PG
    WF --> WA
    VAL --> VALID
    RT --> RQ

    style Frontend fill:#e1f5fe
    style Backend fill:#fff3e0
    style Database fill:#e8f5e9
    style External fill:#fce4ec
```

### Fluxo Completo de Campanha

```mermaid
flowchart LR
    subgraph Criação
        A1[Admin cria campanha] --> A2[Seleciona leads]
        A2 --> A3[Escolhe templates]
        A3 --> A4[Define horários]
    end

    subgraph Execução
        B1[Clica Lançar] --> B2[Webhook launch]
        B2 --> B3[n8n processa fila]
        B3 --> B4[Envia via WhatsApp]
    end

    subgraph Monitoramento
        C1[Realtime updates] --> C2[Monitor atualiza]
        C2 --> C3[Métricas em tempo real]
    end

    subgraph Pipeline
        D1[Lead responde] --> D2[Trigger cria card]
        D2 --> D3[Captador gerencia]
        D3 --> D4[Move entre stages]
    end

    A4 --> B1
    B4 --> C1
    B4 --> D1
```

---

## 11. Melhorias Recomendadas

### 🔴 Crítico - Segurança

#### 1. Autenticação de Senhas
**Problema:** Senhas armazenadas em texto plano e comparadas diretamente.

```typescript
// ❌ Atual (AuthContext.tsx:107-112)
.eq("senha", senha)  // Comparação direta

// ✅ Recomendado
import bcrypt from 'bcryptjs';

// No cadastro
const hashedPassword = await bcrypt.hash(senha, 12);

// No login
const isValid = await bcrypt.compare(senha, user.senha_hash);
```

#### 2. Row Level Security (RLS)
**Problema:** Políticas RLS permitem acesso público a todas as tabelas.

```sql
-- ❌ Atual
CREATE POLICY "allow_all" ON leadflow_usuarios FOR ALL USING (true);

-- ✅ Recomendado
CREATE POLICY "users_own_data" ON leadflow_usuarios
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "captadores_by_user" ON leadflow_captadores
  FOR ALL USING (
    id_usuario IN (
      SELECT id FROM leadflow_usuarios WHERE user_id = auth.uid()
    )
  );
```

#### 3. Validação de Timestamp no Webhook
**Problema:** Não há validação de timestamp para prevenir replay attacks.

```typescript
// ✅ Adicionar no n8n
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos
const timestamp = parseInt(headers['X-Webhook-Timestamp']);
const age = Date.now() - timestamp;

if (age > MAX_AGE_MS) {
  throw new Error('Request expired');
}
```

### 🟡 Importante - Robustez

#### 4. Tratamento de Erros nos Webhooks
**Problema:** Erros de rede não são tratados adequadamente.

```typescript
// ❌ Atual (webhook.ts)
return { success: true };  // Sem parsing da resposta

// ✅ Recomendado
const response = await fetch(webhookUrl, { ... });
const result = await response.json();

if (!response.ok) {
  return {
    success: false,
    error: result.message || `HTTP ${response.status}`,
    details: result
  };
}

return { success: true, data: result };
```

#### 5. Retry com Exponential Backoff
**Problema:** Falhas de rede não têm retry automático.

```typescript
// ✅ Adicionar retry logic
async function sendWebhookWithRetry(
  action: WebhookAction,
  payload: WebhookPayload,
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await sendWebhook(action, payload);
      if (result.success) return result;

      // Espera exponencial: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

#### 6. Validação de Payload com Zod
**Problema:** Payloads de webhook não são validados antes do envio.

```typescript
// ✅ Adicionar schema validation
import { z } from 'zod';

const LaunchPayloadSchema = z.object({
  campaign_id: z.string().uuid(),
  campanha: z.object({
    nome: z.string().min(1),
    qtd_disparos: z.number().positive(),
    status: z.enum(['rascunho', 'ativa', 'pausada', 'concluida']),
  }),
  leads: z.array(z.object({
    id_lead: z.string().uuid(),
    nome: z.string(),
    telefone: z.string().regex(/^\d{10,15}$/),
  })).min(1),
});

// Antes de enviar
const validated = LaunchPayloadSchema.parse(payload);
```

### 🟢 Melhorias de UX

#### 7. Feedback Visual de Webhook
**Problema:** Usuário não sabe se webhook está processando.

```typescript
// ✅ Adicionar estado de loading e feedback
const [isLaunching, setIsLaunching] = useState(false);

const handleLaunch = async () => {
  setIsLaunching(true);
  toast.loading('Enviando para processamento...');

  const result = await sendWebhook('launch', payload);

  setIsLaunching(false);

  if (result.success) {
    toast.success('Campanha enviada! Acompanhe no Monitor.');
  } else {
    toast.error(`Falha: ${result.error}`);
  }
};
```

#### 8. Modo Offline
**Problema:** App não funciona sem conexão.

```typescript
// ✅ Adicionar detecção de offline
const { isOnline } = useNetworkStatus();

if (!isOnline) {
  return <OfflineBanner message="Sem conexão. Dados podem estar desatualizados." />;
}
```

### 📊 Monitoramento

#### 9. Logging Centralizado
**Problema:** Logs dispersos em console.log/console.error.

```typescript
// ✅ Implementar logger estruturado
const logger = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date() })),
  error: (msg: string, error?: Error, meta?: object) =>
    console.error(JSON.stringify({
      level: 'error', msg,
      error: error?.message,
      stack: error?.stack,
      ...meta, ts: new Date()
    })),
};

// Uso
logger.info('Webhook enviado', { action: 'launch', campaignId });
logger.error('Webhook falhou', error, { action: 'launch' });
```

#### 10. Métricas de Performance
**Problema:** Não há visibilidade sobre performance dos webhooks.

```typescript
// ✅ Adicionar métricas
const startTime = performance.now();
const result = await sendWebhook(action, payload);
const duration = performance.now() - startTime;

// Enviar para analytics
trackMetric('webhook_duration', duration, { action });
trackMetric('webhook_success', result.success ? 1 : 0, { action });
```

---

## Apêndice: Scripts Úteis

### Regenerar Tipos do Supabase

```bash
npx supabase gen types typescript --project-id $VITE_SUPABASE_PROJECT_ID > src/integrations/supabase/types.ts
```

### Build de Produção

```bash
npm run build
```

### Executar Testes

```bash
npm run test        # Executa uma vez
npm run test:watch  # Watch mode
```

---

> **Documento gerado automaticamente**
> Para atualizações, execute a análise novamente ou contribua diretamente no repositório.
