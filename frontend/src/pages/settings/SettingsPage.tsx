import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

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
  const { store, t, refreshMe } = useAuth();
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t("settings") || "Sozlamalar"}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Do`kon nomi, internet manzili va valyutasini boshqaring
        </p>
      </div>

      {(successMessage || errorMessage) && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
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
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
            <StoreIcon className="h-4 w-4 text-slate-400" /> Do`kon nomi
          </label>
          <input
            type="text"
            value={name}
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
            <Globe2 className="h-4 w-4 text-slate-400" /> Subdomen
          </label>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-slate-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100">
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
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-800 outline-none"
              aria-describedby="domain-status"
            />
            <span className="flex items-center border-l border-slate-200 bg-slate-100 px-3 text-xs font-bold text-slate-500 sm:text-sm">
              .storebox.uz
            </span>
          </div>
          <div id="domain-status" className="mt-2 min-h-5 text-xs font-semibold">
            {localSubdomainError && domainChanged && (
              <span className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="h-3.5 w-3.5" /> {localSubdomainError}
              </span>
            )}
            {!localSubdomainError && availability === "checking" && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Domen tekshirilmoqda…
              </span>
            )}
            {availability === "available" && (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Domen bo`sh va foydalanishga tayyor
              </span>
            )}
            {availability === "unavailable" && (
              <span className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="h-3.5 w-3.5" /> {availabilityMessage}
              </span>
            )}
            {!domainChanged && !localSubdomainError && (
              <span className="text-slate-400">Hozirgi domeningiz</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-xs font-mono font-semibold text-slate-600">
              {candidateUrl}
            </span>
            <button
              type="button"
              onClick={copyDomain}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
              title="Nusxalash"
            >
              <Copy className="h-4 w-4" />
            </button>
            {!domainChanged && store?.storefront_url && (
              <a
                href={store.storefront_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                title="Saytni ochish"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Domenni saqlaganingizdan keyin yangi manzil darhol ishlaydi. Eski havola ochilmaydi.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Valyuta</label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
          >
            <option value="UZS">UZS — O`zbek so`mi</option>
            <option value="USD">USD — AQSh dollari</option>
            <option value="RUB">RUB — Rossiya rubli</option>
          </select>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={resetDomain}
            disabled={saving || resetting}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Standart domenni tiklash
          </button>
          <button
            type="submit"
            disabled={cannotSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Saqlash
          </button>
        </div>
      </form>
    </div>
  );
};
