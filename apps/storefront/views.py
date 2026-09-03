import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.db.models import Q
from django.utils import timezone

from apps.stores.models import Store, Branch
from apps.catalog.models import Category, Product, ProductVariation
from apps.orders.models import Order, OrderItem, PromoCode, Customer
from apps.payments.models import StorePaymentSetting
from apps.telegram_bot.services import send_telegram_notification, format_order_telegram_message


def get_current_store(request, subdomain=None):
    """Helper to get active store from request.store or subdomain param"""
    store = getattr(request, 'store', None)
    if not store and subdomain:
        store = Store.objects.filter(subdomain__iexact=subdomain, is_active=True).first()
    return store


# -----------------------------------------------------------------
# STOREFRONT HOME & CATALOG
# -----------------------------------------------------------------

@xframe_options_exempt
def storefront_home_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        # If on platform root without store, render platform landing directly
        if getattr(request, 'is_platform_root', False):
            from apps.core.views import landing_view
            return landing_view(request)
        raise Http404('Магазин не найден')

    lang = getattr(request, 'language', store.default_language or 'ru')

    categories = Category.objects.filter(store=store, is_active=True).order_by('sort_order', 'id')
    products = Product.objects.filter(store=store, is_active=True).prefetch_related('images', 'variations')

    # Category filter
    cat_slug = request.GET.get('category')
    selected_category = None
    if cat_slug:
        selected_category = categories.filter(slug=cat_slug).first()
        if selected_category:
            products = products.filter(category=selected_category)

    # Search filter
    search_q = request.GET.get('q', '').strip()
    if search_q:
        products = products.filter(
            Q(name_ru__icontains=search_q) |
            Q(name_uz__icontains=search_q) |
            Q(description_ru__icontains=search_q) |
            Q(description_uz__icontains=search_q)
        )

    # Sorting
    sort = request.GET.get('sort', 'default')
    if sort == 'price_asc':
        products = products.order_by('price')
    elif sort == 'price_desc':
        products = products.order_by('-price')
    elif sort == 'newest':
        products = products.order_by('-created_at')
    else:
        products = products.order_by('-is_featured', '-created_at')

    # Telegram Mini App detection
    is_tma = request.GET.get('tma') == '1' or 'Telegram' in request.headers.get('User-Agent', '')

    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    context = {
        'store': store,
        'categories': categories,
        'products': products,
        'selected_category': selected_category,
        'search_q': search_q,
        'sort': sort,
        'lang': lang,
        'is_tma': is_tma,
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'cart_json': json.dumps(cart),
    }
    return render(request, 'storefront/home.html', context)


def product_detail_json_view(request, product_id):
    """API endpoint for instant product modal details & variations"""
    product = get_object_or_404(Product, id=product_id, is_active=True)
    lang = getattr(request, 'language', 'ru')

    variations_data = []
    for v in product.variations.filter(is_active=True):
        variations_data.append({
            'id': v.id,
            'name': v.get_name(lang),
            'price': float(v.price),
            'stock': v.stock,
            'in_stock': v.stock > 0
        })

    images_data = [img.image.url for img in product.images.all() if img.image]
    if not images_data and product.primary_image_url:
        images_data = [product.primary_image_url]

    data = {
        'id': product.id,
        'name': product.get_name(lang),
        'description': product.get_description(lang),
        'price': float(product.price),
        'old_price': float(product.old_price) if product.old_price else None,
        'discount_percent': product.discount_percent,
        'in_stock': product.is_in_stock,
        'images': images_data,
        'variations': variations_data,
    }
    return JsonResponse(data)


# -----------------------------------------------------------------
# CART SESSION OPERATIONS
# -----------------------------------------------------------------

@csrf_exempt
def cart_add_view(request, subdomain=None):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id')
    variation_id = data.get('variation_id')
    quantity = int(data.get('quantity', 1))

    product = get_object_or_404(Product, id=product_id, is_active=True)
    variation = None
    if variation_id:
        variation = product.variations.filter(id=variation_id, is_active=True).first()

    cart = request.session.get('cart', {})
    item_key = f"{product.id}_{variation.id if variation else 0}"

    unit_price = float(variation.price if variation else product.price)
    lang = getattr(request, 'language', 'ru')
    name = product.get_name(lang)
    var_name = variation.get_name(lang) if variation else ''

    if item_key in cart:
        cart[item_key]['quantity'] += quantity
        cart[item_key]['total_price'] = cart[item_key]['quantity'] * unit_price
    else:
        cart[item_key] = {
            'product_id': product.id,
            'variation_id': variation.id if variation else None,
            'name': name,
            'variation_name': var_name,
            'unit_price': unit_price,
            'quantity': quantity,
            'total_price': quantity * unit_price,
            'image_url': product.primary_image_url or '',
        }

    request.session['cart'] = cart
    request.session.modified = True

    total_count = sum(item['quantity'] for item in cart.values())
    subtotal = sum(item['total_price'] for item in cart.values())

    return JsonResponse({
        'success': True,
        'cart_count': total_count,
        'subtotal': subtotal,
        'cart': cart
    })


