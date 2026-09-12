import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  MessageSquare,
  Package,
  FolderTree,
  Tag,
  Barcode,
  Boxes,
  Megaphone,
  Bot,
  Sparkles,
  QrCode,
  Monitor,
  Store as StoreIcon,
  CreditCard,
  Truck,
  MapPin,
  UserCheck,
  BadgePercent,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { store, t } = useAuth();
  const { newOrdersCount, unreadChatsCount } = useNotifications();
  const storefrontUrl = store?.storefront_url || (store?.subdomain ? `/store/${store.subdomain}/` : "#");

  // Expanded by default for clear readability, with toggle to collapse
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("storebox_sidebar_expanded");
    return saved !== null ? saved === "true" : true;
  });

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("storebox_sidebar_expanded", String(next));
      return next;
    });
  };

  const navSections = useMemo(
    () => [
      {
        title: t("main_section") || "Asosiy",
        items: [
          { path: "/", icon: LayoutDashboard, label: t("dashboard") || "Boshqaruv paneli", badge: null },
          {
            path: "/orders",
            icon: ShoppingCart,
            label: t("orders") || "Buyurtmalar",
            badge: newOrdersCount > 0 ? String(newOrdersCount) : null,
          },
          { path: "/customers", icon: Users, label: t("customers") || "Mijozlar", badge: null },
          {
            path: "/chats",
            icon: MessageSquare,
            label: t("chat") || "Xabarlar & Chat",
            badge: unreadChatsCount > 0 ? String(unreadChatsCount) : null,
          },
        ],
      },
      {
        title: t("catalog_section") || "Mahsulotlar & Ombor",
        items: [
          { path: "/products", icon: Package, label: t("all_products") || "Barcha mahsulotlar", badge: null },
          { path: "/categories", icon: FolderTree, label: t("categories") || "Kategoriyalar", badge: null },
          { path: "/discounts", icon: Tag, label: t("discounts") || "Chegirmalar", badge: null },
          { path: "/ikpu", icon: Barcode, label: t("ikpu") || "IKPU kodlari", badge: null },
          { path: "/warehouse", icon: Boxes, label: t("warehouse") || "Omborxona", badge: null },
        ],
      },
      {
        title: t("marketing_section") || "Marketing & Integratsiyalar",
        items: [
          { path: "/marketing", icon: Megaphone, label: t("marketing") || "Marketing & Aksiya", badge: null },
          { path: "/platforms", icon: Bot, label: t("telegram_bot") || "Telegram Bot", badge: null },
          { path: "/design", icon: Sparkles, label: t("design_ai") || "Dizayn & AI vitrina", badge: "AI" },
          { path: "/platforms/qr", icon: QrCode, label: t("qr_catalog") || "QR Menyu & Katalog", badge: null },
          { path: "/yespos", icon: Monitor, label: t("yespos_import") || "YesPOS integratsiya", badge: "POS" },
          { path: "/robo-market", icon: StoreIcon, label: t("storebox_market") || "StoreBox Market", badge: null },
        ],
      },
      {
        title: t("settings_section") || "Sozlamalar",
        items: [
          { path: "/settings/payments", icon: CreditCard, label: t("payment_methods") || "To'lov tizimlari", badge: null },
          { path: "/settings/delivery", icon: Truck, label: t("delivery") || "Yetkazib berish", badge: null },
          { path: "/settings/branches", icon: MapPin, label: t("branches") || "Filiallar", badge: null },
          { path: "/settings/staff", icon: UserCheck, label: t("staff") || "Xodimlar & Rollar", badge: null },
          { path: "/settings/tariffs", icon: BadgePercent, label: t("tariffs") || "Tarif rejalari", badge: null },
          { path: "/settings", icon: Settings, label: t("settings") || "Asosiy sozlamalar", badge: null },
        ],
      },
    ],
    [t, newOrdersCount, unreadChatsCount]
  );

  const allNavPaths = useMemo(
    () => navSections.flatMap((section) => section.items.map((item) => item.path)),
    [navSections]
  );

  const isActive = (path: string) => {
    const current = location.pathname.replace(/\/+$/, "") || "/";
    const target = path.replace(/\/+$/, "") || "/";

    if (target === "/") {
      return current === "/";
    }

    if (current === target) {
      return true;
    }

    // Prefix match for nested sub-routes (e.g., /orders/123 -> /orders),
    // but only if there is NO more specific route defined in the sidebar menu (e.g. /platforms vs /platforms/qr)
    if (current.startsWith(target + "/")) {
      const hasMoreSpecific = allNavPaths.some((otherPath) => {
        const other = otherPath.replace(/\/+$/, "") || "/";
        return (
          other !== target &&
          other.length > target.length &&
          (current === other || current.startsWith(other + "/"))
        );
      });
      return !hasMoreSpecific;
    }

    return false;
  };

  return (
    <aside
      className={`bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-[28px] shadow-lg shadow-black/[0.03] dark:shadow-black/40 shrink-0 hidden lg:flex flex-col justify-between py-4 px-3 sticky top-4 h-[calc(100vh-32px)] transition-all duration-300 z-40 ${
        isExpanded ? "w-64" : "w-[72px]"
      }`}
    >
      {/* 1. TOP LOGO & STORE SUBDOMAIN */}
      <div className="flex flex-col gap-3 pb-3 border-b border-black/[0.06] dark:border-white/10">
        <div className="flex items-center justify-between px-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 group overflow-hidden"
            title="StoreBox Dashboard"
          >
            {/* Apple 6-dot Cluster Icon */}
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <circle cx="12" cy="5" r="2.5" />
                <circle cx="18" cy="8.5" r="2.5" />
                <circle cx="18" cy="15.5" r="2.5" />
                <circle cx="12" cy="19" r="2.5" />
                <circle cx="6" cy="15.5" r="2.5" />
                <circle cx="6" cy="8.5" r="2.5" />
                <circle cx="12" cy="12" r="1.8" className="opacity-60" />
              </svg>
            </div>

            {isExpanded && (
              <div className="text-left truncate">
                <div className="text-sm font-black tracking-tight text-neutral-900 dark:text-white leading-none">
                  Store<span className="text-neutral-500 dark:text-neutral-400">Box</span>
                </div>
                <div className="text-[9px] font-mono font-bold text-neutral-400 mt-0.5 tracking-wider">
                  STUDIO 2.0
                </div>
              </div>
            )}
          </Link>

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleExpand}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={isExpanded ? "Kichraytirish" : "Kengaytirish"}
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Store Subdomain Pill */}
        {isExpanded && store?.subdomain && (
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors group"
            title="Do'kon vitrinasini ochish"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate">{store.subdomain}.storebox.uz</span>
            </div>
            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white shrink-0" />
          </a>
        )}
      </div>

      {/* 2. SCROLLABLE NAVIGATION LIST */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {isExpanded && (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center rounded-2xl transition-all duration-150 group ${
                    isExpanded
                      ? "px-3 py-2 gap-2.5 w-full text-xs"
                      : "w-11 h-11 mx-auto justify-center"
                  } ${
                    active
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 font-medium"
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      active ? "scale-105" : "group-hover:scale-105"
                    }`}
                  />

                  {isExpanded && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {/* Badges */}
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isExpanded ? "shrink-0 ml-auto" : "absolute -top-1 -right-1"
                      } ${
                        active
                          ? "bg-white/20 dark:bg-black/20 text-white dark:text-neutral-900"
                          : item.badge === "AI"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : item.badge === "POS"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed view */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 3. FOOTER: STOREFRONT LINK */}
      {store?.subdomain && (
        <div className="pt-2 border-t border-black/[0.06] dark:border-white/10">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all ${
              isExpanded ? "p-2.5 gap-2.5 justify-between" : "w-11 h-11 mx-auto justify-center"
            }`}
            title="Do'kon saytini ko'rish"
          >
            <div className="flex items-center gap-2 truncate">
              <StoreIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {isExpanded && (
                <span className="text-xs font-bold truncate">Veb-saytni ko'rish</span>
              )}
            </div>
            {isExpanded && (
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            )}
          </a>
        </div>
      )}
    </aside>
  );
};
