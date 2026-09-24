import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { OrderDetailPage } from "./pages/orders/OrderDetailPage";
import { ProductsPage } from "./pages/catalog/ProductsPage";
import { CategoriesPage } from "./pages/catalog/CategoriesPage";
import { CustomersPage } from "./pages/customers/CustomersPage";
import { YesPosPage } from "./pages/yespos/YesPosPage";
import { SettingsPage } from "./pages/settings/SettingsPage";

import { DesignStudioPage } from "./pages/design/DesignStudioPage";
import { QrCatalogPage } from "./pages/platforms/QrCatalogPage";
import { ChatsPage } from "./pages/chats/ChatsPage";
import { WarehousePage } from "./pages/catalog/WarehousePage";
import { DiscountsPage } from "./pages/catalog/DiscountsPage";
import { IkpuPage } from "./pages/catalog/IkpuPage";
import { MarketingPage } from "./pages/marketing/MarketingPage";
import { PlatformsPage } from "./pages/platforms/PlatformsPage";
import { TelegramBotPage } from "./pages/platforms/TelegramBotPage";
import { BranchesPage } from "./pages/settings/BranchesPage";
import { StaffPage } from "./pages/settings/StaffPage";
import { TariffsPage } from "./pages/settings/TariffsPage";
import { DeliveryPage } from "./pages/settings/DeliveryPage";
import { PaymentsPage } from "./pages/settings/PaymentsPage";
import { RoboMarketPage } from "./pages/settings/RoboMarketPage";

import { ShieldAlert } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds cache
    },
  },
});

const PermissionGuard: React.FC<{ module: string; children: React.ReactNode }> = ({
  module,
  children,
}) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, "view")) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Kirish cheklangan</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium leading-relaxed">
              Sizda bu bo'limga kirish huquqi mavjud emas. Agar bu xatolik deb hisoblasangiz, do'kon ma'muriga murojaat qiling.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const basename = window.location.pathname.startsWith("/dashboard") ? "/dashboard" : "";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/" element={<AppLayout />}>
                <Route
                  index
                  element={
                    <PermissionGuard module="dashboard">
                      <DashboardPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <PermissionGuard module="orders">
                      <OrdersPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="orders/:id"
                  element={
                    <PermissionGuard module="orders">
                      <OrderDetailPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="products"
                  element={
                    <PermissionGuard module="products">
                      <ProductsPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="categories"
                  element={
                    <PermissionGuard module="categories">
                      <CategoriesPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="discounts"
                  element={
                    <PermissionGuard module="discounts">
                      <DiscountsPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="ikpu"
                  element={
                    <PermissionGuard module="ikpu">
                      <IkpuPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="warehouse"
                  element={
                    <PermissionGuard module="warehouse">
                      <WarehousePage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="customers"
                  element={
                    <PermissionGuard module="customers">
                      <CustomersPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="chats"
                  element={
                    <PermissionGuard module="chats">
                      <ChatsPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="marketing"
                  element={
                    <PermissionGuard module="broadcast">
                      <MarketingPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="platforms"
                  element={
                    <PermissionGuard module="telegram">
                      <TelegramBotPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="telegram"
                  element={
                    <PermissionGuard module="telegram">
                      <TelegramBotPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="platforms/qr"
                  element={
                    <PermissionGuard module="analytics">
                      <QrCatalogPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="qr"
                  element={
                    <PermissionGuard module="analytics">
                      <QrCatalogPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="design"
                  element={
                    <PermissionGuard module="banners">
                      <DesignStudioPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="yespos"
                  element={
                    <PermissionGuard module="dashboard">
                      <YesPosPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <PermissionGuard module="settings">
                      <SettingsPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/branches"
                  element={
                    <PermissionGuard module="branches">
                      <BranchesPage />
                    </PermissionGuard>
                  }
                />
                {/* Staff & Roles & Couriers */}
                <Route
                  path="settings/staff"
                  element={
                    <PermissionGuard module="staff">
                      <StaffPage initialTab="staff" />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/staff/roles"
                  element={
                    <PermissionGuard module="roles">
                      <StaffPage initialTab="roles" />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/staff/couriers"
                  element={
                    <PermissionGuard module="delivery">
                      <StaffPage initialTab="couriers" />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/tariffs"
                  element={
                    <PermissionGuard module="settings">
                      <TariffsPage initialTab="plans" />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/tariffs/history"
                  element={
                    <PermissionGuard module="settings">
                      <TariffsPage initialTab="history" />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/delivery"
                  element={
                    <PermissionGuard module="delivery">
                      <DeliveryPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="settings/payments"
                  element={
                    <PermissionGuard module="payments">
                      <PaymentsPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="robo-market"
                  element={
                    <PermissionGuard module="channels">
                      <RoboMarketPage />
                    </PermissionGuard>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
