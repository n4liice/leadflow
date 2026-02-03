import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Formato da mensagem no banco (JSON)
interface MensagemJSON {
  type: "human" | "system" | "ai";
  content: string;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
}

// Formato da mensagem no banco
interface MensagemRaw {
  id: string;
  session_id: string;
  message: string; // JSON string
  created_at: string;
}

// Formato da mensagem processada para exibição
export interface Mensagem {
  id: string;
  session_id: string;
  remetente: "lead" | "captador";
  mensagem: string;
  created_at: string;
}

// Busca histórico de mensagens por sessionId
// sessionId formato: lead_{telefone}_corretor_{instancia_captador}
export function useHistoricoMensagens(sessionId: string | null) {
  return useQuery({
    queryKey: ["historico-mensagens", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("leadflow_historico_mensagens")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Processa as mensagens do formato JSON para o formato de exibição
      const mensagensProcessadas: Mensagem[] = (data as unknown as MensagemRaw[]).map(msg => {
        let remetente: "lead" | "captador" = "lead";
        let conteudo = "";

        try {
          const parsed: MensagemJSON = JSON.parse(msg.message);
          // human = lead, system/ai = captador
          remetente = parsed.type === "human" ? "lead" : "captador";
          conteudo = parsed.content || "";
        } catch {
          // Se não conseguir parsear, usa a mensagem como string
          conteudo = msg.message;
        }

        return {
          id: msg.id,
          session_id: msg.session_id,
          remetente,
          mensagem: conteudo,
          created_at: msg.created_at,
        };
      });

      return mensagensProcessadas;
    },
    enabled: !!sessionId,
  });
}

// Busca todas as sessões de um lead pelo telefone
// Formato do session_id: lead_{telefone}_corretor_{instancia_captador}
export function useLeadSessions(telefone: string | null) {
  return useQuery({
    queryKey: ["lead-sessions", telefone],
    queryFn: async () => {
      if (!telefone) return [];

      // Remove caracteres não numéricos do telefone
      const telLimpo = telefone.replace(/\D/g, '');
      const patterns = [`lead_${telLimpo}_corretor_%`];
      if (!telLimpo.startsWith("55")) {
        patterns.push(`lead_55${telLimpo}_corretor_%`);
      } else if (telLimpo.length > 2) {
        patterns.push(`lead_${telLimpo.slice(2)}_corretor_%`);
      }

      let query = supabase
        .from("leadflow_historico_mensagens")
        .select("session_id");

      if (patterns.length === 1) {
        query = query.ilike("session_id", patterns[0]);
      } else {
        const orFilter = patterns.map(p => `session_id.ilike.${p}`).join(",");
        query = query.or(orFilter);
      }

      const { data: sessions, error: sessionsError } = await query;
      if (sessionsError) throw sessionsError;

      const uniqueSessions = [...new Set(sessions?.map(s => s.session_id) || [])];
      return uniqueSessions;
    },
    enabled: !!telefone,
  });
}

// Extrai a instância do captador do sessionId
// Formato: lead_{telefone}_corretor_{instancia}
export function extractCaptadorFromSession(sessionId: string): string {
  const match = sessionId.match(/corretor_(.+)$/);
  return match ? match[1] : sessionId;
}

// Hook para buscar nome/info do captador pela instância
export function useCaptadorByInstancia(instancia: string | null) {
  return useQuery({
    queryKey: ["captador-instancia", instancia],
    queryFn: async () => {
      if (!instancia) return null;

      const { data, error } = await supabase
        .from("leadflow_captadores")
        .select("*")
        .eq("instancia", instancia)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!instancia,
  });
}
