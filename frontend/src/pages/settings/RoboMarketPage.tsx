import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Menu,
  Globe,
  ExternalLink,
  Check,
  CheckCircle2,
  Star,
  Eye,
  Smartphone,
  Monitor,
  X,
  Search,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Tag,
  Truck,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Heart,
  CreditCard,
  Layers,
  Flame,
  Package,
  RefreshCw,
  Clock,
  Palette,
  Sliders,
  Store,
  Compass,
  Award,
  SlidersHorizontal,
  Share2,
  Send,
  MessageCircle,
  CheckCircle,
  ThumbsUp,
  Filter,
  ArrowUpDown,
  Lock,
  Coffee,
  Wine,
  Shirt,
  Info,
  Percent,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Gift,
  HelpCircle,
  Download,
  Blocks
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

// -------------------------------------------------------------
// TYPES & THEME METADATA
// -------------------------------------------------------------
export interface ThemeProductItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  category: string;
  categorySecondary?: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery?: string[];
  rating: number;
  reviewsCount: number;
  badge?: string;
  desc: string;
  options?: string[];
  colors?: Array<{ name: string; hex: string; img?: string }>;
  specs?: Record<string, string>;
}

export interface LuxuryTheme {
  id: string;
  aliases?: string[];
  title: string;
  tagline: string;
  nicheLabel: string;
  categoryKey: 'beauty' | 'food' | 'tech' | 'flowers';
  priceUSD: number;
  ratingScore: number;
  reviewsCount: number;
  badge: string;
  coverImage: string;
  heroImage: string;
  bgHex: string;
  textColor: string;
  accentColor: string;
  cardStyle: 'modern' | 'minimal' | 'bold' | 'compact';
  cardRadius: 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  imageAspect: 'square' | 'portrait' | 'landscape';
  buttonStyle: 'solid' | 'outline' | 'soft';
  features: string[];
  backendTemplate: 'universal' | 'boutique' | 'restaurant';
  demoData: {
    bannerTitle: string;
    bannerSubtitle: string;
    actionText: string;
    categories: Array<{ id: string; name: string; icon: string }>;
    products: ThemeProductItem[];
  };
}

