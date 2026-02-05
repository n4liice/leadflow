-- =====================================================
-- PARTE 1: Adicionar campo 'interacao' na tabela LEADS
-- =====================================================

ALTER TABLE leadflow_leads
ADD COLUMN IF NOT EXISTS interacao BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leads_interacao ON leadflow_leads(interacao) WHERE interacao = true;

COMMENT ON COLUMN leadflow_leads.interacao IS 'Flag setado pelo n8n quando o lead responde uma mensagem';


-- =====================================================
-- PARTE 2: Criar enum e tabela de Pipeline/Kanban
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stage_pipeline') THEN
    CREATE TYPE stage_pipeline AS ENUM (
      'perdido',
      'acompanhamento',
      'indicacao',
      'qualificado',
      'coleta_dados',
      'captacao_formalizada',
      'agendamento'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS leadflow_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_disparo UUID NOT NULL REFERENCES leadflow_disparos(id) ON DELETE CASCADE,
  id_captador UUID REFERENCES leadflow_captadores(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  condominio VARCHAR(255),
  stage stage_pipeline NOT NULL DEFAULT 'acompanhamento',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id_disparo)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_captador ON leadflow_pipeline(id_captador);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON leadflow_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_created_at ON leadflow_pipeline(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pipeline_updated_at ON leadflow_pipeline;
CREATE TRIGGER trigger_pipeline_updated_at
  BEFORE UPDATE ON leadflow_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_updated_at();


-- =====================================================
-- PARTE 3: Tabela de histórico de movimentações
-- =====================================================

CREATE TABLE IF NOT EXISTS leadflow_pipeline_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pipeline UUID NOT NULL REFERENCES leadflow_pipeline(id) ON DELETE CASCADE,
  stage_anterior stage_pipeline,
  stage_novo stage_pipeline NOT NULL,
  movido_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_historico_pipeline ON leadflow_pipeline_historico(id_pipeline);
CREATE INDEX IF NOT EXISTS idx_pipeline_historico_movido_em ON leadflow_pipeline_historico(movido_em DESC);

COMMENT ON TABLE leadflow_pipeline_historico IS 'Histórico de todas as movimentações de cards no pipeline';


-- =====================================================
-- PARTE 4: Trigger para registrar movimentações automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_movimentacao_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO leadflow_pipeline_historico (id_pipeline, stage_anterior, stage_novo)
    VALUES (NEW.id, NULL, NEW.stage);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO leadflow_pipeline_historico (id_pipeline, stage_anterior, stage_novo)
    VALUES (NEW.id, OLD.stage, NEW.stage);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_registrar_movimentacao ON leadflow_pipeline;
CREATE TRIGGER trigger_registrar_movimentacao
  AFTER INSERT OR UPDATE ON leadflow_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION registrar_movimentacao_pipeline();


-- =====================================================
-- PARTE 5: Trigger para criar card quando lead.interacao = true
-- =====================================================

CREATE OR REPLACE FUNCTION criar_card_pipeline_from_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_disparo RECORD;
BEGIN
  IF NEW.interacao = true AND (OLD.interacao IS NULL OR OLD.interacao = false) THEN
    SELECT d.id, d.id_captador, d.nome, d.telefone, d.condominio
    INTO v_disparo
    FROM leadflow_disparos d
    WHERE d.id_lead = NEW.id
    ORDER BY d.created_at DESC
    LIMIT 1;

    IF v_disparo.id IS NOT NULL THEN
      INSERT INTO leadflow_pipeline (id_disparo, id_captador, nome, telefone, condominio)
      VALUES (v_disparo.id, v_disparo.id_captador, v_disparo.nome, v_disparo.telefone, v_disparo.condominio)
      ON CONFLICT (id_disparo) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_criar_card_pipeline_from_lead ON leadflow_leads;
CREATE TRIGGER trigger_criar_card_pipeline_from_lead
  AFTER UPDATE OF interacao ON leadflow_leads
  FOR EACH ROW
  WHEN (NEW.interacao = true)
  EXECUTE FUNCTION criar_card_pipeline_from_lead();


-- =====================================================
-- PARTE 6: Preencher cards para leads que já têm interacao = true
-- =====================================================

INSERT INTO leadflow_pipeline (id_disparo, id_captador, nome, telefone, condominio)
SELECT DISTINCT ON (l.id)
  d.id as id_disparo,
  d.id_captador,
  d.nome,
  d.telefone,
  d.condominio
FROM leadflow_leads l
INNER JOIN leadflow_disparos d ON d.id_lead = l.id
WHERE l.interacao = true
ORDER BY l.id, d.created_at DESC
ON CONFLICT (id_disparo) DO NOTHING;


-- Comentários
COMMENT ON TABLE leadflow_pipeline IS 'Pipeline/Kanban - um card por disparo que teve resposta do lead';
COMMENT ON COLUMN leadflow_pipeline.stage IS 'Estágio atual do lead no pipeline de captação';
COMMENT ON COLUMN leadflow_pipeline.observacoes IS 'Notas do captador sobre este lead';
