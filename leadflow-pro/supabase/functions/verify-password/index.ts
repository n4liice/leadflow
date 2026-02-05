/**
 * LeadFlow Pro - Edge Function: Verificar Senha
 * ============================================
 *
 * Esta função verifica credenciais de login.
 * Usa comparação direta (as senhas no banco ainda estão em texto plano).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginRequest {
  email: string;
  senha: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { email, senha }: LoginRequest = await req.json();

    if (!email || !senha) {
      return new Response(
        JSON.stringify({ success: false, error: "Email e senha são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente Supabase com service role key (para bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar usuário pelo email
    const { data: usuario, error: fetchError } = await supabase
      .from("leadflow_usuarios")
      .select("id, nome, email, senha, role, ativo")
      .eq("email", email.toLowerCase().trim())
      .eq("ativo", true)
      .maybeSingle();

    if (fetchError) {
      console.error("Erro ao buscar usuário:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno do servidor" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!usuario) {
      return new Response(
        JSON.stringify({ success: false, error: "Email ou senha incorretos" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar senha (comparação direta)
    const senhaValida = usuario.senha === senha;

    if (!senhaValida) {
      return new Response(
        JSON.stringify({ success: false, error: "Email ou senha incorretos" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retornar dados do usuário (sem a senha)
    const usuarioResponse = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      ativo: usuario.ativo,
    };

    return new Response(
      JSON.stringify({ success: true, usuario: usuarioResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função verify-password:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
