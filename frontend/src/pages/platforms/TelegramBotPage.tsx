import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Sparkles,
  Zap,
  Send,
  RefreshCw,
  Unlink,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
  QrCode
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface TelegramStatus {
  is_connected: boolean;
  bot_username?: string;
  bot_token?: string;
  button_name?: string;
  welcome_message?: string;
  web_app_url?: string;
  chat_id?: string;
  created_at?: string;
  subdomain?: string;
  store_name?: string;
}

export const TelegramBotPage: React.FC = () => {
  const { store, t, lang: language } = useAuth();
  const queryClient = useQueryClient();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sub-tabs: 'settings' | 'actions' | 'qr'
  const [activeTab, setActiveTab] = useState<"settings" | "actions" | "qr">("settings");
  const [changeBotOpen, setChangeBotOpen] = useState(false);

  // Form states
  const [tokenInput, setTokenInput] = useState("");
  const [changeTokenInput, setChangeTokenInput] = useState("");
  const [buttonName, setButtonName] = useState("Do'kon");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  // Action states
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [settingUpMenu, setSettingUpMenu] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // QR canvas state
  const [qriousReady, setQriousReady] = useState(false);

  // 1. Fetch Telegram Status
  const { data: status, isLoading } = useQuery<TelegramStatus>({
    queryKey: ["telegram-status"],
    queryFn: async () => {
      const res = await api.get("/telegram/status/");
      return res.data;
    },
  });

  // Populate state when status loads
  useEffect(() => {
    if (status) {
      setTokenInput(status.bot_token || "");
      setButtonName(status.button_name || "Do'kon");
      setWelcomeMessage(status.welcome_message || "");
    }
  }, [status]);

  // Load QRious library for QR rendering
  useEffect(() => {
    if ((window as any).QRious) {
      setQriousReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
    script.async = true;
    script.onload = () => setQriousReady(true);
    document.head.appendChild(script);
  }, []);

  // Draw QR code whenever activeTab is QR and status is connected
  useEffect(() => {
    if (activeTab === "qr" && status?.is_connected && status?.bot_username && canvasRef.current && qriousReady) {
      const QRious = (window as any).QRious;
      if (QRious) {
        new QRious({
          element: canvasRef.current,
          value: `https://t.me/${status.bot_username}`,
          size: 320,
          background: "#FFFFFF",
          foreground: "#0F172A",
          level: "H"
        });
      }
    }
  }, [activeTab, status, qriousReady]);

  // Handle Save / Connect
  const handleSave = async (customToken?: string) => {
    const tokenToSave = customToken !== undefined ? customToken : tokenInput;
    if (!tokenToSave.trim()) {
      setMsg({ type: "error", text: "Iltimos, bot tokenini kiriting!" });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await api.post("/telegram/save/", {
        telegram_bot_token: tokenToSave.trim(),
        telegram_button_name: buttonName.trim(),
        telegram_welcome_message: welcomeMessage.trim()
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data.message || "Bot muvaffaqiyatli saqlandi!" });
        setChangeBotOpen(false);
        setChangeTokenInput("");
        queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Botni ulashda xatolik." });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.error || "Bot tokeni yaroqsiz yoki serverga ulanib bo'lmadi."
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm("Haqiqatan ham botni uzmoqchimisiz?")) return;

    setDisconnecting(true);
    setMsg(null);
    try {
      const res = await api.post("/telegram/disconnect/");
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data.message || "Bot uzildi." });
        queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Botni uzishda xatolik yuz berdi." });
    } finally {
      setDisconnecting(false);
    }
  };

  // Handle Setup TMA Menu Button
  const handleSetupMenu = async () => {
    setSettingUpMenu(true);
    setMsg(null);
    try {
      const res = await api.post("/telegram/setup-menu/");
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data.message || "TMA menyu tugmasi sozlandi!" });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Menyu tugmasini sozlashda xatolik." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Menyu tugmasini sozlashda xatolik." });
    } finally {
      setSettingUpMenu(false);
    }
  };

  // Handle Test Bot Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setMsg(null);
    try {
      const res = await api.post("/telegram/test/");
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data.message || "Telegram bilan aloqa muvaffaqiyatli!" });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Telegram bilan aloqa o'rnatilmadi." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Aloqani tekshirishda xatolik yuz berdi." });
    } finally {
      setTestingConnection(false);
    }
  };

  // Copy TMA URL to Clipboard
  const handleCopyUrl = () => {
    if (!status?.web_app_url) return;
    navigator.clipboard.writeText(status.web_app_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Download QR Code
  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${status?.bot_username || "telegram-bot"}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const isConnected = status?.is_connected;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202223] dark:text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-[#202223] dark:text-white" />
            <span>{t("telegram_bot_title") || "Telegram Bot & Mini App (TMA)"}</span>
            {isConnected ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#bbf7d0] text-[#14532d] text-[11px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span>
                <span>{t("telegram_active_badge") || "Активен • Web App включен"}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                {t("telegram_not_connected") || "Не подключен"}
              </span>
            )}
          </h1>
          <p className="text-xs text-[#6d7175] mt-1">
            {t("telegram_bot_subtitle") || "Принимайте заказы напрямую внутри Telegram через встроенное веб-приложение Mini App и чат-бота."}
          </p>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 shadow-2xs ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200/80 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Settings & Bot Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* NOT CONNECTED STATE: BOT CREATION GUIDE & FORM */}
          {!isConnected ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                  <Bot className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">{t("telegram_create_guide_title")}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("telegram_create_guide_desc")}
              </p>
            </div>
          </div>

          {/* 5-Step BotFather Guide */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs space-y-3">
            <div className="font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>{t("telegram_guide_bf_heading")}</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 font-medium leading-relaxed">
              <li>
                {t("telegram_guide_step1_prefix")}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-600 hover:underline"
                >
                  @BotFather
                </a>
                {t("telegram_guide_step1_suffix")}
              </li>
              <li>
                {t("telegram_guide_step2").replace("{name}", store?.name || (language === "ru" ? "Мой Магазин" : language === "en" ? "My Store" : "Mening Do'konim"))}
              </li>
              <li>
                {t("telegram_guide_step3_prefix")}
                <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold text-sky-700">_bot</code>
                {language === "ru" ? ", например: " : language === "en" ? ", e.g.: " : ", masalan: "}
                <code>{store?.subdomain || "magazin"}_bot</code>
                {t("telegram_guide_step3_suffix")}
              </li>
              <li>
                {t("telegram_guide_step4")}
              </li>
              <li>
                {t("telegram_guide_step5")}
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("telegram_token_input_label")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={t("telegram_token_placeholder")}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand shadow-2xs"
              />
              <span className="text-[11px] text-slate-400 block mt-1.5">
                {t("telegram_token_hint")}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`w-4 h-4 text-amber-400 ${saving ? "animate-spin" : ""}`} />
                <span>{saving ? t("telegram_connecting") : t("telegram_save_and_create_btn")}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CONNECTED STATE */
        <div className="space-y-6">
          {/* CONNECTED BOT CARD */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Bot className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900">
                    @{status?.bot_username}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{t("telegram_active_badge")}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t("telegram_created_label")} {status?.created_at ? new Date(status.created_at).toLocaleString() : t("telegram_just_now")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <a
                href={`https://t.me/${status?.bot_username}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{t("telegram_open_bot")}</span>
              </a>

              <button
                type="button"
                onClick={() => setChangeBotOpen(!changeBotOpen)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t("telegram_change_bot")}</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{disconnecting ? t("telegram_disconnecting") : t("telegram_disconnect")}</span>
              </button>
            </div>
          </div>

          {/* CHANGE BOT ACCORDION */}
          {changeBotOpen && (
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-sm">
                  <AlertCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>{t("telegram_change_bot_title")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChangeBotOpen(false)}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t("telegram_change_bot_desc")}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">{t("telegram_change_bot_label")}</label>
                  <input
                    type="text"
                    value={changeTokenInput}
                    onChange={(e) => setChangeTokenInput(e.target.value)}
                    placeholder={t("telegram_change_bot_placeholder")}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSave(changeTokenInput)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? t("telegram_connecting") : t("telegram_change_bot_btn")}
                </button>
              </div>
            </div>
          )}

          {/* TELEGRAM SUB TABS */}
          <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white text-slate-900 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("telegram_subtab_settings")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("actions")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "actions"
                  ? "bg-white text-slate-900 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("telegram_subtab_actions")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "qr"
                  ? "bg-white text-slate-900 shadow-xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("telegram_subtab_qr")}
            </button>
          </div>

          {/* SUB TAB 1: BOT SOZLAMALARI */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 max-w-3xl">
              {/* Active WebApp URL Display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">
                    Telegram Web App (TMA) URL
                  </span>
                  <span className="font-mono text-brand font-black text-xs break-all">
                    {status?.web_app_url || `https://${status?.subdomain || "demo"}.storebox.uz/tma/`}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={status?.web_app_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t("telegram_open_in_web")}</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? t("telegram_copied") : t("telegram_copy")}</span>
                  </button>
                </div>
              </div>

              {/* Bot Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">{t("telegram_token_input_label")}</label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="123456:ABC-DEF1234ghIkl..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {t("telegram_token_active_hint")}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t("telegram_menu_btn_field")}
                  </label>
                  <input
                    type="text"
                    value={buttonName}
                    onChange={(e) => setButtonName(e.target.value)}
                    placeholder={t("telegram_menu_btn_placeholder")}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {t("telegram_menu_btn_hint")}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t("telegram_welcome_msg_field")}
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    placeholder={t("telegram_welcome_msg_placeholder")}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {t("telegram_welcome_msg_hint")}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? t("telegram_saving") : t("telegram_save_changes_btn")}
                  </button>
                </div>
              </div>

              {/* TMA Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSetupMenu}
                  disabled={settingUpMenu}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{settingUpMenu ? t("telegram_setting_up") : t("telegram_setup_tma_menu")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{testingConnection ? t("telegram_testing") : t("telegram_test_connection")}</span>
                </button>
              </div>
            </div>
          )}

          {/* SUB TAB 2: AMALLAR (COMMANDS) */}
          {activeTab === "actions" && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-4 max-w-3xl">
              <h3 className="font-semibold text-base text-slate-900">{t("telegram_actions_title")}</h3>
              <p className="text-xs text-slate-500">
                {t("telegram_actions_desc")}
              </p>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {t("telegram_cmd_menu_name").replace("{name}", status?.button_name || t("telegram_menu_btn_placeholder"))}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t("telegram_cmd_menu_desc")}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium">
                    {t("telegram_badge_active")}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{t("telegram_cmd_lang_name")}</div>
                    <div className="text-[11px] text-slate-400">
                      {t("telegram_cmd_lang_desc")}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium">
                    {t("telegram_badge_active")}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{t("telegram_cmd_chat_name")}</div>
                    <div className="text-[11px] text-slate-400">
                      {t("telegram_cmd_chat_desc")}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium">
                    {t("telegram_badge_active")}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{t("telegram_cmd_orders_name")}</div>
                    <div className="text-[11px] text-slate-400">
                      {t("telegram_cmd_orders_desc")}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium">
                    {t("telegram_badge_active")}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{t("telegram_cmd_about_name")}</div>
                    <div className="text-[11px] text-slate-400">
                      {t("telegram_cmd_about_desc")}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {t("telegram_badge_active")}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{t("telegram_cmd_contacts_name")}</div>
                    <div className="text-[11px] text-slate-400">
                      {t("telegram_cmd_contacts_desc")}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {t("telegram_badge_active")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUB TAB 3: QR KOD */}
          {activeTab === "qr" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900">{t("telegram_qr_title")}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("telegram_qr_desc")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("telegram_qr_download")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t("telegram_qr_print")}</span>
                  </button>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-4">
                <canvas
                  ref={canvasRef}
                  width={220}
                  height={220}
                  className="w-[220px] h-[220px] rounded-2xl bg-white p-3 shadow-sm"
                />
                <div className="text-center">
                  <div className="font-mono font-black text-sm text-slate-800">
                    https://t.me/{status?.bot_username}
                  </div>
                  <a
                    href={`https://t.me/${status?.bot_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:text-sky-700 font-bold text-xs hover:underline mt-1.5 inline-flex items-center gap-1"
                  >
                    <span>{t("telegram_qr_open_in_tg")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>

        {/* RIGHT COLUMN (5 cols): Live Interactive iPhone Telegram Mini App & Bot Preview */}
        <div className="lg:col-span-5 space-y-5 sticky top-20">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#202223] dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0088cc]" />
                  <span>Предпросмотр в Telegram (iOS)</span>
                </h3>
                <p className="text-[11px] text-[#6d7175] mt-0.5">
                  Живое отображение вашего бота и кнопки витрины
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#bbf7d0] text-[#14532d] text-[10px] font-bold">
                Live Preview
              </span>
            </div>

            {/* iPhone Telegram Mockup */}
            <div className="mx-auto w-full max-w-[310px] rounded-[34px] border-[7px] border-[#141416] bg-[#e6ebee] shadow-xl overflow-hidden flex flex-col">
              {/* iOS Notch + Telegram Header */}
              <div className="bg-[#517da2] text-white px-4 pt-3 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#202223] text-[#c8ff6a] flex items-center justify-center font-bold text-xs shadow-xs">
                    {(store?.name || "SB").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {store?.name || "StoreBox Shop"}
                    </div>
                    <div className="text-[10px] text-sky-100">
                      @{status?.bot_username || `${store?.subdomain || "storebox"}_bot`} • бот
                    </div>
                  </div>
                </div>
                <Bot className="w-4 h-4 text-white/80" />
              </div>

              {/* Telegram Chat Wallpaper Area */}
              <div className="p-3.5 space-y-3 min-h-[290px] flex flex-col justify-end bg-gradient-to-b from-[#dbe7f0] via-[#d2e2ec] to-[#c8d9e6]">
                {/* Bot Welcome Message Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs max-w-[90%] space-y-1.5 text-[11.5px] text-[#202223]">
                  <div className="font-bold text-[#0088cc] text-[11px]">
                    {store?.name || "StoreBox"}
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">
                    {welcomeMessage.trim() ||
                      `👋 Добро пожаловать в официальный магазин «${
                        store?.name || "StoreBox"
                      }»!\n\nНажмите кнопку «${
                        buttonName || "Магазин"
                      }» ниже, чтобы открыть каталог, выбрать товары и оформить доставку за 30 секунд.`}
                  </p>
                  <div className="text-[9px] text-slate-400 text-right">14:25 ✓✓</div>
                </div>

                {/* Inline Mini App Card */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-2.5 shadow-xs border border-white max-w-[90%] space-y-2">
                  <div className="h-24 rounded-xl bg-gradient-to-r from-[#141416] via-[#202223] to-[#0f172a] p-3 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#c8ff6a] text-[#141416]">
                        Telegram Mini App
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">● Online</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold">{store?.name || "StoreBox"}</div>
                      <div className="text-[10px] text-zinc-400">
                        Оплата Click • Payme • Uzum • Доставка
                      </div>
                    </div>
                  </div>
                  <a
                    href={status?.web_app_url || `/?store_id=${store?.id || ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Открыть {buttonName || "Магазин"}</span>
                  </a>
                </div>
              </div>

              {/* Telegram Bottom Input Bar with WebApp Menu Button */}
              <div className="bg-white px-3 py-2.5 border-t border-slate-200 flex items-center gap-2">
                <a
                  href={status?.web_app_url || `/?store_id=${store?.id || ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-[#0088cc] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  <span>🛍️ {buttonName || "Магазин"}</span>
                </a>
                <div className="flex-1 text-[11px] text-slate-400 truncate">
                  Сообщение...
                </div>
                <Send className="w-4 h-4 text-[#0088cc] shrink-0" />
              </div>
            </div>

            {/* Quick Stats Footer inside Right Column */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800">
                <div className="text-[10px] text-[#6d7175]">Конверсия Mini App</div>
                <div className="text-sm font-bold text-[#202223] dark:text-white mt-0.5">
                  6.4% (+1.8%)
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800">
                <div className="text-[10px] text-[#6d7175]">Оплаты в Telegram</div>
                <div className="text-sm font-bold text-[#16a34a] mt-0.5">
                  Click • Payme • Нал
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
