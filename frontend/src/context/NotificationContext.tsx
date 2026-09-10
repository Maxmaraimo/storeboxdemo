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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<NotificationData>({
    new_orders_count: 0,
    unread_chats_count: 0,
    total_unread: 0,
    notifications: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<NotificationData>("/dashboard/notifications/");
      setData({
        new_orders_count: res.data.new_orders_count || 0,
        unread_chats_count: res.data.unread_chats_count || 0,
        total_unread: res.data.total_unread || 0,
        notifications: res.data.notifications || [],
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

  const markAllRead = async () => {
    try {
      await api.post("/dashboard/notifications/mark-read/");
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

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
      }}
    >
      {children}
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
