import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Wand2,
  Store as StoreIcon,
  Settings,
  ChevronLeft,
  BarChart3,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Blocks,
  Palette,
  Globe,
  CreditCard,
  Truck,
  MapPin,
  Bell,
  Languages,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { store, lang } = useAuth();
  const { newOrdersCount, unreadChatsCount } = useNotifications();

  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("storebox_sidebar_expanded");
    return saved !== null ? saved === "true" : true;
  });

  const [settingsSearch, setSettingsSearch] = useState("");

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("storebox_sidebar_expanded", String(next));
      return next;
    });
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleExpand();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isSettingsMode = location.pathname.startsWith("/settings");

  const settingsNavItems = useMemo(
    () => [
      {
        path: "/settings",
        exact: true,
        icon: StoreIcon,
        label: lang === "ru" ? "Общие" : lang === "en" ? "General" : "Umumiy",
      },
      {
        path: "/settings/tariffs",
        exact: true,
        icon: CreditCard,
        label: lang === "ru" ? "План" : lang === "en" ? "Plan" : "Tarif rejasi",
      },
      {
        path: "/settings/tariffs/history",
        icon: Receipt,
        label: lang === "ru" ? "Выставление счетов" : lang === "en" ? "Billing" : "Hisob-kitoblar",
      },
      {
        path: "/settings/staff",
        icon: Users,
        label: lang === "ru" ? "Пользователи и роли" : lang === "en" ? "Users and permissions" : "Xodimlar va rollar",
        subItems: [
          { path: "/settings/staff", label: lang === "ru" ? "Сотрудники" : "Xodimlar" },
          { path: "/settings/staff/roles", label: lang === "ru" ? "Роли" : "Rollar" },
          { path: "/settings/staff/couriers", label: lang === "ru" ? "Курьеры" : "Kuryerlar" },
        ],
      },
      {
        path: "/settings/payments",
        icon: ShieldCheck,
        label: lang === "ru" ? "Платежи" : lang === "en" ? "Payments" : "To'lov tizimlari",
      },
      {
        path: "/settings/delivery",
        icon: Truck,
        label: lang === "ru" ? "Доставка" : lang === "en" ? "Shipping and delivery" : "Yetkazib berish",
      },
      {
        path: "/settings/branches",
        icon: MapPin,
        label: lang === "ru" ? "Места расположения (Филиалы)" : lang === "en" ? "Locations" : "Filiallar",
      },
      {
        path: "/settings/integrations",
        icon: Blocks,
        label: lang === "ru" ? "Приложения и интеграции" : lang === "en" ? "Apps and integrations" : "Integratsiyalar",
      },
      {
        path: "/settings/domains",
        icon: Globe,
        label: lang === "ru" ? "Домены" : lang === "en" ? "Domains" : "Domenlar",
      },
      {
        path: "/settings/notifications",
        icon: Bell,
        label: lang === "ru" ? "Уведомления" : lang === "en" ? "Notifications" : "Bildirishnomalar",
      },
      {
        path: "/settings/languages",
        icon: Languages,
        label: lang === "ru" ? "Языки" : lang === "en" ? "Languages" : "Tillar (UZ / RU / EN)",
      },
    ],
    [lang]
  );

  const navSections = useMemo(
    () => [
      {
        title: null,
        items: [
          {
            path: "/",
            icon: LayoutDashboard,
            label: lang === "ru" ? "Главная" : lang === "en" ? "Home" : "Bosh sahifa",
            badge: null,
          },
          {
            path: "/orders",
            icon: ShoppingCart,
            label: lang === "ru" ? "Заказы" : lang === "en" ? "Orders" : "Buyurtmalar",
            badge: newOrdersCount > 0 ? String(newOrdersCount) : null,
            subItems: [
              {
                path: "/orders?tab=drafts",
                label: lang === "ru" ? "Черновики" : lang === "en" ? "Drafts" : "Qoralamalar",
              },
              {
                path: "/orders?tab=abandoned",
                label:
                  lang === "ru"
                    ? "Незавершенные оформления"
                    : lang === "en"
                    ? "Abandoned checkouts"
                    : "Tugallanmagan savatlar",
              },
            ],
          },
          {
            path: "/products",
            icon: Package,
            label: lang === "ru" ? "Товары" : lang === "en" ? "Products" : "Mahsulotlar",
            badge: null,
            subItems: [
              {
                path: "/categories",
                label: lang === "ru" ? "Коллекции (Категории)" : lang === "en" ? "Collections" : "Kategoriyalar",
              },
              {
                path: "/warehouse",
                label: lang === "ru" ? "Товарные запасы" : lang === "en" ? "Inventory" : "Ombor zaxirasi",
              },
              {
                path: "/constructor",
                label: lang === "ru" ? "Конструктор товаров" : lang === "en" ? "Product Builder" : "Konstruktor",
              },
              {
                path: "/ikpu",
                label: lang === "ru" ? "Коды ИКПУ (МХИК)" : lang === "en" ? "IKPU Codes" : "IKPU kodlari",
              },
            ],
          },
          {
            path: "/customers",
            icon: Users,
            label: lang === "ru" ? "Клиенты" : lang === "en" ? "Customers" : "Mijozlar",
            badge: null,
            subItems: [
              {
                path: "/customers?tab=segments",
                label: lang === "ru" ? "Сегменты" : lang === "en" ? "Segments" : "Segmentlar",
              },
            ],
          },
          {
            path: "/marketing",
            icon: Megaphone,
            label: lang === "ru" ? "Маркетинг" : lang === "en" ? "Marketing" : "Marketing",
            badge: null,
          },
          {
            path: "/discounts",
            icon: Tag,
            label: lang === "ru" ? "Скидки" : lang === "en" ? "Discounts" : "Chegirmalar",
            badge: null,
          },
          {
            path: "/markets",
            icon: Globe,
            label: lang === "ru" ? "Рынки" : lang === "en" ? "Markets" : "Bozorlar",
            badge: null,
          },
          {
            path: "/analytics",
            icon: BarChart3,
            label: lang === "ru" ? "Аналитика" : lang === "en" ? "Analytics" : "Tahlil",
            badge: null,
          },
        ],
      },
      {
        title: lang === "ru" ? "Каналы продаж" : lang === "en" ? "Sales channels" : "Savdo kanallari",
        items: [
          {
            path: "/themes",
            icon: Palette,
            label: lang === "ru" ? "Интернет-магазин (Темы)" : lang === "en" ? "Online Store" : "Vitrina mavzulari",
            badge: "13",
            subItems: [
              {
                path: "/themes",
                label: lang === "ru" ? "Темы витрин" : "Mavzular",
              },
              {
                path: "/design",
                label: lang === "ru" ? "Редактор витрины" : "Vitrina dizayni",
              },
              {
                path: "/platforms/qr",
                label: lang === "ru" ? "QR-каталог" : "QR-katalog",
              },
            ],
          },
          {
            path: "/platforms",
            icon: Bot,
            label: lang === "ru" ? "Telegram-бот (TMA)" : lang === "en" ? "Telegram Bot" : "Telegram Bot",
            badge: null,
          },
          {
            path: "/chats",
            icon: MessageSquare,
            label: lang === "ru" ? "Сообщения клиентов" : lang === "en" ? "Inbox" : "Xabarlar",
            badge: unreadChatsCount > 0 ? String(unreadChatsCount) : null,
          },
          {
            path: "/robo-market",
            icon: Blocks,
            label: lang === "ru" ? "Маркет интеграций" : lang === "en" ? "App Store" : "Integratsiyalar",
            badge: null,
          },
        ],
      },
    ],
    [lang, newOrdersCount, unreadChatsCount]
  );

  const isActive = (path: string, exact?: boolean) => {
    const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/";
    const current = location.pathname.replace(/\/+$/, "") || "/";
    if (exact || cleanPath === "/") {
      return current === cleanPath;
    }
    return current === cleanPath || current.startsWith(cleanPath + "/");
  };

  const isNavItemActive = (path: string) =>
    isActive(path) ||
    (path === "/robo-market" &&
      ["/yespos", "/billz", "/integrations"].some((integrationPath) =>
        isActive(integrationPath)
      ));

  const isSectionExpanded = (item: any) => {
    if (isActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some((sub: any) => isActive(sub.path.split("?")[0]));
    }
    return false;
  };

  /* ----------------------------------------------------------------------
   * RENDER 1: SHOPIFY DARK SETTINGS SIDEBAR (when on /settings*)
   * Matches fix20.mov 05:24 - 06:44
   * ---------------------------------------------------------------------- */
  const renderSettingsSidebar = (isMobile: boolean = false) => {
    const filteredSettings = settingsNavItems.filter((i) =>
      i.label.toLowerCase().includes(settingsSearch.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full justify-between bg-[#211b2e] text-[#ffffff] animate-in fade-in slide-in-from-left-2 duration-150">
        <div className="p-3 space-y-3 border-b border-zinc-800/90">
          {/* Top Back Button: < Настройки */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
                navigate("/");
              }}
              className="inline-flex items-center gap-2 px-2 py-1.5 rounded-[8px] text-[#ffffff] hover:bg-[#3b304e] transition-colors text-[14px] font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-white" strokeWidth={2.2} />
              <span>{lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}</span>
            </button>

            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#3b304e]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Store Card with PRO Badge (like Shopify 05:26) */}
          <div className="px-2.5 py-2 rounded-[10px] bg-[#2c243d] border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-[6px] bg-[#6d5a88] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(store?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {store?.name || "Мой магазин"}
                </div>
                <div className="text-[11px] text-zinc-400 truncate font-mono">
                  {store?.subdomain ? `${store.subdomain}.storebox.uz` : "storebox.uz"}
                </div>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6d5a88] text-white shrink-0">
              PRO
            </span>
          </div>

          {/* Settings Search Input (like Shopify 05:51) */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
              placeholder={lang === "ru" ? "Поиск" : "Qidiruv"}
              className="w-full pl-8 pr-7 py-1.5 rounded-[8px] bg-[#30263f] border border-zinc-700/80 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
            />
            {settingsSearch && (
              <button
                type="button"
                onClick={() => setSettingsSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Settings Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-0.5 no-scrollbar">
          {filteredSettings.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] transition-colors ${
                    active
                      ? "bg-[#3b304e] text-[#ffffff] font-semibold"
                      : "text-[#f1f1f1] hover:bg-[#30263f] hover:text-white font-normal"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-zinc-300"}`}
                    strokeWidth={1.85}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>

                {item.subItems && active && (
                  <div className="pl-8 pr-1 py-1 space-y-0.5">
                    {item.subItems.map((sub) => {
                      const subActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                          className={`block px-2.5 py-1.5 rounded-[6px] text-xs transition-colors ${
                            subActive
                              ? "bg-[#3b304e] text-white font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-[#30263f]"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Storefront Link */}
        <div className="p-2.5 border-t border-zinc-800/90">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[8px] bg-[#30263f] hover:bg-[#3b304e] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{lang === "ru" ? "Вернуться в магазин" : "Do'konga qaytish"}</span>
          </button>
        </div>
      </div>
    );
  };

  /* ----------------------------------------------------------------------
   * RENDER 2: MAIN STOREBOX GLOBAL SIDEBAR
   * Pure black #211b2e, bright white text #ffffff, full collapse to bottom-left pill
   * ---------------------------------------------------------------------- */
  const renderMainSidebar = (isMobile: boolean = false) => {
    return (
      <div className="flex flex-col h-full justify-between bg-[#211b2e] text-[#ffffff]">
        {/* Top Header: Brand Logo + Search + Collapse Button */}
        <div className="storebox-sidebar-brand px-3 py-3 border-b border-[#e2e6f0] bg-white shadow-[0_5px_20px_rgba(33,27,46,0.08)]">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/"
              onClick={() => isMobile && onCloseMobile && onCloseMobile()}
              className="flex items-center gap-2.5 overflow-hidden group min-w-0 text-[#171321]"
              title="StoreBox"
            >
              <div className="w-10 h-10 rounded-xl bg-[#211b2e] flex items-center justify-center shrink-0 shadow-[0_8px_18px_rgba(33,27,46,0.24)]">
                <svg
                  viewBox="0 0 32 32"
                  className="w-[26px] h-[26px] fill-none stroke-white stroke-[1.8] stroke-linejoin-round"
                >
                  <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
                  <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
                </svg>
              </div>
              <span className="storebox-wordmark text-[20px] font-extrabold tracking-[-0.045em] leading-none">StoreBox</span>
            </Link>

            {/* Collapse Navigation Button (Shopify top-right of sidebar) */}
            {!isMobile ? (
              <button
                type="button"
                onClick={toggleExpand}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#686475] hover:text-[#211b2e] hover:bg-[#eef1f8] transition-colors cursor-pointer shrink-0"
                title={lang === "ru" ? "Свернуть навигацию" : "Collapse navigation"}
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.9} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#686475] hover:text-[#211b2e] hover:bg-[#eef1f8] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4 text-xs no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.title && (
                <div className="px-2.5 py-1 text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
                  <span>{section.title}</span>
                  <span>›</span>
                </div>
              )}

              {section.items.map((item: any) => {
                const isItemActive = isNavItemActive(item.path);
                const showSub = isSectionExpanded(item) && item.subItems;
                const Icon = item.icon;

                return (
                  <div key={item.path} className="space-y-0.5">
                    <Link
                      to={item.path}
                      onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                      className={`relative flex items-center rounded-[8px] px-2.5 py-1.5 gap-2.5 w-full text-[13px] transition-colors group ${
                        isItemActive
                          ? "bg-[#3b304e] text-[#ffffff] font-semibold"
                          : "text-[#f4f4f5] hover:text-[#ffffff] hover:bg-[#30263f] font-medium"
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isItemActive
                            ? "text-[#ffffff]"
                            : "text-[#e4e4e7] group-hover:text-[#ffffff]"
                        }`}
                        strokeWidth={1.9}
                      />

                      <span className="truncate flex-1">{item.label}</span>

                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0 bg-[#6d5a88] text-white leading-none shadow-2xs">
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* Nested Shopify Sub-navigation (Drafts, Abandoned, Inventory, Categories, etc.) */}
                    {showSub && (
                      <div className="pl-7 pr-1 py-0.5 space-y-0.5">
                        {item.subItems.map((sub: any) => {
                          const currentFull = location.pathname + location.search;
                          const subActive =
                            currentFull === sub.path ||
                            (sub.path.indexOf("?") === -1 && location.pathname === sub.path);
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                              className={`block px-2.5 py-1.5 rounded-[7px] text-[12.5px] transition-colors ${
                                subActive
                                  ? "bg-[#3b304e] text-white font-semibold"
                                  : "text-zinc-300 hover:text-white hover:bg-[#30263f] font-normal"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Settings (Shopify pinned bottom item) */}
        <div className="p-2.5 border-t border-zinc-800/90 space-y-1">
          <Link
            to="/settings"
            onClick={() => isMobile && onCloseMobile && onCloseMobile()}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] transition-colors ${
              isSettingsMode
                ? "bg-[#3b304e] text-white font-semibold"
                : "text-[#f4f4f5] hover:text-white hover:bg-[#30263f] font-medium"
            }`}
          >
            <Settings className="w-[18px] h-[18px] text-[#e4e4e7] shrink-0" strokeWidth={1.9} />
            <span className="truncate">
              {lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}
            </span>
          </Link>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------
   * COLLAPSED ICON-RAIL SIDEBAR (Shopify w-14 rail with Logo + Hover Flyouts)
   * ------------------------------------------------------------------ */
  const renderCollapsedSidebar = () => {
    const flatItems = navSections.flatMap((s) => s.items);
    return (
      <div className="flex flex-col h-full items-center py-3 justify-between overflow-visible">
        {/* Top StoreBox Cube Logo */}
        <div className="flex flex-col items-center gap-2 w-full">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-[#342a47] border border-white/15 hover:bg-[#453957] flex items-center justify-center shrink-0 shadow-[0_8px_18px_rgba(15,10,25,0.22)] transition-colors"
            title={`StoreBox — ${store?.name || "Dashboard"}`}
          >
            <svg
              viewBox="0 0 32 32"
              className="w-[26px] h-[26px] fill-none stroke-white stroke-[1.8] stroke-linejoin-round"
            >
              <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
              <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
            </svg>
          </Link>

          <div className="w-7 h-[1px] bg-zinc-800/90 my-0.5" />

          {/* Stacked Navigation Icons with Hover Flyout Menus */}
          <div className="flex flex-col items-center gap-1 w-full px-1.5">
            {flatItems.map((item: any) => {
              const isItemActive = isNavItemActive(item.path);
              const Icon = item.icon;
              return (
                <div key={item.path} className="relative group w-full flex justify-center">
                  <Link
                    to={item.path}
                    className={`relative w-10 h-9 rounded-[8px] flex items-center justify-center transition-colors ${
                      isItemActive
                        ? "bg-[#3b304e] text-white"
                        : "text-zinc-300 hover:text-white hover:bg-[#30263f]"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#6d5a88] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Hover Flyout Menu (with pl-2 hover bridge so cursor can click sub-items) */}
                  <div className="hidden group-hover:block absolute left-full top-0 pl-2 z-[80]">
                    <div className="min-w-[210px] rounded-[10px] bg-[#30263f] border border-zinc-800 shadow-2xl py-2 px-1.5 text-white">
                      <Link
                        to={item.path}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px] text-[13px] font-semibold text-white hover:bg-[#3b304e] transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#6d5a88] text-white leading-none">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                      {item.subItems && item.subItems.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-zinc-800/80 space-y-0.5">
                          {item.subItems.map((sub: any) => {
                            const currentFull = location.pathname + location.search;
                            const subActive =
                              currentFull === sub.path ||
                              (sub.path.indexOf("?") === -1 && location.pathname === sub.path);
                            return (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                className={`block px-2.5 py-1.5 rounded-[7px] text-[12px] transition-colors ${
                                  subActive
                                    ? "bg-[#3b304e] text-white font-semibold"
                                    : "text-zinc-300 hover:text-white hover:bg-[#30263f]"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Controls: Expand Sidebar Button & Settings Icon */}
        <div className="flex flex-col items-center gap-1.5 w-full px-1.5 pt-2 border-t border-zinc-800/90">
          <div className="relative group w-full flex justify-center">
            <button
              type="button"
              onClick={toggleExpand}
              className="w-10 h-9 rounded-[8px] flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#3b304e] transition-colors cursor-pointer"
              aria-label={lang === "ru" ? "Развернуть навигацию" : "Expand navigation"}
            >
              <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </button>
            <div className="hidden group-hover:block absolute left-full top-1/2 -translate-y-1/2 pl-2 z-[80] pointer-events-none">
              <div className="px-2.5 py-1.5 rounded-[8px] bg-[#30263f] border border-zinc-800 text-white text-xs font-medium whitespace-nowrap shadow-xl">
                {lang === "ru" ? "Развернуть навигацию" : lang === "en" ? "Expand navigation" : "Navigatsiyani ochish"}
              </div>
            </div>
          </div>

          <div className="relative group w-full flex justify-center">
            <Link
              to="/settings"
              className="w-10 h-9 rounded-[8px] flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#3b304e] transition-colors"
            >
              <Settings className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </Link>
            <div className="hidden group-hover:block absolute left-full top-1/2 -translate-y-1/2 pl-2 z-[80] pointer-events-none">
              <div className="px-2.5 py-1.5 rounded-[8px] bg-[#30263f] border border-zinc-800 text-white text-xs font-medium whitespace-nowrap shadow-xl">
                {lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Sidebar: Expanded = w-60, Collapsed = w-14 Icon Rail with Logo & Flyout Menus */}
      <aside
        className={`bg-[#211b2e] shrink-0 hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-200 z-40 select-none border-r border-zinc-800/90 ${
          isSettingsMode || isExpanded ? "w-60" : "w-14 overflow-visible"
        }`}
      >
        {isSettingsMode
          ? renderSettingsSidebar(false)
          : isExpanded
          ? renderMainSidebar(false)
          : renderCollapsedSidebar()}
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-[#211b2e] border-r border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {isSettingsMode ? renderSettingsSidebar(true) : renderMainSidebar(true)}
          </div>
        </div>
      )}
    </>
  );
};
