import { useState } from "react";
import { useCaptadores, useCreateCaptador, useUpdateCaptador, useDeleteCaptador } from "@/hooks/useCaptadores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Radio, Smartphone, Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function CaptadoresPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [newCaptador, setNewCaptador] = useState({
    nome_instancia: "",
    nome_captador: "",
    instancia: "",
    token: "",
    telefone_cadastrado: "",
    ativo: true,
  });

  const { data: captadores, isLoading } = useCaptadores();
  const createCaptador = useCreateCaptador();
  const updateCaptador = useUpdateCaptador();
  const deleteCaptador = useDeleteCaptador();

  const handleCreate = async () => {
    if (!newCaptador.nome_instancia || !newCaptador.nome_captador || !newCaptador.instancia) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    await createCaptador.mutateAsync({
      ...newCaptador,
      token: newCaptador.token || null,
      telefone_cadastrado: newCaptador.telefone_cadastrado || null,
    });
    setIsDialogOpen(false);
    setNewCaptador({
      nome_instancia: "",
      nome_captador: "",
      instancia: "",
      token: "",
      telefone_cadastrado: "",
      ativo: true,
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    updateCaptador.mutate({ id, ativo: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este captador?")) {
      deleteCaptador.mutate(id);
    }
  };

  const toggleShowToken = (id: string) => {
    setShowToken(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const onlineCount = captadores?.filter(c => c.ativo).length || 0;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Captadores</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas instâncias de WhatsApp</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Captador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Captador</DialogTitle>
              <DialogDescription>
                Cadastre uma nova instância de WhatsApp para disparos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome da Instância *</Label>
                <Input
                  placeholder="Ex: WhatsApp Principal"
                  value={newCaptador.nome_instancia}
                  onChange={(e) => setNewCaptador(prev => ({ ...prev, nome_instancia: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Captador *</Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={newCaptador.nome_captador}
                  onChange={(e) => setNewCaptador(prev => ({ ...prev, nome_captador: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Instância (ID) *</Label>
                <Input
                  placeholder="Ex: whatsapp-01"
                  value={newCaptador.instancia}
                  onChange={(e) => setNewCaptador(prev => ({ ...prev, instancia: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Token de Acesso</Label>
                <Input
                  type="password"
                  placeholder="Token da API"
                  value={newCaptador.token}
                  onChange={(e) => setNewCaptador(prev => ({ ...prev, token: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone Cadastrado</Label>
                <Input
                  placeholder="Ex: 5511999999999"
                  value={newCaptador.telefone_cadastrado}
                  onChange={(e) => setNewCaptador(prev => ({ ...prev, telefone_cadastrado: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={newCaptador.ativo}
                  onCheckedChange={(checked) => setNewCaptador(prev => ({ ...prev, ativo: checked }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createCaptador.isPending || !newCaptador.nome_instancia || !newCaptador.nome_captador || !newCaptador.instancia}
              >
                {createCaptador.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Captador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Radio className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{captadores?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total de Captadores</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-500">{onlineCount}</p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Nome Instância</TableHead>
              <TableHead>Nome Captador</TableHead>
              <TableHead>Instância</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  Carregando captadores...
                </TableCell>
              </TableRow>
            ) : captadores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Radio className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum captador cadastrado</p>
                    <p className="text-xs text-muted-foreground">Adicione suas instâncias de WhatsApp para começar</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              captadores?.map(captador => (
                <TableRow key={captador.id} className="border-border">
                  <TableCell className="font-medium">{captador.nome_instancia}</TableCell>
                  <TableCell>{captador.nome_captador}</TableCell>
                  <TableCell className="font-mono text-sm">{captador.instancia}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {captador.token
                          ? showToken[captador.id]
                            ? captador.token.slice(0, 20) + "..."
                            : "••••••••"
                          : "-"}
                      </span>
                      {captador.token && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleShowToken(captador.id)}
                        >
                          {showToken[captador.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {captador.telefone_cadastrado || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={captador.ativo}
                      onCheckedChange={() => handleToggleStatus(captador.id, captador.ativo)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(captador.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(captador.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {captadores && captadores.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Mostrando {captadores.length} captadores
        </p>
      )}
    </div>
  );
}