@csrf_exempt
def cart_update_view(request, subdomain=None):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    item_key = data.get('item_key')
    action = data.get('action') # 'increase', 'decrease', 'remove'

    cart = request.session.get('cart', {})
    if item_key in cart:
        if action == 'increase':
            cart[item_key]['quantity'] += 1
            cart[item_key]['total_price'] = cart[item_key]['quantity'] * cart[item_key]['unit_price']
        elif action == 'decrease':
            cart[item_key]['quantity'] -= 1
            if cart[item_key]['quantity'] <= 0:
                del cart[item_key]
            else:
                cart[item_key]['total_price'] = cart[item_key]['quantity'] * cart[item_key]['unit_price']
        elif action == 'remove':
            del cart[item_key]

    request.session['cart'] = cart
    request.session.modified = True

    total_count = sum(item['quantity'] for item in cart.values())
    subtotal = sum(item['total_price'] for item in cart.values())

    return JsonResponse({
        'success': True,
        'cart_count': total_count,
        'subtotal': subtotal,
        'cart': cart
    })


@csrf_exempt
def cart_clear_view(request, subdomain=None):
    request.session['cart'] = {}
    request.session.modified = True
    return JsonResponse({'success': True, 'cart_count': 0, 'subtotal': 0, 'cart': {}})


def apply_promo_view(request, subdomain=None):
    store = getattr(request, 'store', None)
    if not store:
        subdomain = request.GET.get('subdomain') or request.session.get('current_store_subdomain')
        if subdomain:
            store = Store.objects.filter(subdomain__iexact=subdomain, is_active=True).first()
    if not store:
        return JsonResponse({'success': False, 'message': 'Магазин не найден'})

    code = request.GET.get('code', '').strip().upper()
    cart = request.session.get('cart', {})
    subtotal = sum(item['total_price'] for item in cart.values())

    promo = PromoCode.objects.filter(store=store, code=code).first()
    if not promo:
        return JsonResponse({'success': False, 'message': 'Промокод не найден'})

    is_valid, msg = promo.is_valid(subtotal)
    if not is_valid:
        return JsonResponse({'success': False, 'message': msg})

    discount = promo.calculate_discount(subtotal)
    return JsonResponse({
        'success': True,
        'discount': float(discount),
        'code': promo.code,
        'message': f'Промокод применен: скидка {int(discount):,} UZS'
    })


# -----------------------------------------------------------------
# CHECKOUT & ORDER PLACEMENT
# -----------------------------------------------------------------

