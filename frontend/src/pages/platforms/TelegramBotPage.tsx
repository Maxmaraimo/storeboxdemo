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
  const { store } = useAuth();
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
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-sky-500" />
            <span>Telegram Bot & Mini App (TMA)</span>
            {isConnected ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Faol • Web App yoqilgan</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black">
                Ulanmagan
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Do'koningiz uchun Telegram bot va Mini App integratsiyasi orqali buyurtmalar qabul qiling.
          </p>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
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

      {/* NOT CONNECTED STATE: BOT CREATION GUIDE & FORM */}
      {!isConnected ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Telegram bot yaratish</h3>
              <p className="text-xs text-slate-500 mt-1">
                Telegram orqali buyurtma qabul qilish va Telegram Web App (TMA) do'koningiz avtomatik ishga tushishi uchun bot tokenini kiriting.
              </p>
            </div>
          </div>

          {/* 5-Step BotFather Guide */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs space-y-3">
            <div className="font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>@BotFather orqali bot tokenini olish tartibi:</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 font-medium leading-relaxed">
              <li>
                Telegramda{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-600 hover:underline"
                >
                  @BotFather
                </a>{" "}
                ga o'ting va <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold text-sky-700">/newbot</code> buyrug'ini yuboring.
              </li>
              <li>
                Botingiz nomini kiriting (masalan: <b>{store?.name || "Mening Do'konim"}</b>).
              </li>
              <li>
                Botingiz uchun username kiriting (oxiri <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold text-sky-700">_bot</code> bilan tugashi shart, masalan: <code>{store?.subdomain || "magazin"}_bot</code>).
              </li>
              <li>
                @BotFather sizga bergan uzun <b>HTTP API Token</b> nusxasini oling.
              </li>
              <li>
                Olingan tokenni quyidagi maydonga joylashtiring va <b>"Saqlash va Web App yaratish"</b> tugmasini bosing!
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bot Token <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Masalan: 8873156579:AAHl8Vrh7kuJbFhqjXBSZ4ZHImfizziBwm8"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand shadow-2xs"
              />
              <span className="text-[11px] text-slate-400 block mt-1.5">
                Hech qanday chat ID yoki murakkab sozlama shart emas — tizim botni avtomatik aniqlaydi va Web App ni o'rnatadi.
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
                <span>{saving ? "Ulanmoqda..." : "Saqlash va Web App yaratish"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CONNECTED STATE */
        <div className="space-y-6">
          {/* CONNECTED BOT CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900">
                    @{status?.bot_username}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Faol • Web App yoqilgan</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Yaratilgan: {status?.created_at ? new Date(status.created_at).toLocaleString() : "Hozirgina"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <a
                href={`https://t.me/${status?.bot_username}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Botni ochish</span>
              </a>

              <button
                type="button"
                onClick={() => setChangeBotOpen(!changeBotOpen)}
                className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Boshqa bot ulash</span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-2 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{disconnecting ? "Uzilmoqda..." : "Uzish"}</span>
              </button>
            </div>
          </div>

          {/* CHANGE BOT ACCORDION */}
          {changeBotOpen && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Yangi bot ulash yoki tokenni almashtirish</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChangeBotOpen(false)}
                  className="text-amber-700 font-bold hover:text-amber-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-amber-800">
                Yangi @BotFather tokenini kiritsangiz, platforma eski bot o'rniga yangi botni ulaydi va Web App ni unga sozlaydi.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Yangi Bot Token</label>
                  <input
                    type="text"
                    value={changeTokenInput}
                    onChange={(e) => setChangeTokenInput(e.target.value)}
                    placeholder="Yangi bot tokenini kiriting"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-300 text-xs font-mono font-bold focus:outline-none focus:border-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSave(changeTokenInput)}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Ulanmoqda..." : "Yangi botni ulash"}
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
              Bot sozlamalari
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
              Bot amallari & buyruqlari
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
              QR kod
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
                    <span>Vebda ochish</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? "Nusxalandi!" : "Nusxa olish"}</span>
                  </button>
                </div>
              </div>

              {/* Bot Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bot Token</label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="123456:ABC-DEF1234ghIkl..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-brand"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Bot tokeningiz faol va ulangan. O'zgartirish kerak bo'lsa, yangi tokenni kiritib saqlang.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tugma nomi (Menu Button)
                  </label>
                  <input
                    type="text"
                    value={buttonName}
                    onChange={(e) => setButtonName(e.target.value)}
                    placeholder="Do'kon"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-brand"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Telegram chat oynasining pastki chap burchagidagi do'konni ochuvchi menyu tugmasi matni.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Boshlang'ich matn (Welcome message)
                  </label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    placeholder="Assalomu alaykum {user}! {bot} do'konimizga xush kelibsiz!..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-brand leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Qo'llab-quvvatlanadigan o'zgaruvchilar: <code>{"{user}"}</code> (foydalanuvchi ismi),{" "}
                    <code>{"{bot}"}</code> (do'kon nomi)
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-black text-xs shadow-md shadow-brand/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
                  </button>
                </div>
              </div>

              {/* TMA Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSetupMenu}
                  disabled={settingUpMenu}
                  className="px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{settingUpMenu ? "Sozlanmoqda..." : "TMA Menyu tugmasini sozlash"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{testingConnection ? "Tekshirilmoqda..." : "Aloqani tekshirish"}</span>
                </button>
              </div>
            </div>
          )}

          {/* SUB TAB 2: AMALLAR (COMMANDS) */}
          {activeTab === "actions" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4 max-w-3xl">
              <h3 className="font-black text-base text-slate-900">Bot amallari va buyruqlari</h3>
              <p className="text-xs text-slate-500">
                Xaridorlar botga kirganda taqdim etiladigan asosiy buyruqlar va Web App interfeyslari:
              </p>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">
                      🛍 {status?.button_name || "Do'kon"} / Menyu (TMA)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Do'koningiz to'liq katalogini Telegram ichidagi oyna (TMA) orqali ochadi
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                    Faol
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">🌐 Tilni o'zgartirish</div>
                    <div className="text-[11px] text-slate-400">
                      Xaridorlar uchun O'zbek, Rus va Ingliz tillarini tanlash menyusi
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                    Faol
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">💬 Chat</div>
                    <div className="text-[11px] text-slate-400">
                      Xaridorlardan to'g'ridan-to'g'ri xabarlar va savollarni qabul qilish
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                    Faol
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">📦 Buyurtmalarim</div>
                    <div className="text-[11px] text-slate-400">
                      Xaridorning do'kondagi joriy va o'tgan buyurtmalari ro'yxati
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black">
                    Faol
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">ℹ️ Biz haqimizda</div>
                    <div className="text-[11px] text-slate-400">
                      Do'kon tavsifi, ish vaqti, telefon va manzili
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    Faol
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">📞 Kontaktlar</div>
                    <div className="text-[11px] text-slate-400">
                      Do'kon telefon raqami va manzili
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    Faol
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
                  <h3 className="font-black text-base text-slate-900">Telegram bot QR kodi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xaridorlar kamerani yo'naltirib to'g'ridan-to'g'ri botingizga o'tishadi
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Yuklab olish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Chop etish</span>
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
                    <span>Telegramda ochish</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
