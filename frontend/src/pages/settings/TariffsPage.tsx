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
  Search,
  Receipt,
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
  "Katalogda 1 000 tagacha mahsulot": {
    ru: "До 1 000 товаров в каталоге",
    uz: "Katalogda 1 000 tagacha mahsulot",
    en: "Up to 1,000 products in catalog",
  },
  "Telegram WebApp bot-do'kon": {
    ru: "Telegram-бот + мобильная витрина",
    uz: "Telegram WebApp bot-do'kon",
    en: "Telegram bot + mobile storefront",
  },
  "Shaxsiy domenni ulash": {
    ru: "Подключение собственного домена",
    uz: "Shaxsiy domenni ulash",
    en: "Custom domain connection",
  },
  "Marketing: promokodlar va xabarnomalar": {
    ru: "Маркетинг: промокоды и рассылки",
    uz: "Marketing: promokodlar va xabarnomalar",
    en: "Marketing: promo codes & broadcasts",
  },
  "AI-dizayn va mavzular": {
    ru: "20 готовых тем витрины и AI-дизайн",
    uz: "20 ta tayyor vitrina mavzulari va AI-dizayn",
    en: "20 storefront themes & AI design",
  },
  "Ishchi guruh bilan sinxronizatsiya": {
    ru: "Приём оплаты: Click, Payme, Uzum, Наличные",
    uz: "To'lov qabul qilish: Click, Payme, Uzum, Naqd",
    en: "Accept payments: Click, Payme, Uzum, Cash",
  },
  "Cheksiz mahsulotlar soni": {
    ru: "Безлимитное количество товаров",
    uz: "Cheksiz mahsulotlar soni",
    en: "Unlimited products in catalog",
  },
  "POS kassa bilan integratsiya": {
    ru: "Облачная POS-касса и учёт склада",
    uz: "POS kassa va ombor hisobi",
    en: "Cloud POS terminal & inventory",
  },
  "Ijtimoiy tarmoq postlaridan import": {
    ru: "Импорт товаров из соцсетей и Excel",
    uz: "Ijtimoiy tarmoqlardan va Exceldan import",
    en: "Social media & Excel product import",
  },
  "Stollar uchun QR-menyu": {
    ru: "QR-меню для столов и быстрая доставка",
    uz: "Stollar uchun QR-menyu va yetkazib berish",
    en: "Table QR menu & fast delivery",
  },
  "Kengaytirilgan moliyaviy analitika": {
    ru: "Расширенная аналитика, ABC и когорты",
    uz: "Kengaytirilgan moliyaviy analitika va hisobotlar",
    en: "Advanced financial analytics & cohorts",
  },
  "5 nafargacha xodimlar jamoasi": {
    ru: "До 5 сотрудников и гибкие права доступа",
    uz: "5 nafargacha xodimlar jamoasi va ruxsatlar",
    en: "Up to 5 staff accounts & role permissions",
  },
  "Kengaytirilgan analitika va hisobotlar": {
    ru: "Расширенная аналитика и отчеты",
    uz: "Kengaytirilgan analitika va hisobotlar",
    en: "Advanced analytics & reports",
  },
  "Barcha funksiyalar to'liq cheksiz": {
    ru: "Все функции Standard + полный безлимит",
    uz: "Barcha funksiyalar to'liq cheksiz",
    en: "All Standard features + full unlimited",
  },
  "Ko'p filialli tarmoq boshqaruvi": {
    ru: "Мультифилиальность и сеть складов",
    uz: "Ko'p filialli tarmoq boshqaruvi",
    en: "Multi-branch & warehouse network management",
  },
  "API orqali maxsus integratsiyalar": {
    ru: "Открытый API, 1С, МойСклад и Webhook",
    uz: "API orqali maxsus integratsiyalar (1C, Webhook)",
    en: "Open API, ERP & custom Webhook integrations",
  },
  "Biriktirilgan shaxsiy menejer": {
    ru: "Выделенный персональный менеджер 24/7",
    uz: "Biriktirilgan shaxsiy menejer 24/7",
    en: "Dedicated personal account manager 24/7",
  },
  "SLA 99.9% va xodimlarni o'qitish": {
    ru: "Приоритетный SLA 99.9% и обучение команды",
    uz: "SLA 99.9% va xodimlarni o'qitish",
    en: "Priority 99.9% SLA & team onboarding",
  },
  "Shaxsiy menejer va 24/7 yordam": {
    ru: "Персональный менеджер и поддержка 24/7",
    uz: "Shaxsiy menejer va 24/7 yordam",
    en: "Dedicated manager & 24/7 support",
  },
  "Maxsus integratsiyalar va API": {
    ru: "Специальные интеграции и API",
    uz: "Maxsus integratsiyalar va API",
    en: "Custom integrations & API",
  },
  "Maksimal server tezligi va SLA": {
    ru: "Максимальная скорость и SLA",
    uz: "Maksimal server tezligi va SLA",
    en: "Max server speed & SLA",
  },
};

