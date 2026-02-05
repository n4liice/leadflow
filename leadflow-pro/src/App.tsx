import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/LeadsPage";
import CaptadoresPage from "./pages/CaptadoresPage";
import CampanhasPage from "./pages/CampanhasPage";
import MonitorPage from "./pages/MonitorPage";
import TemplatesPage from "./pages/TemplatesPage";
import AdminPage from "./pages/AdminPage";
import PipelinePage from "./pages/PipelinePage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard - apenas admin */}
            <Route
              path="/"
              element={
                <PrivateRoute requireAdmin>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Leads - apenas admin */}
            <Route
              path="/leads"
              element={
                <PrivateRoute requireAdmin>
                  <Layout>
                    <LeadsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Captadores - apenas admin */}
            <Route
              path="/captadores"
              element={
                <PrivateRoute requireAdmin>
                  <Layout>
                    <CaptadoresPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Campanhas - apenas admin */}
            <Route
              path="/campanhas"
              element={
                <PrivateRoute requireAdmin>
                  <Layout>
                    <CampanhasPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Monitor/Disparos - todos podem acessar */}
            <Route
              path="/monitor"
              element={
                <PrivateRoute>
                  <Layout>
                    <MonitorPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Pipeline/Kanban - todos podem acessar (captador vê só os seus) */}
            <Route
              path="/pipeline"
              element={
                <PrivateRoute>
                  <Layout>
                    <PipelinePage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Templates - apenas admin */}
            <Route
              path="/templates"
              element={
                <PrivateRoute requireAdmin>
                  <Layout>
                    <TemplatesPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Admin - apenas admin */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requireAdmin>
                  <Layout>
                    <AdminPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
