import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type StagePipeline =
  | "perdido"
  | "acompanhamento"
  | "indicacao"
  | "qualificado"
  | "coleta_dados"
  | "captacao_formalizada"
  | "agendamento"
  | "lead";

export interface PipelineCard {
  id: string;
  id_disparo: string;
  id_captador: string | null;
  id_lead: string | null;
  nome: string;
  telefone: string;
  condominio: string | null;
  stage: StagePipeline;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  captador?: {
    nome_captador: string | null;
    instancia: string;
  } | null;
}

export const STAGE_CONFIG: Record<StagePipeline, { label: string; color: string; description: string }> = {
  perdido: {
    label: "Perdido",
    color: "bg-gray-500",
    description: "Proprietários que não têm imóvel à venda"
  },
  acompanhamento: {
    label: "Acompanhamento",
    color: "bg-yellow-500",
    description: "Precisa entrar em contato posteriormente"
  },
  indicacao: {
    label: "Indicação",
    color: "bg-blue-500",
    description: "Não tem imóvel mas tem indicação"
  },
  qualificado: {
    label: "Qualificado",
    color: "bg-green-500",
    description: "Proprietário com imóvel à venda"
  },
  coleta_dados: {
    label: "Coleta de Dados",
    color: "bg-purple-500",
    description: "Retirando informações para cadastro"
  },
  captacao_formalizada: {
    label: "Captação Formalizada",
    color: "bg-emerald-500",
    description: "Já subiu as informações para cadastro"
  },
  agendamento: {
    label: "Agendamentos",
    color: "bg-orange-500",
    description: "Agendamentos de fotos/visitas"
  },
  lead: {
    label: "Lead",
    color: "bg-cyan-500",
    description: "Possíveis compradores interessados"
  },
};

export const STAGES_ORDER: StagePipeline[] = [
  "perdido",
  "acompanhamento",
  "indicacao",
  "qualificado",
  "coleta_dados",
  "captacao_formalizada",
  "agendamento",
  "lead",
];

// Hook para buscar cards do pipeline
export function usePipelineCards() {
  const { usuario, captadores, isAdmin } = useAuth();
  const captadorIdsKey = isAdmin ? "admin" : captadores.map(c => c.id).sort().join(",");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pipeline-cards", usuario?.id, isAdmin, captadorIdsKey],
    queryFn: async () => {
      let query = supabase
        .from("leadflow_pipeline")
        .select(`
          *,
          captador:leadflow_captadores(nome_captador, instancia)
        `)
        .order("updated_at", { ascending: false });

      // Se não for admin, filtra pelos captadores vinculados ao usuário
      if (!isAdmin && usuario) {
        if (captadores.length > 0) {
          // Filtra pelos IDs dos captadores do usuário
          const captadorIds = captadores.map(c => c.id);
          query = query.in("id_captador", captadorIds);
        } else {
          // Se não tem captador vinculado, retorna vazio
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PipelineCard[];
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  useEffect(() => {
    if (!usuario || isAdmin) return;

    const channel = supabase
      .channel(`leadflow_captadores_${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leadflow_captadores",
          filter: `id_usuario=eq.${usuario.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id, isAdmin, queryClient]);

  return query;
}

// Hook para buscar cards por stage
export function usePipelineByStage() {
  const { data: cards, isLoading } = usePipelineCards();

  const cardsByStage = STAGES_ORDER.reduce((acc, stage) => {
    acc[stage] = cards?.filter(card => card.stage === stage) || [];
    return acc;
  }, {} as Record<StagePipeline, PipelineCard[]>);

  return { cardsByStage, isLoading, totalCards: cards?.length || 0 };
}

// Hook para mover card entre stages
export function useMoveCard() {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  return useMutation({
    mutationFn: async ({ cardId, newStage }: { cardId: string; newStage: StagePipeline }) => {
      if (!usuario?.id) {
        throw new Error("Usu?rio n?o identificado para registrar a movimenta??o.");
      }

      // Usa RPC para atualizar o card e registrar hist?rico no banco
      const { error } = await supabase.rpc("move_pipeline_card", {
        p_card_id: cardId,
        p_stage: newStage,
        p_id_usuario: usuario.id,
      });

      if (error) throw error;

      return null;
    },

onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-historico"] });
    },
    onError: (error) => {
      toast.error("Erro ao mover card: " + error.message);
    },
  });
}

// Hook para atualizar observações do card
export function useUpdateCardNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, observacoes }: { cardId: string; observacoes: string }) => {
      const { data, error } = await supabase
        .from("leadflow_pipeline")
        .update({ observacoes })
        .eq("id", cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      toast.success("Observações salvas!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar observações: " + error.message);
    },
  });
}

// Hook para criar card (usado pelo n8n via API ou manualmente)
export function useCreatePipelineCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: {
      id_disparo: string;
      id_captador?: string | null;
      nome: string;
      telefone: string;
      condominio?: string | null;
      stage?: StagePipeline;
    }) => {
      const { data, error } = await supabase
        .from("leadflow_pipeline")
        .insert({
          ...card,
          stage: card.stage || "acompanhamento",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      toast.success("Card criado no pipeline!");
    },
    onError: (error) => {
      toast.error("Erro ao criar card: " + error.message);
    },
  });
}

// Hook para estatísticas do pipeline
export function usePipelineStats() {
  const { data: cards } = usePipelineCards();

  const stats = STAGES_ORDER.reduce((acc, stage) => {
    acc[stage] = cards?.filter(card => card.stage === stage).length || 0;
    return acc;
  }, {} as Record<StagePipeline, number>);

  return {
    ...stats,
    total: cards?.length || 0,
  };
}

// Interface para histórico
export interface PipelineHistorico {
  id: string;
  id_pipeline: string;
  stage_anterior: StagePipeline | null;
  stage_novo: StagePipeline;
  movido_em: string;
}

// Hook para buscar histórico de um card específico
export function usePipelineHistorico(cardId: string | null) {
  return useQuery({
    queryKey: ["pipeline-historico", cardId],
    queryFn: async () => {
      if (!cardId) return [];

      const { data, error } = await supabase
        .from("leadflow_pipeline_historico")
        .select("*")
        .eq("id_pipeline", cardId)
        .order("movido_em", { ascending: false });

      if (error) throw error;
      return data as PipelineHistorico[];
    },
    enabled: !!cardId,
  });
}
