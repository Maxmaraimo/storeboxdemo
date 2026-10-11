import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  X,
  ChevronRight,
  Check,
  BarChart3,
  Package,
  ShoppingCart,
  RefreshCw,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export const detectTextLanguage = (text: string, fallback: "ru" | "uz" | "en" = "ru"): "ru" | "uz" | "en" => {
  if (!text) return fallback;
  if (
    /\b(va|uchun|do'kon|tovar|buyurtma|narx|chegirma|men|siz|yarat|haqida|ko'rsat|salom|qil|qiling|hisobot|mijoz|bo'lim|so'm|qancha)\b/i.test(
      text
    ) ||
    /[o‘g‘ʻʼ]/i.test(text)
  ) {
    return "uz";
  }
  if (/\b(hello|show|orders|revenue|analytics|products|customers|settings|open|go to|how much|today)\b/i.test(text)) {
    return "en";
  }
  if (/[а-яё]/i.test(text)) {
    return "ru";
  }
  return fallback;
};

export interface SidekickAction {
  type: "NAVIGATE" | string;
  target: string;
  spa_path?: string;
  title?: string;
}

export interface SidekickDataCard {
  type?: "metrics" | "orders" | "product_draft" | "image_studio";
  title: string;
  revenue?: string;
  revenue_raw?: number;
  orders_count?: number;
  avg_check?: string;
  customers_count?: number;
  products_count?: number;
  orders?: Array<{
    id: number;
    order_number?: string;
    customer_name: string;
    customer_phone?: string;
    status: string;
    status_label: string;
    total_amount: string;
    created_at: string;
  }>;
  product_name?: string;
  category?: string;
  description?: string;
  benefits?: string[];
  suggested_price?: string;
  price_raw?: number;
  image_url?: string;
}

export interface SidekickMessage {
  id: string;
  sender: "user" | "assistant" | "system_voice";
  text: string;
  isVoice?: boolean;
  action?: SidekickAction | null;
  data_card?: SidekickDataCard | null;
  audio_base64?: string | null;
  timestamp: string;
}

interface RecentSession {
  id: string;
  title: string;
  isVoiceSession?: boolean;
  updatedAt: string;
  messages: SidekickMessage[];
}

interface SidekickPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const toSpaPath = (target?: string, spaPath?: string): string => {
  if (spaPath) return spaPath;
  if (!target) return "/";
  let cleaned = target.trim();
  if (cleaned.startsWith("/dashboard/")) {
    cleaned = "/" + cleaned.slice("/dashboard/".length);
  } else if (cleaned === "/dashboard") {
    cleaned = "/";
  }
  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned || "/";
};

