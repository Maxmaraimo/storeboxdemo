import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Check,
  CheckCircle2,
  Star,
  ShieldCheck,
  Zap,
  X,
  Copy,
  RotateCw,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ChevronRight,
  Palette,
  ArrowRight,
  Sparkles,
  Power,
  Trash2,
  Lock,
  History,
  RefreshCw,
  Activity,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// -----------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------
export interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'checkbox' | 'select' | 'readonly';
  placeholder?: string;
  required?: boolean;
  secret?: boolean;
  options?: string[];
  default?: any;
}

export interface IntegrationItem {
  slug: string;
  name: string;
  category: 'pos' | 'warehouse' | 'delivery' | 'payment' | 'telephony_social';
  category_title: string;
  badge: string;
  rating: number;
  reviews_count: number;
  short_desc: string;
  desc: string;
  icon_color: string;
  fields: IntegrationField[];
  is_connected: boolean;
  is_active: boolean;
  saved_config: Record<string, any>;
  masked_credentials: Record<string, string>;
  last_synced?: string | null;
}

// -----------------------------------------------------------------
// HIGH-FIDELITY VECTOR SVG LOGOS FOR EACH SERVICE
// -----------------------------------------------------------------
export const ServiceLogo: React.FC<{ slug: string; name: string; size?: number; className?: string }> = ({
  slug,
  name,
  size = 40,
  className = ""
}) => {
  const s = size;

  switch (slug) {
    case 'iiko':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#E52D27] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black tracking-tighter text-sm select-none">iiko</span>
        </div>
      );
    case 'r_keeper':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#0F172A] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="flex flex-col items-center leading-none select-none">
            <span className="text-white font-black text-xs tracking-tight">r_k</span>
            <span className="text-slate-400 font-bold text-[8px] tracking-widest mt-0.5">EEPER</span>
          </div>
        </div>
      );
    case 'poster':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#FF6B4A] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <svg viewBox="0 0 32 32" className="w-6 h-6 text-white fill-current">
            <rect x="4" y="4" width="24" height="24" rx="6" fill="white" fillOpacity="0.2"/>
            <path d="M10 8h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zm2 4v8h4v-3h2a2.5 2.5 0 0 0 0-5h-6zm4 3h-2v-1.5h2a1 1 0 0 1 0 2v-.5z" fill="white"/>
          </svg>
        </div>
      );
    case 'jowi':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#0284C7] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black tracking-tight text-xs select-none">JOWI</span>
        </div>
      );
    case 'clopos':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#4F46E5] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black tracking-tight text-[11px] select-none">CLOPOS</span>
        </div>
      );
    case 'allpos':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#2563EB] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black tracking-tight text-[11px] select-none">ALLPOS</span>
        </div>
      );
    case 'yespos':
      return (
        <div style={{ width: s, height: s }} className={`bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="flex flex-col items-center leading-none text-white select-none">
            <span className="font-black text-[10px] tracking-tight">YES</span>
            <span className="font-extrabold text-[8px] text-indigo-200">POS</span>
          </div>
        </div>
      );
    case 'smartup':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#0D9488] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="text-white font-black text-xs tracking-tight flex items-center gap-0.5 select-none">
            <span>S</span>
            <span className="text-[9px] font-bold text-teal-200">mart</span>
          </div>
        </div>
      );
    case 'billz':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#1D4ED8] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-base tracking-tighter select-none">B</span>
        </div>
      );
    case 'moysklad':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#0284C7] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="flex flex-col items-center leading-none text-white select-none">
            <span className="font-bold text-[9px]">МОЙ</span>
            <span className="font-black text-[10px]">СКЛАД</span>
          </div>
        </div>
      );
    case 'onec':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#E11D48] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="bg-amber-400 text-rose-900 rounded-full w-7 h-5 flex items-center justify-center font-black text-xs select-none">
            1С
          </div>
        </div>
      );
    case 'regos':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#B91C1C] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-[10px] tracking-tight select-none">REGOS</span>
        </div>
      );
    case 'era':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#059669] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-xs tracking-tight select-none">ERA</span>
        </div>
      );
    case 'yandex_delivery':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#FC3F1D] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="bg-white rounded-lg p-1 flex items-center justify-center w-6 h-6">
            <span className="text-[#FC3F1D] font-black text-xs leading-none select-none">Я</span>
          </div>
        </div>
      );
    case 'express24':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#F59E0B] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="text-slate-900 font-black text-[10px] leading-tight text-center select-none">
            EX<span className="text-white">24</span>
          </div>
        </div>
      );
    case 'fargo':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#18181B] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-[#F97316] font-black text-[10px] tracking-wider select-none">FARGO</span>
        </div>
      );
    case 'bts_express':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#1E3A8A] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-amber-400 font-black text-xs tracking-tight select-none">BTS</span>
        </div>
      );
    case 'uzpost':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#2563EB] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="flex flex-col items-center leading-none text-white select-none">
            <span className="font-bold text-[8px]">UZ</span>
            <span className="font-black text-[9px]">POST</span>
          </div>
        </div>
      );
    case 'noor':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#D97706] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-[11px] tracking-tight select-none">Noor</span>
        </div>
      );
    case 'robopochta':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#10B981] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-[9px] tracking-tight text-center leading-tight select-none">Robo<br/>Pochta</span>
        </div>
      );
    case 'emu_express':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#7C3AED] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-xs tracking-tight select-none">EMU</span>
        </div>
      );
    case 'payme':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#14B8A6] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-xs tracking-tight select-none">Payme</span>
        </div>
      );
    case 'click':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#0073FF] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="flex items-center gap-0.5 select-none">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-white"></div>
            <span className="text-white font-bold text-xs tracking-tighter">click</span>
          </div>
        </div>
      );
    case 'multicard':
      return (
        <div style={{ width: s, height: s }} className={`bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="text-white font-black text-[10px] tracking-tight text-center leading-none select-none">
            MULTI<br/><span className="text-[8px] text-purple-200">CARD</span>
          </div>
        </div>
      );
    case 'uzumpay':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#7000FF] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-[11px] tracking-tight select-none">uzum</span>
        </div>
      );
    case 'kaspi':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#EF4444] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-xs select-none">Kaspi</span>
        </div>
      );
    case 'stripe':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#635BFF] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black italic text-xs tracking-tight select-none">stripe</span>
        </div>
      );
    case 'online_pbx':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#10B981] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <div className="w-6 h-6 rounded-full border border-white/60 flex items-center justify-center select-none">
            <span className="text-white font-bold text-[9px]">pbx</span>
          </div>
        </div>
      );
    case 'zadarma':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#F97316] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-[10px] select-none">Zadarma</span>
        </div>
      );
    case 'sipuni':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#3B82F6] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <span className="text-white font-black text-[10px] select-none">SIPUNI</span>
        </div>
      );
    case 'instagram':
      return (
        <div style={{ width: s, height: s }} className={`bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-none stroke-current stroke-2">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </div>
      );
    case 'telegram':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#229ED9] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
            <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.671c.458 0 .66-.21.916-.458l2.199-2.138 4.573 3.378c.843.464 1.448.225 1.658-.783l2.998-14.127c.308-1.233-.473-1.794-1.507-1.31z"/>
          </svg>
        </div>
      );
    case 'whatsapp':
      return (
        <div style={{ width: s, height: s }} className={`bg-[#25D366] rounded-xl flex items-center justify-center p-1.5 shadow-2xs ${className}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.92-9.91-9.92z"/>
          </svg>
        </div>
      );
    default:
      return (
        <div style={{ width: s, height: s }} className={`bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs ${className}`}>
          {name.slice(0, 2).toUpperCase()}
        </div>
      );
  }
};

