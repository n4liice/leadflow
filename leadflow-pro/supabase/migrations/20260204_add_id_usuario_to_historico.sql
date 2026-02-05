-- =====================================================
-- PARTE 1: Adicionar id_lead na tabela leadflow_pipeline
-- =====================================================

ALTER TABLE leadflow_pipeline
ADD COLUMN IF NOT EXISTS id_lead UUID REFERENCES leadflow_leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_lead
ON leadflow_pipeline(id_lead);

-- Preenche id_lead nos cards existentes (baseado no disparo)
UPDATE leadflow_pipeline p
SET id_lead = d.id_lead
FROM leadflow_disparos d
WHERE p.id_disparo = d.id
AND p.id_lead IS NULL;


-- =====================================================
-- PARTE 2: Adicionar colunas na tabela de histórico
-- =====================================================

-- id_usuario: quem moveu o card
ALTER TABLE leadflow_pipeline_historico
ADD COLUMN IF NOT EXISTS id_usuario UUID REFERENCES leadflow_usuarios(id) ON DELETE SET NULL;

-- id_lead: qual lead foi movido
ALTER TABLE leadflow_pipeline_historico
ADD COLUMN IF NOT EXISTS id_lead UUID REFERENCES leadflow_leads(id) ON DELETE SET NULL;

-- Cria índices para consultas
CREATE INDEX IF NOT EXISTS idx_pipeline_historico_usuario
ON leadflow_pipeline_historico(id_usuario);

CREATE INDEX IF NOT EXISTS idx_pipeline_historico_lead
ON leadflow_pipeline_historico(id_lead);

-- Preenche id_lead nos registros de histórico existentes
UPDATE leadflow_pipeline_historico h
SET id_lead = p.id_lead
FROM leadflow_pipeline p
WHERE h.id_pipeline = p.id
AND h.id_lead IS NULL;


-- =====================================================
-- PARTE 3: Atualizar trigger para preencher id_lead automaticamente
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
      INSERT INTO leadflow_pipeline (id_disparo, id_captador, id_lead, nome, telefone, condominio)
      VALUES (v_disparo.id, v_disparo.id_captador, NEW.id, v_disparo.nome, v_disparo.telefone, v_disparo.condominio)
      ON CONFLICT (id_disparo) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- PARTE 4: Atualizar trigger de histórico para incluir id_lead e id_usuario
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_movimentacao_pipeline()
RETURNS TRIGGER AS $$
DECLARE
  v_id_usuario UUID;
BEGIN
  -- Só registra se for UPDATE e o stage mudou
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Busca o id_usuario baseado no auth.uid() do Supabase
    SELECT id INTO v_id_usuario
    FROM leadflow_usuarios
    WHERE user_id = CAST(auth.uid() AS TEXT);

    INSERT INTO leadflow_pipeline_historico (id_pipeline, stage_anterior, stage_novo, id_lead, id_usuario)
    VALUES (NEW.id, OLD.stage, NEW.stage, NEW.id_lead, v_id_usuario);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_registrar_movimentacao ON leadflow_pipeline;
CREATE TRIGGER trigger_registrar_movimentacao
  AFTER UPDATE ON leadflow_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION registrar_movimentacao_pipeline();
