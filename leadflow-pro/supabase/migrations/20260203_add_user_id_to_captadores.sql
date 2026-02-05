-- =====================================================
-- TABELA DE USUÁRIOS DO SISTEMA
-- =====================================================
-- Cada usuário pode ter múltiplos captadores (números)
-- Admin vê tudo, Captador vê apenas seus números

CREATE TABLE IF NOT EXISTS leadflow_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'captador' CHECK (role IN ('admin', 'captador')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por user_id (auth)
CREATE INDEX IF NOT EXISTS idx_usuarios_user_id ON leadflow_usuarios(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON leadflow_usuarios(email);

-- =====================================================
-- VINCULAR CAPTADORES A USUÁRIOS
-- =====================================================
-- Um usuário pode ter vários captadores (números/instâncias)

ALTER TABLE leadflow_captadores
ADD COLUMN IF NOT EXISTS id_usuario UUID REFERENCES leadflow_usuarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_captadores_id_usuario ON leadflow_captadores(id_usuario);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- RLS para usuários
ALTER TABLE leadflow_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seu proprio registro" ON leadflow_usuarios
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins gerenciam usuarios" ON leadflow_usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS para captadores - usuários veem apenas seus captadores
ALTER TABLE leadflow_captadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seus captadores" ON leadflow_captadores
  FOR SELECT USING (
    id_usuario IN (
      SELECT id FROM leadflow_usuarios WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins gerenciam captadores" ON leadflow_captadores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS para disparos - usuários veem disparos dos seus captadores
ALTER TABLE leadflow_disparos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem disparos dos seus captadores" ON leadflow_disparos
  FOR SELECT USING (
    id_captador IN (
      SELECT c.id FROM leadflow_captadores c
      JOIN leadflow_usuarios u ON c.id_usuario = u.id
      WHERE u.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins gerenciam disparos" ON leadflow_disparos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS para campanhas
ALTER TABLE leadflow_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem campanhas dos seus captadores" ON leadflow_campanhas
  FOR SELECT USING (
    id_captador IN (
      SELECT c.id FROM leadflow_captadores c
      JOIN leadflow_usuarios u ON c.id_usuario = u.id
      WHERE u.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins gerenciam campanhas" ON leadflow_campanhas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leadflow_usuarios WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