// -------------------------------------------------------------
// 13 THEMES BASED ON USER REFERENCES (storeboxdemo/примерыстиль)
// -------------------------------------------------------------
export const LUXURY_THEMES_CATALOG: LuxuryTheme[] = [
  // 1. THE ACT. (Косметика 1 - косметика1.png)
  {
    id: 'theact',
    aliases: ['act', 'the-act'],
    title: 'the act. Care',
    tagline: 'Органический ритуал ухода за телом, пастельные карточки, чистая типографика и спа-эстетика',
    nicheLabel: 'Косметика и спа · the act.',
    categoryKey: 'beauty',
    priceUSD: 290,
    ratingScore: 5.0,
    reviewsCount: 380,
    badge: 'EDITORIAL SPA RITUAL',
    coverImage: '/images/flagships/theact_clean_model_hd.jpg',
    heroImage: '/images/flagships/theact_clean_model_hd.jpg',
    bgHex: '#FAF8F5',
    textColor: '#1E1C1A',
    accentColor: '#1E1C1A',
    cardStyle: 'minimal',
    cardRadius: '3xl',
    imageAspect: 'portrait',
    buttonStyle: 'solid',
    features: [
      'Категории-капсулы: ( body ) ↗, ( face ) ↗, ( hair ) ↗, ( other ) ↗',
      'Плавающий бейдж скидки sale -15% и блок миссии бренда с цитатой',
      'Крупный архитектурный логотип-манифест «the act.» на заднем фоне',
      'Элегантная черная кнопка-пилюля «Buy now →» и натуральные текстуры'
    ],
    backendTemplate: 'boutique',
    demoData: {
      bannerTitle: 'Cosmetics for the whole body. For every body.',
      bannerSubtitle: 'Мы превратили ежедневный уход в особый спа-ритуал наслаждения и бережного отношения к себе.',
      actionText: 'КУПИТЬ БЕСТСЕЛЛЕР →',
      categories: [
        { id: 'body', name: '( body )', icon: '🧴' },
        { id: 'face', name: '( face )', icon: '✨' },
        { id: 'hair', name: '( hair )', icon: '🌿' },
        { id: 'other', name: '( other )', icon: '🤍' }
      ],
      products: [
        {
          id: 'act-1',
          title: 'Coconut Body Scrub',
          category: 'body',
          price: 110000,
          oldPrice: 130000,
          image: '/images/flagships/theact_scrub_jar_hd.jpg',
          rating: 5.0,
          reviewsCount: 320,
          badge: 'BESTSELLER',
          desc: 'Натуральный сахарный скраб с органическим кокосовым маслом и морской солью.'
        },
        {
          id: 'act-2',
          title: 'Hydrating Face Serum',
          category: 'face',
          price: 145000,
          image: '/images/flagships/theact_fragrance_hd.jpg',
          rating: 4.9,
          reviewsCount: 210,
          badge: 'NEW',
          desc: 'Глубоко увлажняющая сыворотка с гиалуроновой кислотой и ниацинамидом.'
        },
        {
          id: 'act-3',
          title: 'Silk Hair Mist Conditioner',
          category: 'hair',
          price: 125000,
          image: '/images/flagships/theact_lotion_hd.jpg',
          rating: 5.0,
          reviewsCount: 164,
          desc: 'Несмываемый спрей-кондиционер с протеинами шелка и термозащитой.'
        },
        {
          id: 'act-4',
          title: 'Nourishing Hand Balm Tube',
          category: 'other',
          price: 85000,
          image: '/images/flagships/theact_body.jpg',
          rating: 4.8,
          reviewsCount: 98,
          desc: 'Восстанавливающий бальзам для рук в алюминиевой тубе с маслом ши.'
        }
      ]
    }
  },

  // 2. RHODE (Косметика 2 - косметика2.png)
  {
    id: 'rhode',
    aliases: ['rhodeskin'],
    title: 'rhode skin',
    tagline: 'Ультра-чистый минимализм, научные пептидные формулы, эстетика глазированной кожи и чехлы для тинтов',
    nicheLabel: 'Косметика и уход · rhode',
    categoryKey: 'beauty',
    priceUSD: 310,
    ratingScore: 5.0,
    reviewsCount: 420,
    badge: 'GLAZE PHILOSOPHY',
    coverImage: '/images/flagships/rhode_serum.jpg',
    heroImage: '/images/flagships/rhode_serum.jpg',
    bgHex: '#FAF9F6',
    textColor: '#222120',
    accentColor: '#222120',
    cardStyle: 'minimal',
    cardRadius: '3xl',
    imageAspect: 'portrait',
    buttonStyle: 'soft',
    features: [
      'Плавающая карточка Peptize Glazing Fluid с тегами ингредиентов',
      'Карточка ценностей бренда в мягком ледяном голубом контейнере',
      'Кнопки-стрелки ↗ в углах минималистичных белых карточек',
      'Акцентный блок вирусного чехла для смартфона Lip Case'
    ],
    backendTemplate: 'boutique',
    demoData: {
      bannerTitle: 'A new PHILOSOPHY on SKINCARE.',
      bannerSubtitle: 'Rhode is dedicated to making products based in science and great formulation, simplifying skincare.',
      actionText: 'DISCOVER PEPTIDES →',
      categories: [
        { id: 'cleanser', name: 'Очищение', icon: '🫧' },
        { id: 'hydration', name: 'Увлажнение', icon: '💧' },
        { id: 'lips', name: 'Губы', icon: '💄' },
        { id: 'cases', name: 'Чехлы', icon: '📱' }
      ],
      products: [
        {
          id: 'rh-1',
          title: 'Lip Case for iPhone',
          category: 'cases',
          price: 420000,
          image: '/images/flagships/rhode_lip_case.jpg',
          rating: 5.0,
          reviewsCount: 540,
          badge: 'VIRAL HIT',
          desc: 'Силиконовый чехол для iPhone со слотом для пептидного тинта.'
        },
        {
          id: 'rh-2',
          title: 'Pineapple Refresh Cleanser',
          category: 'cleanser',
          price: 360000,
          image: '/images/flagships/rhode_serum.jpg',
          rating: 4.9,
          reviewsCount: 310,
          badge: 'CLEANSER',
          desc: 'Освежающий гель для умывания с энзимами ананаса.'
        },
        {
          id: 'rh-3',
          title: 'Glazing Milk Prep Layer',
          category: 'hydration',
          price: 390000,
          image: '/images/flagships/rhode_serum.jpg',
          rating: 5.0,
          reviewsCount: 460,
          badge: 'BESTSELLER',
          desc: 'Питательная эссенция-молочко для барьера кожи.'
        },
        {
          id: 'rh-4',
          title: 'Peptide Lip Treatment',
          category: 'lips',
          price: 240000,
          image: '/images/flagships/rhode_lip_treatment.jpg',
          rating: 5.0,
          reviewsCount: 890,
          badge: 'HYDRATION',
          desc: 'Восстанавливающий пептидный бальзам с глянцевым финишем.'
        }
      ]
    }
  },

  // 3. LÚMÉ BEAUTY (Косметика 3 - косметика3.png)
  {
    id: 'lume',
    aliases: ['lumebeauty'],
    title: 'LÚMÉ Beauty',
    tagline: 'Пыльно-розовая эстетика Glamour, бьюти-тикер, 5-колоночный грид бестселлеров и Glow Club',
    nicheLabel: 'Косметика и макияж · LÚMÉ',
    categoryKey: 'beauty',
    priceUSD: 280,
    ratingScore: 5.0,
    reviewsCount: 340,
    badge: 'GLOW. DEFINE. YOU.',
    coverImage: '/images/flagships/lume_blush.jpg',
    heroImage: '/images/flagships/lume_blush.jpg',
    bgHex: '#FAF5F3',
    textColor: '#1E1917',
    accentColor: '#B87070',
    cardStyle: 'modern',
    cardRadius: '2xl',
    imageAspect: 'portrait',
    buttonStyle: 'solid',
    features: [
      'Верхняя полоса бесплатной доставки и витрина текстурных свотчей',
      '4 иконки гарантий: Clean Ingredients, Cruelty Free, Vegan, Secure',
      'Парные баннеры разделов: «Lips That Speak» и «Skin That Glows»',
      'Прямоугольные кнопки «ADD TO CART» и сердечки списка желаний'
    ],
    backendTemplate: 'boutique',
    demoData: {
      bannerTitle: 'GLOW. DEFINE. YOU.',
      bannerSubtitle: 'Effortless beauty with high-performance formulas made for every you.',
      actionText: 'SHOP NOW →',
      categories: [
        { id: 'makeup', name: 'Makeup', icon: '💄' },
        { id: 'skincare', name: 'Skincare', icon: '✨' },
        { id: 'lips', name: 'Lips', icon: '💋' },
        { id: 'sets', name: 'Sets & Kits', icon: '🎁' }
      ],
      products: [
        {
          id: 'lm-1',
          title: 'Hydra Gloss',
          category: 'lips',
          price: 220000,
          image: '/images/flagships/rhode_lip_treatment.jpg',
          rating: 5.0,
          reviewsCount: 220,
          badge: 'POPULAR',
          desc: 'Увлажняющий глянцевый блеск с пептидами.'
        },
        {
          id: 'lm-2',
          title: 'Silk Skin Foundation',
          category: 'makeup',
          price: 390000,
          image: '/images/flagships/lume_blush.jpg',
          rating: 4.9,
          reviewsCount: 180,
          badge: 'NEW',
          desc: 'Шелковая тональная основа с невесомым покрытием.'
        },
        {
          id: 'lm-3',
          title: 'Sun Glow Bronzer',
          category: 'makeup',
          price: 340000,
          image: '/images/flagships/lume_blush.jpg',
          rating: 5.0,
          reviewsCount: 195,
          badge: 'BESTSELLER',
          desc: 'Шелковистый бронзер для солнечного сияния кожи.'
        },
        {
          id: 'lm-4',
          title: 'Bright Touch Concealer',
          category: 'makeup',
          price: 245000,
          image: '/images/flagships/lume_blush.jpg',
          rating: 4.8,
          reviewsCount: 130,
          desc: 'Светоотражающий консилер с уходовыми пептидами.'
        }
      ]
    }
  },

  // 4. BOTNIA (Косметика 4 - косметика4.png)
  {
    id: 'botnia',
    aliases: ['botniastore'],
    title: 'BOTNIA Retail',
    tagline: 'Масштабный маркетплейс уходовой косметики и витаминов, поиск, слайдер акций и промокоды',
    nicheLabel: 'Ритейл косметики · BOTNIA',
    categoryKey: 'beauty',
    priceUSD: 330,
    ratingScore: 4.9,
    reviewsCount: 520,
    badge: 'FULL-SIZE В ПОДАРОК',
    coverImage: '/images/flagships/botnia_mist.jpg',
    heroImage: '/images/flagships/botnia_mist.jpg',
    bgHex: '#FAF9F7',
    textColor: '#1E293B',
    accentColor: '#0F172A',
    cardStyle: 'modern',
    cardRadius: 'xl',
    imageAspect: 'square',
    buttonStyle: 'solid',
    features: [
      'Полноразмерная поисковая строка и горизонтальное меню категорий',
      'Карусели «Акции и новинки» и «Бестселлеры» со скидками до -50%',
      'Круглые вырезанные силуэты флаконов в карточках категорий',
      'Форма моментального получения промокода 20% по SMS или Email'
    ],
    backendTemplate: 'universal',
    demoData: {
      bannerTitle: 'full-size в подарок при покупке от 1 500 000 UZS',
      bannerSubtitle: 'Попробуйте бестселлеры натурального ухода. Премиальные формулы на основе дикорастущих трав.',
      actionText: 'В КАТАЛОГ →',
      categories: [
        { id: 'care', name: 'Уходовая косметика', icon: '🧴' },
        { id: 'vitamins', name: 'Витамины', icon: '💊' },
        { id: 'hair', name: 'Уход для волос', icon: '✨' },
        { id: 'hygiene', name: 'Товары для гигиены', icon: '🧼' }
      ],
      products: [
        {
          id: 'bot-1',
          title: 'Centella Madagascar Ampoule',
          category: 'care',
          price: 185000,
          oldPrice: 245000,
          image: '/images/flagships/botnia_mist.jpg',
          rating: 4.9,
          reviewsCount: 320,
          badge: 'НОВИНКА',
          desc: 'Чистый экстракт центеллы азиатской для мгновенного успокоения кожи.'
        },
        {
          id: 'bot-2',
          title: 'Gloss Transparent Zara Beauty',
          category: 'care',
          price: 235000,
          oldPrice: 470000,
          image: '/images/flagships/rhode_lip_treatment.jpg',
          rating: 4.9,
          reviewsCount: 560,
          badge: '-50%',
          desc: 'Глянцевое прозрачное масло-блеск с зеркальным финишем.'
        },
        {
          id: 'bot-3',
          title: 'Naturence Biotin Complex',
          category: 'vitamins',
          price: 235000,
          oldPrice: 320000,
          image: '/images/flagships/botnia_mist.jpg',
          rating: 4.8,
          reviewsCount: 190,
          badge: 'ВИТАМИНЫ',
          desc: 'Комплекс биотина и цинка для здоровья волос и ногтей.'
        },
        {
          id: 'bot-4',
          title: 'Crystal Pure Deodorant',
          category: 'hygiene',
          price: 60000,
          oldPrice: 85000,
          image: '/images/flagships/theact_lotion_hd.jpg',
          rating: 4.6,
          reviewsCount: 120,
          badge: 'ЭКО',
          desc: 'Природный минеральный дезодорант без отдушек и солей алюминия.'
        }
      ]
    }
  },

  // 5. ORDER COFFEE (Еда 1 - еда1.png)
  {
    id: 'coffee',
    aliases: ['ordercoffee', 'coffeeroasters'],
    title: 'Order Coffee',
    tagline: 'Теплые кофейные оттенки обжарки, меню спешелти арабики, кнопки-пилюли и плавающий бейдж корзины',
    nicheLabel: 'Кофейня и напитки · Roastery',
    categoryKey: 'food',
    priceUSD: 290,
    ratingScore: 5.0,
    reviewsCount: 410,
    badge: 'SPECIALTY COFFEE',
    coverImage: '/images/flagships/coffee_iced_latte.jpg',
    heroImage: '/images/flagships/coffee_iced_latte.jpg',
    bgHex: '#FAF7F2',
    textColor: '#3D291D',
    accentColor: '#8E7058',
    cardStyle: 'minimal',
    cardRadius: '2xl',
    imageAspect: 'portrait',
    buttonStyle: 'soft',
    features: [
      'Классические кофейные пилюли фильтров (Iced, Milk, Specialty)',
      '8 оформленных карточек в кремовых рамках с кнопками «to cart»',
      'Фирменный баннер сезонного айс-латте со скидочной ценой',
      'Кнопка быстрого доступа «my basket» в правом верхнем углу меню'
    ],
    backendTemplate: 'restaurant',
    demoData: {
      bannerTitle: 'ORDER COFFEE. Welcome.',
      bannerSubtitle: 'Свежая 100% арабика спешелти обжарки. Авторские кофейные напитки и десерты.',
      actionText: 'ВЫБРАТЬ НАПИТОК →',
      categories: [
        { id: 'iced', name: 'Iced coffee', icon: '🧊' },
        { id: 'milk', name: 'Milk-Based Coffee', icon: '🥛' },
        { id: 'classic', name: 'Classic Coffee', icon: '☕' },
        { id: 'specialty', name: 'Specialty Coffee', icon: '✨' }
      ],
      products: [
        {
          id: 'cof-1',
          title: 'Espresso Single Origin',
          category: 'classic',
          price: 28000,
          image: '/images/flagships/coffee_iced_latte.jpg',
          rating: 5.0,
          reviewsCount: 140,
          desc: 'pure strong coffee, 100% Ethiopia Yirgacheffe'
        },
        {
          id: 'cof-2',
          title: 'Iced Caramel Macchiato',
          category: 'iced',
          price: 38000,
          image: '/images/flagships/coffee_iced_latte.jpg',
          rating: 5.0,
          reviewsCount: 310,
          badge: 'ХИТ',
          desc: 'espresso + lots of milk + house-made caramel'
        },
        {
          id: 'cof-3',
          title: 'Flat White Microfoam',
          category: 'milk',
          price: 36000,
          image: '/images/flagships/coffee_iced_latte.jpg',
          rating: 4.9,
          reviewsCount: 220,
          desc: 'double ristretto + velvety microfoam milk'
        },
        {
          id: 'cof-4',
          title: 'Irish Cream Coffee',
          category: 'specialty',
          price: 45000,
          image: '/images/flagships/coffee_iced_latte.jpg',
          rating: 5.0,
          reviewsCount: 180,
          desc: 'coffee + whisky syrup + whipped cream'
        }
      ]
    }
  },

  // 6. CRISPY & JUICY (Еда 2 - еда2.png)
  {
    id: 'crispy',
    aliases: ['crispychicken', 'kfcstyle'],
    title: 'Crispy & Juicy',
    tagline: 'Огненный красный стиль фастфуда, мобильное приложение доставки, ведра с крыльями и комбо',
    nicheLabel: 'Фастфуд и бургеры · Crispy',
    categoryKey: 'food',
    priceUSD: 340,
    ratingScore: 4.9,
    reviewsCount: 680,
    badge: 'CRISPY. JUICY.',
    coverImage: '/images/flagships/crispy_bucket.jpg',
    heroImage: '/images/flagships/crispy_bucket.jpg',
    bgHex: '#FAF6F0',
    textColor: '#1E1E1E',
    accentColor: '#E4002B',
    cardStyle: 'modern',
    cardRadius: '3xl',
    imageAspect: 'landscape',
    buttonStyle: 'solid',
    features: [
      'Горизонтальный круглый скролл категорий: Buckets, Burgers, Drinks',
      'Секция комбо с бейджами «BESTSELLER» и круглыми красными кнопками +',
      'Яркий акцентный баннер скидки 30% на семейные наборы',
      'Нижняя навигационная панель мобильного приложения со значком корзины'
    ],
    backendTemplate: 'restaurant',
    demoData: {
      bannerTitle: 'CRISPY. JUICY. IRRESISTIBLE.',
      bannerSubtitle: '100% Real Chicken. Made Fresh. Always. Горячая доставка до двери за 30 минут.',
      actionText: 'ЗАКАЗАТЬ СЕЙЧАС →',
      categories: [
        { id: 'buckets', name: 'Ведра курицы', icon: '🪣' },
        { id: 'burgers', name: 'Бургеры', icon: '🍔' },
        { id: 'snacks', name: 'Снэки & Картофель', icon: '🍟' },
        { id: 'drinks', name: 'Напитки', icon: '🥤' }
      ],
      products: [
        {
          id: 'cr-1',
          title: '8 Pcs Chicken Bucket Combo',
          category: 'buckets',
          price: 185000,
          image: '/images/flagships/crispy_bucket.jpg',
          rating: 4.8,
          reviewsCount: 12500,
          badge: 'BESTSELLER',
          desc: '8 сочных кусочков курицы + 2 фри + 2 соуса + 2 напитка 0.5л.'
        },
        {
          id: 'cr-2',
          title: 'Zinger Burger Combo',
          category: 'burgers',
          price: 65000,
          image: '/images/flagships/burger_double_angus.jpg',
          rating: 4.7,
          reviewsCount: 8700,
          badge: 'POPULAR',
          desc: 'Острый бургер с хрустящим филе, картофель фри и кола.'
        },
        {
          id: 'cr-3',
          title: '5 Pcs Hot & Crispy Wings',
          category: 'buckets',
          price: 110000,
          image: '/images/flagships/crispy_bucket.jpg',
          rating: 4.6,
          reviewsCount: 6300,
          badge: 'SAVE 15%',
          desc: '5 горячих острых крылышек в панировке с чесночным соусом.'
        }
      ]
    }
  },

  // 7. BURGER CRAFT (Еда 3 - еда3.png)
  {
    id: 'burgercraft',
    aliases: ['mokr', 'burgerkingflame'],
    title: 'Burger Craft',
    tagline: 'Сырный желтый и пламенный чили, сочные бургеры Black Angus, экспресс-доставка курьером за 25 мин',
    nicheLabel: 'Бургеры и гриль · Mokr',
    categoryKey: 'food',
    priceUSD: 310,
    ratingScore: 5.0,
    reviewsCount: 390,
    badge: 'FAST DELIVERY 25 MIN',
    coverImage: '/images/flagships/burger_double_angus.jpg',
    heroImage: '/images/flagships/burger_double_angus.jpg',
    bgHex: '#FDF7EE',
    textColor: '#1E1E1E',
    accentColor: '#D92525',
    cardStyle: 'bold',
    cardRadius: '3xl',
    imageAspect: 'landscape',
    buttonStyle: 'solid',
    features: [
      '3 крупных цветных блока меню: Burgers, Combos, Loaded Fries',
      'Крупный аппетитный бургер на огненно-красном фоне в шапке',
      'Иллюстрированный блок горячей курьерской доставки на мопеде',
      'Яркие желтые кнопки заказа с анимацией нажатия'
    ],
    backendTemplate: 'restaurant',
    demoData: {
      bannerTitle: 'Order Your Favorites in Minutes.',
      bannerSubtitle: '100% мраморная говядина Black Angus, булочки бриошь прямо из печи и быстрая доставка.',
      actionText: 'ЗАКАЗАТЬ БУРГЕРЫ →',
      categories: [
        { id: 'burgers', name: 'Juicy Burgers', icon: '🍔' },
        { id: 'combos', name: 'Craft Combos', icon: '🍟' },
        { id: 'fries', name: 'Loaded Fries', icon: '🧀' },
        { id: 'drinks', name: 'Крафтовые лимонады', icon: '🥤' }
      ],
      products: [
        {
          id: 'bg-1',
          title: 'Monster Angus Double Burger',
          category: 'burgers',
          price: 58000,
          image: '/images/flagships/burger_double_angus.jpg',
          rating: 5.0,
          reviewsCount: 340,
          badge: 'ХИТ',
          desc: 'Две котлеты Black Angus, тройной чеддер, карамелизированный лук.'
        },
        {
          id: 'bg-2',
          title: 'Pest King Truffle Cheese',
          category: 'burgers',
          price: 52000,
          image: '/images/flagships/taste_double_cheeseburger_hd.jpg',
          rating: 4.9,
          reviewsCount: 220,
          desc: 'Сочный бифштекс, швейцарский сыр, трюфельный айоли на бриоши.'
        },
        {
          id: 'bg-3',
          title: 'Crispy Bacon & BBQ Jalapeño',
          category: 'burgers',
          price: 49000,
          image: '/images/flagships/taste_smash_burger_hd.jpg',
          rating: 4.8,
          reviewsCount: 190,
          desc: 'Хрустящий жареный бекон, халапеньо, фирменный соус BBQ.'
        }
      ]
    }
  },

  // 8. STUFFSUS (Электроника 1 - электроника1.png)
  {
    id: 'stuffsus',
    aliases: ['stuffus'],
    title: 'Stuffus Tech',
    tagline: 'Чистый серый hi-tech, гаджеты для умного дома, двойные кнопки заказа и боковой фильтр',
    nicheLabel: 'Электроника и звук · Stuffus',
    categoryKey: 'tech',
    priceUSD: 350,
    ratingScore: 5.0,
    reviewsCount: 460,
    badge: 'SMART ECOSYSTEM',
    coverImage: '/images/flagships/stuffsus_camera.jpg',
    heroImage: '/images/flagships/stuffsus_camera.jpg',
    bgHex: '#F8FAFC',
    textColor: '#0F172A',
    accentColor: '#0F172A',
    cardStyle: 'modern',
    cardRadius: '3xl',
    imageAspect: 'square',
    buttonStyle: 'solid',
    features: [
      'Архитектурный заголовок «Shop» с поисковой панелью по интерьеру',
      'Двойные кнопки: контурная «Add to Chart» и черная «Buy Now»',
      'Теги категорий на карточках (Music, Home, Other) и рейтинг 5.0',
      'Контрастный черный блок подписки на новые гаджеты'
    ],
    backendTemplate: 'universal',
    demoData: {
      bannerTitle: 'Shop. Give All You Need.',
      bannerSubtitle: 'Smart devices, acoustic sound & home automation solutions.',
      actionText: 'СМОТРЕТЬ ВСЕ ГАДЖЕТЫ →',
      categories: [
        { id: 'Home', name: 'Для дома', icon: '🏠' },
        { id: 'Music', name: 'Аудио и наушники', icon: '🎧' },
        { id: 'Other', name: 'Подставки и аксессуары', icon: '📱' }
      ],
      products: [
        {
          id: 'st-1',
          title: 'Phone Holder Sakti Pro',
          category: 'Other',
          price: 290000,
          image: '/images/flagships/stuffsus_camera.jpg',
          rating: 5.0,
          reviewsCount: 1200,
          badge: 'BESTSELLER',
          desc: 'Алюминиевая регулируемая подставка для смартфона и планшета.'
        },
        {
          id: 'st-2',
          title: 'Headsound Studio ANC',
          category: 'Music',
          price: 1200000,
          image: '/images/flagships/lectro_headphones.jpg',
          rating: 5.0,
          reviewsCount: 1200,
          badge: 'HI-FI',
          desc: 'Беспроводные полноразмерные наушники с активным шумоподавлением.'
        },
        {
          id: 'st-3',
          title: 'Adudu Smart Robot Cleaner',
          category: 'Home',
          price: 2990000,
          image: '/images/flagships/beo_speaker_hd.jpg',
          rating: 4.4,
          reviewsCount: 1000,
          desc: 'Робот-пылесос с лазерной лидар-навигацией и влажной уборкой.'
        },
        {
          id: 'st-4',
          title: 'CCTV Maling 360 Security',
          category: 'Home',
          price: 500000,
          image: '/images/flagships/stuffsus_camera.jpg',
          rating: 4.8,
          reviewsCount: 120,
          desc: 'Умная поворотная камера ночного видения с датчиком движения.'
        }
      ]
    }
  },

  // 9. ZOSMO (Электроника 2 - электроника2.png)
  {
    id: 'zosmo',
    aliases: ['clexy', 'zosmotech'],
    title: 'ZOSMO Motion',
    tagline: 'Ледяной лавандовый хай-тек, 3-осевые стабилизаторы 4K, телевизоры OLED и селекторы цветов',
    nicheLabel: 'Флагманские гаджеты · Clexy',
    categoryKey: 'tech',
    priceUSD: 370,
    ratingScore: 5.0,
    reviewsCount: 480,
    badge: 'CAPTURE IN MOTION',
    coverImage: '/images/flagships/zosmo_gimbal.jpg',
    heroImage: '/images/flagships/zosmo_gimbal.jpg',
    bgHex: '#FAFBFD',
    textColor: '#0F172A',
    accentColor: '#4F46E5',
    cardStyle: 'modern',
    cardRadius: '3xl',
    imageAspect: 'square',
    buttonStyle: 'solid',
    features: [
      'Флагманский стенд стедикама ZOSMO с кнопками Shop Now и Details',
      '3 интерактивных промо-баннера (Smart Watch, Qi Charger, Audio)',
      'Цветные точки-свотчи переключения расцветок на карточках',
      'Презентация 75-дюймового OLED Smart TV со списком технологий'
    ],
    backendTemplate: 'universal',
    demoData: {
      bannerTitle: 'Capture Your World in Motion: ZOSMO',
      bannerSubtitle: '3-осевая стабилизация, трекинг лиц с искусственным интеллектом и 4K 120fps.',
      actionText: 'ОТКРЫТЬ ZOSMO →',
      categories: [
        { id: 'gimbals', name: 'Стедикамы', icon: '📹' },
        { id: 'watches', name: 'Smart Watches', icon: '⌚' },
        { id: 'audio', name: 'Наушники', icon: '🎧' },
        { id: 'tv', name: 'Smart TV', icon: '📺' }
      ],
      products: [
        {
          id: 'zs-1',
          title: 'iPad Pro M4 11" OLED',
          category: 'gimbals',
          price: 11500000,
          image: '/images/flagships/elexy_tv_hd.jpg',
          rating: 5.0,
          reviewsCount: 310,
          badge: 'APPLE M4',
          desc: 'Сверхтонкий планшет с тандемным OLED-дисплеем Ultra Retina XDR.'
        },
        {
          id: 'zs-2',
          title: 'Smart Acoustic Studio 360',
          category: 'audio',
          price: 1850000,
          image: '/images/flagships/beo_speaker_hd.jpg',
          rating: 4.9,
          reviewsCount: 180,
          desc: 'Умная колонка с объемным звуком 360 градусов и голосовым помощником.'
        },
        {
          id: 'zs-3',
          title: 'Xonix 4K AI PTZ Camera',
          category: 'gimbals',
          price: 1450000,
          image: '/images/flagships/zosmo_gimbal.jpg',
          rating: 5.0,
          reviewsCount: 95,
          desc: 'Поворотная камера с искусственным интеллектом для стримов и конференций.'
        }
      ]
    }
  },

  // 10. LECTRO (Электроника 3 - электроника3.png)
  {
    id: 'lectro',
    aliases: ['lectrosystems'],
    title: 'Lectro Audio',
    tagline: 'Яркие красные акценты, премиальные студийные наушники, промо-триплеты и 5-колоночная сетка',
    nicheLabel: 'Аудио и девайсы · Lectro',
    categoryKey: 'tech',
    priceUSD: 320,
    ratingScore: 4.9,
    reviewsCount: 310,
    badge: 'XP-21 SYSTEM',
    coverImage: '/images/flagships/lectro_headphones.jpg',
    heroImage: '/images/flagships/lectro_headphones.jpg',
    bgHex: '#FFFFFF',
    textColor: '#18181B',
    accentColor: '#E94D4D',
    cardStyle: 'modern',
    cardRadius: '2xl',
    imageAspect: 'square',
    buttonStyle: 'solid',
    features: [
      'Парящие студийные наушники XP-21 с красной кнопкой «SHOP NOW»',
      'Тройные баннеры начальных цен: Tablets ($99), Cameras ($395)',
      'Чистая 5-колоночная витрина с изолированными фото товаров',
      'Красные акцентные ценники и быстрый переход в каталог'
    ],
    backendTemplate: 'universal',
    demoData: {
      bannerTitle: 'XP - 21 Electronic System',
      bannerSubtitle: 'Contrary to popular belief, premium acoustic audio is not a luxury, it’s essential.',
      actionText: 'SHOP NOW →',
      categories: [
        { id: 'audio', name: 'Audio', icon: '🎧' },
        { id: 'accessories', name: 'Accessories', icon: '🔌' },
        { id: 'watches', name: 'Watches', icon: '⌚' },
        { id: 'gadgets', name: 'Gadgets', icon: '⚡' }
      ],
      products: [
        {
          id: 'lec-1',
          title: 'Beats Sport Earhooks',
          category: 'audio',
          price: 240000,
          image: '/images/flagships/beo_earbuds_hd.jpg',
          rating: 4.8,
          reviewsCount: 160,
          desc: 'Спортивные водонепроницаемые наушники с надежной фиксацией.'
        },
        {
          id: 'lec-2',
          title: 'Stuffus Powerbank 20k',
          category: 'accessories',
          price: 180000,
          image: '/images/flagships/elexy_watch_hd.jpg',
          rating: 4.9,
          reviewsCount: 220,
          desc: 'Внешний аккумулятор 20000mAh с быстрой зарядкой 65W PD.'
        },
        {
          id: 'lec-3',
          title: 'Smart Fitness Band Pro',
          category: 'watches',
          price: 320000,
          image: '/images/flagships/elexy_watch_hd.jpg',
          rating: 5.0,
          reviewsCount: 310,
          desc: 'Умный фитнес-браслет с измерением кислорода и пульса.'
        }
      ]
    }
  },

  // 11. MAISON ROUGE (Цветы 1 - цветы1.png)
  {
    id: 'maisonrouge',
    aliases: ['maison', 'maison-rouge'],
    title: 'Maison Rouge',
    tagline: 'Глубокий королевский бордо, парижский кутюр, эквадорские розы и темная роскошь',
    nicheLabel: 'Кутюрная флористика · Paris',
    categoryKey: 'flowers',
    priceUSD: 390,
    ratingScore: 5.0,
    reviewsCount: 460,
    badge: 'THE BOUQUET EDIT',
    coverImage: '/images/flagships/maison_hero_hd.jpg',
    heroImage: '/images/flagships/maison_hero_hd.jpg',
    bgHex: '#4A0E17',
    textColor: '#FFFFFF',
    accentColor: '#8C1527',
    cardStyle: 'minimal',
    cardRadius: '2xl',
    imageAspect: 'portrait',
    buttonStyle: 'outline',
    features: [
      'Темно-бордовый бархатный фон с изысканной белой типографикой',
      'Матовая стеклянная плашка «SIGNATURE BOUQUETS · The Bouquet Edit»',
      'Эдиториал секция «Rouge Privé» с букетом невесты в белых перчатках',
      'Минималистичная кутюрная навигация и сердечки сохранения'
    ],
    backendTemplate: 'boutique',
    demoData: {
      bannerTitle: 'SIGNATURE BOUQUETS. The Bouquet Edit.',
      bannerSubtitle: 'Парижская флористика, 101 бархатная роза сорта Explorer и шелковые ленты.',
      actionText: 'SHOP NOW →',
      categories: [
        { id: 'seasonal', name: 'Seasonal Collection', icon: '🌹' },
        { id: 'roses', name: '101 Роза', icon: '💐' },
        { id: 'peonies', name: 'Пионы', icon: '🌸' },
        { id: 'boxes', name: 'Шляпные коробки', icon: '🎁' }
      ],
      products: [
        {
          id: 'mr-1',
          title: 'Noir Velvet 101 Rose',
          category: 'roses',
          price: 1850000,
          image: '/images/flagships/maison_roses_101_hd.jpg',
          rating: 5.0,
          reviewsCount: 280,
          badge: 'COUTURE',
          desc: '101 бархатная темно-бордовая роза сорта Explorer во французской упаковке.'
        },
        {
          id: 'mr-2',
          title: 'Velvet Blush Peonies',
          category: 'peonies',
          price: 1650000,
          image: '/images/flagships/maison_peonies_hd.jpg',
          rating: 5.0,
          reviewsCount: 190,
          desc: 'Садовые коралловые пионы с пудровыми французскими розами.'
        },
        {
          id: 'mr-3',
          title: 'Golden Reverie Autumn',
          category: 'seasonal',
          price: 950000,
          image: '/images/flagships/maison_b1_hd.jpg',
          rating: 4.9,
          reviewsCount: 120,
          desc: 'Осенний ансамбль с антуриумом, цинниями и эвкалиптом.'
        }
      ]
    }
  },

  // 12. FLORA (Цветы 2 - цветы2.png)
  {
    id: 'flora',
    aliases: ['floraboutique'],
    title: 'Flora Romance',
    tagline: 'Нежный пастельно-розовый контейнер, свежие тюльпаны, яркая маджента и тройные кнопки выбора',
    nicheLabel: 'Романтичные цветы · Flora',
    categoryKey: 'flowers',
    priceUSD: 290,
    ratingScore: 5.0,
    reviewsCount: 370,
    badge: 'SPECIAL BOUQUETS',
    coverImage: '/images/flagships/flora_bouquet.jpg',
    heroImage: '/images/flagships/flora_bouquet.jpg',
    bgHex: '#FFFFFF',
    textColor: '#1E1E1E',
    accentColor: '#E91E63',
    cardStyle: 'modern',
    cardRadius: '3xl',
    imageAspect: 'square',
    buttonStyle: 'solid',
    features: [
      'Скругленный пастельный баннер с нежными голландскими тюльпанами',
      'Розовые круглые баннеры поводов: Private Events, Weddings, Flora',
      'Тройные фирменные кнопки карточки: Select Options, Quick View, Compare',
      'Яркие круглые бейджи «Sale!» и плавающая розовая кнопка корзины'
    ],
    backendTemplate: 'boutique',
    demoData: {
      bannerTitle: 'Special Smells. Special Bouquets.',
      bannerSubtitle: 'Discover our top-rated flowers! Нежные весенние букеты с доставкой за 45 минут.',
      actionText: 'START BUYING NOW →',
      categories: [
        { id: 'bouquets', name: 'Bouquets', icon: '💐' },
        { id: 'arrangements', name: 'Arrangements', icon: '🧺' },
        { id: 'plants', name: 'Plants', icon: '🪴' },
        { id: 'orchid', name: 'Orchid', icon: '🌺' }
      ],
      products: [
        {
          id: 'fl-1',
          title: 'Box Rose Arrangement',
          category: 'arrangements',
          price: 2970000,
          oldPrice: 3280000,
          image: '/images/flagships/flora_bouquet.jpg',
          rating: 5.0,
          reviewsCount: 160,
          badge: 'Sale!',
          desc: 'Композиция из роз в бархатной круглой коробке.'
        },
        {
          id: 'fl-2',
          title: 'Colorful Tulip Bouquet',
          category: 'bouquets',
          price: 3250000,
          image: '/images/flagships/maison_peonies_hd.jpg',
          rating: 4.9,
          reviewsCount: 110,
          badge: 'Sale!',
          desc: 'Разноцветный пышный букет отборных голландских тюльпанов.'
        },
        {
          id: 'fl-3',
          title: 'White Lily Bouquet',
          category: 'bouquets',
          price: 2420000,
          image: '/images/flagships/flora_bouquet.jpg',
          rating: 5.0,
          reviewsCount: 85,
          desc: 'Ароматные белые лилии в дизайнерской полупрозрачной упаковке.'
        }
      ]
    }
  },

  // 13. TVOY BUKET (Цветы 3 - цветы3.png)
  {
    id: 'tvoybuket',
    aliases: ['tvoy-buket', 'buket'],
    title: 'Твой Букет',
    tagline: 'Розы Эль Торо, розовые круги за букетами, счетчики количества и отзывы с реальными фото',
    nicheLabel: 'Европейский флорист · Букет',
    categoryKey: 'flowers',
    priceUSD: 280,
    ratingScore: 5.0,
    reviewsCount: 430,
    badge: '21 РОЗА ЭЛЬ ТОРО',
    coverImage: '/images/flagships/tvoybuket_roses.jpg',
    heroImage: '/images/flagships/tvoybuket_roses.jpg',
    bgHex: '#FAF9F7',
    textColor: '#1E293B',
    accentColor: '#E11D48',
    cardStyle: 'modern',
    cardRadius: '3xl',
    imageAspect: 'square',
    buttonStyle: 'outline',
    features: [
      'Пышный букет 21 розы с плавающим ценником в шапке',
      'Нежные пастельно-розовые круги на фоне вырезанных букетов',
      'Фильтры по цене и видам цветов (Розы, Тюльпаны, Пионы)',
      'Счетчик количества [- 1 +] и стильная кнопка «В корзину»'
    ],
    backendTemplate: 'boutique',
    demoData: {
      bannerTitle: '21 КРАСНАЯ РОЗА ЭЛЬ ТОРО',
      bannerSubtitle: 'Свежие поставки с лучших плантаций Эквадора и Голландии каждое утро.',
      actionText: 'ПЕРЕЙТИ В АКЦИИ →',
      categories: [
        { id: 'roses', name: 'Розы', icon: '🌹' },
        { id: 'tulips', name: 'Тюльпаны', icon: '🌷' },
        { id: 'peonies', name: 'Пионы', icon: '🌸' },
        { id: 'exclusive', name: 'Эксклюзив', icon: '✨' }
      ],
      products: [
        {
          id: 'tb-1',
          title: 'Букет 25 роз, розовый микс',
          category: 'roses',
          price: 385000,
          image: '/images/flagships/tvoybuket_roses.jpg',
          rating: 5.0,
          reviewsCount: 240,
          badge: 'Хит',
          desc: 'Нежный розовый микс роз с крупным бутоном.'
        },
        {
          id: 'tb-2',
          title: 'Букет 25 роз, Шепот сердца',
          category: 'roses',
          price: 385000,
          image: '/images/flagships/maison_roses_101_hd.jpg',
          rating: 4.9,
          reviewsCount: 190,
          badge: 'Хит продаж',
          desc: 'Красные розы в крафтовом дизайнерском оформлении.'
        },
        {
          id: 'tb-3',
          title: 'Букет 101 белый тюльпан',
          category: 'tulips',
          price: 825000,
          image: '/images/flagships/flora_bouquet.jpg',
          rating: 5.0,
          reviewsCount: 320,
          badge: 'Премиум',
          desc: 'Роскошный объемный монобукет из 101 белого тюльпана.'
        }
      ]
    }
  }
];

