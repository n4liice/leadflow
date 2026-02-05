import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Disparo {
  id: string;
  id_campanha: string;
  id_lead: string | null;
  id_captador: string | null;
  id_template: string | null;
  nome: string;
  telefone: string;
  condominio: string | null;
  mensagem_enviada: string | null;
  status_envio: "pendente" | "enviando" | "enviado" | "erro";
  erro_log: string | null;
  enviado_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDisparos(campanhaId?: string, captadorId?: string) {
  return useQuery({
    queryKey: ["disparos", campanhaId, captadorId],
    queryFn: async () => {
      let query = supabase
        .from("leadflow_disparos")
        .select("*")
        .order("created_at", { ascending: false });

      if (campanhaId) {
        query = query.eq("id_campanha", campanhaId);
      }

      if (captadorId) {
        query = query.eq("id_captador", captadorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Disparo[];
    },
  });
}

export function useDisparosRealtime(campanhaId?: string) {
  const queryClient = useQueryClient();
  const query = useDisparos(campanhaId);

  useEffect(() => {
    const channel = supabase
      .channel("disparos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leadflow_disparos",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["disparos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateDisparos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (disparos: Omit<Disparo, "id" | "created_at" | "updated_at" | "enviado_at">[]) => {
      const { data, error } = await supabase
        .from("leadflow_disparos")
        .insert(disparos)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["disparos"] });
      toast.success(`${data.length} disparos criados!`);
    },
    onError: (error) => {
      toast.error("Erro ao criar disparos: " + error.message);
    },
  });
}

export function useDisparosStats(captadorId?: string) {
  return useQuery({
    queryKey: ["disparos", "stats", captadorId],
    queryFn: async () => {
      let query = supabase
        .from("leadflow_disparos")
        .select("status_envio");

      if (captadorId) {
        query = query.eq("id_captador", captadorId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data.length,
        pendente: data.filter(d => d.status_envio === "pendente").length,
        enviando: data.filter(d => d.status_envio === "enviando").length,
        enviado: data.filter(d => d.status_envio === "enviado").length,
        erro: data.filter(d => d.status_envio === "erro").length,
      };

      return stats;
    },
  });
}
