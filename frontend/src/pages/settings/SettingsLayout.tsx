import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Store as StoreIcon,
  CreditCard,
  DollarSign,
  Truck,
  MapPin,
  Users,
  Bot,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const { store, lang } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState("");

  const navItems = [
    {
      path: "/settings",
      exact: true,
      label: lang === "ru" ? "Основные" : lang === "en" ? "General" : "Asosiy",
      icon: StoreIcon,
    },
    {
      path: "/settings/tariffs",
      label: lang === "ru" ? "План" : lang === "en" ? "Plan" : "Reja / Tariflar",
      icon: CreditCard,
    },
    {
      path: "/settings/payments",
      label: lang === "ru" ? "Платежи" : lang === "en" ? "Payments" : "To'lovlar",
      icon: DollarSign,
    },
    {
      path: "/settings/delivery",
      label: lang === "ru" ? "Доставка" : lang === "en" ? "Delivery" : "Yetkazib berish",
      icon: Truck,
    },
    {
      path: "/settings/branches",
      label: lang === "ru" ? "Филиалы" : lang === "en" ? "Locations" : "Filiallar",
      icon: MapPin,
    },
    {
      path: "/settings/staff",
      label: lang === "ru" ? "Персонал" : lang === "en" ? "Users & permissions" : "Xodimlar",
      icon: Users,
    },
    {
      path: "/platforms",
      label: "Telegram",
      icon: Bot,
    },
  ];

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return location.pathname === item.path || location.pathname === item.path + "/";
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Settings Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === "ru" ? "Панель управления" : lang === "en" ? "Dashboard" : "Boshqaruv paneli"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shopify-style Settings Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-3">
          {/* Search in settings */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={lang === "ru" ? "Поиск в настройках..." : "Search settings..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* Store Profile Card */}
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#09090b] text-white flex items-center justify-center font-bold text-sm shrink-0 border border-zinc-700">
              {store?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {store?.name || "StoreBox Store"}
              </div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {store?.subdomain ? `${store.subdomain}.storebox.uz` : "storebox.uz"}
              </div>
            </div>
          </div>

          {/* Vertical Menu */}
          <nav className="p-1 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-0.5">
            {filteredItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    active
                      ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/50 font-normal"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-slate-900 dark:text-white" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Right Column: Settings Content */}
        <main className="lg:col-span-9 min-w-0">{children}</main>
      </div>
    </div>
  );
};
