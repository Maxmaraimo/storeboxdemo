import json
import random
import datetime
from decimal import Decimal
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseForbidden
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.utils.text import slugify

from apps.accounts.models import User
from apps.stores.models import Store, Branch, MerchantBalance, MerchantCard
from apps.catalog.models import (
    Category, Product, ProductImage, ProductVariation,
    YesPosConnection, YesPosCategoryLink, YesPosProductLink
)
from apps.catalog.yespos_client import YesPosClient
from apps.orders.models import (
    Order, OrderItem, PromoCode, Customer, ChatMessage,
    MarketingCampaign, MarketingBanner, StoreStaff
)
from apps.payments.models import StorePaymentSetting
from apps.telegram_bot.services import send_telegram_notification, test_bot_connection


def get_merchant_store(request):
    if not request.user.is_authenticated:
        return None
    curr_id = request.session.get('merchant_current_store_id')
    if curr_id:
        store = request.user.stores.filter(id=curr_id, is_active=True).first()
        if store:
            return store
        if request.user.is_superuser:
            store = Store.objects.filter(id=curr_id, is_active=True).first()
            if store:
                return store
    store = request.user.stores.filter(is_active=True).first()
    if not store and request.user.is_superuser:
        store = Store.objects.filter(is_active=True).first()
    if store:
        request.session['merchant_current_store_id'] = store.id
    return store


def check_subdomain_api(request):
    subdomain = request.GET.get('subdomain', '').strip().lower()
    subdomain_slug = slugify(subdomain)
    if not subdomain_slug or len(subdomain_slug) < 3:
        return JsonResponse({'available': False, 'message': "Kamida 3 ta belgi bo'lishi kerak"})
    if subdomain_slug in ['admin', 'api', 'www', 'app', 'mail', 'store', 'robosite', 'storebox', 'storebox']:
        return JsonResponse({'available': False, 'message': 'Band qilingan nom'})
    exists = Store.objects.filter(subdomain=subdomain_slug).exists()
    return JsonResponse({
        'available': not exists,
        'subdomain': subdomain_slug,
        'message': "Subdomen bo'sh" if not exists else 'Subdomen allaqachon band'
    })


def translate_api(request):
    text = request.GET.get('text', '').strip()
    target_lang = request.GET.get('to', 'ru')
    dict_map = {
        'gullar': {'ru': 'Цветы', 'en': 'Flowers'},
        'lavash': {'ru': 'Лаваш', 'en': 'Lavash Wraps'},
        'burger': {'ru': 'Бургеры', 'en': 'Burgers'},
        'ichimliklar': {'ru': 'Напитки', 'en': 'Drinks'},
        'shirinliklar': {'ru': 'Десерты', 'en': 'Desserts'},
        'test': {'ru': 'Тест', 'en': 'Test'},
        'kiyim': {'ru': 'Одежда', 'en': 'Clothing'},
        'poyabzal': {'ru': 'Обувь', 'en': 'Shoes'},
        'elektronika': {'ru': 'Электроника', 'en': 'Electronics'},
        'parvarish': {'ru': 'Уход и косметика', 'en': 'Beauty & Care'},
    }
    low = text.lower()
    if low in dict_map and target_lang in dict_map[low]:
        res = dict_map[low][target_lang]
    else:
        # Transliteration or capitalization
        res = text.capitalize()
    return JsonResponse({'translated': res})


def ai_desc_api(request):
    name = request.GET.get('name', 'Mahsulot').strip()
    lang = request.GET.get('lang', 'uz')
    if lang == 'uz':
        desc = (
            f"{name} — sizning biznesingiz va mijozlaringiz uchun eng sara tanlov! "
            f"Yuqori sifatli materiallardan ishlab chiqilgan, kundalik foydalanish uchun juda qulay "
            f"va ishonchli. Xaridorlaringizga haqiqiy lazzat va quvonch baxsh etadi. "
            f"O'zingiz uchun eng yaxshisini tanlang — {name} ni tanlang!"
        )
    else:
        desc = (
            f"{name} — превосходный выбор для ваших клиентов! "
            f"Изготовлено из лучших материалов с гарантией высокого качества. "
            f"Дарит настоящее удовольствие и комфорт каждый день."
        )
    return JsonResponse({'description': desc})


def ai_designer_api(request):
    """
    Instant AI Designer API: Generates brand color scheme, card layout,
    typography, and personalized promotional banners with store branding.
    """
    store = None
    if hasattr(request, 'user') and request.user.is_authenticated:
        store = get_merchant_store(request)
    store_name = store.name if store else "StoreBox"
    
    niche = request.GET.get('niche') or request.POST.get('niche') or 'flowers'
    custom_prompt = request.GET.get('custom_prompt') or request.POST.get('custom_prompt') or ''
    lang = getattr(request, 'language', 'uz')

    from apps.stores.ai_designer import generate_ai_theme, NICHE_PRESETS
    
    theme_data = generate_ai_theme(store_name, niche, custom_prompt, lang=lang)
    
    return JsonResponse({
        'status': 'ok',
        'theme': theme_data,
        'available_niches': [
            {
                'id': k,
                'name': v.get(f'name_{lang}', v['name_uz']),
                'emoji': v['emoji'],
                'color': v['primary_color']
            }
            for k, v in NICHE_PRESETS.items()
        ]
    })


def ai_apply_niche_api(request):
    """
    Instantly applies chosen niche theme, creates banner and populates products with high-res photos.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Avtorizatsiya talab qilinadi'}, status=401)
    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'status': 'error', 'message': 'Do\'kon topilmadi'}, status=404)

    niche = request.POST.get('niche') or request.GET.get('niche') or 'restaurant'
    custom_prompt = request.POST.get('custom_prompt') or request.GET.get('custom_prompt') or ''
    lang = getattr(request, 'language', 'uz')

    from apps.stores.ai_designer import apply_niche_catalog_to_store
    result = apply_niche_catalog_to_store(store, niche, custom_prompt=custom_prompt, lang=lang)
    return JsonResponse(result)


def ai_banner_regenerate_api(request):
    """
    Returns a unique high-resolution promotional banner photo for the specified niche.
    Directly updates the store's primary banner so the website changes immediately.
    """
    niche = request.GET.get('niche') or request.POST.get('niche') or 'restaurant'
    current_url = request.GET.get('current') or request.POST.get('current') or ''
    from apps.stores.ai_designer import get_random_banner_image
    new_image_url = get_random_banner_image(niche_key=niche, current_url=current_url)

    if request.user.is_authenticated:
        store = get_merchant_store(request)
        if store:
            from apps.orders.models import MarketingBanner
            primary_banner = MarketingBanner.objects.filter(store=store).first()
            if not primary_banner:
                primary_banner = MarketingBanner(store=store, title=f"«{store.name}»")
            primary_banner.image_url = new_image_url
            if primary_banner.image:
                primary_banner.image = None
            primary_banner.is_active = True
            primary_banner.save()

    return JsonResponse({
        'status': 'ok',
        'image_url': new_image_url,
        'niche': niche
    })


def upload_banner_api(request):
    """
    API for uploading a custom banner image from device file picker.
    Saves to MarketingBanner and returns image URL for live preview.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Avtorizatsiya talab qilinadi'}, status=401)
    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'status': 'error', 'message': 'Do\'kon topilmadi'}, status=404)

    banner_file = request.FILES.get('banner_file')
    if not banner_file:
        return JsonResponse({'status': 'error', 'message': 'Fayl tanlanmadi'}, status=400)

    from apps.orders.models import MarketingBanner
    primary_banner = MarketingBanner.objects.filter(store=store).first()
    if not primary_banner:
        primary_banner = MarketingBanner(store=store, title=f"«{store.name}»")

    primary_banner.image = banner_file
    primary_banner.image_url = primary_banner.image.url
    primary_banner.is_active = True
    primary_banner.save()

    return JsonResponse({
        'status': 'ok',
        'image_url': primary_banner.image.url,
        'banner_id': primary_banner.id,
        'message': 'Banner muvaffaqiyatli yuklandi!'
    })


# -----------------------------------------------------------------
# AUTH & STOREBOX ONBOARDING WIZARD
# -----------------------------------------------------------------

def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard:home')

    error = None
    if request.method == 'POST':
        phone = request.POST.get('phone', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')

        if not phone or not password:
            error = 'Пожалуйста, укажите номер телефона и пароль'
        elif password != password_confirm:
            error = 'Пароли не совпадают'
        elif len(password) < 6:
            error = 'Пароль должен содержать минимум 6 символов'
        else:
            username = phone.replace('+', '').replace(' ', '').replace('-', '')
            if User.objects.filter(username=username).exists():
                error = 'Пользователь с таким номером уже зарегистрирован'
            else:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    phone=phone,
                    password=password,
                    role=User.Roles.MERCHANT
                )
                login(request, user)
                return redirect('dashboard:onboarding')

    return render(request, 'dashboard/auth/register.html', {'error': error})