@xframe_options_exempt
def checkout_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404('Магазин не найден')

    cart = request.session.get('cart', {})
    subtotal = Decimal(str(sum(item['total_price'] for item in cart.values()))) if cart else Decimal('0')
    error = None

    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    lang = getattr(request, 'language', 'ru')

    # Calculate default delivery fee
    if subtotal >= store.free_delivery_threshold:
        default_delivery_fee = Decimal('0')
    else:
        default_delivery_fee = store.delivery_price

    if request.method == 'POST':
        customer_name = request.POST.get('customer_name', '').strip()
        customer_phone = request.POST.get('customer_phone', '').strip()
        delivery_method = request.POST.get('delivery_method', Order.DeliveryMethods.COURIER)
        delivery_city = request.POST.get('delivery_city', 'Ташкент').strip()
        delivery_address = request.POST.get('delivery_address', '').strip()
        payment_method = request.POST.get('payment_method', Order.PaymentMethods.CASH)
        notes = request.POST.get('notes', '').strip()
        promo_code_str = request.POST.get('promo_code', '').strip().upper()
        telegram_user_id = request.POST.get('telegram_user_id')

        if not customer_name or not customer_phone:
            error = 'Пожалуйста, укажите ваше имя и номер телефона'
        elif delivery_method == Order.DeliveryMethods.COURIER and not delivery_address:
            error = 'Пожалуйста, укажите адрес доставки'
        else:
            # Promo calculation
            discount_amount = Decimal('0')
            promo_obj = None
            if promo_code_str:
                promo_candidate = PromoCode.objects.filter(store=store, code=promo_code_str).first()
                if promo_candidate:
                    valid, _ = promo_candidate.is_valid(subtotal)
                    if valid:
                        discount_amount = promo_candidate.calculate_discount(subtotal)
                        promo_obj = promo_candidate
                        promo_candidate.times_used += 1
                        promo_candidate.save()

            # Delivery fee calculation
            if delivery_method == Order.DeliveryMethods.PICKUP:
                delivery_fee = Decimal('0')
            else:
                if subtotal >= store.free_delivery_threshold:
                    delivery_fee = Decimal('0')
                else:
                    delivery_fee = store.delivery_price

            total_amount = max(Decimal('0'), subtotal - discount_amount + delivery_fee)

            # Detect source
            source = Order.Sources.WEB
            if telegram_user_id or request.POST.get('is_tma') == '1':
                source = Order.Sources.TELEGRAM_MINI_APP

            branch_id = request.POST.get('branch_id')
            branch = Branch.objects.filter(id=branch_id, store=store).first() if branch_id else None
            delivery_lat = float(request.POST.get('delivery_lat')) if request.POST.get('delivery_lat') else None
            delivery_lng = float(request.POST.get('delivery_lng')) if request.POST.get('delivery_lng') else None

            order_number = Order.generate_order_number()
            order = Order.objects.create(
                store=store,
                branch=branch,
                order_number=order_number,
                customer_name=customer_name,
                customer_phone=customer_phone,
                delivery_method=delivery_method,
                delivery_city=delivery_city,
                delivery_address=delivery_address,
                delivery_lat=delivery_lat,
                delivery_lng=delivery_lng,
                delivery_fee=delivery_fee,
                notes=notes,
                promo_code=promo_obj,
                discount_amount=discount_amount,
                subtotal=subtotal,
                total_amount=total_amount,
                payment_method=payment_method,
                payment_status=Order.PaymentStatuses.PENDING,
                status=Order.OrderStatuses.NEW,
                telegram_user_id=int(telegram_user_id) if telegram_user_id and telegram_user_id.isdigit() else None,
                source=source
            )

            # Update or create Customer CRM record
            customer, _ = Customer.objects.get_or_create(
                store=store,
                phone=customer_phone,
                defaults={'name': customer_name}
            )
            customer.name = customer_name
            customer.orders_count += 1
            customer.total_spent += total_amount
            customer.last_order_at = timezone.now()
            # 3% cashback bonus accrual
            customer.bonus_balance += int(total_amount * Decimal('0.03'))
            customer.save()

            order.customer = customer
            order.save(update_fields=['customer'])

            # Create OrderItems and decrease inventory stock
            for item in cart.values():
                p_id = item.get('product_id')
                v_id = item.get('variation_id')
                qty = item.get('quantity', 1)
                u_price = Decimal(str(item.get('unit_price', 0)))
                t_price = Decimal(str(item.get('total_price', 0)))

                product = Product.objects.filter(id=p_id).first()
                variation = ProductVariation.objects.filter(id=v_id).first() if v_id else None

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variation=variation,
                    product_name=item.get('name', 'Товар'),
                    variation_name=item.get('variation_name', ''),
                    unit_price=u_price,
                    quantity=qty,
                    total_price=t_price
                )

                # Inventory decrement
                if variation:
                    variation.stock = max(0, variation.stock - qty)
                    variation.save()
                elif product and product.track_stock:
                    product.stock = max(0, product.stock - qty)
                    product.save()

            # Clear cart and remember customer
            request.session['cart'] = {}
            request.session['customer_phone'] = customer_phone
            request.session['customer_name'] = customer_name
            request.session.modified = True

            # Send Telegram Alert to Merchant
            tg_message = format_order_telegram_message(order)
            send_telegram_notification(store, tg_message)

            return redirect(f'/order/{order.order_number}/success/')

    is_tma = request.GET.get('tma') == '1'
    branches = store.branches.filter(is_active=True)
    saved_phone = request.session.get('customer_phone', '')
    saved_name = request.session.get('customer_name', '')
    return render(request, 'storefront/checkout.html', {
        'store': store,
        'cart': cart,
        'subtotal': subtotal,
        'delivery_price': store.delivery_price,
        'free_delivery_threshold': store.free_delivery_threshold,
        'default_delivery_fee': default_delivery_fee,
        'pay_settings': pay_settings,
        'branches': branches,
        'error': error,
        'lang': lang,
        'is_tma': is_tma,
        'saved_phone': saved_phone,
        'saved_name': saved_name
    })


@xframe_options_exempt
def order_success_view(request, order_number):
    order = get_object_or_404(Order, order_number=order_number)
    store = order.store
    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)

    return render(request, 'storefront/order_success.html', {
        'order': order,
        'store': store,
        'pay_settings': pay_settings,
        'is_just_paid': request.GET.get('paid') == '1'
    })


