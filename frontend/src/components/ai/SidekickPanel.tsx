import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Trash2,
  X,
  ChevronRight,
  Copy,
  Check,
  BarChart3,
  Package,
  ShoppingCart,
  BadgePercent,
  Zap,
  AlertTriangle,
  ExternalLink,
  Scissors,
  Wand2,
  RefreshCw,
  ArrowUpRight,
  Download,
  Settings,
  Languages,
  TrendingUp,
  FileText,
  ZoomIn,
  Paperclip,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { BannerCanvas } from "./BannerCanvas";

export interface SidekickMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  isVoice?: boolean;
  action_type?: string;
  action_data?: any;
  suggestions?: string[];
  timestamp: string;
}

interface SidekickPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cleans markdown, emojis, asterisks, and urls for smooth natural voice speech
const cleanTextForSpeech = (text: string, currentLang: string): string => {
  if (!text) return "";
  let clean = text;

  // 1. Remove all emojis (prevents synthesizer from reading emoji names out loud)
  clean = clean.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );

  // 2. Strip URLs and markdown links
  clean = clean.replace(/https?:\/\/\S+/g, "");
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 3. Strip bold, italic, code markers, headers, and strikethroughs
  clean = clean.replace(/[*#`_~]/g, "");

  // 4. Convert bullet points and arrows into gentle natural breathing pauses
  clean = clean.replace(/^[•\-\*]\s+/gm, "");
  clean = clean.replace(/[•\-\*]/g, ", ");
  clean = clean.replace(/➡️|→/g, ", ");

  // 5. Enhance currency pronunciation so it reads natural words instead of abbreviation
  if (currentLang === "uz") {
    clean = clean.replace(/UZS/gi, "so'm");
  } else if (currentLang === "en") {
    clean = clean.replace(/UZS/gi, "sums");
  } else {
    clean = clean.replace(/UZS/gi, "сум");
  }

  // 6. Normalize multiple spaces and line breaks
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
};

export const SidekickPanel: React.FC<SidekickPanelProps> = ({ isOpen, onClose }) => {
  const { lang: initialLang, store } = useAuth();
  const [activeLang, setActiveLang] = useState<"ru" | "uz" | "en">(
    (initialLang as any) === "uz" ? "uz" : (initialLang as any) === "en" ? "en" : "ru"
  );

  const [messages, setMessages] = useState<SidekickMessage[]>(() => {
    try {
      const saved = localStorage.getItem("storebox_sidekick_messages");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Voice Settings & TTS
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("storebox_sidekick_tts") === "true";
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem("storebox_sidekick_voice_uri") || "";
  });
  const [speechRate, setSpeechRate] = useState<number>(0.96);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // 1. Enumerate and score natural voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // 2. Select highest-tier natural voice for active language
  const getBestVoiceForLanguage = (targetLang: "ru" | "uz" | "en") => {
    if (!availableVoices.length) return null;

    // If user explicitly chose a voice in settings
    if (selectedVoiceURI) {
      const chosen = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (chosen) return chosen;
    }

    if (targetLang === "ru") {
      const ruVoices = availableVoices.filter((v) => v.lang.startsWith("ru"));
      // Priority keywords: natural, enhanced, premium, google, milena, yuri
      const bestRu = ruVoices.find(
        (v) =>
          /google/i.test(v.name) ||
          /milena/i.test(v.name) ||
          /yuri/i.test(v.name) ||
          /enhanced/i.test(v.name) ||
          /premium/i.test(v.name) ||
          /natural/i.test(v.name)
      );
      return bestRu || ruVoices[0] || null;
    }

    if (targetLang === "en") {
      const enVoices = availableVoices.filter((v) => v.lang.startsWith("en"));
      const bestEn = enVoices.find(
        (v) =>
          /google/i.test(v.name) ||
          /samantha/i.test(v.name) ||
          /daniel/i.test(v.name) ||
          /jenny/i.test(v.name) ||
          /natural/i.test(v.name) ||
          /enhanced/i.test(v.name)
      );
      return bestEn || enVoices[0] || null;
    }

    // Uzbek language:
    // Check for native Uzbek voice first
    const uzVoice = availableVoices.find(
      (v) => v.lang.startsWith("uz") || /uzbek/i.test(v.name)
    );
    if (uzVoice) return uzVoice;

    // Fallback: Turkish voice provides authentic Turkic vowel harmony and phonetics
    // for Latin Uzbek words, sounding exceptionally natural and pleasant!
    const trVoices = availableVoices.filter((v) => v.lang.startsWith("tr"));
    const bestTr = trVoices.find(
      (v) =>
        /google/i.test(v.name) ||
        /yelda/i.test(v.name) ||
        /filiz/i.test(v.name) ||
        /cem/i.test(v.name) ||
        /enhanced/i.test(v.name)
    );
    return bestTr || trVoices[0] || null;
  };

  // 3. Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("SpeechRecognition init failed:", e);
      }
    }
  }, []);

  // 4. Save messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("storebox_sidekick_messages", JSON.stringify(messages.slice(-30)));
    } catch (_) {}
  }, [messages]);

  // 5. Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Toggle Speech Recognition
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (activeLang === "ru") {
          recognitionRef.current.lang = "ru-RU";
        } else if (activeLang === "en") {
          recognitionRef.current.lang = "en-US";
        } else {
          recognitionRef.current.lang = "uz-UZ";
        }
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Error starting speech recognition:", err);
      }
    }
  };

  // Natural Voice TTS Speaker
  const speakText = (text: string, forceLang?: "ru" | "uz" | "en") => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const currentTargetLang = forceLang || activeLang;
      const clean = cleanTextForSpeech(text, currentTargetLang);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      const voice = getBestVoiceForLanguage(currentTargetLang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang =
          currentTargetLang === "ru" ? "ru-RU" : currentTargetLang === "en" ? "en-US" : "tr-TR";
      }

      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak failed:", e);
    }
  };

  // Test voice preview
  const handleTestVoice = () => {
    const sample =
      activeLang === "uz"
        ? "Assalomu alaykum! Men sizning StoreBox intellektual biznes yordamchingizman."
        : activeLang === "en"
        ? "Hello! I am your StoreBox intelligent e-commerce co-founder."
        : "Здравствуйте! Я ваш персональный бизнес-ассистент StoreBox.";
    speakText(sample);
  };

  const toggleTts = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    localStorage.setItem("storebox_sidekick_tts", String(next));
    if (!next && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Send message
  const handleSend = async (textToSend?: string, isVoiceInput = false) => {
    const query = (textToSend !== undefined ? textToSend : input).trim();
    if (!query || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: SidekickMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query,
      isVoice: isVoiceInput || isListening,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post("/ai/chat/", {
        message: query,
        lang: activeLang,
      });

      const data = res.data;
      const botMsg: SidekickMessage = {
        id: "a_" + Date.now(),
        sender: "assistant",
        text: data.text || "Команда выполнена.",
        action_type: data.action_type,
        action_data: data.action_data,
        suggestions: data.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(botMsg.text);
    } catch (err: any) {
      console.error("Sidekick chat error:", err);
      const errMsg: SidekickMessage = {
        id: "err_" + Date.now(),
        sender: "assistant",
        text:
          activeLang === "uz"
            ? "Kechirasiz, so'rovni bajarishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            : activeLang === "en"
            ? "Sorry, an error occurred while processing the command. Please try again."
            : "Извините, произошла ошибка обработки команды. Проверьте соединение или повторите запрос.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userMsg: SidekickMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text:
        activeLang === "uz"
          ? `📷 Mahsulot rasmi yuklandi: «${file.name}». Fonni tozalash (rembg AI)...`
          : activeLang === "en"
          ? `📷 Uploaded photo: «${file.name}». Removing background (rembg AI)...`
          : `📷 Загружено фото: «${file.name}». Удаление фона (rembg AI)...`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Reset file input so user can re-upload if needed
    e.target.value = "";

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/ai/remove-background/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      const botMsg: SidekickMessage = {
        id: "a_" + Date.now(),
        sender: "assistant",
        text:
          activeLang === "uz"
            ? `✨ **«${file.name}» fotosi muvaffaqiyatli tozalandi!**\n\n• Mahsulot obyekti fonidan ajratildi (rembg AI).\n• Shaffof studiya PNG fayli tayyor. Uni yuklab olishingiz yoki tovar kartasiga biriktirishingiz mumkin.`
            : activeLang === "en"
            ? `✨ **Background removed successfully for «${file.name}»!**\n\n• Subject isolated with clean edges using local rembg AI.\n• Transparent studio PNG is ready to download or assign to your catalog.`
            : `✨ **Фон у фото «${file.name}» успешно удален!**\n\n• Нейросеть rembg аккуратно вырезала объект с сохранением четких краев.\n• Готов прозрачный студийный PNG для каталога или баннера.`,
        action_type: "image_processed",
        action_data: {
          new_image_url: data.image_url,
          product_name: cleanName,
        },
        suggestions: [
          activeLang === "uz"
            ? `Ushbu tovar uchun reklama banneri yarat`
            : activeLang === "en"
            ? `Create promo banner for this product`
            : `Создай рекламный баннер для этого товара`,
          activeLang === "uz"
            ? `Sotuvchi SEO matn yoz`
            : activeLang === "en"
            ? `Generate SEO description`
            : `Сгенерируй продающее SEO описание`,
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(botMsg.text);
    } catch (err: any) {
      console.error("Upload & rembg error:", err);
      const errMsg: SidekickMessage = {
        id: "err_" + Date.now(),
        sender: "assistant",
        text:
          activeLang === "uz"
            ? "Rasmni qayta ishlashda xatolik yuz berdi. Iltimos, boshqa rasm yuklab ko'ring."
            : activeLang === "en"
            ? "Error processing image. Please try uploading another image."
            : "Произошла ошибка при обработке фото. Пожалуйста, попробуйте другое изображение.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem("storebox_sidekick_messages");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Chips in 3 Languages
  const quickPromptsByLang = {
    ru: [
      { label: "📊 Отчет по продажам за неделю", text: "Покажи отчет по продажам за неделю" },
      { label: "📦 Какие товары заканчиваются?", text: "Какие товары заканчиваются на складе?" },
      { label: "🎨 Создать студийное фото товара", text: "Создай студийное фото товара Худи черная" },
      { label: "🖼️ Создать рекламный баннер (Canvas)", text: "Создай рекламный баннер со скидкой 20%" },
      { label: "✂️ Удалить фон у товара (rembg)", text: "Удали фон у товара" },
      { label: "🏷️ Создать промокод на 15%", text: "Создай промокод DISCOUNT15 на скидку 15%" },
      { label: "⚡ Сделай скидку 10% на все товары", text: "Сделай скидку 10% на все товары" },
      { label: "✍️ Сгенерировать SEO описание", text: "Сгенерируй продающее описание и SEO для товара" },
      { label: "📈 Как увеличить продажи?", text: "Как увеличить продажи магазина на 30%?" },
      { label: "🔍 Найти последние заказы", text: "Покажи последние заказы" },
    ],
    uz: [
      { label: "📊 7 kunlik savdo hisoboti", text: "Oxirgi 7 kunlik savdo hisobotini ko'rsat" },
      { label: "📦 Qaysi tovarlar tugayapti?", text: "Qaysi tovarlar omborda kam qoldi?" },
      { label: "🎨 Xudi uchun studiya rasmi", text: "Qora xudi uchun studiya rasmini yarat" },
      { label: "🖼️ Reklama bannerini yaratish (Canvas)", text: "20% chegirmali reklama bannerini yarat" },
      { label: "✂️ Tovardan fonni tozalash", text: "Tovar fotosidan fonni olib tashla" },
      { label: "🏷️ 15% li promokod yaratish", text: "Yangi 15% chegirmali promokod yarat" },
      { label: "⚡ Barcha tovarlarga 10% chegirma", text: "Barcha tovarlarga 10% chegirma ber" },
      { label: "✍️ Sotuvchi SEO matn yozish", text: "Tovar uchun sotuvchi matn va SEO tavsif yoz" },
      { label: "📈 Savdoni qanday oshirish mumkin?", text: "Do'kon savdosini qanday oshirsa bo'ladi?" },
      { label: "🔍 Oxirgi buyurtmalar", text: "Oxirgi buyurtmalarni ko'rsat" },
    ],
    en: [
      { label: "📊 Weekly sales report", text: "Show me weekly sales insights" },
      { label: "📦 Low stock alert", text: "Which products are running low on stock?" },
      { label: "🎨 Generate studio product image", text: "Create a studio product artwork for Hoodie" },
      { label: "🖼️ Generate promo banner (Canvas)", text: "Create promotional banner with 20% discount" },
      { label: "✂️ Remove background (rembg)", text: "Remove background from product photo" },
      { label: "🏷️ Create a 15% promo code", text: "Create promo code SAVE15 with 15% discount" },
      { label: "⚡ Apply 10% storewide discount", text: "Apply 10% discount across all products" },
      { label: "✍️ Generate SEO description", text: "Write high converting SEO description for product" },
      { label: "📈 Growth Playbook", text: "How can I increase store sales by 30%?" },
      { label: "🔍 Recent orders", text: "Show recent orders" },
    ],
  };

  const currentPrompts = quickPromptsByLang[activeLang] || quickPromptsByLang.ru;

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel (Shopify Sidekick Standard) */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] lg:w-[500px] bg-white dark:bg-[#0c0d0e] shadow-2xl border-l border-slate-200/80 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* 1. Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0d0e]/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                  StoreBox Sidekick
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/50">
                  AI 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                {store?.name || "Ваш магазин"} • Естественный голос & rembg AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 rounded-lg p-0.5 text-[11px] font-semibold mr-1">
              {(["ru", "uz", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setActiveLang(l);
                    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  }}
                  className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer uppercase ${
                    activeLang === l
                      ? "bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 shadow-xs"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  }`}
                  title={`Сменить язык на ${l.toUpperCase()}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Voice Settings toggle */}
            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                showVoiceSettings
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
              title="Настройки естественного голоса"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* TTS Mute/Unmute */}
            <button
              type="button"
              onClick={toggleTts}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                ttsEnabled
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
              title={ttsEnabled ? "Отключить озвучку" : "Включить естественную озвучку"}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear History */}
            <button
              type="button"
              onClick={handleClearHistory}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Очистить диалог"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Закрыть Sidekick"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Settings Dropdown / Panel */}
        {showVoiceSettings && (
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/90 border-b border-slate-200/80 dark:border-zinc-800 text-xs space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-bold text-slate-700 dark:text-zinc-200">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-violet-600" />
                <span>Синтез естественной речи (Shopify Sidekick)</span>
              </span>
              <button
                type="button"
                onClick={handleTestVoice}
                className="px-2.5 py-1 rounded-md bg-violet-600 text-white font-semibold hover:bg-violet-700 transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Прослушать</span>
              </button>
            </div>

            {/* Voice Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">
                Голосовой движок системы ({activeLang.toUpperCase()}):
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  localStorage.setItem("storebox_sidekick_voice_uri", e.target.value);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="">Автоматический лучший мягкий голос (Рекомендуется)</option>
                {availableVoices
                  .filter((v) =>
                    activeLang === "ru"
                      ? v.lang.startsWith("ru")
                      : activeLang === "en"
                      ? v.lang.startsWith("en")
                      : v.lang.startsWith("uz") || v.lang.startsWith("tr")
                  )
                  .map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Скорость речи: <b>{speechRate.toFixed(2)}x</b> (Мягкий естественный темп)
              </span>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.04"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-32 accent-violet-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 2. Messages Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-5 pt-3">
              {/* Welcome Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-pink-500/5 border border-violet-500/20 text-slate-900 dark:text-white space-y-2.5">
                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {activeLang === "uz"
                      ? "Salom! Men StoreBox Sidekick biznes yordamchingizman."
                      : activeLang === "en"
                      ? "Welcome! I am your StoreBox Sidekick AI Partner."
                      : "Привет! Я ваш умный помощник StoreBox Sidekick."}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-normal leading-relaxed">
                  {activeLang === "uz"
                    ? "Men tovarlar qo'shish, 1024x1024 studiya rasmlarini yaratish, fotosuratlardan fonni tozalash (rembg AI), 7 kunlik savdo hisobotlarini tahlil qilish va promokodlar chiqarishda yordam beraman."
                    : activeLang === "en"
                    ? "I can manage your inventory, generate 1024x1024 studio product visuals, remove photo backgrounds locally (rembg), analyze sales trends, and craft high-converting campaigns."
                    : "Я умею создавать товары, генерировать студийные фото 1024x1024, удалять фон с фотографий через rembg, формировать отчеты по продажам и запускать промо-акции."}
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>
                    {activeLang === "uz"
                      ? "100% Maxfiy • Mahalliy AI • Bepul"
                      : activeLang === "en"
                      ? "100% Private • Local AI Studio • Zero Cost"
                      : "Локальный AI Studio • Без платных API • 100% приватно"}
                  </span>
                </div>
              </div>

              {/* Quick Action Chips */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  {activeLang === "uz"
                    ? "Tezkor buyruqlar"
                    : activeLang === "en"
                    ? "Quick Actions"
                    : "Быстрые команды"}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {currentPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(p.text)}
                      className="p-3 text-left rounded-xl bg-slate-50 dark:bg-zinc-900/70 hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-slate-200/70 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-800/50 text-xs text-slate-700 dark:text-zinc-200 font-medium transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span>{p.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[85%] space-y-2.5 ${m.sender === "user" ? "items-end" : ""}`}>
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-normal leading-relaxed ${
                      m.sender === "user"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-xs shadow-xs"
                        : "bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-tl-xs border border-slate-200/60 dark:border-zinc-800"
                    }`}
                  >
                    {m.isVoice && (
                      <div className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold mb-1">
                        <Mic className="w-3 h-3" />
                        <span>Голосовой запрос</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line select-text">{m.text}</div>
                  </div>

                  {/* 1. IMAGE GENERATED CARD (1024x1024 Studio Showcase) */}
                  {m.action_type === "image_generated" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200 dark:border-violet-800/50 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                          <Wand2 className="w-4 h-4" />
                          <span>AI Studio Visual (1024x1024 HD)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60">
                          {m.action_data.theme === "clean_white" ? "Светлая студия" : "Dark Luxury"}
                        </span>
                      </div>

                      {/* Image Preview with Hover Zoom */}
                      <div
                        className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer"
                        onClick={() => setPreviewImageModal(m.action_data.image_url)}
                      >
                        <img
                          src={m.action_data.image_url}
                          alt={m.action_data.product_name}
                          className="w-full h-56 sm:h-64 object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>Нажмите для увеличения</span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {m.action_data.product_name}
                      </div>

                      {/* Studio Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleSend(`Удали фон у товара ${m.action_data.product_name}`)
                          }
                          className="p-2 rounded-lg bg-slate-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5 text-violet-600" />
                          <span>Удалить фон (rembg)</span>
                        </button>

                        <a
                          href={m.action_data.image_url}
                          download={`storebox_${m.action_data.product_name}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                          <span>Скачать 1024x1024</span>
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              m.action_data.theme === "clean_white"
                                ? `Создай студийное фото в темном стиле для ${m.action_data.product_name}`
                                : `Создай студийное фото в светлом стиле для ${m.action_data.product_name}`
                            )
                          }
                          className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Сменить стиль фона</span>
                        </button>

                        <Link
                          to="/products"
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium flex items-center gap-1"
                        >
                          <span>В каталог</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* 2. IMAGE PROCESSED (rembg AI Studio Composite) */}
                  {m.action_type === "image_processed" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200 dark:border-violet-800/40 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                          <Scissors className="w-4 h-4" />
                          <span>Фон удален (rembg AI Studio)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Готово
                        </span>
                      </div>

                      <div
                        className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 flex justify-center cursor-pointer group"
                        onClick={() => setPreviewImageModal(m.action_data.new_image_url)}
                      >
                        <img
                          src={m.action_data.new_image_url}
                          alt="Processed"
                          className="h-36 w-36 object-contain rounded-md transition-transform group-hover:scale-105"
                        />
                      </div>

                      <div className="text-center text-[11px] text-slate-500">
                        Прикреплено к товару: <b>{m.action_data.product_name}</b>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
                        <a
                          href={m.action_data.new_image_url}
                          download="studio_rembg.png"
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Скачать студийный PNG</span>
                        </a>

                        <Link
                          to="/products"
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium flex items-center gap-1"
                        >
                          <span>Открыть товар</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* 3. BANNER GENERATED CARD (HTML5 Canvas + Theme Switcher + Download) */}
                  {m.action_type === "banner_generated" && m.action_data && (
                    <div className="space-y-2">
                      <BannerCanvas
                        data={m.action_data}
                        onRemoveBg={() =>
                          handleSend(
                            activeLang === "uz"
                              ? `Tovardan fonni tozalash: ${m.action_data.product_name}`
                              : activeLang === "en"
                              ? `Remove background from: ${m.action_data.product_name}`
                              : `Удали фон у товара ${m.action_data.product_name}`
                          )
                        }
                      />
                    </div>
                  )}

                  {/* 4. PRODUCT CREATED CARD */}
                  {m.action_type === "product_created" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <Check className="w-4 h-4" />
                          <span>Товар опубликован в каталоге</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {m.action_data.stock} шт на складе
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.action_data.image_url && (
                          <img
                            src={m.action_data.image_url}
                            alt={m.action_data.name}
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-zinc-700 cursor-pointer"
                            onClick={() => setPreviewImageModal(m.action_data.image_url)}
                          />
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {m.action_data.name}
                          </div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                            {Number(m.action_data.price).toLocaleString()} UZS
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/products"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                      >
                        <span>Перейти к редактированию товара</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* 4. PROMOCODE CREATED CARD */}
                  {m.action_type === "promocode_created" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200/80 dark:border-violet-800/40 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                          {m.action_data.discount_value}% Скидка
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Активен
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800">
                        <code className="text-sm font-extrabold text-slate-900 dark:text-white tracking-widest font-mono">
                          {m.action_data.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.action_data.code, m.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-800 text-slate-700 dark:text-white border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === m.id ? "Скопировано" : "Копировать"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. BULK DISCOUNT CARD */}
                  {m.action_type === "bulk_discount_applied" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-amber-200 dark:border-amber-800/40 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          <Zap className="w-4 h-4" />
                          <span>Массовая скидка {m.action_data.discount_pct}%</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {m.action_data.affected_count} товаров
                        </span>
                      </div>

                      {m.action_data.samples && m.action_data.samples.length > 0 && (
                        <div className="space-y-1.5 text-[11px] bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                          {m.action_data.samples.map((s: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-slate-700 dark:text-zinc-300 truncate max-w-[180px]">
                                {s.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-slate-400 text-[10px]">
                                  {Number(s.old_price).toLocaleString()} UZS
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {Number(s.new_price).toLocaleString()} UZS
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Link
                        to="/products"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                      >
                        <span>Посмотреть все товары со скидкой</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* 6. ANALYTICS REPORT CARD */}
                  {m.action_type === "analytics_report" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Метрики: {m.action_data.period}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800">
                          <div className="text-[10px] text-slate-400 font-medium">Выручка</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {Number(m.action_data.revenue).toLocaleString()} UZS
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800">
                          <div className="text-[10px] text-slate-400 font-medium">Заказы</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {m.action_data.orders_count} шт.
                          </div>
                        </div>
                      </div>
                      <Link
                        to="/analytics"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400"
                      >
                        <span>Открыть подробную аналитику</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* 7. RECENT ORDERS CARD */}
                  {m.action_type === "recent_orders" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-zinc-800 shadow-xs space-y-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Последние заказы</span>
                        <Link to="/orders" className="text-[11px] text-violet-600 hover:underline">
                          Все заказы
                        </Link>
                      </div>
                      {m.action_data.orders && m.action_data.orders.length > 0 ? (
                        <div className="space-y-1.5">
                          {m.action_data.orders.map((o: any) => (
                            <div
                              key={o.id}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between text-[11px]"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  #{o.id}
                                </span>{" "}
                                <span className="text-slate-500">• {o.customer}</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {Number(o.total).toLocaleString()} UZS
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Нет активных заказов</div>
                      )}
                    </div>
                  )}

                  {/* Suggestions Pills */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(s)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-slate-700 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-300 border border-slate-200/60 dark:border-zinc-700 transition-colors cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 rounded-tl-xs border border-slate-200/60 dark:border-zinc-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-violet-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-slate-500 font-medium ml-1">
                  Sidekick думает и анализирует магазин...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Audio wave recording banner */}
        {isListening && (
          <div className="p-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white flex items-center justify-between px-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-xs font-bold">
                {activeLang === "uz"
                  ? "Sizni tinglayapman... Ovozli buyruq bering"
                  : activeLang === "en"
                  ? "Listening to your voice... Speak command"
                  : "Слушаю вас... Говорите голосовую команду"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSend(input, true)}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-bold transition cursor-pointer"
            >
              Отправить
            </button>
          </div>
        )}

        {/* 4. Input Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-[#0c0d0e]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden File Input for Image Upload / rembg */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Upload Product Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-violet-100 dark:hover:bg-violet-950/40 hover:text-violet-700 transition cursor-pointer"
              title={
                activeLang === "uz"
                  ? "Mahsulot rasmini yuklash (Fonni tozalash)"
                  : activeLang === "en"
                  ? "Upload product photo (Remove background)"
                  : "Загрузить фото товара (Удаление фона)"
              }
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Mic Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/20"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-violet-100 dark:hover:bg-violet-950/40 hover:text-violet-700"
                }`}
                title={isListening ? "Остановить запись" : "Голосовая команда"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? "Слушаю ваш голос..."
                  : activeLang === "uz"
                  ? "Sidekick'ga savol bering yoki buyruq ayting..."
                  : activeLang === "en"
                  ? "Ask Sidekick or speak command..."
                  : "Спросите Sidekick или скажите команду..."
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-40 hover:from-violet-500 hover:to-indigo-500 shadow-sm shadow-violet-500/20 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 px-1 font-normal">
            <span>Enter для отправки • Язык: {activeLang.toUpperCase()}</span>
            <span>StoreBox AI Engine</span>
          </div>
        </div>
      </aside>

      {/* High Resolution Image Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <span className="font-bold text-xs">AI Studio 1024x1024 Просмотр</span>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-black/50">
              <img
                src={previewImageModal}
                alt="Enlarged Preview"
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
            <div className="p-3 border-t border-slate-800 flex justify-end gap-2">
              <a
                href={previewImageModal}
                download="storebox_artwork.png"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Скачать оригинальный файл</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
