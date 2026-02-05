import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Captador {
  id: string;
  nome_instancia: string;
  nome_captador: string;
  instancia: string;
  token: string | null;
  ativo: boolean;
  telefone_cadastrado: string | null;
  id_usuario: string | null;
  created_at: string;
  updated_at: string;
}

export function useCaptadores() {
  return useQuery({
    queryKey: ["captadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_captadores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Captador[];
    },
  });
}

export function useCaptadoresAtivos() {
  return useQuery({
    queryKey: ["captadores", "ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_captadores")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Captador[];
    },
  });
}

export function useCreateCaptador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (captador: Omit<Captador, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("leadflow_captadores")
        .insert(captador)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captadores"] });
      toast.success("Captador criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar captador: " + error.message);
    },
  });
}

export function useUpdateCaptador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Captador> & { id: string }) => {
      const { data, error } = await supabase
        .from("leadflow_captadores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captadores"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar captador: " + error.message);
    },
  });
}

export function useDeleteCaptador() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leadflow_captadores")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captadores"] });
      toast.success("Captador excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir captador: " + error.message);
    },
  });
}
