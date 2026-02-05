import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Usuario {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  senha?: string;
  role: "admin" | "captador";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_usuarios")
        .select("id, user_id, nome, email, role, ativo, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Usuario[];
    },
  });
}

export function useUsuario(id: string) {
  return useQuery({
    queryKey: ["usuarios", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_usuarios")
        .select("id, user_id, nome, email, role, ativo, created_at, updated_at")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Usuario;
    },
    enabled: !!id,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (usuario: { nome: string; email: string; senha: string; role: "admin" | "captador" }) => {
      // Login simples - salva diretamente na tabela
      const { data, error } = await supabase
        .from("leadflow_usuarios")
        .insert({
          nome: usuario.nome,
          email: usuario.email.toLowerCase().trim(),
          senha: usuario.senha,
          role: usuario.role,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar usuário: " + error.message);
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Usuario> & { id: string }) => {
      const { data, error } = await supabase
        .from("leadflow_usuarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leadflow_usuarios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Usuário excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir usuário: " + error.message);
    },
  });
}

// Hook para buscar captadores de um usuário específico
export function useCaptadoresByUsuario(usuarioId: string | undefined) {
  return useQuery({
    queryKey: ["captadores", "usuario", usuarioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_captadores")
        .select("*")
        .eq("id_usuario", usuarioId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!usuarioId,
  });
}
