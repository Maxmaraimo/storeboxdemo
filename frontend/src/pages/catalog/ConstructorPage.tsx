import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wand2,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  ExternalLink,
  Check,
  Package,
  Layers,
  HelpCircle,
  Loader2,
  X,
  PlusCircle,
  MinusCircle,
  Utensils,
  Flower2,
  Shirt,
  Pizza,
  Coffee,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface ConstructorItemData {
  id?: number;
  name_ru: string;
  name_uz: string;
  name_en?: string;
  price: number;
  image_url?: string;
  is_default: boolean;
  is_active: boolean;
  sort_order?: number;
}

interface ConstructorGroupData {
  id?: number;
  name_ru: string;
  name_uz: string;
  name_en?: string;
  group_type: "SINGLE" | "MULTIPLE" | "QUANTITY";
  is_required: boolean;
  min_required: number;
  max_allowed: number;
  sort_order?: number;
  is_active: boolean;
  items: ConstructorItemData[];
}

export const ConstructorPage: React.FC = () => {
  const { lang, store, hasPermission } = useAuth();
  const canEdit = hasPermission("products", "edit");
  const queryClient = useQueryClient();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [groups, setGroups] = useState<ConstructorGroupData[]>([]);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // 1. Fetch Constructor List
  const { data, isLoading } = useQuery({
    queryKey: ["constructor-list", store?.id],
    queryFn: async () => {
      const res = await api.get("/constructor/");
      return res.data;
    },
  });

  const constructorProducts = data?.constructor_products || [];
  const regularProducts = data?.regular_products || [];

  const filterByTab = (p: any) => {
    if (selectedCategoryTab === "all") return true;
    const name = (p.name_ru || p.name_uz || "").toLowerCase();
    const cat = (p.category_name_ru || p.category_name || "").toLowerCase();
    if (selectedCategoryTab === "burger") {
      return name.includes("бургер") || name.includes("burger") || name.includes("чизбургер") || cat.includes("бургер") || cat.includes("фастфуд");
    }
    if (selectedCategoryTab === "pizza") {
      return name.includes("пицц") || name.includes("pitsa") || name.includes("pizza") || cat.includes("пицц") || cat.includes("кафе");
    }
    if (selectedCategoryTab === "flower") {
      return name.includes("букет") || name.includes("цвет") || name.includes("gul") || cat.includes("цвет") || cat.includes("букет");
    }
    if (selectedCategoryTab === "apparel") {
      return name.includes("мерч") || name.includes("одежд") || name.includes("футболк") || name.includes("худи") || cat.includes("одежд");
    }
    return true;
  };

  const filteredConstructors = constructorProducts.filter(filterByTab);
  const filteredRegular = regularProducts.filter(filterByTab);

  // 2. Open Editor for a Product
  const openEditor = async (productId: number) => {
    try {
      const res = await api.get(`/constructor/${productId}/`);
      setEditingProductId(productId);
      setEditingProduct(res.data.product);
      setGroups(res.data.groups || []);
      setEditorOpen(true);
      setSaveSuccessMsg("");
    } catch (err: any) {
      alert("Xatolik: " + (err.response?.data?.error || err.message));
    }
  };

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingProductId) return;
      const res = await api.post(`/constructor/${editingProductId}/save/`, {
        groups,
        has_constructor: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["constructor-list"] });
      setSaveSuccessMsg(data?.message || "Muvaffaqiyatli saqlandi!");
      setTimeout(() => setSaveSuccessMsg(""), 3000);
    },
    onError: (err: any) => {
      alert("Saqlashda xatolik: " + (err.response?.data?.error || err.message));
    },
  });

  // 4. Load Preset
  const handleLoadPreset = async (presetId: string) => {
    setLoadingPreset(presetId);
    try {
      const res = await api.post("/constructor/preset/", { preset_id: presetId });
      queryClient.invalidateQueries({ queryKey: ["constructor-list"] });
      setPresetModalOpen(false);
      if (res.data?.product_id) {
        openEditor(res.data.product_id);
      }
    } catch (err: any) {
      alert("Xatolik: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPreset(null);
    }
  };

  // Group helpers
  const addGroup = () => {
    const newGroup: ConstructorGroupData = {
      name_ru: `Группа ${groups.length + 1}`,
      name_uz: `Guruh ${groups.length + 1}`,
      group_type: "SINGLE",
      is_required: true,
      min_required: 1,
      max_allowed: 1,
      is_active: true,
      items: [
        { name_ru: "Вариант 1", name_uz: "Variant 1", price: 0, is_default: true, is_active: true },
        { name_ru: "Вариант 2", name_uz: "Variant 2", price: 5000, is_default: false, is_active: true },
      ],
    };
    setGroups([...groups, newGroup]);
  };

  const removeGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const updateGroup = (index: number, field: keyof ConstructorGroupData, val: any) => {
    const updated = [...groups];
    (updated[index] as any)[field] = val;
    setGroups(updated);
  };

  // Item helpers
  const addItem = (groupIndex: number) => {
    const updated = [...groups];
    updated[groupIndex].items.push({
      name_ru: `Опция ${updated[groupIndex].items.length + 1}`,
      name_uz: `Opsion ${updated[groupIndex].items.length + 1}`,
      price: 0,
      is_default: false,
      is_active: true,
    });
    setGroups(updated);
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const updated = [...groups];
    updated[groupIndex].items = updated[groupIndex].items.filter((_, i) => i !== itemIndex);
    setGroups(updated);
  };

  const updateItem = (groupIndex: number, itemIndex: number, field: keyof ConstructorItemData, val: any) => {
    const updated = [...groups];
    (updated[groupIndex].items[itemIndex] as any)[field] = val;
    setGroups(updated);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <span>{lang === "ru" ? "Конструктор товаров (Собери сам)" : "Mahsulotlar konstruktori"}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-600 text-white uppercase tracking-wider">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {lang === "ru"
              ? "Позвольте покупателям собирать свои бургеры, пиццы, букеты цветов или кастомную одежду с динамическим расчетом цены."
              : "Mijozlarga o'z burgerlari, pitsalari, guldastalari yoki kiyimlarini yig'ish imkoniyatini taqdim eting."}
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPresetModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{lang === "ru" ? "Шаблоны (1-клик)" : "Tayyor shablonlar"}</span>
            </button>
          </div>
        )}
      </div>

      {/* QUICK CATEGORY TABS / FILTER BANNERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedCategoryTab(selectedCategoryTab === "burger" ? "all" : "burger")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
            selectedCategoryTab === "burger"
              ? "bg-amber-100/60 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
            {selectedCategoryTab === "burger" && (
              <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">✓ Активно</span>
            )}
          </div>
          <div className="font-bold text-xs text-slate-900">Бургеры & Фастфуд</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Булочка, котлета, сыры, соусы</div>
        </div>

        <div
          onClick={() => setSelectedCategoryTab(selectedCategoryTab === "pizza" ? "all" : "pizza")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
            selectedCategoryTab === "pizza"
              ? "bg-rose-100/60 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
              : "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200/60 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Pizza className="w-4 h-4" />
            </div>
            {selectedCategoryTab === "pizza" && (
              <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">✓ Активно</span>
            )}
          </div>
          <div className="font-bold text-xs text-slate-900">Пиццерии & Кафе</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Тесто, соусы, мясные топпинги</div>
        </div>

        <div
          onClick={() => setSelectedCategoryTab(selectedCategoryTab === "flower" ? "all" : "flower")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
            selectedCategoryTab === "flower"
              ? "bg-emerald-100/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Flower2 className="w-4 h-4" />
            </div>
            {selectedCategoryTab === "flower" && (
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">✓ Активно</span>
            )}
          </div>
          <div className="font-bold text-xs text-slate-900">Цветочные букеты</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Цветы, стебли, упаковка, декор</div>
        </div>

        <div
          onClick={() => setSelectedCategoryTab(selectedCategoryTab === "apparel" ? "all" : "apparel")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
            selectedCategoryTab === "apparel"
              ? "bg-indigo-100/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
              : "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200/60 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Shirt className="w-4 h-4" />
            </div>
            {selectedCategoryTab === "apparel" && (
              <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full">✓ Активно</span>
            )}
          </div>
          <div className="font-bold text-xs text-slate-900">Мерч & Одежда</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Крой, цвет, размер, принты</div>
        </div>
      </div>

      {/* CONSTRUCTOR PRODUCTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>{lang === "ru" ? "Активные товары-конструкторы" : "Faol konstruktorlar"}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {filteredConstructors.length}
            </span>
          </h2>
          {selectedCategoryTab !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategoryTab("all")}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              {lang === "ru" ? "Показать все категории" : "Barcha toifalarni ko'rsatish"}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <span>Yuklanmoqda...</span>
          </div>
        ) : filteredConstructors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Wand2 className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-sm text-slate-900">
                {lang === "ru" ? "В этой категории пока нет товаров с конструктором" : "Ushbu toifada konstruktorli tovarlar yo'q"}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === "ru"
                  ? "Выберите товар из списка ниже, чтобы включить для него конструктор, или загрузите готовый шаблон."
                  : "Quyidagi ro'yxatdan tovar tanlang yoki tayyor shablonni yuklang."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConstructors.map((p: any) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {p.primary_image_url ? (
                      <img
                        src={p.primary_image_url}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm truncate">{p.name_ru || p.name_uz}</div>
                      <div className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                        {Number(p.price).toLocaleString()} UZS
                        <span className="text-[10px] text-slate-400 font-sans font-normal ml-1">
                          ({lang === "ru" ? "базовая цена" : "boshlang'ich narx"})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.groups_count} {lang === "ru" ? "шагов/групп" : "guruh"}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                          {p.items_count} {lang === "ru" ? "опций" : "variant"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={store?.subdomain ? `/store/${store.subdomain}/` : "/"}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title={lang === "ru" ? "Открыть на витрине" : "Do'konda ko'rish"}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => openEditor(p.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Настроить конструктор" : "Sozlash"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REGULAR PRODUCTS: CONVERT TO CONSTRUCTOR */}
      {filteredRegular.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {lang === "ru" ? "Включить конструктор для существующих товаров" : "Mavjud tovarlarga konstruktor ulash"}
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-3 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {filteredRegular.map((p: any) => (
                <div key={p.id} className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{p.name_ru || p.name_uz}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{Number(p.price).toLocaleString()} UZS</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditor(p.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Добавить конструктор" : "Konstruktor qo'shish"}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN VISUAL CONSTRUCTOR EDITOR MODAL */}
      {editorOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-slate-900 text-base truncate">
                    {lang === "ru" ? "Настройка конструктора:" : "Konstruktorni sozlash:"} {editingProduct.name_ru || editingProduct.name_uz}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {lang === "ru" ? "Базовая цена товара:" : "Boshlang'ich narx:"}{" "}
                    <span className="font-mono font-bold text-slate-900">{Number(editingProduct.price).toLocaleString()} UZS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                    <Check className="w-4 h-4" />
                    {saveSuccessMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Groups List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {lang === "ru" ? "Шаги и группы выбора" : "Tanlov bosqichlari va guruhlar"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {lang === "ru"
                        ? "Клиент будет выбирать ингредиенты или опции по этим шагам."
                        : "Xaridor ushbu bosqichlar bo'yicha masalliq va variantlarni tanlaydi."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addGroup}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Добавить группу" : "Guruh qo'shish"}</span>
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    {lang === "ru" ? "Нет групп. Нажмите «Добавить группу», чтобы создать шаг выбора." : "Guruhlar yo'q."}
                  </div>
                ) : (
                  groups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 transition-all"
                    >
                      {/* Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              {lang === "ru" ? "Название шага (RU)" : "Guruh nomi (RU)"}
                            </label>
                            <input
                              type="text"
                              value={group.name_ru}
                              onChange={(e) => updateGroup(gIdx, "name_ru", e.target.value)}
                              placeholder="Например: 1. Выберите булочку"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              {lang === "ru" ? "Название (UZ)" : "Guruh nomi (UZ)"}
                            </label>
                            <input
                              type="text"
                              value={group.name_uz}
                              onChange={(e) => updateGroup(gIdx, "name_uz", e.target.value)}
                              placeholder="Masalan: 1. Bulochkani tanlang"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <select
                            value={group.group_type}
                            onChange={(e) => updateGroup(gIdx, "group_type", e.target.value)}
                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="SINGLE">{lang === "ru" ? "Один выбор (Radio)" : "Bitta tanlov (Radio)"}</option>
                            <option value="MULTIPLE">{lang === "ru" ? "Несколько (Checkbox)" : "Bir nechta (Checkbox)"}</option>
                            <option value="QUANTITY">{lang === "ru" ? "Количество (Счетчик шт.)" : "Soni (Hisoblagich)"}</option>
                          </select>

                          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 cursor-pointer select-none text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={group.is_required}
                              onChange={(e) => updateGroup(gIdx, "is_required", e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-600"
                            />
                            <span>{lang === "ru" ? "Обязательно" : "Majburiy"}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeGroup(gIdx)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                            title={lang === "ru" ? "Удалить группу" : "Guruhni o'chirish"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items in this Group */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>{lang === "ru" ? "Варианты / Ингредиенты" : "Variantlar va masalliqlar"}</span>
                          <button
                            type="button"
                            onClick={() => addItem(gIdx)}
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{lang === "ru" ? "Добавить опцию" : "Variant qo'shish"}</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {group.items.map((item, itIdx) => (
                            <div
                              key={itIdx}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                            >
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={item.name_ru}
                                  onChange={(e) => updateItem(gIdx, itIdx, "name_ru", e.target.value)}
                                  placeholder="Название (RU)"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
                                />
                                <input
                                  type="text"
                                  value={item.name_uz}
                                  onChange={(e) => updateItem(gIdx, itIdx, "name_uz", e.target.value)}
                                  placeholder="Nomi (UZ)"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-400">+</span>
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateItem(gIdx, itIdx, "price", Number(e.target.value) || 0)}
                                    placeholder="0 UZS"
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold"
                                  />
                                  <span className="text-[10px] font-mono text-slate-400">UZS</span>
                                </div>
                              </div>

                              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={item.is_default}
                                  onChange={(e) => updateItem(gIdx, itIdx, "is_default", e.target.checked)}
                                  className="rounded text-indigo-600 focus:ring-indigo-600"
                                />
                                <span className="hidden sm:inline">{lang === "ru" ? "По умолч." : "Standart"}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => removeItem(gIdx, itIdx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                {lang === "ru" ? "Отмена" : "Bekor qilish"}
              </button>

              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 active:scale-95"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{lang === "ru" ? "Сохранить конструктор" : "Konstruktorni saqlash"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESET SELECTION MODAL */}
      {presetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {lang === "ru" ? "Выберите готовый шаблон" : "Tayyor shablonni tanlang"}
                </h3>
              </div>
              <button type="button" onClick={() => setPresetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {lang === "ru"
                ? "Шаблон автоматически создаст товар со всеми нужными шагами, ингредиентами и ценами. Вы сможете в любой момент отредактировать их."
                : "Shablon barcha masalliqlar, qadamlar va narxlar bilan tayyor konstruktorni yaratadi."}
            </p>

            <div className="space-y-2.5">
              {[
                { id: "burger", icon: Utensils, title: "🍔 Бургер-конструктор", desc: "Булочки, котлеты Black Angus, сыры, соусы, халапеньо, бекон", color: "text-amber-600" },
                { id: "pizza", icon: Pizza, title: "🍕 Пицца-конструктор", desc: "Основа теста, соусы, моцарелла, пепперони, грибы", color: "text-rose-600" },
                { id: "hotdog", icon: Utensils, title: "🌭 Хот-дог конструктор", desc: "Булочки бриошь, баварские колбаски, лук фри, релиш, соусы", color: "text-orange-600" },
                { id: "coffee", icon: Coffee, title: "☕ Кофе и напитки", desc: "Эспрессо, капучино, овсяное/миндальное молоко, сиропы, сливки", color: "text-amber-800" },
                { id: "flower", icon: Flower2, title: "💐 Собери свой Букет", desc: "Цветы, стебли (11-101 шт), корейская бумага, открытки", color: "text-emerald-600" },
                { id: "apparel", icon: Shirt, title: "👕 Кастомная одежда / Мерч", desc: "Футболки, худи, цвета, размеры, вышивка, принты", color: "text-indigo-600" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLoadPreset(p.id)}
                  disabled={Boolean(loadingPreset)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <p.icon className={`w-5 h-5 ${p.color}`} />
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </div>
                  </div>
                  {loadingPreset === p.id ? (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
