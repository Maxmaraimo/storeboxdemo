import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgePercent,
  Check,
  Zap,
  Clock,
  AlertTriangle,
  Wallet,
  Building2,
  CreditCard,
  Sparkles,
  X,
  CheckCircle2,
  RefreshCw,
  Phone,
  HelpCircle,
  Search,
  Receipt,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { SettingsLayout } from "./SettingsLayout";

interface StoreBillingInfo {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  plan_display: string;
  expires_at: string;
  expires_at_iso: string | null;
  days_left: number;
  is_expired: boolean;
  is_active: boolean;
  balance: number;
  trial_days_left: number;
}

interface PlanTier {
  code: string;
  name: string;
  monthly_price: number;
  daily_rate: number;
  period_label: string;
  desc?: string;
  features: string[];
  recommended?: boolean;
  current?: boolean;
}

interface PendingRequest {
  id: number;
  plan: string;
  plan_display: string;
  amount: number;
  days: number;
  payment_method: string;
  created_at: string;
}

export interface BillingHistoryItem {
  id: number;
  plan: string;
  plan_display: string;
  period_months: number;
  days: number;
  amount: number;
  payment_method: string;
  payment_method_display: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | string;
  status_display: string;
  created_at: string;
  created_at_iso?: string;
}

interface TariffsPageProps {
  initialTab?: "plans" | "history";
}

const featMap: Record<string, Record<string, string>> = {
  "Katalogda 1 000 tagacha mahsulot": { ru: "До 1 000 товаров в каталоге", uz: "Katalogda 1 000 tagacha mahsulot", en: "Up to 1,000 products" },
  "Telegram WebApp bot-do'kon": { ru: "Telegram WebApp магазин-бот", uz: "Telegram WebApp bot-do'kon", en: "Telegram WebApp store" },
  "Shaxsiy domenni ulash": { ru: "Подключение своего домена", uz: "Shaxsiy domenni ulash", en: "Custom domain connection" },
  "Marketing: promokodlar va xabarnomalar": { ru: "Маркетинг: промокоды и уведомления", uz: "Marketing: promokodlar va xabarnomalar", en: "Marketing: promo codes & notifications" },
  "AI-dizayn va mavzular": { ru: "AI-дизайн и темы оформления", uz: "AI-dizayn va mavzular", en: "AI-design and themes" },
  "Ishchi guruh bilan sinxronizatsiya": { ru: "Синхронизация с рабочей группой", uz: "Ishchi guruh bilan sinxronizatsiya", en: "Sync with work team" },
  "Cheksiz mahsulotlar soni": { ru: "Неограниченное количество товаров", uz: "Cheksiz mahsulotlar soni", en: "Unlimited products" },
  "POS kassa bilan integratsiya": { ru: "Интеграция с POS-кассой", uz: "POS kassa bilan integratsiya", en: "POS integration" },
  "Kengaytirilgan analitika va hisobotlar": { ru: "Расширенная аналитика и отчеты", uz: "Kengaytirilgan analitika va hisobotlar", en: "Advanced analytics & reports" },
  "Shaxsiy menejer va 24/7 yordam": { ru: "Персональный менеджер и поддержка 24/7", uz: "Shaxsiy menejer va 24/7 yordam", en: "Dedicated manager & 24/7 support" },
  "Maxsus integratsiyalar va API": { ru: "Специальные интеграции и API", uz: "Maxsus integratsiyalar va API", en: "Custom integrations & API" },
  "Maksimal server tezligi va SLA": { ru: "Максимальная скорость и SLA", uz: "Maksimal server tezligi va SLA", en: "Max server speed & SLA" },
};