def login_view(request):
    if request.user.is_authenticated:
        next_url = request.GET.get('next') or request.POST.get('next')
        if next_url and next_url.startswith('/'):
            return redirect(next_url)
        return redirect('dashboard:home')

    error = None
    if request.method == 'POST':
        login_val = request.POST.get('login', '').strip()
        password = request.POST.get('password', '')

        clean = login_val.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        target_user = None
        if User.objects.filter(username=clean).exists():
            target_user = User.objects.filter(username=clean).first()
        elif User.objects.filter(username=login_val).exists():
            target_user = User.objects.filter(username=login_val).first()
        elif User.objects.filter(phone=login_val).exists():
            target_user = User.objects.filter(phone=login_val).first()
        elif User.objects.filter(phone=f"+{clean}").exists():
            target_user = User.objects.filter(phone=f"+{clean}").first()
        elif len(clean) == 9 and User.objects.filter(username=f"998{clean}").exists():
            target_user = User.objects.filter(username=f"998{clean}").first()
        elif len(clean) >= 9 and User.objects.filter(username__endswith=clean[-9:]).exists():
            target_user = User.objects.filter(username__endswith=clean[-9:]).first()
        elif '@' in login_val:
            target_user = User.objects.filter(email=login_val).first()

        user = None
        if target_user:
            user = authenticate(request, username=target_user.username, password=password)
            if not user and password in ['admin', 'admin123']:
                if target_user.check_password('admin123') or target_user.check_password('admin'):
                    user = target_user
        else:
            user = authenticate(request, username=clean, password=password)

        if user:
            login(request, user)
            next_url = request.GET.get('next') or request.POST.get('next')
            if next_url and next_url.startswith('/'):
                return redirect(next_url)
            store = get_merchant_store(request)
            if not user.stores.exists() and not (user.is_superuser and store):
                return redirect('dashboard:onboarding')
            return redirect('dashboard:home')
        else:
            error = "Неверный логин (телефон) или пароль / Noto'g'ri telefon raqami yoki parol"

    return render(request, 'dashboard/auth/login.html', {'error': error})


def logout_view(request):
    logout(request)
    return redirect('/')


@login_required
def onboarding_wizard_view(request):
    existing_store = get_merchant_store(request)
    if existing_store and not request.GET.get('force'):
        return redirect('dashboard:home')

    error = None
    if request.method == 'POST':
        try:
            # Welcome Step
            name = request.POST.get('name', "Mening do'konim").strip()
            business_type = request.POST.get('business_type', Store.BusinessTypes.STORE)
            platform_type = request.POST.get('platform_type', Store.PlatformTypes.ALL)
            country = request.POST.get('country', Store.Countries.UZ)
            category_choice = request.POST.get('business_category', Store.BusinessCategories.FOOD)

            # Step 1: Domain
            subdomain = request.POST.get('subdomain', '').strip().lower()
            subdomain_slug = slugify(subdomain) or f"shop-{random.randint(100, 999)}"
            if Store.objects.filter(subdomain=subdomain_slug).exists():
                subdomain_slug = f"{subdomain_slug}-{random.randint(10, 99)}"

            # Step 2: Settings
            currency = request.POST.get('currency', 'UZS')
            languages = request.POST.getlist('languages') or ['uz', 'ru']
            primary_color = request.POST.get('primary_color', '#10B981')
            logo = request.FILES.get('logo')

            about_us_uz = request.POST.get('about_us_uz', '').strip()
            about_us_ru = request.POST.get('about_us_ru', '').strip()
            phone = request.POST.get('phone', request.user.phone or '')

            instagram = request.POST.get('instagram', '').strip()
            telegram = request.POST.get('telegram', '').strip()
            facebook = request.POST.get('facebook', '').strip()
            youtube = request.POST.get('youtube', '').strip()
            tiktok = request.POST.get('tiktok', '').strip()
            whatsapp = request.POST.get('whatsapp', '').strip()

            schedule = {}
            for day in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']:
                schedule[day] = {
                    'open': request.POST.get(f'schedule_{day}_open', '09:00'),
                    'close': request.POST.get(f'schedule_{day}_close', '23:59'),
                    'closed': request.POST.get(f'schedule_{day}_closed') == 'on'
                }

            branch_name = request.POST.get('branch_name', "Do'kon filiali").strip()
            branch_address = request.POST.get('branch_address', "Toshkent, Beruniy ko'chasi").strip()
            branch_lat = float(request.POST.get('branch_lat', '41.2995') or '41.2995')
            branch_lng = float(request.POST.get('branch_lng', '69.2401') or '69.2401')

            # Create Store
            store = Store.objects.create(
                owner=request.user,
                name=name,
                subdomain=subdomain_slug,
                business_type=business_type,
                platform_type=platform_type,
                country=country,
                business_category=category_choice,
                currency=currency,
                active_languages=languages,
                default_language='uz',
                working_hours=schedule,
                primary_color=primary_color,
                logo=logo,
                phone=phone,
                instagram_username=instagram,
                telegram_channel=telegram,
                facebook=facebook,
                youtube=youtube,
                tiktok=tiktok,
                whatsapp=whatsapp,
                address=branch_address,
                about_us_uz=about_us_uz,
                about_us_ru=about_us_ru,
                pickup_enabled=True,
                courier_enabled=True,
                delivery_price=Decimal('20000'),
                free_delivery_threshold=Decimal('150000'),
                delivery_time_estimate='30-45 min'
            )

            # Create Merchant Balance & Trial
            MerchantBalance.objects.create(store=store, balance=Decimal('0'), trial_days_left=7)

            # Create Branch
            Branch.objects.create(
                store=store,
                name=branch_name,
                address=branch_address,
                latitude=branch_lat,
                longitude=branch_lng,
                phone=phone,
                is_main=True
            )

            # Create Payments Settings
            StorePaymentSetting.objects.create(store=store)

            # Step 3: Category
            cat_name_uz = request.POST.get('cat_name_uz', 'Gullar').strip() or 'Gullar'
            cat_name_ru = request.POST.get('cat_name_ru', 'Цветы').strip() or 'Цветы'
            cat_name_en = request.POST.get('cat_name_en', 'Flowers').strip() or 'Flowers'
            cat_image = request.FILES.get('cat_image')
            cat_slug = slugify(cat_name_uz) or 'cat-1'
            category = Category.objects.create(
                store=store,
                name_uz=cat_name_uz,
                name_ru=cat_name_ru,
                name_en=cat_name_en,
                slug=cat_slug,
                image=cat_image
            )

            # Step 4: First Product
            prod_name_uz = request.POST.get('prod_name_uz', 'Test').strip() or 'Test'
            prod_name_ru = request.POST.get('prod_name_ru', 'Тест').strip() or 'Тест'
            prod_name_en = request.POST.get('prod_name_en', 'Test Product').strip() or 'Test Product'
            prod_desc_uz = request.POST.get('prod_desc_uz', '').strip()
            prod_desc_ru = request.POST.get('prod_desc_ru', '').strip()
            prod_price = Decimal(request.POST.get('prod_price', '100').replace(' ', '') or '100')
            prod_old_price_str = request.POST.get('prod_old_price', '').replace(' ', '')
            prod_old_price = Decimal(prod_old_price_str) if prod_old_price_str else None
            prod_unit = request.POST.get('prod_unit', Product.Units.DONA)

            product = Product.objects.create(
                store=store,
                category=category,
                name_uz=prod_name_uz,
                name_ru=prod_name_ru,
                name_en=prod_name_en,
                slug=slugify(prod_name_uz) or 'test-product',
                price=prod_price,
                old_price=prod_old_price,
                unit=prod_unit,
                stock=25,
                cost_price=Decimal('70'),
                margin=Decimal('42.8'),
                description_uz=prod_desc_uz,
                description_ru=prod_desc_ru,
                is_featured=True
            )

            photos = request.FILES.getlist('prod_photos')
            for i, p in enumerate(photos):
                ProductImage.objects.create(product=product, image=p, is_primary=(i == 0))

            if request.POST.get('action') == 'open_store':
                return redirect(f'/store/{store.subdomain}/')
            return redirect('dashboard:home')
        except Exception as e:
            error = f"Xatolik yuz berdi: {str(e)}"

    return render(request, 'dashboard/auth/onboarding.html', {
        'error': error,
        'business_types': Store.BusinessTypes.choices,
        'platform_types': Store.PlatformTypes.choices,
        'countries': Store.Countries.choices,
        'categories_choices': Store.BusinessCategories.choices,
        'units': Product.Units.choices,
    })


# -----------------------------------------------------------------
# DASHBOARD HOME & ANALYTICS (from Video 07:47)
# -----------------------------------------------------------------

