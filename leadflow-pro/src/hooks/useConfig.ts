import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfigDisparo {
  horario_inicio: string;
  horario_fim: string;
  intervalo_minutos: number;
  disparos_por_hora: number;
}

const CONFIG_DEFAULTS: ConfigDisparo = {
  horario_inicio: "08:00",
  horario_fim: "18:00",
  intervalo_minutos: 5,
  disparos_por_hora: 12,
};

export function useConfigDisparo() {
  return useQuery({
    queryKey: ["config", "disparo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_config")
        .select("valor")
        .eq("chave", "disparo")
        .single();

      if (error) {
        // Se não existir, retorna os defaults
        if (error.code === "PGRST116") {
          return CONFIG_DEFAULTS;
        }
        throw error;
      }

      return (data.valor as ConfigDisparo) || CONFIG_DEFAULTS;
    },
  });
}

export function useSaveConfigDisparo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ConfigDisparo) => {
      // Tenta atualizar primeiro
      const { data: existing } = await supabase
        .from("leadflow_config")
        .select("id")
        .eq("chave", "disparo")
        .single();

      if (existing) {
        // Atualiza
        const { error } = await supabase
          .from("leadflow_config")
          .update({ valor: config as unknown as Record<string, unknown> })
          .eq("chave", "disparo");

        if (error) throw error;
      } else {
        // Insere
        const { error } = await supabase
          .from("leadflow_config")
          .insert({ chave: "disparo", valor: config as unknown as Record<string, unknown> });

        if (error) throw error;
      }

      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "disparo"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });
}
