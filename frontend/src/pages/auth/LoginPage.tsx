import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Phone, ArrowRight, User, ChevronDown, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
  const { login, user, permissions } = useAuth();
  const navigate = useNavigate();

  // Login Mode: 'phone' or 'login'
  const [loginMode, setLoginMode] = useState<"phone" | "login">("phone");

  // Phone input state
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(COUNTRIES[0]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("900000001");

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

    // If pasted full dial code
    if (digits.startsWith(selectedCountry.code)) {
      digits = digits.slice(selectedCountry.code.length);
    }
    // Limit to max digits for country
    digits = digits.slice(0, selectedCountry.digits);
    setPhoneDigits(digits);
  };

  const getFullUsername = (): string => {
    if (loginMode === "phone") {
      return `${selectedCountry.dialCode}${phoneDigits}`;
    }
    return usernameInput.trim();
  };

  const isPhoneComplete = phoneDigits.length === selectedCountry.digits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/80 dark:bg-[#161b26]/80 backdrop-blur-2xl rounded-3xl border border-white/90 dark:border-white/10 p-8 max-w-md w-full shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1),inset_0_1.5px_2px_rgba(255,255,255,0.95)] space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#211b2e] border border-white/10 items-center justify-center shadow-lg shadow-[#211b2e]/25 mx-auto">
            <svg viewBox="0 0 32 32" className="w-7 h-7 stroke-[#c8ff6a] fill-none stroke-[1.8] stroke-linejoin-round">
              <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z" />
              <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Store<span className="text-[#10b981]">Box</span> tizimiga kirish
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Boshqaruv paneliga kirish uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        {/* Tab switch: Phone number or Login/Email */}
        <div className="p-1 rounded-2xl bg-slate-100 dark:bg-white/5 flex gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setLoginMode("phone"); setError(""); }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              loginMode === "phone"
                ? "bg-[#211b2e] text-white shadow-md shadow-[#211b2e]/25 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Telefon raqam</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              loginMode === "login"
                ? "bg-[#211b2e] text-white shadow-md shadow-[#211b2e]/25 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Login / Email</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === "phone" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Telefon raqamingiz</span>
                <span className="text-[11px] text-slate-400 font-normal">{selectedCountry.name}</span>
              </label>

              <div className="relative flex rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus-within:border-brand focus-within:bg-white dark:focus-within:bg-white/10 transition-all">
                {/* Country dropdown trigger */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="h-full px-3 py-2.5 flex items-center gap-1.5 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/70 rounded-l-xl border-r border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white transition-colors"
                  >
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span className="text-xs font-semibold">{selectedCountry.dialCode}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown popup */}
                  {countryDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1f2633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto space-y-0.5">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setPhoneDigits("");
                            setCountryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 transition-colors ${
                            selectedCountry.id === c.id
                              ? "bg-brand/10 text-brand"
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

                {/* Formatted phone input with strict digit limits */}
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
          ) : (
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:bg-white transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Parol</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#211b2e] hover:bg-[#2c243d] text-white font-bold text-xs shadow-lg shadow-[#211b2e]/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer border border-white/10"
          >
            <span>{submitting ? "Tekshirilmoqda..." : "Kirish"}</span>
            <ArrowRight className="w-4 h-4 text-[#10b981]" />
          </button>
        </form>
      </div>
    </div>
  );
};
