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

const BrandMark = () => (
  <svg
    viewBox="0 0 32 32"
    className="w-[26px] h-[26px] fill-none stroke-white stroke-[1.8] stroke-linejoin-round"
    aria-hidden="true"
  >
    <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
    <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
  </svg>
);

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
                path: "/orders?tab=abandoned",
                label:
                  lang === "ru"
                    ? "Незавершенные оформления"
                    : lang === "en"
                    ? "Abandoned checkouts"
                    : "Tugallanmagan savatlar",
              },
              {
                path: "/orders?tab=drafts",
                label: lang === "ru" ? "Черновики" : lang === "en" ? "Drafts" : "Qoralamalar",
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

  /* Settings uses the same visual language as the primary navigation. */
  const renderSettingsSidebar = (isMobile: boolean = false) => {
    const filteredSettings = settingsNavItems.filter((i) =>
      i.label.toLowerCase().includes(settingsSearch.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-left-2 duration-150">
        <div className="storebox-sidebar-brand px-3.5">
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (isMobile && onCloseMobile) onCloseMobile();
                navigate("/");
              }}
              className="storebox-sidebar-back inline-flex items-center gap-2 px-2 py-1.5 text-[14px] font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
              <span>{lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}</span>
            </button>

            {isMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="storebox-sidebar-icon-button w-8 h-8 flex items-center justify-center"
                aria-label={lang === "ru" ? "Закрыть меню" : lang === "en" ? "Close menu" : "Menyuni yopish"}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="storebox-sidebar-settings-tools space-y-3 p-3.5">
          <div className="storebox-sidebar-store-card flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="storebox-sidebar-store-avatar w-8 h-8 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(store?.name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate leading-tight">
                  {store?.name || "Мой магазин"}
                </div>
                <div className="storebox-sidebar-muted text-[11px] truncate mt-0.5">
                  {lang === "ru" ? "Параметры магазина" : lang === "en" ? "Store settings" : "Do'kon sozlamalari"}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="storebox-sidebar-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={settingsSearch}
              onChange={(e) => setSettingsSearch(e.target.value)}
              placeholder={lang === "ru" ? "Поиск" : "Qidiruv"}
              className="storebox-sidebar-search w-full pl-9 pr-7 py-2 text-xs focus:outline-none"
            />
            {settingsSearch && (
              <button
                type="button"
                onClick={() => setSettingsSearch("")}
                className="storebox-sidebar-muted absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                aria-label={lang === "ru" ? "Очистить поиск" : lang === "en" ? "Clear search" : "Qidiruvni tozalash"}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <nav className="storebox-sidebar-nav flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar" aria-label={lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}>
          {filteredSettings.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                  className={`storebox-sidebar-link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="storebox-sidebar-link-icon">
                    <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.85} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>

                {item.subItems && active && (
                  <div className="storebox-sidebar-subnav ml-[27px] pl-3 pr-1 py-1 space-y-0.5">
                    {item.subItems.map((sub) => {
                      const subActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                          className={`storebox-sidebar-sub-link ${subActive ? "is-active" : ""}`}
                          aria-current={subActive ? "page" : undefined}
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

        <div className="storebox-sidebar-footer p-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="storebox-sidebar-back w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{lang === "ru" ? "Вернуться в магазин" : "Do'konga qaytish"}</span>
          </button>
        </div>
      </div>
    );
  };

  /* StoreBox navigation shares the landing page's light surfaces and dark accent. */
  const renderMainSidebar = (isMobile: boolean = false) => {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="storebox-sidebar-brand px-3.5">
          <div className="flex w-full items-center justify-between gap-2">
            <Link
              to="/"
              onClick={() => isMobile && onCloseMobile && onCloseMobile()}
              className="storebox-sidebar-brand-link flex items-center gap-2.5 overflow-hidden group min-w-0"
              title="StoreBox"
            >
              <span className="storebox-sidebar-logo w-10 h-10 flex items-center justify-center shrink-0">
                <BrandMark />
              </span>
              <span className="storebox-wordmark text-[20px] font-extrabold tracking-[-0.045em] leading-none">StoreBox</span>
            </Link>

            {!isMobile ? (
              <button
                type="button"
                onClick={toggleExpand}
                className="storebox-sidebar-icon-button w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
                title={lang === "ru" ? "Свернуть навигацию" : "Collapse navigation"}
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.9} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onCloseMobile}
                className="storebox-sidebar-icon-button w-8 h-8 flex items-center justify-center shrink-0"
                aria-label={lang === "ru" ? "Закрыть меню" : lang === "en" ? "Close menu" : "Menyuni yopish"}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <nav className="storebox-sidebar-nav flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar" aria-label={lang === "ru" ? "Навигация" : lang === "en" ? "Navigation" : "Navigatsiya"}>
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.items.map((item: any) => {
                const isItemActive = isNavItemActive(item.path);
                const showSub = isSectionExpanded(item) && item.subItems;
                const Icon = item.icon;

                return (
                  <div key={item.path} className="space-y-0.5">
                    <Link
                      to={item.path}
                      onClick={() => isMobile && onCloseMobile && onCloseMobile()}
                      className={`storebox-sidebar-link group ${isItemActive ? "is-active" : ""}`}
                      aria-current={isItemActive ? "page" : undefined}
                    >
                      <span className="storebox-sidebar-link-icon">
                        <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.9} />
                      </span>

                      <span className="truncate flex-1">{item.label}</span>

                      {item.badge && (
                        <span className="storebox-sidebar-badge ml-auto shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {showSub && (
                      <div className="storebox-sidebar-subnav ml-[27px] pl-3 pr-1 py-1 space-y-0.5">
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
                              className={`storebox-sidebar-sub-link ${subActive ? "is-active" : ""}`}
                              aria-current={subActive ? "page" : undefined}
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

        <div className="storebox-sidebar-footer p-3">
          <Link
            to="/settings"
            onClick={() => isMobile && onCloseMobile && onCloseMobile()}
            className={`storebox-sidebar-link ${isSettingsMode ? "is-active" : ""}`}
            aria-current={isSettingsMode ? "page" : undefined}
          >
            <span className="storebox-sidebar-link-icon">
              <Settings className="w-[17px] h-[17px] shrink-0" strokeWidth={1.9} />
            </span>
            <span className="truncate">
              {lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}
            </span>
          </Link>
        </div>
      </div>
    );
  };

  const renderCollapsedSidebar = () => {
    const flatItems = navSections.flatMap((s) => s.items);
    return (
      <div className="storebox-sidebar-rail flex flex-col h-full items-center pb-3 justify-between overflow-visible">
        <div className="flex flex-col items-center w-full">
          <div className="storebox-sidebar-brand w-full justify-center">
            <Link
              to="/"
              className="storebox-sidebar-logo w-10 h-10 flex items-center justify-center shrink-0"
              title={`StoreBox — ${store?.name || "Dashboard"}`}
              aria-label="StoreBox"
            >
              <BrandMark />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-1 w-full px-1.5 pt-4">
            {flatItems.map((item: any) => {
              const isItemActive = isNavItemActive(item.path);
              const Icon = item.icon;
              return (
                <div key={item.path} className="relative group w-full flex justify-center">
                  <Link
                    to={item.path}
                    className={`storebox-sidebar-rail-link relative w-10 h-9 flex items-center justify-center ${isItemActive ? "is-active" : ""}`}
                    aria-label={item.label}
                    aria-current={isItemActive ? "page" : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
                    {item.badge && (
                      <span className="storebox-sidebar-badge absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center leading-none shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  <div className="hidden group-hover:block group-focus-within:block absolute left-full top-0 pl-2 z-[80]">
                    <div className="storebox-sidebar-flyout min-w-[210px] py-2 px-1.5">
                      <Link
                        to={item.path}
                        className={`storebox-sidebar-flyout-link flex items-center justify-between ${isItemActive ? "is-active" : ""}`}
                        aria-current={isItemActive ? "page" : undefined}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="storebox-sidebar-badge leading-none">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                      {item.subItems && item.subItems.length > 0 && (
                        <div className="storebox-sidebar-flyout-divider mt-1 pt-1 space-y-0.5">
                          {item.subItems.map((sub: any) => {
                            const currentFull = location.pathname + location.search;
                            const subActive =
                              currentFull === sub.path ||
                              (sub.path.indexOf("?") === -1 && location.pathname === sub.path);
                            return (
                              <Link
                                key={sub.path}
                                to={sub.path}
                                className={`storebox-sidebar-sub-link ${subActive ? "is-active" : ""}`}
                                aria-current={subActive ? "page" : undefined}
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

        <div className="storebox-sidebar-rail-footer flex flex-col items-center gap-1.5 w-full px-1.5 pt-2">
          <div className="relative group w-full flex justify-center">
            <button
              type="button"
              onClick={toggleExpand}
              className="storebox-sidebar-rail-link w-10 h-9 flex items-center justify-center cursor-pointer"
              aria-label={lang === "ru" ? "Развернуть навигацию" : "Expand navigation"}
            >
              <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </button>
            <div className="hidden group-hover:block group-focus-within:block absolute left-full top-1/2 -translate-y-1/2 pl-2 z-[80] pointer-events-none">
              <div className="storebox-sidebar-flyout px-2.5 py-1.5 text-xs font-medium whitespace-nowrap">
                {lang === "ru" ? "Развернуть навигацию" : lang === "en" ? "Expand navigation" : "Navigatsiyani ochish"}
              </div>
            </div>
          </div>

          <div className="relative group w-full flex justify-center">
            <Link
              to="/settings"
              className="storebox-sidebar-rail-link w-10 h-9 flex items-center justify-center"
              aria-label={lang === "ru" ? "Настройки" : lang === "en" ? "Settings" : "Sozlamalar"}
            >
              <Settings className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </Link>
            <div className="hidden group-hover:block group-focus-within:block absolute left-full top-1/2 -translate-y-1/2 pl-2 z-[80] pointer-events-none">
              <div className="storebox-sidebar-flyout px-2.5 py-1.5 text-xs font-medium whitespace-nowrap">
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
      <aside
        className={`storebox-sidebar shrink-0 hidden lg:flex flex-col h-screen sticky top-0 transition-[width] duration-300 z-40 select-none ${
          isSettingsMode || isExpanded ? "w-60" : "w-14 overflow-visible"
        }`}
      >
        {isSettingsMode
          ? renderSettingsSidebar(false)
          : isExpanded
          ? renderMainSidebar(false)
          : renderCollapsedSidebar()}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#171321]/45 backdrop-blur-[3px] transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="storebox-sidebar relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {isSettingsMode ? renderSettingsSidebar(true) : renderMainSidebar(true)}
          </div>
        </div>
      )}
    </>
  );
};
