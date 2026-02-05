import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function PrivateRoute({ children, requireAdmin = false }: PrivateRouteProps) {
  const { usuario, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não está logado - redireciona para login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Precisa ser admin mas não é - redireciona para monitor (única página que captador pode ver)
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/monitor" replace />;
  }

  return <>{children}</>;
}