@login_required
def dashboard_home_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    now = timezone.now()
    period = request.GET.get('period', 'week') # 'today', 'week', 'month', 'quarter', 'year', 'custom'
    start_date_str = request.GET.get('start_date', '').strip()
    end_date_str = request.GET.get('end_date', '').strip()

    store_orders = Order.objects.filter(store=store)

    start_date_val = (now - timezone.timedelta(days=7)).strftime('%Y-%m-%d')
    end_date_val = now.strftime('%Y-%m-%d')

    if start_date_str and end_date_str:
        try:
            s_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            e_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
            if s_date > e_date:
                s_date, e_date = e_date, s_date
            start_dt = timezone.make_aware(datetime.datetime.combine(s_date, datetime.time.min))
            end_dt = timezone.make_aware(datetime.datetime.combine(e_date, datetime.time.max))
            orders_scope = store_orders.filter(created_at__gte=start_dt, created_at__lte=end_dt)
            period = 'custom'
            start_date_val = s_date.strftime('%Y-%m-%d')
            end_date_val = e_date.strftime('%Y-%m-%d')

            num_days = max(1, (e_date - s_date).days + 1)
            step = max(1, num_days // 12)
            chart_labels = []
            chart_revenue = []
            curr = s_date
            while curr <= e_date:
                day_sum = orders_scope.filter(created_at__date=curr, payment_status=Order.PaymentStatuses.PAID).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
                chart_labels.append(curr.strftime('%d.%m'))
                chart_revenue.append(float(day_sum))
                curr += timezone.timedelta(days=step)
        except Exception:
            period = 'week'

    if period == 'today':
        filter_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        orders_scope = store_orders.filter(created_at__gte=filter_date)
        chart_labels = [f"{h:02d}:00" for h in range(0, 24, 2)]
        chart_revenue = [0.0] * 12
        for o in orders_scope.exclude(status=Order.OrderStatuses.CANCELLED):
            local_hour = timezone.localtime(o.created_at).hour
            slot = local_hour // 2
            if slot < 12:
                chart_revenue[slot] += float(o.total_amount)
    elif period == 'month':
        filter_date = now - timezone.timedelta(days=30)
        orders_scope = store_orders.filter(created_at__gte=filter_date)
        chart_labels = []
        chart_revenue = []
        for i in range(29, -1, -3):
            day_date = (now - timezone.timedelta(days=i)).date()
            day_sum = orders_scope.filter(created_at__date=day_date).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            chart_labels.append(day_date.strftime('%d.%m'))
            chart_revenue.append(float(day_sum))
    elif period == 'quarter':
        filter_date = now - timezone.timedelta(days=90)
        orders_scope = store_orders.filter(created_at__gte=filter_date)
        chart_labels = []
        chart_revenue = []
        for i in range(89, -1, -10):
            start_d = (now - timezone.timedelta(days=i)).date()
            end_d = (now - timezone.timedelta(days=max(0, i - 9))).date()
            day_sum = orders_scope.filter(created_at__date__gte=start_d, created_at__date__lte=end_d).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            chart_labels.append(start_d.strftime('%d.%m'))
            chart_revenue.append(float(day_sum))
    elif period == 'year':
        filter_date = now - timezone.timedelta(days=365)
        orders_scope = store_orders.filter(created_at__gte=filter_date)
        chart_labels = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
        chart_revenue = []
        for m in range(1, 13):
            m_sum = orders_scope.filter(created_at__year=now.year, created_at__month=m).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            chart_revenue.append(float(m_sum))
    elif period != 'custom': # default week
        period = 'week'
        filter_date = now - timezone.timedelta(days=7)
        orders_scope = store_orders.filter(created_at__gte=filter_date)
        chart_labels = []
        chart_revenue = []
        for i in range(6, -1, -1):
            day_date = (now - timezone.timedelta(days=i)).date()
            day_sum = orders_scope.filter(created_at__date=day_date).exclude(status=Order.OrderStatuses.CANCELLED).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            chart_labels.append(day_date.strftime('%d.%m'))
            chart_revenue.append(float(day_sum))

    # Metrics calculated dynamically for the selected period scope
    valid_orders = orders_scope.exclude(status=Order.OrderStatuses.CANCELLED)
    sotuvlar_summasi = valid_orders.aggregate(Sum('subtotal'))['subtotal__sum'] or Decimal('0')
    yetkazib_berish_summasi = valid_orders.aggregate(Sum('delivery_fee'))['delivery_fee__sum'] or Decimal('0')
    foyda = sotuvlar_summasi + yetkazib_berish_summasi

    orders_count = orders_scope.count()
    yangi_orders = orders_scope.filter(status=Order.OrderStatuses.NEW).count()
    tayyor_orders = orders_scope.filter(status__in=[Order.OrderStatuses.READY, Order.OrderStatuses.COMPLETED]).count()
    bekor_qilindi = orders_scope.filter(status=Order.OrderStatuses.CANCELLED).count()

    total_customers = Customer.objects.filter(store=store).count()
    avg_order = (foyda / orders_count) if orders_count > 0 else Decimal('0')

    # Traffic sources
    web_cnt = store_orders.filter(source=Order.Sources.WEB).count()
    tma_cnt = store_orders.filter(source=Order.Sources.TELEGRAM_MINI_APP).count()

    # Top products ordered in the selected period (Bugun, Hafta, Har oy, Har yil)
    period_top_qs = OrderItem.objects.filter(order__in=orders_scope).values('product_name').annotate(
        sold_qty=Sum('quantity'),
        sold_sum=Sum('total_price')
    ).order_by('-sold_qty')[:10]

    has_period_sales = period_top_qs.exists()
    if has_period_sales:
        top_products = list(period_top_qs)
    else:
        # Fallback to store-wide top products so merchant sees popular items
        top_products = list(OrderItem.objects.filter(order__store=store).values('product_name').annotate(
            sold_qty=Sum('quantity'),
            sold_sum=Sum('total_price')
        ).order_by('-sold_qty')[:10])

    period_labels = {
        'today': 'Bugungi',
        'week': 'Haftalik',
        'month': 'Oylik',
        'quarter': 'Choraklik',
        'year': 'Yillik',
        'custom': 'Tanlangan oraliq'
    }
    period_display = period_labels.get(period, 'Bugungi')

    # Deliveries map
    map_orders = []
    for ord in store_orders.filter(delivery_lat__isnull=False, delivery_lng__isnull=False)[:30]:
        map_orders.append({
            'num': ord.order_number,
            'client': ord.customer_name,
            'lat': ord.delivery_lat,
            'lng': ord.delivery_lng,
            'total': float(ord.total_amount),
            'status': ord.get_status_display()
        })
    if not map_orders and store.branches.exists():
        br = store.branches.first()
        map_orders.append({
            'num': 'Filial',
            'client': br.name,
            'lat': br.latitude,
            'lng': br.longitude,
            'total': 0,
            'status': 'Asosiy filial'
        })

    # Balance & cards
    merchant_balance, _ = MerchantBalance.objects.get_or_create(store=store)

    return render(request, 'dashboard/home.html', {
        'store': store,
        'period': period,
        'period_display': period_display,
        'has_period_sales': has_period_sales,
        'start_date_val': start_date_val,
        'end_date_val': end_date_val,
        'merchant_balance': merchant_balance,
        'sotuvlar_summasi': sotuvlar_summasi,
        'yetkazib_berish_summasi': yetkazib_berish_summasi,
        'foyda': foyda,
        'orders_count': orders_count,
        'yangi_orders': yangi_orders,
        'tayyor_orders': tayyor_orders,
        'bekor_qilindi': bekor_qilindi,
        'total_customers': total_customers,
        'avg_order': avg_order,
        'chart_labels_json': json.dumps(chart_labels),
        'chart_revenue_json': json.dumps(chart_revenue),
        'web_cnt': web_cnt,
        'tma_cnt': tma_cnt,
        'top_products': top_products,
        'map_orders_json': json.dumps(map_orders),
    })


# -----------------------------------------------------------------
# BALANCE TOP-UP & CARD ATTACHMENT (from Video 10:28 - 10:31)
# -----------------------------------------------------------------

@login_required
def topup_balance_api(request):
    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'error': 'No store'}, status=400)
    bal, _ = MerchantBalance.objects.get_or_create(store=store)
    if request.method == 'POST':
        amount = Decimal(request.POST.get('amount', '50000').replace(' ', '') or '50000')
        bal.balance += amount
        bal.save()
        return JsonResponse({'success': True, 'new_balance': float(bal.balance)})
    return JsonResponse({'balance': float(bal.balance)})


@login_required
def add_card_api(request):
    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'error': 'No store'}, status=400)
    if request.method == 'POST':
        card_num = request.POST.get('card_number', '').replace(' ', '')
        expiry = request.POST.get('expiry', '').strip()
        MerchantCard.objects.create(store=store, card_number=card_num, expiry=expiry)
        return JsonResponse({'success': True})
    cards = list(store.merchant_cards.values('id', 'card_number', 'expiry'))
    return JsonResponse({'cards': cards})


# -----------------------------------------------------------------
# CATALOG & WAREHOUSE (OMBORXONA, IKPU, CHEGIRMA from Video 08:32-08:59)
# -----------------------------------------------------------------

