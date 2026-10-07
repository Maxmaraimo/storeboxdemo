import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  RotateCw,
  Plus,
  Power,
  Globe,
  Bike,
  Star,
  Wallet,
  AlertCircle,
  Truck,
  Sparkles,
} from 'lucide-react';
import {
  CourierDashboardData,
  CourierOrder,
  CourierProfile,
  Language,
} from './types';
import {
  fetchCourierDashboard,
  takeOrder,
  toggleCourierShift,
  createDemoOrder,
  updateCourierLocation,
} from './courierApi';
import { OrderCard } from './OrderCard';
import { YandexNavigatorModal } from './YandexNavigatorModal';
import { formatMoney } from './geoUtils';

const PAGE_TEXTS: Record<Language, Record<string, string>> = {
  uz: {
    courier_portal: "StoreBox Kuryer",
    on_shift: "Ishda (Onlayn)",
    off_shift: "Tanaffus (Oflayn)",
    active_tab: "Faol buyurtmalar",
    ready_tab: "Mavjud buyurtmalar",
    history_tab: "Tarix",
    today_orders: "Bugungi",
    earnings: "Daromad",
    rating: "Reyting",
    add_test_order: "+ Test buyurtma",
    refresh: "Yangilash",
    no_active_orders: "Hozirda yetkazilayotgan buyurtmalar yo'q",
    no_ready_orders: "Yangi mavjud buyurtmalar yo'q",
    no_history: "Yetkazib berilgan buyurtmalar hali mavjud emas",
    wait_new_orders: "Yangi buyurtmalar kelishi bilan shu yerda paydo bo'ladi",
    shift_toggled: "Smena holati o'zgartirildi",
    test_order_created: "Yangi test buyurtma yaratildi! 📦",
    order_taken: "Buyurtma yetkazishga olindi! 🚀",
  },
  ru: {
    courier_portal: "StoreBox Курьер",
    on_shift: "На линии",
    off_shift: "На перерыве",
    active_tab: "В доставке",
    ready_tab: "Доступные",
    history_tab: "История",
    today_orders: "Заказов",
    earnings: "Заработано",
    rating: "Рейтинг",
    add_test_order: "+ Тест заказ",
    refresh: "Обновить",
    no_active_orders: "Нет активных заказов в доставке",
    no_ready_orders: "Нет новых заказов для забора",
    no_history: "История доставок пуста",
    wait_new_orders: "Новые заказы появятся автоматически",
    shift_toggled: "Статус смены изменен",
    test_order_created: "Создан тестовый заказ! 📦",
    order_taken: "Заказ взят в доставку! 🚀",
  },
  en: {
    courier_portal: "StoreBox Courier",
    on_shift: "On Shift",
    off_shift: "On Break",
    active_tab: "Active",
    ready_tab: "Available",
    history_tab: "History",
    today_orders: "Orders",
    earnings: "Earnings",
    rating: "Rating",
    add_test_order: "+ Test Order",
    refresh: "Refresh",
    no_active_orders: "No active delivery orders",
    no_ready_orders: "No available orders to accept",
    no_history: "No delivery history yet",
    wait_new_orders: "New orders will appear automatically",
    shift_toggled: "Shift status updated",
    test_order_created: "Test order created! 📦",
    order_taken: "Order accepted for delivery! 🚀",
  },
};

