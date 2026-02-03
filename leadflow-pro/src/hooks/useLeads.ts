import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validatePhoneWebhook } from "@/lib/webhook";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  condominio: string | null;
  origem: string | null;
  status_telefone: string | null;
  created_at: string;
  updated_at: string;
  ultimo_disparo?: string | null;
}

export function useLeads(condominioFilter?: string) {
  return useQuery({
    queryKey: ["leads", condominioFilter],
    queryFn: async () => {
      // Busca leads
      let query = supabase
        .from("leadflow_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (condominioFilter) {
        query = query.eq("condominio", condominioFilter);
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      // Busca último disparo de cada lead
      const { data: disparos } = await supabase
        .from("leadflow_disparos")
        .select("id_lead, enviado_at, created_at")
        .in("id_lead", leads.map(l => l.id))
        .order("created_at", { ascending: false });

      // Mapeia o último disparo para cada lead
      const leadsComDisparo = leads.map(lead => {
        const disparo = disparos?.find(d => d.id_lead === lead.id);
        return {
          ...lead,
          ultimo_disparo: disparo?.enviado_at || disparo?.created_at || null,
        };
      });

      return leadsComDisparo as Lead[];
    },
    refetchInterval: 5000,
  });
}

export function useCondominios() {
  return useQuery({
    queryKey: ["condominios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadflow_leads")
        .select("condominio")
        .not("condominio", "is", null);
      
      if (error) throw error;
      
      const unique = [...new Set(data.map(d => d.condominio).filter(Boolean))];
      return unique as string[];
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lead: Omit<Lead, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("leadflow_leads")
        .insert(lead)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar lead: " + error.message);
    },
  });
}

export interface ImportResult {
  nome: string;
  telefone: string;
  condominio: string | null;
  origem: string;
  status: "importado" | "duplicado";
}

export interface ImportSummary {
  results: ImportResult[];
  totalImportados: number;
  totalDuplicados: number;
}

export function useImportLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leads: (Omit<Lead, "id" | "created_at" | "updated_at"> & { origem?: string })[]): Promise<ImportSummary> => {
      // Busca leads existentes para verificar duplicatas (telefone + condomínio)
      const { data: existingLeads } = await supabase
        .from("leadflow_leads")
        .select("telefone, condominio");

      // Cria um Set com chaves "telefone|condominio" dos leads existentes
      const existingKeys = new Set(
        existingLeads?.map(l => `${l.telefone}|${l.condominio || ''}`) || []
      );

      // Mapeia cada lead com seu status de importação
      const results: ImportResult[] = [];
      const leadsNovos: (Omit<Lead, "id" | "created_at" | "updated_at"> & { origem?: string })[] = [];

      leads.forEach(lead => {
        const key = `${lead.telefone}|${lead.condominio || ''}`;
        const isDuplicate = existingKeys.has(key);

        results.push({
          nome: lead.nome,
          telefone: lead.telefone,
          condominio: lead.condominio,
          origem: lead.origem || "CSV",
          status: isDuplicate ? "duplicado" : "importado",
        });

        if (!isDuplicate) {
          leadsNovos.push(lead);
        }
      });

      if (leadsNovos.length > 0) {
        // Insere os leads no banco
        const leadsParaInserir = leadsNovos.map(({ origem, ...leadData }) => leadData);
        const { data: insertedLeads, error } = await supabase
          .from("leadflow_leads")
          .insert(leadsParaInserir)
          .select();

        if (error) throw error;

        // Envia webhook individual para cada lead importado (para validação de telefone)
        if (insertedLeads && insertedLeads.length > 0) {
          // Dispara webhooks em paralelo (sem bloquear a UI)
          const webhookPromises = insertedLeads.map((lead, index) =>
            validatePhoneWebhook({
              id: lead.id,
              nome: lead.nome,
              telefone: lead.telefone,
              condominio: lead.condominio,
              origem: leadsNovos[index]?.origem || "CSV",
            })
          );

          // Executa em paralelo mas não espera (fire-and-forget para não travar a UI)
          Promise.all(webhookPromises).then(results => {
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;
            if (failCount > 0) {
              console.warn(`${failCount} webhooks de validação falharam`);
            }
            console.log(`${successCount} leads enviados para validação`);
          }).catch(err => {
            console.error("Erro ao enviar webhooks de validação:", err);
          });
        }
      }

      return {
        results,
        totalImportados: leadsNovos.length,
        totalDuplicados: leads.length - leadsNovos.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      if (result.totalImportados > 0) {
        toast.info(`${result.totalImportados} leads enviados para validação de telefone`);
      }
    },
    onError: (error) => {
      toast.error("Erro ao importar leads: " + error.message);
    },
  });
}

export function useUpdateLeadPhoneStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status_telefone }: { id: string; status_telefone: Lead["status_telefone"] }) => {
      const { data, error } = await supabase
        .from("leadflow_leads")
        .update({ status_telefone })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar status do telefone:", error.message);
    },
  });
}

export function useLeadsStats() {
  const { data: leads } = useLeads();

  const stats = {
    total: leads?.length || 0,
    verificado: leads?.filter(l => l.status_telefone?.toLowerCase() === "verificado").length || 0,
    semWhatsapp: leads?.filter(l => {
      const s = l.status_telefone?.toLowerCase();
      return s === "nao_existe" || s === "não existe whatsapp" || s === "sem whatsapp";
    }).length || 0,
    fixo: leads?.filter(l => {
      const s = l.status_telefone?.toLowerCase();
      return s === "fixo" || s === "telefone fixo";
    }).length || 0,
    invalido: leads?.filter(l => {
      const s = l.status_telefone?.toLowerCase();
      return s === "invalido" || s === "telefone inválido";
    }).length || 0,
    pendente: leads?.filter(l => !l.status_telefone || l.status_telefone.toLowerCase() === "pendente").length || 0,
  };

  return stats;
}

// Busca leads verificados que nunca receberam disparo
export function useLeadsSemDisparo(condominioFilter?: string) {
  return useQuery({
    queryKey: ["leads-sem-disparo", condominioFilter],
    queryFn: async () => {
      // Busca todos os leads verificados
      let query = supabase
        .from("leadflow_leads")
        .select("*")
        .ilike("status_telefone", "verificado")
        .order("created_at", { ascending: false });

      if (condominioFilter) {
        query = query.eq("condominio", condominioFilter);
      }

      const { data: leads, error } = await query;
      if (error) throw error;

      // Busca IDs de leads que já receberam disparo
      const { data: disparos } = await supabase
        .from("leadflow_disparos")
        .select("id_lead")
        .not("id_lead", "is", null);

      const leadsComDisparo = new Set(disparos?.map(d => d.id_lead) || []);

      // Filtra apenas leads que nunca receberam disparo
      const leadsSemDisparo = leads.filter(lead => !leadsComDisparo.has(lead.id));

      return leadsSemDisparo as Lead[];
    },
    refetchInterval: 5000,
  });
}
