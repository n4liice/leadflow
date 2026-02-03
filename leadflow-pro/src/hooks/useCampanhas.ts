import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Campanha {
  id: string;
  nome: string;
  qtd_disparos: number;
  status: "rascunho" | "ativa" | "pausada" | "concluida";
  data_inicio: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  intervalo_minutos: number | null;
  disparos_por_hora: number | null;
  created_at: string;
  updated_at: string;
}

export function useCampanhas() {
  return useQuery({
    queryKey: ["campanhas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_campanhas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campanha[];
    },
  });
}

export function useCampanhasAtivas() {
  return useQuery({
    queryKey: ["campanhas", "ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_campanhas")
        .select("*")
        .eq("status", "ativa")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campanha[];
    },
  });
}

export function useCreateCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanha: Omit<Campanha, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("leadflow_campanhas")
        .insert(campanha)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
      toast.success("Campanha criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar campanha: " + error.message);
    },
  });
}

export function useUpdateCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campanha> & { id: string }) => {
      const { data, error } = await supabase
        .from("leadflow_campanhas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campanhas"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar campanha: " + error.message);
    },
  });
}
