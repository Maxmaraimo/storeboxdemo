import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
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
import { BranchesPage } from "./pages/settings/BranchesPage";
import { StaffPage } from "./pages/settings/StaffPage";
import { TariffsPage } from "./pages/settings/TariffsPage";
import { DeliveryPage } from "./pages/settings/DeliveryPage";
import { PaymentsPage } from "./pages/settings/PaymentsPage";
import { RoboMarketPage } from "./pages/settings/RoboMarketPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds cache
    },
  },
});

export const App: React.FC = () => {
  const basename = window.location.pathname.startsWith("/dashboard") ? "/dashboard" : "";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="ikpu" element={<IkpuPage />} />
              <Route path="warehouse" element={<WarehousePage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="chats" element={<ChatsPage />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="platforms" element={<PlatformsPage />} />
              <Route path="platforms/qr" element={<QrCatalogPage />} />
              <Route path="qr" element={<QrCatalogPage />} />
              <Route path="design" element={<DesignStudioPage />} />
              <Route path="yespos" element={<YesPosPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/branches" element={<BranchesPage />} />
              <Route path="settings/staff" element={<StaffPage />} />
              <Route path="settings/tariffs" element={<TariffsPage />} />
              <Route path="settings/delivery" element={<DeliveryPage />} />
              <Route path="settings/payments" element={<PaymentsPage />} />
              <Route path="robo-market" element={<RoboMarketPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
