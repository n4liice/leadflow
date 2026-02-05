-- =====================================================
-- LIMPAR APENAS TRIGGERS DO PIPELINE
-- =====================================================

-- Triggers na tabela leadflow_pipeline
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao ON leadflow_pipeline;
DROP TRIGGER IF EXISTS trigger_pipeline_updated_at ON leadflow_pipeline;

-- Trigger de criação de card na tabela leadflow_leads
DROP TRIGGER IF EXISTS trigger_criar_card_pipeline ON leadflow_leads;
DROP TRIGGER IF EXISTS trigger_criar_card_pipeline_from_lead ON leadflow_leads;

-- Funções do pipeline
DROP FUNCTION IF EXISTS registrar_movimentacao_pipeline();
DROP FUNCTION IF EXISTS criar_card_pipeline_from_lead();
DROP FUNCTION IF EXISTS update_pipeline_updated_at();


-- =====================================================
-- GARANTIR COLUNAS NECESSÁRIAS
-- =====================================================

-- Coluna id_lead na tabela pipeline
ALTER TABLE leadflow_pipeline
ADD COLUMN IF NOT EXISTS id_lead UUID REFERENCES leadflow_leads(id) ON DELETE SET NULL;

-- Coluna id_lead no histórico
ALTER TABLE leadflow_pipeline_historico
ADD COLUMN IF NOT EXISTS id_lead UUID REFERENCES leadflow_leads(id) ON DELETE SET NULL;

-- Coluna id_usuario no histórico
ALTER TABLE leadflow_pipeline_historico
ADD COLUMN IF NOT EXISTS id_usuario UUID REFERENCES leadflow_usuarios(id) ON DELETE SET NULL;


-- =====================================================
-- TRIGGER 1: Criar card quando lead.interacao = true
-- =====================================================

CREATE OR REPLACE FUNCTION criar_card_pipeline_from_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_disparo RECORD;
BEGIN
  -- Só executa se interacao mudou para true
  IF NEW.interacao = true AND (OLD.interacao IS NULL OR OLD.interacao = false) THEN
    -- Busca o disparo mais recente deste lead
    SELECT d.id, d.id_captador, d.nome, d.telefone, d.condominio
    INTO v_disparo
    FROM leadflow_disparos d
    WHERE d.id_lead = NEW.id
    ORDER BY d.created_at DESC
    LIMIT 1;

    -- Se encontrou disparo, cria o card
    IF v_disparo.id IS NOT NULL THEN
      INSERT INTO leadflow_pipeline (id_disparo, id_captador, id_lead, nome, telefone, condominio, stage)
      VALUES (v_disparo.id, v_disparo.id_captador, NEW.id, v_disparo.nome, v_disparo.telefone, v_disparo.condominio, 'acompanhamento')
      ON CONFLICT (id_disparo) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_criar_card_pipeline
  AFTER UPDATE OF interacao ON leadflow_leads
  FOR EACH ROW
  WHEN (NEW.interacao = true)
  EXECUTE FUNCTION criar_card_pipeline_from_lead();


-- =====================================================
-- TRIGGER 2: Registrar histórico quando card é movido
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_movimentacao_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o stage mudou
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO leadflow_pipeline_historico (id_pipeline, stage_anterior, stage_novo, id_lead)
    VALUES (NEW.id, OLD.stage, NEW.stage, NEW.id_lead);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_registrar_movimentacao
  AFTER UPDATE ON leadflow_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION registrar_movimentacao_pipeline();


-- =====================================================
-- TRIGGER 3: Atualizar updated_at no pipeline
-- =====================================================

CREATE OR REPLACE FUNCTION update_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pipeline_updated_at
  BEFORE UPDATE ON leadflow_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_updated_at();


-- =====================================================
-- PREENCHER DADOS EXISTENTES
-- =====================================================

-- Preenche id_lead nos cards existentes
UPDATE leadflow_pipeline p
SET id_lead = d.id_lead
FROM leadflow_disparos d
WHERE p.id_disparo = d.id
AND p.id_lead IS NULL;

-- Preenche id_lead no histórico existente
UPDATE leadflow_pipeline_historico h
SET id_lead = p.id_lead
FROM leadflow_pipeline p
WHERE h.id_pipeline = p.id
AND h.id_lead IS NULL;
