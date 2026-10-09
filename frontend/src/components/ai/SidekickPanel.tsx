import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Phone,
  PhoneOff,
  Maximize2,
  Minimize2,
  Eye,
  Camera,
  UploadCloud,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { BannerCanvas } from "./BannerCanvas";

// Programmatically detects the language of text to prevent voice accent mismatch
export const detectTextLanguage = (text: string): "ru" | "uz" | "en" => {
  if (!text) return "ru";
  if (/[а-яё]/i.test(text)) return "ru";
  if (
    /\b(va|uchun|do'kon|tovar|buyurtma|narx|chegirma|men|siz|boladi|yarat|qora|oq|haqida|yozuv|ko'rsat|rasm|salom|qil|qiling)\b/i.test(
      text
    ) ||
    /[o‘g‘ʻʼ]/i.test(text)
  ) {
    return "uz";
  }
  if (/[a-z]/i.test(text)) return "en";
  return "ru";
};

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
    clean = clean.replace(/\bUZS\b/gi, "so'm");
    clean = clean.replace(/\b(\d+)\s*%/g, "$1 foiz");
  } else if (currentLang === "en") {
    clean = clean.replace(/\bUZS\b/gi, "sums");
    clean = clean.replace(/\b(\d+)\s*%/g, "$1 percent");
  } else {
    clean = clean.replace(/\bUZS\b/gi, "сум");
    clean = clean.replace(/\bсум\./gi, "сум");
    clean = clean.replace(/\b(\d+)\s*%/g, "$1 процентов");
    clean = clean.replace(/\bшт\./gi, "штук");
  }

  // 6. Normalize multiple spaces and line breaks
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
};