@login_required
def products_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    products = Product.objects.filter(store=store).select_related('category').prefetch_related('images', 'variations')
    query = request.GET.get('q', '').strip()
    if query:
        products = products.filter(Q(name_uz__icontains=query) | Q(name_ru__icontains=query) | Q(name_en__icontains=query))

    return render(request, 'dashboard/catalog/products.html', {
        'store': store,
        'products': products,
        'query': query
    })


@login_required
def warehouse_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')
    products = Product.objects.filter(store=store)
    return render(request, 'dashboard/catalog/warehouse.html', {
        'store': store,
        'products': products
    })


@login_required
def ikpu_view(request):
    store = get_merchant_store(request)
    products = Product.objects.filter(store=store)
    return render(request, 'dashboard/catalog/ikpu.html', {
        'store': store,
        'products': products
    })


@login_required
def discounts_view(request):
    store = get_merchant_store(request)
    discounted_products = Product.objects.filter(store=store, old_price__isnull=False)
    return render(request, 'dashboard/catalog/discounts.html', {
        'store': store,
        'products': discounted_products
    })


@login_required
def product_create_or_edit_view(request, product_id=None):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    product = None
    if product_id:
        product = get_object_or_404(Product, id=product_id, store=store)

    categories = Category.objects.filter(store=store)
    error = None

    if request.method == 'POST':
        name_uz = request.POST.get('name_uz', '').strip()
        name_ru = request.POST.get('name_ru', '').strip()
        name_en = request.POST.get('name_en', '').strip()
        category_id = request.POST.get('category_id')
        price = request.POST.get('price', '0').replace(' ', '').replace(',', '.')
        old_price = request.POST.get('old_price', '').replace(' ', '').replace(',', '.')
        cost_price = request.POST.get('cost_price', '0').replace(' ', '').replace(',', '.')
        margin = request.POST.get('margin', '100').replace(' ', '')
        unit = request.POST.get('unit', Product.Units.DONA)
        stock = request.POST.get('stock', '10')
        desc_uz = request.POST.get('desc_uz', '').strip()
        desc_ru = request.POST.get('desc_ru', '').strip()

        ikpu_code = request.POST.get('ikpu_code', '').strip()
        package_code = request.POST.get('package_code', '').strip()
        barcode = request.POST.get('barcode', '').strip()
        is_active = request.POST.get('is_active') in ['on', '1', 'true', True]
        is_featured = request.POST.get('is_featured') in ['on', '1', 'true', True]

        if not name_uz or not price:
            error = 'Mahsulot nomi va narxini kiriting'
        else:
            category = Category.objects.filter(id=category_id, store=store).first() if category_id else None
            clean_price = Decimal(price)
            clean_old_price = Decimal(old_price) if old_price else None
            clean_cost_price = Decimal(cost_price) if cost_price else Decimal('0')
            clean_margin = Decimal(margin) if margin else Decimal('100')
            slug = slugify(name_uz) or 'product'

            if not product:
                base_slug = slug
                counter = 1
                while Product.objects.filter(store=store, slug=slug).exists():
                    slug = f'{base_slug}-{counter}'
                    counter += 1

                product = Product.objects.create(
                    store=store,
                    category=category,
                    name_uz=name_uz,
                    name_ru=name_ru,
                    name_en=name_en,
                    slug=slug,
                    price=clean_price,
                    old_price=clean_old_price,
                    cost_price=clean_cost_price,
                    margin=clean_margin,
                    unit=unit,
                    stock=int(stock or 0),
                    ikpu_code=ikpu_code,
                    package_code=package_code,
                    barcode=barcode,
                    description_uz=desc_uz,
                    description_ru=desc_ru,
                    is_active=is_active,
                    is_featured=is_featured
                )
            else:
                product.name_uz = name_uz
                product.name_ru = name_ru
                product.name_en = name_en
                product.category = category
                product.price = clean_price
                product.old_price = clean_old_price
                product.cost_price = clean_cost_price
                product.margin = clean_margin
                product.unit = unit
                product.stock = int(stock or 0)
                product.ikpu_code = ikpu_code
                product.package_code = package_code
                product.barcode = barcode
                product.description_uz = desc_uz
                product.description_ru = desc_ru
                product.is_active = is_active
                product.is_featured = is_featured
                product.save()

            # Save uploaded photos
            photos = request.FILES.getlist('photos')
            for i, photo in enumerate(photos):
                ProductImage.objects.create(product=product, image=photo, is_primary=(i == 0 and not product.images.exists()))

            # Save variations
            var_names = request.POST.getlist('var_name[]') or request.POST.getlist('var_name_uz[]')
            var_prices = request.POST.getlist('var_price[]')
            var_stocks = request.POST.getlist('var_stock[]')
            if var_names:
                product.variations.all().delete()
                for v_name, v_price, v_stock in zip(var_names, var_prices, var_stocks):
                    if v_name.strip() and v_price:
                        ProductVariation.objects.create(
                            product=product,
                            name_uz=v_name.strip(),
                            name_ru=v_name.strip(),
                            price=Decimal(v_price.replace(' ', '')),
                            stock=int(v_stock or 10)
                        )

            return redirect('dashboard:products')

    return render(request, 'dashboard/catalog/product_form.html', {
        'store': store,
        'product': product,
        'categories': categories,
        'units': Product.Units.choices,
        'error': error,
    })


@login_required
def categories_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'create':
            name_uz = request.POST.get('name_uz', '').strip()
            name_ru = request.POST.get('name_ru', '').strip()
            name_en = request.POST.get('name_en', '').strip()
            slug = slugify(name_uz) or 'cat'
            if Category.objects.filter(store=store, slug=slug).exists():
                slug = f'{slug}-{Category.objects.filter(store=store).count() + 1}'
            Category.objects.create(store=store, name_uz=name_uz, name_ru=name_ru, name_en=name_en, slug=slug)
        elif action == 'delete':
            cat_id = request.POST.get('category_id')
            Category.objects.filter(id=cat_id, store=store).delete()
        return redirect('dashboard:categories')

    categories = Category.objects.filter(store=store).annotate(products_count=Count('products'))
    return render(request, 'dashboard/catalog/categories.html', {
        'store': store,
        'categories': categories
    })


# -----------------------------------------------------------------
# ORDERS (BUYURTMALAR from Video 08:08)
# -----------------------------------------------------------------

@login_required
def orders_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    orders = Order.objects.filter(store=store).prefetch_related('items', 'branch')
    status_filter = request.GET.get('status', 'ALL')

    if status_filter == 'NEW':
        orders = orders.filter(status=Order.OrderStatuses.NEW)
    elif status_filter == 'PROCESSING':
        orders = orders.filter(status=Order.OrderStatuses.PROCESSING)
    elif status_filter == 'READY':
        orders = orders.filter(status=Order.OrderStatuses.READY)
    elif status_filter == 'IN_DELIVERY':
        orders = orders.filter(status=Order.OrderStatuses.IN_DELIVERY)
    elif status_filter == 'HISTORY':
        orders = orders.filter(status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.CANCELLED])

    query = request.GET.get('q', '').strip()
    if query:
        orders = orders.filter(
            Q(order_number__icontains=query) |
            Q(customer_name__icontains=query) |
            Q(customer_phone__icontains=query)
        )

    counts = {
        'all': Order.objects.filter(store=store).count(),
        'new': Order.objects.filter(store=store, status=Order.OrderStatuses.NEW).count(),
        'processing': Order.objects.filter(store=store, status=Order.OrderStatuses.PROCESSING).count(),
        'ready': Order.objects.filter(store=store, status=Order.OrderStatuses.READY).count(),
        'in_delivery': Order.objects.filter(store=store, status=Order.OrderStatuses.IN_DELIVERY).count(),
        'history': Order.objects.filter(store=store, status__in=[Order.OrderStatuses.COMPLETED, Order.OrderStatuses.CANCELLED]).count(),
    }

    return render(request, 'dashboard/orders/orders_list.html', {
        'store': store,
        'orders': orders,
        'counts': counts,
        'current_status': status_filter,
        'query': query
    })


@login_required
def order_detail_view(request, order_id):
    store = get_merchant_store(request)
    order = get_object_or_404(Order, id=order_id, store=store)

    if request.method == 'POST':
        new_status = request.POST.get('status')
        new_pay_status = request.POST.get('payment_status')
        if new_status in Order.OrderStatuses.values:
            order.status = new_status
        if new_pay_status in Order.PaymentStatuses.values:
            order.payment_status = new_pay_status
        order.save()
        return redirect('dashboard:order_detail', order_id=order.id)

    return render(request, 'dashboard/orders/order_detail.html', {
        'store': store,
        'order': order,
        'order_statuses': Order.OrderStatuses.choices,
        'payment_statuses': Order.PaymentStatuses.choices,
    })


# -----------------------------------------------------------------
# CUSTOMERS & CHATS (MIJOZLAR, CHAT from Video 08:17, 08:22)
# -----------------------------------------------------------------

@login_required
def customers_list_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    customers = Customer.objects.filter(store=store)
    query = request.GET.get('q', '').strip()
    if query:
        customers = customers.filter(Q(name__icontains=query) | Q(phone__icontains=query))

    return render(request, 'dashboard/customers/customers_list.html', {
        'store': store,
        'customers': customers,
        'query': query
    })


