import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageContext, useLanguageProvider } from './hooks/useLanguage';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { InventoryWithRouting as Inventory } from './pages/Inventory';
import { UniversalInventory } from './pages/UniversalInventory';
import { Customers } from './pages/Customers';
import { Invoices } from './pages/Invoices';
import { AccountingWithRouting as Accounting } from './pages/Accounting';
import { ReportsWithRouting as Reports } from './pages/Reports';
import { SettingsWithRouting as Settings } from './pages/Settings';
import { SMSWithRouting as SMS } from './pages/SMS';
import { AuthGuard } from './components/auth/AuthGuard';
import { MainLayout } from './components/layout/MainLayout';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App Content
const AppContent: React.FC = () => {
  const languageContextValue = useLanguageProvider();

  // Set initial document direction
  React.useEffect(() => {
    document.documentElement.dir = languageContextValue.direction;
    document.documentElement.lang = languageContextValue.language;
  }, [languageContextValue.direction, languageContextValue.language]);

  return (
    <LanguageContext.Provider value={languageContextValue}>
      <div className="App min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/inventory/*"
            element={
              <AuthGuard>
                <MainLayout>
                  <Inventory />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/universal-inventory"
            element={
              <AuthGuard>
                <MainLayout>
                  <UniversalInventory />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/customers"
            element={
              <AuthGuard>
                <MainLayout>
                  <Customers />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/invoices"
            element={
              <AuthGuard>
                <MainLayout>
                  <Invoices />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/accounting/*"
            element={
              <AuthGuard>
                <MainLayout>
                  <Accounting />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/reports/*"
            element={
              <AuthGuard>
                <MainLayout>
                  <Reports />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/settings/*"
            element={
              <AuthGuard>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/sms/*"
            element={
              <AuthGuard>
                <MainLayout>
                  <SMS />
                </MainLayout>
              </AuthGuard>
            }
          />
          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </LanguageContext.Provider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;