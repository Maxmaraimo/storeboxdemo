import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface CrumbMeta {
  labelRu: string;
  labelUz: string;
  labelEn: string;
  parentPath?: string;
  parentLabelRu?: string;
  parentLabelUz?: string;
  parentLabelEn?: string;
}

const ROUTE_META: Record<string, CrumbMeta> = {
  "/orders": {
    labelRu: "Заказы",
    labelUz: "Buyurtmalar",
    labelEn: "Orders",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/products": {
    labelRu: "Товары",
    labelUz: "Mahsulotlar",
    labelEn: "Products",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/constructor": {
    labelRu: "Конструктор товаров",
    labelUz: "Mahsulot konstruktori",
    labelEn: "Product Constructor",
    parentPath: "/products",
    parentLabelRu: "списку товаров",
    parentLabelUz: "mahsulotlar ro'yxatiga",
    parentLabelEn: "products list",
  },
  "/categories": {
    labelRu: "Категории",
    labelUz: "Kategoriyalar",
    labelEn: "Categories",
    parentPath: "/products",
    parentLabelRu: "каталогу товаров",
    parentLabelUz: "mahsulotlar katalogiga",
    parentLabelEn: "catalog",
  },
  "/discounts": {
    labelRu: "Скидки и промокоды",
    labelUz: "Chegirmalar va promokodlar",
    labelEn: "Discounts",
    parentPath: "/products",
    parentLabelRu: "каталогу товаров",
    parentLabelUz: "mahsulotlar katalogiga",
    parentLabelEn: "catalog",
  },
  "/warehouse": {
    labelRu: "Склад и инвентаризация",
    labelUz: "Ombor va inventarizatsiya",
    labelEn: "Inventory & Warehouse",
    parentPath: "/products",
    parentLabelRu: "списку товаров",
    parentLabelUz: "mahsulotlar ro'yxatiga",
    parentLabelEn: "products list",
  },
  "/ikpu": {
    labelRu: "Коды ИКПУ (Soliq)",
    labelUz: "IKPU kodlari",
    labelEn: "IKPU Tax Codes",
    parentPath: "/products",
    parentLabelRu: "каталогу товаров",
    parentLabelUz: "mahsulotlar katalogiga",
    parentLabelEn: "catalog",
  },
  "/customers": {
    labelRu: "Клиенты и CRM",
    labelUz: "Mijozlar va CRM",
    labelEn: "Customers & CRM",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/analytics": {
    labelRu: "Аналитика и отчеты",
    labelUz: "Tahlil va hisobotlar",
    labelEn: "Analytics & Reports",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/robo-market": {
    labelRu: "Маркет интеграций",
    labelUz: "Integratsiyalar marketi",
    labelEn: "Integrations Market",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/integrations": {
    labelRu: "Маркет интеграций",
    labelUz: "Integratsiyalar marketi",
    labelEn: "Integrations Market",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/themes": {
    labelRu: "Темы витрин (Online Store)",
    labelUz: "Vitrina mavzulari",
    labelEn: "Storefront Themes",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/design": {
    labelRu: "Дизайн и баннеры витрины",
    labelUz: "Vitrina dizayni",
    labelEn: "Storefront Design Studio",
    parentPath: "/themes",
    parentLabelRu: "темам витрин",
    parentLabelUz: "vitrina mavzulariga",
    parentLabelEn: "themes",
  },
  "/platforms": {
    labelRu: "Telegram-бот и Mini App",
    labelUz: "Telegram-bot va Mini App",
    labelEn: "Telegram Bot & Mini App",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/telegram": {
    labelRu: "Telegram-бот и Mini App",
    labelUz: "Telegram-bot va Mini App",
    labelEn: "Telegram Bot & Mini App",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/platforms/qr": {
    labelRu: "QR-меню и столы",
    labelUz: "QR-menyu",
    labelEn: "QR Menu",
    parentPath: "/platforms",
    parentLabelRu: "каналам продаж",
    parentLabelUz: "savdo kanallariga",
    parentLabelEn: "sales channels",
  },
  "/yespos": {
    labelRu: "YES POS синхронизация",
    labelUz: "YES POS integratsiyasi",
    labelEn: "YES POS Sync",
    parentPath: "/robo-market",
    parentLabelRu: "списку интеграций",
    parentLabelUz: "integratsiyalar ro'yxatiga",
    parentLabelEn: "integrations list",
  },
  "/billz": {
    labelRu: "Billz POS синхронизация",
    labelUz: "Billz POS integratsiyasi",
    labelEn: "Billz POS Sync",
    parentPath: "/robo-market",
    parentLabelRu: "списку интеграций",
    parentLabelUz: "integratsiyalar ro'yxatiga",
    parentLabelEn: "integrations list",
  },
  "/marketing": {
    labelRu: "Маркетинг и рассылки",
    labelUz: "Marketing va tarqatmalar",
    labelEn: "Marketing & Broadcasts",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/chats": {
    labelRu: "Диалоги с клиентами",
    labelUz: "Mijozlar bilan suhbat",
    labelEn: "Customer Chats",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/settings": {
    labelRu: "Общие настройки",
    labelUz: "Umumiy sozlamalar",
    labelEn: "General Settings",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
  "/settings/tariffs": {
    labelRu: "Тарифный план и биллинг",
    labelUz: "Tarif rejasi va billing",
    labelEn: "Plan & Billing",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/tariffs/history": {
    labelRu: "История списаний",
    labelUz: "To'lovlar tarixi",
    labelEn: "Billing History",
    parentPath: "/settings/tariffs",
    parentLabelRu: "тарифному плану",
    parentLabelUz: "tarif rejasiga",
    parentLabelEn: "plan",
  },
  "/settings/payments": {
    labelRu: "Способы оплаты",
    labelUz: "To'lov usullari",
    labelEn: "Payment Methods",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/delivery": {
    labelRu: "Доставка и зоны",
    labelUz: "Yetkazib berish va hududlar",
    labelEn: "Delivery & Zones",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/branches": {
    labelRu: "Филиалы и склады",
    labelUz: "Filiallar va omborlar",
    labelEn: "Branches & Locations",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/staff": {
    labelRu: "Персонал и роли",
    labelUz: "Xodimlar va rollar",
    labelEn: "Staff & Permissions",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/staff/roles": {
    labelRu: "Роли и права доступа",
    labelUz: "Rollar va ruxsatlar",
    labelEn: "Roles & Access",
    parentPath: "/settings/staff",
    parentLabelRu: "списку сотрудников",
    parentLabelUz: "xodimlar ro'yxatiga",
    parentLabelEn: "staff list",
  },
  "/settings/staff/couriers": {
    labelRu: "Курьеры доставки",
    labelUz: "Kuryerlar",
    labelEn: "Couriers",
    parentPath: "/settings/staff",
    parentLabelRu: "списку сотрудников",
    parentLabelUz: "xodimlar ro'yxatiga",
    parentLabelEn: "staff list",
  },
  "/settings/domains": {
    labelRu: "Домены и DNS",
    labelUz: "Domenlar va DNS",
    labelEn: "Domains & DNS",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/notifications": {
    labelRu: "Уведомления и SMS",
    labelUz: "Bildirishnomalar",
    labelEn: "Notifications",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/settings/languages": {
    labelRu: "Языки (UZ / RU / EN)",
    labelUz: "Tillar (UZ / RU / EN)",
    labelEn: "Languages",
    parentPath: "/settings",
    parentLabelRu: "настройкам магазина",
    parentLabelUz: "do'kon sozlamalariga",
    parentLabelEn: "store settings",
  },
  "/markets": {
    labelRu: "Рынки и регионы продаж",
    labelUz: "Bozorlar va hududlar",
    labelEn: "Markets",
    parentPath: "/",
    parentLabelRu: "Панель управления",
    parentLabelUz: "Boshqaruv paneli",
    parentLabelEn: "Dashboard",
  },
};


export const PageBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, store } = useAuth();

  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/" || pathname === "/orders" || pathname === "/products" || pathname === "/categories" || pathname.startsWith("/settings")) {
    return null;
  }

  const pick = (ru?: string, uz?: string, en?: string) => {
    if (lang === "ru") return ru || "";
    if (lang === "en") return en || ru || "";
    return uz || ru || "";
  };

  // Dynamic routes: /orders/:id, /integrations/:slug
  let currentLabel = "";
  let backToPath = "/";
  let backToLabel = pick("Панель управления", "Boshqaruv paneli", "Dashboard");
  const crumbs: { label: string; path?: string }[] = [
    {
      label: store?.name || "StoreBox",
      path: "/",
    },
  ];

  if (pathname.startsWith("/orders/")) {
    const orderId = pathname.split("/")[2];
    crumbs.push({
      label: pick("Заказы", "Buyurtmalar", "Orders"),
      path: "/orders",
    });
    currentLabel = pick(`Заказ #${orderId}`, `Buyurtma #${orderId}`, `Order #${orderId}`);
    crumbs.push({ label: currentLabel });
    backToPath = "/orders";
    backToLabel = pick("списку заказов", "buyurtmalar ro'yxatiga", "orders list");
  } else if (pathname.startsWith("/integrations/")) {
    const slug = pathname.split("/")[2];
    crumbs.push({
      label: pick("Маркет интеграций", "Integratsiyalar marketi", "Integrations Market"),
      path: "/robo-market",
    });
    currentLabel = slug.toUpperCase();
    crumbs.push({ label: currentLabel });
    backToPath = "/robo-market";
    backToLabel = pick("списку интеграций", "integratsiyalar ro'yxatiga", "integrations list");
  } else {
    const meta = ROUTE_META[pathname];
    if (meta) {
      if (meta.parentPath && meta.parentPath !== "/") {
        const parentMeta = ROUTE_META[meta.parentPath];
        if (parentMeta) {
          crumbs.push({
            label: pick(parentMeta.labelRu, parentMeta.labelUz, parentMeta.labelEn),
            path: meta.parentPath,
          });
        }
      }
      currentLabel = pick(meta.labelRu, meta.labelUz, meta.labelEn);
      crumbs.push({ label: currentLabel });
      backToPath = meta.parentPath || "/";
      backToLabel = pick(
        meta.parentLabelRu || "Панель управления",
        meta.parentLabelUz || "Boshqaruv paneli",
        meta.parentLabelEn || "Dashboard"
      );
    } else {
      const seg = pathname.split("/").filter(Boolean).pop() || "";
      currentLabel = seg.charAt(0).toUpperCase() + seg.slice(1);
      crumbs.push({ label: currentLabel });
    }
  }

  return (
    <div
      data-testid="shopify-breadcrumbs-bar"
      className="mb-4 pb-3 border-b border-[#e1e3e5] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
    >
      {/* Left: Shopify Back Button */}
      <button
        type="button"
        onClick={() => navigate(backToPath)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-white dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800 hover:bg-[#f6f6f7] dark:hover:bg-zinc-800 text-xs font-medium text-[#202223] dark:text-zinc-200 shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#5c5f62] dark:text-zinc-400" />
        <span>
          {lang === "ru"
            ? `Назад к ${backToLabel}`
            : lang === "en"
            ? `Back to ${backToLabel}`
            : `Orqaga: ${backToLabel}`}
        </span>
      </button>

      {/* Right: Dynamic Breadcrumbs Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#6d7175] dark:text-zinc-400 overflow-x-auto no-scrollbar">
        <Link
          to="/"
          className="inline-flex items-center gap-1 hover:text-[#202223] dark:hover:text-white transition-colors shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
        </Link>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />
              {crumb.path && !isLast ? (
                <Link
                  to={crumb.path}
                  className="hover:text-[#202223] dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-[#202223] dark:text-zinc-100 whitespace-nowrap">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
