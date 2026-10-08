import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Package,
  Check,
  Search,
  ShieldCheck,
  DownloadCloud,
  Layers,
  ExternalLink,
  Power,
  RotateCw,
  Boxes,
  Tag,
  DollarSign,
  Sparkles,
  SlidersHorizontal,
  X,
  Star,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ServiceLogo } from "../settings/IntegrationsMarketPage";

export const IntegrationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, store } = useAuth();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch integration detail
  const { data: item, isLoading, isError, refetch } = useQuery({
    queryKey: ["integration-detail", slug, store?.id],
    queryFn: async () => {
      const url = store?.id ? `/integrations/${slug}/?store_id=${store.id}` : `/integrations/${slug}/`;
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!slug,
  });

  // Prepopulate form
  useEffect(() => {
    if (item) {
      const initial: Record<string, any> = {
        is_active: item.is_active ?? true,
      };
      (item.fields || []).forEach((f: any) => {
        if (item.saved_config && item.saved_config[f.key] !== undefined) {
          initial[f.key] = item.saved_config[f.key];
        } else if (item.masked_credentials && item.masked_credentials[f.key]) {
          initial[f.key] = item.masked_credentials[f.key];
        } else if (f.default !== undefined) {
          initial[f.key] = f.default;
        } else {
          initial[f.key] = "";
        }
      });
      setFormState(initial);
    }
  }, [item]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/integrations/${slug}/save/`, {
        ...payload,
        store_id: store?.id,
      });
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["integration-detail", slug] });
      queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
      setToastMessage({
        type: "success",
        text: res?.message || (lang === "ru" ? "Интеграция успешно сохранена!" : "Integratsiya muvaffaqiyatli saqlandi!"),
      });
    },
    onError: (err: any) => {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.error || (lang === "ru" ? "Ошибка сохранения." : "Saqlashda xatolik yuz berdi."),
      });
    },
  });

  // Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/integrations/${slug}/disconnect/`, { store_id: store?.id });
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["integration-detail", slug] });
      queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
      setToastMessage({
        type: "success",
        text: res?.message || (lang === "ru" ? "Интеграция отключена." : "Ulanish uzildi."),
      });
    },
  });

  // Test Connection
  const handleTest = async () => {
    if (testingConnection) return;
    setTestingConnection(true);
    setToastMessage(null);
    try {
      const res = await api.post(`/integrations/${slug}/test/`, {
        ...formState,
        store_id: store?.id,
      });
      if (res.data?.success) {
        setToastMessage({
          type: "success",
          text: res.data?.message || (lang === "ru" ? "Связь успешно проверена (200 OK)!" : "Aloqa muvaffaqiyatli tekshirildi (200 OK)!"),
        });
      } else {
        setToastMessage({
          type: "error",
          text: res.data?.message || res.data?.error || (lang === "ru" ? "Не удалось установить связь." : "Aloqa o'rnatib bo'lmadi."),
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.error || (lang === "ru" ? "Ошибка подключения к серверу." : "Server bilan aloqa xatosi."),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          {lang === "ru" ? "Загрузка параметров интеграции..." : "Integratsiya sozlamalari yuklanmoqda..."}
        </p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {lang === "ru" ? "Интеграция не найдена" : "Integratsiya topilmadi"}
        </h2>
        <button
          type="button"
          onClick={() => navigate("/robo-market")}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          {lang === "ru" ? "Вернуться в Маркет" : "Marketga qaytish"}
        </button>
      </div>
    );
  }

  const isConnected = item.is_connected;
  const isPosOrWarehouse = item.category === "pos" || item.category === "warehouse";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* 1. BACK NAVIGATION */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/robo-market")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-xs font-bold shadow-2xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>
            {lang === "ru"
              ? "Назад в Маркет интеграций"
              : lang === "en"
              ? "Back to Integrations Market"
              : "Orqaga: Integratsiyalar marketi"}
          </span>
        </button>
      </div>

      {/* 2. TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200/80"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. HERO STATUS BANNER */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <ServiceLogo slug={item.slug} name={item.name} size={60} />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.name}
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  {item.category_title}
                </span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {lang === "ru" ? "Подключено" : "Ulangan"}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-500">
                    {lang === "ru" ? "Не подключено" : "Ulanmagan"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{item.rating}</span>
                </div>
                <span>• {item.reviews_count} {lang === "ru" ? "отзывов" : "sharh"}</span>
              </div>
            </div>
          </div>

          {isConnected && (
            <button
              type="button"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              {disconnectMutation.isPending ? "..." : (lang === "ru" ? "Отключить интеграцию" : "Ulanishni uzish")}
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
          {item.desc || item.short_desc}
        </p>

        {/* Security badge */}
        <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xavfsiz 256-bitli shifrlash (AES/HMAC)</span>
          </div>
          {item.last_synced && (
            <div>
              {lang === "ru" ? "Последняя синхронизация:" : "Oxirgi sinxronizatsiya:"}{" "}
              <strong className="text-slate-800 dark:text-white">
                {new Date(item.last_synced).toLocaleString()}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONFIGURATION FORM */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-xs font-black text-slate-500 tracking-wider uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>{lang === "ru" ? "ПАРАМЕТРЫ ПОДКЛЮЧЕНИЯ" : "ULANISH SOZLAMALARI"}</span>
          </h2>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
              {lang === "ru" ? "Активно в магазине" : "Do'konda faol"}
            </span>
            <input
              type="checkbox"
              checked={!!formState.is_active}
              onChange={(e) => handleFieldChange("is_active", e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(item.fields || []).map((f: any) => {
            const isSecret = f.secret || f.type === "password";
            const isVisible = showSecrets[f.key];

            return (
              <div key={f.key} className={f.type === "checkbox" ? "sm:col-span-2" : ""}>
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-750 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formState[f.key]}
                      onChange={(e) => handleFieldChange(f.key, e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      {f.label}
                    </span>
                  </label>
                ) : f.type === "select" ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                      {f.label} {f.required && "*"}
                    </label>
                    <select
                      value={formState[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white"
                    >
                      {(f.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                      {f.label} {f.required && "*"}
                    </label>
                    <div className="relative">
                      <input
                        type={isSecret && !isVisible ? "password" : "text"}
                        value={formState[f.key] ?? ""}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        autoComplete="off"
                        name={`integration_field_${f.key}`}
                        data-lpignore="true"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(f.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-neutral-800 flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
            <span>
              {testingConnection
                ? (lang === "ru" ? "Проверка..." : "Tekshirilmoqda...")
                : (lang === "ru" ? "Проверить связь" : "Aloqani tekshirish")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate(formState)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {saveMutation.isPending
                ? (lang === "ru" ? "Сохранение..." : "Saqlanmoqda...")
                : (lang === "ru" ? "Сохранить и подключить" : "Saqlash va ulash")}
            </span>
          </button>
        </div>
      </div>

      {/* 5. IF WAREHOUSE/POS: SPECIAL LINK OR EXPLORER */}
      {isPosOrWarehouse && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-3xl border border-blue-200/80 dark:border-blue-800/50 p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-blue-950 dark:text-blue-200">
              {lang === "ru" ? "Управление складскими остатками" : "Omborxona va qoldiqlar boshqaruvi"}
            </h3>
            <p className="text-xs text-blue-800/80 dark:text-blue-300">
              {lang === "ru"
                ? "Все синхронизированные товары и остатки отображаются в разделе «Складской учет»."
                : "Barcha sinxronlashtirilgan tovarlar va ombor qoldiqlari «Omborxona hisobi» bo'limida ko'rsatiladi."}
            </p>
          </div>
          <Link
            to="/warehouse"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs"
          >
            {lang === "ru" ? "Перейти в Склад" : "Omborxonaga o'tish"}
          </Link>
        </div>
      )}
    </div>
  );
};
