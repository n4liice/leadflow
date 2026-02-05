import { useState, useMemo } from "react";
import { useDisparosRealtime } from "@/hooks/useDisparos";
import { useCampanhas } from "@/hooks/useCampanhas";
import { useCaptadores } from "@/hooks/useCaptadores";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, AlertCircle, CheckCircle2, Clock, Send, Calendar, Building2, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type FilterMode = "campanha" | "condominio_data" | null;

export default function MonitorPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>(null);
  const [campanhaFilter, setCampanhaFilter] = useState<string>("");
  const [dataFilter, setDataFilter] = useState<string>("");
  const [condominioFilter, setCondominioFilter] = useState<string>("");

  // Busca todos os disparos (sem filtro de campanha na query)
  const { data: disparos, isLoading } = useDisparosRealtime(
    filterMode === "campanha" && campanhaFilter ? campanhaFilter : undefined
  );
  const { data: campanhas } = useCampanhas();
  const { data: captadores } = useCaptadores();

  // Quando muda o filtro de campanha
  const handleCampanhaChange = (value: string) => {
    if (value && value !== "all") {
      setCampanhaFilter(value);
      setFilterMode("campanha");
      // Limpa os outros filtros
      setDataFilter("");
      setCondominioFilter("");
    } else {
      setCampanhaFilter("");
      setFilterMode(null);
    }
  };

  // Quando muda o filtro de data ou condomínio
  const handleCondominioDataChange = (field: "data" | "condominio", value: string) => {
    if (field === "data") {
      setDataFilter(value);
    } else {
      setCondominioFilter(value === "all" ? "" : value);
    }

    // Se tem algum valor em data ou condomínio, muda o modo
    const newData = field === "data" ? value : dataFilter;
    const newCond = field === "condominio" ? (value === "all" ? "" : value) : condominioFilter;

    if (newData || newCond) {
      setFilterMode("condominio_data");
      setCampanhaFilter("");
    } else {
      setFilterMode(null);
    }
  };

  // Lista única de condomínios para o filtro
  const condominiosUnicos = useMemo(() => {
    if (!disparos) return [];
    const condominios = disparos
      .map(d => d.condominio)
      .filter((c): c is string => !!c && c.trim() !== "");
    return [...new Set(condominios)].sort();
  }, [disparos]);

  // Lista única de datas para o filtro (baseada no condomínio selecionado)
  const datasUnicas = useMemo(() => {
    if (!disparos) return [];

    // Filtra pelos disparos do condomínio selecionado (se houver)
    const disparosFiltrados = condominioFilter
      ? disparos.filter(d => d.condominio === condominioFilter)
      : disparos;

    const datas = disparosFiltrados.map(d => {
      const date = new Date(d.enviado_at || d.created_at);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    });
    return [...new Set(datas)].sort().reverse(); // Mais recentes primeiro
  }, [disparos, condominioFilter]);

  // Formata data para exibição
  const formatDateForDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filtra disparos
  const disparosFiltrados = useMemo(() => {
    if (!disparos) return [];

    // Se está filtrando por campanha, a query já filtra
    if (filterMode === "campanha") {
      return disparos;
    }

    // Filtro por condomínio + data
    if (filterMode === "condominio_data") {
      return disparos.filter(disparo => {
        // Filtro por data
        if (dataFilter) {
          const disparoDate = new Date(disparo.enviado_at || disparo.created_at);
          const filterDate = new Date(dataFilter + "T00:00:00");
          if (
            disparoDate.getFullYear() !== filterDate.getFullYear() ||
            disparoDate.getMonth() !== filterDate.getMonth() ||
            disparoDate.getDate() !== filterDate.getDate()
          ) {
            return false;
          }
        }

        // Filtro por condomínio
        if (condominioFilter) {
          if (disparo.condominio !== condominioFilter) {
            return false;
          }
        }

        return true;
      });
    }

    return disparos;
  }, [disparos, filterMode, dataFilter, condominioFilter]);

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const limparFiltros = () => {
    setCampanhaFilter("");
    setDataFilter("");
    setCondominioFilter("");
    setFilterMode(null);
  };

  const temFiltrosAtivos = filterMode !== null;

  const stats = {
    total: disparosFiltrados?.length || 0,
    enviando: disparosFiltrados?.filter(d => d.status_envio === 'enviando').length || 0,
    enviado: disparosFiltrados?.filter(d => d.status_envio === 'enviado').length || 0,
    erro: disparosFiltrados?.filter(d => d.status_envio === 'erro').length || 0,
    pendente: disparosFiltrados?.filter(d => d.status_envio === 'pendente').length || 0,
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

      {/* Filtros */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-6 items-end">
          {/* Filtro por Campanha */}
          <div className={`space-y-2 ${filterMode === "condominio_data" ? "opacity-50" : ""}`}>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Filtrar por Campanha
            </Label>
            <Select
              value={campanhaFilter}
              onValueChange={handleCampanhaChange}
              disabled={filterMode === "condominio_data"}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Campanhas</SelectItem>
                {campanhas?.map(camp => (
                  <SelectItem key={camp.id} value={camp.id}>{camp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground text-sm font-medium self-center">
            ou
          </div>

          {/* Filtro por Condomínio + Data */}
          <div className={`flex gap-4 ${filterMode === "campanha" ? "opacity-50" : ""}`}>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Condomínio
              </Label>
              <Select
                value={condominioFilter || "all"}
                onValueChange={(v) => handleCondominioDataChange("condominio", v)}
                disabled={filterMode === "campanha"}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {condominiosUnicos.map(cond => (
                    <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data
              </Label>
              <Select
                value={dataFilter || "all"}
                onValueChange={(v) => handleCondominioDataChange("data", v === "all" ? "" : v)}
                disabled={filterMode === "campanha"}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  {datasUnicas.map(data => (
                    <SelectItem key={data} value={data}>{formatDateForDisplay(data)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {temFiltrosAtivos && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        {filterMode && (
          <div className="mt-3 text-xs text-muted-foreground">
            Filtrando por: {filterMode === "campanha" ? (
              <span className="text-primary font-medium">
                Campanha "{campanhas?.find(c => c.id === campanhaFilter)?.nome}"
              </span>
            ) : (
              <span className="text-primary font-medium">
                {condominioFilter && `Condomínio "${condominioFilter}"`}
                {condominioFilter && dataFilter && " + "}
                {dataFilter && `Data ${new Date(dataFilter + "T00:00:00").toLocaleDateString('pt-BR')}`}
              </span>
            )}
          </div>
        )}
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
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando disparos...
                </TableCell>
              </TableRow>
            ) : disparosFiltrados?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Activity className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum disparo encontrado</p>
                    {temFiltrosAtivos && (
                      <Button variant="outline" size="sm" onClick={limparFiltros}>
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              disparosFiltrados?.map(disparo => (
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
                    {formatDateTime(disparo.enviado_at || disparo.created_at)}
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
