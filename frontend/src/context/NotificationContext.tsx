import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

export interface NotificationItem {
  id: string;
  type: "order" | "chat" | "system";
  title: string;
  body: string;
  created_at: string;
  url: string;
  order_id?: number;
  order_number?: string;
  is_read: boolean;
}

interface NotificationData {
  new_orders_count: number;
  unread_chats_count: number;
  total_unread: number;
  notifications: NotificationItem[];
}

interface NotificationContextType {
  newOrdersCount: number;
  unreadChatsCount: number;
  totalUnread: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markOneRead: (id: string) => void;
  notify: (message: string, type?: "success" | "error" | "info") => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DISMISSED_NOTIFS_STORAGE_KEY = "storebox_dismissed_notif_ids";

const loadDismissedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_NOTIFS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDismissedIds = (ids: Set<string>) => {
  try {
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(DISMISSED_NOTIFS_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore storage errors
  }
};

const normalizeNotificationUrl = (item: NotificationItem): string => {
  if (item.type === "order") {
    const orderIdFromId = item.id.startsWith("order_") ? item.id.slice("order_".length) : "";
    const orderId = item.order_id ? String(item.order_id) : orderIdFromId;
    if (orderId && !item.url.includes("orderId=")) {
      const sep = item.url.includes("?") ? "&" : "?";
      return `${item.url}${sep}orderId=${encodeURIComponent(orderId)}`;
    }
  }
  return item.url;
};

const playOrderChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    // Autoplay restrictions or audio context not ready
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<NotificationData>({
    new_orders_count: 0,
    unread_chats_count: 0,
    total_unread: 0,
    notifications: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const prevOrdersCountRef = React.useRef<number | null>(null);
  const dismissedIdsRef = React.useRef<Set<string>>(loadDismissedIds());

  const notify = useCallback((message: string) => {
    setToastMsg(message);
    setTimeout(() => {
      setToastMsg((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<NotificationData>("/dashboard/notifications/");
      const newOrders = res.data.new_orders_count || 0;

      if (prevOrdersCountRef.current !== null && newOrders > prevOrdersCountRef.current) {
        playOrderChime();
      }
      prevOrdersCountRef.current = newOrders;

      const rawNotifications = res.data.notifications || [];
      const visibleNotifications = rawNotifications
        .filter((n) => !dismissedIdsRef.current.has(n.id))
        .map((n) => ({
          ...n,
          url: normalizeNotificationUrl(n),
        }));

      setData({
        new_orders_count: newOrders,
        unread_chats_count: res.data.unread_chats_count || 0,
        total_unread: visibleNotifications.length,
        notifications: visibleNotifications,
      });
    } catch (err) {
      // Silently fail to avoid UI disruptions
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setData({
        new_orders_count: 0,
        unread_chats_count: 0,
        total_unread: 0,
        notifications: [],
      });
      return;
    }

    setIsLoading(true);
    fetchNotifications();

    // Poll every 15 seconds for fresh notifications
    const interval = setInterval(fetchNotifications, 15000);

    const handleFocus = () => fetchNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, fetchNotifications]);

  const markOneRead = useCallback((id: string) => {
    if (!id) return;
    dismissedIdsRef.current.add(id);
    saveDismissedIds(dismissedIdsRef.current);
    setData((prev) => {
      const remaining = prev.notifications.filter((n) => n.id !== id);
      return {
        ...prev,
        total_unread: remaining.length,
        notifications: remaining,
      };
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setData((prev) => {
      prev.notifications.forEach((n) => dismissedIdsRef.current.add(n.id));
      saveDismissedIds(dismissedIdsRef.current);
      return {
        ...prev,
        unread_chats_count: 0,
        total_unread: 0,
        notifications: [],
      };
    });
    try {
      await api.post("/dashboard/notifications/mark-read/");
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        newOrdersCount: data.new_orders_count,
        unreadChatsCount: data.unread_chats_count,
        totalUnread: data.total_unread,
        notifications: data.notifications,
        isLoading,
        refreshNotifications: fetchNotifications,
        markAllRead,
        markOneRead,
        notify,
      }}
    >
      {children}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[120] px-4 py-2.5 rounded-xl bg-[#202223] text-white text-xs font-semibold shadow-2xl border border-zinc-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const useNotification = useNotifications;
