import { cn } from "@/lib/utils";

type StatusType = "success" | "error" | "warning" | "pending" | "active" | "inactive";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, { className: string; defaultLabel: string }> = {
  success: {
    className: "status-success",
    defaultLabel: "Sucesso",
  },
  error: {
    className: "status-error",
    defaultLabel: "Erro",
  },
  warning: {
    className: "status-warning",
    defaultLabel: "Atenção",
  },
  pending: {
    className: "status-pending",
    defaultLabel: "Pendente",
  },
  active: {
    className: "status-success",
    defaultLabel: "Online",
  },
  inactive: {
    className: "status-error",
    defaultLabel: "Offline",
  },
};

export function StatusBadge({ status, label, pulse }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn(config.className, "relative")}>
      {pulse && (
        <span className="absolute -left-0.5 w-2 h-2 rounded-full bg-current animate-pulse-glow" />
      )}
      {label || config.defaultLabel}
    </span>
  );
}
