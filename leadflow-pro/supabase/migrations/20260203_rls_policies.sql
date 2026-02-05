-- =====================================================
-- ROW LEVEL SECURITY (RLS) - EXECUTAR DEPOIS
-- =====================================================
-- Execute este SQL quando quiser ativar a segurança
-- por linha no banco de dados

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

-- RLS para captadores
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

-- RLS para disparos
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