export const CourierDashboardPage: React.FC = () => {
  // Read initial data injected by Django if present
  const initialData: CourierDashboardData | null =
    typeof window !== 'undefined' && (window as any).__COURIER_INITIAL_DATA__
      ? (window as any).__COURIER_INITIAL_DATA__
      : null;

  const [lang, setLang] = useState<Language>(initialData?.current_lang || 'uz');
  const t = PAGE_TEXTS[lang] || PAGE_TEXTS.ru;

  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'history'>('active');
  const [data, setData] = useState<CourierDashboardData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [takingOrderId, setTakingOrderId] = useState<number | null>(null);

  // Active Navigator Modal state
  const [activeNavOrder, setActiveNavOrder] = useState<CourierOrder | null>(null);
  const [courierLocation, setCourierLocation] = useState<[number, number] | null>(
    initialData?.courier?.current_lat && initialData?.courier?.current_lng
      ? [initialData.courier.current_lat, initialData.courier.current_lng]
      : null
  );

  const courierId = data?.courier?.id || null;

  // Load Dashboard Data from API
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetchCourierDashboard(lang, courierId);
      setData(res);
      if (res.courier?.current_lat && res.courier?.current_lng) {
        setCourierLocation([res.courier.current_lat, res.courier.current_lng]);
      }
    } catch (err) {
      console.error('Failed to load courier dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lang, courierId]);

  // Initial load & Polling (every 8s)
  useEffect(() => {
    if (!initialData) {
      loadData(false);
    }

    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [loadData, initialData]);

  // Browser Geolocation Watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCourierLocation([lat, lng]);

        // Send to backend
        updateCourierLocation(lat, lng, courierId).catch(() => {});
      },
      (err) => {
        console.warn('Geolocation access warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [courierId]);

  // Take Order Handler
  const handleTakeOrder = async (orderId: number) => {
    setTakingOrderId(orderId);
    try {
      await takeOrder(orderId, courierId);
      await loadData(true);
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to take order:', err);
      alert('Buyurtmani qabul qilishda xatolik yuz berdi');
    } finally {
      setTakingOrderId(null);
    }
  };

  // Toggle Courier Shift (Online/Offline)
  const handleToggleShift = async () => {
    try {
      const res = await toggleCourierShift(courierId);
      if (data) {
        setData({
          ...data,
          courier: {
            ...data.courier,
            is_active: res.is_active,
          },
        });
      }
    } catch (err) {
      console.error('Failed to toggle shift:', err);
    }
  };

  // Create Demo Order Handler
  const handleCreateDemoOrder = async () => {
    try {
      const lat = courierLocation ? courierLocation[0] : null;
      const lng = courierLocation ? courierLocation[1] : null;
      await createDemoOrder(lat, lng, courierId);
      await loadData(true);
      setActiveTab('ready');
    } catch (err) {
      console.error('Failed to create demo order:', err);
    }
  };

  // Switch Language
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      document.cookie = `django_language=${newLang}; path=/; max-age=31536000;`;
      document.cookie = `storebox_lang=${newLang}; path=/; max-age=31536000;`;
    } catch {
      // ignore
    }
  };

  // Orders lists
  const deliveringOrders = data?.delivering_orders || [];
  const pendingOrders = data?.pending_orders || [];
  const completedOrders = data?.completed_orders || [];
  const courierProfile = data?.courier || {
    id: null,
    name: 'Kuryer',
    phone: '',
    rating: 4.98,
    completed_count: 0,
    total_earned: 0,
    is_active: true,
    store_name: 'StoreBox',
    vehicle: 'car',
    current_lat: null,
    current_lng: null,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-neutral-100 flex flex-col font-sans pb-16">
      {/* 1. TOP HEADER (Yandex Pro Minimalist Aesthetic) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#121215]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 px-4 py-2.5 transition-colors">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Courier Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {courierProfile.name}
                </h1>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                  {courierProfile.store_name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">
                {t.courier_portal}
              </p>
            </div>
          </div>

          {/* Right Controls: Shift Switch, Lang, Refresh */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Shift Status Button */}
            <button
              onClick={handleToggleShift}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                courierProfile.is_active
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border border-slate-200/60 dark:border-neutral-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  courierProfile.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {courierProfile.is_active ? t.on_shift : t.off_shift}
              </span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-xl p-0.5 text-[11px] font-semibold border border-slate-200/60 dark:border-neutral-700">
              {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLanguageChange(l)}
                  className={`px-2 py-1 rounded-lg uppercase transition-colors ${
                    lang === l
                      ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors active:scale-95"
              title={t.refresh}
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. STATS & QUICK ACTIONS ROW */}
      <section className="max-w-2xl mx-auto w-full px-4 pt-3 space-y-3">
        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Deliveries Count */}
          <div className="bg-white dark:bg-[#141417] border border-slate-200/70 dark:border-neutral-800 rounded-2xl p-2.5 shadow-xs flex flex-col">
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
              {t.today_orders}
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {courierProfile.completed_count}
            </span>
          </div>

          {/* Total Earnings */}
          <div className="bg-white dark:bg-[#141417] border border-slate-200/70 dark:border-neutral-800 rounded-2xl p-2.5 shadow-xs flex flex-col">
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
              {t.earnings}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {formatMoney(courierProfile.total_earned)}
            </span>
          </div>

          {/* Rating */}
          <div className="bg-white dark:bg-[#141417] border border-slate-200/70 dark:border-neutral-800 rounded-2xl p-2.5 shadow-xs flex flex-col">
            <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
              {t.rating}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {courierProfile.rating.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Demo Order Helper Button (Instant verification) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleCreateDemoOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-neutral-800/80 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.add_test_order}</span>
          </button>
        </div>
      </section>

      {/* 3. SEGMENTED TABS (Yandex Pro Minimalist Standard) */}
      <section className="max-w-2xl mx-auto w-full px-4 pt-3">
        <div className="bg-slate-200/70 dark:bg-neutral-800/60 p-1 rounded-2xl flex items-center gap-1">
          {/* Active Orders */}
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-neutral-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <span>{t.active_tab}</span>
            {deliveringOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                {deliveringOrders.length}
              </span>
            )}
          </button>

          {/* Ready to Pickup Orders */}
          <button
            onClick={() => setActiveTab('ready')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ready'
                ? 'bg-white dark:bg-neutral-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <span>{t.ready_tab}</span>
            {pendingOrders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingOrders.length}
              </span>
            )}
          </button>

          {/* History */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <span>{t.history_tab}</span>
            {completedOrders.length > 0 && (
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                ({completedOrders.length})
              </span>
            )}
          </button>
        </div>
      </section>

      {/* 4. ORDERS LIST AREA */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1 space-y-3">
        {loading && !data ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-7 h-7 border-2 border-slate-300 dark:border-neutral-700 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs">Yuklanmoqda...</span>
          </div>
        ) : (
          <>
            {/* TAB: ACTIVE ORDERS (IN_DELIVERY) */}
            {activeTab === 'active' && (
              deliveringOrders.length === 0 ? (
                <div className="bg-white dark:bg-[#141417] border border-slate-200/70 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-2 mt-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.no_active_orders}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 max-w-xs mx-auto">
                    {t.wait_new_orders}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveringOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      lang={lang}
                      onOpenNavigator={(ord) => setActiveNavOrder(ord)}
                    />
                  ))}
                </div>
              )
            )}

            {/* TAB: READY ORDERS (READY TO TAKE) */}
            {activeTab === 'ready' && (
              pendingOrders.length === 0 ? (
                <div className="bg-white dark:bg-[#141417] border border-slate-200/70 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-2 mt-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 mx-auto flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.no_ready_orders}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 max-w-xs mx-auto">
                    {t.wait_new_orders}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      lang={lang}
                      onTakeOrder={handleTakeOrder}
                      isTaking={takingOrderId === order.id}
                    />
                  ))}
                </div>
              )
            )}

            {/* TAB: COMPLETED ORDERS (HISTORY) */}
            {activeTab === 'history' && (
              completedOrders.length === 0 ? (
                <div className="bg-white dark:bg-[#141417] border border-slate-200/70 dark:border-neutral-800 rounded-3xl p-8 text-center space-y-2 mt-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.no_history}
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} lang={lang} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* 5. FULLSCREEN OFFICIAL YANDEX NAVIGATOR MODAL */}
      {activeNavOrder && (
        <YandexNavigatorModal
          order={activeNavOrder}
          courierId={courierId}
          courierInitialPos={courierLocation}
          lang={lang}
          onClose={() => setActiveNavOrder(null)}
          onOrderCompleted={(completedId) => {
            setActiveNavOrder(null);
            loadData(true);
            setActiveTab('history');
          }}
        />
      )}
    </div>
  );
};
export default CourierDashboardPage;