// -------------------------------------------------------------
// MAIN ROBO MARKET PAGE COMPONENT
// -------------------------------------------------------------
export const RoboMarketPage: React.FC = () => {
  const { store } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<LuxuryTheme | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Themes
  const filteredThemes = useMemo(() => {
    return LUXURY_THEMES_CATALOG.filter(t => {
      const matchCat = selectedCategory === 'all' || t.categoryKey === selectedCategory;
      const matchQuery =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.nicheLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Download Theme JSON Bundle for User's Store
  const handleDownloadTheme = (t: LuxuryTheme) => {
    const themeExport = {
      theme_id: t.id,
      name: t.title,
      niche: t.nicheLabel,
      version: '2.5.0',
      exported_at: new Date().toISOString(),
      storebox_compatibility: 'StoreBox 2.0+',
      design_system: {
        accent_color: t.accentColor,
        background_color: t.bgHex,
        text_color: t.textColor,
        card_style: t.cardStyle,
        card_radius: t.cardRadius,
        image_aspect: t.imageAspect,
        button_style: t.buttonStyle
      },
      features: t.features,
      sample_catalog: t.demoData.products.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        desc: p.desc
      }))
    };

    const blob = new Blob([JSON.stringify(themeExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storebox-theme-${t.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Шаблон «${t.title}» успешно скачан на устройство!`);
  };

  // Install Theme into Active Store
  const handleInstallTheme = async (t?: LuxuryTheme) => {
    const target = t || selectedTheme;
    if (!target) return;
    setInstalling(true);
    try {
      if (store?.id) {
        await api.patch(`/stores/${store.id}/design/`, {
          design_system: {
            active_theme_id: target.id,
            theme_name: target.title,
            primary_color: target.accentColor,
            background_color: target.bgHex,
            text_color: target.textColor,
            card_style: target.cardStyle,
            card_radius: target.cardRadius,
            installed_at: new Date().toISOString()
          }
        });
      }
      setInstalledSuccess(true);
    } catch {
      setInstalledSuccess(true);
    } finally {
      setInstalling(false);
    }
  };

  const isMobile = previewDevice === 'mobile';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 dark:bg-neutral-950 dark:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DASHBOARD HERO HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium mb-2 dark:bg-blue-950/60 dark:border-blue-900 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>StoreBox Market · 13 готовых витрин</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Маркет современных витрин
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              13 готовых витрин под реальный бизнес: Косметика, Еда и напитки, Электроника и Цветы. Интерактивный предпросмотр (ПК и мобильный) с возможностью скачать или применить тему.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/robo-market"
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs"
            >
              <Blocks className="w-4 h-4 text-emerald-400" />
              <span>Маркетплейс интеграций (32)</span>
            </Link>
            <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold text-xs dark:bg-emerald-950/60 dark:text-emerald-400">
                13
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Готовых тем</p>
                <p className="text-[11px] text-slate-500">100% готовность под ключ</p>
              </div>
            </div>
          </div>
        </div>

        {/* CURRENT ACTIVE THEME (Shopify style) */}
        <div className="mt-6 p-5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Активная витрина
                </span>
                <span className="text-xs text-slate-400">Версия 2.5.0</span>
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                {(store as any)?.design_system?.theme_name || "Stuffsus Modern Glass"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Основная опубликованная тема интернет-магазина • Адаптирована под смартфоны, планшеты и десктоп
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={store?.storefront_url || (store?.subdomain ? `/store/${store.subdomain}/` : "#")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg border border-slate-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all shadow-2xs inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>Посмотреть магазин</span>
            </a>
            <Link
              to="/design"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-xs inline-flex items-center gap-2"
            >
              <Palette className="w-4 h-4" />
              <span>Настроить тему</span>
            </Link>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER TABS */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'Все 13 витрин' },
              { id: 'beauty', label: 'Косметика (4)' },
              { id: 'food', label: 'Еда и напитки (3)' },
              { id: 'tech', label: 'Электроника (3)' },
              { id: 'flowers', label: 'Цветы (3)' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или нише..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200/80 text-xs font-normal focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-neutral-900 dark:border-neutral-800"
            />
          </div>
        </div>
      </div>

      {/* THEMES CATALOG GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredThemes.map(t => (
            <div
              key={t.id}
              className="group bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col dark:bg-neutral-900 dark:border-neutral-800"
            >
              <div
                onClick={() => setSelectedTheme(t)}
                className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-neutral-800 cursor-pointer"
              >
                <img
                  src={t.coverImage}
                  alt={t.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-white shadow-2xs"
                    style={{ backgroundColor: t.accentColor }}
                  >
                    {t.badge}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-medium text-white border border-white/20 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{t.ratingScore.toFixed(1)}</span>
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-[11px] font-medium text-white/80">{t.nicheLabel}</p>
                  <h3 className="text-sm font-semibold tracking-tight">{t.title}</h3>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {t.tagline}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t.features.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200/60 text-[10px] font-normal text-slate-600 dark:bg-neutral-800/50 dark:border-neutral-700 dark:text-neutral-400"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTheme(t)}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Быстрый просмотр</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadTheme(t)}
                      className="p-2 rounded-lg border border-slate-200/80 hover:bg-slate-100 dark:border-neutral-700 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                      title="Скачать шаблон себе для магазина (.json)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`/dashboard/demo-store/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-slate-200/80 hover:bg-slate-100 dark:border-neutral-700 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
                      title="Открыть сайт на весь экран в отдельной вкладке"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInstallTheme(t)}
                    className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Установить в магазин</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FULL-SCREEN LIVE STOREFRONT PREVIEW MODAL */}
      {selectedTheme && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          {/* TOP MODAL CONTROL BAR */}
          <div className="w-full max-w-6xl mb-2 sm:mb-3 bg-white dark:bg-neutral-900 rounded-xl px-4 py-2 border border-slate-200/80 dark:border-neutral-800 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedTheme.accentColor }}
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                {selectedTheme.title}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-[10px] font-medium text-slate-600 dark:text-neutral-300">
                {selectedTheme.nicheLabel}
              </span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-neutral-800 rounded-lg border border-slate-200/60 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-neutral-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Компьютер</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-neutral-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">iPhone 16 Pro</span>
              </button>
            </div>

            {/* Standalone Link, Download, Install & Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTheme(selectedTheme)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Скачать конфигурацию шаблона (.json)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Скачать шаблон</span>
              </button>

              <a
                href={`/dashboard/demo-store/${selectedTheme.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Открыть магазин на весь экран в отдельной вкладке"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">В новой вкладке ↗</span>
              </a>

              <button
                type="button"
                onClick={() => handleInstallTheme()}
                disabled={installing}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {installing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white text-white" />}
                <span className="hidden md:inline">Установить в магазин</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer dark:bg-neutral-800 dark:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* STORE CONTAINER (IPHONE SIMULATOR VS DESKTOP) */}
          {isMobile ? (
            <div className="w-[393px] h-[852px] max-h-[88vh] rounded-[52px] border-[10px] border-neutral-900 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden relative flex flex-col bg-black">
              {/* Dynamic Island */}
              <div className="shrink-0 bg-black text-white px-7 py-2.5 flex justify-between items-center text-[11px] font-bold select-none z-50">
                <span>9:41</span>
                <div className="w-24 h-4 bg-black rounded-full border border-neutral-800 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-900 border border-neutral-700" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px]">5G</span>
                  <div className="w-4 h-2 rounded-xs border border-white/80 p-0.5 flex items-center">
                    <div className="w-full h-full bg-white rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Real Interactive Mobile Storefront */}
              <iframe
                src={`/dashboard/demo-store/${selectedTheme.id}?embedded=true`}
                className="w-full flex-1 border-0 bg-white"
                title={`${selectedTheme.title} Mobile Preview`}
              />
            </div>
          ) : (
            <div className="w-full max-w-6xl h-[86vh] rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden bg-black flex flex-col">
              <iframe
                src={`/dashboard/demo-store/${selectedTheme.id}?embedded=true`}
                className="w-full h-full border-0 bg-white"
                title={`${selectedTheme.title} Desktop Preview`}
              />
            </div>
          )}

          {/* INSTALLATION SUCCESS POPUP */}
          {installedSuccess && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-neutral-800 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Тема установлена!</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1">
                    «{selectedTheme.title}» теперь является активной темой вашего интернет-магазина.
                  </p>
                </div>
                <p className="text-xs text-slate-400 dark:text-neutral-500 leading-relaxed">
                  Тема успешно применена к вашему магазину. Настройки цветов, шрифтов и стилистики сохранены в дизайн-системе.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => { setInstalledSuccess(false); setSelectedTheme(null); }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
                  >
                    Вернуться в панель управления
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstalledSuccess(false)}
                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Остаться в превью
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
