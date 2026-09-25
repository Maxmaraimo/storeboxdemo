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
  const { store, t, lang } = useAuth();
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

  // Accordion open/close state for nested menu items (staff & tariffs)
  const [staffAccordionOpen, setStaffAccordionOpen] = useState<boolean>(() => {
    return location.pathname.startsWith("/settings/staff") || location.pathname.startsWith("/settings/roles") || location.pathname.startsWith("/settings/couriers");
  });
  const [tariffAccordionOpen, setTariffAccordionOpen] = useState<boolean>(() => {
    return location.pathname.startsWith("/settings/tariffs");
  });

  useEffect(() => {
    if (location.pathname.startsWith("/settings/staff") || location.pathname.startsWith("/settings/roles") || location.pathname.startsWith("/settings/couriers")) {
      setStaffAccordionOpen(true);
    }
    if (location.pathname.startsWith("/settings/tariffs")) {
      setTariffAccordionOpen(true);
    }
  }, [location.pathname]);

  const navSections = useMemo(
    () => [
      {
        title: t("main_section") || "Asosiy",
        items: [
          { path: "/", icon: LayoutDashboard, label: t("dashboard") || "Boshqaruv paneli", badge: null, permissionModule: "dashboard" },
          {
            path: "/orders",
            icon: ShoppingCart,
            label: t("orders") || "Buyurtmalar",
            badge: newOrdersCount > 0 ? String(newOrdersCount) : null,
            permissionModule: "orders",
          },
          { path: "/customers", icon: Users, label: t("customers") || "Mijozlar", badge: null, permissionModule: "customers" },
          {
            path: "/chats",
            icon: MessageSquare,
            label: t("chat") || "Xabarlar & Chat",
            badge: unreadChatsCount > 0 ? String(unreadChatsCount) : null,
            permissionModule: "chats",
          },
        ],
      },
      {
        title: t("catalog_section") || "Mahsulotlar & Ombor",
        items: [
          { path: "/products", icon: Package, label: t("all_products") || "Barcha mahsulotlar", badge: null, permissionModule: "products" },
          { path: "/categories", icon: FolderTree, label: t("categories") || "Kategoriyalar", badge: null, permissionModule: "categories" },
          { path: "/discounts", icon: Tag, label: t("discounts") || "Chegirmalar", badge: null, permissionModule: "discounts" },
          { path: "/ikpu", icon: Barcode, label: t("ikpu") || "IKPU kodlari", badge: null, permissionModule: "ikpu" },
          { path: "/warehouse", icon: Boxes, label: t("warehouse") || "Omborxona", badge: null, permissionModule: "warehouse" },
        ],
      },
      {
        title: t("marketing_section") || "Marketing & Integratsiyalar",
        items: [
          { path: "/marketing", icon: Megaphone, label: t("marketing") || "Marketing & Aksiya", badge: null, permissionModule: "broadcast" },
          { path: "/platforms", icon: Bot, label: t("telegram_bot") || "Telegram Bot", badge: null, permissionModule: "telegram" },
          { path: "/design", icon: Sparkles, label: t("design_ai") || "Dizayn & AI vitrina", badge: "AI", permissionModule: "banners" },
          { path: "/platforms/qr", icon: QrCode, label: t("qr_catalog") || "QR Menyu & Katalog", badge: null, permissionModule: "analytics" },
          { path: "/yespos", icon: Monitor, label: t("yespos_import") || "YesPOS integratsiya", badge: "POS", permissionModule: "dashboard" },
          { path: "/robo-market", icon: StoreIcon, label: t("storebox_market") || "StoreBox Market", badge: null, permissionModule: "channels" },
        ],
      },
      {
        title: t("settings_section") || "Sozlamalar",
        items: [
          { path: "/settings/payments", icon: CreditCard, label: t("payment_methods") || "To'lov tizimlari", badge: null, permissionModule: "payments" },
          { path: "/settings/delivery", icon: Truck, label: t("delivery") || "Yetkazib berish", badge: null, permissionModule: "delivery" },
          { path: "/settings/branches", icon: MapPin, label: t("branches") || "Filiallar", badge: null, permissionModule: "branches" },
          {
            path: "/settings/staff",
            icon: UserCheck,
            label: t("staff") || "Xodimlar",
            badge: null,
            permissionModule: "staff",
            isAccordion: true,
            accordionKey: "staff",
            subItems: [
              { path: "/settings/staff", label: lang === "ru" ? "Сотрудники" : lang === "en" ? "Staff" : "Xodimlar", permissionModule: "staff" },
              { path: "/settings/staff/roles", label: lang === "ru" ? "Роли и права" : lang === "en" ? "Roles" : "Rollar", permissionModule: "roles" },
              { path: "/settings/staff/couriers", label: lang === "ru" ? "Курьеры" : lang === "en" ? "Couriers" : "Kuryer", permissionModule: "delivery" },
            ],
          },
          {
            path: "/settings/tariffs",
            icon: BadgePercent,
            label: t("tariffs") || "Tarif rejalari",
            badge: null,
            permissionModule: "settings",
            isAccordion: true,
            accordionKey: "tariffs",
            subItems: [
              {
                path: "/settings/tariffs",
                label: lang === "ru" ? "Тарифные планы" : lang === "en" ? "Pricing Plans" : "Tarif rejalari",
                permissionModule: "settings",
              },
              {
                path: "/settings/tariffs/history",
                label: lang === "ru" ? "История платежей" : lang === "en" ? "Payment History" : "To'lovlar tarixi",
                permissionModule: "settings",
              },
            ],
          },
          { path: "/settings", icon: Settings, label: t("settings") || "Asosiy sozlamalar", badge: null, permissionModule: "settings" },
        ],
      },
    ],
    [t, lang, newOrdersCount, unreadChatsCount]
  );

  const allNavPaths = useMemo(
    () =>
      navSections.flatMap((section) =>
        section.items.flatMap((item) =>
          item.subItems ? item.subItems.map((s) => s.path) : [item.path]
        )
      ),
    [navSections]
  );

  const isActive = (path: string, exact: boolean = false) => {
    const current = location.pathname.replace(/\/+$/, "") || "/";
    const target = path.replace(/\/+$/, "") || "/";

    if (target === "/") {
      return current === "/";
    }

    if (current === target) {
      return true;
    }

    if (exact) {
      return false;
    }

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
      className={`bg-white/75 dark:bg-[#12141a] backdrop-blur-2xl border border-white/85 dark:border-white/10 rounded-[28px] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.07),inset_0_1.5px_2px_rgba(255,255,255,0.95)] shrink-0 hidden lg:flex flex-col justify-between py-4 px-3 sticky top-4 h-[calc(100vh-32px)] transition-all duration-300 z-40 ${
        isExpanded ? "w-64" : "w-[72px]"
      }`}
    >
      {/* 1. TOP LOGO & STORE SUBDOMAIN */}
      <div className="flex flex-col gap-3 pb-3 border-b border-black/[0.06] dark:border-white/10">
        <div className={`flex items-center ${isExpanded ? "justify-between px-1" : "justify-center"}`}>
          {isExpanded && (
            <Link
              to="/"
              className="flex items-center gap-2.5 group overflow-hidden"
              title="StoreBox Dashboard"
            >
              {/* StoreBox Official Brand Cube Logo */}
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] flex items-center justify-center shadow-lg shadow-[#211b2e]/25 border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 32 32" className="w-6 h-6 stroke-[#c8ff6a] fill-none stroke-[1.8] stroke-linejoin-round">
                  <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
                  <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
                </svg>
              </div>

              <div className="text-left truncate">
                <div className="text-[17px] font-[850] tracking-[-0.6px] text-neutral-900 dark:text-white leading-none">
                  StoreBox
                </div>
                <div className="text-[9px] font-bold text-neutral-400 mt-1 tracking-wider">
                  STUDIO 2.0
                </div>
              </div>
            </Link>
          )}

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleExpand}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={isExpanded ? (t("collapse") || "Kichraytirish") : (t("expand") || "Kengaytirish")}
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
            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-black/[0.04] dark:border-white/10 flex items-center justify-between text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors group"
            title={t("view_storefront_tooltip") || "Do'kon vitrinasini ochish"}
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff6a] animate-pulse"></span>
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
              const isAccordionOpen =
                item.accordionKey === "tariffs"
                  ? tariffAccordionOpen
                  : staffAccordionOpen;

              const isItemActive = item.isAccordion
                ? item.accordionKey === "tariffs"
                  ? location.pathname.startsWith("/settings/tariffs")
                  : location.pathname.startsWith("/settings/staff") ||
                    location.pathname.startsWith("/settings/roles") ||
                    location.pathname.startsWith("/settings/couriers")
                : isActive(item.path);
              const Icon = item.icon;

              if (item.isAccordion && item.subItems) {
                return (
                  <div key={item.path} className="space-y-1">
                    {/* Accordion parent trigger */}
                    <div
                      onClick={() => {
                        if (!isExpanded) {
                          setIsExpanded(true);
                          if (item.accordionKey === "tariffs") {
                            setTariffAccordionOpen(true);
                          } else {
                            setStaffAccordionOpen(true);
                          }
                        } else {
                          if (item.accordionKey === "tariffs") {
                            setTariffAccordionOpen((prev) => !prev);
                          } else {
                            setStaffAccordionOpen((prev) => !prev);
                          }
                        }
                      }}
                      className={`relative flex items-center rounded-2xl transition-all duration-150 cursor-pointer group select-none ${
                        isExpanded
                          ? "px-3 py-2 gap-2.5 w-full text-xs"
                          : "w-11 h-11 mx-auto justify-center"
                      } ${
                        isItemActive
                          ? "bg-[#211b2e] dark:bg-[#c8ff6a] text-white dark:text-[#211b2e] font-bold shadow-md shadow-[#211b2e]/20"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-white dark:hover:text-[#211b2e] hover:bg-[#211b2e] dark:hover:bg-[#c8ff6a] font-medium"
                      }`}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isItemActive
                            ? "scale-105 text-[#c8ff6a] dark:text-[#211b2e]"
                            : "group-hover:scale-105 group-hover:text-[#c8ff6a] dark:group-hover:text-[#211b2e]"
                        }`}
                      />

                      {isExpanded && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isAccordionOpen
                                ? "rotate-90 text-[#c8ff6a] dark:text-[#211b2e]"
                                : "text-neutral-400 group-hover:text-white dark:group-hover:text-[#211b2e]"
                            }`}
                          />
                        </>
                      )}

                      {!isExpanded && (
                        <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-neutral-900 dark:bg-neutral-800 border border-transparent dark:border-white/10 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                          {item.label}
                        </div>
                      )}
                    </div>

                    {/* Accordion Subitems */}
                    {isExpanded && isAccordionOpen && (
                      <div className="pl-6 pr-1 space-y-1 border-l-2 border-slate-100 dark:border-neutral-800 ml-4 my-1">
                        {item.subItems.map((sub) => {
                          const subActive = location.pathname.replace(/\/+$/, "") === sub.path.replace(/\/+$/, "");
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              className={`flex items-center px-3 py-1.5 rounded-xl text-xs transition-colors ${
                                subActive
                                  ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] font-bold"
                                  : "text-neutral-500 dark:text-neutral-400 hover:text-[#211b2e] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center rounded-2xl transition-all duration-150 group ${
                    isExpanded
                      ? "px-3 py-2 gap-2.5 w-full text-xs"
                      : "w-11 h-11 mx-auto justify-center"
                  } ${
                    isItemActive
                      ? "bg-[#211b2e] dark:bg-[#c8ff6a] text-white dark:text-[#211b2e] shadow-md shadow-[#211b2e]/20 font-bold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-white dark:hover:text-[#211b2e] hover:bg-[#211b2e] dark:hover:bg-[#c8ff6a] font-medium"
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isItemActive
                        ? "scale-105 text-[#c8ff6a] dark:text-[#211b2e]"
                        : "group-hover:scale-105 group-hover:text-[#c8ff6a] dark:group-hover:text-[#211b2e]"
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
                        isItemActive
                          ? "bg-white/20 text-[#c8ff6a] dark:bg-[#211b2e]/20 dark:text-[#211b2e]"
                          : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 group-hover:bg-white/20 group-hover:text-[#c8ff6a]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed view */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-neutral-900 dark:bg-neutral-800 border border-transparent dark:border-white/10 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
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
            title={t("view_storefront_tooltip") || "Do'kon saytini ko'rish"}
          >
            <div className="flex items-center gap-2 truncate">
              <StoreIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
              {isExpanded && (
                <span className="text-xs font-bold truncate">{t("view_website") || "Veb-saytni ko'rish"}</span>
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
