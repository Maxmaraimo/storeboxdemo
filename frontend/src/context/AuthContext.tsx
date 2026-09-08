import React, { createContext, useContext, useEffect, useState } from "react";
import { api, initCsrf } from "../api/client";
import { User, Store } from "../types";
import { Language, getTranslation } from "../i18n/translations";

interface AuthContextType {
  user: User | null;
  store: Store | null;
  stores: Store[];
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchStore: (id: number) => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem("storebox_lang") as Language) || "uz";
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("storebox_lang", l);
    document.cookie = `django_language=${l}; path=/; max-age=31536000`;
  };

  const t = (key: string) => getTranslation(lang, key);

  const refreshMe = async () => {
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data.user);
      setStore(res.data.store);
      setStores(res.data.stores || []);
    } catch {
      setUser(null);
      setStore(null);
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
    await refreshMe();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      setUser(null);
      setStore(null);
    }
  };

  const switchStore = async (id: number) => {
    const res = await api.post(`/auth/switch-store/${id}/`);
    setStore(res.data.store);
    await refreshMe();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        stores,
        lang,
        setLang,
        t,
        loading,
        login,
        logout,
        switchStore,
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