export const SidekickPanel: React.FC<SidekickPanelProps> = ({ isOpen, onClose }) => {
  const { lang: appLang, store } = useAuth();
  const navigate = useNavigate();

  const uiLang: "ru" | "uz" | "en" =
    appLang === "uz" ? "uz" : appLang === "en" ? "en" : "ru";

  // Clean out legacy cached fake messages on mount
  useEffect(() => {
    try {
      localStorage.removeItem("storebox_sidekick_messages");
      localStorage.removeItem("storebox_sidekick_v2_messages");
    } catch (_) {}
  }, []);

  const [messages, setMessages] = useState<SidekickMessage[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([
    {
      id: "s_voice_demo",
      title:
        uiLang === "uz"
          ? "Qisqa ovozli muloqot"
          : uiLang === "en"
          ? "Brief voice conversation"
          : "Краткий голосовой диалог",
      isVoiceSession: true,
      updatedAt: "Сегодня",
      messages: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecentsMenu, setShowRecentsMenu] = useState(false);
  const [creatingProductCardId, setCreatingProductCardId] = useState<string | null>(null);
  const [createdProductCardIds, setCreatedProductCardIds] = useState<Record<string, boolean>>({});

  // ElevenLabs Voice State
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem("storebox_sidekick_voice_enabled") !== "false";
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Live Voice Call Mode with Barge-in
  const [isVoiceCallMode, setIsVoiceCallMode] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<
    "connecting" | "listening" | "thinking" | "speaking" | "ending"
  >("listening");
  const [voiceStepText, setVoiceStepText] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastVoiceCard, setLastVoiceCard] = useState<{
    text: string;
    action?: SidekickAction | null;
    data_card?: SidekickDataCard | null;
  } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);

  // Optional Image Attachment
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recentsMenuRef = useRef<HTMLDivElement>(null);

  const messagesRef = useRef<SidekickMessage[]>(messages);
  messagesRef.current = messages;
  const isVoiceCallModeRef = useRef<boolean>(isVoiceCallMode);
  isVoiceCallModeRef.current = isVoiceCallMode;
  const isCallMutedRef = useRef<boolean>(isCallMuted);
  isCallMutedRef.current = isCallMuted;
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const voiceThinkingRef = useRef<boolean>(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recentsMenuRef.current && !recentsMenuRef.current.contains(e.target as Node)) {
        setShowRecentsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen && !isVoiceCallMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading, isVoiceCallMode]);

  // Live call timer
  useEffect(() => {
    if (!isVoiceCallMode) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [isVoiceCallMode]);

  // Stop any playing ElevenLabs audio immediately (used for Barge-in / Interruption)
  const stopAudio = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (_) {}
      activeAudioRef.current = null;
    }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  };

  // Play strictly via ElevenLabs Base64 Audio (`new Audio('data:audio/mp3;base64,' + data.audio_base64)`)
  const playElevenLabsAudio = (audioBase64?: string | null, onEnded?: () => void) => {
    stopAudio();

    if (!audioBase64) {
      if (onEnded) onEnded();
      return;
    }

    try {
      const audio = new Audio("data:audio/mp3;base64," + audioBase64);
      activeAudioRef.current = audio;
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      audio.onended = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        activeAudioRef.current = null;
        if (onEnded) onEnded();
      };
      audio.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        activeAudioRef.current = null;
        if (onEnded) onEnded();
      };

      audio.play().catch((err) => {
        console.warn("ElevenLabs audio play blocked or failed:", err);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        activeAudioRef.current = null;
        if (onEnded) onEnded();
      });
    } catch (e) {
      console.warn("ElevenLabs audio error:", e);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      if (onEnded) onEnded();
    }
  };

  // Speech Recognition Setup with Continuous Barge-in Support in Voice Call Mode
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setSpeechSupported(true);
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = isVoiceCallMode;
      recognition.interimResults = true;
      recognition.lang = uiLang === "uz" ? "uz-UZ" : uiLang === "en" ? "en-US" : "ru-RU";

      recognition.onstart = () => {
        setIsListening(true);
      };

      // BARGE-IN: As soon as the user starts speaking, interrupt Sidekick's audio playback!
      recognition.onspeechstart = () => {
        if (isVoiceCallModeRef.current && isSpeakingRef.current) {
          stopAudio();
          setVoiceCallStatus("listening");
          setVoiceStepText(
            uiLang === "uz"
              ? "Sizni eshityapman..."
              : uiLang === "en"
              ? "Listening to you..."
              : "Слушаю вас..."
          );
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalSegment = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalSegment += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const currentSpoken = (finalSegment || interimTranscript).trim();

        // BARGE-IN: If Sidekick is currently talking and user speaks >= 2 chars, immediately stop ElevenLabs audio!
        if (isVoiceCallModeRef.current && isSpeakingRef.current && currentSpoken.length >= 2) {
          stopAudio();
          setVoiceCallStatus("listening");
          setVoiceStepText(
            uiLang === "uz"
              ? "Sizni eshityapman..."
              : uiLang === "en"
              ? "Listening to you..."
              : "Слушаю вас..."
          );
        }

        if (isVoiceCallModeRef.current) {
          if (currentSpoken) {
            setLiveTranscript(currentSpoken);
          }
          if (finalSegment.trim() && !voiceThinkingRef.current) {
            handleVoiceCallTurn(finalSegment.trim());
          }
        } else {
          setInput(currentSpoken);
          if (finalSegment.trim()) {
            setIsListening(false);
            handleSend(finalSegment.trim(), true);
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Keep recognition alive during hands-free Voice Call Mode so Barge-in works at any moment
        if (isVoiceCallModeRef.current && !isCallMutedRef.current) {
          setTimeout(() => {
            if (isVoiceCallModeRef.current && !isCallMutedRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (_) {}
            }
          }, 250);
        }
      };

      recognitionRef.current = recognition;
    } catch (_) {}
  }, [isVoiceCallMode, isCallMuted, uiLang, store?.id, voiceEnabled]);

  // Listen for custom event from anywhere in the app
  useEffect(() => {
    const handleExternalTrigger = (e: any) => {
      const detail = e.detail || {};
      if (detail.voice) {
        startVoiceCall();
      } else if (detail.prompt) {
        setIsVoiceCallMode(false);
        setTimeout(() => {
          handleSend(detail.prompt);
        }, 100);
      }
    };
    window.addEventListener("storebox:open-sidekick", handleExternalTrigger);
    return () => window.removeEventListener("storebox:open-sidekick", handleExternalTrigger);
  }, [store?.id, voiceEnabled]);

  const toggleVoiceEnabled = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem("storebox_sidekick_voice_enabled", String(next));
    if (!next) stopAudio();
  };

  // Main Chat Submit -> POST `/api/v1/ai/assistant/chat/`
  const handleSend = async (overrideMessage?: string, isVoiceInput = false) => {
    const query = (overrideMessage !== undefined ? overrideMessage : input).trim();
    if ((!query && !attachedFile) || isLoading) return;

    if (isListening && recognitionRef.current && !isVoiceCallModeRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    stopAudio();

    const detectedLang = detectTextLanguage(query, uiLang);

    const userMsg: SidekickMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: query || "Обработай фото товара",
      isVoice: isVoiceInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const currentHistory = messagesRef.current
      .filter((m) => m.sender === "user" || m.sender === "assistant")
      .slice(-10)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    const shouldRequestVoice = voiceEnabled || isVoiceInput;
    const fileToSend = attachedFile;

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null);
    setAttachedPreview(null);
    setIsLoading(true);

    try {
      let res;
      if (fileToSend) {
        const formData = new FormData();
        formData.append("message", query || "Помести товар на студийный фон");
        formData.append("voice_enabled", String(shouldRequestVoice));
        formData.append("lang", detectedLang);
        formData.append("image", fileToSend);
        res = await api.post("/ai/assistant/chat/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/ai/assistant/chat/", {
          message: query,
          voice_enabled: shouldRequestVoice,
          lang: detectedLang,
          history: currentHistory,
        });
      }

      const data = res.data;

      // 1. Execute Action if Gemini triggered `navigate_to`
      if (data.action && data.action.type === "NAVIGATE" && data.action.target) {
        const spaTarget = toSpaPath(data.action.target, data.action.spa_path);
        navigate(spaTarget);
      }

      // 2. Append Assistant Message with Data Card & ElevenLabs Audio
      const assistantMsg: SidekickMessage = {
        id: "a_" + Date.now(),
        sender: "assistant",
        text: data.text || "Готово.",
        action: data.action || null,
        data_card: data.data_card || null,
        audio_base64: data.audio_base64 || null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMsg];
        // Save to recent sessions
        const sessionTitle =
          query.slice(0, 38) ||
          (uiLang === "uz" ? "Yangi suhbat" : uiLang === "en" ? "New chat" : "Новый диалог");
        setRecentSessions((sessions) => {
          const rest = sessions.filter((s) => s.id !== "current");
          return [
            {
              id: "current",
              title: sessionTitle,
              updatedAt: uiLang === "uz" ? "Bugun" : uiLang === "en" ? "Today" : "Сегодня",
              messages: updated,
            },
            ...rest.slice(0, 6),
          ];
        });
        return updated;
      });

      // 3. Play ElevenLabs Audio (`new Audio('data:audio/mp3;base64,' + data.audio_base64)`)
      if (shouldRequestVoice && data.audio_base64) {
        playElevenLabsAudio(data.audio_base64);
      }
    } catch (err) {
      console.error("Sidekick assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "assistant",
          text:
            detectedLang === "uz"
              ? "So'rovni bajarishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
              : detectedLang === "en"
              ? "Failed to reach Gemini API. Please try again."
              : "Не удалось выполнить запрос к Gemini API. Попробуйте еще раз.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Live Voice Call Turn -> POST `/api/v1/ai/assistant/chat/` with `voice_enabled: true`
  const handleVoiceCallTurn = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    stopAudio();
    voiceThinkingRef.current = true;
    const detected = detectTextLanguage(spokenText, uiLang);
    setVoiceCallStatus("thinking");
    setVoiceStepText(
      uiLang === "uz"
        ? "Sidekick o'ylamoqda..."
        : uiLang === "en"
        ? "Sidekick is thinking..."
        : "Sidekick думает..."
    );
    setLiveTranscript(spokenText);

    const currentHistory = messagesRef.current
      .filter((m) => m.sender === "user" || m.sender === "assistant")
      .slice(-8)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    const userMsg: SidekickMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: spokenText,
      isVoice: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.post("/ai/assistant/chat/", {
        message: spokenText,
        voice_enabled: true,
        lang: detected,
        history: currentHistory,
      });

      voiceThinkingRef.current = false;
      const data = res.data;

      if (data.action && data.action.type === "NAVIGATE" && data.action.target) {
        const spaTarget = toSpaPath(data.action.target, data.action.spa_path);
        setVoiceStepText(
          `${uiLang === "uz" ? "O'tildi" : uiLang === "en" ? "Navigated" : "Переход"}: ${
            data.action.title || spaTarget
          }`
        );
        navigate(spaTarget);
      }

      setLastVoiceCard({
        text: data.text,
        action: data.action,
        data_card: data.data_card,
      });

      const assistantMsg: SidekickMessage = {
        id: "a_" + Date.now(),
        sender: "assistant",
        text: data.text || "Выполнено.",
        action: data.action || null,
        data_card: data.data_card || null,
        audio_base64: data.audio_base64 || null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setVoiceCallStatus("speaking");
      setVoiceStepText(
        uiLang === "uz"
          ? "Sidekick gapirmoqda (gapirib bo'lishingiz mumkin)..."
          : uiLang === "en"
          ? "Sidekick speaking (speak anytime to interrupt)..."
          : "Sidekick говорит (начните говорить, чтобы перебить)..."
      );

      // Keep speech recognition active while ElevenLabs speaks so user can barge in!
      if (recognitionRef.current && !isCallMutedRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }

      playElevenLabsAudio(data.audio_base64, () => {
        if (isVoiceCallModeRef.current && !isCallMutedRef.current) {
          setVoiceCallStatus("listening");
          setVoiceStepText(
            uiLang === "uz"
              ? "Sizni eshityapman..."
              : uiLang === "en"
              ? "Listening..."
              : "Слушаю вас..."
          );
          setLiveTranscript("");
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (_) {}
          }
        }
      });
    } catch (_) {
      voiceThinkingRef.current = false;
      setVoiceCallStatus("listening");
      setVoiceStepText(
        uiLang === "uz" ? "Sizni eshityapman..." : uiLang === "en" ? "Listening..." : "Слушаю вас..."
      );
    }
  };

  const startVoiceCall = () => {
    setShowRecentsMenu(false);
    stopAudio();
    setIsVoiceCallMode(true);
    isVoiceCallModeRef.current = true;
    setIsCallMuted(false);
    isCallMutedRef.current = false;
    setVoiceCallStatus("connecting");
    setVoiceStepText(
      uiLang === "uz" ? "Ulanmoqda..." : uiLang === "en" ? "Connecting..." : "Подключение..."
    );
    setLiveTranscript("");
    setLastVoiceCard(null);

    setTimeout(() => {
      if (!isVoiceCallModeRef.current) return;
      setVoiceCallStatus("listening");
      setVoiceStepText(
        uiLang === "uz"
          ? "Sizni eshityapman — gapiring..."
          : uiLang === "en"
          ? "Listening — speak anytime..."
          : "Слушаю вас — говорите..."
      );
      if (recognitionRef.current) {
        try {
          recognitionRef.current.continuous = true;
          recognitionRef.current.lang =
            uiLang === "uz" ? "uz-UZ" : uiLang === "en" ? "en-US" : "ru-RU";
          recognitionRef.current.start();
        } catch (_) {}
      }
    }, 350);
  };

  const endVoiceCall = () => {
    stopAudio();
    setVoiceCallStatus("ending");
    setVoiceStepText(
      uiLang === "uz"
        ? "Suhbat yakunlanmoqda..."
        : uiLang === "en"
        ? "Ending conversation..."
        : "Завершаем диалог..."
    );
    isVoiceCallModeRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    const durationLabel = `${Math.floor(callDuration / 60)}:${(callDuration % 60)
      .toString()
      .padStart(2, "0")}`;

    setTimeout(() => {
      setIsVoiceCallMode(false);
      setMessages((prev) => [
        ...prev,
        {
          id: "vc_" + Date.now(),
          sender: "system_voice",
          text:
            uiLang === "uz"
              ? `Qisqa ovozli muloqot • Ovozli seans (${durationLabel})`
              : uiLang === "en"
              ? `Brief voice conversation • Voice session (${durationLabel})`
              : `Краткий голосовой диалог • Голосовой сеанс (${durationLabel})`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 350);
  };

  const toggleMicDictation = () => {
    if (!recognitionRef.current) return;
    stopAudio();
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang =
          uiLang === "uz" ? "uz-UZ" : uiLang === "en" ? "en-US" : "ru-RU";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (_) {}
    }
  };

  const handleSpeakMessage = async (msg: SidekickMessage) => {
    if (isSpeaking) {
      stopAudio();
      return;
    }
    if (msg.audio_base64) {
      playElevenLabsAudio(msg.audio_base64);
    }
  };

  const handleCreateProductFromDraft = async (msgId: string, card: SidekickDataCard) => {
    if (creatingProductCardId || createdProductCardIds[msgId]) return;
    setCreatingProductCardId(msgId);
    try {
      await api.post("/ai/save-to-catalog/", {
        name: card.product_name || "Новый товар",
        description: card.description || "",
        price: card.price_raw || 250000,
        stock: 25,
      });
      setCreatedProductCardIds((prev) => ({ ...prev, [msgId]: true }));
    } catch (e) {
      console.error("Failed to save product draft:", e);
    } finally {
      setCreatingProductCardId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    setAttachedPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleNewChat = () => {
    stopAudio();
    setIsVoiceCallMode(false);
    isVoiceCallModeRef.current = false;
    setMessages([]);
    setShowRecentsMenu(false);
  };

  const quickSuggestions =
    uiLang === "uz"
      ? [
          {
            label: "Oxirgi 30 kunlik savdo tahlili",
            prompt: "Tahlil bo'limiga o't va oxirgi 30 kunlik tushumni ko'rsat",
          },
          {
            label: "Bugungi tushum va buyurtmalar",
            prompt: "Bugungi savdo ko'rsatkichlarini ko'rsat",
          },
          {
            label: "Oxirgi buyurtmalarni qidirish",
            prompt: "Do'kondagi oxirgi buyurtmalarni ko'rsat",
          },
          {
            label: "Yangi tovar uchun sotuvchi tavsif",
            prompt: "Qora oversayz xudi uchun tovar kartochkasini yarat",
          },
        ]
      : uiLang === "en"
      ? [
          {
            label: "Analytics & 30-day revenue",
            prompt: "Go to analytics and show me revenue for the last 30 days",
          },
          {
            label: "7-day store performance",
            prompt: "Show store metrics for the last 7 days",
          },
          {
            label: "Find recent orders",
            prompt: "Find the latest orders in my store",
          },
          {
            label: "Generate a product listing",
            prompt: "Generate a product card for a Black Oversized Hoodie",
          },
        ]
      : [
          {
            label: "Аналитика и выручка за 30 дней",
            prompt: "Перейди в аналитику и покажи выручку за 30 дней",
          },
          {
            label: "Сводка продаж за 7 дней",
            prompt: "Покажи показатели магазина за 7 дней",
          },
          {
            label: "Найти последние заказы",
            prompt: "Найди последние заказы магазина",
          },
          {
            label: "Сгенерировать карточку товара",
            prompt: "Сгенерируй карточку товара для Черного оверсайз худи",
          },
        ];

  if (!isOpen) return null;

  const renderDataCard = (card: SidekickDataCard, msgId: string) => {
    if (card.type === "metrics" || (card.revenue !== undefined && !card.orders)) {
      return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 shadow-2xs p-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#e6f7f0] dark:bg-emerald-950/50 flex items-center justify-center text-[#00a86b]">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-[#202223] dark:text-white">
                  {card.title || "Аналитика магазина"}
                </div>
                {store?.name && (
                  <div className="text-[11px] text-[#6d7175] dark:text-zinc-400">
                    {store.name}
                  </div>
                )}
              </div>
            </div>
            <Link
              to="/analytics"
              className="px-2.5 py-1 rounded-lg bg-[#f6f6f7] hover:bg-[#ebebed] dark:bg-zinc-800 text-[11px] font-semibold text-[#00a86b] flex items-center gap-1 transition"
            >
              <span>{uiLang === "uz" ? "Hisobot" : uiLang === "en" ? "Report" : "Отчет"}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#f6f6f7] dark:bg-zinc-800/70 border border-[#ebebed] dark:border-zinc-800">
              <div className="text-[10.5px] text-[#6d7175] dark:text-zinc-400">
                {uiLang === "uz" ? "Tushum" : uiLang === "en" ? "Revenue" : "Выручка"}
              </div>
              <div className="text-[13.5px] font-bold text-[#00a86b] mt-0.5">
                {card.revenue}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f6f6f7] dark:bg-zinc-800/70 border border-[#ebebed] dark:border-zinc-800">
              <div className="text-[10.5px] text-[#6d7175] dark:text-zinc-400">
                {uiLang === "uz" ? "Buyurtmalar" : uiLang === "en" ? "Orders" : "Заказов"}
              </div>
              <div className="text-[13.5px] font-bold text-[#202223] dark:text-white mt-0.5">
                {card.orders_count ?? 0} {uiLang === "uz" ? "ta" : uiLang === "en" ? "" : "шт."}
              </div>
            </div>
            {card.avg_check && (
              <div className="p-2.5 rounded-xl bg-[#f6f6f7] dark:bg-zinc-800/70 border border-[#ebebed] dark:border-zinc-800">
                <div className="text-[10.5px] text-[#6d7175] dark:text-zinc-400">
                  {uiLang === "uz" ? "O'rtacha chek" : uiLang === "en" ? "Avg. Order" : "Средний чек"}
                </div>
                <div className="text-[12.5px] font-semibold text-[#202223] dark:text-white mt-0.5">
                  {card.avg_check}
                </div>
              </div>
            )}
            {card.customers_count !== undefined && (
              <div className="p-2.5 rounded-xl bg-[#f6f6f7] dark:bg-zinc-800/70 border border-[#ebebed] dark:border-zinc-800">
                <div className="text-[10.5px] text-[#6d7175] dark:text-zinc-400">
                  {uiLang === "uz" ? "Mijozlar" : uiLang === "en" ? "Customers" : "Клиентов"}
                </div>
                <div className="text-[12.5px] font-semibold text-[#202223] dark:text-white mt-0.5">
                  {card.customers_count}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (card.type === "orders" || Array.isArray(card.orders)) {
      const orders = card.orders || [];
      return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 shadow-2xs p-3.5 space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-[#00a86b]" />
              <span className="text-[12.5px] font-bold text-[#202223] dark:text-white">
                {card.title || `Заказы (${card.orders_count ?? orders.length})`}
              </span>
            </div>
            <Link
              to="/orders"
              className="text-[11px] font-semibold text-[#005bd3] hover:underline flex items-center gap-0.5"
            >
              <span>{uiLang === "uz" ? "Barchasi" : uiLang === "en" ? "All orders" : "Все заказы"}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-3 text-center text-[12px] text-[#6d7175]">
              {uiLang === "uz"
                ? "Buyurtmalar topilmadi."
                : uiLang === "en"
                ? "No orders found."
                : "Заказы по данному запросу не найдены."}
            </div>
          ) : (
            <div className="divide-y divide-[#f1f2f4] dark:divide-zinc-800">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="py-2 flex items-center justify-between hover:bg-[#f6f6f7] dark:hover:bg-zinc-800/60 px-2 -mx-2 rounded-lg cursor-pointer transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-[#202223] dark:text-white">
                        #{o.id}
                      </span>
                      <span className="text-[12px] text-[#303030] dark:text-zinc-300 truncate">
                        {o.customer_name}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[#6d7175]">{o.created_at}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-bold text-[#202223] dark:text-white">
                      {o.total_amount}
                    </div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#00a86b] text-white">
                      {o.status_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (card.type === "product_draft") {
      const isCreated = Boolean(createdProductCardIds[msgId]);
      const isSaving = creatingProductCardId === msgId;
      return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 shadow-2xs p-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#00a86b]" />
              <span className="text-[12.5px] font-bold text-[#202223] dark:text-white">
                {card.product_name}
              </span>
            </div>
            {card.category && (
              <span className="px-2 py-0.5 rounded-md bg-[#f1f2f4] dark:bg-zinc-800 text-[10.5px] font-medium text-[#303030] dark:text-zinc-300">
                {card.category}
              </span>
            )}
          </div>

          {card.description && (
            <p className="text-[12px] text-[#303030] dark:text-zinc-300 leading-relaxed">
              {card.description}
            </p>
          )}

          <div className="pt-2 border-t border-[#f1f2f4] dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-[#202223] dark:text-white">
              {card.suggested_price || "250 000 UZS"}
            </span>
            {isCreated ? (
              <Link
                to="/products"
                className="px-3 py-1.5 rounded-lg bg-[#00a86b] text-white text-[11.5px] font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {uiLang === "uz"
                    ? "Katalogga qo'shildi"
                    : uiLang === "en"
                    ? "Added to catalog"
                    : "Добавлено в каталог"}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleCreateProductFromDraft(msgId, card)}
                className="px-3 py-1.5 rounded-lg bg-[#202223] hover:bg-black text-white dark:bg-white dark:text-[#202223] text-[11.5px] font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {isSaving
                    ? uiLang === "uz"
                      ? "Saqlanmoqda..."
                      : uiLang === "en"
                      ? "Saving..."
                      : "Сохранение..."
                    : uiLang === "uz"
                    ? "Katalogga qo'shish"
                    : uiLang === "en"
                    ? "Add to catalog"
                    : "Добавить в каталог"}
                </span>
              </button>
            )}
          </div>
        </div>
      );
    }

    if (card.type === "image_studio" && card.image_url) {
      return (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 shadow-2xs p-3 space-y-2">
          <img
            src={card.image_url}
            alt={card.product_name || "Product"}
            className="w-full h-52 object-contain rounded-xl bg-[#111213]"
          />
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="font-semibold text-[#202223] dark:text-white">
              {card.title || "Студийное фото"}
            </span>
            <Link to="/products" className="text-[#005bd3] hover:underline font-medium">
              {uiLang === "uz" ? "Katalogga →" : uiLang === "en" ? "Catalog →" : "В каталог →"}
            </Link>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Mobile Backdrop Only (Desktop uses Push-Layout without overlapping the workspace) */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sidekick Docked Push-Column on Desktop (lg+) & Slide-Over Drawer on Mobile */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 lg:static lg:z-auto lg:h-screen lg:sticky lg:top-0 lg:shrink-0 ${
          isExpanded ? "w-full sm:w-[540px] lg:w-[520px]" : "w-full sm:w-[400px] lg:w-[380px]"
        } bg-white dark:bg-[#141417] border-l border-[#e1e3e5] dark:border-zinc-800 flex flex-col transition-all duration-200 shadow-2xl lg:shadow-none`}
      >
        {/* Clean Shopify Sidekick Header: Left = "Недавние ▾", Right = New Chat, Expand, Close */}
        <div className="h-14 px-4 border-b border-[#ebebeb] dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div ref={recentsMenuRef} className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowRecentsMenu((v) => !v)}
              className="px-2.5 py-1.5 -ml-1.5 rounded-lg text-[13.5px] font-semibold text-[#202223] dark:text-zinc-100 hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>
                {uiLang === "uz" ? "So'nggilar" : uiLang === "en" ? "Recents" : "Недавние"}
              </span>
              <svg className="w-4 h-4 text-[#5c5f62]" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {showRecentsMenu && (
              <div className="absolute left-0 top-11 w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800 shadow-2xl py-2 px-1.5 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-[#6d7175] dark:text-zinc-400">
                  {uiLang === "uz" ? "Bugun" : uiLang === "en" ? "Today" : "Сегодня"}
                </div>

                <div className="space-y-0.5 max-h-60 overflow-y-auto my-1">
                  {recentSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setShowRecentsMenu(false);
                        setIsVoiceCallMode(false);
                        if (session.messages.length > 0) {
                          setMessages(session.messages);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#f6f6f7] dark:hover:bg-zinc-800 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#00a86b] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-[#202223] dark:text-zinc-100 truncate">
                          {session.title}
                        </div>
                        {session.isVoiceSession && (
                          <div className="text-[10.5px] text-[#6d7175] flex items-center gap-1 mt-0.5">
                            <span>
                              {uiLang === "uz"
                                ? "Ovozli seans"
                                : uiLang === "en"
                                ? "Voice session"
                                : "Голосовой сеанс"}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#f1f2f4] dark:border-zinc-800 pt-1 mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="w-full px-3 py-2 rounded-xl text-left text-[12.5px] font-medium text-[#202223] dark:text-zinc-100 hover:bg-[#f6f6f7] dark:hover:bg-zinc-800 flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {uiLang === "uz"
                        ? "Yangi muloqot"
                        : uiLang === "en"
                        ? "New conversation"
                        : "Новый диалог"}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-[#616161]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="w-full px-3 py-2 rounded-xl text-left text-[12.5px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {uiLang === "uz"
                        ? "Tarixni tozalash"
                        : uiLang === "en"
                        ? "Clear history"
                        : "Очистить историю"}
                    </span>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right 3 Clean Shopify Sidekick Header Icons: New Chat (Square-Pen), Expand/Collapse, Close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a4a4a] dark:text-zinc-300 hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 transition cursor-pointer"
              title={
                uiLang === "uz"
                  ? "Yangi suhbat"
                  : uiLang === "en"
                  ? "New conversation"
                  : "Новый диалог"
              }
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center text-[#4a4a4a] dark:text-zinc-300 hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 transition cursor-pointer"
              title={
                isExpanded
                  ? uiLang === "uz"
                    ? "Kichraytirish"
                    : uiLang === "en"
                    ? "Collapse width"
                    : "Сузить панель"
                  : uiLang === "uz"
                  ? "Kengaytirish"
                  : uiLang === "en"
                  ? "Expand width"
                  : "Расширить панель"
              }
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a4a4a] dark:text-zinc-300 hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 transition cursor-pointer"
              title={uiLang === "uz" ? "Yopish" : uiLang === "en" ? "Close" : "Закрыть"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: Dedicated Shopify Live Voice Call Screen OR Chat Feed */}
        {isVoiceCallMode ? (
          <div className="flex-1 flex flex-col justify-between p-5 bg-white dark:bg-[#141417] text-[#202223] dark:text-white overflow-hidden relative">
            {/* Top Call Timer Pill */}
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-[#f6f6f7] dark:bg-zinc-800 border border-[#e3e5e7] dark:border-zinc-700 text-[11px] font-medium text-[#616161] dark:text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00a86b] animate-pulse" />
                <span>
                  Sidekick Live • {Math.floor(callDuration / 60)}:
                  {(callDuration % 60).toString().padStart(2, "0")}
                </span>
              </span>
            </div>

            {/* Center Avatar + Dynamic Status + Live Transcript */}
            <div className="flex flex-col items-center justify-center my-auto py-4 space-y-5 z-10">
              <div className="relative flex items-center justify-center">
                <div
                  className={`absolute rounded-full transition-all duration-500 pointer-events-none ${
                    voiceCallStatus === "speaking"
                      ? "w-32 h-32 bg-[#00a86b]/15 ring-2 ring-[#00a86b]/35 animate-ping"
                      : voiceCallStatus === "thinking"
                      ? "w-28 h-28 bg-sky-500/15 ring-2 ring-sky-400/30 animate-pulse"
                      : "w-26 h-26 bg-emerald-500/10 dark:bg-zinc-800/40"
                  }`}
                />
                <div className="relative w-24 h-24 rounded-full bg-[#1c1d1f] text-white flex items-center justify-center shadow-xl border border-zinc-700">
                  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                    <rect
                      x="7"
                      y="17"
                      width="14"
                      height="11"
                      rx="3.5"
                      stroke="white"
                      strokeWidth="2.6"
                      fill="#2c2d30"
                    />
                    <rect
                      x="27"
                      y="17"
                      width="14"
                      height="11"
                      rx="3.5"
                      stroke="white"
                      strokeWidth="2.6"
                      fill="#2c2d30"
                    />
                    <path d="M21 21.5H27" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
                    <circle cx="14" cy="22.5" r="2" fill="white" />
                    <circle cx="34" cy="22.5" r="2" fill="white" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#00a86b] text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2 max-w-xs px-2">
                <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-[#4a4a4a] dark:text-zinc-300">
                  {voiceCallStatus === "thinking" && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00a86b]" />
                  )}
                  <span>
                    {isCallMuted
                      ? uiLang === "uz"
                        ? "Mikrofon o'chirilgan"
                        : uiLang === "en"
                        ? "Microphone muted"
                        : "Микрофон отключен"
                      : voiceStepText}
                  </span>
                </div>
                {liveTranscript && (
                  <p className="text-[12.5px] font-medium text-[#202223] dark:text-zinc-100 bg-[#f6f6f7] dark:bg-zinc-800/90 px-3.5 py-2 rounded-2xl border border-[#e1e3e5] dark:border-zinc-700 shadow-2xs">
                    «{liveTranscript}»
                  </p>
                )}
              </div>

              {lastVoiceCard && (
                <div className="w-full max-w-[340px] max-h-44 overflow-y-auto space-y-2 px-1">
                  {lastVoiceCard.data_card ? (
                    renderDataCard(lastVoiceCard.data_card, "voice_live")
                  ) : (
                    <div className="rounded-2xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800 p-3 text-[12px] text-[#202223] dark:text-zinc-200 leading-relaxed">
                      {lastVoiceCard.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Animated Glowing Waveform + Mute & Red End Call (×) Buttons */}
            <div className="space-y-4 z-10 pt-2">
              {/* Animated Multi-Color Glowing Equalizer Wave (Shopify Sidekick style) */}
              <div className="relative h-14 flex items-center justify-center gap-1.5 px-6 overflow-hidden rounded-2xl bg-gradient-to-t from-sky-500/10 via-violet-500/5 to-transparent py-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((bar) => {
                  const isActiveWave =
                    !isCallMuted &&
                    (voiceCallStatus === "listening" ||
                      voiceCallStatus === "speaking" ||
                      voiceCallStatus === "thinking");
                  return (
                    <span
                      key={bar}
                      style={{
                        animationDelay: `${bar * 90}ms`,
                        height: isActiveWave
                          ? `${16 + ((bar * 13) % 26)}px`
                          : "6px",
                      }}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        voiceCallStatus === "speaking"
                          ? "bg-gradient-to-t from-[#00a86b] via-[#0096ff] to-[#a855f7] animate-pulse"
                          : isActiveWave
                          ? "bg-gradient-to-t from-[#005bd3] via-[#38bdf8] to-[#00a86b] animate-pulse"
                          : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Two Circular Controls: Mute Microphone (Gray) & End Call × (Red) */}
              <div className="flex items-center justify-center gap-4 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !isCallMuted;
                    setIsCallMuted(nextMuted);
                    isCallMutedRef.current = nextMuted;
                    if (nextMuted && recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch (_) {}
                    } else if (!nextMuted && recognitionRef.current) {
                      try {
                        recognitionRef.current.start();
                      } catch (_) {}
                    }
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-sm cursor-pointer ${
                    isCallMuted
                      ? "bg-rose-100 text-rose-600 border border-rose-200"
                      : "bg-[#f1f2f4] hover:bg-[#e3e5e7] dark:bg-zinc-800 text-[#202223] dark:text-white border border-[#d2d5d8] dark:border-zinc-700"
                  }`}
                  title={
                    isCallMuted
                      ? uiLang === "uz"
                        ? "Mikrofonni yoqish"
                        : uiLang === "en"
                        ? "Unmute microphone"
                        : "Включить микрофон"
                      : uiLang === "uz"
                      ? "Mikrofonni o'chirish"
                      : uiLang === "en"
                      ? "Mute microphone"
                      : "Отключить микрофон"
                  }
                >
                  {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={endVoiceCall}
                  className="w-12 h-12 rounded-full bg-[#e51c00] hover:bg-[#c81900] text-white shadow-lg flex items-center justify-center transition cursor-pointer"
                  title={
                    uiLang === "uz"
                      ? "Suhbatni yakunlash"
                      : uiLang === "en"
                      ? "End voice call"
                      : "Завершить голосовой сеанс"
                  }
                >
                  <X className="w-5 h-5" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-3 py-6 space-y-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative w-16 h-16 rounded-full bg-[#1c1d1f] text-white flex items-center justify-center shadow-md">
                      <svg className="w-9 h-9" viewBox="0 0 48 48" fill="none">
                        <rect
                          x="7"
                          y="17"
                          width="14"
                          height="11"
                          rx="3.5"
                          stroke="white"
                          strokeWidth="2.6"
                          fill="#2c2d30"
                        />
                        <rect
                          x="27"
                          y="17"
                          width="14"
                          height="11"
                          rx="3.5"
                          stroke="white"
                          strokeWidth="2.6"
                          fill="#2c2d30"
                        />
                        <path
                          d="M21 21.5H27"
                          stroke="white"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                        />
                        <circle cx="14" cy="22.5" r="2" fill="white" />
                        <circle cx="34" cy="22.5" r="2" fill="white" />
                      </svg>
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00a86b] text-white flex items-center justify-center">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[13px] font-medium text-[#616161] dark:text-zinc-400">
                        {uiLang === "uz"
                          ? `Salom, ${store?.name || "Do'kon"}`
                          : uiLang === "en"
                          ? `Hey ${store?.name || "Seller"}`
                          : `Привет, ${store?.name || "Селлер"}`}
                      </p>
                      <h2 className="text-[20px] font-bold text-[#202223] dark:text-white tracking-tight">
                        {uiLang === "uz"
                          ? "Nimadan boshlaymiz?"
                          : uiLang === "en"
                          ? "Where should we start?"
                          : "С чего начнем?"}
                      </h2>
                    </div>
                  </div>

                  <div className="w-full space-y-2 max-w-[340px]">
                    {quickSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(item.prompt)}
                        className="w-full px-3.5 py-2.5 text-left rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 hover:bg-[#ebebeb] dark:hover:bg-zinc-800 border border-[#e1e3e5] dark:border-zinc-800 text-[12.5px] text-[#202223] dark:text-zinc-200 font-medium transition flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate pr-2">{item.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#616161] group-hover:text-[#202223] dark:group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) =>
                  m.sender === "system_voice" ? (
                    <div
                      key={m.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 text-xs text-[#616161] dark:text-zinc-400"
                    >
                      <div className="flex items-center gap-2 font-medium text-[#202223] dark:text-zinc-200">
                        <span className="w-2 h-2 rounded-full bg-[#00a86b]" />
                        <span>{m.text}</span>
                      </div>
                      <span className="text-[10.5px]">{m.timestamp}</span>
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${
                        m.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.sender === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-[#1c1d1f] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#00a86b]" />
                        </div>
                      )}

                      <div
                        className={`max-w-[90%] space-y-2 ${
                          m.sender === "user" ? "items-end" : "w-full"
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-[12.5px] leading-relaxed ${
                            m.sender === "user"
                              ? "bg-[#f1f2f4] text-[#202223] dark:bg-zinc-800 dark:text-white rounded-tr-xs"
                              : "bg-white dark:bg-zinc-900 text-[#202223] dark:text-zinc-200 rounded-tl-xs border border-[#ebebeb] dark:border-zinc-800"
                          }`}
                        >
                          <div className="whitespace-pre-line">{m.text}</div>

                          {m.sender === "assistant" && m.audio_base64 && (
                            <div className="mt-2 pt-1.5 border-t border-[#f1f2f4] dark:border-zinc-800/80 flex items-center justify-between text-[10.5px] text-[#8c9196]">
                              <span>{m.timestamp}</span>
                              <button
                                type="button"
                                onClick={() => handleSpeakMessage(m)}
                                className="flex items-center gap-1 text-[#00a86b] hover:underline font-medium cursor-pointer"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>
                                  {isSpeaking
                                    ? uiLang === "uz"
                                      ? "To'xtatish"
                                      : uiLang === "en"
                                      ? "Stop"
                                      : "Стоп"
                                    : uiLang === "uz"
                                    ? "Eshitish"
                                    : uiLang === "en"
                                    ? "Listen"
                                    : "Озвучить"}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {m.action && m.action.type === "NAVIGATE" && (
                          <div
                            onClick={() => navigate(toSpaPath(m.action?.target, m.action?.spa_path))}
                            className="px-3 py-2 rounded-xl bg-[#e6f7f0] dark:bg-emerald-950/30 border border-[#8ce0bf] dark:border-emerald-800 flex items-center justify-between text-[12px] cursor-pointer hover:opacity-90 transition"
                          >
                            <div className="flex items-center gap-2 font-medium text-[#007f52] dark:text-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-[#00a86b]" />
                              <span>
                                {uiLang === "uz"
                                  ? "Bo'limga o'tildi:"
                                  : uiLang === "en"
                                  ? "Navigated to:"
                                  : "Переход выполнен:"}{" "}
                                <b>{m.action.title || m.action.target}</b>
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#00a86b]" />
                          </div>
                        )}

                        {m.data_card && renderDataCard(m.data_card, m.id)}
                      </div>
                    </div>
                  )
                )
              )}

              {isLoading && (
                <div className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full bg-[#1c1d1f] text-white flex items-center justify-center shrink-0 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-[#00a86b]" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 flex items-center gap-2 text-xs text-[#6d7175]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00a86b]" />
                    <span>
                      {uiLang === "uz"
                        ? "Sidekick o'ylamoqda..."
                        : uiLang === "en"
                        ? "Sidekick is thinking..."
                        : "Sidekick думает..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Bar (Shopify Sidekick style: +, Mic, Voice Call Waveform Button, Send) */}
            <div className="p-3 bg-white dark:bg-[#141417] border-t border-[#ebebeb] dark:border-zinc-800">
              {attachedPreview && (
                <div className="mb-2 p-2 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={attachedPreview}
                      alt="Attached"
                      className="w-10 h-10 rounded-lg object-cover border border-[#d2d5d8]"
                    />
                    <span className="text-xs font-medium text-[#202223] dark:text-zinc-200 truncate max-w-[180px]">
                      {attachedFile?.name || "photo.jpg"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFile(null);
                      setAttachedPreview(null);
                    }}
                    className="p-1 text-[#616161] hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="rounded-2xl border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:border-[#202223] dark:focus-within:border-zinc-500 shadow-2xs transition-all overflow-hidden"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="px-3.5 pt-3 pb-1.5">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isListening
                        ? uiLang === "uz"
                          ? "Gapiring..."
                          : uiLang === "en"
                          ? "Listening..."
                          : "Говорите..."
                        : uiLang === "uz"
                        ? "Qanday yordam bera olaman?"
                        : uiLang === "en"
                        ? "How can I help?"
                        : "Чем я могу помочь?"
                    }
                    className="w-full bg-transparent text-[13px] text-[#202223] dark:text-white placeholder-[#8c9196] focus:outline-none"
                  />
                </div>

                <div className="px-2.5 pb-2.5 pt-1 flex items-center justify-between">
                  {/* Left: + Attach Photo & Auto-Voice Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#616161] hover:text-[#202223] hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 transition cursor-pointer"
                      title={
                        uiLang === "uz"
                          ? "Rasm biriktirish"
                          : uiLang === "en"
                          ? "Attach photo"
                          : "Добавить файлы и др."
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleVoiceEnabled}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        voiceEnabled
                          ? "text-[#00a86b] bg-[#e6f7f0] dark:bg-emerald-950/40"
                          : "text-[#8c9196] hover:text-[#202223] hover:bg-[#f1f2f4] dark:hover:bg-zinc-800"
                      }`}
                      title={
                        voiceEnabled
                          ? "Авто-озвучка ответов включена"
                          : "Включить авто-озвучку ответов"
                      }
                    >
                      {voiceEnabled ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Right: Mic Dictation + Send / Shopify Voice Mode Button */}
                  <div className="flex items-center gap-1.5">
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleMicDictation}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          isListening
                            ? "bg-rose-500 text-white animate-pulse"
                            : "text-[#616161] hover:text-[#202223] hover:bg-[#f1f2f4] dark:hover:bg-zinc-800"
                        }`}
                        title={
                          uiLang === "uz"
                            ? "Ovoz bilan yozish"
                            : uiLang === "en"
                            ? "Voice input"
                            : "Голосовой ввод"
                        }
                      >
                        {isListening ? (
                          <MicOff className="w-3.5 h-3.5" />
                        ) : (
                          <Mic className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {input.trim() || attachedFile ? (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-7 h-7 rounded-full bg-[#202223] dark:bg-white text-white dark:text-[#202223] flex items-center justify-center transition cursor-pointer"
                        title={uiLang === "uz" ? "Yuborish" : uiLang === "en" ? "Send" : "Отправить"}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 -rotate-45" />
                      </button>
                    ) : (
                      /* Shopify Sidekick Voice Call Mode Button (Gradient Waveform Circle) */
                      <button
                        type="button"
                        onClick={startVoiceCall}
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#005bd3] via-[#00a86b] to-[#a855f7] text-white shadow-xs hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer"
                        title={
                          uiLang === "uz"
                            ? "Jonli ovozli muloqot (Voice Mode)"
                            : uiLang === "en"
                            ? "Live Voice Mode"
                            : "Голосовой режим Sidekick (живой диалог)"
                        }
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M6 10v4M10 7v10M14 9v6M18 11v2"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </aside>
    </>
  );
};
