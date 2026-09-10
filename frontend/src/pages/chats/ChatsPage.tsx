import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Search, CheckCheck, User } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export interface ConversationItem {
  phone: string;
  customer_name: string;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
}

export interface ChatMessageItem {
  id: number;
  customer_phone: string;
  customer_name: string;
  sender: "CUSTOMER" | "MERCHANT";
  message: string;
  is_read: boolean;
  created_at: string;
}

export const ChatsPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");

  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats/");
      return res.data as { conversations: ConversationItem[]; total: number };
    },
    refetchInterval: 5000,
  });

  const conversations = chatsData?.conversations || [];
  const currentPhone = activePhone || conversations[0]?.phone || null;

  const { data: messagesData } = useQuery({
    queryKey: ["chat-messages", currentPhone],
    queryFn: async () => {
      if (!currentPhone) return { messages: [] };
      const res = await api.get(`/chats/${encodeURIComponent(currentPhone)}/messages/`);
      return res.data as { messages: ChatMessageItem[] };
    },
    enabled: !!currentPhone,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!currentPhone) return;
      return (await api.post(`/chats/${encodeURIComponent(currentPhone)}/send/`, { message: text })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", currentPhone] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setInputText("");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentPhone) return;
    sendMessageMutation.mutate(inputText.trim());
  };

  const activeConv = conversations.find((c) => c.phone === currentPhone);
  const messages = messagesData?.messages || [];

  const filteredConversations = conversations.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-3xl border border-black/[0.06] dark:border-white/10 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-7.5rem)]">
      {/* SIDEBAR: CONVERSATIONS LIST */}
      <div className="w-full md:w-80 border-r border-black/[0.06] dark:border-white/10 flex flex-col shrink-0">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h1 className="text-base font-black text-neutral-900 dark:text-white">{t("chat") || "Mijozlar bilan chat"}</h1>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mijozni qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/5">
          {filteredConversations.map((c) => (
            <button
              key={c.phone}
              onClick={() => setActivePhone(c.phone)}
              className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                currentPhone === c.phone
                  ? "bg-neutral-100 dark:bg-white/10 border-l-4 border-neutral-900 dark:border-white"
                  : "hover:bg-neutral-50/60 dark:hover:bg-white/5"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white flex items-center justify-center font-bold text-sm shrink-0">
                {c.customer_name ? c.customer_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">{c.customer_name}</div>
                  {c.last_message_at && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{c.last_message || c.phone}</div>
              </div>
              {c.unread_count > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {c.unread_count}
                </span>
              )}
            </button>
          ))}

          {conversations.length === 0 && !chatsLoading && (
            <div className="p-8 text-center text-neutral-400 text-xs">
              Hozircha xabarlar yo'q
            </div>
          )}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-neutral-50/50 dark:bg-black/30">
        {currentPhone ? (
          <>
            <div className="p-4 bg-white/90 dark:bg-[#18181b]/90 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white font-bold flex items-center justify-center text-sm">
                  {activeConv?.customer_name ? activeConv.customer_name.charAt(0).toUpperCase() : "M"}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">{activeConv?.customer_name || "Mijoz"}</div>
                  <div className="text-[10px] font-mono text-neutral-400">{currentPhone}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-black/[0.06] dark:border-white/10">
                Telegram / Web
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isMerchant = m.sender === "MERCHANT";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMerchant ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-xs font-medium shadow-2xs ${
                        isMerchant
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-tr-xs"
                          : "bg-white dark:bg-[#27272a] text-neutral-900 dark:text-white border border-black/[0.06] dark:border-white/10 rounded-tl-xs"
                      }`}
                    >
                      <p className="leading-relaxed">{m.message}</p>
                      <div
                        className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                          isMerchant ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-400"
                        }`}
                      >
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isMerchant && <CheckCheck className="w-3 h-3 text-emerald-400 dark:text-emerald-600" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  Suhbat hali boshlanmagan. Birinchi xabarni yuboring!
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white/90 dark:bg-[#18181b]/90 border-t border-black/[0.06] dark:border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Xabaringizni yozing..."
                className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sendMessageMutation.isPending}
                className="p-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:bg-black dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-xs">
            Suhbatni boshlash uchun chap tarafdan mijozni tanlang
          </div>
        )}
      </div>
    </div>
  );
};
