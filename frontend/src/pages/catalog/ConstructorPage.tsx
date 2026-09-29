import React, { useState, useRef } from "react";
import axios from "axios";
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
  Pizza,
  Coffee,
  Smartphone,
  ChevronRight,
  ArrowLeft,
  CheckSquare,
  CircleDot,
  Hash,
  PowerOff,
  Upload,
  Search,
} from "lucide-react";
import { api, getCsrfToken } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export const PHOTO_LIBRARY = [
  // Готовые блюда
  { category: "dishes", label: "Пицца Пепперони", url: "/static/images/constructor/real_pizza_isolated.png" },
  { category: "dishes", label: "Пицца 4 Сыра", url: "/static/images/constructor/real_pizza_four_cheese.png" },
  { category: "dishes", label: "Бургер Black Angus", url: "/static/images/constructor/real_burger_full.png" },
  { category: "dishes", label: "Двойной Ангус BBQ", url: "/static/images/constructor/real_double_angus_isolated.png" },
  { category: "dishes", label: "Шеф Чизбургер Делюкс", url: "/static/images/constructor/real_cheeseburger_isolated.png" },
  { category: "dishes", label: "Халапеньо Спайси Бургер", url: "/static/images/constructor/real_burger_spicy.png" },

  // Сыры и основы
  { category: "cheese", label: "Сыр Моцарелла", url: "/static/images/constructor/mozzarella_cheese.png" },
  { category: "cheese", label: "Сырный бортик к пицце", url: "/static/images/constructor/cheese_crust_visual.png" },
  { category: "cheese", label: "Котлета с сыром Чеддер", url: "/static/images/constructor/patty_cheese_real.png" },

  // Мясо и начинки
  { category: "meat", label: "Пряная Пепперони", url: "/static/images/constructor/pepperoni_topping.png" },
  { category: "meat", label: "Мраморная говядина", url: "/static/images/constructor/beef_meat_topping.png" },
  { category: "meat", label: "Хрустящий бекон", url: "/static/images/constructor/bacon_real.png" },
  { category: "meat", label: "Котлета говяжья гриль", url: "/static/images/constructor/patty_plain_real.png" },
  { category: "meat", label: "Жареное яйцо (глазунья)", url: "/static/images/constructor/egg_real.png" },

  // Овощи и зелень
  { category: "veg", label: "Шампиньоны свежие", url: "/static/images/constructor/mushrooms_topping.png" },
  { category: "veg", label: "Сочные томаты черри", url: "/static/images/constructor/tomato_slices.png" },
  { category: "veg", label: "Острый халапеньо", url: "/static/images/constructor/jalapeno_topping.png" },
  { category: "veg", label: "Хрустящий жареный лук", url: "/static/images/constructor/onions_real.png" },
  { category: "veg", label: "Маринованные огурчики", url: "/static/images/constructor/pickles_real.png" },

  // Соусы
  { category: "sauce", label: "Сливочный Ранч (соус)", url: "/static/images/constructor/sauce_dip_cup.png" },
  { category: "sauce", label: "Копченый BBQ соус", url: "/static/images/constructor/sauce_real.png" },
];

