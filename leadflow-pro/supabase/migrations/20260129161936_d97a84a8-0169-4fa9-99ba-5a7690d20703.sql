-- Create enum for validation status
CREATE TYPE public.status_validacao AS ENUM ('pendente', 'validado', 'invalido');

-- Create enum for campaign status
CREATE TYPE public.status_campanha AS ENUM ('rascunho', 'ativa', 'pausada', 'concluida');

-- Create enum for send status
CREATE TYPE public.status_envio AS ENUM ('pendente', 'enviando', 'enviado', 'erro');

-- Create leads table
CREATE TABLE public.leadflow_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  condominio TEXT,
  status_validacao status_validacao NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create captadores table (WhatsApp instances)
CREATE TABLE public.leadflow_captadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instancia TEXT NOT NULL,
  token TEXT,
  ultimos_4_digitos TEXT NOT NULL,
  status_ativo BOOLEAN NOT NULL DEFAULT true,
  em_uso BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table for spintext
CREATE TABLE public.leadflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campanhas table
CREATE TABLE public.leadflow_campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  qtd_disparos INTEGER NOT NULL DEFAULT 0,
  horario_inicio TIME,
  horario_fim TIME,
  intervalo_minutos INTEGER DEFAULT 5,
  disparos_por_hora INTEGER DEFAULT 20,
  leads JSONB, -- Array de leads selecionados para a campanha
  status status_campanha NOT NULL DEFAULT 'rascunho',
  data_inicio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for campaign-template relationship (many-to-many for A/B testing)
CREATE TABLE public.leadflow_campanha_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_campanha UUID REFERENCES public.leadflow_campanhas(id) ON DELETE CASCADE NOT NULL,
  id_template UUID REFERENCES public.leadflow_templates(id) ON DELETE CASCADE NOT NULL,
  peso INTEGER NOT NULL DEFAULT 1, -- Weight for A/B distribution (higher = more frequent)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(id_campanha, id_template)
);

-- Create disparos table
CREATE TABLE public.leadflow_disparos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_campanha UUID REFERENCES public.leadflow_campanhas(id) ON DELETE CASCADE NOT NULL,
  id_lead UUID REFERENCES public.leadflow_leads(id) ON DELETE SET NULL,
  id_captador UUID REFERENCES public.leadflow_captadores(id) ON DELETE SET NULL,
  id_template UUID REFERENCES public.leadflow_templates(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  condominio TEXT,
  mensagem_enviada TEXT, -- Mensagem final processada (após spintext)
  status_envio status_envio NOT NULL DEFAULT 'pendente',
  erro_log TEXT,
  enviado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now - no auth required)
ALTER TABLE public.leadflow_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadflow_captadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadflow_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadflow_campanha_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadflow_disparos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is required for this system)
CREATE POLICY "Allow all operations on leads" ON public.leadflow_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on captadores" ON public.leadflow_captadores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on templates" ON public.leadflow_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campanhas" ON public.leadflow_campanhas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campanha_templates" ON public.leadflow_campanha_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on disparos" ON public.leadflow_disparos FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for disparos table (for live monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.leadflow_disparos;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_leadflow_leads_updated_at BEFORE UPDATE ON public.leadflow_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leadflow_captadores_updated_at BEFORE UPDATE ON public.leadflow_captadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leadflow_templates_updated_at BEFORE UPDATE ON public.leadflow_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leadflow_campanhas_updated_at BEFORE UPDATE ON public.leadflow_campanhas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leadflow_disparos_updated_at BEFORE UPDATE ON public.leadflow_disparos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
