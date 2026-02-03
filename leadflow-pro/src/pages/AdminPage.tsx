import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Settings, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfigDisparo, useSaveConfigDisparo, ConfigDisparo } from "@/hooks/useConfig";

const ADMIN_PASSWORD = "leadflow2024"; // Senha de acesso à administração

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<ConfigDisparo>({
    horario_inicio: "08:00",
    horario_fim: "18:00",
    intervalo_minutos: 5,
    disparos_por_hora: 12,
  });

  const { data: configSalva, isLoading: isLoadingConfig } = useConfigDisparo();
  const saveConfig = useSaveConfigDisparo();

  // Carrega configuração do Supabase quando disponível
  useEffect(() => {
    if (configSalva) {
      setConfig(configSalva);
    }
  }, [configSalva]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword("");
      toast.success("Acesso autorizado!");
    } else {
      toast.error("Senha incorreta!");
    }
  };

  const handleSaveConfig = () => {
    saveConfig.mutate(config);
  };

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Área Restrita</CardTitle>
            <CardDescription>
              Digite a senha para acessar as configurações de administração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Senha de Administrador</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleLogin}>
              <Lock className="w-4 h-4 mr-2" />
              Acessar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de configurações
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground mt-1">
            Configure os parâmetros globais de disparo
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
          <Lock className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Disparo
          </CardTitle>
          <CardDescription>
            Defina os horários permitidos e os parâmetros de disparo para todas as campanhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={config.horario_inicio}
                    onChange={(e) => setConfig((prev: ConfigDisparo) => ({ ...prev, horario_inicio: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Horário em que os disparos começam
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Horário de Fim</Label>
                  <Input
                    type="time"
                    value={config.horario_fim}
                    onChange={(e) => setConfig((prev: ConfigDisparo) => ({ ...prev, horario_fim: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Horário em que os disparos param
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Intervalo entre Disparos (minutos)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={config.intervalo_minutos}
                    onChange={(e) => setConfig((prev: ConfigDisparo) => ({ ...prev, intervalo_minutos: parseInt(e.target.value) || 5 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de espera entre cada disparo (1-60 min)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Disparos por Hora</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={config.disparos_por_hora}
                    onChange={(e) => setConfig((prev: ConfigDisparo) => ({ ...prev, disparos_por_hora: parseInt(e.target.value) || 12 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantidade máxima de disparos por hora
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Resumo das Configurações</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Horário comercial: <span className="text-foreground font-medium">{config.horario_inicio} - {config.horario_fim}</span></li>
                    <li>Intervalo entre disparos: <span className="text-foreground font-medium">{config.intervalo_minutos} minutos</span></li>
                    <li>Disparos por hora: <span className="text-foreground font-medium">{config.disparos_por_hora}</span></li>
                  </ul>
                </div>

                <Button onClick={handleSaveConfig} disabled={saveConfig.isPending}>
                  {saveConfig.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
