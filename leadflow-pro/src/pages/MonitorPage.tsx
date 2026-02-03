import { useState } from "react";
import { useDisparosRealtime } from "@/hooks/useDisparos";
import { useCampanhas } from "@/hooks/useCampanhas";
import { useCaptadores } from "@/hooks/useCaptadores";
import { StatusBadge } from "@/components/StatusBadge";
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
import { Activity, AlertCircle, CheckCircle2, Clock, Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MonitorPage() {
  const [campanhaFilter, setCampanhaFilter] = useState<string>();
  
  const { data: disparos, isLoading } = useDisparosRealtime(
    campanhaFilter === "all" ? undefined : campanhaFilter
  );
  const { data: campanhas } = useCampanhas();
  const { data: captadores } = useCaptadores();

  const getCaptadorInfo = (id: string | null) => {
    if (!id) return null;
    const captador = captadores?.find(c => c.id === id);
    return captador || null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'enviando':
        return <Send className="w-4 h-4 text-primary animate-pulse" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case 'enviado': return 'success';
      case 'enviando': return 'active';
      case 'erro': return 'error';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enviado': return 'Enviado';
      case 'enviando': return 'Enviando';
      case 'erro': return 'Erro';
      default: return 'Pendente';
    }
  };

  const stats = {
    total: disparos?.length || 0,
    enviando: disparos?.filter(d => d.status_envio === 'enviando').length || 0,
    enviado: disparos?.filter(d => d.status_envio === 'enviado').length || 0,
    erro: disparos?.filter(d => d.status_envio === 'erro').length || 0,
    pendente: disparos?.filter(d => d.status_envio === 'pendente').length || 0,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitor de Envio</h1>
          <p className="text-muted-foreground mt-1">Acompanhe os disparos em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-success animate-pulse" />
          <span className="text-sm text-muted-foreground">Atualização em tempo real</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card p-4 text-center border-primary/30">
          <p className="text-3xl font-bold text-primary">{stats.enviando}</p>
          <p className="text-xs text-muted-foreground">Enviando</p>
        </div>
        <div className="glass-card p-4 text-center border-success/30">
          <p className="text-3xl font-bold text-success">{stats.enviado}</p>
          <p className="text-xs text-muted-foreground">Enviados</p>
        </div>
        <div className="glass-card p-4 text-center border-destructive/30">
          <p className="text-3xl font-bold text-destructive">{stats.erro}</p>
          <p className="text-xs text-muted-foreground">Erros</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-muted-foreground">{stats.pendente}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={campanhaFilter} onValueChange={setCampanhaFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por Campanha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Campanhas</SelectItem>
            {campanhas?.map(camp => (
              <SelectItem key={camp.id} value={camp.id}>{camp.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Captador</TableHead>
              <TableHead>Erro</TableHead>
              <TableHead>Horário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando disparos...
                </TableCell>
              </TableRow>
            ) : disparos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Activity className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum disparo encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              disparos?.map(disparo => (
                <TableRow 
                  key={disparo.id} 
                  className={`border-border ${disparo.status_envio === 'enviando' ? 'bg-primary/5' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(disparo.status_envio)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{disparo.nome}</TableCell>
                  <TableCell className="font-mono text-sm">{disparo.telefone}</TableCell>
                  <TableCell>{disparo.condominio || "-"}</TableCell>
                  <TableCell className="text-sm">
                    {(() => {
                      const captador = getCaptadorInfo(disparo.id_captador);
                      if (!captador) return "-";
                      const ultimos4 = captador.telefone_cadastrado?.slice(-4) || "----";
                      return (
                        <div className="flex flex-col">
                          <span className="font-medium">{captador.nome_captador || "Sem nome"}</span>
                          <span className="text-xs text-muted-foreground">****{ultimos4}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">{captador.instancia}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {disparo.erro_log ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-destructive text-sm truncate max-w-[200px] block">
                            {disparo.erro_log}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>{disparo.erro_log}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {disparo.enviado_at 
                      ? new Date(disparo.enviado_at).toLocaleTimeString('pt-BR')
                      : new Date(disparo.created_at).toLocaleTimeString('pt-BR')}
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