export const TariffsPage: React.FC<TariffsPageProps> = ({ initialTab = "plans" }) => {
  const { t, lang } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"plans" | "history">(() => {
    if (location.pathname.includes("/history") || initialTab === "history") {
      return "history";
    }
    return "plans";
  });
  const [subView, setSubView] = useState<"overview" | "select_plan">("overview");

  useEffect(() => {
    if (location.pathname.includes("/history")) {
      setActiveTab("history");
    } else {
      setActiveTab("plans");
    }
  }, [location.pathname]);

  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<StoreBillingInfo | null>(null);
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  const [duration, setDuration] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("BALANCE");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTariffInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get("/billing/tariff-info/");
      setStoreInfo(res.data.store);
      setPlans(res.data.plans || []);
      setPendingRequest(res.data.pending_request || null);
      setBillingHistory(res.data.billing_history || []);
    } catch (err) {
      console.error("Tariff info fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffInfo();
  }, []);

  const handleTabChange = (tab: "plans" | "history") => {
    setActiveTab(tab);
    if (tab === "history") {
      navigate("/settings/tariffs/history");
    } else {
      navigate("/settings/tariffs");
    }
  };

  const calculateDiscountedPrice = (monthlyPrice: number, months: number) => {
    const raw = monthlyPrice * months;
    if (months === 6) return Math.round(raw * 0.9);
    if (months === 12) return Math.round(raw * 0.8);
    return raw;
  };

  const calculateDiscountPercent = (months: number) => {
    if (months === 6) return 10;
    if (months === 12) return 20;
    return 0;
  };

  const handleOpenModal = (plan: PlanTier) => {
    setSelectedPlan(plan);
    setFeedbackMessage(null);
    setPaymentMethod(storeInfo && storeInfo.balance >= calculateDiscountedPrice(plan.monthly_price, duration) ? "BALANCE" : "CLICK");
    setContactPhone("");
    setNotes("");
  };

  const handleCloseModal = () => {
    setSelectedPlan(null);
    setFeedbackMessage(null);
  };

  const handleSubmitTariffRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await api.post("/billing/tariff-request/", {
        plan: selectedPlan.code,
        months: duration,
        payment_method: paymentMethod,
        contact_phone: contactPhone,
        notes: notes,
      });

      if (res.data.auto_activated) {
        setFeedbackMessage({
          type: "success",
          text: res.data.message || "Tarif muvaffaqiyatli faollashtirildi!",
        });
        await fetchTariffInfo();
        setTimeout(() => {
          handleCloseModal();
        }, 2200);
      } else {
        setFeedbackMessage({
          type: "success",
          text: res.data.message || "Arizangiz qabul qilindi!",
        });
        await fetchTariffInfo();
        setTimeout(() => {
          handleCloseModal();
        }, 2500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.";
      setFeedbackMessage({ type: "error", text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysLeft = storeInfo?.days_left ?? 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
  const isExpired = storeInfo?.is_expired || daysLeft <= 0;

  const filteredHistory = billingHistory.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.plan_display && item.plan_display.toLowerCase().includes(q)) ||
      (item.plan && item.plan.toLowerCase().includes(q)) ||
      (item.payment_method_display && item.payment_method_display.toLowerCase().includes(q)) ||
      (item.status_display && item.status_display.toLowerCase().includes(q)) ||
      (item.created_at && item.created_at.toLowerCase().includes(q)) ||
      String(item.amount).includes(q) ||
      String(item.id).includes(q)
    );
  });

  return (
    <SettingsLayout>
      <div className="space-y-6">

        {/* 2. SHOPIFY PLAN OVERVIEW MODE */}
        {activeTab === "plans" && subView === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {lang === "ru" ? "План" : lang === "en" ? "Plan" : "Reja"}
                </h1>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  {lang === "ru"
                    ? "Сведения о вашем тарифном плане и выставлении счетов"
                    : "Do'kon tarif rejasi va to'lov hisob-kitoblari"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubView("select_plan")}
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-zinc-800 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                >
                  {lang === "ru" ? "Изменить тарифный план" : "Tarifni o'zgartirish"}
                </button>
              </div>
            </div>

            {/* Plan Details Card (Shopify Style) */}
            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 dark:border-zinc-800 gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    {lang === "ru" ? "Сведения о плане" : "Reja tafsilotlari"}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {storeInfo?.plan_display || "StoreBox Start"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {storeInfo?.trial_days_left && storeInfo.trial_days_left > 0
                        ? (lang === "ru" ? "Пробный период" : "Sinov davri")
                        : (lang === "ru" ? "Активен" : "Faol")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {daysLeft > 0
                      ? (lang === "ru" ? `Осталось дней: ${daysLeft}` : `${daysLeft} kun qoldi`)
                      : (lang === "ru" ? "Срок действия истёк" : "Muddati tugagan")}
                    {" • "}
                    {lang === "ru" ? "Действует до:" : "Amal qiladi:"}{" "}
                    <span className="font-medium text-slate-700 dark:text-zinc-300">
                      {storeInfo?.expires_at || (lang === "ru" ? "Бессрочно" : "Cheksiz")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSubView("select_plan")}
                  className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  {lang === "ru" ? "Выбрать план" : "Rejani tanlash"}
                </button>
              </div>

              {/* Status Alert if expired/expiring */}
              {isExpired && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {lang === "ru"
                      ? "Срок действия вашего плана истёк. Выберите новый тарифный план для продолжения работы."
                      : "Obuna muddati tugagan. Davom etish uchun yangi tarifni tanlang."}
                  </span>
                </div>
              )}

              {/* Billing Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    {lang === "ru" ? "Баланс аккаунта" : "Do'kon balansi"}
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {storeInfo ? storeInfo.balance.toLocaleString() : "0"} <span className="text-xs font-normal text-slate-500">UZS</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    {lang === "ru" ? "Способ оплаты" : "To'lov usuli"}
                  </div>
                  <div className="text-xs font-medium text-slate-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Multicard / Click Up</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                  <div className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                    {lang === "ru" ? "История платежей" : "To'lovlar tarixi"}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("history")}
                    className="text-xs font-medium text-blue-600 hover:underline mt-1 block text-left cursor-pointer"
                  >
                    {billingHistory.length > 0
                      ? (lang === "ru" ? `Посмотреть транзакции (${billingHistory.length})` : `Tranzaksiyalarni ko'rish (${billingHistory.length})`)
                      : (lang === "ru" ? "История транзакций" : "Tarix")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SHOPIFY FRAME 13 PLAN SELECTION VIEW */}
        {activeTab === "plans" && subView === "select_plan" && (
          <div className="space-y-6">
            {/* Top Back Link */}
            <button
              type="button"
              onClick={() => setSubView("overview")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "ru" ? "План / Изменить тарифный план" : "Reja / Tarifni o'zgartirish"}</span>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {lang === "ru" ? "Изменить тарифный план" : "Tarif rejasini o'zgartirish"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                {lang === "ru"
                  ? "Выберите план, который лучше всего подходит для вашего бизнеса"
                  : "Biznesingiz uchun eng mos keluvchi tarif rejasini tanlang"}
              </p>
            </div>

            {/* Duration Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-medium w-fit border border-slate-200/70 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDuration(1)}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  duration === 1
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lang === "ru" ? "Оплата раз в месяц" : "Oylik to'lov"}
              </button>
              <button
                type="button"
                onClick={() => setDuration(12)}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  duration === 12
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{lang === "ru" ? "Оплата раз в год" : "Yillik to'lov"}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                  {lang === "ru" ? "скидка 20%" : "20% chegirma"}
                </span>
              </button>
            </div>

            {/* Plan Cards Grid (Shopify Frame 13) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {plans.map((p) => {
                const isBasic = p.code === "START";
                const isShopify = p.code === "STANDARD";
                const isAdvanced = p.code === "PRO" || p.code === "ENTERPRISE";

                const displayTitle = isBasic ? "Basic" : isShopify ? "Shopify" : "Advanced";
                const displaySubtitle = isBasic
                  ? (lang === "ru" ? "Идеально подходит для индивидуальных предпринимателей" : "Yakka tadbirkorlar va startaplar uchun")
                  : isShopify
                  ? (lang === "ru" ? "Для растущего бизнеса и небольших команд" : "Kengayayotgan biznes va jamoalar uchun")
                  : (lang === "ru" ? "Для зрелого бизнеса с масштабированием" : "Katta tarmoqlar va distribyutorlar uchun");

                const btnLabel = isBasic
                  ? (lang === "ru" ? "Попробовать Basic" : "Basic sinab ko'rish")
                  : isShopify
                  ? (lang === "ru" ? "Попробовать Shopify" : "Shopify sinab ko'rish")
                  : (lang === "ru" ? "Попробовать Advanced" : "Advanced tanlash");

                const totalPrice = calculateDiscountedPrice(p.monthly_price, duration);

                return (
                  <div
                    key={p.code}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between p-6 relative hover:shadow-md ${
                      isShopify
                        ? "border-2 border-slate-900 dark:border-white shadow-sm ring-1 ring-slate-900/10"
                        : "border-slate-200 dark:border-zinc-800 shadow-2xs"
                    }`}
                  >
                    <div>
                      {/* Frame 13: Green pill promo badge */}
                      {(isBasic || isShopify) && (
                        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider mb-3">
                          {lang === "ru" ? "3-месячный пробный период за $1" : "3 oylik maxsus sinov davri"}
                        </div>
                      )}

                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {displayTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        {displaySubtitle}
                      </p>

                      {/* Frame 13 Price Layout */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        {duration === 1 ? (
                          isBasic ? (
                            <div>
                              <div className="text-xs text-slate-400 line-through">490 000 UZS / мес</div>
                              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                12 000 UZS <span className="text-xs font-normal text-slate-500">/ мес</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                                {lang === "ru" ? "в течение первых 3 месяцев, затем 490 000 UZS/мес" : "dastlabki 3 oyda, so'ngra 490 000 UZS/oy"}
                              </div>
                            </div>
                          ) : isShopify ? (
                            <div>
                              <div className="text-xs text-slate-400 line-through">1 200 000 UZS / мес</div>
                              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                12 000 UZS <span className="text-xs font-normal text-slate-500">/ мес</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                                {lang === "ru" ? "в течение первых 3 месяцев, затем 1 200 000 UZS/мес" : "dastlabki 3 oyda, so'ngra 1 200 000 UZS/oy"}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                4 900 000 UZS <span className="text-xs font-normal text-slate-500">/ мес</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                                {lang === "ru" ? "оплата раз в месяц" : "oylik to'lov"}
                              </div>
                            </div>
                          )
                        ) : (
                          <div>
                            <div className="text-xs text-slate-400 line-through">
                              {p.monthly_price.toLocaleString()} UZS / мес
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                              {Math.round(totalPrice / 12).toLocaleString()} UZS <span className="text-xs font-normal text-slate-500">/ мес</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 font-medium">
                              {lang === "ru"
                                ? `при оплате за год (${totalPrice.toLocaleString()} UZS)`
                                : `yillik to'lovda (${totalPrice.toLocaleString()} UZS)`}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Solid Black Rounded Button (Shopify Frame 13) */}
                      <button
                        type="button"
                        onClick={() => handleOpenModal(p)}
                        className="w-full py-2.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold shadow-xs transition-all cursor-pointer mt-5 active:scale-98"
                      >
                        {btnLabel}
                      </button>

                      {/* Features List */}
                      <div className="border-t border-slate-100 dark:border-zinc-800 pt-5 mt-5">
                        <div className="text-[11px] font-semibold text-slate-900 dark:text-white mb-2.5">
                          {lang === "ru" ? "Что входит в тариф:" : "Tarif imkoniyatlari:"}
                        </div>
                        <ul className="space-y-2">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300 font-normal">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{featMap[f]?.[lang] || f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. BILLING HISTORY VIEW */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleTabChange("plans")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === "ru" ? "Назад к плану" : "Rejaga qaytish"}</span>
            </button>

            {/* Top Controls: Search & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161b26] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={
                  lang === "ru"
                    ? "Поиск по тарифу, сумме или способу оплаты..."
                    : lang === "en"
                    ? "Search by plan, amount or payment method..."
                    : "Tarif, summa yoki to'lov turi bo'yicha qidirish..."
                }
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-medium text-slate-500">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>
                {lang === "ru"
                  ? `Всего записей: ${filteredHistory.length}`
                  : lang === "en"
                  ? `Total transactions: ${filteredHistory.length}`
                  : `Jami operatsiyalar: ${filteredHistory.length}`}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">ID / {lang === "ru" ? "Дата" : lang === "en" ? "Date" : "Sana"}</th>
                    <th className="py-3 px-4">{lang === "ru" ? "Тарифный план" : lang === "en" ? "Pricing Plan" : "Tarif rejasi"}</th>
                    <th className="py-3 px-4">{lang === "ru" ? "Срок действия" : lang === "en" ? "Period" : "Muddati"}</th>
                    <th className="py-3 px-4">{lang === "ru" ? "Способ оплаты" : lang === "en" ? "Payment Method" : "To'lov turi"}</th>
                    <th className="py-3 px-4">{lang === "ru" ? "Сумма" : lang === "en" ? "Amount" : "Summa"}</th>
                    <th className="py-3 px-4 text-right">{lang === "ru" ? "Статус" : lang === "en" ? "Status" : "Holati"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-700">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-35" />
                        <div className="font-medium">
                          {lang === "ru"
                            ? "История платежей пуста"
                            : lang === "en"
                            ? "No billing transactions found"
                            : "To'lovlar tarixi topilmadi"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">#{item.id}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{item.created_at}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                              item.plan === "PRO" || item.plan === "ENTERPRISE"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : item.plan === "STANDARD"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            {item.plan_display || item.plan}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.period_months || Math.round(item.days / 30) || 1}{" "}
                            {lang === "ru" ? "мес." : lang === "en" ? "mo." : "oy"}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1">({item.days} kun)</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            {item.payment_method_display || item.payment_method}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.amount.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 ml-1">UZS</span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              item.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40"
                                : item.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40 animate-pulse"
                            }`}
                          >
                            {item.status === "APPROVED" ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ) : item.status === "REJECTED" ? (
                              <X className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            )}
                            {item.status === "APPROVED"
                              ? (lang === "ru" ? "Одобрено" : lang === "en" ? "Approved" : "Faollashtirilgan")
                              : item.status === "REJECTED"
                              ? (lang === "ru" ? "Отклонено" : lang === "en" ? "Rejected" : "Bekor qilingan")
                              : (lang === "ru" ? "В ожидании" : lang === "en" ? "Pending" : "Ko'rib chiqilmoqda")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE / PAYMENT MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-zinc-900" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900">
                  {lang === "ru" ? "Активация тарифа" : lang === "en" ? "Activate Plan" : "Tarifni faollashtirish"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan Calculation Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{lang === "ru" ? "Выбранный тариф:" : "Tanlangan reja:"}</span>
                <span className="font-semibold text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{lang === "ru" ? "Срок действия:" : "Amal qilish davri:"}</span>
                <span className="font-semibold text-slate-800">
                  {duration} {lang === "ru" ? "мес." : "oy"} ({duration * 30} {lang === "ru" ? "дней" : "kun"})
                  {calculateDiscountPercent(duration) > 0 && (
                    <span className="ml-1 text-emerald-600 font-semibold">(-{calculateDiscountPercent(duration)}%)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-xs font-semibold">
                <span className="text-slate-800">{lang === "ru" ? "Итого к оплате:" : "Jami to'lov:"}</span>
                <span className="text-slate-900 font-bold text-sm">
                  {calculateDiscountedPrice(selectedPlan.monthly_price, duration).toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Feedback Alert */}
            {feedbackMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2.5 ${
                  feedbackMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedbackMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitTariffRequest} className="space-y-3.5 text-xs">
              {/* Payment Methods */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  {lang === "ru" ? "Выберите способ оплаты:" : "To'lov usulini tanlang:"}
                </label>
                <div className="space-y-1.5">
                  {/* Balance Option */}
                  <label
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "BALANCE"
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment_method"
                        value="BALANCE"
                        checked={paymentMethod === "BALANCE"}
                        onChange={() => setPaymentMethod("BALANCE")}
                        className="text-zinc-900 focus:ring-zinc-900"
                      />
                      <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {lang === "ru" ? "Баланс магазина" : "Do'kon balansi"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {lang === "ru" ? "Мгновенное списание" : "Mablag' balansdan bir zumda yechiladi"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-800">
                        {storeInfo?.balance.toLocaleString()} UZS
                      </span>
                      {storeInfo && storeInfo.balance < calculateDiscountedPrice(selectedPlan.monthly_price, duration) && (
                        <div className="text-[10px] font-semibold text-rose-600">
                          {lang === "ru" ? "Недостаточно средств" : "Mablag' yetarli emas"}
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Click */}
                  <label
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "CLICK"
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment_method"
                        value="CLICK"
                        checked={paymentMethod === "CLICK"}
                        onChange={() => setPaymentMethod("CLICK")}
                        className="text-zinc-900 focus:ring-zinc-900"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {lang === "ru" ? "Оплата через Click" : "Click orqali to'lov"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {lang === "ru" ? "Формирование счёта на оплату" : "Ariza yuboriladi va hisob taqdim etiladi"}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold font-mono text-[10px]">
                      CLICK
                    </span>
                  </label>

                  {/* Payme */}
                  <label
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "PAYME"
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment_method"
                        value="PAYME"
                        checked={paymentMethod === "PAYME"}
                        onChange={() => setPaymentMethod("PAYME")}
                        className="text-zinc-900 focus:ring-zinc-900"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {lang === "ru" ? "Оплата через Payme" : "Payme orqali to'lov"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {lang === "ru" ? "Через приложение Payme" : "Payme ilovasi yoki karta orqali"}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold font-mono text-[10px]">
                      PAYME
                    </span>
                  </label>

                  {/* Bank Transfer (Yuridik shaxs) */}
                  <label
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "BANK_TRANSFER"
                        ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment_method"
                        value="BANK_TRANSFER"
                        checked={paymentMethod === "BANK_TRANSFER"}
                        onChange={() => setPaymentMethod("BANK_TRANSFER")}
                        className="text-zinc-900 focus:ring-zinc-900"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {lang === "ru" ? "Банковский перевод (Юр. лица)" : "Bank orqali o'tkazma (Yuridik shaxs)"}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {lang === "ru" ? "Договор и электронный счет-фактура" : "Schyot-faktura va shartnoma taqdim etiladi"}
                        </div>
                      </div>
                    </div>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </label>
                </div>
              </div>

              {/* Contact Phone & Notes */}
              <div className="space-y-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {lang === "ru" ? "Контактный номер телефона:" : "Bog'lanish uchun telefon raqam:"}
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-zinc-900 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {lang === "ru" ? "Примечание / Реквизиты (необязательно):" : "Izoh yoki rekvizitlar (ixtiyoriy):"}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={lang === "ru" ? "Название компании, ИНН..." : "Kompaniya nomi, STIR (INN)..."}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-zinc-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  {lang === "ru" ? "Отмена" : "Bekor qilish"}
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (paymentMethod === "BALANCE" &&
                      (storeInfo?.balance ?? 0) <
                        calculateDiscountedPrice(selectedPlan.monthly_price, duration))
                  }
                  className="px-4 py-2 rounded-lg bg-[#18181B] hover:bg-zinc-800 disabled:opacity-50 text-white font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <span>{lang === "ru" ? "Обработка..." : "Bajarilmoqda..."}</span>
                  ) : paymentMethod === "BALANCE" ? (
                    <span>{lang === "ru" ? "Оплатить с баланса" : "Balansdan to'lash va faollashtirish"}</span>
                  ) : (
                    <span>{lang === "ru" ? "Отправить заявку" : "Arizani yuborish"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </SettingsLayout>
);
};
