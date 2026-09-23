import React, { createContext, useContext, useEffect, useState } from "react";
import { api, initCsrf } from "../api/client";
import { User, Store, UserPermissions } from "../types";
import { Language, getTranslation } from "../i18n/translations";

interface AuthContextType {
  user: User | null;
  store: Store | null;
  stores: Store[];
  permissions: UserPermissions | null;
  hasPermission: (module: string, action?: "view" | "edit" | "delete") => boolean;
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  loading: boolean;
  login: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  switchStore: (id: number) => Promise<void>;
  createStore: (data: { name: string; subdomain?: string; business_type?: string }) => Promise<any>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") as Language;
      if (urlLang === "uz" || urlLang === "ru" || urlLang === "en") {
        return urlLang;
      }
      const initialWindowLang = (window as any).__INITIAL_LANG__ as Language;
      if (initialWindowLang === "uz" || initialWindowLang === "ru" || initialWindowLang === "en") {
        return initialWindowLang;
      }
      const match = document.cookie.match(/(?:^|;\s*)(?:storebox_lang|django_language)=([^;]+)/);
      if (match && (match[1] === "uz" || match[1] === "ru" || match[1] === "en")) {
        return match[1] as Language;
      }
      const saved = localStorage.getItem("storebox_lang") as Language;
      if (saved === "uz" || saved === "ru" || saved === "en") {
        return saved;
      }
    } catch {
      // ignore
    }
    return "uz";
  });

  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem("storebox_lang", l);
      document.cookie = `storebox_lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `django_language=${l}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = l;
      fetch(`/lang/${l}/?next=${encodeURIComponent(window.location.pathname)}`, { method: "GET" }).catch(() => {});
      const curUrl = new URL(window.location.href);
      curUrl.searchParams.set("lang", l);
      window.history.replaceState({}, "", curUrl.toString());
    } catch {
      // ignore
    }
  };

  const t = (key: string) => getTranslation(lang, key);

  const hasPermission = (module: string, action: "view" | "edit" | "delete" = "view"): boolean => {
    if (!user) return false;
    if (!permissions) return true; // Default allow for owners
    if (permissions.is_owner) return true;
    if (permissions.is_courier) return false;
    const mod = permissions.modules?.[module];
    if (!mod) return false;
    return Boolean(mod[action]);
  };

  const refreshMe = async () => {
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data.user);
      setStore(res.data.store);
      setStores(res.data.stores || []);
      setPermissions(res.data.permissions || null);
    } catch {
      setUser(null);
      setStore(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initCsrf().then(refreshMe);
  }, []);

  const login = async (credentials: any) => {
    const res = await api.post("/auth/login/", credentials);
    setUser(res.data.user);
    setStore(res.data.store);
    if (res.data.permissions) {
      setPermissions(res.data.permissions);
    }
    await refreshMe();
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      setUser(null);
      setStore(null);
      setPermissions(null);
    }
  };

  const switchStore = async (id: number) => {
    const res = await api.post(`/auth/switch-store/${id}/`);
    setStore(res.data.store);
    await refreshMe();
  };

  const createStore = async (data: { name: string; subdomain?: string; business_type?: string }) => {
    const res = await api.post("/auth/create-store/", data);
    setStore(res.data.store);
    if (res.data.stores) {
      setStores(res.data.stores);
    }
    await refreshMe();
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        stores,
        permissions,
        hasPermission,
        lang,
        setLang,
        t,
        loading,
        login,
        logout,
        switchStore,
        createStore,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