def send_telegram_chat_reply(store, phone, message_text):
    """Deliver chat reply from merchant directly into customer's Telegram bot chat"""
    if not store:
        return False, "Do'kon topilmadi"
    clean_phone = phone.replace(' ', '').replace('+', '').strip()
    
    # 1. Search customer by phone
    cust = Customer.objects.filter(store=store).filter(
        Q(phone__icontains=clean_phone) | Q(phone__icontains=phone) | Q(telegram_chat_id=phone)
    ).first()
    chat_id = cust.telegram_chat_id if cust and cust.telegram_chat_id else None
    
    # 2. Search order by phone with telegram_user_id
    if not chat_id:
        ord_obj = Order.objects.filter(store=store).filter(
            Q(customer_phone__icontains=clean_phone) | Q(customer_phone__icontains=phone)
        ).exclude(telegram_user_id__isnull=True).first()
        if ord_obj and ord_obj.telegram_user_id:
            chat_id = str(ord_obj.telegram_user_id)
            if cust and not cust.telegram_chat_id:
                cust.telegram_chat_id = chat_id
                cust.save(update_fields=['telegram_chat_id'])
                
    # 3. Search past ChatMessage with telegram_chat_id
    if not chat_id:
        cm_prev = ChatMessage.objects.filter(store=store).filter(
            Q(customer_phone__icontains=clean_phone) | Q(customer_phone__icontains=phone)
        ).exclude(telegram_chat_id__isnull=True).exclude(telegram_chat_id='').first()
        if cm_prev and cm_prev.telegram_chat_id:
            chat_id = cm_prev.telegram_chat_id

    # 4. Fallback if store has telegram_chat_id
    if not chat_id and store.telegram_chat_id:
        chat_id = store.telegram_chat_id

    if chat_id:
        tg_text = (
            f"💬 <b>{store.name} do'koni ma'muriyati:</b>\n\n"
            f"{message_text}"
        )
        return send_telegram_notification(store, tg_text, chat_id=chat_id)
    return False, "Chat ID topilmadi"


@login_required
def chats_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    active_phone = request.GET.get('phone', '').strip()
    if request.method == 'POST':
        phone = request.POST.get('phone', '').strip()
        message = request.POST.get('message', '').strip()
        if phone and message:
            send_telegram_chat_reply(store, phone, message)
            clean_p = phone.replace(' ', '').replace('+', '').strip()
            c_obj = Customer.objects.filter(store=store).filter(
                Q(phone__icontains=clean_p) | Q(phone__icontains=phone)
            ).first()
            ChatMessage.objects.create(
                store=store,
                customer_phone=phone,
                customer_name=c_obj.name if c_obj else 'Mijoz',
                telegram_chat_id=c_obj.telegram_chat_id if c_obj else store.telegram_chat_id,
                sender=ChatMessage.Senders.MERCHANT,
                message=message
            )
            return redirect(f'/dashboard/chats/?phone={phone}')

    all_messages = ChatMessage.objects.filter(store=store).order_by('created_at')
    chat_threads = {}
    normalized_keys = {}
    for m in all_messages:
        norm_key = m.customer_phone.replace(' ', '').replace('+', '').strip()
        display_phone = m.customer_phone if m.customer_phone.startswith('+') else f"+{m.customer_phone}"
        if norm_key not in chat_threads:
            chat_threads[norm_key] = []
            normalized_keys[norm_key] = display_phone
        chat_threads[norm_key].append(m)

    clean_active = active_phone.replace(' ', '').replace('+', '').strip() if active_phone else ''
    if not clean_active and chat_threads:
        clean_active = list(chat_threads.keys())[0]

    active_messages_list = []
    if clean_active and clean_active in chat_threads:
        for m in chat_threads[clean_active]:
            active_messages_list.append({
                'id': m.id,
                'sender': m.sender,
                'message': m.message,
                'time': m.created_at.strftime('%H:%M')
            })

    active_display_phone = normalized_keys.get(clean_active, active_phone)
    active_customer_name = active_display_phone or 'Mijoz'
    if clean_active:
        cust = Customer.objects.filter(store=store).filter(
            Q(phone__icontains=clean_active)
        ).first()
        if cust:
            active_customer_name = cust.name
        elif clean_active in chat_threads and chat_threads[clean_active]:
            active_customer_name = chat_threads[clean_active][-1].customer_name or active_display_phone

    # Build template-friendly threads dict keyed by display_phone
    display_threads = {}
    for nk, msgs in chat_threads.items():
        dp = normalized_keys.get(nk, nk)
        display_threads[dp] = msgs

    return render(request, 'dashboard/chats/chats.html', {
        'store': store,
        'chat_threads': display_threads,
        'active_phone': active_display_phone,
        'active_name': active_customer_name,
        'active_messages_json': json.dumps(active_messages_list),
    })


# -----------------------------------------------------------------
# MARKETING (from Video 09:00 - 09:17)
# -----------------------------------------------------------------

@login_required
def marketing_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    tab = request.GET.get('tab', 'rassilka') # 'rassilka', 'promokod', 'manbalar', 'sms', 'kanal_post', 'banner', 'sharhlar'
    msg = None

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'create_campaign':
            title = request.POST.get('title', '').strip()
            channel = request.POST.get('channel', 'TELEGRAM')
            text = request.POST.get('message', '').strip()
            count = Customer.objects.filter(store=store).count() or 1
            MarketingCampaign.objects.create(
                store=store, title=title, channel=channel, message=text, sent_count=count, status='SENT'
            )
            msg = "Rassilka muvaffaqiyatli yuborildi!"
        elif action == 'create_promo':
            code = request.POST.get('code', '').strip().upper()
            d_val = Decimal(request.POST.get('discount_value', '10'))
            min_o = Decimal(request.POST.get('min_order_amount', '0'))
            PromoCode.objects.update_or_create(
                store=store, code=code,
                defaults={'discount_type': PromoCode.DiscountTypes.PERCENT, 'discount_value': d_val, 'min_order_amount': min_o}
            )
            msg = f"Promokod {code} yaratildi!"
        elif action == 'create_banner':
            title = request.POST.get('title', '').strip()
            subtitle = request.POST.get('subtitle', '').strip()
            image = request.FILES.get('image')
            MarketingBanner.objects.create(store=store, title=title, subtitle=subtitle, image=image)
            msg = "Banner muvaffaqiyatli qo'shildi!"

    campaigns = MarketingCampaign.objects.filter(store=store)
    banners = MarketingBanner.objects.filter(store=store)
    promos = PromoCode.objects.filter(store=store)

    return render(request, 'dashboard/marketing/marketing.html', {
        'store': store,
        'tab': tab,
        'msg': msg,
        'campaigns': campaigns,
        'banners': banners,
        'promos': promos,
    })


# -----------------------------------------------------------------
# PLATFORMS & DESIGNER QR-CATALOG (from Video 09:18 - 09:39)
# -----------------------------------------------------------------

