import React, { useState } from "react";
import { MessageSquare, Send, Search, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const ChatsPage: React.FC = () => {
  const { t } = useAuth();
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [messages, setMessages] = useState([
    { id: 1, sender: "customer", text: "Assalomu alaykum, buyurtmam qachon yetib keladi?", time: "14:20" },
    { id: 2, sender: "admin", text: "Vaalaykum assalom! Kuryer yo'lga chiqdi, 20 daqiqada yetkaziladi.", time: "14:22" },
  ]);
  const [inputText, setInputText] = useState("");

  const customers = [
    { id: 1, name: "Azizbek Rahimov", phone: "+998 90 123 45 67", lastMsg: "Assalomu alaykum, buyurtmam...", time: "14:20", unread: 1 },
    { id: 2, name: "Dilnoza Karimova", phone: "+998 93 987 65 43", lastMsg: "Rahmat, mahsulot juda yoqdi!", time: "Kechagi", unread: 0 },
    { id: 3, name: "Jasur Aliyev", phone: "+998 97 555 44 33", lastMsg: "Yetkazib berish narxi qancha?", time: "05.09", unread: 0 },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now(), sender: "admin", text: inputText.trim(), time: "Hozir" },
    ]);
    setInputText("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-8rem)]">
      <div className="w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-brand" />
            <h1 className="text-base font-black text-slate-900">{t("chat")}</h1>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Mijozni qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                activeChat === c.id ? "bg-emerald-50/70 border-l-4 border-brand" : "hover:bg-slate-50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900 truncate">{c.name}</div>
                  <span className="text-[10px] text-slate-400 font-mono">{c.time}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{c.lastMsg}</div>
              </div>
              {c.unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50/50">
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-brand font-bold flex items-center justify-center text-sm">
              A
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">Azizbek Rahimov</div>
              <div className="text-[10px] font-mono text-slate-400">+998 90 123 45 67</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Online
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md rounded-2xl px-4 py-2.5 text-xs font-medium shadow-2xs ${
                  m.sender === "admin"
                    ? "bg-brand text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                    m.sender === "admin" ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  <span>{m.time}</span>
                  {m.sender === "admin" && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Xabar yozing..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Yuborish</span>
          </button>
        </form>
      </div>
    </div>
  );
};