// Programmatic Quality Scorer for Neural / Natural / Premium WebSpeech voices
export const scoreVoice = (
  voice: SpeechSynthesisVoice,
  targetLang: "ru" | "uz" | "en",
  preferredGender: "female" | "male"
): number => {
  const name = voice.name.toLowerCase();
  const uri = voice.voiceURI.toLowerCase();
  const lang = voice.lang.toLowerCase();

  // 1. HARD BAN: Immediately disqualify legacy, robotic, and low-bitrate synthesizers
  if (
    /compact|eloquence|espeak|klatt|whisper|zarvox|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|pipe organ|trinoids|wobble|junior|albert|fred|ralph/i.test(
      name
    ) ||
    /compact|eloquence/i.test(uri)
  ) {
    return -10000;
  }

  let score = 0;

  // 2. Language Matching
  if (targetLang === "ru") {
    if (lang.startsWith("ru")) score += 200;
    else return -5000;
  } else if (targetLang === "en") {
    if (lang.startsWith("en")) score += 200;
    else return -5000;
  } else if (targetLang === "uz") {
    if (lang.startsWith("uz")) {
      score += 300; // Native Uzbek voice is gold standard
    } else if (lang.startsWith("tr")) {
      // High-quality Turkish neural voice fallback (authentic Turkic vowel harmony for Uzbek Latin text)
      score += 150;
    } else {
      return -5000;
    }
  }

  // 3. Neural & High-Fidelity Multipliers
  // Microsoft Azure 48kHz Natural voices (Edge / Chromium)
  if (/natural|online \(natural\)/i.test(name)) score += 120;
  // Neural / WaveNet / Cloud / Studio
  if (/neural|wavenet|studio|cloud/i.test(name)) score += 100;
  // Apple Silicon Enhanced & Premium voices (Milena Enhanced, Samantha Enhanced, Ava Premium)
  if (/enhanced|premium/i.test(name) || /enhanced|premium/i.test(uri)) score += 90;
  // Google Neural Voices (Chrome)
  if (/google/i.test(name)) score += 80;
  // Apple Siri voices
  if (/siri/i.test(name) || /siri/i.test(uri)) score += 75;

  // 4. Gender Matching
  const isFemaleName = /svetlana|milena|katya|anna|victoria|jenny|madina|emel|filiz|yelda|samantha|ava|zoe|aria|female|woman|девушк|женск/i.test(
    name
  );
  const isMaleName = /dmitry|yuri|pavel|guy|sardor|ahmet|cem|daniel|evan|nathan|male|man|мужск/i.test(
    name
  );

  if (preferredGender === "female") {
    if (isFemaleName) score += 60;
    else if (isMaleName) score -= 40;
  } else {
    if (isMaleName) score += 60;
    else if (isFemaleName) score -= 40;
  }

  return score;
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

  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Shopify Sidekick Live Voice Mode (Живой звонок со сферой)
  const [isVoiceCallMode, setIsVoiceCallMode] = useState<boolean>(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState<"connecting" | "listening" | "thinking" | "speaking">("listening");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isCallMuted, setIsCallMuted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [liveAssistantText, setLiveAssistantText] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [generatingSkeleton, setGeneratingSkeleton] = useState<boolean>(false);

  // Voice Settings & Neural TTS
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("storebox_sidekick_tts") !== "false";
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem("storebox_sidekick_voice_uri") || "";
  });
  const [preferredGender, setPreferredGender] = useState<"female" | "male">(() => {
    return (localStorage.getItem("storebox_sidekick_gender") as "female" | "male") || "female";
  });
  const [speechRate, setSpeechRate] = useState<number>(0.98);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const studioFileInputRef = useRef<HTMLInputElement>(null);

  // AI Studio (Image-to-Image / Inpaint) State
  const [activeTab, setActiveTab] = useState<"chat" | "studio">("chat");
  const [studioPrompt, setStudioPrompt] = useState<string>(
    "Помести товар на деревянный стол и добавь студийный свет"
  );
  const [studioImageFile, setStudioImageFile] = useState<File | null>(null);
  const [studioImagePreview, setStudioImagePreview] = useState<string | null>(null);
  const [studioIsListening, setStudioIsListening] = useState<boolean>(false);
  const [studioIsProcessing, setStudioIsProcessing] = useState<boolean>(false);
  const [studioResult, setStudioResult] = useState<any>(null);
  const [studioComparisonMode, setStudioComparisonMode] = useState<"after" | "before" | "split">("after");
  const [studioSavedSuccess, setStudioSavedSuccess] = useState<boolean>(false);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [showCatalogPicker, setShowCatalogPicker] = useState<boolean>(false);
  const [fooocusStatus, setFooocusStatus] = useState<any>({
    available: false,
    engine: "Neural Inpaint Studio (Apple Silicon M2)",
    url: null,
  });

  // Fetch Fooocus Status & Catalog Products on Mount
  useEffect(() => {
    if (!isOpen) return;

    api.get("/ai/fooocus-status/")
      .then((res) => {
        if (res.data) setFooocusStatus(res.data);
      })
      .catch((_) => {});

    api.get("/products/?page_size=20")
      .then((res) => {
        const items = res.data?.results || res.data || [];
        setCatalogProducts(Array.isArray(items) ? items : []);
      })
      .catch((_) => {});
  }, [isOpen]);

  // Live call duration timer
  useEffect(() => {
    let timer: any;
    if (isVoiceCallMode) {
      timer = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isVoiceCallMode]);

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

  // 2. Select highest-tier neural voice for active language and gender
  const getBestVoiceForLanguage = (targetLang: "ru" | "uz" | "en") => {
    if (!availableVoices.length) return null;

    if (selectedVoiceURI) {
      const chosen = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (chosen) return chosen;
    }

    const scored = availableVoices
      .map((v) => ({ voice: v, score: scoreVoice(v, targetLang, preferredGender) }))
      .filter((item) => item.score > -1000)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return scored[0].voice;
    }

    const fallback = availableVoices.find((v) =>
      targetLang === "ru"
        ? v.lang.startsWith("ru")
        : targetLang === "en"
        ? v.lang.startsWith("en")
        : v.lang.startsWith("uz") || v.lang.startsWith("tr")
    );
    return fallback || null;
  };

  // 3. Natural Voice TTS Speaker with automatic language resolution
  const speakText = (
    text: string,
    forceLang?: "ru" | "uz" | "en",
    onEndCallback?: () => void
  ) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }
    try {
      window.speechSynthesis.cancel();

      // CRITICAL FIX: Automatically detect text language so Russian is NEVER read by an Uzbek voice!
      const currentTargetLang = forceLang || detectTextLanguage(text);
      const clean = cleanTextForSpeech(text, currentTargetLang);
      if (!clean) {
        if (onEndCallback) onEndCallback();
        return;
      }

      const voice = getBestVoiceForLanguage(currentTargetLang);
      const voiceLang = voice
        ? voice.lang
        : currentTargetLang === "ru"
        ? "ru-RU"
        : currentTargetLang === "en"
        ? "en-US"
        : "tr-TR";

      const sentenceChunks = clean
        .replace(/([.!?])\s+/g, "$1|#|")
        .split("|#|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const speechQueue = sentenceChunks.slice(0, 3);

      speechQueue.forEach((chunk, idx) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        if (voice) {
          utterance.voice = voice;
        }
        utterance.lang = voiceLang;
        utterance.rate = speechRate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (idx === speechQueue.length - 1 && onEndCallback) {
          utterance.onend = () => {
            onEndCallback();
          };
        }

        window.speechSynthesis.speak(utterance);
      });
    } catch (e) {
      console.warn("TTS speak failed:", e);
      if (onEndCallback) onEndCallback();
    }
  };

  // 4. Initialize Speech Recognition with Hands-Free Live Call Loop
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
          if (isVoiceCallMode) setVoiceCallStatus("listening");
        };

        recognition.onresult = (event: any) => {
          let transcript = "";
          let isFinal = false;
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) isFinal = true;
          }

          if (isVoiceCallMode) {
            setLiveTranscript(transcript);
            if (isFinal && transcript.trim()) {
              handleVoiceCallTurn(transcript.trim());
            }
          } else {
            setInput(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (isVoiceCallMode && !isCallMuted && event.error === "no-speech") {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (isVoiceCallMode && !isCallMuted && voiceCallStatus === "listening") {
            try {
              recognition.start();
            } catch (_) {}
          }
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("SpeechRecognition init failed:", e);
      }
    }
  }, [isVoiceCallMode, isCallMuted, voiceCallStatus]);

  // Hands-free Voice Call Turn Handler
  const handleVoiceCallTurn = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    const detected = detectTextLanguage(spokenText);
    setActiveLang(detected);
    setVoiceCallStatus("thinking");
    setLiveTranscript(spokenText);

    const userMsg: SidekickMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: spokenText,
      isVoice: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.post("/ai/chat/", {
        message: spokenText,
        lang: detected,
      });

      const data = res.data;
      setLiveAssistantText(data.text);

      // Execute navigation if user said "открой заказы" or similar
      if (data.action_type === "navigate" && data.action_data?.path) {
        navigate(data.action_data.path);
      }

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

      // Speak response back with animated orb pulsing, then resume listening!
      setVoiceCallStatus("speaking");
      speakText(data.text, detected, () => {
        if (isVoiceCallMode && !isCallMuted) {
          setVoiceCallStatus("listening");
          setLiveTranscript("");
          if (recognitionRef.current) {
            try {
              recognitionRef.current.lang =
                detected === "ru" ? "ru-RU" : detected === "en" ? "en-US" : "uz-UZ";
              recognitionRef.current.start();
            } catch (_) {}
          }
        }
      });
    } catch (err) {
      console.error("Voice turn error:", err);
      setVoiceCallStatus("listening");
    }
  };

  // Start Shopify Sidekick Live Voice Call
  const startVoiceCall = () => {
    setIsVoiceCallMode(true);
    setVoiceCallStatus("listening");
    setLiveTranscript("");
    setLiveAssistantText("");
    setCallDuration(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang =
          activeLang === "ru" ? "ru-RU" : activeLang === "en" ? "en-US" : "uz-UZ";
        recognitionRef.current.start();
      } catch (_) {}
    }
  };

  // End Shopify Sidekick Live Voice Call
  const endVoiceCall = () => {
    setIsVoiceCallMode(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    const durStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    const summaryMsg: SidekickMessage = {
      id: "call_" + Date.now(),
      sender: "assistant",
      text:
        activeLang === "uz"
          ? `🎙️ **Ovozli muloqot yakunlandi (${durStr})**\nSidekick AI bilan jonli ovozli suhbat o'tkazildi. Barcha buyruqlar muvaffaqiyatli bajarildi.`
          : activeLang === "en"
          ? `🎙️ **Voice Call Finished (${durStr})**\nLive interactive call completed with Sidekick AI. Commands executed.`
          : `🎙️ **Голосовой диалог завершен (${durStr})**\nЗавершен интерактивный голосовой сеанс с Sidekick AI. Все запросы и навигация обработаны.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, summaryMsg]);
    setCallDuration(0);
  };

  // Toggle Live Call Mute State
  const toggleCallMute = () => {
    const next = !isCallMuted;
    setIsCallMuted(next);
    if (next) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    } else {
      if (isVoiceCallMode && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
    }
  };

  // Save messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("storebox_sidekick_messages", JSON.stringify(messages.slice(-30)));
    } catch (_) {}
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading, generatingSkeleton]);

  // Toggle Standard Mic Input
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang =
          activeLang === "ru" ? "ru-RU" : activeLang === "en" ? "en-US" : "uz-UZ";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Error starting speech recognition:", err);
      }
    }
  };

  // Test voice preview (gender- and language-aware)
  const handleTestVoice = () => {
    const sample =
      activeLang === "uz"
        ? (preferredGender === "male"
            ? "Assalomu alaykum! Men StoreBox biznes yordamchingiz Sardorman."
            : "Assalomu alaykum! Men sizning StoreBox intellektual biznes yordamchingizman.")
        : activeLang === "en"
        ? (preferredGender === "male"
            ? "Hello! I am your StoreBox intelligent co-founder David."
            : "Hello! I am your StoreBox intelligent e-commerce co-founder.")
        : (preferredGender === "male"
            ? "Здравствуйте! Я Дмитрий, ваш персональный бизнес-ассистент StoreBox."
            : "Здравствуйте! Я Милена, ваш персональный бизнес-ассистент StoreBox.");
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

  // Send standard message
  const handleSend = async (textToSend?: string, isVoiceInput = false) => {
    const query = (textToSend !== undefined ? textToSend : input).trim();
    if (!query || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const detected = detectTextLanguage(query);
    setActiveLang(detected);

    const isImageQuery = /сделай.*(?:изображен|фото)|создай.*(?:изображен|фото)|белая рубашка|белый рубашка|рубашк|rasm\s+yarat|create\s+image|studio/i.test(
      query
    );
    if (isImageQuery) {
      setGeneratingSkeleton(true);
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
        lang: detected,
      });

      const data = res.data;

      // Execute navigation if command was to open a section
      if (data.action_type === "navigate" && data.action_data?.path) {
        navigate(data.action_data.path);
      }

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
      speakText(botMsg.text, detected);
    } catch (err: any) {
      console.error("Sidekick chat error:", err);
      const errMsg: SidekickMessage = {
        id: "err_" + Date.now(),
        sender: "assistant",
        text:
          detected === "uz"
            ? "Kechirasiz, so'rovni bajarishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            : detected === "en"
            ? "Sorry, an error occurred while processing the command. Please try again."
            : "Извините, произошла ошибка обработки команды. Проверьте соединение или повторите запрос.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setGeneratingSkeleton(false);
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
            ? `🪵 Tovarni yog'och stolga joylashtir`
            : activeLang === "en"
            ? `🪵 Place on wooden table`
            : `🪵 Помести на деревянный стол`,
          activeLang === "uz"
            ? `📸 Studiya yorug'ligi va foni`
            : activeLang === "en"
            ? `📸 Studio lighting & background`
            : `📸 Сделай студийный свет и фон`,
          activeLang === "uz"
            ? `🏛️ Oq marmar foni`
            : activeLang === "en"
            ? `🏛️ White marble backdrop`
            : `🏛️ Помести на белый мрамор`,
          activeLang === "uz"
            ? `Ushbu tovar uchun reklama banneri yarat`
            : activeLang === "en"
            ? `Create promo banner for this product`
            : `Создай рекламный баннер для этого товара`,
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      // Also prefill the AI Studio with the uploaded image
      setStudioImagePreview(data.image_url);
      setStudioImageFile(file);

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

  // -----------------------------------------------------------------------
  // AI STUDIO (IMAGE-TO-IMAGE / INPAINT) ACTION HANDLERS
  // -----------------------------------------------------------------------
  const handleStudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudioImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setStudioImagePreview(localUrl);
    setStudioResult(null);
    setStudioSavedSuccess(false);
    e.target.value = "";
  };

  const handleSelectCatalogProduct = (prod: any) => {
    if (prod.image_url) {
      setStudioImagePreview(prod.image_url);
      setStudioImageFile(null);
      setStudioResult(null);
      setStudioSavedSuccess(false);
      setShowCatalogPicker(false);
      const name = prod.name_ru || prod.name_uz || "Товар";
      setStudioPrompt(`Помести ${name} на деревянный стол и добавь студийный свет`);
    }
  };

  const handleToggleStudioMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Голосовой ввод не поддерживается в этом браузере");
      return;
    }

    if (studioIsListening) {
      setStudioIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = activeLang === "ru" ? "ru-RU" : activeLang === "en" ? "en-US" : "uz-UZ";

      rec.onstart = () => setStudioIsListening(true);
      rec.onresult = (evt: any) => {
        const transcript = evt.results[0][0].transcript;
        if (transcript) {
          setStudioPrompt(transcript);
        }
      };
      rec.onerror = () => setStudioIsListening(false);
      rec.onend = () => setStudioIsListening(false);
      rec.start();
    } catch (e) {
      console.warn("Studio mic error:", e);
      setStudioIsListening(false);
    }
  };

  const handleRunStudioInpaint = async (overridePrompt?: string) => {
    const promptToUse = (overridePrompt !== undefined ? overridePrompt : studioPrompt).trim();
    if (!promptToUse) return;
    if (!studioImageFile && !studioImagePreview) {
      alert("Пожалуйста, загрузите фото товара или выберите его из каталога");
      return;
    }

    setStudioIsProcessing(true);
    setStudioSavedSuccess(false);

    try {
      const formData = new FormData();
      formData.append("prompt", promptToUse);
      formData.append("product_name", "Товар");

      if (studioImageFile) {
        formData.append("image", studioImageFile);
      } else if (studioImagePreview) {
        formData.append("image_url", studioImagePreview);
      }

      const res = await api.post("/ai/image-to-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.success) {
        setStudioResult(res.data);
        setStudioComparisonMode("after");
      } else {
        alert(res.data?.error || "Ошибка генерации студийного фото");
      }
    } catch (err: any) {
      console.error("Studio inpaint error:", err);
      alert(err.response?.data?.error || "Ошибка обработки фото");
    } finally {
      setStudioIsProcessing(false);
    }
  };

  const handleSaveStudioResultToCatalog = async () => {
    if (!studioResult || !studioResult.image_url) return;
    try {
      await api.post("/ai/save-to-catalog/", {
        image_url: studioResult.image_url,
        name: `${studioResult.product_name || "Товар"} (${studioResult.theme_title || "AI Studio"})`,
        price: 250000,
        stock: 25,
      });
      setStudioSavedSuccess(true);
      setTimeout(() => setStudioSavedSuccess(false), 4000);
    } catch (e) {
      console.error("Save to catalog error:", e);
      alert("Ошибка при сохранении в каталог");
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

  const studioPresetChips = [
    {
      label: "🪵 Деревянный стол",
      prompt: "Помести товар на деревянный стол и добавь студийный свет",
      theme: "wood",
    },
    {
      label: "📸 Студийный свет (Циклорама)",
      prompt: "Сделай профессиональный белый студийный фон циклораму и чистый свет",
      theme: "clean_white",
    },
    {
      label: "🏛️ Белый мрамор",
      prompt: "Помести товар на премиальный белый мраморный стол",
      theme: "marble",
    },
    {
      label: "☕ Уютное кафе (Боке)",
      prompt: "Помести товар в атмосферу теплого кафе с мягким боке",
      theme: "cafe_warm",
    },
    {
      label: "⚡ Темный люкс (Неон)",
      prompt: "Создай темный люксовый подиум со стильной неоновой подсветкой",
      theme: "dark_luxury",
    },
  ];

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
        className={`fixed right-0 top-0 bottom-0 z-50 ${
          isExpanded ? "w-full sm:w-[680px] lg:w-[760px]" : "w-full sm:w-[480px] lg:w-[500px]"
        } bg-white dark:bg-[#0c0d0e] shadow-2xl border-l border-slate-200/80 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out`}
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

          <div className="flex items-center gap-1.5">
            {/* Shopify Live Voice Call Mode Toggle */}
            <button
              type="button"
              onClick={isVoiceCallMode ? endVoiceCall : startVoiceCall}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isVoiceCallMode
                  ? "bg-rose-500 text-white animate-pulse shadow-sm"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-xs"
              }`}
              title={
                isVoiceCallMode
                  ? "Завершить интерактивный голосовой звонок"
                  : "Начать интерактивный голосовой звонок (Shopify Sidekick Live)"
              }
            >
              {isVoiceCallMode ? <PhoneOff className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-bold">
                {isVoiceCallMode ? "Завершить" : "Звонок"}
              </span>
            </button>

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 rounded-lg p-0.5 text-[11px] font-semibold">
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

            {/* Expand / Maximize panel width toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:flex"
              title={isExpanded ? "Свернуть панель (500px)" : "Развернуть панель (760px)"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
                className="px-2.5 py-1 rounded-md bg-violet-600 text-white font-semibold hover:bg-violet-700 transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Прослушать</span>
              </button>
            </div>

            {/* Active Neural Voice Indicator Badge */}
            {(() => {
              const activeVoice = getBestVoiceForLanguage(activeLang);
              return (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium truncate max-w-[280px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="truncate">
                      Голос: <b>{activeVoice ? activeVoice.name : "Neural Default"}</b>
                    </span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                    Neural 48kHz
                  </span>
                </div>
              );
            })()}

            {/* Gender / Timbre Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400">
                Тембр и персонаж ассистента:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreferredGender("female");
                    localStorage.setItem("storebox_sidekick_gender", "female");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    preferredGender === "female"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50"
                  }`}
                >
                  <span>👩</span>
                  <span>Женский тембр</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreferredGender("male");
                    localStorage.setItem("storebox_sidekick_gender", "male");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    preferredGender === "male"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50"
                  }`}
                >
                  <span>👨</span>
                  <span>Мужской тембр</span>
                </button>
              </div>
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
                <option value="">✨ Автоматический отбор нейросетевых голосов (Neural)</option>
                {availableVoices
                  .filter((v) =>
                    activeLang === "ru"
                      ? v.lang.startsWith("ru")
                      : activeLang === "en"
                      ? v.lang.startsWith("en")
                      : v.lang.startsWith("uz") || v.lang.startsWith("tr")
                  )
                  .map((v) => ({
                    voice: v,
                    score: scoreVoice(v, activeLang, preferredGender),
                  }))
                  .sort((a, b) => b.score - a.score)
                  .map(({ voice, score }) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {score > 150 ? "✨ [Neural] " : score > 50 ? "⭐ " : ""}
                      {voice.name} ({voice.lang})
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

        {/* Mode Switcher Tabs (Chat vs AI Studio) */}
        {!isVoiceCallMode && (
          <div className="flex border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 p-1.5 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === "chat"
                  ? "bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-300 shadow-xs border border-slate-200/60 dark:border-zinc-700"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Ассистент & Чат</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("studio")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === "studio"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>AI Фотостудия (Img2Img)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-400/20 text-emerald-600 dark:text-emerald-300">
                M2
              </span>
            </button>
          </div>
        )}

        {/* 2. Body: Either Shopify Live Voice Call Mode OR Dedicated AI Studio OR Standard Chat */}
        {isVoiceCallMode ? (
          <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-[#090a0f] via-[#10121a] to-[#090a0f] text-white relative overflow-hidden select-none">
            {/* Ambient Glowing Background Blobs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

            {/* Top Bar of Call Mode */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">
                  Live Call
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-zinc-300">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="text-[11px] font-medium text-zinc-400">
                Hands-Free Voice Mode
              </div>
            </div>

            {/* Center Orb Section */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8">
              {/* Soundwave Ripple Rings */}
              <div className="relative flex items-center justify-center">
                {/* Outer Wave 3 */}
                <div
                  className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
                    voiceCallStatus === "speaking"
                      ? "w-64 h-64 border border-violet-500/30 bg-violet-500/5 animate-ping opacity-60"
                      : voiceCallStatus === "listening"
                      ? "w-56 h-56 border border-emerald-500/25 bg-emerald-500/5 animate-pulse"
                      : "w-48 h-48 border border-white/5 opacity-20"
                  }`}
                />
                {/* Outer Wave 2 */}
                <div
                  className={`absolute rounded-full transition-all duration-500 pointer-events-none ${
                    voiceCallStatus === "speaking"
                      ? "w-52 h-52 border border-violet-400/40 bg-violet-500/10 scale-110"
                      : voiceCallStatus === "listening"
                      ? "w-44 h-44 border border-emerald-400/30 scale-105"
                      : "w-40 h-40 border border-white/10 opacity-30"
                  }`}
                />
                {/* Outer Wave 1 */}
                <div
                  className={`absolute rounded-full transition-all duration-300 pointer-events-none ${
                    voiceCallStatus === "speaking"
                      ? "w-40 h-40 border-2 border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/30"
                      : voiceCallStatus === "listening"
                      ? "w-36 h-36 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20"
                      : "w-32 h-32 border border-white/15"
                  }`}
                />

                {/* The Shopify 3D Luminous Orb */}
                <div
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full cursor-pointer transition-all duration-500 shadow-2xl flex items-center justify-center ${
                    voiceCallStatus === "speaking"
                      ? "scale-110 bg-gradient-to-tr from-fuchsia-600 via-violet-600 to-indigo-400 shadow-violet-500/60 ring-4 ring-violet-400/40"
                      : voiceCallStatus === "thinking"
                      ? "scale-95 bg-gradient-to-tr from-amber-500 via-orange-600 to-violet-600 shadow-amber-500/50 ring-4 ring-amber-400/40 animate-spin"
                      : voiceCallStatus === "listening"
                      ? "scale-100 bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-500 shadow-emerald-500/50 ring-4 ring-emerald-400/40"
                      : "bg-gradient-to-tr from-violet-700 via-indigo-700 to-slate-800 shadow-indigo-500/30"
                  }`}
                  onClick={toggleCallMute}
                  title={isCallMuted ? "Включить микрофон" : "Отключить микрофон"}
                >
                  {/* Inner Light Core / Specular */}
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/30 pointer-events-none" />
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    {voiceCallStatus === "speaking" ? (
                      <Volume2 className="w-6 h-6 text-white animate-pulse" />
                    ) : voiceCallStatus === "thinking" ? (
                      <Sparkles className="w-6 h-6 text-amber-200 animate-spin" />
                    ) : isCallMuted ? (
                      <MicOff className="w-6 h-6 text-rose-300" />
                    ) : (
                      <Mic className="w-6 h-6 text-white animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              {/* Voice Status Pill */}
              <div className="mt-8 flex flex-col items-center text-center space-y-2">
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${
                    voiceCallStatus === "speaking"
                      ? "bg-violet-950/80 border-violet-500/50 text-violet-300 shadow-md shadow-violet-500/20"
                      : voiceCallStatus === "thinking"
                      ? "bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/20"
                      : voiceCallStatus === "listening"
                      ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/20"
                      : "bg-zinc-900 border-zinc-700 text-zinc-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-ping ${
                      voiceCallStatus === "speaking"
                        ? "bg-violet-400"
                        : voiceCallStatus === "thinking"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <span>
                    {voiceCallStatus === "speaking"
                      ? activeLang === "uz"
                        ? "Sidekick javob bermoqda..."
                        : activeLang === "en"
                        ? "Sidekick is speaking..."
                        : "Отвечаю..."
                      : voiceCallStatus === "thinking"
                      ? activeLang === "uz"
                        ? "Do'kon tahlil qilinmoqda..."
                        : activeLang === "en"
                        ? "Analyzing store & data..."
                        : "Анализирую данные магазина..."
                      : activeLang === "uz"
                      ? "Sizni tinglayapman... Erkin gapiring"
                      : activeLang === "en"
                      ? "Listening to your voice... Speak freely"
                      : "Слушаю вас... Говорите свободно"}
                  </span>
                </div>

                {/* Live Subtitle Transcript */}
                <div className="max-w-sm min-h-[52px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 text-center flex items-center justify-center">
                  {liveTranscript ? (
                    <p className="italic text-white">«{liveTranscript}»</p>
                  ) : liveAssistantText ? (
                    <p className="line-clamp-2 text-zinc-200">{liveAssistantText}</p>
                  ) : (
                    <p className="text-zinc-500">
                      {activeLang === "uz"
                        ? "Masalan: «Buyurtmalarni och», «Oq ko'ylak yarat»"
                        : activeLang === "en"
                        ? "Try: «Open orders», «Create white shirt»"
                        : "Скажите: «Открой заказы» или «Создай белую рубашку»"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Call Controls & Quick Suggestions */}
            <div className="relative z-10 space-y-4">
              {/* Quick Voice Prompt Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {[
                  activeLang === "uz" ? "Buyurtmalarni och" : activeLang === "en" ? "Open orders" : "Открой заказы",
                  activeLang === "uz" ? "Oq ko'ylak yarat" : activeLang === "en" ? "Create white shirt" : "Создай белую рубашку",
                  activeLang === "uz" ? "Savdo hisoboti" : activeLang === "en" ? "Sales report" : "Отчет по продажам",
                ].map((hint, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleVoiceCallTurn(hint)}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] text-zinc-300 transition cursor-pointer"
                  >
                    💬 «{hint}»
                  </button>
                ))}
              </div>

              {/* Main Call Action Buttons */}
              <div className="flex items-center justify-center gap-5 pt-2 border-t border-white/10">
                {/* Mute Mic Button */}
                <button
                  type="button"
                  onClick={toggleCallMute}
                  className={`p-3.5 rounded-full transition cursor-pointer ${
                    isCallMuted
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-white/10 hover:bg-white/20 text-zinc-300 border border-white/10"
                  }`}
                  title={isCallMuted ? "Включить микрофон" : "Заглушить микрофон"}
                >
                  {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={endVoiceCall}
                  className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  title="Завершить голосовой звонок"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "studio" ? (
          /* =============================================================== */
          /* DEDICATED AI PHOTO STUDIO WORKSPACE (IMAGE-TO-IMAGE / INPAINT)  */
          /* =============================================================== */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. Studio Status & Architecture Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-pink-500/10 border border-violet-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    AI Фотостудия (Image-to-Image / Inpaint)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{fooocusStatus.engine || "Apple Silicon M2"}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-300 font-normal leading-relaxed">
                {activeLang === "uz"
                  ? "Haqiqiy tovar rasmini yuklang (kiyim, taom, gadjet). AI fonni tozalaydi, yog'och stol, marmar yoki studiya fonini soyalar va nur bilan hosil qilib beradi."
                  : activeLang === "en"
                  ? "Upload a product photo (food, fashion, tech). AI isolates the subject and synthesizes photorealistic studio backdrops, contact shadows, and lighting."
                  : "Загрузите реальное фото товара (еда, одежда, гаджет). ИИ удалит исходный фон и достроит реалистичное студийное окружение со светом и контактными тенями."}
              </p>
            </div>

            {/* 2. Photo Upload or Catalog Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span>1. Фотография товара</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    (реальный снимок без обработки)
                  </span>
                </label>
                {catalogProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCatalogPicker(!showCatalogPicker)}
                    className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{showCatalogPicker ? "Скрыть каталог" : "Выбрать из каталога"}</span>
                  </button>
                )}
              </div>

              {/* Catalog Horizontal Quick Picker */}
              {showCatalogPicker && catalogProducts.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-1.5 animate-in fade-in">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Товары вашего магазина:
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {catalogProducts
                      .filter((p) => p.image_url)
                      .slice(0, 10)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectCatalogProduct(p)}
                          className="shrink-0 w-24 p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-violet-500 cursor-pointer text-center group transition"
                        >
                          <img
                            src={p.image_url}
                            alt={p.name_ru || p.name_uz}
                            className="w-full h-16 object-contain rounded-md mb-1 bg-slate-100 dark:bg-zinc-900"
                          />
                          <div className="text-[10px] font-medium text-slate-800 dark:text-zinc-200 truncate group-hover:text-violet-600">
                            {p.name_ru || p.name_uz}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={studioFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleStudioFileUpload}
              />

              {studioImagePreview ? (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={studioImagePreview}
                      alt="Product Preview"
                      className="w-16 h-16 object-contain rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {studioImageFile ? studioImageFile.name : "Выбранный товар"}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" />
                        <span>Фото готово к обработке</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => studioFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 text-xs font-semibold border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
                    >
                      Заменить
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudioImagePreview(null);
                        setStudioImageFile(null);
                        setStudioResult(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Удалить фото"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => studioFileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-violet-500 dark:hover:border-violet-500 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-violet-50/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Нажмите для загрузки фото товара
                    </span>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                      PNG, JPG, WEBP (еда, одежда, аксессуары, гаджеты)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Prompt & Voice Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <span>2. Пожелания к фото (Текст или Голос)</span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleStudioMic}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    studioIsListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-violet-100 hover:text-violet-700"
                  }`}
                >
                  {studioIsListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{studioIsListening ? "Слушаю..." : "Голосовой ввод"}</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={studioPrompt}
                onChange={(e) => setStudioPrompt(e.target.value)}
                placeholder="Опишите фон и свет (например: «Помести товар на деревянный стол и добавь студийный свет»)..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition resize-none font-normal"
              />

              {/* Preset Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Быстрые студийные стили:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {studioPresetChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStudioPrompt(chip.prompt);
                        if (studioImagePreview) {
                          handleRunStudioInpaint(chip.prompt);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 hover:border-violet-300 transition cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Generate Button */}
            <button
              type="button"
              disabled={studioIsProcessing || (!studioImageFile && !studioImagePreview)}
              onClick={() => handleRunStudioInpaint()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 hover:opacity-95 disabled:opacity-40 transition transform active:scale-98 cursor-pointer"
            >
              {studioIsProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Синтез студийного фото (Inpaint M2)...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Сгенерировать фото (Image-to-Image / Inpaint)</span>
                </>
              )}
            </button>

            {/* Processing State */}
            {studioIsProcessing && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200/80 dark:border-violet-800/40 shadow-md space-y-3 animate-pulse">
                <div className="flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 animate-spin" />
                    <span>Синтез окружения и контактных теней...</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200">
                    Neural Studio M2
                  </span>
                </div>
                <div className="h-44 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 flex items-center justify-center text-xs text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="w-6 h-6 text-violet-500 animate-bounce" />
                    <span>Удаление фона • Прорисовка студийного стола и света...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Result Showcase */}
            {studioResult && !studioIsProcessing && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200 dark:border-violet-800/60 shadow-lg space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Результат фотостудии (Image-to-Image)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                      {studioResult.execution_time || "0.6s"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200">
                      {studioResult.theme_title || "Студия"}
                    </span>
                  </div>
                </div>

                {/* Comparison Mode Switcher */}
                <div className="flex bg-slate-100 dark:bg-zinc-800/80 rounded-xl p-1 gap-1 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setStudioComparisonMode("after")}
                    className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                      studioComparisonMode === "after"
                        ? "bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                    }`}
                  >
                    ✨ Студийный снимок (После)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioComparisonMode("before")}
                    className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                      studioComparisonMode === "before"
                        ? "bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                    }`}
                  >
                    📷 Исходное фото (До)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioComparisonMode("split")}
                    className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                      studioComparisonMode === "split"
                        ? "bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                    }`}
                  >
                    ↔️ Сравнить рядом
                  </button>
                </div>

                {/* Visual View */}
                {studioComparisonMode === "split" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">До (Исходное)</span>
                      <div
                        className="h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer"
                        onClick={() =>
                          setPreviewImageModal(studioResult.original_url || studioImagePreview)
                        }
                      >
                        <img
                          src={studioResult.original_url || studioImagePreview || ""}
                          alt="Before"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">После (Inpaint)</span>
                      <div
                        className="h-44 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 shadow-sm cursor-pointer"
                        onClick={() => setPreviewImageModal(studioResult.image_url)}
                      >
                        <img
                          src={studioResult.image_url}
                          alt="After"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer"
                    onClick={() =>
                      setPreviewImageModal(
                        studioComparisonMode === "before"
                          ? studioResult.original_url || studioImagePreview
                          : studioResult.image_url
                      )
                    }
                  >
                    <img
                      src={
                        studioComparisonMode === "before"
                          ? studioResult.original_url || studioImagePreview || ""
                          : studioResult.image_url
                      }
                      alt="Studio Inpaint"
                      className="w-full h-60 sm:h-72 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                      {studioComparisonMode === "before" ? "📷 Исходное фото" : "✨ Студийный снимок"}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                      <ZoomIn className="w-4 h-4" />
                      <span>Нажмите для увеличения (HD)</span>
                    </div>
                  </div>
                )}

                {/* Success Notification */}
                {studioSavedSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Фотография успешно сохранена в файлы и каталог магазина!</span>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveStudioResultToCatalog}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Сохранить в каталог</span>
                  </button>

                  <a
                    href={studioResult.image_url}
                    download="storebox_studio_photo.png"
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать PNG</span>
                  </a>
                </div>

                {/* Quick Reroll Chips */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Сгенерировать другой фон для этого же товара:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {studioPresetChips.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleRunStudioInpaint(c.prompt)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 transition cursor-pointer"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
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

                  {/* 0. CLARIFY IMAGE CARD (Shopify Sidekick Interactive Clarification) */}
                  {m.action_type === "clarify_image" && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200 dark:border-violet-800/50 shadow-md space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {activeLang === "uz"
                            ? "Rasm yaratish bo'yicha aniqlashtirish"
                            : activeLang === "en"
                            ? "Image Creation Details"
                            : "Уточнение для генерации изображения"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                        {m.text}
                      </p>
                      <div className="flex flex-col gap-1.5 pt-1">
                        {(m.suggestions && m.suggestions.length > 0
                          ? m.suggestions
                          : [
                              "Белая рубашка со студийным освещением",
                              "Сочный бургер BBQ",
                              "Черное худи оверсайз",
                              "Рекламный баннер со скидкой 20%",
                            ]
                        ).map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSend(chip)}
                            className="p-2.5 text-left rounded-xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-violet-50 dark:hover:bg-violet-950/30 border border-slate-200/70 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 font-medium transition cursor-pointer flex items-center justify-between group"
                          >
                            <span>{chip}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 transition" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1. IMAGE GENERATED CARD (1024x1024 Studio Showcase) */}
                  {m.action_type === "image_generated" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200 dark:border-violet-800/50 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                          <Wand2 className="w-4 h-4" />
                          <span>AI Commercial Studio (1024x1024 HD)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            ⚡ M2 Fast (0.04s)
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60">
                            {m.action_data.theme === "clean_white"
                              ? "Светлая студия"
                              : m.action_data.theme === "gourmet_warm"
                              ? "Gourmet Warm"
                              : "Dark Luxury"}
                          </span>
                        </div>
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
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal(m.action_data.image_url)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-violet-600" />
                          <span>Просмотр</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSend(`Удали фон у товара ${m.action_data.product_name}`)
                          }
                          className="p-2 rounded-lg bg-slate-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5 text-violet-600" />
                          <span>rembg</span>
                        </button>

                        <a
                          href={m.action_data.image_url}
                          download={`storebox_${m.action_data.product_name}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                          <span>Скачать</span>
                        </a>
                      </div>

                      {/* Quick Iterative Typography Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSend("Добавь надпись Белый УЗБ")}
                          className="w-full p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Добавить надпись «Белый УЗБ»</span>
                        </button>
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

                  {/* 2.5 IMAGE-TO-IMAGE / INPAINT STUDIO CARD */}
                  {m.action_type === "image_to_image" && m.action_data && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200 dark:border-violet-800/50 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                          <Camera className="w-4 h-4" />
                          <span>AI Фотостудия • Image-to-Image (Inpaint)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            {m.action_data.execution_time || "0.6s"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60">
                            {m.action_data.theme_title || "Студия"}
                          </span>
                        </div>
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
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <span>Студийный снимок</span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                          <ZoomIn className="w-4 h-4" />
                          <span>Нажмите для увеличения (HD)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                        <span>{m.action_data.product_name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {m.action_data.engine || "Apple Silicon M2"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal(m.action_data.image_url)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-violet-100 dark:bg-zinc-800 dark:hover:bg-violet-950/40 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-violet-600" />
                          <span>Просмотр</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.post("/ai/save-to-catalog/", {
                                image_url: m.action_data.image_url,
                                name: `${m.action_data.product_name || "Товар"} (AI Studio)`,
                                price: 250000,
                                stock: 20,
                              });
                              alert("Товар с этим фото успешно сохранен в каталог!");
                            } catch (e) {
                              alert("Ошибка сохранения в каталог");
                            }
                          }}
                          className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-emerald-200/60 dark:border-emerald-800/40"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>В каталог</span>
                        </button>

                        <a
                          href={m.action_data.image_url}
                          download={`storebox_studio_${m.action_data.product_name}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                          <span>Скачать</span>
                        </a>
                      </div>

                      {/* Theme variation chips */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleSend(
                              m.action_data.theme === "wood"
                                ? "Помести товар на белый мрамор"
                                : "Помести товар на деревянный стол"
                            )
                          }
                          className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Сменить стиль фона</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("studio");
                            setStudioImagePreview(m.action_data.image_url);
                          }}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>Открыть в студии</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2.6 OPEN STUDIO CTA CARD */}
                  {m.action_type === "open_studio" && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-pink-500/5 border border-violet-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400">
                        <Camera className="w-4 h-4" />
                        <span>AI Фотостудия (Image-to-Image / Inpaint)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 font-normal leading-relaxed">
                        Загрузите фото товара или выберите его из каталога, чтобы перенести его на деревянный стол, мрамор или студийную циклораму.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("studio");
                          if (m.action_data?.suggested_prompt) {
                            setStudioPrompt(m.action_data.suggested_prompt);
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition cursor-pointer"
                      >
                        <Wand2 className="w-4 h-4" />
                        <span>Перейти в AI Фотостудию</span>
                      </button>
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

          {/* Skeleton Shimmer for Commercial Studio Image Generation */}
          {generatingSkeleton && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200/80 dark:border-violet-800/40 shadow-md space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400">
                  <Wand2 className="w-4 h-4 animate-spin" />
                  <span>Генерация фото студийного качества (1024x1024)...</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                  Apple Silicon M2
                </span>
              </div>
              <div className="w-full h-56 sm:h-64 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse flex items-center justify-center text-slate-400 text-xs">
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-violet-500 animate-bounce" />
                  <span className="font-medium text-slate-500 dark:text-zinc-400 text-center px-4">
                    Прорисовка коммерческого света, ткани и студийных теней...
                  </span>
                </div>
              </div>
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 dark:bg-zinc-850 rounded w-1/2"></div>
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
        </>
        )}
      </aside>

      {/* High Resolution Image Modal (Shopify Sidekick Preview) */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="font-bold text-xs">
                  AI Commercial Studio • Предпросмотр изображения (1024x1024 HD)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-black/60">
              <img
                src={previewImageModal}
                alt="Enlarged Preview"
                className="max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <div className="p-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPreviewImageModal(null);
                  navigate("/products");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Package className="w-4 h-4 text-violet-400" />
                <span>Открыть в каталоге</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewImageModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Закрыть
                </button>
                <a
                  href={previewImageModal}
                  download="storebox_commercial_artwork.png"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать оригинал</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