@login_required
def platforms_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    tab = request.GET.get('tab', 'qr') # 'telegram', 'website', 'qr'
    msg = None

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'save_qr':
            store.qr_paper_size = request.POST.get('qr_paper_size', 'A5')
            store.qr_bg_color = request.POST.get('qr_bg_color', '#FFFFFF')
            store.qr_code_color = request.POST.get('qr_code_color', '#000000')
            store.qr_main_text = request.POST.get('qr_main_text', 'Online buyurtma')
            store.qr_main_text_size = int(request.POST.get('qr_main_text_size', '24') or '24')
            store.qr_main_text_color = request.POST.get('qr_main_text_color', '#000000')
            store.qr_sub_text = request.POST.get('qr_sub_text', 'Menyuni ochish uchun qr kodni skanerlang')
            store.qr_sub_text_size = int(request.POST.get('qr_sub_text_size', '8') or '8')
            store.qr_sub_text_color = request.POST.get('qr_sub_text_color', '#64748B')
            store.save()
            msg = "QR katalog sozlamalari muvaffaqiyatli saqlandi!"
        elif action == 'save_telegram':
            token = request.POST.get('telegram_bot_token', '').strip()
            button_name = request.POST.get('telegram_button_name', "Do'kon").strip()
            welcome_msg = request.POST.get('telegram_welcome_message', '').strip()

            from apps.telegram_bot.services import get_bot_info, setup_bot_menu_button, test_bot_connection, get_store_webapp_url
            from apps.telegram_bot.polling import start_polling_thread

            if token:
                ok, bot_res = get_bot_info(token)
                if ok and isinstance(bot_res, dict):
                    detected_username = bot_res.get('username', '').lstrip('@')
                    store.telegram_bot_username = detected_username
                    store.telegram_bot_token = token
                    store.telegram_button_name = button_name or "Do'kon"
                    if welcome_msg:
                        store.telegram_welcome_message = welcome_msg
                    store.save()

                    # Automatically setup WebApp menu button with HTTPS WebApp URL
                    web_app_url = get_store_webapp_url(store)
                    setup_bot_menu_button(token, web_app_url, button_name)

                    # Ensure polling worker is active
                    start_polling_thread()

                    msg = f"Telegram bot @{store.telegram_bot_username} muvaffaqiyatli ulandi va Web App ishga tushirildi!"
                else:
                    store.telegram_bot_token = token
                    store.telegram_button_name = button_name or "Do'kon"
                    if welcome_msg:
                        store.telegram_welcome_message = welcome_msg
                    store.save()
                    msg = f"Telegram bot saqlandi! ({bot_res})"
            else:
                msg = "Iltimos, @BotFather dan olingan bot tokenini kiriting!"

        elif action == 'disconnect_telegram':
            store.telegram_bot_token = ''
            store.telegram_bot_username = ''
            store.save()
            msg = "Telegram bot uzildi. Endi boshqa botni ulashingiz mumkin!"
        elif action == 'save_website':
            store.name = request.POST.get('site_name', store.name).strip()
            store.seo_description = request.POST.get('seo_description', '').strip()
            if 'favicon' in request.FILES:
                store.logo = request.FILES['favicon']
            store.save()
            msg = "Veb-sayt asosiy sozlamalari saqlandi!"
        elif action == 'save_analytics':
            store.google_analytics_id = request.POST.get('google_analytics_id', '').strip()
            store.google_tag_manager_id = request.POST.get('google_tag_manager_id', '').strip()
            store.facebook_pixel_id = request.POST.get('facebook_pixel_id', '').strip()
            store.yandex_metrika_id = request.POST.get('yandex_metrika_id', '').strip()
            store.save()
            msg = "Analitika tizimlari kodi saqlandi!"
        elif action == 'save_domain':
            new_sub = slugify(request.POST.get('subdomain', store.subdomain).strip())
            custom_dom = request.POST.get('custom_domain', '').strip()
            if new_sub and new_sub != store.subdomain:
                if not Store.objects.filter(subdomain=new_sub).exclude(id=store.id).exists():
                    store.subdomain = new_sub
            store.custom_domain = custom_dom
            store.save()
            msg = "Domen sozlamalari muvaffaqiyatli saqlandi!"
        elif action == 'save_design_theme':
            primary_color = request.POST.get('primary_color', '').strip()
            if primary_color:
                store.primary_color = primary_color
            theme_card_style = request.POST.get('theme_card_style', '').strip()
            if theme_card_style:
                store.theme_card_style = theme_card_style
            theme_card_radius = request.POST.get('theme_card_radius', '').strip()
            if theme_card_radius:
                store.theme_card_radius = theme_card_radius
            theme_image_aspect = request.POST.get('theme_image_aspect', '').strip()
            if theme_image_aspect:
                store.theme_image_aspect = theme_image_aspect
            theme_button_style = request.POST.get('theme_button_style', '').strip()
            if theme_button_style:
                store.theme_button_style = theme_button_style
            theme_bg_color = request.POST.get('theme_bg_color', '').strip()
            if theme_bg_color:
                store.theme_bg_color = theme_bg_color
            theme_business_niche = request.POST.get('theme_business_niche', '').strip()
            if theme_business_niche:
                store.theme_business_niche = theme_business_niche
            store.save()

            # Save / Update primary promotional banner
            banner_title = request.POST.get('banner_title', '').strip()
            banner_subtitle = request.POST.get('banner_subtitle', '').strip()
            banner_image_url = request.POST.get('banner_image_url', '').strip()

            from apps.orders.models import MarketingBanner
            has_banner_update = bool(banner_title or banner_image_url or ('banner_file' in request.FILES))
            if has_banner_update:
                primary_banner = MarketingBanner.objects.filter(store=store).first()
                if not primary_banner:
                    primary_banner = MarketingBanner(store=store)
                if banner_title:
                    primary_banner.title = banner_title
                primary_banner.subtitle = banner_subtitle
                if 'banner_file' in request.FILES:
                    primary_banner.image = request.FILES['banner_file']
                    primary_banner.image_url = ''
                elif banner_image_url:
                    if primary_banner.image and (not hasattr(primary_banner.image, 'url') or primary_banner.image.url != banner_image_url):
                        primary_banner.image = None
                    primary_banner.image_url = banner_image_url
                primary_banner.is_active = True
                primary_banner.save()

            # If user checked 'generate_catalog', automatically populate products & photos for niche
            if request.POST.get('generate_catalog') == '1' and store.theme_business_niche:
                from apps.stores.ai_designer import apply_niche_catalog_to_store
                apply_niche_catalog_to_store(
                    store,
                    store.theme_business_niche,
                    lang=getattr(request, 'language', 'uz'),
                    preserve_custom_banner=has_banner_update,
                    preserve_design=True
                )
                msg = "Do'kon dizayni, banner va tovarlar katalogi muvaffaqiyatli saqlandi!"
            else:
                msg = "Do'kon dizayni va vitrina ko'rinishi muvaffaqiyatli saqlandi!"
        elif action == 'setup_tma_menu':
            from apps.telegram_bot.services import setup_bot_menu_button, get_store_webapp_url
            web_app_url = get_store_webapp_url(store)
            _, m_info = setup_bot_menu_button(store.telegram_bot_token, web_app_url, store.telegram_button_name)
            msg = m_info
        elif action == 'test_bot':
            from apps.telegram_bot.services import test_bot_connection
            _, m_info = test_bot_connection(store.telegram_bot_token, store.telegram_chat_id)
            msg = m_info

    from apps.telegram_bot.services import get_store_webapp_url
    from apps.orders.models import MarketingBanner
    from apps.stores.ai_designer import NICHE_PRESETS
    web_app_url = get_store_webapp_url(store)
    storefront_url = f"http://127.0.0.1:8000/store/{store.subdomain}/"
    bot_link = f"https://t.me/{store.telegram_bot_username}" if store.telegram_bot_username else f"https://t.me/storebox_{store.subdomain}_bot"
    primary_banner = MarketingBanner.objects.filter(store=store, is_active=True).first()
    sub_tab = request.GET.get('sub', 'design')

    return render(request, 'dashboard/platforms/platforms.html', {
        'store': store,
        'tab': tab,
        'sub_tab': sub_tab,
        'msg': msg,
        'storefront_url': storefront_url,
        'web_app_url': web_app_url,
        'bot_link': bot_link,
        'primary_banner': primary_banner,
        'niche_presets': NICHE_PRESETS,
    })


# -----------------------------------------------------------------
# TO'LOV TURI, YETKAZIB BERISH, FILIALLAR, XODIMLAR, TARIF REJASI, ROBO MARKET
# (from Video 09:40 - 10:13)
# -----------------------------------------------------------------

@login_required
def settings_payments_view(request):
    store = get_merchant_store(request)
    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    if request.method == 'POST':
        if 'click_service_id' in request.POST:
            pay_settings.click_service_id = request.POST.get('click_service_id', '').strip()
            pay_settings.click_merchant_id = request.POST.get('click_merchant_id', '').strip()
            pay_settings.click_secret_key = request.POST.get('click_secret_key', '').strip()
        if 'payme_merchant_id' in request.POST:
            pay_settings.payme_merchant_id = request.POST.get('payme_merchant_id', '').strip()
            pay_settings.payme_secret_key = request.POST.get('payme_secret_key', '').strip()
        if 'uzum_merchant_id' in request.POST:
            pay_settings.uzum_merchant_id = request.POST.get('uzum_merchant_id', '').strip()
            pay_settings.uzum_secret_key = request.POST.get('uzum_secret_key', '').strip()
        if 'click_enabled' in request.POST or 'cash_on_delivery_enabled' in request.POST:
            pay_settings.click_enabled = request.POST.get('click_enabled') == 'on'
            pay_settings.payme_enabled = request.POST.get('payme_enabled') == 'on'
            pay_settings.uzum_enabled = request.POST.get('uzum_enabled') == 'on'
            pay_settings.cash_on_delivery_enabled = request.POST.get('cash_on_delivery_enabled') == 'on'
            pay_settings.terminal_on_delivery_enabled = request.POST.get('terminal_on_delivery_enabled') == 'on'
        pay_settings.save()
        return redirect('dashboard:settings_payments')
    return render(request, 'dashboard/settings/payments.html', {
        'store': store,
        'pay_settings': pay_settings,
        'payment_settings': pay_settings
    })


@login_required
def settings_delivery_view(request):
    store = get_merchant_store(request)
    return render(request, 'dashboard/settings/delivery.html', {'store': store})


@login_required
def settings_branches_view(request):
    store = get_merchant_store(request)
    branches = Branch.objects.filter(store=store)
    branches_data = [{'name': b.name, 'address': b.address, 'lat': b.latitude, 'lng': b.longitude} for b in branches]
    return render(request, 'dashboard/settings/branches.html', {
        'store': store,
        'branches': branches,
        'branches_json': json.dumps(branches_data)
    })


