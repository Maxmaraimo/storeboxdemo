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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] flex items-center justify-center shadow-xs">
              <BadgePercent className="w-4 h-4" />
            </span>
            <span>{t("tariffs") || "Tarif rejalari va obuna"}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {t("tariffs_subtitle") || "Do'koningiz obuna muddati, to'lovlar balansi va tarif rejalarini boshqarish"}
          </p>
        </div>

        {storeInfo && (
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-[#161b26] rounded-2xl border border-slate-200/80 dark:border-white/10 px-4 py-2.5 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] flex items-center justify-center font-bold shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">{t("store_balance_label") || "Do'kon balansi"}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {storeInfo.balance.toLocaleString()} <span className="text-[11px] font-medium text-slate-500">UZS</span>
                </div>
              </div>
            </div>
            <button
              onClick={fetchTariffInfo}
              title={t("refresh_btn") || "Yangilash"}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-[#211b2e] dark:hover:text-[#c8ff6a] hover:bg-slate-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation: Tarif rejalari vs To'lovlar tarixi */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit border border-slate-200/70 dark:border-white/10 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTabChange("plans")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "plans"
              ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{lang === "ru" ? "Тарифные планы" : lang === "en" ? "Pricing Plans" : "Tarif rejalari"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === "ru" ? "История тарифов" : lang === "en" ? "Billing History" : "To'lovlar tarixi"}</span>
          {billingHistory.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "history"
                  ? "bg-[#c8ff6a]/25 text-[#c8ff6a] dark:bg-[#211b2e]/25 dark:text-[#211b2e]"
                  : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
              }`}
            >
              {billingHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Subscription Status Alert Banner */}
      {storeInfo && (
        <div
          className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            isExpired
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : isExpiringSoon
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-[#211b2e] border-[#211b2e]/20 text-white"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                isExpired
                  ? "bg-rose-100 text-rose-600"
                  : isExpiringSoon
                  ? "bg-amber-100 text-amber-600 animate-bounce"
                  : "bg-[#c8ff6a] text-[#211b2e]"
              }`}
            >
              {isExpired ? (
                <AlertTriangle className="w-5 h-5" />
              ) : isExpiringSoon ? (
                <Clock className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight">
                {isExpired
                  ? "Do'koningiz obuna muddati tugagan!"
                  : isExpiringSoon
                  ? `Obuna muddati tez orada tugaydi (${daysLeft} kun qoldi)!`
                  : "Faol obuna rejasi amal qilmoqda"}
              </div>
              <div className="text-[11px] mt-0.5 opacity-90">
                Amaldagi tarif: <b className="font-bold">{storeInfo.plan_display}</b> • Tugash sanasi:{" "}
                <b className="font-bold">{storeInfo.expires_at || "Cheksiz"}</b>{" "}
                {!isExpired && <span className="text-[10px] font-semibold">({daysLeft} kun qoldi)</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white/10 text-white border border-white/10 shadow-2xs">
              {storeInfo.subdomain}.storebox.uz
            </span>
          </div>
        </div>
      )}

      {/* Pending Application Notice */}
      {pendingRequest && (
        <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="text-xs font-bold">
                Ariza #{pendingRequest.id} ko'rib chiqilmoqda
              </div>
              <div className="text-[11px] text-indigo-700 mt-0.5">
                Tarif: <b>{pendingRequest.plan_display}</b> • To'lov summasi:{" "}
                <b>{pendingRequest.amount.toLocaleString()} UZS</b> • Usul: {pendingRequest.payment_method}
              </div>
            </div>
          </div>
          <span className="text-xxs uppercase font-bold px-2.5 py-1 rounded-full bg-indigo-200/80 text-indigo-900 font-mono">
            Kutilmoqda
          </span>
        </div>
      )}

      {/* 1. PLANS VIEW */}
      {activeTab === "plans" && (
        <>
          {/* Duration Switcher Pills */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("select_duration") || "Obuna davrini tanlang:"}</div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800 p-1.5 rounded-2xl text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setDuration(1)}
                className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  duration === 1 ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t("month_1_simple") || (lang === "ru" ? "Месяц" : lang === "en" ? "Month" : "Oy")}
              </button>
              <button
                type="button"
                onClick={() => setDuration(6)}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  duration === 6 ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{t("month_6_simple") || (lang === "ru" ? "6 месяцев" : lang === "en" ? "6 months" : "6 oy")}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] text-[10px] font-black">
                  -10%
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDuration(12)}
                className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  duration === 12 ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{t("month_12_simple") || (lang === "ru" ? "12 месяцев" : lang === "en" ? "12 months" : "12 oy")}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] text-[10px] font-black">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-2">
        {plans.map((p) => {
          const discountPct = calculateDiscountPercent(duration);
          const totalPrice = calculateDiscountedPrice(p.monthly_price, duration);
          const isCurrentPlan = storeInfo?.plan === p.code;

          const featMap: Record<string, Record<string, string>> = {
            "Katalogda 1 000 tagacha mahsulot": { ru: "До 1 000 товаров в каталоге", en: "Up to 1,000 products in catalog", uz: "Katalogda 1 000 tagacha mahsulot" },
            "1 000 tagacha tovar": { ru: "До 1 000 товаров в каталоге", en: "Up to 1,000 products in catalog", uz: "Katalogda 1 000 tagacha mahsulot" },
            "Telegram WebApp bot-do'kon": { ru: "Telegram WebApp бот-магазин", en: "Telegram WebApp bot store", uz: "Telegram WebApp bot-do'kon" },
            "Telegram bot + Veb-sayt": { ru: "Telegram WebApp бот-магазин", en: "Telegram WebApp bot store", uz: "Telegram WebApp bot-do'kon" },
            "QR Menyu / Katalog": { ru: "QR-меню для столиков заведения", en: "Table QR menu", uz: "Stollar uchun QR-menyu" },
            "Instagram do'kon": { ru: "Синхронизация с Instagram", en: "Instagram shop sync", uz: "Instagram do'kon" },
            "3 ta filial": { ru: "До 3 филиалов", en: "Up to 3 branches", uz: "3 ta filial" },
            "Shaxsiy domenni ulash": { ru: "Подключение собственного домена", en: "Custom domain connection", uz: "Shaxsiy domenni ulash" },
            "Marketing: promokodlar va xabarnomalar": { ru: "Маркетинг: промокоды и рассылки", en: "Marketing: promo codes & broadcasts", uz: "Marketing: promokodlar va xabarnomalar" },
            "Marketing: promokodlar va tarqatish": { ru: "Маркетинг: промокоды и рассылки", en: "Marketing: promo codes & broadcasts", uz: "Marketing: promokodlar va xabarnomalar" },
            "AI-dizayn va mavzular": { ru: "AI-дизайн и темы оформления", en: "AI-design and visual themes", uz: "AI-dizayn va mavzular" },
            "Ishchi guruh bilan sinxronizatsiya": { ru: "Синхронизация с рабочей группой", en: "Workgroup synchronization", uz: "Ishchi guruh bilan sinxronizatsiya" },
            "Cheksiz tovarlar": { ru: "Безлимитное количество товаров", en: "Unlimited products", uz: "Cheksiz mahsulotlar soni" },
            "Cheksiz tovarlar soni": { ru: "Безлимитное количество товаров", en: "Unlimited products", uz: "Cheksiz mahsulotlar soni" },
            "AI Dizayn Studio": { ru: "AI-дизайн и темы оформления", en: "AI Design Studio", uz: "AI Dizayn Studio" },
            "YES POS integratsiyasi": { ru: "Интеграция с YES POS кассой", en: "YES POS integration", uz: "YES POS kassasi bilan integratsiya" },
            "YES POS kassa bilan integratsiya": { ru: "Интеграция с YES POS кассой", en: "YES POS integration", uz: "YES POS kassasi bilan integratsiya" },
            "YES POS kassasi bilan integratsiya": { ru: "Интеграция с YES POS кассой", en: "YES POS integration", uz: "YES POS kassasi bilan integratsiya" },
            "Ijtimoiy tarmoq postlaridan import": { ru: "Импорт товаров из постов соцсетей", en: "Social media post import", uz: "Ijtimoiy tarmoq postlaridan import" },
            "ClickSuperApp": { ru: "Индивидуальные интеграции по API", en: "Click SuperApp integration", uz: "ClickSuperApp" },
            "Stollar uchun QR-menyu": { ru: "QR-меню для столиков заведения", en: "Table QR menu", uz: "Stollar uchun QR-menyu" },
            "Muassasa stollari uchun QR-menyu": { ru: "QR-меню для столиков заведения", en: "Table QR menu", uz: "Stollar uchun QR-menyu" },
            "Kengaytirilgan moliyaviy analitika": { ru: "Расширенная финансовая аналитика", en: "Advanced financial analytics", uz: "Kengaytirilgan moliyaviy analitika" },
            "Kengaytirilgan moliyaviy tahlil": { ru: "Расширенная финансовая аналитика", en: "Advanced financial analytics", uz: "Kengaytirilgan moliyaviy analitika" },
            "5 nafargacha xodimlar jamoasi": { ru: "Команда до 5 сотрудников", en: "Team up to 5 staff", uz: "5 nafargacha xodimlar jamoasi" },
            "5 tagacha xodimlar jamoasi": { ru: "Команда до 5 сотрудников", en: "Team up to 5 staff", uz: "5 nafargacha xodimlar jamoasi" },
            "5 ta filial": { ru: "Команда до 5 сотрудников", en: "Up to 5 branches", uz: "5 ta filial" },
            "Barcha funksiyalar to'liq cheksiz": { ru: "Полный безлимит всех функций", en: "Full unlimited features", uz: "Barcha funksiyalar to'liq cheksiz" },
            "Barcha imkoniyatlar to'liq cheksiz": { ru: "Полный безлимит всех функций", en: "Full unlimited features", uz: "Barcha funksiyalar to'liq cheksiz" },
            "Barcha Pro imkoniyatlar": { ru: "Полный безлимит всех функций", en: "Full unlimited features", uz: "Barcha funksiyalar to'liq cheksiz" },
            "Ko'p filialli tarmoq boshqaruvi": { ru: "Мультифилиальность и сеть точек", en: "Multi-branch & network management", uz: "Ko'p filialli tarmoq boshqaruvi" },
            "API orqali maxsus integratsiyalar": { ru: "Индивидуальные интеграции по API", en: "Custom API integrations", uz: "API orqali maxsus integratsiyalar" },
            "Biriktirilgan shaxsiy menejer": { ru: "Выделенный персональный менеджер", en: "Dedicated personal manager", uz: "Biriktirilgan shaxsiy menejer" },
            "SLA 99.9% va xodimlarni o'qitish": { ru: "SLA 99.9% и обучение персонала", en: "SLA 99.9% & staff training", uz: "SLA 99.9% va xodimlarni o'qitish" },
            "Shaxsiy domen (.uz)": { ru: "Собственный домен (.uz)", en: "Custom domain (.uz)", uz: "Shaxsiy domen (.uz)" },
            "Cheksiz filiallar": { ru: "Мультифилиальность и сеть точек", en: "Unlimited branches", uz: "Cheksiz filiallar" },
            "Maxsus server ajratish": { ru: "Выделенный сервер", en: "Dedicated server instance", uz: "Maxsus server ajratish" },
            "24/7 Shaxsiy menejer": { ru: "24/7 персональный менеджер", en: "24/7 personal manager", uz: "24/7 Shaxsiy menejer" },
          };

          const planDescMap: Record<string, Record<string, string>> = {
            START: {
              uz: "O'sayotgan do'konlar va faol brendlar uchun",
              ru: "Для растущих магазинов и активных брендов",
              en: "For growing stores and active brands",
            },
            STANDARD: {
              uz: "Katta biznes, restoranlar va savdo tarmoqlari uchun",
              ru: "Для зрелого бизнеса, ресторанов и торговых сетей",
              en: "For mature businesses, restaurants, and retail chains",
            },
            PRO: {
              uz: "Katta tarmoqlar va maxsus integratsiyalar uchun",
              ru: "Для крупных сетей и персональных интеграций",
              en: "For large retail chains and custom enterprise integrations",
            },
            ENTERPRISE: {
              uz: "Katta tarmoqlar va maxsus integratsiyalar uchun",
              ru: "Для крупных сетей и персональных интеграций",
              en: "For large retail chains and custom enterprise integrations",
            },
          };

          // Always display plan titles in clean English as requested: Start, Standard, Pro
          const planTitle = p.code === "START" ? "Start"
                          : p.code === "STANDARD" ? "Standard"
                          : p.code === "PRO" ? "Pro"
                          : p.code === "ENTERPRISE" ? "Pro"
                          : p.name;

          const planDesc = planDescMap[p.code]?.[lang] || planDescMap[p.code]?.uz || p.desc;

          return (
            <div
              key={p.code}
              className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between p-6 relative hover:-translate-y-2 hover:shadow-2xl hover:border-slate-300 ${
                p.recommended
                  ? "border-2 border-brand shadow-xl ring-2 ring-brand/10 scale-[1.02]"
                  : isCurrentPlan
                  ? "border-[#211b2e] shadow-md ring-1 ring-[#211b2e]/20"
                  : "border-slate-200/90 shadow-xs"
              }`}
            >
              {p.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                  {t("recommended_badge") || "Tavsiya etiladi"}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900">{planTitle}</h2>
                    {isCurrentPlan && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e]">
                        {t("current_plan_badge") || "Joriy tarif"}
                      </span>
                    )}
                  </div>
                  {planDesc && (
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                      {planDesc}
                    </p>
                  )}
                </div>

                {/* Price Display */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {Math.round(totalPrice / duration).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{t("per_month") || "UZS / oy"}</span>
                  </div>

                  <div className="mt-2 text-[11px] font-bold text-slate-500 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-between">
                    <span>{t("total_for_months").replace("{duration}", String(duration))}</span>
                    <span className="font-bold text-slate-900">{totalPrice.toLocaleString()} UZS</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">{t("features_label") || "Imkoniyatlar:"}</div>
                  <ul className="space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <Check className="w-4 h-4 text-[#211b2e] dark:text-[#c8ff6a] shrink-0 mt-0.5" />
                        <span>{featMap[f]?.[lang] || f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenModal(p)}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-98 ${
                    p.recommended
                      ? "bg-brand hover:bg-brand-dark text-white shadow-brand/20 shadow-md"
                      : isCurrentPlan
                      ? "bg-slate-900 hover:bg-black text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {isCurrentPlan ? (t("extend_plan") || "Tarifni uzaytirish") : (t("upgrade_plan") || "Tarifni tanlash")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* 2. BILLING HISTORY VIEW */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Top Controls: Search & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161b26] p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#211b2e] dark:focus:border-[#c8ff6a] transition-all"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-bold text-slate-500 dark:text-slate-400">
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
          <div className="bg-white dark:bg-[#161b26] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    <th className="py-3.5 px-5">ID / {lang === "ru" ? "Дата" : lang === "en" ? "Date" : "Sana"}</th>
                    <th className="py-3.5 px-5">{lang === "ru" ? "Тарифный план" : lang === "en" ? "Pricing Plan" : "Tarif rejasi"}</th>
                    <th className="py-3.5 px-5">{lang === "ru" ? "Срок действия" : lang === "en" ? "Period" : "Muddati"}</th>
                    <th className="py-3.5 px-5">{lang === "ru" ? "Способ оплаты" : lang === "en" ? "Payment Method" : "To'lov turi"}</th>
                    <th className="py-3.5 px-5">{lang === "ru" ? "Сумма" : lang === "en" ? "Amount" : "Summa"}</th>
                    <th className="py-3.5 px-5 text-right">{lang === "ru" ? "Статус" : lang === "en" ? "Status" : "Holati"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 dark:text-slate-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-35" />
                        <div className="font-bold">
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
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 dark:text-white">#{item.id}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{item.created_at}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                              item.plan === "PRO" || item.plan === "ENTERPRISE"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                                : item.plan === "STANDARD"
                                ? "bg-[#211b2e] text-[#c8ff6a]"
                                : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900">Tarifni faollashtirish</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plan Calculation Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tanlangan reja:</span>
                <span className="font-bold text-sm text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amal qilish davri:</span>
                <span className="font-bold text-slate-800">
                  {duration} oy ({duration * 30} kun)
                  {calculateDiscountPercent(duration) > 0 && (
                    <span className="ml-1 text-emerald-600">(-{calculateDiscountPercent(duration)}% chegirma)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-sm font-bold">
                <span className="text-slate-800">Jami to'lov:</span>
                <span className="text-[#211b2e] dark:text-[#c8ff6a] font-bold text-base">
                  {calculateDiscountedPrice(selectedPlan.monthly_price, duration).toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Feedback Alert */}
            {feedbackMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 ${
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
            <form onSubmit={handleSubmitTariffRequest} className="space-y-4 text-xs">
              {/* Payment Methods */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">To'lov usulini tanlang:</label>
                <div className="space-y-2">
                  {/* Balance Option */}
                  <label
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "BALANCE"
                        ? "border-[#211b2e] dark:border-[#c8ff6a] bg-[#211b2e]/5 dark:bg-[#c8ff6a]/5 ring-1 ring-[#211b2e] dark:ring-[#c8ff6a]"
                        : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        value="BALANCE"
                        checked={paymentMethod === "BALANCE"}
                        onChange={() => setPaymentMethod("BALANCE")}
                        className="text-[#211b2e] focus:ring-[#211b2e]"
                      />
                      <div className="w-8 h-8 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] flex items-center justify-center shrink-0 shadow-xs">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Do'kon balansi</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Mablag' balansdan bir zumda yechiladi</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {storeInfo?.balance.toLocaleString()} UZS
                      </span>
                      {storeInfo && storeInfo.balance < calculateDiscountedPrice(selectedPlan.monthly_price, duration) && (
                        <div className="text-[10px] font-bold text-rose-600">Mablag' yetarli emas</div>
                      )}
                    </div>
                  </label>

                  {/* Click */}
                  <label
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "CLICK"
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
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
                        className="text-brand focus:ring-brand"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Click orqali to'lov</div>
                        <div className="text-[10px] text-slate-500">Ariza yuboriladi va hisob taqdim etiladi</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold font-mono text-[10px]">
                      CLICK
                    </span>
                  </label>

                  {/* Payme */}
                  <label
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "PAYME"
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
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
                        className="text-brand focus:ring-brand"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Payme orqali to'lov</div>
                        <div className="text-[10px] text-slate-500">Payme ilovasi yoki karta orqali</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-600 font-bold font-mono text-[10px]">
                      PAYME
                    </span>
                  </label>

                  {/* Bank Transfer (Yuridik shaxs) */}
                  <label
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === "BANK_TRANSFER"
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
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
                        className="text-brand focus:ring-brand"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Bank orqali o'tkazma (Yuridik shaxs)</div>
                        <div className="text-[10px] text-slate-500">Schyot-faktura va shartnoma taqdim etiladi</div>
                      </div>
                    </div>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </label>
                </div>
              </div>

              {/* Contact Phone & Notes */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bog'lanish uchun telefon raqam:</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand focus:bg-white transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Izoh yoki rekvizitlar (ixtiyoriy):</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Kompaniya nomi, STIR (INN) yoki to'lov bo'yicha eslatma..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-brand focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (paymentMethod === "BALANCE" &&
                      (storeInfo?.balance ?? 0) <
                        calculateDiscountedPrice(selectedPlan.monthly_price, duration))
                  }
                  className="flex-1 py-3 rounded-2xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-black shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <span>Bajarilmoqda...</span>
                  ) : paymentMethod === "BALANCE" ? (
                    <span>Balansdan to'lash va faollashtirish</span>
                  ) : (
                    <span>Arizani yuborish</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