const formatLocalizedPlanDisplay = (planCode?: string, fallback?: string, lang: string = "ru") => {
  const code = (planCode || fallback || "START").toUpperCase();
  if (code.includes("PRO") || code.includes("ENTERPRISE")) {
    return "StoreBox Pro";
  }
  if (code.includes("STANDARD")) {
    return "StoreBox Standard";
  }
  if (code.includes("TRIAL")) {
    return lang === "ru" ? "StoreBox Start (Пробный)" : lang === "en" ? "StoreBox Start (Trial)" : "StoreBox Start (Sinov)";
  }
  return "StoreBox Start";
};

const formatLocalizedPaymentMethod = (methodCode?: string, fallback?: string, lang: string = "ru") => {
  const code = (methodCode || fallback || "").toUpperCase();
  if (code.includes("BALANCE")) {
    return lang === "ru" ? "Баланс магазина" : lang === "en" ? "Store Balance" : "Do'kon balansi";
  }
  if (code.includes("CLICK")) {
    return "Click Up";
  }
  if (code.includes("PAYME")) {
    return "Payme";
  }
  if (code.includes("BANK")) {
    return lang === "ru" ? "Банковский перевод" : lang === "en" ? "Bank Transfer" : "Bank o'tkazmasi";
  }
  if (code.includes("CASH")) {
    return lang === "ru" ? "Наличные" : lang === "en" ? "Cash" : "Naqd pul";
  }
  return fallback || methodCode || "Click / Payme";
};

const formatLocalizedExpiry = (expiresAt?: string, lang: string = "ru") => {
  if (!expiresAt || expiresAt === "Cheksiz" || expiresAt === "Бессрочно" || expiresAt === "Unlimited") {
    return lang === "ru" ? "Бессрочно" : lang === "en" ? "Unlimited" : "Cheksiz";
  }
  return expiresAt;
};

