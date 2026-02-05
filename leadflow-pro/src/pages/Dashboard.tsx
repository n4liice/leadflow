import { Users, Rocket, CheckCircle2, XCircle, Radio, Activity, Smartphone, Phone, PhoneOff } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { useLeads, useLeadsStats } from "@/hooks/useLeads";
import { useCampanhasAtivas } from "@/hooks/useCampanhas";
import { useDisparosStats } from "@/hooks/useDisparos";
import { useCaptadores } from "@/hooks/useCaptadores";
import { STAGES_ORDER, STAGE_CONFIG, usePipelineStats } from "@/hooks/usePipeline";

export default function Dashboard() {
  const { data: leads } = useLeads();
  const leadsStats = useLeadsStats();
  const { data: campanhasAtivas } = useCampanhasAtivas();
  const { data: disparosStats } = useDisparosStats();
  const { data: captadores } = useCaptadores();
  const pipelineStats = usePipelineStats();

  const totalLeads = leads?.length || 0;
  const campanhasAtivasCount = campanhasAtivas?.length || 0;
  const sucessos = disparosStats?.enviado || 0;
  const erros = disparosStats?.erro || 0;
  const captadoresOnline = captadores?.filter(c => c.ativo).length || 0;
  const disparosEmAndamento = disparosStats?.enviando || 0;
  const totalPipeline = pipelineStats.total || 0;

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de captação de leads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total de Leads"
          value={totalLeads.toLocaleString('pt-BR')}
          subtitle="Leads cadastrados no sistema"
          icon={Users}
          variant="default"
        />
        
        <MetricCard
          title="Campanhas Ativas"
          value={campanhasAtivasCount}
          subtitle="Em execução agora"
          icon={Rocket}
          variant="warning"
        />
        
        <MetricCard
          title="Captadores Online"
          value={`${captadoresOnline}/${captadores?.length || 0}`}
          subtitle="Instâncias WhatsApp conectadas"
          icon={Radio}
          variant="success"
        />
        
        <MetricCard
          title="Disparos com Sucesso"
          value={sucessos.toLocaleString('pt-BR')}
          subtitle="Mensagens enviadas"
          icon={CheckCircle2}
          variant="success"
        />
        
        <MetricCard
          title="Disparos com Erro"
          value={erros.toLocaleString('pt-BR')}
          subtitle="Falhas de envio"
          icon={XCircle}
          variant="danger"
        />
        
        <MetricCard
          title="Em Andamento"
          value={disparosEmAndamento}
          subtitle="Enviando agora"
          icon={Activity}
          variant="default"
        />
      </div>

      {/* Métricas de Validação de Leads */}
      {totalLeads > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Validação de Telefones</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Smartphone className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-500">{leadsStats.verificado}</p>
                <p className="text-xs text-muted-foreground">Verificados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Phone className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{leadsStats.fixo}</p>
                <p className="text-xs text-muted-foreground">Telefone Fixo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <PhoneOff className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-500">{leadsStats.nao_existe}</p>
                <p className="text-xs text-muted-foreground">Não existe WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Phone className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-orange-500">{leadsStats.invalido}</p>
                <p className="text-xs text-muted-foreground">Telefone Inválido</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{leadsStats.pendente}</p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </div>
          {leadsStats.verificado > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Verificação</span>
                <span className="font-medium text-emerald-500">
                  {((leadsStats.verificado / totalLeads) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(leadsStats.verificado / totalLeads) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {disparosStats && (disparosStats.enviado + disparosStats.erro) > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Taxa de Sucesso</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sucesso vs Total</span>
              <span className="font-medium">
                {((sucessos / (sucessos + erros)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-success to-success/70 transition-all duration-500"
                style={{ width: `${(sucessos / (sucessos + erros)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{sucessos.toLocaleString('pt-BR')} enviados</span>
              <span>{erros.toLocaleString('pt-BR')} erros</span>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pipeline por EstÃ¡gio</h3>
          <span className="text-sm text-muted-foreground">
            Total: {totalPipeline.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {STAGES_ORDER.map(stage => (
            <div key={stage} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
              <div className={`w-3 h-3 rounded-full ${STAGE_CONFIG[stage].color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{STAGE_CONFIG[stage].label}</p>
                <p className="text-xl font-semibold">
                  {pipelineStats[stage].toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
        {totalPipeline === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum card no pipeline ainda.
          </p>
        )}
      </div>
    </div>
  );
}
