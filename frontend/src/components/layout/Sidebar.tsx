import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  MessageSquare,
  Package,
  Megaphone,
  Share2,
  CreditCard,
  Truck,
  MapPin,
  UserCheck,
  BadgePercent,
  Store as StoreIcon,
  Settings,
  ChevronDown,
  ExternalLink,
  QrCode,
  Sparkles,
  Database
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { store, stores, switchStore, t } = useAuth();
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(true);
  const [storeSelectOpen, setStoreSelectOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
      active
        ? "bg-brand text-white shadow-xs font-black"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
    }`;

  const subItemClass = (active: boolean) =>
    `block py-1.5 px-3 rounded-xl text-[11px] font-bold transition-colors ${
      active ? "text-brand bg-emerald-50/80 font-black" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 shrink-0 hidden lg:flex flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto">
      <div className="space-y-4">
        {/* LOGO */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white font-black text-base shadow-xs group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-slate-900 leading-none">
                Store<span className="text-brand">Box</span>
              </div>
              <div className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">PLATFORM 2.0</div>
            </div>
          </Link>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            PRO
          </span>
        </div>

        {/* STORE SWITCHER */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStoreSelectOpen(!storeSelectOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {store?.name?.charAt(0) || "S"}
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-slate-900 truncate">{store?.name || "StoreBox"}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{store?.subdomain}.storebox.uz</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {storeSelectOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 space-y-1">
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    switchStore(s.id);
                    setStoreSelectOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-colors ${
                    s.id === store?.id ? "bg-emerald-50 text-brand" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  {s.id === store?.id && <span className="text-[10px] font-mono">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 14-SECTION NAVIGATION */}
        <nav className="space-y-1">
          {/* 1. Dashboard */}
          <Link to="/" className={navItemClass(isActive("/"))}>
            <LayoutDashboard className="w-4 h-4" />
            <span>{t("dashboard")}</span>
          </Link>

          {/* 2. Orders */}
          <Link to="/orders" className={navItemClass(isActive("/orders"))}>
            <ShoppingCart className="w-4 h-4" />
            <span className="flex-1">{t("orders")}</span>
          </Link>

          {/* 3. Customers */}
          <Link to="/customers" className={navItemClass(isActive("/customers"))}>
            <Users className="w-4 h-4" />
            <span>{t("customers")}</span>
          </Link>

          {/* 4. Chat */}
          <Link to="/chats" className={navItemClass(isActive("/chats"))}>
            <MessageSquare className="w-4 h-4" />
            <span>{t("chat")}</span>
          </Link>

          {/* 5. Products (Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setCatalogOpen(!catalogOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>{t("products")}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catalogOpen ? "rotate-180" : ""}`} />
            </button>
            {catalogOpen && (
              <div className="pl-7 space-y-1 pt-1">
                <Link to="/categories" className={subItemClass(isActive("/categories"))}>
                  {t("categories")}
                </Link>
                <Link to="/products" className={subItemClass(isActive("/products"))}>
                  {t("all_products")}
                </Link>
                <Link to="/discounts" className={subItemClass(isActive("/discounts"))}>
                  {t("discounts")}
                </Link>
                <Link to="/ikpu" className={subItemClass(isActive("/ikpu"))}>
                  {t("ikpu")}
                </Link>
                <Link to="/warehouse" className={subItemClass(isActive("/warehouse"))}>
                  {t("warehouse")}
                </Link>
              </div>
            )}
          </div>

          {/* 6. Marketing (Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setMarketingOpen(!marketingOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4" />
                <span>{t("marketing")}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${marketingOpen ? "rotate-180" : ""}`} />
            </button>
            {marketingOpen && (
              <div className="pl-7 space-y-1 pt-1">
                <Link to="/marketing" className={subItemClass(isActive("/marketing"))}>
                  {t("broadcast")}
                </Link>
                <Link to="/marketing?tab=promokod" className={subItemClass(location.search.includes("promokod"))}>
                  {t("promocodes")}
                </Link>
                <Link to="/marketing?tab=banner" className={subItemClass(location.search.includes("banner"))}>
                  {t("banner")}
                </Link>
              </div>
            )}
          </div>

          {/* 7. Platforms (Accordion) */}
          <div>
            <button
              type="button"
              onClick={() => setPlatformsOpen(!platformsOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-4 h-4" />
                <span>{t("platforms")}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${platformsOpen ? "rotate-180" : ""}`} />
            </button>
            {platformsOpen && (
              <div className="pl-7 space-y-1 pt-1">
                <Link to="/platforms" className={subItemClass(isActive("/platforms") && !isActive("/platforms/qr"))}>
                  {t("telegram_bot")}
                </Link>
                <Link to="/design" className={`${subItemClass(isActive("/design"))} flex items-center justify-between`}>
                  <span>Dizayn & AI</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">AI</span>
                </Link>
                <Link to="/platforms/qr" className={`${subItemClass(isActive("/platforms/qr"))} flex items-center justify-between`}>
                  <span>{t("qr_catalog")}</span>
                  <QrCode className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link to="/yespos" className={`${subItemClass(isActive("/yespos"))} flex items-center justify-between`}>
                  <span>{t("yespos_import")}</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">POS</span>
                </Link>
              </div>
            )}
          </div>

          {/* 8. Payments */}
          <Link to="/settings/payments" className={navItemClass(isActive("/settings/payments"))}>
            <CreditCard className="w-4 h-4" />
            <span>{t("payment_methods")}</span>
          </Link>

          {/* 9. Delivery */}
          <Link to="/settings/delivery" className={navItemClass(isActive("/settings/delivery"))}>
            <Truck className="w-4 h-4" />
            <span>{t("delivery")}</span>
          </Link>

          {/* 10. Branches */}
          <Link to="/settings/branches" className={navItemClass(isActive("/settings/branches"))}>
            <MapPin className="w-4 h-4" />
            <span>{t("branches")}</span>
          </Link>

          {/* 11. Staff */}
          <Link to="/settings/staff" className={navItemClass(isActive("/settings/staff"))}>
            <UserCheck className="w-4 h-4" />
            <span>{t("staff")}</span>
          </Link>

          {/* 12. Tariffs */}
          <Link to="/settings/tariffs" className={navItemClass(isActive("/settings/tariffs"))}>
            <BadgePercent className="w-4 h-4" />
            <span>{t("tariffs")}</span>
          </Link>

          {/* 13. StoreBox Market */}
          <Link to="/robo-market" className={navItemClass(isActive("/robo-market"))}>
            <StoreIcon className="w-4 h-4" />
            <span>{t("storebox_market")}</span>
          </Link>

          {/* 14. Settings */}
          <Link to="/settings" className={navItemClass(isActive("/settings") && !isActive("/settings/"))}>
            <Settings className="w-4 h-4" />
            <span>{t("settings")}</span>
          </Link>
        </nav>
      </div>

      {/* FOOTER STORE LINK */}
      {store?.subdomain && (
        <a
          href={`/store/${store.subdomain}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between group hover:bg-emerald-100/60 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <StoreIcon className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-slate-800 truncate">{t("view_site")}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand transition-colors shrink-0" />
        </a>
      )}
    </aside>
  );
};