export const TariffsPage: React.FC<TariffsPageProps> = ({ initialTab = "plans" }) => {
  const { lang, store } = useAuth();
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
  }, [store?.id]);

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
    setPaymentMethod(
      storeInfo && storeInfo.balance >= calculateDiscountedPrice(plan.monthly_price, duration)
        ? "BALANCE"
        : "CLICK"
    );
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

      const defaultSuccessText = res.data.auto_activated
        ? lang === "ru"
          ? "Тариф успешно активирован!"
          : lang === "en"
          ? "Plan activated successfully!"
          : "Tarif muvaffaqiyatli faollashtirildi!"
        : lang === "ru"
        ? "Заявка на подключение тарифа принята!"
        : lang === "en"
        ? "Plan request submitted!"
        : "Arizangiz qabul qilindi!";

      setFeedbackMessage({
        type: "success",
        text: defaultSuccessText,
      });
      await fetchTariffInfo();
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        (lang === "ru"
          ? "Произошла ошибка. Пожалуйста, попробуйте снова."
          : lang === "en"
          ? "An error occurred. Please try again."
          : "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      setFeedbackMessage({ type: "error", text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysLeft = storeInfo?.days_left ?? 0;
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

  // Fallback plans if API hasn't responded yet
  const activePlans: PlanTier[] =
    plans.length > 0
      ? plans
      : [
          {
            code: "START",
            name: "Start",
            monthly_price: 199000,
            daily_rate: 6633,
            period_label: "oyiga",
            features: [
              "Katalogda 1 000 tagacha mahsulot",
              "Telegram WebApp bot-do'kon",
              "Shaxsiy domenni ulash",
              "Marketing: promokodlar va xabarnomalar",
              "AI-dizayn va mavzular",
              "Ishchi guruh bilan sinxronizatsiya",
            ],
            recommended: false,
            current: true,
          },
          {
            code: "STANDARD",
            name: "Standard",
            monthly_price: 399000,
            daily_rate: 13300,
            period_label: "oyiga",
            features: [
              "Cheksiz mahsulotlar soni",
              "POS kassa bilan integratsiya",
              "Ijtimoiy tarmoq postlaridan import",
              "Stollar uchun QR-menyu",
              "Kengaytirilgan moliyaviy analitika",
              "5 nafargacha xodimlar jamoasi",
            ],
            recommended: true,
            current: false,
          },
          {
            code: "PRO",
            name: "Pro",
            monthly_price: 799000,
            daily_rate: 26633,
            period_label: "oyiga",
            features: [
              "Barcha funksiyalar to'liq cheksiz",
              "Ko'p filialli tarmoq boshqaruvi",
              "API orqali maxsus integratsiyalar",
              "Biriktirilgan shaxsiy menejer",
              "SLA 99.9% va xodimlarni o'qitish",
            ],
            recommended: false,
            current: false,
          },
        ];

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* 1. PLAN OVERVIEW MODE */}
        {activeTab === "plans" && subView === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[#202223] dark:text-white tracking-tight">
                  {lang === "ru" ? "Тарифный план" : lang === "en" ? "Pricing Plan" : "Tarif rejasi"}
                </h1>
                <p className="text-xs text-[#6d7175] font-normal mt-0.5">
                  {lang === "ru"
                    ? "Сведения о вашем тарифном плане StoreBox, балансе и выставлении счетов"
                    : lang === "en"
                    ? "Manage your StoreBox subscription plan, balance, and billing history"
                    : "Do'kon tarif rejasi, balans va to'lov hisob-kitoblari"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange("history")}
                  className="px-3.5 py-2 rounded-lg bg-white border border-[#e1e3e5] text-[#202223] hover:bg-[#f6f6f7] text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  {lang === "ru" ? "История платежей" : lang === "en" ? "Billing History" : "To'lovlar tarixi"}
                </button>
                <button
                  type="button"
                  onClick={() => setSubView("select_plan")}
                  className="px-4 py-2 rounded-lg bg-[#00a86b] hover:bg-[#008f5b] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  {lang === "ru"
                    ? "Изменить тарифный план"
                    : lang === "en"
                    ? "Change Plan"
                    : "Tarifni o'zgartirish"}
                </button>
              </div>
            </div>

            {/* Plan Details Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#f1f2f3] dark:border-zinc-800 gap-4">
                <div>
                  <div className="text-[11px] text-[#6d7175] font-semibold uppercase tracking-wider">
                    {lang === "ru"
                      ? "Текущий тариф магазина"
                      : lang === "en"
                      ? "Current Store Plan"
                      : "Joriy do'kon tarifi"}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <h2 className="text-xl font-bold text-[#202223] dark:text-white">
                      {formatLocalizedPlanDisplay(storeInfo?.plan, storeInfo?.plan_display, lang)}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e3fcef] text-[#008060] border border-[#00a86b]/25">
                      {storeInfo?.trial_days_left && storeInfo.trial_days_left > 0
                        ? lang === "ru"
                          ? "Пробный период"
                          : lang === "en"
                          ? "Trial Period"
                          : "Sinov davri"
                        : lang === "ru"
                        ? "Активен"
                        : lang === "en"
                        ? "Active"
                        : "Faol"}
                    </span>
                  </div>
                  <div className="text-xs text-[#6d7175] mt-1.5">
                    {daysLeft > 0
                      ? lang === "ru"
                        ? `Осталось дней: ${daysLeft}`
                        : lang === "en"
                        ? `Days remaining: ${daysLeft}`
                        : `Qolgan kunlar: ${daysLeft}`
                      : lang === "ru"
                      ? "Срок действия истёк"
                      : lang === "en"
                      ? "Subscription expired"
                      : "Muddati tugagan"}
                    {" • "}
                    {lang === "ru"
                      ? "Действует до:"
                      : lang === "en"
                      ? "Valid until:"
                      : "Amal qiladi:"}{" "}
                    <span className="font-semibold text-[#202223] dark:text-zinc-300">
                      {formatLocalizedExpiry(storeInfo?.expires_at, lang)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSubView("select_plan")}
                  className="px-5 py-2.5 rounded-xl bg-[#202223] text-white hover:bg-[#303234] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                >
                  {lang === "ru" ? "Выбрать план" : lang === "en" ? "Select Plan" : "Rejani tanlash"}
                </button>
              </div>

              {/* Status Alert if expired */}
              {isExpired && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {lang === "ru"
                      ? "Срок действия вашего плана истёк. Выберите новый тарифный план для продолжения работы."
                      : lang === "en"
                      ? "Your subscription has expired. Please select a plan to continue."
                      : "Obuna muddati tugagan. Davom etish uchun yangi tarifni tanlang."}
                  </span>
                </div>
              )}

              {/* Pending Request Banner */}
              {pendingRequest && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {lang === "ru"
                        ? `Заявка на тариф ${formatLocalizedPlanDisplay(pendingRequest.plan, pendingRequest.plan_display, lang)} (${pendingRequest.amount.toLocaleString()} UZS) ожидает подтверждения.`
                        : lang === "en"
                        ? `Request for ${formatLocalizedPlanDisplay(pendingRequest.plan, pendingRequest.plan_display, lang)} (${pendingRequest.amount.toLocaleString()} UZS) is pending approval.`
                        : `${formatLocalizedPlanDisplay(pendingRequest.plan, pendingRequest.plan_display, lang)} (${pendingRequest.amount.toLocaleString()} UZS) uchun ariza ko'rib chiqilmoqda.`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 shrink-0">{pendingRequest.created_at}</span>
                </div>
              )}

              {/* Billing Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div className="p-4 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800">
                  <div className="text-[#6d7175] text-[11px] font-semibold uppercase tracking-wider">
                    {lang === "ru"
                      ? "Баланс магазина"
                      : lang === "en"
                      ? "Store Balance"
                      : "Do'kon balansi"}
                  </div>
                  <div className="text-base font-bold text-[#202223] dark:text-white mt-1">
                    {storeInfo ? storeInfo.balance.toLocaleString() : "0"}{" "}
                    <span className="text-xs font-normal text-[#6d7175]">UZS</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800">
                  <div className="text-[#6d7175] text-[11px] font-semibold uppercase tracking-wider">
                    {lang === "ru"
                      ? "Способы оплаты"
                      : lang === "en"
                      ? "Payment Methods"
                      : "To'lov usullari"}
                  </div>
                  <div className="text-xs font-semibold text-[#202223] dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#00a86b]" />
                    <span>Click Up / Payme / Uzum</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800">
                  <div className="text-[#6d7175] text-[11px] font-semibold uppercase tracking-wider">
                    {lang === "ru"
                      ? "История платежей"
                      : lang === "en"
                      ? "Billing History"
                      : "To'lovlar tarixi"}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("history")}
                    className="text-xs font-semibold text-[#005bd3] hover:underline mt-1 block text-left cursor-pointer"
                  >
                    {billingHistory.length > 0
                      ? lang === "ru"
                        ? `Посмотреть транзакции (${billingHistory.length})`
                        : lang === "en"
                        ? `View transactions (${billingHistory.length})`
                        : `Tranzaksiyalarni ko'rish (${billingHistory.length})`
                      : lang === "ru"
                      ? "Открыть историю транзакций"
                      : lang === "en"
                      ? "Open transaction history"
                      : "Tranzaksiyalar tarixini ochish"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. STOREBOX OFFICIAL PLAN SELECTION VIEW (Start / Standard / Pro) */}
        {activeTab === "plans" && subView === "select_plan" && (
          <div className="space-y-6">
            {/* Top Back Link */}
            <button
              type="button"
              onClick={() => setSubView("overview")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d7175] hover:text-[#202223] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>
                {lang === "ru"
                  ? "Назад к сведениям о плане"
                  : lang === "en"
                  ? "Back to plan overview"
                  : "Reja tafsilotlariga qaytish"}
              </span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e3fcef] text-[#008060] border border-[#00a86b]/20 mb-2">
                  <Sparkles className="w-3 h-3 text-[#00a86b]" />
                  {lang === "ru"
                    ? "Тарифы StoreBox"
                    : lang === "en"
                    ? "StoreBox Plans"
                    : "StoreBox Tariflari"}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#202223] dark:text-white tracking-tight">
                  {lang === "ru"
                    ? "Прозрачные тарифы для любого масштаба"
                    : lang === "en"
                    ? "Transparent pricing for every business stage"
                    : "Har qanday biznes ko'lami uchun shaffof tariflar"}
                </h1>
                <p className="text-xs text-[#6d7175] dark:text-slate-400 mt-1 font-normal">
                  {lang === "ru"
                    ? "Выберите период оплаты: при оплате на 6 месяцев скидка 10%, на 12 месяцев — скидка 20%"
                    : lang === "en"
                    ? "Save 10% with 6-month billing or 20% with annual billing"
                    : "6 oylik to'lovda 10%, yillik to'lovda esa 20% chegirmaga ega bo'ling"}
                </p>
              </div>

              {/* 3-Period Switcher (1 month | 6 months -10% | 12 months -20%) */}
              <div className="inline-flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl text-xs font-semibold border border-[#e1e3e5] dark:border-zinc-800 shadow-2xs self-start">
                <button
                  type="button"
                  onClick={() => setDuration(1)}
                  className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                    duration === 1
                      ? "bg-[#202223] text-white shadow-2xs font-bold"
                      : "text-[#6d7175] hover:text-[#202223] dark:hover:text-white"
                  }`}
                >
                  {lang === "ru" ? "1 месяц" : lang === "en" ? "1 month" : "1 oy"}
                </button>

                <button
                  type="button"
                  onClick={() => setDuration(6)}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    duration === 6
                      ? "bg-[#202223] text-white shadow-2xs font-bold"
                      : "text-[#6d7175] hover:text-[#202223] dark:hover:text-white"
                  }`}
                >
                  <span>{lang === "ru" ? "6 месяцев" : lang === "en" ? "6 months" : "6 oy"}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#e3fcef] text-[#008060] text-[10px] font-bold">
                    -10%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDuration(12)}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    duration === 12
                      ? "bg-[#202223] text-white shadow-2xs font-bold"
                      : "text-[#6d7175] hover:text-[#202223] dark:hover:text-white"
                  }`}
                >
                  <span>{lang === "ru" ? "12 месяцев" : lang === "en" ? "12 months" : "12 oy"}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#00a86b] text-white text-[10px] font-bold">
                    -20%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan Cards Grid (Start / Standard / Pro) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-stretch">
              {activePlans.map((p) => {
                const isStart = p.code === "START";
                const isStandard = p.code === "STANDARD";
                const isPro = p.code === "PRO" || p.code === "ENTERPRISE";
                const isCurrentPlan = storeInfo?.plan?.toUpperCase() === p.code;

                const displayTitle = isStart ? "Start" : isStandard ? "Standard" : "Pro";
                const displaySubtitle = isStart
                  ? lang === "ru"
                    ? "Для быстрого запуска онлайн-продаж"
                    : lang === "en"
                    ? "For a fast online sales launch"
                    : "Onlayn savdoni tez boshlash uchun"
                  : isStandard
                  ? lang === "ru"
                    ? "Оптимальный выбор для растущего бизнеса"
                    : lang === "en"
                    ? "Optimal choice for a growing business"
                    : "O'sib borayotgan biznes uchun optimal tanlov"
                  : lang === "ru"
                  ? "Для сетей, брендов и больших объёмов"
                  : lang === "en"
                  ? "For chains, brands, and high volume"
                  : "Tarmoqlar, brendlar va katta hajmlar uchun";

                const totalPrice = calculateDiscountedPrice(p.monthly_price, duration);
                const effectiveMonthly = Math.round(totalPrice / duration);
                const effectiveDaily = Math.round(effectiveMonthly / 30);
                const rawTotal = p.monthly_price * duration;
                const savedAmount = rawTotal - totalPrice;

                const btnLabel = isCurrentPlan
                  ? lang === "ru"
                    ? `Продлить ${displayTitle}`
                    : lang === "en"
                    ? `Renew ${displayTitle}`
                    : `${displayTitle} muddatini uzaytirish`
                  : lang === "ru"
                  ? `Выбрать ${displayTitle}`
                  : lang === "en"
                  ? `Choose ${displayTitle}`
                  : `${displayTitle} tanlash`;

                return (
                  <div
                    key={p.code}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-200 flex flex-col justify-between p-6 relative ${
                      isStandard
                        ? "border-2 border-[#00a86b] shadow-lg ring-4 ring-[#00a86b]/10"
                        : "border border-[#e1e3e5] dark:border-zinc-800 shadow-2xs hover:border-[#b5b9be]"
                    }`}
                  >
                    {/* Top Popular Badge on Standard */}
                    {isStandard && (
                      <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#00a86b] text-white uppercase tracking-wider shadow-xs">
                        {lang === "ru"
                          ? "Самый популярный"
                          : lang === "en"
                          ? "Most Popular"
                          : "Eng ommabop"}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-2xl font-extrabold text-[#202223] dark:text-white tracking-tight">
                          {displayTitle}
                        </h2>
                        {isCurrentPlan && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f2f3] text-[#202223] border border-[#e1e3e5]">
                            {lang === "ru" ? "Текущий план" : lang === "en" ? "Current Plan" : "Joriy tarif"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6d7175] mt-1 leading-snug">{displaySubtitle}</p>

                      {/* Official StoreBox Pricing Box */}
                      <div className="mt-5 pt-4 border-t border-[#f1f2f3] dark:border-zinc-800">
                        {duration > 1 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[#8c9196] line-through font-medium">
                              {p.monthly_price.toLocaleString()} UZS
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#e3fcef] text-[#008060] text-[10px] font-bold">
                              -{calculateDiscountPercent(duration)}%
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-[#202223] dark:text-white tracking-tight">
                            {effectiveMonthly.toLocaleString()}
                          </span>
                          <span className="text-xs font-medium text-[#6d7175]">
                            {lang === "ru" ? "сум / месяц" : lang === "en" ? "UZS / month" : "so'm / oy"}
                          </span>
                        </div>

                        {/* Daily rate pill */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e3fcef]/70 text-[#008060] text-xs font-bold">
                          <Zap className="w-3.5 h-3.5 text-[#00a86b]" />
                          <span>
                            {effectiveDaily.toLocaleString()}{" "}
                            {lang === "ru" ? "сум / день" : lang === "en" ? "UZS / day" : "so'm / kun"}
                          </span>
                        </div>

                        {/* Total for selected period */}
                        <div className="text-[11px] text-[#6d7175] mt-2 font-medium">
                          {lang === "ru"
                            ? `Итого (${duration} мес.): ${totalPrice.toLocaleString()} UZS`
                            : lang === "en"
                            ? `Total (${duration} mo.): ${totalPrice.toLocaleString()} UZS`
                            : `Jami (${duration} oy): ${totalPrice.toLocaleString()} UZS`}
                          {savedAmount > 0 && (
                            <span className="text-[#008060] font-semibold ml-1">
                              ({lang === "ru" ? "экономия" : lang === "en" ? "save" : "tejamkorlik"}{" "}
                              {savedAmount.toLocaleString()} UZS)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenModal(p)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer mt-5 active:scale-98 ${
                          isStandard
                            ? "bg-[#00a86b] hover:bg-[#008f5b] text-white"
                            : "bg-[#202223] hover:bg-[#303234] text-white"
                        }`}
                      >
                        {btnLabel}
                      </button>

                      {/* Features List */}
                      <div className="border-t border-[#f1f2f3] dark:border-zinc-800 pt-5 mt-5">
                        <div className="text-[11px] font-bold text-[#202223] dark:text-white mb-3 uppercase tracking-wider">
                          {lang === "ru"
                            ? "Что входит в тариф:"
                            : lang === "en"
                            ? "Included features:"
                            : "Tarif imkoniyatlari:"}
                        </div>
                        <ul className="space-y-2.5">
                          {p.features.map((f, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-xs text-[#202223] dark:text-zinc-300 font-normal"
                            >
                              <div className="w-4 h-4 rounded-full bg-[#e3fcef] text-[#00a86b] flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </div>
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d7175] hover:text-[#202223] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>
                {lang === "ru" ? "Назад к плану" : lang === "en" ? "Back to Plan" : "Rejaga qaytish"}
              </span>
            </button>

            {/* Top Controls: Search & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161b26] p-4 rounded-xl border border-[#e1e3e5] dark:border-white/10 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9196]" />
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f6f6f7] border border-[#e1e3e5] text-xs font-normal text-[#202223] placeholder-[#8c9196] focus:outline-none focus:border-[#00a86b] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold text-[#6d7175]">
                <Receipt className="w-4 h-4 text-[#00a86b]" />
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
            <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e1e3e5] bg-[#f6f6f7] text-[11px] font-semibold uppercase tracking-wider text-[#6d7175]">
                      <th className="py-3 px-4">
                        ID / {lang === "ru" ? "Дата" : lang === "en" ? "Date" : "Sana"}
                      </th>
                      <th className="py-3 px-4">
                        {lang === "ru" ? "Тарифный план" : lang === "en" ? "Pricing Plan" : "Tarif rejasi"}
                      </th>
                      <th className="py-3 px-4">
                        {lang === "ru" ? "Срок действия" : lang === "en" ? "Period" : "Muddati"}
                      </th>
                      <th className="py-3 px-4">
                        {lang === "ru" ? "Способ оплаты" : lang === "en" ? "Payment Method" : "To'lov turi"}
                      </th>
                      <th className="py-3 px-4">
                        {lang === "ru" ? "Сумма" : lang === "en" ? "Amount" : "Summa"}
                      </th>
                      <th className="py-3 px-4 text-right">
                        {lang === "ru" ? "Статус" : lang === "en" ? "Status" : "Holati"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f2f3] text-xs font-normal text-[#202223]">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-[#8c9196]">
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
                        <tr key={item.id} className="hover:bg-[#f6f6f7]/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#202223]">#{item.id}</div>
                            <div className="text-[11px] text-[#6d7175] font-normal">{item.created_at}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                                item.plan === "PRO" || item.plan === "ENTERPRISE"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : item.plan === "STANDARD"
                                  ? "bg-[#e3fcef] text-[#008060] border border-[#00a86b]/25"
                                  : "bg-[#f1f2f3] text-[#202223] border border-[#e1e3e5]"
                              }`}
                            >
                              <Zap className="w-3 h-3" />
                              {formatLocalizedPlanDisplay(item.plan, item.plan_display, lang)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#202223]">
                              {item.period_months || Math.round(item.days / 30) || 1}{" "}
                              {lang === "ru" ? "мес." : lang === "en" ? "mo." : "oy"}
                            </span>
                            <span className="text-[11px] text-[#6d7175] ml-1">
                              ({item.days} {lang === "ru" ? "дн." : lang === "en" ? "days" : "kun"})
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f6f6f7] border border-[#e1e3e5] text-[#202223] font-semibold text-[11px]">
                              <CreditCard className="w-3 h-3 text-[#6d7175]" />
                              {formatLocalizedPaymentMethod(item.payment_method, item.payment_method_display, lang)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-sm text-[#202223]">
                              {item.amount.toLocaleString()}
                            </span>
                            <span className="text-[11px] font-medium text-[#6d7175] ml-1">UZS</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                item.status === "APPROVED"
                                  ? "bg-[#e3fcef] text-[#008060] border border-[#00a86b]/25"
                                  : item.status === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {item.status === "APPROVED" ? (
                                <CheckCircle2 className="w-3 h-3 text-[#00a86b]" />
                              ) : item.status === "REJECTED" ? (
                                <X className="w-3 h-3 text-rose-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              {item.status === "APPROVED"
                                ? lang === "ru"
                                  ? "Одобрено"
                                  : lang === "en"
                                  ? "Approved"
                                  : "Faollashtirilgan"
                                : item.status === "REJECTED"
                                ? lang === "ru"
                                  ? "Отклонено"
                                  : lang === "en"
                                  ? "Rejected"
                                  : "Bekor qilingan"
                                : lang === "ru"
                                ? "В ожидании"
                                : lang === "en"
                                ? "Pending"
                                : "Ko'rib chiqilmoqda"}
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
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#e1e3e5] max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#f1f2f3] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e3fcef] text-[#00a86b] flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#202223]">
                    {lang === "ru"
                      ? "Подключение тарифа StoreBox"
                      : lang === "en"
                      ? "Activate StoreBox Plan"
                      : "StoreBox tarifini faollashtirish"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6d7175] hover:text-[#202223] hover:bg-[#f6f6f7] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Plan Calculation Summary */}
              <div className="p-4 rounded-xl bg-[#f6f6f7] border border-[#e1e3e5] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6d7175]">
                    {lang === "ru" ? "Выбранный тариф:" : lang === "en" ? "Selected plan:" : "Tanlangan reja:"}
                  </span>
                  <span className="font-bold text-[#202223]">StoreBox {selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6d7175]">
                    {lang === "ru" ? "Период оплаты:" : lang === "en" ? "Billing period:" : "Amal qilish davri:"}
                  </span>
                  <span className="font-semibold text-[#202223]">
                    {duration} {lang === "ru" ? "мес." : lang === "en" ? "mo." : "oy"} ({duration * 30}{" "}
                    {lang === "ru" ? "дней" : lang === "en" ? "days" : "kun"})
                    {calculateDiscountPercent(duration) > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#e3fcef] text-[#008060] font-bold">
                        -{calculateDiscountPercent(duration)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-[#e1e3e5] pt-2.5 text-xs font-semibold">
                  <span className="text-[#202223]">
                    {lang === "ru" ? "Итого к оплате:" : lang === "en" ? "Total due:" : "Jami to'lov:"}
                  </span>
                  <span className="text-[#008060] font-black text-base">
                    {calculateDiscountedPrice(selectedPlan.monthly_price, duration).toLocaleString()} UZS
                  </span>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedbackMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2.5 ${
                    feedbackMessage.type === "success"
                      ? "bg-[#e3fcef] text-[#008060] border border-[#00a86b]/30"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {feedbackMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00a86b] shrink-0 mt-0.5" />
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
                  <label className="block font-semibold text-[#202223] mb-1.5">
                    {lang === "ru"
                      ? "Выберите способ оплаты:"
                      : lang === "en"
                      ? "Select payment method:"
                      : "To'lov usulini tanlang:"}
                  </label>
                  <div className="space-y-1.5">
                    {/* Balance Option */}
                    <label
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === "BALANCE"
                          ? "border-[#00a86b] bg-[#e3fcef]/30 ring-1 ring-[#00a86b]"
                          : "border-[#e1e3e5] hover:bg-[#f6f6f7]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="payment_method"
                          value="BALANCE"
                          checked={paymentMethod === "BALANCE"}
                          onChange={() => setPaymentMethod("BALANCE")}
                          className="accent-[#00a86b]"
                        />
                        <div className="w-7 h-7 rounded-md bg-[#e3fcef] text-[#00a86b] flex items-center justify-center shrink-0">
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-[#202223]">
                            {lang === "ru"
                              ? "Баланс магазина"
                              : lang === "en"
                              ? "Store Balance"
                              : "Do'kon balansi"}
                          </div>
                          <div className="text-[10px] text-[#6d7175]">
                            {lang === "ru"
                              ? "Мгновенная активация тарифа"
                              : lang === "en"
                              ? "Instant plan activation"
                              : "Mablag' balansdan bir zumda yechiladi"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#202223]">
                          {storeInfo?.balance.toLocaleString()} UZS
                        </span>
                        {storeInfo &&
                          storeInfo.balance <
                            calculateDiscountedPrice(selectedPlan.monthly_price, duration) && (
                            <div className="text-[10px] font-semibold text-rose-600">
                              {lang === "ru"
                                ? "Недостаточно средств"
                                : lang === "en"
                                ? "Insufficient funds"
                                : "Mablag' yetarli emas"}
                            </div>
                          )}
                      </div>
                    </label>

                    {/* Click */}
                    <label
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === "CLICK"
                          ? "border-[#00a86b] bg-[#e3fcef]/30 ring-1 ring-[#00a86b]"
                          : "border-[#e1e3e5] hover:bg-[#f6f6f7]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="payment_method"
                          value="CLICK"
                          checked={paymentMethod === "CLICK"}
                          onChange={() => setPaymentMethod("CLICK")}
                          className="accent-[#00a86b]"
                        />
                        <div>
                          <div className="font-bold text-[#202223]">
                            {lang === "ru"
                              ? "Оплата через Click Up"
                              : lang === "en"
                              ? "Pay via Click Up"
                              : "Click orqali to'lov"}
                          </div>
                          <div className="text-[10px] text-[#6d7175]">
                            {lang === "ru"
                              ? "Формирование счёта в приложении Click"
                              : lang === "en"
                              ? "Invoice sent to Click app"
                              : "Ariza yuboriladi va hisob taqdim etiladi"}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#005bd3]/10 text-[#005bd3] font-bold font-mono text-[10px]">
                        CLICK
                      </span>
                    </label>

                    {/* Payme */}
                    <label
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === "PAYME"
                          ? "border-[#00a86b] bg-[#e3fcef]/30 ring-1 ring-[#00a86b]"
                          : "border-[#e1e3e5] hover:bg-[#f6f6f7]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="payment_method"
                          value="PAYME"
                          checked={paymentMethod === "PAYME"}
                          onChange={() => setPaymentMethod("PAYME")}
                          className="accent-[#00a86b]"
                        />
                        <div>
                          <div className="font-bold text-[#202223]">
                            {lang === "ru"
                              ? "Оплата через Payme"
                              : lang === "en"
                              ? "Pay via Payme"
                              : "Payme orqali to'lov"}
                          </div>
                          <div className="text-[10px] text-[#6d7175]">
                            {lang === "ru"
                              ? "Через приложение Payme или картой Uzcard/Humo"
                              : lang === "en"
                              ? "Via Payme app or Uzcard/Humo"
                              : "Payme ilovasi yoki karta orqali"}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold font-mono text-[10px]">
                        PAYME
                      </span>
                    </label>

                    {/* Bank Transfer */}
                    <label
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        paymentMethod === "BANK_TRANSFER"
                          ? "border-[#00a86b] bg-[#e3fcef]/30 ring-1 ring-[#00a86b]"
                          : "border-[#e1e3e5] hover:bg-[#f6f6f7]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="payment_method"
                          value="BANK_TRANSFER"
                          checked={paymentMethod === "BANK_TRANSFER"}
                          onChange={() => setPaymentMethod("BANK_TRANSFER")}
                          className="accent-[#00a86b]"
                        />
                        <div>
                          <div className="font-bold text-[#202223]">
                            {lang === "ru"
                              ? "Банковский перевод (Юр. лица)"
                              : lang === "en"
                              ? "Bank Transfer (Corporate)"
                              : "Bank orqali o'tkazma (Yuridik shaxs)"}
                          </div>
                          <div className="text-[10px] text-[#6d7175]">
                            {lang === "ru"
                              ? "Договор и электронный счёт-фактура (Didox)"
                              : lang === "en"
                              ? "Contract and electronic invoice"
                              : "Schyot-faktura va shartnoma taqdim etiladi"}
                          </div>
                        </div>
                      </div>
                      <Building2 className="w-4 h-4 text-[#6d7175]" />
                    </label>
                  </div>
                </div>

                {/* Contact Phone & Notes */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block font-semibold text-[#202223] mb-1">
                      {lang === "ru"
                        ? "Контактный номер телефона:"
                        : lang === "en"
                        ? "Contact phone number:"
                        : "Bog'lanish uchun telefon raqam:"}
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3 py-2 rounded-lg bg-[#f6f6f7] border border-[#e1e3e5] text-xs font-mono focus:outline-none focus:border-[#00a86b] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#202223] mb-1">
                      {lang === "ru"
                        ? "Примечание / Реквизиты (необязательно):"
                        : lang === "en"
                        ? "Notes / Company details (optional):"
                        : "Izoh yoki rekvizitlar (ixtiyoriy):"}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        lang === "ru"
                          ? "Название компании, ИНН..."
                          : lang === "en"
                          ? "Company name, TIN..."
                          : "Kompaniya nomi, STIR (INN)..."
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#f6f6f7] border border-[#e1e3e5] text-xs font-medium focus:outline-none focus:border-[#00a86b] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 rounded-lg border border-[#e1e3e5] text-[#6d7175] hover:bg-[#f6f6f7] font-semibold transition cursor-pointer"
                  >
                    {lang === "ru" ? "Отмена" : lang === "en" ? "Cancel" : "Bekor qilish"}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (paymentMethod === "BALANCE" &&
                        (storeInfo?.balance ?? 0) <
                          calculateDiscountedPrice(selectedPlan.monthly_price, duration))
                    }
                    className="px-4 py-2 rounded-lg bg-[#00a86b] hover:bg-[#008f5b] disabled:opacity-50 text-white font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? (
                      <span>
                        {lang === "ru"
                          ? "Обработка..."
                          : lang === "en"
                          ? "Processing..."
                          : "Bajarilmoqda..."}
                      </span>
                    ) : paymentMethod === "BALANCE" ? (
                      <span>
                        {lang === "ru"
                          ? "Оплатить с баланса"
                          : lang === "en"
                          ? "Pay from Balance"
                          : "Balansdan to'lash va faollashtirish"}
                      </span>
                    ) : (
                      <span>
                        {lang === "ru"
                          ? "Отправить заявку"
                          : lang === "en"
                          ? "Submit Request"
                          : "Arizani yuborish"}
                      </span>
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
