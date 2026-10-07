import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Phone, ArrowRight, User, ChevronDown, CheckCircle, ShieldCheck, KeyRound, Clock, Loader2, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

interface CountryInfo {
  id: string;
  name: string;
  dialCode: string;
  code: string;
  flag: string;
  digits: number;
  placeholder: string;
}

const COUNTRIES: CountryInfo[] = [
  { id: "uz", name: "O'zbekiston", dialCode: "+998", code: "998", flag: "🇺🇿", digits: 9, placeholder: "(90) 123-45-67" },
  { id: "kz", name: "Qozog'iston", dialCode: "+7", code: "7", flag: "🇰🇿", digits: 10, placeholder: "(701) 123-45-67" },
  { id: "ru", name: "Rossiya", dialCode: "+7", code: "7", flag: "🇷🇺", digits: 10, placeholder: "(999) 123-45-67" },
  { id: "kg", name: "Qirg'iziston", dialCode: "+996", code: "996", flag: "🇰🇬", digits: 9, placeholder: "(555) 123-456" },
  { id: "tj", name: "Tojikiston", dialCode: "+992", code: "992", flag: "🇹🇯", digits: 9, placeholder: "(92) 123-45-67" },
];

export const LoginPage: React.FC = () => {
  const { login, loginWithSms, user, permissions } = useAuth();
  const navigate = useNavigate();

  // Auth Method: 'sms' (Eskiz SMS authorization) or 'password'
  const [authMethod, setAuthMethod] = useState<"sms" | "password">("sms");

  // In password mode: 'phone' or 'login'
  const [loginMode, setLoginMode] = useState<"phone" | "login">("phone");

  // Phone input state
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("900000001");

  // SMS Verification state
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Username mode state
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (permissions?.is_courier) {
        window.location.href = "/dashboard/courier/";
      } else {
        navigate("/");
      }
    }
  }, [user, permissions, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (smsCooldown <= 0) return;
    const timer = setInterval(() => {
      setSmsCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [smsCooldown]);

  // Format phone digits according to country
  const formatPhone = (digits: string, country: CountryInfo): string => {
    if (country.id === "uz") {
      if (digits.length === 0) return "";
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 5) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
    } else if (country.digits === 10) {
      if (digits.length === 0) return "";
      if (digits.length <= 3) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      if (digits.length <= 8) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    let digits = raw.replace(/\D/g, "");

    if (digits.startsWith(selectedCountry.code)) {
      digits = digits.slice(selectedCountry.code.length);
    }
    digits = digits.slice(0, selectedCountry.digits);
    setPhoneDigits(digits);
  };

  const getFullPhoneNumber = (): string => {
    return `${selectedCountry.dialCode}${phoneDigits}`;
  };

  const getFullUsername = (): string => {
    if (loginMode === "phone") {
      return getFullPhoneNumber();
    }
    return usernameInput.trim();
  };

  const isPhoneComplete = phoneDigits.length === selectedCountry.digits;

  // Send SMS verification code via Eskiz
  const handleSendSms = async () => {
    if (smsLoading || smsCooldown > 0) return;
    if (!isPhoneComplete) {
      setError(`Telefon raqamini to'liq kiriting (${phoneDigits.length}/${selectedCountry.digits} raqam)`);
      return;
    }
    setError("");
    setStatusMsg("");
    setSmsLoading(true);

    try {
      const fullPhone = getFullPhoneNumber();
      const res = await api.post("/auth/sms/send-code/", {
        phone: fullPhone,
        purpose: "MERCHANT_LOGIN",
      });

      if (res.data?.success) {
        setSmsSent(true);
        setStatusMsg(res.data.message || "Tasdiqlash kodi yuborildi!");
        setSmsCooldown(res.data.cooldown || 60);
      } else {
        setError(res.data?.error || "SMS yuborishda xatolik yuz berdi");
        if (res.data?.cooldown) {
          setSmsCooldown(res.data.cooldown);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "SMS yuborishda xatolik yuz berdi");
      if (err?.response?.data?.cooldown) {
        setSmsCooldown(err.response.data.cooldown);
      }
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMsg("");

    // --- Scenario A: SMS-based Auth ---
    if (authMethod === "sms") {
      if (!isPhoneComplete) {
        setError(`Telefon raqamini to'liq kiriting (${phoneDigits.length}/${selectedCountry.digits} raqam)`);
        return;
      }
      if (!smsCode || smsCode.trim().length !== 4) {
        setError("Iltimos, 4 xonali SMS tasdiqlash kodini kiriting");
        if (!smsSent) {
          handleSendSms();
        }
        return;
      }

      setSubmitting(true);
      try {
        const fullPhone = getFullPhoneNumber();
        const data = await loginWithSms(fullPhone, smsCode.trim());
        if (data?.is_courier || data?.redirect_url) {
          window.location.href = data.redirect_url || "/dashboard/courier/";
          return;
        }
        navigate("/");
      } catch (err: any) {
        setError(err?.response?.data?.error || "Tasdiqlash kodida xatolik");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // --- Scenario B: Password-based Auth ---
    if (loginMode === "phone" && !isPhoneComplete) {
      setError(`Telefon raqamini to'liq kiriting (${phoneDigits.length}/${selectedCountry.digits} raqam)`);
      return;
    }

    const finalUsername = getFullUsername();
    if (!finalUsername) {
      setError("Login yoki telefon raqamingizni kiriting");
      return;
    }

    setSubmitting(true);
    try {
      const data = await login({ username: finalUsername, password });
      if (data?.is_courier || data?.redirect_url) {
        window.location.href = data.redirect_url || "/dashboard/courier/";
        return;
      }
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Kirishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f6f6f7] dark:bg-[#0c0d0e]">
      <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200/80 dark:border-white/10 p-7 sm:p-9 max-w-md w-full shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center shadow-xs mx-auto text-white">
            <svg viewBox="0 0 32 32" className="w-6 h-6 stroke-white fill-none stroke-[2] stroke-linejoin-round">
              <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
              <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Store<span className="text-blue-600">Box</span> tizimiga kirish
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Boshqaruv paneliga kirish uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Primary Auth Method: SMS Code vs Password */}
        <div className="p-1 rounded-xl bg-slate-100 dark:bg-white/5 flex gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setAuthMethod("sms"); setError(""); setStatusMsg(""); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMethod === "sms"
                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>SMS orqali kirish</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod("password"); setError(""); setStatusMsg(""); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMethod === "password"
                ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Parol bilan</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PHONE INPUT FOR SMS OR PHONE PASSWORD MODE */}
          {(authMethod === "sms" || loginMode === "phone") && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Telefon raqamingiz</span>
                <span className="text-[11px] text-slate-400 font-normal">{selectedCountry.name}</span>
              </label>

              <div className="relative flex rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600/20 transition-all">
                {/* Country dropdown trigger */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="h-full px-3 py-2.5 flex items-center gap-1.5 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/70 rounded-l-xl border-r border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
                  >
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="text-xs font-semibold">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown popup */}
                  {countryDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1f2633] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-50 p-1.5 max-h-56 overflow-y-auto space-y-0.5">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setPhoneDigits("");
                            setCountryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                            selectedCountry.id === c.id
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{c.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formatted phone input */}
                <input
                  type="tel"
                  required
                  value={formatPhone(phoneDigits, selectedCountry)}
                  onChange={handlePhoneChange}
                  placeholder={selectedCountry.placeholder}
                  className="flex-1 px-3.5 py-2.5 bg-transparent text-slate-900 dark:text-white text-xs font-bold focus:outline-none placeholder:text-slate-400"
                />

                {isPhoneComplete && (
                  <div className="flex items-center pr-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IF PASSWORD MODE & USERNAME SELECTED */}
          {authMethod === "password" && loginMode === "login" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Login yoki Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin yoki info@store.uz"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          {/* IF AUTH METHOD IS SMS: CODE INPUT AND RESEND BUTTON */}
          {authMethod === "sms" && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>SMS tasdiqlash kodi</span>
                </label>
                {smsCooldown > 0 && (
                  <span className="text-[11px] font-mono font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{smsCooldown}s</span>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="4 xonali kod"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={smsLoading || smsCooldown > 0 || !isPhoneComplete}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  {smsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>
                    {smsCooldown > 0
                      ? `${smsCooldown}s`
                      : smsSent
                      ? "Qayta yuborish"
                      : "SMS kod olish"}
                  </span>
                </button>
              </div>

            </div>
          )}

          {/* IF AUTH METHOD IS PASSWORD: PASSWORD INPUT & TOGGLE */}
          {authMethod === "password" && (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setLoginMode(loginMode === "phone" ? "login" : "phone")}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  {loginMode === "phone" ? "Login / Email orqali kirish" : "Telefon orqali kirish"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Parol</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <span>{submitting ? "Tekshirilmoqda..." : "Tizimga kirish"}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
          Hali do'koningiz yo'qmi?
          <a href="/dashboard/register/" className="font-semibold text-blue-600 hover:underline ml-1">
            Ro'yxatdan o'tish
          </a>
        </div>
      </div>
    </div>
  );
};
