import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  CreditCard,
  DollarSign,
  Truck,
  MapPin,
  Bot,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { SettingsLayout } from "./SettingsLayout";

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
  return "Saqlashda xatolik yuz berdi. Qayta urinib ko`ring.";
};

export const SettingsPage: React.FC = () => {
  const { store, t, lang, refreshMe } = useAuth();
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [currency, setCurrency] = useState("UZS");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setName(store?.name || "");
    setSubdomain(store?.subdomain || "");
    setCurrency(store?.currency || "UZS");
  }, [store]);

  const domainChanged = Boolean(store && subdomain !== store.subdomain);
  const hasChanges = Boolean(
    store &&
      (name.trim() !== store.name ||
        domainChanged ||
        currency !== store.currency),
  );
  const localSubdomainError = useMemo(() => {
    if (subdomain.length < 3) return "Kamida 3 ta belgi kiriting";
    if (subdomain.endsWith("-")) return "Subdomen tire bilan tugamasligi kerak";
    return "";
  }, [subdomain]);

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
          setAvailabilityMessage("Tekshirishning imkoni bo`lmadi");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [domainChanged, localSubdomainError, subdomain]);

  const candidateUrl = `https://${subdomain || "do-kon"}.storebox.uz`;
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
        domainChanged
          ? "Sozlamalar saqlandi. Yangi domen hozir ishlaydi."
          : "Sozlamalar saqlandi.",
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
      `“${store.subdomain}.storebox.uz” manzilini standart manzilga almashtirasizmi? Eski havola ishlamay qoladi.`,
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
        `Standart domen tiklandi: ${response.data.store.subdomain}.storebox.uz`,
      );
    } catch (error) {
      setErrorMessage(getApiMessage(error));
    } finally {
      setResetting(false);
    }
  };

  const copyDomain = async () => {
    await navigator.clipboard.writeText(candidateUrl);
    setSuccessMessage("Domen nusxalandi.");
  };

  return (
    <SettingsLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {t("settings") || (lang === "ru" ? "Основные настройки" : "Asosiy sozlamalar")}
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            {t("settings_subtitle") || (lang === "ru" ? "Управление названием магазина, доменом и валютой" : "Do'kon nomi, internet manzili va valyutasini boshqaring")}
          </p>
        </div>

      {(successMessage || errorMessage) && (
        <div
          className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs font-normal ${
            errorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
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

      <form
        onSubmit={saveSettings}
        className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
            <StoreIcon className="h-3.5 w-3.5 text-slate-400" /> {t("store_name_label") || (lang === "ru" ? "Название магазина" : "Do'kon nomi")}
          </label>
          <input
            type="text"
            value={name}
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none transition focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
            <Globe2 className="h-3.5 w-3.5 text-slate-400" /> {t("subdomain_label") || (lang === "ru" ? "Поддомен" : "Subdomen")}
          </label>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition focus-within:border-slate-900">
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
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-mono"
              aria-describedby="domain-status"
            />
            <span className="flex items-center border-l border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 px-3 text-xs text-slate-500">
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
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> {lang === "ru" ? "Домен свободен" : "Domen bo'sh"}
              </span>
            )}
            {availability === "unavailable" && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" /> {availabilityMessage}
              </span>
            )}
            {!domainChanged && !localSubdomainError && (
              <span className="text-slate-400 text-[11px]">{lang === "ru" ? "Текущий домен вашего магазина" : "Hozirgi domeningiz"}</span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs font-mono text-slate-600 dark:text-zinc-400">
              {candidateUrl}
            </span>
            <button
              type="button"
              onClick={copyDomain}
              className="rounded p-1 text-slate-500 hover:text-slate-900 transition"
              title={lang === "ru" ? "Копировать" : "Nusxalash"}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <a
              href={candidateUrl}
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
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" /> {t("currency_label") || (lang === "ru" ? "Основная валюта" : "Valyuta")}
          </label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none transition focus:border-slate-900"
          >
            <option value="UZS">UZS (O'zbek so'mi)</option>
            <option value="USD">USD (AQSh dollari)</option>
            <option value="RUB">RUB (Российский рубль)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={resetDomain}
            disabled={resetting}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-normal text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>{lang === "ru" ? "Сбросить домен" : "Standart domenni tiklash"}</span>
          </button>

          <button
            type="submit"
            disabled={cannotSave}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-black text-white px-4 py-2 text-xs font-medium transition disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{lang === "ru" ? "Сохранить изменения" : "Saqlash"}</span>
          </button>
        </div>
      </form>
    </div>
  </SettingsLayout>
);
};
