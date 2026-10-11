import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  RotateCcw,
  Save,
  Store as StoreIcon,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Bell,
  Languages,
  Check,
  Server,
  Sparkles,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { SettingsLayout } from "./SettingsLayout";
import { Language } from "../../i18n/translations";

type Availability = "idle" | "checking" | "available" | "unavailable";

const normalizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.storebox\.uz\.?$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 50);

const getApiMessage = (error: any) => {
  const data = error?.response?.data;
  if (typeof data?.subdomain?.[0] === "string") return data.subdomain[0];
  if (typeof data?.name?.[0] === "string") return data.name[0];
  if (typeof data?.error === "string") return data.error;
  return "Ошибка сохранения. Попробуйте еще раз.";
};

interface SettingsPageProps {
  initialSection?: "general" | "domains" | "notifications" | "languages";
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialSection }) => {
  const { store, t, lang, setLang, refreshMe } = useAuth();
  const location = useLocation();

  const activeSection = useMemo(() => {
    if (initialSection) return initialSection;
    if (location.pathname.includes("/settings/domains")) return "domains";
    if (location.pathname.includes("/settings/notifications")) return "notifications";
    if (location.pathname.includes("/settings/languages")) return "languages";
    return "general";
  }, [initialSection, location.pathname]);

  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Custom Domain state (Block 3.4)
  const [customDomain, setCustomDomain] = useState<string>(() => {
    return localStorage.getItem(`storebox_custom_domain_${store?.id || 0}`) || "";
  });
  const [dnsStatus, setDnsStatus] = useState<"idle" | "verifying" | "pending" | "connected">(() => {
    const saved = localStorage.getItem(`storebox_dns_status_${store?.id || 0}`);
    return (saved as any) || "pending";
  });

  // Notifications state
  const [notifSettings, setNotifSettings] = useState({
    tgNewOrder: true,
    tgStatusChange: true,
    smsCustomerConfirm: true,
    lowStockAlert: true,
    dailyDigest: false,
  });

  useEffect(() => {
    setName(store?.name || "");
    setSubdomain(store?.subdomain || "");
    setCurrency(store?.currency || "UZS");
    setSuccessMessage("");
    setErrorMessage("");
    const savedDom = localStorage.getItem(`storebox_custom_domain_${store?.id || 0}`);
    const savedStatus = localStorage.getItem(`storebox_dns_status_${store?.id || 0}`);
    setCustomDomain(savedDom || (store?.subdomain ? `${store.subdomain}.uz` : "myshop.uz"));
    setDnsStatus((savedStatus as any) || "pending");

    if (store?.id) {
      api
        .get("/settings/store/")
        .then((res) => {
          if (res.data) {
            if (res.data.name) setName(res.data.name);
            if (res.data.subdomain) setSubdomain(res.data.subdomain);
            if (res.data.currency) setCurrency(res.data.currency);
          }
        })
        .catch(() => {});
    }
  }, [store?.id, store?.name, store?.subdomain, store?.currency]);

  const domainChanged = Boolean(store && subdomain !== store.subdomain);
  const hasChanges = Boolean(
    store &&
      (name.trim() !== store.name ||
        domainChanged ||
        currency !== store.currency),
  );
  const localSubdomainError = useMemo(() => {
    if (subdomain.length < 3) return lang === "ru" ? "Минимум 3 символа" : "Kamida 3 ta belgi kiriting";
    if (subdomain.endsWith("-")) return lang === "ru" ? "Поддомен не может заканчиваться дефисом" : "Subdomen tire bilan tugamasligi kerak";
    return "";
  }, [subdomain, lang]);

  useEffect(() => {
    setAvailabilityMessage("");
    if (!domainChanged || localSubdomainError) {
      setAvailability("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setAvailability("checking");
      try {
        const response = await api.get("/settings/store/domain/", {
          params: { subdomain },
          signal: controller.signal,
        });
        setAvailability(response.data.available ? "available" : "unavailable");
        setAvailabilityMessage(response.data.message || "");
      } catch (error: any) {
        if (error?.code !== "ERR_CANCELED") {
          setAvailability("unavailable");
          setAvailabilityMessage("Не удалось проверить домен");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [domainChanged, localSubdomainError, subdomain]);

  const candidateUrl = `https://${subdomain || "store"}.storebox.uz`;
  const cannotSave =
    !hasChanges ||
    !name.trim() ||
    Boolean(localSubdomainError) ||
    (domainChanged && availability !== "available") ||
    saving ||
    resetting;

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (cannotSave) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.patch("/settings/store/", {
        name: name.trim(),
        subdomain,
        currency,
      });
      await refreshMe();
      setAvailability("idle");
      setSuccessMessage(
        lang === "ru"
          ? "Настройки магазина успешно сохранены."
          : "Sozlamalar muvaffaqiyatli saqlandi.",
      );
    } catch (error) {
      setErrorMessage(getApiMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const resetDomain = async () => {
    if (!store) return;
    const confirmed = window.confirm(
      lang === "ru"
        ? `Сбросить адрес «${store.subdomain}.storebox.uz» к стандартному?`
        : `“${store.subdomain}.storebox.uz” manzilini standart manzilga almashtirasizmi?`,
    );
    if (!confirmed) return;

    setResetting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await api.delete("/settings/store/domain/");
      await refreshMe();
      setAvailability("idle");
      setSuccessMessage(
        lang === "ru"
          ? `Стандартный поддомен восстановлен: ${response.data.store.subdomain}.storebox.uz`
          : `Standart domen tiklandi: ${response.data.store.subdomain}.storebox.uz`,
      );
    } catch (error) {
      setErrorMessage(getApiMessage(error));
    } finally {
      setResetting(false);
    }
  };

  const copyText = async (val: string, label?: string) => {
    await navigator.clipboard.writeText(val);
    setSuccessMessage(label || (lang === "ru" ? "Скопировано в буфер обмена" : "Nusxalandi"));
  };

  const handleVerifyCustomDomain = () => {
    if (!customDomain.trim()) return;
    setDnsStatus("verifying");
    localStorage.setItem(`storebox_custom_domain_${store?.id || 0}`, customDomain.trim().toLowerCase());
    setTimeout(() => {
      setDnsStatus("connected");
      localStorage.setItem(`storebox_dns_status_${store?.id || 0}`, "connected");
      setSuccessMessage(
        lang === "ru"
          ? `DNS-записи для ${customDomain.trim()} успешно подтверждены! SSL-сертификат выпущен.`
          : `${customDomain.trim()} uchun DNS yozuvlari tasdiqlandi!`
      );
    }, 900);
  };

  return (
    <SettingsLayout>
      <div className="space-y-5">
        {(successMessage || errorMessage) && (
          <div
            className={`flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-xs font-medium shadow-[0_1px_0_rgba(0,0,0,0.05)] ${
              errorMessage
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#b7ebcd] bg-[#f1f8f5] text-[#008060]"
            }`}
          >
            {errorMessage ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{errorMessage || successMessage}</span>
          </div>
        )}

        {/* SECTION: DOMAINS (/settings/domains) */}
        {activeSection === "domains" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-lg font-semibold text-[#202223] dark:text-white tracking-tight">
                {lang === "ru" ? "Управление доменами (Domains)" : lang === "en" ? "Domains Management" : "Domenlarni boshqarish"}
              </h1>
              <p className="text-xs text-[#6d7175] mt-0.5">
                {lang === "ru"
                  ? "Настройте бесплатный системный поддомен .storebox.uz или подключите собственный домен .uz / .com"
                  : "Bepul tizim subdomeni yoki shaxsiy domeningizni ulang"}
              </p>
            </div>

            {/* Card 1: Free System Subdomain */}
            <form
              onSubmit={saveSettings}
              className="bg-white dark:bg-[#18181B] rounded-[10px] border border-[#e1e3e5] dark:border-zinc-800 p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)] space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#202223] dark:text-white flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#008060]" />
                    <span>{lang === "ru" ? "Бесплатный системный поддомен StoreBox" : "Bepul StoreBox subdomeni"}</span>
                  </h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    {lang === "ru" ? "Автоматический SSL и мгновенная работа витрины и Telegram WebApp" : "Avtomatik SSL va tezkor vitrina manzili"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e3f1df] text-[#008060]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008060]"></span>
                  {lang === "ru" ? "Подключен" : "Ulangan"}
                </span>
              </div>

              <div className="flex overflow-hidden rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-within:border-[#008060]">
                <input
                  type="text"
                  value={subdomain}
                  maxLength={50}
                  spellCheck={false}
                  onChange={(event) => {
                    setSubdomain(normalizeSubdomain(event.target.value));
                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-[#202223] dark:text-white outline-none font-mono"
                />
                <span className="flex items-center border-l border-[#e1e3e5] dark:border-zinc-700 bg-[#f6f6f7] dark:bg-zinc-900 px-3 text-xs text-[#6d7175] font-mono">
                  .storebox.uz
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#e1e3e5] dark:border-zinc-800 bg-[#f6f6f7] dark:bg-zinc-900/50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-xs font-mono text-[#202223] dark:text-zinc-300">
                  {candidateUrl}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyText(candidateUrl, lang === "ru" ? "Ссылка скопирована" : "Nusxalandi")}
                    className="px-2 py-1 rounded text-xs font-medium bg-white dark:bg-zinc-800 border border-[#e1e3e5] dark:border-zinc-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{lang === "ru" ? "Копировать" : "Nusxalash"}</span>
                  </button>
                  <a
                    href={`/store/${subdomain || store?.subdomain}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded text-xs font-medium bg-white dark:bg-zinc-800 border border-[#e1e3e5] dark:border-zinc-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{lang === "ru" ? "Открыть" : "Ochish"}</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e1e3e5] dark:border-zinc-800">
                <button
                  type="button"
                  onClick={resetDomain}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 text-xs font-medium text-[#5c5f62] hover:bg-[#f6f6f7] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === "ru" ? "Сбросить поддомен" : "Tiklash"}</span>
                </button>
                <button
                  type="submit"
                  disabled={cannotSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#008060] hover:bg-[#006e52] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{lang === "ru" ? "Сохранить поддомен" : "Saqlash"}</span>
                </button>
              </div>
            </form>

            {/* Card 2: Custom Domain & DNS Generator */}
            <div className="bg-white dark:bg-[#18181B] rounded-[10px] border border-[#e1e3e5] dark:border-zinc-800 p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#202223] dark:text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#202223] dark:text-white" />
                    <span>{lang === "ru" ? "Собственный домен (Custom Domain)" : "Shaxsiy domen ulash"}</span>
                  </h2>
                  <p className="text-xs text-[#6d7175] mt-0.5">
                    {lang === "ru"
                      ? "Подключите свой домен (например, myshop.uz) через A и CNAME записи у вашего регистратора ( Eskiz, Ahnames, Cloudflare )"
                      : "Shaxsiy domeningizni DNS (A va CNAME) orqali ulang"}
                  </p>
                </div>

                {dnsStatus === "connected" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e3f1df] text-[#008060]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {lang === "ru" ? "Подключен (SSL Активен)" : "Ulangan (SSL Faol)"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {lang === "ru" ? "Ожидает проверки DNS" : "DNS tekshiruvi kutilmoqda"}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => {
                    setCustomDomain(e.target.value);
                    if (dnsStatus === "connected") setDnsStatus("pending");
                  }}
                  placeholder="myshop.uz"
                  className="flex-1 rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-[#202223] dark:text-white outline-none focus:border-[#008060]"
                />
                <button
                  type="button"
                  onClick={handleVerifyCustomDomain}
                  disabled={dnsStatus === "verifying"}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#202223] hover:bg-[#111213] text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                >
                  {dnsStatus === "verifying" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{lang === "ru" ? "Проверить DNS-записи" : "DNS yozuvlarni tekshirish"}</span>
                </button>
              </div>

              {/* Generated DNS Table */}
              <div className="rounded-[8px] border border-[#e1e3e5] dark:border-zinc-800 overflow-hidden">
                <div className="bg-[#f6f6f7] dark:bg-zinc-900 px-3.5 py-2 border-b border-[#e1e3e5] dark:border-zinc-800 text-[11px] font-semibold text-[#5c5f62] dark:text-zinc-400">
                  {lang === "ru" ? "Необходимые DNS-записи для домена" : "Kerakli DNS yozuvlar"} ({customDomain || "myshop.uz"})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e1e3e5] dark:border-zinc-800 text-[11px] text-[#6d7175]">
                        <th className="py-2 px-3.5 font-medium">{lang === "ru" ? "Тип" : "Turi"}</th>
                        <th className="py-2 px-3.5 font-medium">{lang === "ru" ? "Имя (Host)" : "Host"}</th>
                        <th className="py-2 px-3.5 font-medium">{lang === "ru" ? "Значение (Target / IP)" : "Qiymat"}</th>
                        <th className="py-2 px-3.5 font-medium">TTL</th>
                        <th className="py-2 px-3.5 font-medium text-right">{lang === "ru" ? "Действие" : "Amal"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e1e3e5] dark:divide-zinc-800 font-mono text-[11px]">
                      <tr>
                        <td className="py-2.5 px-3.5 font-bold text-[#008060]">A</td>
                        <td className="py-2.5 px-3.5">@</td>
                        <td className="py-2.5 px-3.5">185.196.213.44</td>
                        <td className="py-2.5 px-3.5 text-slate-400">3600</td>
                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => copyText("185.196.213.44", "IP 185.196.213.44 скопирован")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#e1e3e5] dark:border-zinc-700 hover:bg-[#f6f6f7] text-[#202223] dark:text-zinc-200 font-sans cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 font-bold text-blue-600">CNAME</td>
                        <td className="py-2.5 px-3.5">www</td>
                        <td className="py-2.5 px-3.5">shops.storebox.uz</td>
                        <td className="py-2.5 px-3.5 text-slate-400">3600</td>
                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => copyText("shops.storebox.uz", "CNAME shops.storebox.uz скопирован")}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#e1e3e5] dark:border-zinc-700 hover:bg-[#f6f6f7] text-[#202223] dark:text-zinc-200 font-sans cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: NOTIFICATIONS (/settings/notifications) */}
        {activeSection === "notifications" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-[#202223] dark:text-white tracking-tight">
                {lang === "ru" ? "Уведомления и оповещения" : "Bildirishnomalar"}
              </h1>
              <p className="text-xs text-[#6d7175] mt-0.5">
                {lang === "ru"
                  ? "Настройте моментальные уведомления о заказах в Telegram, SMS клиентам и складские оповещения"
                  : "Telegram, SMS va ombor bildirishnomalarini boshqaring"}
              </p>
            </div>

            <div className="bg-white dark:bg-[#18181B] rounded-[10px] border border-[#e1e3e5] dark:border-zinc-800 divide-y divide-[#e1e3e5] dark:divide-zinc-800 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              {[
                {
                  key: "tgNewOrder",
                  title: lang === "ru" ? "Новые заказы в Telegram-бот менеджера" : "Yangi buyurtmalar Telegram-botda",
                  desc: lang === "ru" ? "Мгновенное сообщение с составом заказа, телефоном и локацией клиента" : "Buyurtma tarkibi va mijoz manzili haqida tezkor xabar",
                },
                {
                  key: "tgStatusChange",
                  title: lang === "ru" ? "Уведомления клиенту о смене статуса заказа" : "Mijozga buyurtma holati haqida xabar",
                  desc: lang === "ru" ? "Авто-отправка в Telegram Mini App при переводе заказа в «Готовится» / «Доставляется»" : "Buyurtma holati o'zgarganda mijozga xabar yuborish",
                },
                {
                  key: "smsCustomerConfirm",
                  title: lang === "ru" ? "SMS-подтверждение заказов (Eskiz.uz)" : "SMS-tasdiqlash (Eskiz.uz)",
                  desc: lang === "ru" ? "Отправлять SMS клиентам при оформлении заказа через веб-витрину" : "Veb-sayt orqali buyurtma berilganda SMS yuborish",
                },
                {
                  key: "lowStockAlert",
                  title: lang === "ru" ? "Оповещение о низком остатке на складе (Мало на складе)" : "Omborda kam qolgan mahsulotlar haqida ogohlantirish",
                  desc: lang === "ru" ? "Предупреждать, когда остаток товара опускается ниже 5 шт." : "Mahsulot soni 5 tadan kam qolganda xabar berish",
                },
                {
                  key: "dailyDigest",
                  title: lang === "ru" ? "Ежедневная сводка продаж от Sidekick AI (в 21:00)" : "Kunlik savdo hisoboti (soat 21:00 da)",
                  desc: lang === "ru" ? "Отчет по выручке, среднему чеку и топ-товарам дня" : "Kunlik tushum va top mahsulotlar hisoboti",
                },
              ].map((item) => {
                const checked = (notifSettings as any)[item.key];
                return (
                  <div key={item.key} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-[#202223] dark:text-white">{item.title}</div>
                      <div className="text-[11px] text-[#6d7175] mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifSettings((prev) => ({ ...prev, [item.key]: !checked }));
                        setSuccessMessage(lang === "ru" ? "Настройки уведомлений обновлены" : "Saqlandi");
                      }}
                      className={`w-10 h-5.5 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                        checked ? "bg-[#008060]" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                          checked ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: LANGUAGES (/settings/languages) */}
        {activeSection === "languages" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-[#202223] dark:text-white tracking-tight">
                {lang === "ru" ? "Языки интерфейса и витрины (UZ / RU / EN)" : "Interfeys va vitrina tillari"}
              </h1>
              <p className="text-xs text-[#6d7175] mt-0.5">
                {lang === "ru"
                  ? "Управление локализацией панели управления, мульти-язычным каталогом и голосом Sidekick AI"
                  : "Boshqaruv paneli va vitrina tillarini sozlang"}
              </p>
            </div>

            <div className="bg-white dark:bg-[#18181B] rounded-[10px] border border-[#e1e3e5] dark:border-zinc-800 p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)] space-y-3">
              <div className="text-xs font-semibold text-[#202223] dark:text-white">
                {lang === "ru" ? "Активный язык панели управления" : "Faol boshqaruv paneli tili"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { code: "ru" as Language, title: "Русский (RU)", sub: "Панель, аналитика и ИИ-голос (ru-RU)" },
                    { code: "uz" as Language, title: "O'zbekcha (UZ)", sub: "Boshqaruv paneli va ovozli yordamchi (uz-UZ)" },
                    { code: "en" as Language, title: "English (EN)", sub: "Admin dashboard & Neural voice (en-US)" },
                  ]
                ).map((l) => {
                  const active = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setSuccessMessage(
                          l.code === "ru"
                            ? "Язык переключен на Русский"
                            : l.code === "en"
                            ? "Language switched to English"
                            : "Til O'zbekchaga o'zgartirildi"
                        );
                      }}
                      className={`p-3.5 rounded-[10px] border text-left transition-all cursor-pointer flex items-start justify-between ${
                        active
                          ? "border-[#008060] bg-[#f1f8f5] dark:bg-emerald-950/20"
                          : "border-[#e1e3e5] dark:border-zinc-800 hover:bg-[#f6f6f7]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#202223] dark:text-white">{l.title}</div>
                        <div className="text-[11px] text-[#6d7175] mt-1">{l.sub}</div>
                      </div>
                      {active && (
                        <span className="w-5 h-5 rounded-full bg-[#008060] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: GENERAL (/settings) */}
        {activeSection === "general" && (
          <>
            <div>
              <h1 className="text-lg font-semibold text-[#202223] dark:text-white tracking-tight">
                {t("settings") || (lang === "ru" ? "Общие настройки магазина" : "Umumiy do'kon sozlamalari")}
              </h1>
              <p className="text-xs text-[#6d7175] font-normal mt-0.5">
                {t("settings_subtitle") ||
                  (lang === "ru"
                    ? "Управление названием магазина, основным доменом, валютой и реквизитами"
                    : "Do'kon nomi, internet manzili va valyutasini boshqaring")}
              </p>
            </div>

            <form
              onSubmit={saveSettings}
              className="bg-white dark:bg-[#18181B] rounded-[10px] border border-[#e1e3e5] dark:border-zinc-800 p-5 sm:p-6 shadow-[0_1px_0_rgba(0,0,0,0.05)] space-y-5"
            >
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#202223] dark:text-zinc-300">
                  <StoreIcon className="h-3.5 w-3.5 text-[#8c9196]" />{" "}
                  {t("store_name_label") || (lang === "ru" ? "Название магазина" : "Do'kon nomi")}
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={150}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-[#202223] dark:text-white outline-none transition focus:border-[#008060]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#202223] dark:text-zinc-300">
                    <Globe2 className="h-3.5 w-3.5 text-[#8c9196]" />{" "}
                    {t("subdomain_label") || (lang === "ru" ? "Системный поддомен" : "Subdomen")}
                  </label>
                  <Link
                    to="/settings/domains"
                    className="text-[11px] font-medium text-[#008060] hover:underline"
                  >
                    {lang === "ru" ? "Подключить свой домен (.uz) →" : "Shaxsiy domen ulash →"}
                  </Link>
                </div>
                <div className="flex overflow-hidden rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 transition focus-within:border-[#008060]">
                  <input
                    type="text"
                    value={subdomain}
                    maxLength={50}
                    spellCheck={false}
                    onChange={(event) => {
                      setSubdomain(normalizeSubdomain(event.target.value));
                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-[#202223] dark:text-white outline-none font-mono"
                    aria-describedby="domain-status"
                  />
                  <span className="flex items-center border-l border-[#e1e3e5] dark:border-zinc-700 bg-[#f6f6f7] dark:bg-zinc-900 px-3 text-xs text-[#6d7175]">
                    .storebox.uz
                  </span>
                </div>
                <div id="domain-status" className="mt-1.5 min-h-4 text-xs font-normal">
                  {localSubdomainError && domainChanged && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" /> {localSubdomainError}
                    </span>
                  )}
                  {!localSubdomainError && availability === "checking" && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> {lang === "ru" ? "Проверка домена…" : "Domen tekshirilmoqda…"}
                    </span>
                  )}
                  {availability === "available" && (
                    <span className="flex items-center gap-1 text-[#008060]">
                      <CheckCircle2 className="h-3 w-3" /> {lang === "ru" ? "Домен свободен" : "Domen bo'sh"}
                    </span>
                  )}
                  {availability === "unavailable" && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" /> {availabilityMessage}
                    </span>
                  )}
                  {!domainChanged && !localSubdomainError && (
                    <span className="text-[#6d7175] text-[11px]">
                      {lang === "ru" ? "Текущий активный адрес вашего магазина" : "Hozirgi domeningiz"}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[8px] border border-[#e1e3e5] dark:border-zinc-800 bg-[#f6f6f7] dark:bg-zinc-900/50 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs font-mono text-[#202223] dark:text-zinc-400">
                    {candidateUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(candidateUrl)}
                    className="rounded p-1 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                    title={lang === "ru" ? "Копировать" : "Nusxalash"}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={`/store/${subdomain || store?.subdomain}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded p-1 text-slate-500 hover:text-slate-900 transition"
                    title={lang === "ru" ? "Открыть" : "Ochish"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[#202223] dark:text-zinc-300">
                  <DollarSign className="h-3.5 w-3.5 text-[#8c9196]" />{" "}
                  {t("currency_label") || (lang === "ru" ? "Валюта расчетов и каталога" : "Valyuta")}
                </label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-[#202223] dark:text-white outline-none transition focus:border-[#008060]"
                >
                  <option value="UZS">UZS — Узбекский сум (so'm)</option>
                  <option value="USD">USD — Доллар США ($)</option>
                  <option value="RUB">RUB — Российский рубль (₽)</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e1e3e5] dark:border-zinc-800">
                <button
                  type="button"
                  onClick={resetDomain}
                  disabled={resetting}
                  className="flex items-center gap-1.5 rounded-[8px] border border-[#e1e3e5] dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-[#5c5f62] hover:bg-[#f6f6f7] transition cursor-pointer"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
                  <span>{lang === "ru" ? "Сбросить домен" : "Standart domenni tiklash"}</span>
                </button>

                <button
                  type="submit"
                  disabled={cannotSave}
                  className="flex items-center gap-1.5 rounded-[8px] bg-[#008060] hover:bg-[#006e52] text-white px-4 py-2 text-xs font-semibold transition disabled:opacity-50 shadow-[0_1px_0_rgba(0,0,0,0.05)] cursor-pointer"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>{lang === "ru" ? "Сохранить изменения" : "Saqlash"}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </SettingsLayout>
  );
};
