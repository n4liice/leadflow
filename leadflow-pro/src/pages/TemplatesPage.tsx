import { useState } from "react";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/hooks/useTemplates";
import { processSpintext, extractVariables, extractSpintextOptions, validateSpintext } from "@/lib/spintext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileText, Eye, RefreshCw, Trash2, Edit, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<string>("");
  const [newTemplate, setNewTemplate] = useState({
    nome: "",
    conteudo: "",
  });

  const { data: templates, isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const handleCreate = async () => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({
        id: editingTemplate,
        ...newTemplate,
      });
    } else {
      await createTemplate.mutateAsync(newTemplate);
    }
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setNewTemplate({ nome: "", conteudo: "" });
  };

  const handleEdit = (template: typeof templates extends (infer T)[] ? T : never) => {
    setEditingTemplate(template.id);
    setNewTemplate({ nome: template.nome, conteudo: template.conteudo });
    setIsDialogOpen(true);
  };

  const handlePreview = () => {
    const result = processSpintext(newTemplate.conteudo, {
      nome: "João Silva",
      condominio: "Residencial Sol",
      nome_captador: "Maria Santos",
    });
    setPreviewResult(result);
  };

  const variables = extractVariables(newTemplate.conteudo);
  const spintextOptions = extractSpintextOptions(newTemplate.conteudo);
  const validation = validateSpintext(newTemplate.conteudo);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-1">Crie mensagens com variações usando spintext</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            setNewTemplate({ nome: "", conteudo: "" });
            setPreviewResult("");
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome do Template</Label>
                <Input
                  placeholder="Ex: Boas-vindas Condomínio"
                  value={newTemplate.nome}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Conteúdo da Mensagem</Label>
                <Textarea
                  placeholder="{Olá|Oi|E aí} {{nome}}, tudo bem? Sou do {{condominio}} e gostaria de {conversar|falar} com você."
                  rows={6}
                  value={newTemplate.conteudo}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, conteudo: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Dicas de Sintaxe</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Spintext */}
                  <div className="bg-background/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium">Variações (Spintext)</span>
                    </div>
                    <div className="pl-3.5">
                      <code className="text-xs font-mono text-emerald-400">{`{opção1|opção2|opção3}`}</code>
                      <p className="text-[11px] text-muted-foreground mt-1">Escolhe aleatoriamente uma das opções</p>
                    </div>
                  </div>

                  {/* Variáveis */}
                  <div className="bg-background/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-xs font-medium">Variáveis Disponíveis</span>
                    </div>
                    <div className="pl-3.5 flex flex-wrap gap-2">
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{`{{nome}}`}</code>
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{`{{condominio}}`}</code>
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{`{{nome_captador}}`}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Erro de validação */}
              {!validation.valid && newTemplate.conteudo && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{validation.error}</p>
                </div>
              )}

              {(variables.length > 0 || spintextOptions.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {variables.map(v => (
                    <Badge key={v} variant="outline" className="bg-primary/10">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                  {spintextOptions.map((opts, i) => (
                    <Badge key={i} variant="outline" className="bg-success/10 text-success">
                      {opts.length} variações
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePreview}
                  disabled={!newTemplate.conteudo}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePreview}
                  disabled={!newTemplate.conteudo}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {previewResult && (
                <div className="glass-card p-4 border-primary/30">
                  <p className="text-xs text-muted-foreground mb-2">Resultado do Preview:</p>
                  <p className="text-sm whitespace-pre-wrap">{previewResult}</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={createTemplate.isPending || updateTemplate.isPending || !newTemplate.nome || !newTemplate.conteudo || !validation.valid}
              >
                {(createTemplate.isPending || updateTemplate.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingTemplate ? "Salvar Alterações" : "Criar Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : templates?.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum template criado</h3>
          <p className="text-muted-foreground mb-4">Crie templates com spintext para variar suas mensagens</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates?.map(template => (
            <Card key={template.id} className="glass-card-hover border-border">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base font-medium">{template.nome}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir o template "${template.nome}"?`)) {
                        deleteTemplate.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-lg">
                  {template.conteudo}
                </pre>
                <div className="flex flex-wrap gap-2 mt-3">
                  {extractVariables(template.conteudo).map(v => (
                    <Badge key={v} variant="outline" className="text-xs">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