# -----------------------------------------------------------------
# CUSTOMER PROFILE & ORDERS API (Video ikkinchi.mov 00:37 - 00:55)
# -----------------------------------------------------------------

@csrf_exempt
def customer_login_api(request, subdomain=None):
    """Log in customer by phone number, create/fetch CRM record and session"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'error': 'Do\'kon topilmadi'}, status=404)

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8')) if request.body else request.POST
        except Exception:
            data = request.POST

        phone = (data.get('phone') or '').strip()
        name = (data.get('name') or '').strip()

        if not phone:
            return JsonResponse({'success': False, 'error': 'Telefon raqamini kiriting'}, status=400)

        # Normalize phone
        clean_phone = phone.replace(' ', '').replace('-', '')
        if not clean_phone.startswith('+'):
            if clean_phone.startswith('998'):
                clean_phone = '+' + clean_phone
            elif len(clean_phone) == 9:
                clean_phone = '+998' + clean_phone

        customer, created = Customer.objects.get_or_create(
            store=store,
            phone=clean_phone,
            defaults={'name': name or 'Xaridor'}
        )
        if name and customer.name != name:
            customer.name = name
            customer.save(update_fields=['name'])

        request.session['customer_phone'] = clean_phone
        request.session['customer_name'] = customer.name
        request.session.modified = True

        orders = Order.objects.filter(store=store).filter(
            Q(customer_phone=phone) | Q(customer_phone=clean_phone) | Q(customer=customer)
        )
        return JsonResponse({
            'success': True,
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'phone': customer.phone,
                'orders_count': orders.count(),
                'bonus_balance': customer.bonus_balance
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


def customer_orders_api(request, subdomain=None):
    """Fetch order history for customer by phone or session"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'error': 'Do\'kon topilmadi'}, status=404)

    phone = request.GET.get('phone', '').strip() or request.session.get('customer_phone', '').strip()
    if not phone:
        return JsonResponse({'success': True, 'orders': [], 'count': 0})

    clean_phone = phone.replace(' ', '').replace('-', '')
    orders_qs = Order.objects.filter(
        store=store
    ).filter(
        Q(customer_phone=phone) | Q(customer_phone=clean_phone) | Q(customer__phone=clean_phone)
    ).prefetch_related('items', 'items__product', 'items__product__images').order_by('-created_at')

    status_colors = {
        'NEW': 'amber',
        'PROCESSING': 'blue',
        'READY': 'cyan',
        'IN_DELIVERY': 'purple',
        'COMPLETED': 'emerald',
        'CANCELLED': 'rose'
    }

    orders_data = []
    for o in orders_qs:
        items_list = []
        for it in o.items.all():
            img_url = None
            if it.product and it.product.images.exists():
                img_url = it.product.images.first().image.url
            items_list.append({
                'product_name': it.product_name,
                'variation_name': it.variation_name,
                'quantity': it.quantity,
                'unit_price': float(it.unit_price),
                'total_price': float(it.total_price),
                'image': img_url
            })

        orders_data.append({
            'id': o.id,
            'order_number': o.order_number,
            'status': o.status,
            'status_display': o.get_status_display(),
            'status_color': status_colors.get(o.status, 'slate'),
            'total_amount': float(o.total_amount),
            'items_count': o.items.count(),
            'delivery_method_display': o.get_delivery_method_display(),
            'delivery_city': o.delivery_city,
            'delivery_address': o.delivery_address,
            'payment_method_display': o.get_payment_method_display(),
            'payment_status_display': o.get_payment_status_display(),
            'created_at': o.created_at.strftime('%d.%m.%Y, %H:%M'),
            'notes': o.notes,
            'items': items_list
        })

    return JsonResponse({
        'success': True,
        'orders': orders_data,
        'count': len(orders_data)
    })


@csrf_exempt
def customer_logout_api(request, subdomain=None):
    """Log out customer from storefront session"""
    request.session.pop('customer_phone', None)
    request.session.pop('customer_name', None)
    request.session.modified = True
    return JsonResponse({'success': True})


# -----------------------------------------------------------------
# DEDICATED PRODUCT DETAIL PAGE (Full e-commerce experience)
# -----------------------------------------------------------------

