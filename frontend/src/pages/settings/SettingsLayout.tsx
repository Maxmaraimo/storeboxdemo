import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Store as StoreIcon,
  CreditCard,
  DollarSign,
  Truck,
  MapPin,
  Users,
  Blocks,
  Globe2,
  Bell,
  Languages,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const { store, lang } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: "/settings",
      exact: true,
      label: lang === "ru" ? "Общие" : lang === "en" ? "General" : "Umumiy",
      icon: StoreIcon,
    },
    {
      path: "/settings/tariffs",
      label: lang === "ru" ? "План" : lang === "en" ? "Plan & Billing" : "Tarif rejasi",
      icon: CreditCard,
    },
    {
      path: "/settings/staff",
      label: lang === "ru" ? "Пользователи и роли" : lang === "en" ? "Users & permissions" : "Xodimlar va rollar",
      icon: Users,
    },
    {
      path: "/settings/payments",
      label: lang === "ru" ? "Платежи" : lang === "en" ? "Payments" : "To'lov usullari",
      icon: DollarSign,
    },
    {
      path: "/settings/delivery",
      label: lang === "ru" ? "Доставка" : lang === "en" ? "Shipping & delivery" : "Yetkazib berish",
      icon: Truck,
    },
    {
      path: "/settings/branches",
      label: lang === "ru" ? "Места расположения" : lang === "en" ? "Locations" : "Filiallar",
      icon: MapPin,
    },
    {
      path: "/settings/domains",
      label: lang === "ru" ? "Домены" : lang === "en" ? "Domains" : "Domenlar",
      icon: Globe2,
    },
    {
      path: "/settings/integrations",
      label: lang === "ru" ? "Приложения и интеграции" : lang === "en" ? "Apps & integrations" : "Integratsiyalar",
      icon: Blocks,
    },
    {
      path: "/settings/notifications",
      label: lang === "ru" ? "Уведомления" : lang === "en" ? "Notifications" : "Bildirishnomalar",
      icon: Bell,
    },
    {
      path: "/settings/languages",
      label: lang === "ru" ? "Языки" : lang === "en" ? "Languages" : "Tillar",
      icon: Languages,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return location.pathname === item.path || location.pathname === item.path + "/";
    }
    return location.pathname.startsWith(item.path);
  };

  const activeItem = navItems.find(isActive) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Shopify Settings Top Breadcrumb & Close Bar (fix20.mov 05:38-05:42) */}
      <div className="flex items-center justify-between bg-white dark:bg-[#18181B] border border-[#e1e3e5] dark:border-zinc-800 rounded-[12px] px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#f6f6f7] hover:bg-zinc-200/70 dark:bg-zinc-800 text-xs font-semibold text-[#202223] dark:text-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{lang === "ru" ? "Назад в магазин" : lang === "en" ? "Back to store" : "Do'konga qaytish"}</span>
          </button>

          <span className="text-zinc-300 dark:text-zinc-700">/</span>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#202223] dark:text-white truncate">
            <ActiveIcon className="w-4 h-4 text-[#5c5f62] dark:text-zinc-400 shrink-0" />
            <span className="truncate">{activeItem.label}</span>
          </div>

          <span className="hidden sm:inline text-xs text-[#6d7175] dark:text-zinc-400 truncate">
            • {store?.name || "StoreBox"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-7 h-7 rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 hover:bg-[#f6f6f7] dark:hover:bg-zinc-800 flex items-center justify-center text-[#5c5f62] dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
          title={lang === "ru" ? "Закрыть настройки (✕)" : "Close settings"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Horizontal Settings Switcher (visible on < lg where desktop sidebar is hidden) */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs whitespace-nowrap transition-colors shrink-0 ${
                active
                  ? "bg-[#202223] text-white font-semibold shadow-2xs"
                  : "bg-white border border-[#e1e3e5] text-[#5c5f62] hover:text-[#202223]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Settings Canvas Content */}
      <main className="min-w-0">{children}</main>
    </div>
  );
};
