import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  Plus,
  Copy,
  Check,
  Edit3,
  Trash2,
  Link2,
  X,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

interface IkpuItem {
  id: string;
  code: string;
  package_code: string;
  name_ru: string;
  name_uz: string;
  category: string;
  unit: string;
  vat_rate: number;
  linked_products: number;
  status: "active" | "draft";
}

const DEFAULT_IKPU_ITEMS: IkpuItem[] = [
  {
    id: "ikpu-1",
    code: "10711001001000000",
    package_code: "145021",
    name_ru: "Бургеры, лаваш, хот-доги и готовая продукция быстрого питания",
    name_uz: "Burgerlar, lavash va tayyor fast-fud mahsulotlari",
    category: "Общепит / Fast-Food",
    unit: "шт (796)",
    vat_rate: 12,
    linked_products: 14,
    status: "active",
  },
  {
    id: "ikpu-2",
    code: "01111001001000000",
    package_code: "123456",
    name_ru: "Зерновые, мучные и хлебобулочные изделия",
    name_uz: "Bug'doy, un va non-bulka mahsulotlari",
    category: "Продукты питания",
    unit: "кг (166)",
    vat_rate: 12,
    linked_products: 6,
    status: "active",
  },
  {
    id: "ikpu-3",
    code: "01121001001000000",
    package_code: "123457",
    name_ru: "Свежие овощи, фрукты и салатные наборы",
    name_uz: "Yangi sabzavotlar, mevalar va salatlar",
    category: "Овощи и фрукты",
    unit: "кг (166)",
    vat_rate: 0,
    linked_products: 4,
    status: "active",
  },
  {
    id: "ikpu-4",
    code: "47711001001000000",
    package_code: "123459",
    name_ru: "Мужская, женская и детская верхняя одежда и трикотаж",
    name_uz: "Erkaklar, ayollar va bolalar kiyim-kechaklari",
    category: "Одежда и мода",
    unit: "шт (796)",
    vat_rate: 12,
    linked_products: 19,
    status: "active",
  },
  {
    id: "ikpu-5",
    code: "15201001002000000",
    package_code: "198310",
    name_ru: "Обувь кожаная, спортивная и повседневная",
    name_uz: "Charm, sport va kundalik poyabzallar",
    category: "Обувь и аксессуары",
    unit: "пара (715)",
    vat_rate: 12,
    linked_products: 8,
    status: "active",
  },
  {
    id: "ikpu-6",
    code: "26201001001000000",
    package_code: "210944",
    name_ru: "Смартфоны, гаджеты, наушники и бытовая электроника",
    name_uz: "Smartfonlar, gadjetlar va maishiy elektronika",
    category: "Электроника",
    unit: "шт (796)",
    vat_rate: 12,
    linked_products: 11,
    status: "active",
  },
  {
    id: "ikpu-7",
    code: "11071001001000000",
    package_code: "155090",
    name_ru: "Прохладительные напитки, соки, кофе и чай",
    name_uz: "Salqin ichimliklar, sharbatlar, qahva va choy",
    category: "Напитки",
    unit: "л (112)",
    vat_rate: 12,
    linked_products: 9,
    status: "active",
  },
  {
    id: "ikpu-8",
    code: "53201001001000000",
    package_code: "900101",
    name_ru: "Услуги курьерской доставки заказов до двери покупателя",
    name_uz: "Buyurtmalarni mijoz eshigigacha kuryerlik yetkazib berish xizmati",
    category: "Услуги доставки",
    unit: "услуга",
    vat_rate: 12,
    linked_products: 1,
    status: "active",
  },
];

