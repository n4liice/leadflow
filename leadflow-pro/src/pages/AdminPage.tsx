import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Settings, Save, Eye, EyeOff, Loader2, Users, Plus, Trash2, Link2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useConfigDisparo, useSaveConfigDisparo, ConfigDisparo } from "@/hooks/useConfig";
import { useUsuarios, useUpdateUsuario, useDeleteUsuario } from "@/hooks/useUsuarios";
import { useCaptadores, useUpdateCaptador } from "@/hooks/useCaptadores";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ADMIN_PASSWORD = "leadflow2024";

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

  // Estados para gerenciamento de usuários
  const [showNovoUsuario, setShowNovoUsuario] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ nome: "", email: "", senha: "", role: "captador" as "admin" | "captador" });
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [showVincularCaptador, setShowVincularCaptador] = useState(false);
  const [showNovoUsuarioSenha, setShowNovoUsuarioSenha] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string | null>(null);
  const [captadorParaVincular, setCaptadorParaVincular] = useState<string>("");

  const { data: configSalva, isLoading: isLoadingConfig } = useConfigDisparo();
  const saveConfig = useSaveConfigDisparo();
  const { data: usuarios, isLoading: isLoadingUsuarios } = useUsuarios();
  const { data: captadores, isLoading: isLoadingCaptadores } = useCaptadores();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();
  const updateCaptador = useUpdateCaptador();

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

  const handleCriarUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCriandoUsuario(true);
    try {
      // Login simples - salva diretamente na tabela com a senha
      const { error: dbError } = await supabase
        .from("leadflow_usuarios")
        .insert({
          nome: novoUsuario.nome,
          email: novoUsuario.email.toLowerCase().trim(),
          senha: novoUsuario.senha,
          role: novoUsuario.role,
          ativo: true,
        });

      if (dbError) throw dbError;

      toast.success("Usuário criado com sucesso!");
      setShowNovoUsuario(false);
      setNovoUsuario({ nome: "", email: "", senha: "", role: "captador" });

      // Recarrega a lista
      window.location.reload();
    } catch (error: any) {
      toast.error("Erro ao criar usuário: " + error.message);
    } finally {
      setCriandoUsuario(false);
    }
  };

  const handleVincularCaptador = async () => {
    if (!usuarioSelecionado || !captadorParaVincular) {
      toast.error("Selecione um captador");
      return;
    }

    updateCaptador.mutate(
      { id: captadorParaVincular, id_usuario: usuarioSelecionado },
      {
        onSuccess: () => {
          toast.success("Captador vinculado com sucesso!");
          setShowVincularCaptador(false);
          setCaptadorParaVincular("");
          setUsuarioSelecionado(null);
        },
      }
    );
  };

  const handleDesvincularCaptador = async (captadorId: string) => {
    updateCaptador.mutate(
      { id: captadorId, id_usuario: null },
      {
        onSuccess: () => {
          toast.success("Captador desvinculado!");
        },
      }
    );
  };

  const handleExcluirUsuario = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    deleteUsuario.mutate(id);
  };

  const getCaptadoresDoUsuario = (usuarioId: string) => {
    return captadores?.filter((c: any) => c.id_usuario === usuarioId) || [];
  };

  const getCaptadoresSemUsuario = () => {
    return captadores?.filter((c: any) => !c.id_usuario) || [];
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
            Gerencie usuários, captadores e configurações do sistema
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
          <Lock className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription>
                    Cadastre usuários e vincule captadores (números) a cada um
                  </CardDescription>
                </div>
                <Button onClick={() => setShowNovoUsuario(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsuarios || isLoadingCaptadores ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : usuarios && usuarios.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Captadores Vinculados</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => {
                      const captadoresUsuario = getCaptadoresDoUsuario(usuario.id);
                      return (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">{usuario.nome}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <Badge variant={usuario.role === "admin" ? "default" : "secondary"}>
                              {usuario.role === "admin" ? "Admin" : "Captador"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {captadoresUsuario.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {captadoresUsuario.map((cap: any) => (
                                  <Badge key={cap.id} variant="outline" className="text-xs">
                                    {cap.nome_captador || cap.instancia}
                                    <button
                                      onClick={() => handleDesvincularCaptador(cap.id)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nenhum</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUsuarioSelecionado(usuario.id);
                                  setShowVincularCaptador(true);
                                }}
                              >
                                <Link2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExcluirUsuario(usuario.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum usuário cadastrado</p>
                  <p className="text-sm">Clique em "Novo Usuário" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="config">
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
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo Usuário */}
      <Dialog open={showNovoUsuario} onOpenChange={setShowNovoUsuario}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome completo"
                value={novoUsuario.nome}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={novoUsuario.email}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showNovoUsuarioSenha ? "text" : "password"}
                  placeholder="Senha de acesso"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNovoUsuarioSenha(!showNovoUsuarioSenha)}
                >
                  {showNovoUsuarioSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <Select
                value={novoUsuario.role}
                onValueChange={(value: "admin" | "captador") => setNovoUsuario({ ...novoUsuario, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="captador">Captador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoUsuario(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarUsuario} disabled={criandoUsuario}>
              {criandoUsuario ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Vincular Captador */}
      <Dialog open={showVincularCaptador} onOpenChange={setShowVincularCaptador}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Captador</DialogTitle>
            <DialogDescription>
              Selecione um captador (número) para vincular a este usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Captador Disponível</Label>
              <Select value={captadorParaVincular} onValueChange={setCaptadorParaVincular}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um captador" />
                </SelectTrigger>
                <SelectContent>
                  {getCaptadoresSemUsuario().map((cap: any) => (
                    <SelectItem key={cap.id} value={cap.id}>
                      {cap.nome_captador || cap.instancia} - {cap.telefone_cadastrado || "Sem telefone"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getCaptadoresSemUsuario().length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os captadores já estão vinculados a usuários
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVincularCaptador(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleVincularCaptador}
              disabled={!captadorParaVincular || updateCaptador.isPending}
            >
              {updateCaptador.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
