import { useState } from "react";
import {
  usePipelineByStage,
  useMoveCard,
  useUpdateCardNotes,
  STAGE_CONFIG,
  STAGES_ORDER,
  StagePipeline,
  PipelineCard,
} from "@/hooks/usePipeline";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  KanbanSquare,
  Phone,
  Building2,
  User,
  MessageSquare,
  Calendar,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipelinePage() {
  const { isAdmin } = useAuth();
  const { cardsByStage, isLoading, totalCards } = usePipelineByStage();
  const moveCard = useMoveCard();
  const updateNotes = useUpdateCardNotes();

  const [selectedCard, setSelectedCard] = useState<PipelineCard | null>(null);
  const [notes, setNotes] = useState("");
  const [draggedCard, setDraggedCard] = useState<PipelineCard | null>(null);

  const handleOpenCard = (card: PipelineCard) => {
    setSelectedCard(card);
    setNotes(card.observacoes || "");
  };

  const handleSaveNotes = () => {
    if (selectedCard) {
      updateNotes.mutate({ cardId: selectedCard.id, observacoes: notes });
    }
  };

  const handleMoveCard = (cardId: string, newStage: StagePipeline) => {
    moveCard.mutate({ cardId, newStage });
    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard({ ...selectedCard, stage: newStage });
    }
  };

  const handleDragStart = (card: PipelineCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: StagePipeline) => {
    if (draggedCard && draggedCard.stage !== stage) {
      handleMoveCard(draggedCard.id, stage);
    }
    setDraggedCard(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentStageIndex = (stage: StagePipeline) => {
    return STAGES_ORDER.indexOf(stage);
  };

  const canMoveLeft = (stage: StagePipeline) => getCurrentStageIndex(stage) > 0;
  const canMoveRight = (stage: StagePipeline) =>
    getCurrentStageIndex(stage) < STAGES_ORDER.length - 1;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline de Captação</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Gerencie todos os proprietários que responderam"
              : "Gerencie seus proprietários que responderam"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <KanbanSquare className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">{totalCards} cards</span>
        </div>
      </div>

      {/* Stats por stage */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STAGES_ORDER.map((stage) => (
          <div
            key={stage}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white shrink-0",
              STAGE_CONFIG[stage].color
            )}
          >
            <span>{STAGE_CONFIG[stage].label}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full">
              {cardsByStage[stage]?.length || 0}
            </span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Carregando pipeline...</p>
        </div>
      ) : totalCards === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <KanbanSquare className="w-16 h-16 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhum proprietário respondeu ainda
          </p>
          <p className="text-xs text-muted-foreground/70">
            Quando um lead responder, ele aparecerá aqui automaticamente
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES_ORDER.map((stage) => (
            <div
              key={stage}
              className={cn(
                "flex-shrink-0 w-[300px] rounded-lg border transition-colors",
                draggedCard && draggedCard.stage !== stage
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-card/50"
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              {/* Stage Header */}
              <div
                className={cn(
                  "p-3 rounded-t-lg",
                  STAGE_CONFIG[stage].color
                )}
              >
                <div className="flex items-center justify-between text-white">
                  <h3 className="font-medium">{STAGE_CONFIG[stage].label}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {cardsByStage[stage]?.length || 0}
                  </Badge>
                </div>
                <p className="text-xs text-white/80 mt-1">
                  {STAGE_CONFIG[stage].description}
                </p>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
                {cardsByStage[stage]?.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card)}
                    onDragEnd={() => setDraggedCard(null)}
                    className={cn(
                      "bg-background rounded-lg border p-3 cursor-pointer hover:border-primary/50 transition-all",
                      draggedCard?.id === card.id && "opacity-50"
                    )}
                    onClick={() => handleOpenCard(card)}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{card.nome}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Phone className="w-3 h-3" />
                          <span className="font-mono">{card.telefone}</span>
                        </div>
                        {card.condominio && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{card.condominio}</span>
                          </div>
                        )}
                        {isAdmin && card.captador && (
                          <div className="flex items-center gap-1 text-xs text-primary mt-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">
                              {card.captador.nome_captador || card.captador.instancia}
                            </span>
                          </div>
                        )}
                        {card.observacoes && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MessageSquare className="w-3 h-3" />
                            <span className="truncate">{card.observacoes}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(card.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de detalhes do card */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedCard?.nome}
            </DialogTitle>
            <DialogDescription>
              Detalhes do proprietário e acompanhamento
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  <p className="font-mono">{selectedCard.telefone}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Condomínio</Label>
                  <p>{selectedCard.condominio || "-"}</p>
                </div>
              </div>

              {isAdmin && selectedCard.captador && (
                <div>
                  <Label className="text-xs text-muted-foreground">Captador</Label>
                  <p>
                    {selectedCard.captador.nome_captador || "Sem nome"} (
                    {selectedCard.captador.instancia})
                  </p>
                </div>
              )}

              {/* Stage atual e navegação */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Estágio atual
                </Label>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!canMoveLeft(selectedCard.stage)}
                        onClick={() => {
                          const idx = getCurrentStageIndex(selectedCard.stage);
                          if (idx > 0) {
                            handleMoveCard(selectedCard.id, STAGES_ORDER[idx - 1]);
                          }
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mover para estágio anterior</TooltipContent>
                  </Tooltip>

                  <Select
                    value={selectedCard.stage}
                    onValueChange={(v) =>
                      handleMoveCard(selectedCard.id, v as StagePipeline)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES_ORDER.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                STAGE_CONFIG[stage].color
                              )}
                            />
                            {STAGE_CONFIG[stage].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!canMoveRight(selectedCard.stage)}
                        onClick={() => {
                          const idx = getCurrentStageIndex(selectedCard.stage);
                          if (idx < STAGES_ORDER.length - 1) {
                            handleMoveCard(selectedCard.id, STAGES_ORDER[idx + 1]);
                          }
                        }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mover para próximo estágio</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Observações
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre este proprietário..."
                  rows={4}
                />
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span>Criado em: </span>
                  <span>{formatDate(selectedCard.created_at)}</span>
                </div>
                <div>
                  <span>Atualizado em: </span>
                  <span>{formatDate(selectedCard.updated_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveNotes}
                  disabled={notes === (selectedCard.observacoes || "")}
                  className="flex-1"
                >
                  Salvar Observações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCard(null)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