@login_required
def settings_staff_view(request):
    store = get_merchant_store(request)
    staff_members = StoreStaff.objects.filter(store=store)
    return render(request, 'dashboard/settings/staff.html', {
        'store': store,
        'staff_members': staff_members,
        'roles': StoreStaff.Roles.choices
    })


@login_required
def settings_tariffs_view(request):
    store = get_merchant_store(request)
    msg = None
    if request.method == 'POST':
        plan = request.POST.get('plan', 'basic')
        months = int(request.POST.get('months', 1))
        payment_method = request.POST.get('payment_method', 'balance')

        rates = {'start': 300000, 'basic': 500000, 'pro': 900000}
        base_rate = rates.get(plan, 500000)
        total = base_rate * months
        if months == 6:
            total = int(total * 0.90)
        elif months == 12:
            total = int(total * 0.80)

        mb, _ = MerchantBalance.objects.get_or_create(store=store)
        if payment_method == 'balance':
            if mb.balance >= total:
                mb.balance -= total
                mb.trial_days_left += months * 30
                mb.save()
                msg = f"{plan.capitalize()} tarifi {months} oyga muvaffaqiyatli faollashtirildi!"
            else:
                msg = f"Balansda mablag' yetarli emas (kerak: {total:,} UZS, balans: {mb.balance:,} UZS)"
        else:
            mb.trial_days_left += months * 30
            mb.save()
            msg = f"{payment_method.capitalize()} orqali {plan.capitalize()} tarifi {months} oyga to'landi va faollashtirildi!"

    merchant_balance, _ = MerchantBalance.objects.get_or_create(store=store)
    return render(request, 'dashboard/settings/tariffs.html', {
        'store': store,
        'msg': msg,
        'merchant_balance': merchant_balance
    })


@login_required
def robo_market_view(request):
    store = get_merchant_store(request)
    return render(request, 'dashboard/settings/robo_market.html', {'store': store})


@login_required
def settings_general_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')
    msg = None
    if request.method == 'POST':
        store.name = request.POST.get('name', '').strip() or store.name
        store.phone = request.POST.get('phone', '').strip()
        store.primary_color = request.POST.get('primary_color', '').strip() or store.primary_color
        store.currency = request.POST.get('currency', '').strip() or store.currency
        store.default_language = request.POST.get('default_language', '').strip() or store.default_language
        store.instagram_username = request.POST.get('instagram_username', '').strip()
        store.telegram_channel = request.POST.get('telegram_channel', '').strip()
        store.facebook = request.POST.get('facebook', '').strip()
        store.youtube = request.POST.get('youtube', '').strip()
        store.tiktok = request.POST.get('tiktok', '').strip()
        store.whatsapp = request.POST.get('whatsapp', '').strip()
        store.about_us_uz = request.POST.get('about_us_uz', '').strip()
        store.about_us_ru = request.POST.get('about_us_ru', '').strip()
        if 'logo' in request.FILES:
            store.logo = request.FILES['logo']
        store.save()
        msg = "Sozlamalar saqlandi!"
    return render(request, 'dashboard/settings/general.html', {'store': store, 'msg': msg})

@login_required
def product_delete_view(request, product_id):
    store = get_merchant_store(request)
    product = get_object_or_404(Product, id=product_id, store=store)
    if request.method == 'POST':
        product.delete()
        if request.headers.get('x-requested-with') == 'XMLHttpRequest' or 'json' in request.headers.get('accept', ''):
            return JsonResponse({'success': True})
        return redirect('dashboard:products')
    return redirect('dashboard:products')


@login_required
def settings_telegram_view(request):
    return redirect('/dashboard/platforms/?tab=telegram')


# -----------------------------------------------------------------
# AJAX ACTIONS FOR INSTANT INTERACTION (ZERO PAGE RELOAD)
# -----------------------------------------------------------------

@login_required
def toggle_payment_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'error': 'Store not found'}, status=404)
    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    gateway = request.POST.get('gateway')
    enabled = request.POST.get('enabled') == 'true'
    
    if gateway == 'click':
        pay_settings.click_enabled = enabled
    elif gateway == 'payme':
        pay_settings.payme_enabled = enabled
    elif gateway == 'uzum':
        pay_settings.uzum_enabled = enabled
    elif gateway == 'cash':
        pay_settings.cash_on_delivery_enabled = enabled
    elif gateway == 'terminal':
        pay_settings.terminal_on_delivery_enabled = enabled
    pay_settings.save()
    return JsonResponse({'success': True, 'gateway': gateway, 'enabled': enabled})


@login_required
def update_order_status_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    store = get_merchant_store(request)
    order_id = request.POST.get('order_id')
    new_status = request.POST.get('status')
    order = get_object_or_404(Order, id=order_id, store=store)

    status_aliases = {
        'SHIPPED': Order.OrderStatuses.IN_DELIVERY,
        'DELIVERED': Order.OrderStatuses.COMPLETED,
    }
    target_status = status_aliases.get(new_status, new_status)
    if target_status in Order.OrderStatuses.values:
        order.status = target_status
        order.save()
        return JsonResponse({
            'success': True,
            'status': order.status,
            'status_display': order.get_status_display()
        })
    return JsonResponse({'error': 'Invalid status'}, status=400)


@login_required
def order_detail_api(request, order_id):
    store = get_merchant_store(request)
    order = get_object_or_404(Order, id=order_id, store=store)

    items_data = []
    for it in order.items.all():
        img_url = None
        if it.product and it.product.primary_image_url:
            img_url = it.product.primary_image_url
        items_data.append({
            'id': it.id,
            'product_name': it.product_name,
            'variation_name': it.variation_name or '',
            'unit_price': int(it.unit_price),
            'quantity': it.quantity,
            'total_price': int(it.total_price),
            'image_url': img_url,
        })

    # Count customer previous orders
    customer_orders_count = 1
    if order.customer:
        customer_orders_count = order.customer.orders.count()
    elif order.customer_phone:
        customer_orders_count = Order.objects.filter(store=store, customer_phone=order.customer_phone).count()

    data = {
        'id': order.id,
        'order_number': order.order_number,
        'created_at': order.created_at.strftime('%d.%m.%Y %H:%M'),
        'customer_name': order.customer_name or 'Noma\'lum xaridor',
        'customer_phone': order.customer_phone or '',
        'customer_orders_count': customer_orders_count,
        'delivery_method': order.delivery_method,
        'delivery_method_display': order.get_delivery_method_display(),
        'delivery_city': order.delivery_city or 'Toshkent',
        'delivery_address': order.delivery_address or '',
        'delivery_lat': order.delivery_lat,
        'delivery_lng': order.delivery_lng,
        'delivery_fee': int(order.delivery_fee or 0),
        'notes': order.notes or '',
        'promo_code': order.promo_code.code if order.promo_code else None,
        'discount_amount': int(order.discount_amount or 0),
        'subtotal': int(order.subtotal or 0),
        'total_amount': int(order.total_amount or 0),
        'payment_method': order.payment_method,
        'payment_method_display': order.get_payment_method_display(),
        'payment_status': order.payment_status,
        'payment_status_display': order.get_payment_status_display(),
        'status': order.status,
        'status_display': order.get_status_display(),
        'source': order.source,
        'source_display': order.get_source_display(),
        'branch_name': order.branch.name if order.branch else None,
        'items': items_data,
        'items_count': len(items_data),
        'full_detail_url': f"/dashboard/orders/{order.id}/",
    }
    return JsonResponse({'success': True, 'order': data})


@login_required
def export_orders_csv(request):
    import csv
    from django.http import HttpResponse
    store = get_merchant_store(request)
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="orders_{store.subdomain}.csv"'
    writer = csv.writer(response)
    writer.writerow(["ID", "Mijoz", "Telefon", "Sana", "Summa", "To'lov", "Holat"])
    for o in Order.objects.filter(store=store).order_by('-created_at'):
        writer.writerow([
            o.order_number, o.customer_name, o.customer_phone,
            o.created_at.strftime('%Y-%m-%d %H:%M'),
            float(o.total_amount), o.get_payment_method_display(), o.get_status_display()
        ])
    return response


@login_required
def adjust_bonus_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    store = get_merchant_store(request)
    cust_id = request.POST.get('customer_id')
    points = int(request.POST.get('points', 0))
    customer = get_object_or_404(Customer, id=cust_id, store=store)
    customer.bonus_balance = max(0, customer.bonus_balance + points)
    customer.save()
    return JsonResponse({'success': True, 'new_balance': customer.bonus_balance})


@login_required
def branch_action_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    store = get_merchant_store(request)
    action = request.POST.get('action') # 'create', 'toggle', 'delete'
    if action == 'create':
        name = request.POST.get('name', 'Filial').strip()
        address = request.POST.get('address', '').strip()
        lat = float(request.POST.get('lat', '41.2995') or '41.2995')
        lng = float(request.POST.get('lng', '69.2401') or '69.2401')
        phone = request.POST.get('phone', store.phone)
        hours = request.POST.get('working_hours', '09:00 - 23:00')
        b = Branch.objects.create(store=store, name=name, address=address, latitude=lat, longitude=lng, phone=phone, working_hours=hours)
        return JsonResponse({'success': True, 'branch_id': b.id, 'name': b.name})
    elif action == 'toggle':
        b_id = request.POST.get('branch_id')
        b = get_object_or_404(Branch, id=b_id, store=store)
        b.is_active = not b.is_active
        b.save()
        return JsonResponse({'success': True, 'is_active': b.is_active})
    elif action == 'delete':
        b_id = request.POST.get('branch_id')
        Branch.objects.filter(id=b_id, store=store).delete()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Unknown action'}, status=400)


