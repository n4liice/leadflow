import { useState, useEffect } from "react";
import { useLeads, useCondominios, useImportLeads, useLeadsStats, ImportSummary, Lead } from "@/hooks/useLeads";
import { useLeadSessions, useHistoricoMensagens, extractCaptadorFromSession } from "@/hooks/useHistoricoMensagens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Search, UserPlus, Rocket, CheckCircle, XCircle, Loader2, FileCheck, FileX, MessageCircle, User, Phone, PhoneOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function LeadsPage() {
  const [condominioFilter, setCondominioFilter] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Busca sessões do lead selecionado
  const { data: leadSessions } = useLeadSessions(selectedLead?.telefone || null);
  const { data: mensagens, isLoading: isLoadingMensagens } = useHistoricoMensagens(selectedSession);

  // Seleciona automaticamente a primeira sessão quando carrega
  useEffect(() => {
    if (leadSessions && leadSessions.length > 0 && !selectedSession) {
      setSelectedSession(leadSessions[0]);
    }
  }, [leadSessions, selectedSession]);

  const { data: leads, isLoading } = useLeads(condominioFilter === "all" ? undefined : condominioFilter);
  const { data: condominios } = useCondominios();
  const importLeads = useImportLeads();
  const stats = useLeadsStats();

  const filteredLeads = leads?.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone.includes(searchTerm)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredLeads) {
      setSelectedLeads(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, id]);
    } else {
      setSelectedLeads(prev => prev.filter(i => i !== id));
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace('.csv', '');
    const text = await file.text();
    const lines = text.split('\n');

    // Detecta o separador (vírgula ou ponto e vírgula)
    const firstLine = lines[0] || '';
    const separator = firstLine.includes(';') ? ';' : ',';

    // Pega o header para identificar as colunas
    const header = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));

    // Encontra os índices das colunas
    const nomeIndex = header.findIndex(h => h === 'nome');
    const telefoneIndex = header.findIndex(h => h === 'telefone');
    const condominioIndex = header.findIndex(h => h === 'condominio' || h === 'condomínio');
    const origemIndex = header.findIndex(h => h === 'origem');

    console.log('Header detectado:', header);
    console.log('Índices:', { nomeIndex, telefoneIndex, condominioIndex, origemIndex });

    const leadsToImport = lines
      .slice(1) // Skip header
      .filter(line => line.trim())
      .map(line => {
        const cols = line.split(separator).map(s => s.trim().replace(/"/g, ''));

        const nome = nomeIndex >= 0 ? cols[nomeIndex] : cols[0];
        const telefone = telefoneIndex >= 0 ? cols[telefoneIndex] : cols[1];
        const condominio = condominioIndex >= 0 ? cols[condominioIndex] : cols[2];
        const origem = origemIndex >= 0 ? cols[origemIndex] : cols[3];

        return {
          nome: nome || '',
          telefone: telefone || '',
          condominio: condominio || null,
          status_telefone: 'pendente',
          origem: origem || fileName, // Usa a coluna origem do CSV, ou o nome do arquivo como fallback
        };
      })
      .filter(lead => lead.nome && lead.telefone); // Filtra linhas vazias

    if (leadsToImport.length > 0) {
      importLeads.mutate(leadsToImport, {
        onSuccess: (result) => {
          setImportResult(result);
          setIsImportDialogOpen(true);
        },
      });
    }
    e.target.value = '';
  };

  const handleSelectForCampaign = () => {
    if (selectedLeads.length === 0) {
      toast.error("Selecione pelo menos um lead");
      return;
    }
    sessionStorage.setItem('selectedLeadsForCampaign', JSON.stringify(selectedLeads));
    toast.success(`${selectedLeads.length} leads selecionados para campanha`);
  };

  const getStatusStyle = (status: string | null) => {
    const s = status?.toLowerCase();
    if (s === 'verificado') return 'bg-emerald-500/10 text-emerald-500'; // Verde
    if (s === 'nao_existe' || s === 'não existe whatsapp' || s === 'sem whatsapp') return 'bg-orange-500/10 text-orange-500'; // Laranja
    if (s === 'fixo' || s === 'telefone fixo') return 'bg-yellow-500/10 text-yellow-500'; // Amarelo
    if (s === 'invalido' || s === 'telefone inválido') return 'bg-red-500/10 text-red-500'; // Vermelho
    return 'bg-muted text-muted-foreground'; // Pendente
  };

  const getStatusLabel = (status: string | null) => {
    const s = status?.toLowerCase();
    if (s === 'verificado') return 'Verificado';
    if (s === 'nao_existe' || s === 'não existe whatsapp' || s === 'sem whatsapp') return 'Não existe WhatsApp';
    if (s === 'fixo' || s === 'telefone fixo') return 'Telefone Fixo';
    if (s === 'invalido' || s === 'telefone inválido') return 'Telefone Inválido';
    return 'Pendente';
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Leads</h1>
          <p className="text-muted-foreground mt-1">CRM para gerenciar seus leads de captação</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
            id="csv-import"
          />
          <Button variant="outline" asChild>
            <label htmlFor="csv-import" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </label>
          </Button>
          {selectedLeads.length > 0 && (
            <Button onClick={handleSelectForCampaign}>
              <Rocket className="w-4 h-4 mr-2" />
              Selecionar para Campanha ({selectedLeads.length})
            </Button>
          )}
        </div>
      </div>

      {/* Score de Validação */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Verificado - Verde */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{stats.verificado}</p>
                  <p className="text-xs text-muted-foreground">Validados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inválido - Vermelho */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.invalido}</p>
                  <p className="text-xs text-muted-foreground">Inválidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sem WhatsApp - Laranja */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <PhoneOff className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.semWhatsapp}</p>
                  <p className="text-xs text-muted-foreground">Sem WhatsApp</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telefone Fixo - Amarelo */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Phone className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{stats.fixo}</p>
                  <p className="text-xs text-muted-foreground">Telefone Fixo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendente */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Loader2 className={`w-5 h-5 text-muted-foreground ${stats.pendente > 0 ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendente}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Leads */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={condominioFilter} onValueChange={setCondominioFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por Condomínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Condomínios</SelectItem>
            {condominios?.map(cond => (
              <SelectItem key={cond} value={cond}>{cond}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredLeads?.length === selectedLeads.length && filteredLeads?.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Disparo</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Carregando leads...
                </TableCell>
              </TableRow>
            ) : filteredLeads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <UserPlus className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum lead encontrado</p>
                    <p className="text-xs text-muted-foreground">Importe um CSV para começar</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads?.map(lead => (
                <TableRow key={lead.id} className="border-border">
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                      <button
                        className="font-medium text-left hover:text-primary hover:underline transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedLead(lead);
                          // Limpa a sessão selecionada - será selecionada automaticamente quando carregar
                          setSelectedSession(null);
                        }}
                      >
                        {lead.nome}
                      </button>
                    </TableCell>
                  <TableCell className="font-mono text-sm">{lead.telefone}</TableCell>
                  <TableCell>{lead.condominio || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{lead.origem || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(lead.status_telefone)}`}>
                      {getStatusLabel(lead.status_telefone)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {lead.ultimo_disparo
                      ? new Date(lead.ultimo_disparo).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredLeads && filteredLeads.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredLeads.length} leads
        </p>
      )}

      {/* Modal de Resultados da Importação */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Resultado da Importação
            </DialogTitle>
          </DialogHeader>

          {importResult && (
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-lg font-bold text-emerald-500">{importResult.totalImportados}</p>
                    <p className="text-xs text-muted-foreground">Importados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                  <FileX className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-lg font-bold text-amber-500">{importResult.totalDuplicados}</p>
                    <p className="text-xs text-muted-foreground">Duplicados</p>
                  </div>
                </div>
              </div>

              {/* Lista de resultados */}
              <div className="flex-1 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Condomínio</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.results.map((result, index) => (
                      <TableRow key={index} className="border-border">
                        <TableCell className="font-medium">{result.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{result.telefone}</TableCell>
                        <TableCell>{result.condominio || "-"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{result.origem}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === "importado"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {result.status === "importado" ? "Importado" : "Duplicado"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={() => setIsImportDialogOpen(false)} className="w-full">
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico de Conversas */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Conversas de {selectedLead?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Seletor de sessões */}
            {leadSessions && leadSessions.length > 0 ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {leadSessions.length} conversa{leadSessions.length > 1 ? 's' : ''} encontrada{leadSessions.length > 1 ? 's' : ''}
                  </p>
                  <Select value={selectedSession || ""} onValueChange={setSelectedSession}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conversa" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSessions.map((session) => (
                        <SelectItem key={session} value={session}>
                          Captador: {extractCaptadorFromSession(session).substring(0, 8)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Área de mensagens */}
                <div className="flex-1 overflow-auto border rounded-lg p-4 bg-muted/20 space-y-3">
                  {isLoadingMensagens ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : mensagens && mensagens.length > 0 ? (
                    mensagens.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.remetente === 'lead' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            msg.remetente === 'lead'
                              ? 'bg-muted text-foreground'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {msg.remetente === 'lead' ? selectedLead?.nome : 'Captador'}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : selectedSession ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma mensagem encontrada</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Selecione uma conversa acima</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Nenhuma conversa encontrada para este lead</p>
                <p className="text-xs mt-1">As conversas aparecem após o envio de mensagens</p>
              </div>
            )}

            <Button onClick={() => setSelectedLead(null)} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
