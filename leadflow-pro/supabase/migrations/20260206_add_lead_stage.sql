-- Migração: Adicionar estágio 'lead' ao pipeline
-- Data: 2026-02-06
-- Descrição: Adiciona o estágio 'lead' para possíveis compradores

-- Adicionar novo valor ao enum stage_pipeline
ALTER TYPE stage_pipeline ADD VALUE IF NOT EXISTS 'lead';

-- Comentário para documentação
COMMENT ON TYPE stage_pipeline IS 'Estágios do pipeline: perdido, acompanhamento, indicacao, qualificado, coleta_dados, captacao_formalizada, agendamento, lead (possíveis compradores)';