@xframe_options_exempt
def product_detail_page_view(request, product_id, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404("Магазин не найден")

    product = get_object_or_404(Product, id=product_id, store=store, is_active=True)
    lang = getattr(request, 'language', 'ru')

    # Cart context
    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    # Check if this product is already in cart
    in_cart_qty = 0
    for k, item in cart.items():
        if item.get('product_id') == product.id and not item.get('variation_id'):
            in_cart_qty = item.get('quantity', 0)
            break

    # Related products from same category or store
    related_products = []
    if product.category:
        related_products = Product.objects.filter(
            store=store,
            category=product.category,
            is_active=True
        ).exclude(id=product.id)[:8]
    if not related_products:
        related_products = Product.objects.filter(
            store=store,
            is_active=True
        ).exclude(id=product.id)[:8]

    # Payment & branches settings
    pay_settings, _ = StorePaymentSetting.objects.get_or_create(store=store)
    branches = store.branches.filter(is_active=True)

    context = {
        'store': store,
        'product': product,
        'related_products': related_products,
        'variations': product.variations.filter(is_active=True),
        'images': product.images.all(),
        'in_cart_qty': in_cart_qty,
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'cart_json': json.dumps(cart),
        'pay_settings': pay_settings,
        'branches': branches,
        'lang': lang,
        'is_tma': request.GET.get('tma') == '1' or getattr(request, 'is_tma', False),
    }
    return render(request, 'storefront/product_detail.html', context)


# -----------------------------------------------------------------
# DEDICATED CUSTOMER PROFILE & ORDERS PAGE
# -----------------------------------------------------------------

@xframe_options_exempt
def customer_profile_page_view(request, subdomain=None):
    store = get_current_store(request, subdomain)
    if not store:
        raise Http404("Магазин не найден")

    # Handle login POST from profile page if guest
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'login':
            phone = request.POST.get('phone', '').strip()
            name = request.POST.get('name', '').strip()
            if phone:
                request.session['customer_phone'] = phone
                if name:
                    request.session['customer_name'] = name
                request.session.modified = True
                customer, _ = Customer.objects.get_or_create(
                    store=store,
                    phone=phone,
                    defaults={'name': name or 'Xaridor'}
                )
                if name and not customer.name:
                    customer.name = name
                    customer.save(update_fields=['name'])
        elif action == 'logout':
            request.session.pop('customer_phone', None)
            request.session.pop('customer_name', None)
            request.session.modified = True

    customer_phone = request.session.get('customer_phone')
    customer_name = request.session.get('customer_name')
    customer = None
    orders = []

    if customer_phone:
        customer = Customer.objects.filter(store=store, phone=customer_phone).first()
        if customer:
            orders = Order.objects.filter(store=store, customer=customer).prefetch_related('items').order_by('-created_at')
            if not customer_name:
                customer_name = customer.name
        else:
            orders = Order.objects.filter(store=store, customer_phone=customer_phone).prefetch_related('items').order_by('-created_at')

    # Cart context
    cart = request.session.get('cart', {})
    cart_count = sum(item.get('quantity', 1) for item in cart.values())
    subtotal = sum(item.get('total_price', 0) for item in cart.values())

    context = {
        'store': store,
        'customer': customer,
        'customer_phone': customer_phone,
        'customer_name': customer_name or 'Xaridor',
        'orders': orders,
        'orders_count': len(orders),
        'cart': cart,
        'cart_count': cart_count,
        'cart_subtotal': subtotal,
        'cart_json': json.dumps(cart),
        'is_tma': request.GET.get('tma') == '1' or getattr(request, 'is_tma', False),
    }
    return render(request, 'storefront/customer_profile.html', context)


@csrf_exempt
def reorder_api(request, order_number, subdomain=None):
    """Reorder items from an existing order into session cart"""
    store = get_current_store(request, subdomain)
    if not store:
        return JsonResponse({'success': False, 'message': 'Магазин не найден'})

    order = get_object_or_404(Order, order_number=order_number, store=store)
    cart = request.session.get('cart', {})

    for item in order.items.all():
        item_key = f"p_{item.product_id}_v_{item.variation_id or 0}"
        u_price = float(item.unit_price)
        qty = item.quantity
        img_url = item.product.primary_image_url if item.product else None

        cart[item_key] = {
            'product_id': item.product_id,
            'variation_id': item.variation_id,
            'name': item.product_name,
            'variation_name': item.variation_name,
            'unit_price': u_price,
            'quantity': qty,
            'total_price': u_price * qty,
            'image_url': img_url
        }

    request.session['cart'] = cart
    request.session.modified = True

    redirect_url = f'/store/{store.subdomain}/checkout/' if subdomain else '/checkout/'
    return JsonResponse({
        'success': True,
        'redirect_url': redirect_url,
        'cart_count': sum(i['quantity'] for i in cart.values()),
        'subtotal': sum(i['total_price'] for i in cart.values())
    })