// -----------------------------------------------------------------
// ISOLATED MODAL COMPONENT (Guarantees 100% fresh, isolated state per item)
// -----------------------------------------------------------------
interface ModalProps {
  integration: IntegrationItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onDisconnect: (message: string) => void;
  lang: string;
}

const IntegrationConfigModal: React.FC<ModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSuccess,
  onDisconnect,
  lang,
}) => {
  // Pure isolated form state strictly derived from this integration only
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {
      is_active: integration.is_connected ? integration.is_active : true,
    };
    (integration.fields || []).forEach((f) => {
      if (integration.saved_config && integration.saved_config[f.key] !== undefined) {
        initial[f.key] = integration.saved_config[f.key];
      } else if (f.secret && integration.masked_credentials && integration.masked_credentials[f.key]) {
        initial[f.key] = integration.masked_credentials[f.key];
      } else if (f.default !== undefined) {
        initial[f.key] = f.default;
      } else {
        initial[f.key] = f.type === 'checkbox' ? false : '';
      }
    });
    return initial;
  });

  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.get(`/integrations/${integration.slug}/logs/`);
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.warn("Failed fetching logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (integration.is_connected) {
      fetchLogs();
    }
  }, [integration.slug, integration.is_connected]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const queryClient = useQueryClient();

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    setSyncResult(null);
    try {
      const res = await api.post(`/integrations/${integration.slug}/save/`, formValues);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      onSuccess(res.data?.message || `${integration.name} muvaffaqiyatli ulandi!`);
      if (res.data?.sync_result) {
        setSyncResult({
          success: res.data.sync_result.success,
          message: res.data.sync_result.message || "Avtomatik sinxronizatsiya muvaffaqiyatli yakunlandi!",
        });
      }
      fetchLogs();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Xatolik yuz berdi. Iltimos tekshirib qayta urining.";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Manual Sync
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.post(`/integrations/${integration.slug}/sync/`);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      setSyncResult({
        success: true,
        message: res.data?.message || "Sinxronizatsiya muvaffaqiyatli yakunlandi!",
      });
      fetchLogs();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Sinxronizatsiyada xatolik yuz berdi";
      setSyncResult({ success: false, message: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!confirm(`${integration.name} ulanishini haqiqatan ham uzmoqchimisiz?`)) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await api.post(`/integrations/${integration.slug}/disconnect/`);
      onDisconnect(res.data?.message || `${integration.name} o'chirildi`);
    } catch (err: any) {
      alert("Xatolik yuz berdi");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Handle Test Connection
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.post(`/integrations/${integration.slug}/test/`, formValues);
      setTestResult({
        success: true,
        message: res.data?.message || "Aloqa muvaffaqiyatli o'rnatildi! (200 OK)",
      });
      fetchLogs();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Server bilan aloqa o'rnatib bo'lmadi.";
      setTestResult({ success: false, message: msg });
      fetchLogs();
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const t = {
    toggleActiveLabel: lang === 'ru' ? 'Активировать модуль в магазине' : lang === 'en' ? 'Enable module for store' : "Modulni do'konda faollashtirish",
    securityNotice: lang === 'ru'
      ? 'Безопасное 256-битное шифрование StoreBox: Ваши API-ключи и пароли надежно защищены и не передаются третьим лицам.'
      : lang === 'en'
      ? 'StoreBox 256-bit encryption: Your secret API credentials are encrypted and stored securely.'
      : "StoreBox 256-bitli shifrlash: Maxfiy API kalitlar xavfsiz shifrlanadi va uchinchi shaxslarga berilmaydi.",
    btnCancel: lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : 'Bekor qilish',
    btnSave: lang === 'ru' ? 'Сохранить и подключить' : lang === 'en' ? 'Save & Connect' : 'Saqlash va ulash',
    btnSaving: lang === 'ru' ? 'Сохранение...' : lang === 'en' ? 'Saving...' : 'Saqlanmoqda...',
    btnTest: lang === 'ru' ? 'Проверить связь' : lang === 'en' ? 'Test connection' : 'Aloqani tekshirish',
    btnDisconnect: lang === 'ru' ? 'Отключить' : lang === 'en' ? 'Disconnect' : "Ulanishni uzish",
    reviewsCountLabel: lang === 'ru' ? 'отзывов' : lang === 'en' ? 'reviews' : 'sharh',
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <ServiceLogo slug={integration.slug} name={integration.name} size={48} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-slate-900 dark:text-white">
                  {integration.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  {integration.category_title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-900 dark:text-white">{integration.rating.toFixed(1)}</span>
                <span>• {integration.reviews_count} {t.reviewsCountLabel}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Security Shield Banner */}
          <div className="bg-slate-50 dark:bg-neutral-850 rounded-2xl p-4 border border-slate-200/80 dark:border-neutral-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Xavfsiz 256-bitli shifrlash</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">AES/HMAC</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                {t.securityNotice}
              </p>
            </div>
          </div>

          {/* Live Status & Sync Diagnostic Inspection Card */}
          {integration.is_connected && (
            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    {lang === 'ru' ? 'Интеграция успешно подключена и работает' : "Integratsiya muvaffaqiyatli ulandi va ishlamoqda"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono">
                  ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-neutral-300 space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-neutral-400">
                    {lang === 'ru' ? 'Последняя синхронизация:' : 'Oxirgi sinxronizatsiya:'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {integration.last_synced
                      ? new Date(integration.last_synced).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : (lang === 'ru' ? 'Недавно подключено' : 'Yaqinda ulandi')}
                  </span>
                </div>

                {integration.category === 'warehouse' && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-neutral-300 font-medium">
                      {lang === 'ru' ? 'Складской учет и остатки:' : 'Omborxona va qoldiqlar:'}
                    </span>
                    <Link to="/warehouse" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
                      <span>{lang === 'ru' ? 'Перейти в Складской учет' : "Omborxonaga o'tish"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {integration.category === 'pos' && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-neutral-300 font-medium">
                      {lang === 'ru' ? 'Касса и заказы с витрины:' : 'Kassa va buyurtmalar:'}
                    </span>
                    <Link to="/orders" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
                      <span>{lang === 'ru' ? 'Перейти в Заказы' : "Buyurtmalarga o'tish"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {integration.category === 'payment' && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-neutral-300 font-medium">
                      {lang === 'ru' ? 'Онлайн-оплата на чекауте:' : "Chekautda to'lov:"}
                    </span>
                    <Link to="/orders" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
                      <span>{lang === 'ru' ? 'Активно на витрине магазина' : "Do'kon vitrinasida faol"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {integration.category === 'delivery' && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-neutral-300 font-medium">
                      {lang === 'ru' ? 'Курьерская доставка:' : 'Kuryerlik xizmati:'}
                    </span>
                    <Link to="/orders" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-bold">
                      <span>{lang === 'ru' ? 'Авто-вызов в Заказах' : "Buyurtmalarda avto-chaqiruv"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* Sync Now & Event Logs Action Buttons */}
                <div className="pt-2.5 mt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncing
                        ? (lang === 'ru' ? 'Синхронизация...' : 'Sinxronlanmoqda...')
                        : (lang === 'ru' ? '🔄 Синхронизировать сейчас' : '🔄 Hozir sinxronlash')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLogs(!showLogs);
                      if (!showLogs) fetchLogs();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-50 text-slate-700 dark:text-neutral-200 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    <History className="w-3 h-3 text-slate-500" />
                    <span>
                      {lang === 'ru' ? 'Журнал событий' : 'Voqealar jurnali'}
                      {logs.length > 0 ? ` (${logs.length})` : ''}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sync Result Notice */}
          {syncResult && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
              syncResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="leading-snug">{syncResult.message}</span>
            </div>
          )}

          {/* Event Logs Drawer / Section */}
          {showLogs && (
            <div className="bg-slate-50/80 dark:bg-neutral-850/80 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'ru' ? 'История обмена и события' : 'Almashinuv tarixi va jurnali'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={isLoadingLogs}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>{lang === 'ru' ? 'Обновить' : 'Yangilash'}</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {lang === 'ru' ? 'Пока нет записанных событий' : 'Hozircha yozuvlar mavjud emas'}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {logs.map((log: any) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/70 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300">
                          {log.event_type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-mono text-slate-400">{log.created_at}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-neutral-200 leading-snug">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-neutral-850/60 border border-slate-100 dark:border-neutral-800">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">{t.toggleActiveLabel}</span>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">Modul xaridlar va sinxronizatsiyada ishlaydi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formValues.is_active)}
                onChange={(e) => setFormValues({ ...formValues, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Dynamic Integration Fields */}
          <div className="space-y-4">
            {(integration.fields || []).map((f) => {
              const val = formValues[f.key] ?? '';
              const isSecret = Boolean(f.secret);
              const isVisible = showPasswordMap[f.key] || false;

              if (f.type === 'checkbox') {
                return (
                  <div key={f.key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-neutral-800">
                    <span className="text-xs font-medium text-slate-700 dark:text-neutral-300">{f.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
                    />
                  </div>
                );
              }

              if (f.type === 'select') {
                return (
                  <div key={f.key} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">{f.label}</label>
                    <select
                      value={val}
                      onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                    >
                      {(f.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (f.type === 'readonly') {
                const host = window.location.origin;
                const fullUrl = `${host}${val}`;
                const isCopied = copyFeedback === fullUrl;
                return (
                  <div key={f.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">{f.label}</label>
                      {isCopied && <span className="text-[10px] text-emerald-600 font-bold">Nusxalandi!</span>}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullUrl}
                        readOnly
                        className="w-full p-2.5 pr-10 rounded-xl bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 font-mono text-[11px] text-slate-600 dark:text-neutral-300 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(fullUrl)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </label>
                    {isSecret && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Shifrlanadi
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={isSecret ? (isVisible ? 'text' : 'password') : 'text'}
                      value={val}
                      onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full p-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                    />
                    {isSecret && (
                      <button
                        type="button"
                        onClick={() => setShowPasswordMap({ ...showPasswordMap, [f.key]: !isVisible })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ping Test Response */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-neutral-850 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Test Handshake Button */}
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.btnTest}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 justify-end">
            {integration.is_connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.btnDisconnect}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
            >
              {t.btnCancel}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.btnSaving}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.btnSave}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// MAIN PAGE COMPONENT
// -----------------------------------------------------------------
export const IntegrationsMarketPage: React.FC = () => {
  const { lang, store } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'pos' | 'warehouse' | 'delivery' | 'payment' | 'telephony_social'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'available'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Translations dictionary
  const t = {
    title: lang === 'ru' ? 'Маркетплейс интеграций' : lang === 'en' ? 'Integrations Marketplace' : 'StoreBox Market',
    subtitle: lang === 'ru'
      ? 'Подключайте кассы, склады, службы доставки, платежные системы и соцсети в один клик'
      : lang === 'en'
      ? 'Connect POS, warehouses, delivery fleets, payments and social channels in one click'
      : "Kassa, omborxona, to'lov va yetkazib berish xizmatlarini bir klikda do'konga ulang",
    searchPlaceholder: lang === 'ru' ? 'Поиск сервисов и интеграций...' : lang === 'en' ? 'Search integrations...' : "Xizmat va integratsiyalarni qidirish...",
    tabAll: lang === 'ru' ? 'Все' : lang === 'en' ? 'All' : 'Barchasi',
    tabPos: lang === 'ru' ? 'POS системы' : lang === 'en' ? 'POS Systems' : 'POS tizimlari',
    tabWarehouse: lang === 'ru' ? 'Склады' : lang === 'en' ? 'Warehouses' : 'Omborxona',
    tabDelivery: lang === 'ru' ? 'Доставка' : lang === 'en' ? 'Delivery' : 'Yetkazib berish',
    tabPayment: lang === 'ru' ? 'Оплата' : lang === 'en' ? 'Payments' : "To'lov tizimlari",
    tabSocial: lang === 'ru' ? 'IP-телефония и Соцсети' : lang === 'en' ? 'Telephony & Social' : 'IP-telefoniya va Ijtimoiy tarmoqlar',
    btnConnect: lang === 'ru' ? 'Подключить' : lang === 'en' ? 'Connect' : 'Ochish',
    btnConfigure: lang === 'ru' ? 'Настроить' : lang === 'en' ? 'Configure' : 'Sozlash',
    statusConnected: lang === 'ru' ? 'Подключено' : lang === 'en' ? 'Connected' : 'Ulangan',
    statusActive: lang === 'ru' ? 'Активно' : lang === 'en' ? 'Active' : 'Faol',
    statusInactive: lang === 'ru' ? 'Выключено' : lang === 'en' ? 'Disabled' : "To'xtatilgan",
    themesMarketLink: lang === 'ru' ? 'Темы и витрины (13)' : lang === 'en' ? 'Storefront Themes (13)' : 'Vitrina mavzulari (13)',
    filterStatusAll: lang === 'ru' ? 'Все статусы' : lang === 'en' ? 'All statuses' : 'Barcha statuslar',
    filterStatusConnected: lang === 'ru' ? 'Только подключенные' : lang === 'en' ? 'Only connected' : 'Faqat ulanganlar',
    filterStatusAvailable: lang === 'ru' ? 'Только доступные' : lang === 'en' ? 'Only available' : 'Faqat mavjudlar',
    reviewsCountLabel: lang === 'ru' ? 'отзывов' : lang === 'en' ? 'reviews' : 'sharh',
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Integrations with automatic background sync and retry
  const { data, isLoading, isError, refetch } = useQuery<{ integrations: IntegrationItem[]; counts: Record<string, number> }>({
    queryKey: ['integrations-list', store?.id],
    queryFn: async () => {
      const res = await api.get('/integrations/', {
        params: store?.id ? { store_id: store.id } : undefined,
      });
      return res.data;
    },
    staleTime: 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const allItems: IntegrationItem[] = useMemo(() => data?.integrations || [], [data]);

  // Filtered List
  const filteredList = useMemo(() => {
    return allItems.filter((item) => {
      if (activeTab !== 'all' && item.category !== activeTab) {
        return false;
      }
      if (statusFilter === 'connected' && !item.is_connected) {
        return false;
      }
      if (statusFilter === 'available' && item.is_connected) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = (item.desc || '').toLowerCase().includes(q) || (item.short_desc || '').toLowerCase().includes(q);
        const matchesCategory = (item.category_title || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [allItems, activeTab, statusFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: allItems.length,
      pos: allItems.filter(i => i.category === 'pos').length,
      warehouse: allItems.filter(i => i.category === 'warehouse').length,
      delivery: allItems.filter(i => i.category === 'delivery').length,
      payment: allItems.filter(i => i.category === 'payment').length,
      telephony_social: allItems.filter(i => i.category === 'telephony_social').length,
      connected: allItems.filter(i => i.is_connected).length,
    };
  }, [allItems]);

  // Open modal: Strictly clear previous context first, then mount cleanly
  const handleOpenModal = (item: IntegrationItem) => {
    setSelectedIntegration(null);
    setModalOpen(false);

    // Deep copy to prevent any cross-reference leaks
    const freshItem: IntegrationItem = JSON.parse(JSON.stringify(item));

    // Next tick mounts the clean isolated modal
    requestAnimationFrame(() => {
      setSelectedIntegration(freshItem);
      setModalOpen(true);
    });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedIntegration(null);
  };

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.post(`/integrations/${slug}/toggle/`);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['integrations-list'] });
      showToast(res?.message || "Holat yangilandi");
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION (Shopify Polaris style) */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                <Sparkles className="w-3 h-3 text-amber-500" />
                StoreBox Market
              </span>
              {counts.connected > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {counts.connected} {t.statusConnected.toLowerCase()}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
              {t.subtitle}
            </p>
          </div>

          {/* Quick switcher to Storefront themes */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/themes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold border border-slate-200/80 dark:border-neutral-700 transition-all cursor-pointer shadow-2xs group"
            >
              <Palette className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              <span>{t.themesMarketLink}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* CATEGORY TABS (Robosell structure + Shopify styling) */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: t.tabAll, count: counts.all },
              { id: 'pos', label: t.tabPos, count: counts.pos },
              { id: 'warehouse', label: t.tabWarehouse, count: counts.warehouse },
              { id: 'delivery', label: t.tabDelivery, count: counts.delivery },
              { id: 'payment', label: t.tabPayment, count: counts.payment },
              { id: 'telephony_social', label: t.tabSocial, count: counts.telephony_social },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100/80 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                        : 'bg-slate-200/80 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEARCH & STATUS FILTER TOOLBAR */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700/80 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label={t.filterStatusAll}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700/80 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">{t.filterStatusAll}</option>
                <option value="connected">{t.filterStatusConnected}</option>
                <option value="available">{t.filterStatusAvailable}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS GRID (Clean Shopify aesthetic) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-800 p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-neutral-800"></div>
                <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-neutral-800"></div>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 rounded bg-slate-100 dark:bg-neutral-800"></div>
                <div className="w-full h-8 rounded bg-slate-100 dark:bg-neutral-800"></div>
              </div>
              <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-neutral-800"></div>
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/80 dark:border-neutral-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-400 mx-auto flex items-center justify-center">
            {isError ? <RotateCw className="w-6 h-6 text-amber-500" /> : <Search className="w-6 h-6" />}
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isError ? "Xizmatlarni yuklashda xatolik yuz berdi" : "Xizmatlar topilmadi"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
            {isError
              ? "Server bilan aloqada uzilish bo'ldi. Qayta yuklash tugmasini bosing."
              : "Qidiruv so'rovi yoki tanlangan filtrlar bo'yicha hech qanday integratsiya topilmadi. Qidiruvni tozalab ko'ring."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (isError) {
                refetch();
              } else {
                setSearchQuery('');
                setActiveTab('all');
                setStatusFilter('all');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isError ? "Qayta yuklash" : "Barchasini ko'rsatish"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredList.map((item) => {
            const isConnected = item.is_connected;
            const isActive = item.is_active;

            return (
              <div
                key={item.slug}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200/90 dark:border-neutral-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top card row: Logo + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <ServiceLogo slug={item.slug} name={item.name} size={44} />

                    {isConnected ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.statusConnected}</span>
                        </span>
                        <span className={`text-[10px] font-semibold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {isActive ? t.statusActive : t.statusInactive}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Service Title & Rating */}
                  <div className="mt-4">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-neutral-400">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900 dark:text-white">{item.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-300 dark:text-neutral-700">•</span>
                      <span>({item.reviews_count} {t.reviewsCountLabel})</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                    {item.short_desc}
                  </p>
                </div>

                {/* Bottom Action Row */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-neutral-800/70 flex items-center justify-between gap-2">
                  {isConnected ? (
                    <>
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(item.slug)}
                        title={isActive ? "Faoliyatni to'xtatish" : "Faollashtirish"}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600'
                            : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-400'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.btnConfigure}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-slate-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group-hover:shadow-sm"
                    >
                      <span>{t.btnConnect}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ISOLATED MODAL (Rendered with unique key per integration slug to guarantee 100% clean isolation) */}
      {modalOpen && selectedIntegration && (
        <IntegrationConfigModal
          key={`modal-${selectedIntegration.slug}`}
          integration={selectedIntegration}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={(msg) => {
            queryClient.invalidateQueries({ queryKey: ['integrations-list'] });
            handleCloseModal();
            showToast(msg);
          }}
          onDisconnect={(msg) => {
            queryClient.invalidateQueries({ queryKey: ['integrations-list'] });
            handleCloseModal();
            showToast(msg);
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
