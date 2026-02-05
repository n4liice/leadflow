-- =====================================================
-- SISTEMA DE LOGIN SIMPLES (SEM SUPABASE AUTH)
-- =====================================================
-- Execute este SQL para atualizar a tabela de usuários
-- com suporte a login simples por email/senha

-- Adiciona campo de senha à tabela de usuários
ALTER TABLE leadflow_usuarios
ADD COLUMN IF NOT EXISTS senha TEXT;

-- IMPORTANTE: Remove a foreign key constraint que liga ao auth.users
ALTER TABLE leadflow_usuarios
DROP CONSTRAINT IF EXISTS leadflow_usuarios_user_id_fkey;

-- Atualiza a constraint para não exigir user_id
ALTER TABLE leadflow_usuarios
ALTER COLUMN user_id DROP NOT NULL;

-- Cria um usuário admin padrão (senha: admin123)
-- IMPORTANTE: Troque a senha depois do primeiro login!
INSERT INTO leadflow_usuarios (nome, email, senha, role, ativo)
VALUES ('Administrador', 'admin@leadflow.com', 'admin123', 'admin', true)
ON CONFLICT (email) DO UPDATE SET senha = 'admin123';

-- Função para verificar login
CREATE OR REPLACE FUNCTION verificar_login(p_email TEXT, p_senha TEXT)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  email TEXT,
  role TEXT,
  ativo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.nome,
    u.email,
    u.role,
    u.ativo
  FROM leadflow_usuarios u
  WHERE u.email = p_email
    AND u.senha = p_senha
    AND u.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
