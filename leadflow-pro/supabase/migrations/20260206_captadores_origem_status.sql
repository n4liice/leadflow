-- Migração: Adicionar campos origem e status_instancia aos captadores
-- Data: 2026-02-06

-- 1. Adicionar coluna origem (texto livre para definir a origem da instância)
ALTER TABLE leadflow_captadores
ADD COLUMN IF NOT EXISTS origem text;

-- 2. Criar enum para status da instância (Normal, Banimento, Restrição)
DO $$ BEGIN
  CREATE TYPE status_instancia AS ENUM ('normal', 'banimento', 'restricao');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Adicionar coluna status_instancia com default 'normal'
ALTER TABLE leadflow_captadores
ADD COLUMN IF NOT EXISTS status_instancia status_instancia DEFAULT 'normal';

-- 4. Comentários para documentação
COMMENT ON COLUMN leadflow_captadores.origem IS 'Origem/fonte da instância WhatsApp (texto livre)';
COMMENT ON COLUMN leadflow_captadores.status_instancia IS 'Status atual da instância: normal, banimento ou restricao';
