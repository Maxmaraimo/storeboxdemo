import React, { useState, useMemo } from "react";
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
  Wand2,
  Store as StoreIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BarChart3,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const { store, lang } = useAuth();
  const { newOrdersCount, unreadChatsCount } = useNotifications();
  const storefrontUrl = store?.storefront_url || (store?.subdomain ? `/store/${store.subdomain}/` : "#");

  // Expanded by default, saved in localStorage
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
        title: lang === "ru" ? "Главное" : lang === "en" ? "Overview" : "Asosiy",
        items: [
          {
            path: "/",
            icon: LayoutDashboard,
            label: lang === "ru" ? "Главная" : lang === "en" ? "Dashboard" : "Boshqaruv paneli",
            badge: null,
          },
          {
            path: "/orders",
            icon: ShoppingCart,
            label: lang === "ru" ? "Заказы" : lang === "en" ? "Orders" : "Buyurtmalar",
            badge: newOrdersCount > 0 ? String(newOrdersCount) : null,
          },
          {
            path: "/products",
            icon: Package,
            label: lang === "ru" ? "Товары" : lang === "en" ? "Products" : "Mahsulotlar",
            badge: null,
          },
          {
            path: "/customers",
            icon: Users,
            label: lang === "ru" ? "Клиенты" : lang === "en" ? "Customers" : "Mijozlar",
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
        title: lang === "ru" ? "Каталог и склад" : lang === "en" ? "Catalog & Stock" : "Katalog & Ombor",
        items: [
          {
            path: "/categories",
            icon: FolderTree,
            label: lang === "ru" ? "Категории" : lang === "en" ? "Categories" : "Kategoriyalar",
            badge: null,
          },
          {
            path: "/discounts",
            icon: Tag,
            label: lang === "ru" ? "Скидки" : lang === "en" ? "Discounts" : "Chegirmalar",
            badge: null,
          },
          {
            path: "/warehouse",
            icon: Boxes,
            label: lang === "ru" ? "Складской учет" : lang === "en" ? "Warehouse" : "Omborxona",
            badge: null,
          },
          {
            path: "/constructor",
            icon: Wand2,
            label: lang === "ru" ? "Конструктор" : lang === "en" ? "Constructor" : "Konstruktor",
            badge: null,
          },
          {
            path: "/ikpu",
            icon: Barcode,
            label: lang === "ru" ? "Коды ИКПУ" : lang === "en" ? "IKPU Codes" : "IKPU kodlari",
            badge: null,
          },
        ],
      },
      {
        title: lang === "ru" ? "Каналы продаж" : lang === "en" ? "Sales Channels" : "Savdo kanallari",
        items: [
          {
            path: "/robo-market",
            icon: StoreIcon,
            label: lang === "ru" ? "Интернет-магазин" : lang === "en" ? "Online Store" : "Internet do'kon",
            badge: null,
          },
          {
            path: "/platforms",
            icon: Bot,
            label: lang === "ru" ? "Telegram-бот" : lang === "en" ? "Telegram Bot" : "Telegram Bot",
            badge: null,
          },
          {
            path: "/yespos",
            icon: Monitor,
            label: lang === "ru" ? "YES POS импорт" : lang === "en" ? "YES POS Sync" : "YesPOS integratsiya",
            badge: null,
          },
          {
            path: "/marketing",
            icon: Megaphone,
            label: lang === "ru" ? "Маркетинг" : lang === "en" ? "Marketing" : "Marketing & Aksiya",
            badge: null,
          },
          {
            path: "/platforms/qr",
            icon: QrCode,
            label: lang === "ru" ? "QR-меню" : lang === "en" ? "QR Menu" : "QR Menyu",
            badge: null,
          },
          {
            path: "/design",
            icon: Sparkles,
            label: lang === "ru" ? "Дизайн витрины" : lang === "en" ? "Design Studio" : "Dizayn vitrina",
            badge: null,
          },
          {
            path: "/chats",
            icon: MessageSquare,
            label: lang === "ru" ? "Сообщения" : lang === "en" ? "Customer Chats" : "Xabarlar",
            badge: unreadChatsCount > 0 ? String(unreadChatsCount) : null,
          },
        ],
      },
      {
        title: lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar",
        items: [
          {
            path: "/settings",
            icon: Settings,
            label: lang === "ru" ? "Настройки магазина" : lang === "en" ? "Store Settings" : "Do'kon sozlamalari",
            badge: null,
          },
        ],
      },
    ],
    [lang, newOrdersCount, unreadChatsCount]
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
    if (current.startsWith(target + "/")) {
      return true;
    }
    return false;
  };

  const renderNavContent = (isMobile: boolean = false) => {
    const expanded = isMobile ? true : isExpanded;

    return (
      <div className="flex flex-col h-full justify-between bg-[#18181B] text-zinc-300">
        {/* Top Header: Brand Logo & Store Info */}
        <div className="p-3.5 border-b border-zinc-800/90">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              onClick={() => isMobile && onCloseMobile && onCloseMobile()}
              className="flex items-center gap-2.5 overflow-hidden group"
              title="StoreBox"
            >
              {/* Native StoreBox Cube Logo */}
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shrink-0 shadow-xs">
                <svg
                  viewBox="0 0 32 32"
                  className="w-5 h-5 stroke-blue-500 fill-none stroke-[2] stroke-linejoin-round"
                >
                  <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
                  <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
                </svg>
              </div>

              {expanded && (
                <div className="text-left truncate">
                  <div className="text-sm font-semibold tracking-tight text-white leading-tight">
                    StoreBox
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {store?.name || "Commerce SaaS"}
                  </div>
                </div>
              )}
            </Link>

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active Store Subdomain Pill */}
          {expanded && store?.subdomain && (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 px-2.5 py-1.5 rounded-md bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-all group"
              title={lang === "ru" ? "Открыть витрину" : "Open storefront"}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate text-[11px] font-normal">{store.subdomain}.storebox.uz</span>
              </div>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
            </a>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3.5 text-xs no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {expanded && (
                <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const isItemActive = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                    className={`relative flex items-center rounded-lg transition-colors group ${
                      expanded
                        ? "px-2.5 py-1.5 gap-2.5 w-full text-[13px]"
                        : "w-9 h-9 mx-auto justify-center"
                    } ${
                      isItemActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.05] font-normal"
                    }`}
                    title={!expanded ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isItemActive
                          ? "text-white"
                          : "text-zinc-400 group-hover:text-white"
                      }`}
                      strokeWidth={1.6}
                    />

                    {expanded && <span className="truncate flex-1">{item.label}</span>}

                    {item.badge && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                          expanded ? "ml-auto shrink-0" : "absolute -top-1 -right-1"
                        } bg-zinc-800 text-zinc-200 border border-zinc-700`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Floating Tooltip when collapsed */}
                    {!expanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-white text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Section: Storefront Link & Collapse/Expand Button */}
        <div className="p-2 border-t border-zinc-800/90 space-y-1">
          {/* Storefront Link */}
          {store?.subdomain && (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors ${
                expanded ? "px-2.5 py-1.5 gap-2.5 justify-between text-xs" : "w-9 h-9 mx-auto justify-center"
              }`}
              title={lang === "ru" ? "Открыть витрину" : "View Storefront"}
            >
              <div className="flex items-center gap-2 truncate">
                <StoreIcon className="w-4 h-4 text-zinc-400" strokeWidth={1.6} />
                {expanded && (
                  <span className="truncate font-normal">
                    {lang === "ru" ? "Открыть магазин" : lang === "en" ? "View store" : "Do'kon vitrinasi"}
                  </span>
                )}
              </div>
              {expanded && <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />}
            </a>
          )}

          {/* Dedicated Working Collapse / Expand Toggle Button */}
          {!isMobile && (
            <button
              type="button"
              onClick={toggleExpand}
              className={`w-full flex items-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer ${
                expanded ? "px-2.5 py-1.5 gap-2.5 text-xs font-normal" : "w-9 h-9 mx-auto justify-center"
              }`}
              title={
                expanded
                  ? (lang === "ru" ? "Свернуть навигацию" : "Collapse navigation")
                  : (lang === "ru" ? "Развернуть навигацию" : "Expand navigation")
              }
            >
              {expanded ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.6} />
                  <span className="truncate">
                    {lang === "ru" ? "Свернуть навигацию" : lang === "en" ? "Collapse navigation" : "Navigatsiyani yopish"}
                  </span>
                </>
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.6} />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Docked Sidebar (sticky full height) */}
      <aside
        className={`bg-[#18181B] border-r border-zinc-800 shrink-0 hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-200 z-40 select-none ${
          isExpanded ? "w-60" : "w-16"
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative w-64 max-w-[80vw] h-full bg-[#18181B] border-r border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
