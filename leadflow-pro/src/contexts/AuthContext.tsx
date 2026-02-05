import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "captador";
  ativo: boolean;
}

interface Captador {
  id: string;
  nome_captador: string | null;
  instancia: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  captadores: Captador[];
  loading: boolean;
  isAdmin: boolean;
  isCaptador: boolean;
  signIn: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "leadflow_usuario";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [captadores, setCaptadores] = useState<Captador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    const savedUsuario = localStorage.getItem(STORAGE_KEY);

    if (!savedUsuario) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(savedUsuario) as Usuario;

      // Valida se o usuário ainda existe e está ativo no banco
      const { data, error } = await supabase
        .from("leadflow_usuarios")
        .select("id, nome, email, role, ativo")
        .eq("id", parsed.id)
        .eq("ativo", true)
        .maybeSingle();

      if (error || !data) {
        // Usuário não existe mais ou foi desativado
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
        return;
      }

      // Atualiza com dados mais recentes do banco
      const usuarioAtualizado = data as Usuario;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarioAtualizado));
      setUsuario(usuarioAtualizado);
      if (usuarioAtualizado.role !== "admin") {
        await fetchCaptadores(usuarioAtualizado.id);
      } else {
        setCaptadores([]);
        setLoading(false);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    }
  };

  const fetchCaptadores = async (usuarioId: string, silent = false) => {
    try {
      const { data: captadoresData, error: captadoresError } = await supabase
        .from("leadflow_captadores")
        .select("id, nome_captador, instancia")
        .eq("id_usuario", usuarioId);

      if (captadoresError) {
        console.error("Erro ao buscar captadores:", captadoresError);
      }

      setCaptadores(captadoresData as Captador[] || []);
    } catch (error) {
      console.error("Erro ao buscar captadores:", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const signIn = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Busca o usuário pelo email e senha
      const { data, error } = await supabase
        .from("leadflow_usuarios")
        .select("id, nome, email, role, ativo")
        .eq("email", email.toLowerCase().trim())
        .eq("senha", senha)
        .eq("ativo", true)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: "Email ou senha incorretos" };
      }

      const usuarioData = data as Usuario;

      // Salva no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarioData));
      setUsuario(usuarioData);

      // Busca captadores vinculados (apenas para captador)
      if (usuarioData.role !== "admin") {
        await fetchCaptadores(usuarioData.id);
      } else {
        setCaptadores([]);
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return { success: false, error: "Erro ao fazer login. Tente novamente." };
    }
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
    setCaptadores([]);
  };

  const isAdmin = usuario?.role === "admin";
  const isCaptador = usuario?.role === "captador";

  useEffect(() => {
    if (!usuario || isAdmin) return;
    const interval = setInterval(() => {
      fetchCaptadores(usuario.id, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [usuario?.id, isAdmin]);

  useEffect(() => {
    if (!usuario || isAdmin) return;
    const channel = supabase
      .channel("leadflow_captadores_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leadflow_captadores" },
        () => {
          fetchCaptadores(usuario.id, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuario?.id, isAdmin]);

  return (
    <AuthContext.Provider value={{ usuario, captadores, loading, isAdmin, isCaptador, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