@login_required
def staff_action_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    store = get_merchant_store(request)
    action = request.POST.get('action')
    if action == 'create':
        name = request.POST.get('name', '').strip()
        phone = request.POST.get('phone', '').strip()
        role = request.POST.get('role', StoreStaff.Roles.MANAGER)
        s = StoreStaff.objects.create(store=store, name=name, phone=phone, role=role)
        return JsonResponse({'success': True, 'staff_id': s.id, 'name': s.name})
    elif action == 'delete':
        s_id = request.POST.get('staff_id')
        StoreStaff.objects.filter(id=s_id, store=store).delete()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Unknown action'}, status=400)


@login_required
def send_chat_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    store = get_merchant_store(request)
    phone = request.POST.get('phone', '').strip()
    msg = request.POST.get('message', '').strip()
    if not phone or not msg:
        return JsonResponse({'error': 'Missing fields'}, status=400)

    clean_phone = phone.replace(' ', '').replace('+', '').strip()
    cust = Customer.objects.filter(store=store).filter(
        Q(phone__icontains=clean_phone) | Q(phone__icontains=phone)
    ).first()

    tg_chat_id = cust.telegram_chat_id if cust and cust.telegram_chat_id else None
    if not tg_chat_id and store.telegram_chat_id:
        tg_chat_id = store.telegram_chat_id

    cm = ChatMessage.objects.create(
        store=store,
        customer_phone=phone,
        customer_name=cust.name if cust else 'Mijoz',
        telegram_chat_id=tg_chat_id,
        sender=ChatMessage.Senders.MERCHANT,
        message=msg
    )

    # Deliver to Telegram
    delivered, err = send_telegram_chat_reply(store, phone, msg)

    return JsonResponse({
        'success': True,
        'message': cm.message,
        'created_at': cm.created_at.strftime('%H:%M'),
        'telegram_delivered': delivered
    })


@login_required
def get_chat_messages_api(request):
    store = get_merchant_store(request)
    phone = request.GET.get('phone', '').strip()
    if not phone:
        return JsonResponse({'messages': []})

    clean_phone = phone.replace(' ', '').replace('+', '').strip()
    messages = ChatMessage.objects.filter(store=store).filter(
        Q(customer_phone__icontains=clean_phone) | Q(customer_phone__icontains=phone)
    ).order_by('created_at')

    # Mark as read
    messages.filter(sender=ChatMessage.Senders.CUSTOMER, is_read=False).update(is_read=True)

    data = []
    for m in messages:
        data.append({
            'id': m.id,
            'sender': m.sender,
            'message': m.message,
            'time': m.created_at.strftime('%H:%M')
        })
    return JsonResponse({'messages': data})


@login_required
def quick_create_store_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    name = request.POST.get('name', '').strip()
    if not name:
        return redirect('dashboard:home')
    b_type = request.POST.get('business_type', Store.BusinessTypes.ONLINE_STORE)

    base_sub = slugify(name) or 'store'
    sub = base_sub
    c = 1
    while Store.objects.filter(subdomain=sub).exists():
        sub = f"{base_sub}-{c}"
        c += 1

    store = Store.objects.create(
        owner=request.user,
        name=name,
        business_type=b_type,
        subdomain=sub,
        is_active=True
    )
    StorePaymentSetting.objects.get_or_create(store=store)
    request.session['merchant_current_store_id'] = store.id
    return redirect('dashboard:home')


@login_required
def switch_store_api(request, store_id):
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    request.session['merchant_current_store_id'] = store.id
    return redirect('dashboard:home')


# -----------------------------------------------------------------
# YES POS INTEGRATION (from mainstore/storebox)
# -----------------------------------------------------------------

@login_required
def yespos_view(request):
    store = get_merchant_store(request)
    if not store:
        return redirect('dashboard:onboarding')

    connection = YesPosConnection.objects.filter(store=store).first()
    linked_products = YesPosProductLink.objects.filter(store=store).select_related('product', 'product__category').order_by('-last_synced_at')
    total_linked = linked_products.count()

    masked_key = ''
    if connection and connection.api_key:
        k = connection.api_key
        if len(k) > 8:
            masked_key = f"{k[:4]}...{k[-4:]}"
        else:
            masked_key = "••••••••"

    return render(request, 'dashboard/platforms/yespos.html', {
        'store': store,
        'connection': connection,
        'is_connected': bool(connection and connection.is_active),
        'linked_products': linked_products,
        'total_linked': total_linked,
        'masked_key': masked_key,
        'currency_code': 'UZS',
    })


@login_required
def yespos_test_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST talab qilinadi'}, status=405)

    try:
        data = json.loads(request.body) if request.body else request.POST
    except Exception:
        data = request.POST

    api_key = data.get('api_key', '').strip()
    if not api_key:
        return JsonResponse({'success': False, 'error': 'API kalit kiritilmagan'}, status=400)

    try:
        client = YesPosClient()
        branches = client.get_branches(api_key)
        return JsonResponse({
            'success': True,
            'branches': branches
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@login_required
def yespos_connect_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST talab qilinadi'}, status=405)

    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'success': False, 'error': "Do'kon topilmadi"}, status=400)

    try:
        data = json.loads(request.body) if request.body else request.POST
    except Exception:
        data = request.POST

    api_key = data.get('api_key', '').strip()
    branch_id = data.get('branch_id', '').strip()
    branch_name = data.get('branch_name', '').strip()

    if not api_key or not branch_id:
        return JsonResponse({'success': False, 'error': 'API kalit va filial tanlanishi shart'}, status=400)

    connection, _ = YesPosConnection.objects.update_or_create(
        store=store,
        defaults={
            'api_key': api_key,
            'branch_id': branch_id,
            'branch_name': branch_name,
            'is_active': True,
            'last_sync_at': timezone.now()
        }
    )

    return JsonResponse({
        'success': True,
        'message': f"YES POS muvaffaqiyatli ulandi: {branch_name or branch_id}",
        'branch_name': connection.branch_name,
        'branch_id': connection.branch_id
    })


@login_required
def yespos_disconnect_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST talab qilinadi'}, status=405)

    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'success': False, 'error': "Do'kon topilmadi"}, status=400)

    connection = YesPosConnection.objects.filter(store=store).first()
    if connection:
        connection.delete()

    return JsonResponse({
        'success': True,
        'message': 'YES POS ulanishi uzildi'
    })


@login_required
def yespos_catalog_api(request):
    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'success': False, 'error': "Do'kon topilmadi"}, status=400)

    connection = YesPosConnection.objects.filter(store=store).first()
    api_key = connection.api_key if connection else request.GET.get('api_key', '').strip()
    branch_id = connection.branch_id if connection else request.GET.get('branch_id', '').strip()

    client = YesPosClient()
    catalog = client.get_catalog(api_key, branch_id)

    # Check which products are already linked
    linked_ids = set(
        YesPosProductLink.objects.filter(store=store).values_list('remote_product_id', flat=True)
    )

    for cat in catalog:
        for p in cat.get('products', []):
            p['is_linked'] = str(p.get('id')) in linked_ids

    return JsonResponse({
        'success': True,
        'categories': catalog
    })


@login_required
def yespos_import_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST talab qilinadi'}, status=405)

    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'success': False, 'error': "Do'kon topilmadi"}, status=400)

    try:
        data = json.loads(request.body) if request.body else request.POST
    except Exception:
        data = request.POST

    items = data.get('items', [])
    if not items:
        return JsonResponse({'success': False, 'error': 'Import qilish uchun tovarlar tanlanmadi'}, status=400)

    client = YesPosClient()
    result = client.import_products(store, items)

    return JsonResponse({
        'success': True,
        'created': result['created'],
        'updated': result['updated'],
        'total': result['total'],
        'message': f"Muvaffaqiyatli import qilindi: {result['created']} yangi, {result['updated']} yangilandi."
    })


@login_required
def yespos_sync_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST talab qilinadi'}, status=405)

    store = get_merchant_store(request)
    if not store:
        return JsonResponse({'success': False, 'error': "Do'kon topilmadi"}, status=400)

    connection = YesPosConnection.objects.filter(store=store).first()
    if not connection or not connection.is_active:
        return JsonResponse({'success': False, 'error': 'YES POS ulanmagan'}, status=400)

    try:
        client = YesPosClient()
        result = client.sync_store_products(store)
        return JsonResponse({
            'success': True,
            'updated': result['updated'],
            'message': f"{result['updated']} ta tovar narxlari va qoldiqlari sinxronlashtirildi."
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
