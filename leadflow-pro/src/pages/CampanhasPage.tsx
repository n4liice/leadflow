import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCampanhas, useCreateCampanha, useUpdateCampanha } from "@/hooks/useCampanhas";
import { useLeadsSemDisparo, useCondominios } from "@/hooks/useLeads";
import { useConfigDisparo } from "@/hooks/useConfig";
import { useTemplates } from "@/hooks/useTemplates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Rocket, Play, Pause, CheckCircle, Loader2, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { sendWebhook } from "@/lib/webhook";

interface SelectedTemplate {
  id: string;
  nome: string;
  peso: number;
}

export default function CampanhasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCondominio, setSelectedCondominio] = useState<string>("");
  const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([]);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [newCampanha, setNewCampanha] = useState({
    nome: "",
    qtd_disparos: 0,
  });

  const queryClient = useQueryClient();
  const { data: campanhas, isLoading } = useCampanhas();
  const { data: allLeads } = useLeadsSemDisparo();
  const { data: condominios } = useCondominios();
  const { data: configGlobal } = useConfigDisparo();
  const { data: templates } = useTemplates();
  const createCampanha = useCreateCampanha();
  const updateCampanha = useUpdateCampanha();

  // Função para alternar seleção de template
  const toggleTemplate = (template: { id: string; nome: string }) => {
    setSelectedTemplates(prev => {
      const exists = prev.find(t => t.id === template.id);
      if (exists) {
        return prev.filter(t => t.id !== template.id);
      }
      return [...prev, { id: template.id, nome: template.nome, peso: 1 }];
    });
  };

  // Filtra leads pelo condomínio selecionado (já vem apenas validados e sem disparo do hook)
  const leadsDoCondominio = useMemo(() => {
    if (!allLeads) return [];
    if (!selectedCondominio || selectedCondominio === "todos") return allLeads;
    return allLeads.filter(lead => lead.condominio === selectedCondominio);
  }, [allLeads, selectedCondominio]);

  // Atualiza quantidade de disparos quando muda o condomínio
  useEffect(() => {
    if (selectedCondominio) {
      setNewCampanha(prev => ({ ...prev, qtd_disparos: leadsDoCondominio.length }));
    }
  }, [selectedCondominio, leadsDoCondominio]);

  const handleLaunchCampaign = async () => {
    if (!newCampanha.nome) {
      toast.error("Informe o nome da campanha");
      return;
    }

    if (newCampanha.qtd_disparos <= 0) {
      toast.error("Informe a quantidade de disparos");
      return;
    }

    if (selectedTemplates.length === 0) {
      toast.error("Selecione pelo menos um template");
      return;
    }

    try {
      // Pega os leads do condomínio selecionado
      const leadsParaDisparo = leadsDoCondominio.slice(0, newCampanha.qtd_disparos).map(lead => ({
        id_lead: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        condominio: lead.condominio,
      }));

      // Usa configurações do Supabase (ou defaults se não carregou ainda)
      const config = configGlobal || {
        horario_inicio: "08:00",
        horario_fim: "18:00",
        intervalo_minutos: 5,
        disparos_por_hora: 12,
      };

      // Prepara templates para enviar ao n8n (rodízio simples 1:1)
      const templatesParaEnvio = selectedTemplates.map(t => ({
        id_template: t.id,
        nome: t.nome,
      }));

      // Envia todos os dados para o n8n criar a campanha no Supabase
      const result = await sendWebhook('launch', {
        campanha: {
          nome: newCampanha.nome,
          qtd_disparos: newCampanha.qtd_disparos,
          status: "ativa",
          data_inicio: new Date().toISOString(),
          horario_inicio: config.horario_inicio,
          horario_fim: config.horario_fim,
          intervalo_minutos: config.intervalo_minutos,
          disparos_por_hora: config.disparos_por_hora,
        },
        leads: leadsParaDisparo,
        templates: templatesParaEnvio,
      });

      if (result.success) {
        toast.success("Campanha enviada para processamento!");
        // Aguarda um pouco para o n8n criar a campanha no Supabase e então atualiza a lista
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["campanhas"] });
        }, 2000);
      } else {
        toast.error(`Falha ao enviar campanha: ${result.error}`);
        return;
      }

      setIsDialogOpen(false);
      setNewCampanha({ nome: "", qtd_disparos: 0 });
      setSelectedCondominio("");
      setSelectedTemplates([]);
      setIsTemplatesOpen(false);
      sessionStorage.removeItem('selectedLeadsForCampaign');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao lançar campanha");
    }
  };

  const handleTogglePause = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativa" ? "pausada" : "ativa";

    // Atualiza status no banco
    updateCampanha.mutate({ id, status: newStatus as any });

    // Envia webhook correspondente para o n8n
    const action = currentStatus === "ativa" ? "pause" : "resume";
    const result = await sendWebhook(action, { campaign_id: id });

    if (result.success) {
      toast.success(currentStatus === "ativa" ? "Campanha pausada" : "Campanha retomada");
    } else {
      toast.warning(`Status atualizado, mas falha ao notificar n8n: ${result.error}`);
    }
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case 'ativa': return 'success';
      case 'pausada': return 'warning';
      case 'concluida': return 'pending';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa';
      case 'pausada': return 'Pausada';
      case 'concluida': return 'Concluída';
      default: return 'Rascunho';
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground mt-1">Configure e lance suas campanhas de disparo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Campanha</DialogTitle>
              <DialogDescription>
                Configure os parâmetros da sua campanha de disparos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input
                  placeholder="Ex: Black Friday 2024"
                  value={newCampanha.nome}
                  onChange={(e) => setNewCampanha(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Condomínio</Label>
                <Select value={selectedCondominio} onValueChange={setSelectedCondominio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um condomínio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os condomínios</SelectItem>
                    {condominios?.map((cond) => (
                      <SelectItem key={cond} value={cond}>
                        {cond}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCondominio && (
                  <p className="text-xs text-muted-foreground">
                    {leadsDoCondominio.length} leads verificados disponíveis
                    {selectedCondominio !== "todos" && " neste condomínio"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quantidade de Disparos</Label>
                <Input
                  type="number"
                  min={1}
                  max={leadsDoCondominio.length}
                  value={newCampanha.qtd_disparos}
                  onChange={(e) => setNewCampanha(prev => ({ ...prev, qtd_disparos: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-primary">
                  {leadsDoCondominio.length} leads verificados disponíveis
                </p>
              </div>

              {/* Seleção de Templates */}
              <Collapsible open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Templates de Mensagem</span>
                      {selectedTemplates.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedTemplates.length} selecionado{selectedTemplates.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  {templates?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum template criado. Crie templates na página de Templates.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {templates?.map(template => {
                          const isSelected = selectedTemplates.some(t => t.id === template.id);
                          return (
                            <div
                              key={template.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => toggleTemplate(template)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleTemplate(template)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{template.nome}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {template.conteudo.substring(0, 60)}...
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {selectedTemplates.length === 0 && (
                <p className="text-xs text-destructive">
                  * Selecione pelo menos um template para a campanha
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleLaunchCampaign}
                disabled={createCampanha.isPending || !newCampanha.nome || selectedTemplates.length === 0}
              >
                {createCampanha.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                Lançar Campanha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Disparos</TableHead>
              <TableHead>Intervalo</TableHead>
              <TableHead>Por Hora</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando campanhas...
                </TableCell>
              </TableRow>
            ) : campanhas?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Rocket className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhuma campanha criada</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campanhas?.map(campanha => (
                <TableRow key={campanha.id} className="border-border">
                  <TableCell className="font-medium">{campanha.nome}</TableCell>
                  <TableCell>{campanha.qtd_disparos.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campanha.intervalo_minutos ?? 5} min
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campanha.disparos_por_hora ?? 12}/h
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {campanha.horario_inicio && campanha.horario_fim
                      ? `${campanha.horario_inicio} - ${campanha.horario_fim}`
                      : "08:00 - 18:00"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={getStatusType(campanha.status) as any}
                      label={getStatusLabel(campanha.status)}
                      pulse={campanha.status === 'ativa'}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {campanha.status !== 'concluida' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePause(campanha.id, campanha.status)}
                        >
                          {campanha.status === 'ativa' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {campanha.status === 'ativa' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCampanha.mutate({ id: campanha.id, status: 'concluida' })}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