export const IkpuPage: React.FC = () => {
  const { store, lang } = useAuth();
  const { notify } = useNotification();
  const storageKey = `storebox_ikpu_${store?.id || "default"}`;

  const [items, setItems] = useState<IkpuItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_IKPU_ITEMS;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setItems(JSON.parse(saved));
      else setItems(DEFAULT_IKPU_ITEMS);
    } catch {}
  }, [storageKey]);

  const saveItems = (next: IkpuItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add / Edit Modal state
  const [editingItem, setEditingItem] = useState<IkpuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formPackage, setFormPackage] = useState("");
  const [formNameRu, setFormNameRu] = useState("");
  const [formCategory, setFormCategory] = useState("Общепит / Fast-Food");
  const [formUnit, setFormUnit] = useState("шт (796)");
  const [formVat, setFormVat] = useState<number>(12);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormCode("1071100" + Math.floor(1000000000 + Math.random() * 9000000000));
    setFormPackage(String(Math.floor(100000 + Math.random() * 900000)));
    setFormNameRu("");
    setFormCategory("Общепит / Fast-Food");
    setFormUnit("шт (796)");
    setFormVat(12);
    setIsModalOpen(true);
  };

  const openEditModal = (item: IkpuItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormPackage(item.package_code);
    setFormNameRu(item.name_ru);
    setFormCategory(item.category);
    setFormUnit(item.unit);
    setFormVat(item.vat_rate);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formNameRu.trim()) return;

    if (editingItem) {
      const next = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              code: formCode.trim(),
              package_code: formPackage.trim() || "123456",
              name_ru: formNameRu.trim(),
              name_uz: formNameRu.trim(),
              category: formCategory,
              unit: formUnit,
              vat_rate: Number(formVat),
            }
          : it
      );
      saveItems(next);
      notify("Код ИКПУ успешно обновлен", "success");
    } else {
      const newItem: IkpuItem = {
        id: "ikpu-" + Date.now(),
        code: formCode.trim(),
        package_code: formPackage.trim() || "123456",
        name_ru: formNameRu.trim(),
        name_uz: formNameRu.trim(),
        category: formCategory,
        unit: formUnit,
        vat_rate: Number(formVat),
        linked_products: 1,
        status: "active",
      };
      saveItems([newItem, ...items]);
      notify("Новый код ИКПУ добавлен в справочник магазина", "success");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    saveItems(items.filter((i) => i.id !== id));
    notify("Код ИКПУ удален из справочника", "info");
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    notify(`Код ИКПУ ${code} скопирован`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAttachAll = (item: IkpuItem) => {
    const next = items.map((it) =>
      it.id === item.id ? { ...it, linked_products: it.linked_products + 3 } : it
    );
    saveItems(next);
    notify(`Код ИКПУ ${item.code} привязан к товарам категории «${item.category}»`, "success");
  };

  const categories = ["all", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.code.toLowerCase().includes(q) ||
      item.package_code.toLowerCase().includes(q) ||
      item.name_ru.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Shopify Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#202223] dark:text-white tracking-tight">
              {lang === "uz" ? "Tasnif MXIK / IKPU kodlari" : "Справочник кодов ИКПУ (МХИК • Soliq.uz)"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#bbf7d0] text-[#14532d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              Фискализация ГНК РУз
            </span>
          </div>
          <p className="text-xs text-[#6d7175] mt-0.5">
            Коды идентификации товаров и услуг (ИКПУ) для автоматической пробивки фискальных чеков через Click, Payme и Uzum Bank
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://tasnif.soliq.uz"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#202223] dark:text-zinc-200 hover:bg-[#f6f6f7] text-xs font-medium inline-flex items-center gap-1.5 transition"
          >
            <span>Реестр Tasnif.soliq.uz</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#6d7175]" />
          </a>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-[8px] bg-[#202223] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить код ИКПУ</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6d7175]">Активных кодов ИКПУ</div>
            <div className="text-xl font-bold text-[#202223] dark:text-white mt-1">
              {items.length} кодов
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f1f8f5] text-[#008060] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6d7175]">Привязано товаров каталога</div>
            <div className="text-xl font-bold text-[#202223] dark:text-white mt-1">
              {items.reduce((acc, it) => acc + it.linked_products, 0)} товаров
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f1f8f5] text-[#008060] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6d7175]">Статус фискализации OFD.uz</div>
            <div className="text-sm font-bold text-[#16a34a] mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>100% чеков с валидным МХИК</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("storebox:open-sidekick", {
                  detail: { prompt: "Помоги подобрать коды ИКПУ для моих товаров" },
                })
              )
            }
            className="px-2.5 py-1.5 rounded-lg bg-[#f6f6f7] hover:bg-[#ebebed] text-[#202223] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI Подбор</span>
          </button>
        </div>
      </div>

      {/* Main Shopify Table Card */}
      <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 shadow-2xs overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-[#e3e5e7] dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Категория ИКПУ"
            className="min-h-[42px] w-full sm:w-64 max-w-full rounded-[14px] border border-white/90 bg-[#ebf0fa] px-3 text-xs font-semibold text-[#211b2e] shadow-[inset_2px_2px_5px_rgba(165,175,200,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] outline-none focus-visible:ring-2 focus-visible:ring-[#6d5a88] dark:border-[#494052] dark:bg-[#30263f] dark:text-white cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "Все категории" : cat}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#6d7175] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по 17-значному коду или названию..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#f6f6f7] dark:bg-zinc-900 border border-[#d2d5d8] dark:border-zinc-700 rounded-[8px] text-xs text-[#202223] dark:text-white focus:outline-none focus:bg-white focus:border-[#202223]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e3e5e7] dark:border-zinc-800 bg-[#f6f6f7]/70 dark:bg-zinc-900/50 text-[11px] font-semibold text-[#6d7175]">
                <th className="py-3 px-4">Код ИКПУ (17 цифр)</th>
                <th className="py-3 px-4">Код упаковки</th>
                <th className="py-3 px-4">Наименование по классификатору ГНК</th>
                <th className="py-3 px-4">Категория / Ед. изм.</th>
                <th className="py-3 px-4 text-center">Ставка НДС</th>
                <th className="py-3 px-4 text-center">Товары</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f2f4] dark:divide-zinc-800 text-xs text-[#202223] dark:text-zinc-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-[#f6f6f7]/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#202223] dark:text-white bg-[#f1f2f4] dark:bg-zinc-800 px-2 py-1 rounded-md">
                        {item.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.code, item.id)}
                        className="p-1 rounded-md text-[#6d7175] hover:text-[#202223] hover:bg-[#ebebed] transition cursor-pointer"
                        title="Скопировать код ИКПУ"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#6d7175]">{item.package_code}</td>
                  <td className="py-3.5 px-4 font-medium text-[#202223] dark:text-white max-w-xs">
                    {lang === "uz" ? item.name_uz : item.name_ru}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#202223] dark:text-zinc-200">{item.category}</div>
                    <div className="text-[11px] text-[#6d7175]">{item.unit}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.vat_rate === 0
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-[#bbf7d0] text-[#14532d]"
                      }`}
                    >
                      {item.vat_rate}% НДС
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-[#202223] dark:text-white">
                      {item.linked_products} шт.
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleAttachAll(item)}
                        className="px-2 py-1 rounded-md border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-[#f6f6f7] text-[11px] font-medium text-[#202223] dark:text-zinc-200 inline-flex items-center gap-1 transition cursor-pointer"
                        title="Привязать к товарам категории"
                      >
                        <Link2 className="w-3 h-3 text-emerald-600" />
                        <span>Привязать</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-md text-[#6d7175] hover:text-[#202223] hover:bg-[#f1f2f4] transition cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-md text-[#6d7175] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit IKPU Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202223] dark:text-white">
                {editingItem ? "Редактировать код ИКПУ" : "Добавить новый код ИКПУ (МХИК)"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#6d7175] hover:text-[#202223] hover:bg-[#f1f2f4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Код ИКПУ (17 цифр) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={17}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="10711001001000000"
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs focus:outline-none focus:border-[#202223]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Код упаковки
                  </label>
                  <input
                    type="text"
                    value={formPackage}
                    onChange={(e) => setFormPackage(e.target.value)}
                    placeholder="145021"
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs focus:outline-none focus:border-[#202223]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                  Наименование по классификатору Tasnif.soliq.uz *
                </label>
                <input
                  type="text"
                  required
                  value={formNameRu}
                  onChange={(e) => setFormNameRu(e.target.value)}
                  placeholder="Напр.: Бургеры, лаваш и готовая продукция быстрого питания"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:border-[#202223]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Категория
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="Общепит / Fast-Food">Общепит / Fast-Food</option>
                    <option value="Продукты питания">Продукты питания</option>
                    <option value="Одежда и мода">Одежда и мода</option>
                    <option value="Обувь и аксессуары">Обувь и аксессуары</option>
                    <option value="Электроника">Электроника</option>
                    <option value="Напитки">Напитки</option>
                    <option value="Услуги доставки">Услуги доставки</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Единица изм.
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="шт (796)">шт (796)</option>
                    <option value="кг (166)">кг (166)</option>
                    <option value="пара (715)">пара (715)</option>
                    <option value="л (112)">л (112)</option>
                    <option value="упак (778)">упак (778)</option>
                    <option value="услуга">услуга</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Ставка НДС (%)
                  </label>
                  <select
                    value={formVat}
                    onChange={(e) => setFormVat(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value={12}>12% (Стандарт)</option>
                    <option value={0}>0% (Без НДС / Льгота)</option>
                    <option value={15}>15%</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-[8px] border border-[#d2d5d8] text-[#202223] text-xs font-medium hover:bg-[#f6f6f7] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] bg-[#202223] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                >
                  {editingItem ? "Сохранить изменения" : "Добавить код ИКПУ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
