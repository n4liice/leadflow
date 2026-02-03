import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/LeadsPage";
import CaptadoresPage from "./pages/CaptadoresPage";
import CampanhasPage from "./pages/CampanhasPage";
import MonitorPage from "./pages/MonitorPage";
import TemplatesPage from "./pages/TemplatesPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/captadores" element={<CaptadoresPage />} />
            <Route path="/campanhas" element={<CampanhasPage />} />
            <Route path="/monitor" element={<MonitorPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