export const INGREDIENT_IMAGE_PRESETS = [
  { label: "Без фото (Текст)", url: "" },
  ...PHOTO_LIBRARY.map((p) => ({ label: p.label, url: p.url })),
];

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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"catalog" | "new">("catalog");
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // New product form in Add modal
  const [newProductNameRu, setNewProductNameRu] = useState("");
  const [newProductNameUz, setNewProductNameUz] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(45000);
  const [newProductImage, setNewProductImage] = useState("/static/images/constructor/real_burger_full.png");
  const [newProductPreset, setNewProductPreset] = useState<string>("burger");

  // Modal product search and category filters
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalCategoryTab, setModalCategoryTab] = useState<string>("all");

  // Photo Picker Modal State
  const [photoPickerTarget, setPhotoPickerTarget] = useState<{
    type: "product" | "item" | "new_product";
    gIdx?: number;
    itIdx?: number;
  } | null>(null);
  const [photoCategoryTab, setPhotoCategoryTab] = useState<string>("all");
  const [customPhotoInput, setCustomPhotoInput] = useState<string>("");

  // Photo File Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directProductFileInputRef = useRef<HTMLInputElement>(null);

  // Live Mobile Preview Dynamic Selections (for real groups from editor)
  const [previewTab, setPreviewTab] = useState<"editor" | "preview">("editor");
  const [previewSingleSelections, setPreviewSingleSelections] = useState<Record<number, number>>({});
  const [previewMultipleSelections, setPreviewMultipleSelections] = useState<Record<string, boolean>>({});
  const [previewQuantityCounts, setPreviewQuantityCounts] = useState<Record<string, number>>({});
  const [previewPortionCount, setPreviewPortionCount] = useState<number>(1);
  const [previewBurgerStyle, setPreviewBurgerStyle] = useState<"classic" | "spicy">("classic");
  const [previewNutritionPortion, setPreviewNutritionPortion] = useState<"100g" | "portion">("portion");

  // Removables state (customer can exclude in modal)
  const [removables, setRemovables] = useState<{ id?: number | string; name_ru: string; name_uz?: string }[]>([]);
  const [newRemovableInput, setNewRemovableInput] = useState("");
  const [previewRemovedIngredients, setPreviewRemovedIngredients] = useState<Record<string, boolean>>({});

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
    if (selectedCategoryTab === "shawarma") {
      return name.includes("шаурм") || name.includes("shaurma") || name.includes("донер") || name.includes("doner") || name.includes("лаваш") || name.includes("lavash") || cat.includes("шаурм") || cat.includes("снэк");
    }
    return true;
  };

  const filteredConstructors = constructorProducts.filter(filterByTab);
  const filteredRegular = regularProducts.filter((p: any) => {
    const name = (p.name_ru || p.name_uz || "").toLowerCase();
    const isExcluded = name.includes("тирамису") || name.includes("tiramisu") || name.includes("кола") || name.includes("cola") || name.includes("наггетсы") || name.includes("сок") || name.includes("чизкейк");
    if (isExcluded) return false;
    return filterByTab(p);
  });

  // Active item details for preview
  const isEditingPizza = React.useMemo(() => {
    if (!editingProduct) return false;
    const nameLower = (editingProduct.name_ru || editingProduct.name_uz || "").toLowerCase();
    return nameLower.includes("пицц") || nameLower.includes("pitsa") || nameLower.includes("pizza");
  }, [editingProduct]);

  // Calculate live preview price dynamically from real groups and items (1:1 with customer)
  const previewCalculatedPrice = React.useMemo(() => {
    if (!editingProduct) return 0;
    let total = Number(editingProduct.price) || 0;

    if (!isEditingPizza && previewBurgerStyle === "spicy") {
      total += 5000;
    }

    groups.forEach((group, gIdx) => {
      if (group.group_type === "SINGLE") {
        const selectedItIdx =
          previewSingleSelections[gIdx] !== undefined
            ? previewSingleSelections[gIdx]
            : group.items.findIndex((x) => x.is_default);
        const activeIdx = selectedItIdx >= 0 ? selectedItIdx : (group.items.length > 0 ? 0 : -1);
        if (activeIdx >= 0 && group.items[activeIdx]) {
          total += Number(group.items[activeIdx].price) || 0;
        }
      } else if (group.group_type === "MULTIPLE") {
        group.items.forEach((it, itIdx) => {
          const key = `${gIdx}_${itIdx}`;
          const isSelected =
            previewMultipleSelections[key] !== undefined
              ? previewMultipleSelections[key]
              : Boolean(it.is_default);
          if (isSelected) {
            total += Number(it.price) || 0;
          }
        });
      } else if (group.group_type === "QUANTITY") {
        group.items.forEach((it, itIdx) => {
          const key = `${gIdx}_${itIdx}`;
          const count =
            previewQuantityCounts[key] !== undefined
              ? previewQuantityCounts[key]
              : (it.is_default ? 1 : 0);
          if (count > 0) {
            total += (Number(it.price) || 0) * count;
          }
        });
      }
    });

    return total;
  }, [editingProduct, groups, previewSingleSelections, previewMultipleSelections, previewQuantityCounts, previewBurgerStyle, isEditingPizza]);

  // 2. Open Editor for a Product
  const openEditor = async (productId: number) => {
    try {
      const res = await api.get(`/constructor/${productId}/`);
      setEditingProductId(productId);
      setEditingProduct(res.data.product);
      setGroups(res.data.groups || []);
      setRemovables(res.data.removables || []);
      setEditorOpen(true);
      setSaveSuccessMsg("");
      setPreviewSingleSelections({});
      setPreviewMultipleSelections({});
      setPreviewQuantityCounts({});
      setPreviewRemovedIngredients({});
      setPreviewPortionCount(1);
    } catch (err: any) {
      alert("Xatolik: " + (err.response?.data?.error || err.message));
    }
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingProductId(null);
    setEditingProduct(null);
    setRemovables([]);
    setNewRemovableInput("");
  };

  const handleAddRemovable = () => {
    const val = newRemovableInput.trim();
    if (!val) return;
    setRemovables((prev) => [...prev, { name_ru: val, name_uz: val }]);
    setNewRemovableInput("");
  };

  const handleRemoveRemovable = (index: number) => {
    setRemovables((prev) => prev.filter((_, i) => i !== index));
  };

  // Helpers for editing product & photos
  const handleSelectPhoto = (url: string) => {
    if (!photoPickerTarget) return;
    if (photoPickerTarget.type === "product") {
      setEditingProduct((prev: any) => ({ ...prev, image_url: url }));
    } else if (photoPickerTarget.type === "new_product") {
      setNewProductImage(url);
    } else if (
      photoPickerTarget.type === "item" &&
      photoPickerTarget.gIdx !== undefined &&
      photoPickerTarget.itIdx !== undefined
    ) {
      updateItem(photoPickerTarget.gIdx, photoPickerTarget.itIdx, "image_url", url);
    }
    setPhotoPickerTarget(null);
    setCustomPhotoInput("");
    setUploadError(null);
  };

  const handleUploadPhotoFile = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      if (photoPickerTarget?.type === "product" && editingProduct?.id) {
        formData.append("product_id", String(editingProduct.id));
      }
      const res = await axios.post("/api/products/upload-image/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": getCsrfToken() || "",
        },
        withCredentials: true,
      });
      if (res.data?.success && res.data?.image_url) {
        handleSelectPhoto(res.data.image_url);
      } else {
        setUploadError(res.data?.error || (lang === "ru" ? "Ошибка при загрузке" : "Yuklashda xatolik"));
      }
    } catch (err: any) {
      console.error("Upload error", err);
      setUploadError(err.response?.data?.error || (lang === "ru" ? "Не удалось загрузить фото" : "Rasmni yuklab bo'lmadi"));
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDirectProductUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      if (editingProduct?.id) {
        formData.append("product_id", String(editingProduct.id));
      }
      const res = await axios.post("/api/products/upload-image/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-CSRFToken": getCsrfToken() || "",
        },
        withCredentials: true,
      });
      if (res.data?.success && res.data?.image_url) {
        setEditingProduct((prev: any) => ({ ...prev, image_url: res.data.image_url }));
        setSaveSuccessMsg(lang === "ru" ? "Фотография блюда успешно обновлена!" : "Rasm yangilandi!");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
      }
    } catch (err: any) {
      console.error("Direct upload error", err);
      alert(lang === "ru" ? "Не удалось загрузить изображение" : "Rasmni yuklashda xatolik");
    } finally {
      setIsUploadingPhoto(false);
      if (directProductFileInputRef.current) directProductFileInputRef.current.value = "";
    }
  };

  const updateProductField = (field: string, val: any) => {
    setEditingProduct((prev: any) => ({ ...prev, [field]: val }));
  };

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingProductId) return;
      const res = await api.post(`/constructor/${editingProductId}/save/`, {
        groups,
        removables,
        has_constructor: true,
        product: {
          name_ru: editingProduct?.name_ru,
          name_uz: editingProduct?.name_uz,
          price: editingProduct?.price,
          description_ru: editingProduct?.description_ru,
          description_uz: editingProduct?.description_uz,
          image_url: editingProduct?.image_url,
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["constructor-list"] });
      if (data?.groups) setGroups(data.groups);
      if (data?.removables) setRemovables(data.removables);
      setSaveSuccessMsg(data?.message || (lang === "ru" ? "Успешно сохранено!" : "Muvaffaqiyatli saqlandi!"));
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    },
    onError: (err: any) => {
      alert("Saqlashda xatolik: " + (err.response?.data?.error || err.message));
    },
  });

  // 4. Delete / Disable Constructor Mutation
  const deleteConstructorMutation = useMutation({
    mutationFn: async ({ productId, deleteProduct }: { productId: number; deleteProduct?: boolean }) => {
      const res = await api.post(`/constructor/${productId}/delete/`, { delete_product: deleteProduct });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constructor-list"] });
    },
    onError: (err: any) => {
      alert("Xatolik: " + (err.response?.data?.error || err.message));
    },
  });

  const handleDisableConstructor = (productId: number, productName: string) => {
    const confirmText =
      lang === "ru"
        ? `Отключить конструктор для "${productName}"? Товар останется в каталоге магазина как стандартный товар.`
        : `"${productName}" uchun konstruktorni o'chirishni xohlaysizmi? Tovar katalogda qoladi.`;
    if (window.confirm(confirmText)) {
      deleteConstructorMutation.mutate({ productId, deleteProduct: false });
    }
  };

  const handleDeleteProduct = (productId: number, productName: string) => {
    const confirmText =
      lang === "ru"
        ? `Полностью удалить товар "${productName}" из магазина?`
        : `"${productName}" tovarini butunlay o'chirib tashlamoqchimisiz?`;
    if (window.confirm(confirmText)) {
      deleteConstructorMutation.mutate({ productId, deleteProduct: true });
    }
  };

  // 5. Add / Create Constructor Mutation
  const createConstructorMutation = useMutation({
    mutationFn: async (payload: { productId?: number; name_ru?: string; name_uz?: string; price?: number; image_url?: string; preset?: string }) => {
      const res = await api.post("/constructor/create/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["constructor-list"] });
      setAddModalOpen(false);
      setNewProductNameRu("");
      setNewProductNameUz("");
      if (data?.product_id) {
        openEditor(data.product_id);
      }
    },
    onError: (err: any) => {
      alert("Xatolik: " + (err.response?.data?.error || err.message));
    },
  });

  // 6. Load Preset
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
      {/* ------------------------------------------------------------- */}
      {/* 1. LIST VIEW: SHOWN WHEN NOT EDITING                          */}
      {/* ------------------------------------------------------------- */}
      {!editorOpen || !editingProduct ? (
        <>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
                    <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                  <span>{lang === "ru" ? "Конструктор товаров (Собери сам)" : "Mahsulotlar konstruktori"}</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-white uppercase tracking-wider">
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
                {/* Button: + Добавить товар */}
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-sm shadow-amber-500/25 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>{lang === "ru" ? "Добавить товар" : "Tovar qo'shish"}</span>
                </button>

                {/* Button: Готовые шаблоны */}
                <button
                  type="button"
                  onClick={() => setPresetModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{lang === "ru" ? "Готовые шаблоны (1-клик)" : "Tayyor shablonlar"}</span>
                </button>
              </div>
            )}
          </div>

          {/* QUICK CATEGORY TABS / FILTER BANNERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setSelectedCategoryTab("all")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                selectedCategoryTab === "all"
                  ? "bg-slate-100/90 border-slate-700 ring-2 ring-slate-700/20 shadow-sm"
                  : "bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/80 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                {selectedCategoryTab === "all" && (
                  <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">Все</span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-900">Все позиции</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Все блюда меню магазина</div>
            </div>

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
                  <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">Активно</span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-900">Бургеры & Фастфуд</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Котлета, сыр Чеддер, соусы</div>
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
                  <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">Активно</span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-900">Пиццерии & Кафе</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Тесто, соусы, мясные топпинги</div>
            </div>

            <div
              onClick={() => setSelectedCategoryTab(selectedCategoryTab === "shawarma" ? "all" : "shawarma")}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                selectedCategoryTab === "shawarma"
                  ? "bg-orange-100/60 border-orange-500 ring-2 ring-orange-500/20 shadow-sm"
                  : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/60 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Coffee className="w-4 h-4" />
                </div>
                {selectedCategoryTab === "shawarma" && (
                  <span className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full">Активно</span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-900">Шаурма & Снэки</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Мясо гриль, лаваш, фри, соусы</div>
            </div>
          </div>

          {/* CONSTRUCTOR PRODUCTS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{lang === "ru" ? "Активные товары-конструкторы" : "Faol konstruktorlar"}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                  {filteredConstructors.length}
                </span>
              </h2>
              {selectedCategoryTab !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab("all")}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  {lang === "ru" ? "Показать все категории" : "Barcha toifalarni ko'rsatish"}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                <span>Yuklanmoqda...</span>
              </div>
            ) : filteredConstructors.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
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
                            className="w-16 h-16 rounded-2xl object-contain border border-slate-100 p-1 shrink-0 bg-slate-50/50"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-slate-900 text-sm truncate">{p.name_ru || p.name_uz}</div>
                          <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">
                            {Number(p.price).toLocaleString()} UZS
                            <span className="text-[10px] text-slate-400 font-sans font-normal ml-1">
                              ({lang === "ru" ? "базовая цена" : "boshlang'ich narx"})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                              {p.groups_count} {lang === "ru" ? "шагов" : "qadam"}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                              {p.items_count} {lang === "ru" ? "опций" : "variant"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <a
                        href={store?.subdomain ? `/store/${store.subdomain}/` : "/"}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title={lang === "ru" ? "Открыть на витрине" : "Do'konda ko'rish"}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => openEditor(p.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{lang === "ru" ? "Редактировать" : "Tahrirlash"}</span>
                      </button>

                      {/* Кнопка: Отключить конструктор */}
                      <button
                        type="button"
                        onClick={() => handleDisableConstructor(p.id, p.name_ru || p.name_uz)}
                        className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title={lang === "ru" ? "Отключить конструктор для товара" : "Konstruktorni o'chirish"}
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{lang === "ru" ? "Отключить" : "O'chirish"}</span>
                      </button>

                      {/* Кнопка: Полностью удалить товар */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.name_ru || p.name_uz)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 font-bold text-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
                        title={lang === "ru" ? "Удалить товар полностью" : "Butunlay o'chirish"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === "ru" ? "Включить конструктор" : "Konstruktor qo'shish"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. INLINE STUDIO CONSTRUCTOR EDITOR (KEEPS DASHBOARD SIDEBAR) */
        /* ------------------------------------------------------------- */
        <div className="space-y-6 animate-fade-in">
          {/* Top Sticky/Header Bar inside Dashboard Layout */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-amber-500" />
                <span>{lang === "ru" ? "Назад к списку товаров" : "Ro'yxatga qaytish"}</span>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {editingProduct.name_ru || editingProduct.name_uz || "Товар-конструктор"}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                    Студия
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {lang === "ru" ? "Базовая цена:" : "Boshlang'ich narx:"}{" "}
                  <span className="font-mono font-bold text-amber-600">
                    {Number(editingProduct.price || 0).toLocaleString()} UZS
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile View Switcher (Visible on small screens) */}
            <div className="flex xl:hidden items-center p-1 rounded-xl bg-slate-100 text-xs font-bold self-start sm:self-center">
              <button
                type="button"
                onClick={() => setPreviewTab("editor")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  previewTab === "editor" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                {lang === "ru" ? "Настройки" : "Sozlamalar"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  previewTab === "preview" ? "bg-amber-500 text-white shadow-xs" : "text-slate-600"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === "ru" ? "Телефон" : "Telefon"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              {saveSuccessMsg && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <Check className="w-4 h-4" />
                  {saveSuccessMsg}
                </span>
              )}

              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{lang === "ru" ? "Сохранить изменения" : "Saqlash"}</span>
              </button>
            </div>
          </div>

          {/* 2-Column Studio Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Editor Panels (7 cols) */}
            <div
              className={`xl:col-span-7 space-y-6 ${
                previewTab === "preview" ? "hidden xl:block" : "block"
              }`}
            >
              {/* 1. DISH BASIC INFO & MAIN PHOTO CARD */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                        {lang === "ru" ? "1. Основная информация о блюде" : "1. Taom haqida asosiy ma'lumot"}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ru"
                          ? "Название, цена, описание и главное фото блюда для витрины"
                          : "Taom nomi, narxi, tavsifi va vitrina rasmi"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Dish Main Photo Box */}
                  <div className="w-full sm:w-48 shrink-0 flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                    <div className="w-36 h-36 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center p-2.5 overflow-hidden shadow-xs">
                      {editingProduct.image_url ? (
                        <img
                          src={editingProduct.image_url}
                          alt=""
                          className="w-full h-full object-contain rounded-xl drop-shadow-sm"
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1">
                          <Package className="w-8 h-8" />
                          <span className="text-[10px]">{lang === "ru" ? "Нет фото" : "Rasm yo'q"}</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={directProductFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDirectProductUpload(file);
                      }}
                    />

                    <div className="w-full space-y-1.5">
                      <button
                        type="button"
                        onClick={() => directProductFileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>{lang === "ru" ? "Загрузить своё фото" : "O'z rasmingizni yuklash"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPickerTarget({ type: "product" });
                          setCustomPhotoInput(editingProduct.image_url || "");
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lang === "ru" ? "Выбрать из галереи" : "Galereyadan tanlash"}</span>
                      </button>
                    </div>

                    {editingProduct.image_url && (
                      <button
                        type="button"
                        onClick={() => updateProductField("image_url", "")}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        {lang === "ru" ? "Удалить фото" : "Olib tashlash"}
                      </button>
                    )}
                  </div>

                  {/* Product Name, Price, Description Fields */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === "ru" ? "Название блюда (RU)" : "Taom nomi (RU)"}
                        </label>
                        <input
                          type="text"
                          value={editingProduct.name_ru || ""}
                          onChange={(e) => updateProductField("name_ru", e.target.value)}
                          placeholder="Например: Собери свой Бургер"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === "ru" ? "Название блюда (UZ)" : "Taom nomi (UZ)"}
                        </label>
                        <input
                          type="text"
                          value={editingProduct.name_uz || ""}
                          onChange={(e) => updateProductField("name_uz", e.target.value)}
                          placeholder="Masalan: O'z burgeringizni yig'ing"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === "ru" ? "Базовая цена товара (UZS)" : "Boshlang'ich narx (UZS)"}
                        </label>
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-amber-500 focus-within:bg-white transition-all">
                          <input
                            type="number"
                            value={editingProduct.price ?? 0}
                            onChange={(e) => updateProductField("price", Number(e.target.value) || 0)}
                            className="flex-1 bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none"
                          />
                          <span className="text-[11px] font-bold text-slate-400">UZS</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {lang === "ru" ? "Краткое описание (RU)" : "Qisqa tavsif (RU)"}
                        </label>
                        <input
                          type="text"
                          value={editingProduct.description_ru || ""}
                          onChange={(e) => updateProductField("description_ru", e.target.value)}
                          placeholder="Фирменное блюдо с возможностью кастомизации"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DEFAULT INGREDIENTS (REMOVABLES - "УБРАТЬ ИЗ СОСТАВА") */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <MinusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                        {lang === "ru"
                          ? "2. Ингредиенты по умолчанию (покупатель может убрать из состава)"
                          : "2. Standart masalliqlar (xaridor olib tashlashi mumkin)"}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === "ru"
                          ? "Укажите состав блюда. Покупатель при заказе сможет исключить нежелательные ингредиенты (например, лук или огурцы)."
                          : "Taom tarkibidagi masalliqlar. Xaridor xohlamasa ularni chiqarib tashlashi mumkin."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Removable chips */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {removables.map((rem, rIdx) => (
                      <span
                        key={rIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 transition-all shadow-2xs group"
                      >
                        <span>{rem.name_ru || rem.name_uz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRemovable(rIdx)}
                          className="w-4 h-4 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {removables.length === 0 && (
                      <span className="text-xs text-slate-400 italic">
                        {lang === "ru" ? "Ингредиенты не добавлены" : "Masalliqlar qo'shilmagan"}
                      </span>
                    )}
                  </div>

                  {/* Add removable ingredient input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newRemovableInput}
                      onChange={(e) => setNewRemovableInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddRemovable();
                        }
                      }}
                      placeholder={lang === "ru" ? "Например: Маринованные огурцы, Лук, Соус..." : "Masalan: Tuzlangan bodring..."}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddRemovable}
                      disabled={!newRemovableInput.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === "ru" ? "Добавить" : "Qo'shish"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. GROUPS & INGREDIENTS BUILDER */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      {lang === "ru" ? "3. Шаги и группы ингредиентов" : "3. Tanlov bosqichlari va masalliqlar"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {lang === "ru"
                        ? "Настраивайте шаги (основа, начинки, соусы, топпинги) с фотографиями и ценами."
                        : "Taom bosqichlarini sozlang va rasmlarni belgilang."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addGroup}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Добавить шаг" : "Qadam qo'shish"}</span>
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    {lang === "ru"
                      ? "Шагов пока нет. Нажмите «Добавить шаг», чтобы создать группу ингредиентов."
                      : "Guruhlar yo'q. Qadam yaratish uchun 'Qadam qo'shish' tugmasini bosing."}
                  </div>
                ) : (
                  groups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4 transition-all"
                    >
                      {/* Group Header: Row 1 (Step Badge & Controls), Row 2 (Full-width RU & UZ inputs) */}
                      <div className="space-y-3 pb-3 border-b border-slate-100">
                        {/* Row 1: Step Badge + Type Select + Required Checkbox + Delete */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 font-black text-xs">
                              {lang === "ru" ? `Шаг ${gIdx + 1}` : `${gIdx + 1}-qadam`}
                            </span>
                            <select
                              value={group.group_type}
                              onChange={(e) => updateGroup(gIdx, "group_type", e.target.value)}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
                            >
                              <option value="SINGLE">Один вариант (Размер / Булочка / Тесто)</option>
                              <option value="MULTIPLE">Несколько вариантов (Сыры / Соусы / Зелень)</option>
                              <option value="QUANTITY">Счётчик порций (+ / −) (Топпинги с фото)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none text-xs font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={group.is_required}
                                onChange={(e) => updateGroup(gIdx, "is_required", e.target.checked)}
                                className="rounded text-amber-500 focus:ring-amber-500"
                              />
                              <span>{lang === "ru" ? "Обязательно" : "Majburiy"}</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => removeGroup(gIdx)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={lang === "ru" ? "Удалить группу" : "Guruhni o'chirish"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Generous 2-column input fields for RU and UZ labels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              {lang === "ru" ? "Название шага (RU)" : "Guruh nomi (RU)"}
                            </label>
                            <input
                              type="text"
                              value={group.name_ru}
                              onChange={(e) => updateGroup(gIdx, "name_ru", e.target.value)}
                              placeholder="Например: 1. Основа теста"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              {lang === "ru" ? "Название (UZ)" : "Guruh nomi (UZ)"}
                            </label>
                            <input
                              type="text"
                              value={group.name_uz}
                              onChange={(e) => updateGroup(gIdx, "name_uz", e.target.value)}
                              placeholder="Masalan: 1. Asos xamiri"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Items in this Group */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>{lang === "ru" ? "Варианты / Ингредиенты" : "Variantlar va masalliqlar"}</span>
                          <button
                            type="button"
                            onClick={() => addItem(gIdx)}
                            className="text-amber-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{lang === "ru" ? "Добавить вариант" : "Variant qo'shish"}</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {group.items.map((item, itIdx) => (
                            <div
                              key={itIdx}
                              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-center gap-2.5">
                                {/* Item Photo Preview Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhotoPickerTarget({ type: "item", gIdx, itIdx });
                                    setCustomPhotoInput(item.image_url || "");
                                  }}
                                  className="w-12 h-12 rounded-xl bg-white border border-slate-200 hover:border-amber-500 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs transition-all group/photo relative cursor-pointer"
                                  title={lang === "ru" ? "Нажмите для выбора фото" : "Rasm tanlash"}
                                >
                                  {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="text-[10px] text-slate-400 font-bold flex flex-col items-center">
                                      <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                                      <span className="text-[9px]">Фото</span>
                                    </div>
                                  )}
                                </button>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={item.name_ru}
                                    onChange={(e) => updateItem(gIdx, itIdx, "name_ru", e.target.value)}
                                    placeholder="Название (RU)"
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500"
                                  />
                                  <input
                                    type="text"
                                    value={item.name_uz}
                                    onChange={(e) => updateItem(gIdx, itIdx, "name_uz", e.target.value)}
                                    placeholder="Nomi (UZ)"
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-500"
                                  />
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400">+</span>
                                    <input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => updateItem(gIdx, itIdx, "price", Number(e.target.value) || 0)}
                                      placeholder="0 UZS"
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                                    />
                                    <span className="text-[10px] font-mono text-slate-400">UZS</span>
                                  </div>
                                </div>

                                <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer select-none shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={item.is_default}
                                    onChange={(e) => updateItem(gIdx, itIdx, "is_default", e.target.checked)}
                                    className="rounded text-amber-500 focus:ring-amber-500"
                                  />
                                  <span className="hidden sm:inline">{lang === "ru" ? "По умолч." : "Standart"}</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => removeItem(gIdx, itIdx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                                  title={lang === "ru" ? "Удалить вариант" : "O'chirish"}
                                >
                                  <MinusCircle className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Visual Image Selector Row */}
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPhotoPickerTarget({ type: "item", gIdx, itIdx });
                                      setCustomPhotoInput(item.image_url || "");
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                    <span>
                                      {item.image_url
                                        ? (lang === "ru" ? "Сменить фото" : "Rasmni almashtirish")
                                        : (lang === "ru" ? "+ Выбрать фото из каталога" : "+ Katalogdan rasm tanlash")}
                                    </span>
                                  </button>
                                  {item.image_url && (
                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                                      {item.image_url}
                                    </span>
                                  )}
                                </div>

                                {item.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => updateItem(gIdx, itIdx, "image_url", "")}
                                    className="text-[10px] text-rose-500 hover:underline shrink-0 cursor-pointer"
                                  >
                                    {lang === "ru" ? "Убрать фото" : "Olib tashlash"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Real-Time Mobile Phone Preview (5 cols, sticky!) 1:1 WITH STOREFRONT */}
            <div
              className={`xl:col-span-5 xl:sticky xl:top-6 space-y-3 ${
                previewTab === "editor" ? "hidden xl:block" : "block"
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>{lang === "ru" ? "Витрина покупателя (1:1 с магазином)" : "Xaridor oynasi (1:1)"}</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {lang === "ru" ? "Живой просмотр" : "Jonli rejim"}
                </span>
              </div>

              {/* iPhone Mockup Frame (Ultra-clean, exactly matches customer modal) */}
              <div className="w-full max-w-[380px] mx-auto rounded-[44px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 flex flex-col text-slate-900 select-none">
                {/* Dynamic Island */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-end px-2 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800"></div>
                </div>

                {/* Smartphone Screen Canvas */}
                <div className="rounded-[34px] bg-[#F8FAFC] flex flex-col overflow-hidden text-xs shadow-inner h-[620px]">
                  {/* Status Bar */}
                  <div className="px-5 pt-1.5 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0 bg-white border-b border-slate-100">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px]">5G</span>
                      <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.2">
                        <div className="w-2.5 h-full bg-slate-700 rounded-2xs"></div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Modal Container (1:1 copy of constructor_modal.html) */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar flex flex-col">
                    {/* Modal Header with Food Photo & Close (X) */}
                    <div className="relative bg-white pt-3 px-4 pb-3 shrink-0 border-b border-slate-100">
                      <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center shadow-2xs">
                        <X className="w-3.5 h-3.5" />
                      </div>

                      {/* Clean Food Photo Container (Rounded 20px, no harsh border) */}
                      <div className="w-full h-32 rounded-[20px] bg-slate-100/60 p-1.5 flex items-center justify-center overflow-hidden">
                        <img
                          src={
                            previewBurgerStyle === "spicy" && !((editingProduct.name_ru || '').toLowerCase().includes('лав') || (editingProduct.name_ru || '').toLowerCase().includes('шаур') || (editingProduct.name_uz || '').toLowerCase().includes('lavash') || (editingProduct.name_uz || '').toLowerCase().includes('shaurma'))
                              ? "/static/images/constructor/real_burger_spicy.png"
                              : (editingProduct.image_url ||
                                  (isEditingPizza
                                    ? "/static/images/constructor/real_pizza_isolated.png"
                                    : "/static/images/constructor/real_burger_full.png"))
                          }
                          alt=""
                          className={`transition-all duration-300 ${
                            isEditingPizza || !editingProduct.image_url
                              ? "max-h-[92%] max-w-[85%] object-contain drop-shadow-md"
                              : "w-full h-full object-cover rounded-[16px]"
                          }`}
                        />
                      </div>

                      <div className="mt-2.5 space-y-0.5">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-1">
                            {previewBurgerStyle === "spicy"
                              ? (lang === "ru" ? `Острый ${editingProduct.name_ru || editingProduct.name_uz}` : `Achchiq ${editingProduct.name_uz || editingProduct.name_ru}`)
                              : (editingProduct.name_ru || editingProduct.name_uz || "Товар-конструктор")}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            {isEditingPizza ? "480 г" : (previewBurgerStyle === "spicy" ? "354 г" : "340 г")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                          {editingProduct.description_ru ||
                            editingProduct.description_uz ||
                            "Фирменное блюдо с возможностью индивидуальной настройки состава."}
                        </p>
                      </div>
                    </div>

                    {/* Scrollable Body (1:1 with Storefront Modal) */}
                    <div className="p-3.5 space-y-3.5 bg-slate-50/70 flex-1 overflow-y-auto min-h-0">

                      {/* 1. BURGER / SHAWARMA / FOOD STYLE (Classic vs Spicy Sriracha) */}
                      {!isEditingPizza && (
                        <div className="space-y-1.5 pb-2.5 border-b border-slate-200/80">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                            {(editingProduct.name_ru || '').toLowerCase().includes('лав') || (editingProduct.name_ru || '').toLowerCase().includes('шаур') || (editingProduct.name_uz || '').toLowerCase().includes('lavash') || (editingProduct.name_uz || '').toLowerCase().includes('shaurma')
                              ? (lang === "ru" ? "Стиль лаваша" : "Lavash uslubi")
                              : (lang === "ru" ? "Стиль бургера" : "Burger uslubi")}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Klassik */}
                            <div
                              onClick={() => setPreviewBurgerStyle("classic")}
                              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                previewBurgerStyle === "classic"
                                  ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-xs text-slate-900"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center justify-center h-16 w-full mb-1 overflow-hidden rounded-[12px]">
                                <img
                                  src={editingProduct.image_url || "/static/images/constructor/real_burger_full.png"}
                                  alt=""
                                  className={editingProduct.image_url ? "w-full h-full object-cover rounded-[10px]" : "h-full object-contain drop-shadow-xs"}
                                />
                              </div>
                              <div className="font-bold text-xs text-slate-900 text-center mb-1">
                                {lang === "ru" ? "Классический" : "Klassik"}
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                                <span className={`text-[11px] font-mono font-bold ${previewBurgerStyle === "classic" ? "text-amber-600" : "text-slate-500"}`}>
                                  0 UZS
                                </span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  previewBurgerStyle === "classic" ? "border-amber-500 bg-amber-500" : "border-slate-300 bg-white"
                                }`}>
                                  {previewBurgerStyle === "classic" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                              </div>
                            </div>

                            {/* Achchiq (Sriracha) */}
                            <div
                              onClick={() => setPreviewBurgerStyle("spicy")}
                              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                previewBurgerStyle === "spicy"
                                  ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-xs text-slate-900"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center justify-center h-16 w-full mb-1 relative overflow-hidden rounded-[12px]">
                                <img
                                  src={
                                    ((editingProduct.name_ru || '').toLowerCase().includes('лав') || (editingProduct.name_ru || '').toLowerCase().includes('шаур') || (editingProduct.name_uz || '').toLowerCase().includes('lavash') || (editingProduct.name_uz || '').toLowerCase().includes('shaurma'))
                                      ? (editingProduct.image_url || "/static/images/constructor/real_burger_spicy.png")
                                      : "/static/images/constructor/real_burger_spicy.png"
                                  }
                                  alt=""
                                  className={editingProduct.image_url ? "w-full h-full object-cover rounded-[10px]" : "h-full object-contain drop-shadow-xs"}
                                />
                                <img src="/static/images/constructor/qalampir_chili.svg" alt="" className="absolute bottom-0.5 right-0.5 w-4 h-4 object-contain bg-white/90 rounded-full p-0.5 shadow-2xs" />
                              </div>
                              <div className="font-bold text-xs text-slate-900 text-center mb-1">
                                {lang === "ru" ? "Острый (Sriracha)" : "Achchiq (Sriracha)"}
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                                <span className="text-[11px] font-mono font-bold text-amber-600">+5 000 UZS</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  previewBurgerStyle === "spicy" ? "border-amber-500 bg-amber-500" : "border-slate-300 bg-white"
                                }`}>
                                  {previewBurgerStyle === "spicy" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Removables Chips (MASALLIQNI OLIB TASHLASH) */}
                      {removables.length > 0 && (
                        <div className="space-y-1.5 pb-2.5 border-b border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                              {lang === "ru" ? "Убрать ингредиенты" : "Masalliqni olib tashlash"}
                            </span>
                            {Object.values(previewRemovedIngredients).filter(Boolean).length > 0 && (
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                                {lang === "ru"
                                  ? `Убрано: ${Object.values(previewRemovedIngredients).filter(Boolean).length}`
                                  : `Olib tashlandi: ${Object.values(previewRemovedIngredients).filter(Boolean).length}`}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {removables.map((rem, rIdx) => {
                              const key = `rem_${rIdx}`;
                              const isRemoved = Boolean(previewRemovedIngredients[key]);
                              const name = (lang === "ru" ? rem.name_ru : rem.name_uz) || rem.name_ru || rem.name_uz;
                              return (
                                <button
                                  key={rIdx}
                                  type="button"
                                  onClick={() =>
                                    setPreviewRemovedIngredients((prev) => ({
                                      ...prev,
                                      [key]: !isRemoved,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                                    isRemoved
                                      ? "bg-rose-50 border-rose-300 text-rose-600 line-through opacity-80"
                                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs"
                                  }`}
                                >
                                  <span>{name}</span>
                                  <X className={`w-3 h-3 ${isRemoved ? "text-rose-600" : "text-slate-400"}`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 3. Groups (Toppings Carousel / Single / Multiple) */}
                      {groups.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                          {lang === "ru"
                            ? "Добавьте шаги и ингредиенты слева, чтобы увидеть их в превью покупателя"
                            : "Masalliqlar va qadamlarni chap tomonda qo'shing"}
                        </div>
                      ) : (
                        groups.map((group, gIdx) => {
                          const groupName =
                            (lang === "ru" ? group.name_ru : group.name_uz) ||
                            group.name_ru ||
                            group.name_uz ||
                            (lang === "ru" ? `Шаг ${gIdx + 1}` : `${gIdx + 1}-qadam`);

                          return (
                            <div
                              key={gIdx}
                              className="space-y-2 pt-2.5 first:pt-0 border-t first:border-t-0 border-slate-200/80"
                            >
                              {/* Step Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center text-[9px] font-black">
                                    {gIdx + 1}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                                    {groupName}
                                  </span>
                                </div>
                                {group.is_required && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    {lang === "ru" ? "Обязательно" : "Majburiy"}
                                  </span>
                                )}
                              </div>

                              {/* 1. SINGLE Group Type */}
                              {group.group_type === "SINGLE" && (
                                <div className="grid grid-cols-2 gap-2">
                                  {group.items.map((it, itIdx) => {
                                    const selectedItIdx =
                                      previewSingleSelections[gIdx] !== undefined
                                        ? previewSingleSelections[gIdx]
                                        : group.items.findIndex((x) => x.is_default);
                                    const isSelected =
                                      selectedItIdx >= 0 ? selectedItIdx === itIdx : itIdx === 0;
                                    const itName =
                                      (lang === "ru" ? it.name_ru : it.name_uz) ||
                                      it.name_ru ||
                                      it.name_uz ||
                                      `Вариант ${itIdx + 1}`;
                                    const itPrice = Number(it.price) || 0;

                                    return (
                                      <div
                                        key={itIdx}
                                        onClick={() =>
                                          setPreviewSingleSelections((prev) => ({
                                            ...prev,
                                            [gIdx]: itIdx,
                                          }))
                                        }
                                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                          isSelected
                                            ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-xs text-slate-900"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-2xs"
                                        }`}
                                      >
                                        <div className="flex items-center justify-center h-16 w-full mb-1">
                                          {it.image_url ? (
                                            <img
                                              src={it.image_url}
                                              alt=""
                                              className="h-full object-contain drop-shadow-xs"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                              <Utensils className="w-4 h-4" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="font-bold text-xs text-slate-900 text-center mb-1 line-clamp-1">
                                          {itName}
                                        </div>
                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                                          <span
                                            className={`text-[11px] font-mono font-bold ${
                                              isSelected ? "text-amber-600" : "text-slate-500"
                                            }`}
                                          >
                                            {itPrice > 0 ? `+${itPrice.toLocaleString()} UZS` : "0 UZS"}
                                          </span>
                                          <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                              isSelected
                                                ? "border-amber-500 bg-amber-500"
                                                : "border-slate-300 bg-white"
                                            }`}
                                          >
                                            {isSelected && (
                                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* 2. MULTIPLE Group Type */}
                              {group.group_type === "MULTIPLE" && (
                                <div className="grid grid-cols-2 gap-2">
                                  {group.items.map((it, itIdx) => {
                                    const key = `${gIdx}_${itIdx}`;
                                    const isSelected =
                                      previewMultipleSelections[key] !== undefined
                                        ? previewMultipleSelections[key]
                                        : Boolean(it.is_default);
                                    const itName =
                                      (lang === "ru" ? it.name_ru : it.name_uz) ||
                                      it.name_ru ||
                                      it.name_uz ||
                                      `Опция ${itIdx + 1}`;
                                    const itPrice = Number(it.price) || 0;

                                    return (
                                      <div
                                        key={itIdx}
                                        onClick={() =>
                                          setPreviewMultipleSelections((prev) => ({
                                            ...prev,
                                            [key]: !isSelected,
                                          }))
                                        }
                                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                                          isSelected
                                            ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-xs text-slate-900"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 shadow-2xs"
                                        }`}
                                      >
                                        <div className="flex items-center justify-center h-16 w-full mb-1 relative">
                                          {it.image_url ? (
                                            <img
                                              src={it.image_url}
                                              alt=""
                                              className="h-full object-contain drop-shadow-xs"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                              <Layers className="w-4 h-4" />
                                            </div>
                                          )}
                                          {isSelected && (
                                            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                        <div className="font-bold text-xs text-slate-900 text-center mb-1 line-clamp-1">
                                          {itName}
                                        </div>
                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                                          <span
                                            className={`text-[11px] font-mono font-bold ${
                                              isSelected ? "text-amber-600" : "text-slate-500"
                                            }`}
                                          >
                                            {itPrice > 0 ? `+${itPrice.toLocaleString()} UZS` : "0 UZS"}
                                          </span>
                                          <div
                                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                              isSelected
                                                ? "border-amber-500 bg-amber-500 text-white"
                                                : "border-slate-300 bg-white"
                                            }`}
                                          >
                                            {isSelected && (
                                              <span className="text-[9px] font-bold">✓</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* 3. QUANTITY Group Type (Horizontal Carousel 1:1 with target design) */}
                              {group.group_type === "QUANTITY" && (
                                <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
                                  {group.items.map((it, itIdx) => {
                                    const key = `${gIdx}_${itIdx}`;
                                    const count =
                                      previewQuantityCounts[key] !== undefined
                                        ? previewQuantityCounts[key]
                                        : it.is_default
                                        ? 1
                                        : 0;
                                    const itName =
                                      (lang === "ru" ? it.name_ru : it.name_uz) ||
                                      it.name_ru ||
                                      it.name_uz ||
                                      `Топпинг ${itIdx + 1}`;
                                    const itPrice = Number(it.price) || 0;

                                    return (
                                      <div
                                        key={itIdx}
                                        className={`w-28 shrink-0 p-2.5 rounded-2xl bg-white border transition-all flex flex-col items-center justify-between text-center select-none ${
                                          count > 0
                                            ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-xs"
                                            : "border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs"
                                        }`}
                                      >
                                        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-1 relative p-1 overflow-hidden">
                                          {it.image_url ? (
                                            <img
                                              src={it.image_url}
                                              alt=""
                                              className="w-full h-full object-contain drop-shadow-xs"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                              <PlusCircle className="w-4 h-4" />
                                            </div>
                                          )}
                                          {count > 0 && (
                                            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                                              ✓
                                            </span>
                                          )}
                                        </div>

                                        <div className="font-bold text-[11px] text-slate-900 text-center mb-0.5 line-clamp-1 w-full">
                                          {itName}
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-center text-slate-500 mb-1">
                                          {itPrice > 0 ? `+${itPrice.toLocaleString()} UZS` : "0 UZS"}
                                        </div>

                                        {/* Counter / Plus Button */}
                                        <div className="w-full flex justify-center pt-1 border-t border-slate-100">
                                          {count === 0 ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setPreviewQuantityCounts((prev) => ({
                                                  ...prev,
                                                  [key]: 1,
                                                }))
                                              }
                                              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                                            >
                                              +
                                            </button>
                                          ) : (
                                            <div className="flex items-center gap-1 bg-amber-500 text-white rounded-full px-1.5 py-0.5 shadow-xs">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setPreviewQuantityCounts((prev) => ({
                                                    ...prev,
                                                    [key]: Math.max(0, count - 1),
                                                  }))
                                                }
                                                className="w-3.5 h-3.5 rounded-full hover:bg-white/20 flex items-center justify-center font-black text-[10px] cursor-pointer"
                                              >
                                                −
                                              </button>
                                              <span className="w-2.5 text-center font-mono font-black text-[10px]">
                                                {count}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setPreviewQuantityCounts((prev) => ({
                                                    ...prev,
                                                    [key]: count + 1,
                                                  }))
                                                }
                                                className="w-3.5 h-3.5 rounded-full hover:bg-white/20 flex items-center justify-center font-black text-[10px] cursor-pointer"
                                              >
                                                +
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* 4. OZUQAVIY QIYMATI (Nutrition Facts 1:1) */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                            {lang === "ru" ? "Пищевая ценность" : "Ozuqaviy qiymati"}
                          </span>
                          <div className="inline-flex p-0.5 bg-slate-100 rounded-full text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={() => setPreviewNutritionPortion("100g")}
                              className={`px-2 py-0.2 rounded-full transition-all cursor-pointer ${
                                previewNutritionPortion === "100g" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-500"
                              }`}
                            >
                              100 г
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewNutritionPortion("portion")}
                              className={`px-2 py-0.2 rounded-full transition-all cursor-pointer ${
                                previewNutritionPortion === "portion" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-500"
                              }`}
                            >
                              {isEditingPizza ? "480 г" : "340 г"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          <div className="bg-white rounded-xl p-1.5 text-center border border-slate-200/80 shadow-2xs">
                            <span className="text-[8.5px] text-slate-400 font-bold block uppercase">KKAL</span>
                            <span className="text-xs font-black font-mono text-slate-900">
                              {previewNutritionPortion === "100g" ? 218 : (isEditingPizza ? 1150 : 740)}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl p-1.5 text-center border border-slate-200/80 shadow-2xs">
                            <span className="text-[8.5px] text-slate-400 font-bold block uppercase">{lang === "ru" ? "Жиры" : "Yog'"}</span>
                            <span className="text-xs font-black font-mono text-slate-900">
                              {previewNutritionPortion === "100g" ? "10g" : (isEditingPizza ? "36g" : "34g")}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl p-1.5 text-center border border-slate-200/80 shadow-2xs">
                            <span className="text-[8.5px] text-slate-400 font-bold block uppercase">{lang === "ru" ? "Белки" : "Oqsil"}</span>
                            <span className="text-xs font-black font-mono text-slate-900">
                              {previewNutritionPortion === "100g" ? "11g" : (isEditingPizza ? "42g" : "38g")}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl p-1.5 text-center border border-slate-200/80 shadow-2xs">
                            <span className="text-[8.5px] text-slate-400 font-bold block uppercase">{lang === "ru" ? "Углев." : "Uglevod"}</span>
                            <span className="text-xs font-black font-mono text-slate-900">
                              {previewNutritionPortion === "100g" ? "14g" : (isEditingPizza ? "110g" : "48g")}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* MODAL BOTTOM STICKY BAR (1:1 with Storefront Modal) */}
                    <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between gap-2 shrink-0">
                      {/* Portion Counter */}
                      <div className="h-9 px-2 rounded-xl bg-slate-100/90 border border-slate-200/70 text-slate-800 flex items-center gap-1 shrink-0 font-bold">
                        <button
                          type="button"
                          onClick={() => setPreviewPortionCount(Math.max(1, previewPortionCount - 1))}
                          className="w-5 h-5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                        >
                          −
                        </button>
                        <span className="w-4 text-center font-mono font-bold text-xs text-slate-900">{previewPortionCount}</span>
                        <button
                          type="button"
                          onClick={() => setPreviewPortionCount(previewPortionCount + 1)}
                          className="w-5 h-5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Modest CTA Order Button */}
                      <div className="flex-1 h-9 sm:h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-between px-3 cursor-pointer">
                        <span className="whitespace-nowrap font-bold tracking-tight">{lang === "ru" ? "Заказать" : "Buyurtma berish"}</span>
                        <span className="font-mono font-bold text-[10px] sm:text-[11px] bg-black/15 px-2 py-0.5 rounded-md whitespace-nowrap tracking-tight ml-1.5">
                          {(previewCalculatedPrice * previewPortionCount).toLocaleString()} UZS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home Bar Indicator */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-2 shrink-0"></div>
              </div>

              {/* Note under Phone */}
              <div className="text-center pt-1 text-[11px] text-slate-400 font-medium">
                {lang === "ru"
                  ? "Точная копия витрины магазина (1:1): все изменения слева синхронизируются здесь."
                  : "Do'kon vitrinasi bilan 1:1 nusxa: barcha o'zgarishlar shu yerda jonli ko'rinadi."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: + ДОБАВИТЬ ТОВАР-КОНСТРУКТОР                        */}
      {/* ------------------------------------------------------------- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {lang === "ru" ? "Добавить товар-конструктор" : "Yangi konstruktor qo'shish"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === "ru"
                      ? "Выберите блюдо из каталога или создайте новое"
                      : "Katalogdan tovar tanlang yoki yangisini yarating"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAddModalTab("catalog")}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  addModalTab === "catalog" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                {lang === "ru" ? "Из меню магазина" : "Menyudan tanlash"}
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab("new")}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  addModalTab === "new" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                {lang === "ru" ? "Создать новое блюдо" : "Noldan yaratish"}
              </button>
            </div>

            {/* TAB 1: Existing Catalog Products */}
            {addModalTab === "catalog" && (
              <div className="space-y-3">
                {/* Search & Category Pills */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      placeholder={lang === "ru" ? "Поиск блюда (бургер, шаурма, пицца...)" : "Qidiruv..."}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: "all", label: lang === "ru" ? "Все блюда" : "Barchasi" },
                      { id: "burger", label: lang === "ru" ? "Бургеры" : "Burgerlar" },
                      { id: "shawarma", label: lang === "ru" ? "Шаурма / Лаваш" : "Lavash / Shaurma" },
                      { id: "pizza", label: lang === "ru" ? "Пицца" : "Pitsa" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setModalCategoryTab(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          modalCategoryTab === tab.id
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 p-2">
                  {(() => {
                    const filteredList = regularProducts.filter((p: any) => {
                      const name = (p.name_ru || p.name_uz || "").toLowerCase();
                      const cat = (p.category_name_ru || p.category_name || "").toLowerCase();
                      if (name.includes("тирамису") || name.includes("чизкейк") || name.includes("кола") || name.includes("cola") || name.includes("наггетсы")) {
                        return false;
                      }
                      if (modalSearchQuery.trim()) {
                        const q = modalSearchQuery.toLowerCase();
                        if (!name.includes(q) && !cat.includes(q)) return false;
                      }
                      if (modalCategoryTab === "burger") {
                        return name.includes("бургер") || name.includes("burger") || name.includes("чизбургер") || cat.includes("бургер");
                      }
                      if (modalCategoryTab === "shawarma") {
                        return name.includes("шаурм") || name.includes("донер") || name.includes("лаваш") || cat.includes("шаурм") || cat.includes("донер");
                      }
                      if (modalCategoryTab === "pizza") {
                        return name.includes("пицц") || name.includes("pitsa") || name.includes("pizza") || cat.includes("пицц");
                      }
                      return true;
                    });

                    if (filteredList.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-slate-400">
                          {lang === "ru" ? "Блюда не найдены" : "Taomlar topilmadi"}
                        </div>
                      );
                    }

                    return filteredList.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2.5 flex items-center justify-between hover:bg-white rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {p.primary_image_url ? (
                            <img
                              src={p.primary_image_url}
                              alt=""
                              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-100 p-0.5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-900">{p.name_ru || p.name_uz}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {Number(p.price).toLocaleString()} UZS
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => createConstructorMutation.mutate({ productId: p.id })}
                          disabled={createConstructorMutation.isPending}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === "ru" ? "Включить" : "Ulash"}</span>
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* TAB 2: Create Brand-New Dish */}
            {addModalTab === "new" && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "ru" ? "Название блюда (RU)" : "Taom nomi (RU)"}
                  </label>
                  <input
                    type="text"
                    value={newProductNameRu}
                    onChange={(e) => setNewProductNameRu(e.target.value)}
                    placeholder="Например: Кастомный Бургер"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "ru" ? "Название (UZ)" : "Taom nomi (UZ)"}
                  </label>
                  <input
                    type="text"
                    value={newProductNameUz}
                    onChange={(e) => setNewProductNameUz(e.target.value)}
                    placeholder="Masalan: Maxsus Burger"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {lang === "ru" ? "Базовая цена (UZS)" : "Narxi (UZS)"}
                    </label>
                    <input
                      type="number"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {lang === "ru" ? "Фото блюда" : "Rasmi"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhotoPickerTarget({ type: "new_product" })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === "ru" ? "Выбрать фото" : "Tanlash"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {lang === "ru" ? "Шаблон конструктора" : "Konstruktor shabloni"}
                  </label>
                  <select
                    value={newProductPreset}
                    onChange={(e) => setNewProductPreset(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="burger">{lang === "ru" ? "Бургер-конструктор" : "Burger konstruktor"}</option>
                    <option value="shawarma">{lang === "ru" ? "Шаурма / Лаваш / Донер" : "Lavash / Shaurma"}</option>
                    <option value="pizza">{lang === "ru" ? "Пицца-конструктор" : "Pitsa konstruktor"}</option>
                    <option value="hotdog">{lang === "ru" ? "Хот-дог конструктор" : "Hot-dog konstruktor"}</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      createConstructorMutation.mutate({
                        name_ru: newProductNameRu,
                        name_uz: newProductNameUz || newProductNameRu,
                        price: newProductPrice,
                        image_url: newProductImage,
                        preset: newProductPreset,
                      })
                    }
                    disabled={!newProductNameRu.trim() || createConstructorMutation.isPending}
                    className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {createConstructorMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    )}
                    <span>{lang === "ru" ? "Создать и настроить конструктор" : "Yaratish va sozlash"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VISUAL PHOTO PICKER MODAL (NO EMOJIS, CLEAN CATEGORIES)   */}
      {/* ------------------------------------------------------------- */}
      {photoPickerTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {lang === "ru" ? "Выберите изображение из каталога" : "Katalogdan rasm tanlang"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {photoPickerTarget.type === "product" || photoPickerTarget.type === "new_product"
                      ? (lang === "ru" ? "Главное фото блюда" : "Taomning asosiy rasmi")
                      : (lang === "ru" ? "Фото ингредиента или опции" : "Masalliq rasmi")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoPickerTarget(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Your Own Photo Zone */}
            <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadPhotoFile(file);
                }}
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {lang === "ru" ? "Загрузить своё фото с устройства" : "Qurilmangizdan o'z rasmingizni yuklang"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === "ru" ? "PNG, JPG, WEBP любого размера (до 10 МБ)" : "PNG, JPG, WEBP (10 MB gacha)"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{lang === "ru" ? "Загрузка..." : "Yuklanmoqda..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-white" />
                    <span>{lang === "ru" ? "Выбрать файл" : "Faylni tanlash"}</span>
                  </>
                )}
              </button>
            </div>

            {uploadError && (
              <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-rose-600 text-xs font-bold flex items-center justify-between shrink-0">
                <span>{uploadError}</span>
                <button type="button" onClick={() => setUploadError(null)} className="text-rose-400 hover:text-rose-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category Tabs (Clean text, NO emojis) */}
            <div className="p-2.5 border-b border-slate-100 flex gap-1.5 overflow-x-auto shrink-0 bg-slate-50/60 no-scrollbar">
              {[
                { id: "all", label: "Все фото" },
                { id: "dishes", label: "Готовые блюда" },
                { id: "cheese", label: "Сыры и основы" },
                { id: "meat", label: "Мясо и начинки" },
                { id: "veg", label: "Овощи и зелень" },
                { id: "sauce", label: "Соусы и дипы" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPhotoCategoryTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    photoCategoryTab === tab.id
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Photo Grid */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PHOTO_LIBRARY.filter(
                  (p) => photoCategoryTab === "all" || p.category === photoCategoryTab
                ).map((photo, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleSelectPhoto(photo.url)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all group flex flex-col items-center text-center bg-white cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-xl bg-slate-50 flex items-center justify-center p-1 mb-2 group-hover:scale-105 transition-transform">
                      <img src={photo.url} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-amber-600">
                      {photo.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input & Remove button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="w-full sm:flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  placeholder="Вставьте ссылку на фото из интернета (URL)"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customPhotoInput.trim()) {
                      handleSelectPhoto(customPhotoInput.trim());
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  {lang === "ru" ? "Применить" : "Qo'llash"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPhoto("")}
                className="text-xs text-rose-500 hover:underline shrink-0 font-medium cursor-pointer"
              >
                {lang === "ru" ? "Убрать фото (без фото)" : "Rasmsiz qilish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. PRESET SELECTION MODAL (NO EMOJIS, CLEAN LUCIDE ICONS)     */}
      {/* ------------------------------------------------------------- */}
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
              <button
                type="button"
                onClick={() => setPresetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
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
                { id: "burger", icon: Utensils, title: "Бургер-конструктор", desc: "Булочки, котлеты Black Angus, сыры, соусы, халапеньо, бекон", color: "text-amber-600" },
                { id: "shawarma", icon: Utensils, title: "Шаурма / Лаваш / Донер", desc: "Лаваш, сырный лаваш, пита, мясо гриль, соусы, картофель фри", color: "text-amber-700" },
                { id: "pizza", icon: Pizza, title: "Пицца-конструктор", desc: "Основа теста, соусы, моцарелла, пепперони, грибы", color: "text-rose-600" },
                { id: "hotdog", icon: Utensils, title: "Хот-дог конструктор", desc: "Булочки бриошь, баварские колбаски, лук фри, релиш, соусы", color: "text-orange-600" },
                { id: "coffee", icon: Coffee, title: "Кофе и напитки", desc: "Эспрессо, капучино, овсяное/миндальное молоко, сиропы, сливки", color: "text-amber-800" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLoadPreset(p.id)}
                  disabled={Boolean(loadingPreset)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                      <p.icon className={`w-5 h-5 ${p.color}`} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </div>
                  </div>
                  {loadingPreset === p.id ? (
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
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
