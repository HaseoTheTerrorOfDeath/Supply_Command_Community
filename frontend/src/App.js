import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductionPage from "./pages/ProductionPage";
import InventoryPage from "./pages/InventoryPage";
import WarehousePage from "./pages/WarehousePage";
import SupplyChainPage from "./pages/SupplyChainPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import IntelligencePage from "./pages/IntelligencePage";
import AutomationPage from "./pages/AutomationPage";
import PlantsPage from "./pages/PlantsPage";
import AppLayout from "./components/AppLayout";
import { Toaster } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="supply-chain" element={<SupplyChainPage />} />
        <Route path="traceability" element={<TraceabilityPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="plants" element={<PlantsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#0F172A', borderRadius: '0px', fontFamily: 'IBM Plex Sans' }
        }} />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
