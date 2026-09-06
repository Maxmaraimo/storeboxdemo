import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def get_bot_info(token):
    """Fetch bot details from Telegram getMe"""
    if not token:
        return False, 'Bot tokeni kiritilmagan'
    url = f'https://api.telegram.org/bot{token.strip()}/getMe'
    try:
        res = requests.get(url, timeout=7)
        data = res.json()
        if data.get('ok'):
            return True, data.get('result', {})
        return False, data.get('description', 'Telegram API xatoligi')
    except Exception as e:
        logger.error(f"Error fetching getMe for bot: {e}")
        return False, str(e)


def send_telegram_notification(store, text, reply_markup=None, chat_id=None):
    """Send HTML message to store telegram chat or specified chat_id"""
    if not store:
        return False, 'Do\'kon ko\'rsatilmagan'

    token = (store.telegram_bot_token or '').strip()
    target_chat_id = str(chat_id or store.telegram_chat_id or '').strip()

    if not token or not target_chat_id:
        logger.info(f'Telegram bildirishnomasi o\'tkazib yuborildi: {store.name} do\'konida bot yoki chat ID yo\'q')
        return False, 'Bot yoki chat ID sozlanmagan'

    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = {
        'chat_id': target_chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True
    }
    if reply_markup:
        payload['reply_markup'] = reply_markup

    try:
        response = requests.post(url, json=payload, timeout=7)
        res_data = response.json()
        if res_data.get('ok'):
            return True, 'Уведомление успешно отправлено'
        else:
            err_desc = res_data.get('description', 'Ошибка Telegram API')
            logger.warning(f'Telegram error for store {store.name}: {err_desc}')
            return False, err_desc
    except Exception as e:
        logger.error(f'Ошибка отправки Telegram сообщения: {e}')
        return False, str(e)


def format_order_telegram_message(order):
    """Format full order alert for merchant's Telegram group or private chat"""
    store_name = order.store.name
    items_text = []
    for item in order.items.all():
        var_suffix = f' ({item.variation_name})' if item.variation_name else ''
        items_text.append(
            f'• <b>{item.product_name}{var_suffix}</b> x{item.quantity} — {int(item.total_price):,} UZS'
        )

    items_block = '\n'.join(items_text) if items_text else '• (Bo\'sh)'

    delivery_title = order.get_delivery_method_display()
    delivery_details = f'{order.delivery_city}, {order.delivery_address}' if order.delivery_address else 'Do\'kondan olib ketish'
    if order.delivery_fee > 0:
        delivery_details += f' (+{int(order.delivery_fee):,} UZS)'
    if order.delivery_lat and order.delivery_lng:
        delivery_details += f"\n🗺 <b>Xarita:</b> <a href='https://yandex.com/maps/?pt={order.delivery_lng},{order.delivery_lat}&z=17&l=map'>Yandex Xarita</a> | <a href='https://maps.google.com/?q={order.delivery_lat},{order.delivery_lng}'>Google Xarita</a>"

    discount_line = ''
    if order.discount_amount > 0:
        code_str = f' [{order.promo_code.code}]' if order.promo_code else ''
        discount_line = f'\n🎟 <b>Chegirma{code_str}:</b> -{int(order.discount_amount):,} UZS'

    notes_line = ''
    if order.notes:
        notes_line = f'\n💬 <b>Izoh:</b> {order.notes}'

    src_label = '📱 Telegram Mini App' if order.source == 'TMA' else '🌐 Veb-sayt'

    msg = (
        f"🔔 <b>YANGI BUYURTMA #{order.order_number}</b>\n"
        f"🏪 <b>Do'kon:</b> {store_name}\n"
        f"📍 <b>Manba:</b> {src_label}\n\n"
        f"👤 <b>Xaridor:</b> {order.customer_name}\n"
        f"📞 <b>Telefon:</b> <code>{order.customer_phone}</code>\n\n"
        f"🚚 <b>Yetkazib berish:</b> {delivery_title}\n"
        f"📍 <b>Manzil:</b> {delivery_details}{notes_line}\n\n"
        f"📦 <b>Buyurtma tarkibi:</b>\n{items_block}{discount_line}\n\n"
        f"💰 <b>JAMI TO'LOV:</b> <b>{int(order.total_amount):,} UZS</b>\n"
        f"💳 <b>To'lov turi:</b> {order.get_payment_method_display()} (Holati: <b>{order.get_payment_status_display()}</b>)"
    )
    return msg.strip()


def test_bot_connection(token, chat_id):
    """Test bot connection and deliver test alert"""
    if not token or not chat_id:
        return False, 'Bot tokeni va Chat ID maydonlarini to\'ldiring'

    url = f'https://api.telegram.org/bot{token.strip()}/sendMessage'
    payload = {
        'chat_id': str(chat_id).strip(),
        'text': '🚀 <b>StoreBox Bot:</b> Do\'kon bilan aloqa muvaffaqiyatli o\'rnatildi! Barcha yangi buyurtmalar ushbu chatga yuboriladi.',
        'parse_mode': 'HTML'
    }
    try:
        res = requests.post(url, json=payload, timeout=7)
        data = res.json()
        if data.get('ok'):
            return True, 'Sinov xabari Telegramga muvaffaqiyatli yetkazildi!'
        return False, data.get('description', 'Telegram API xatoligi')
    except Exception as e:
        return False, str(e)


def get_store_webapp_url(store):
    """Resolve active public HTTPS WebApp URL for Telegram"""
    if store.custom_domain:
        return f"https://{store.custom_domain}/store/{store.subdomain}/?tma=1"

    from .tunnel import get_public_https_base_url
    base = get_public_https_base_url()
    return f"{base}/store/{store.subdomain}/?tma=1"


def setup_bot_menu_button(token, web_app_url=None, button_text="Do'kon"):
    """Setup Telegram Mini App menu button via setChatMenuButton"""
    if not token:
        return False, 'Bot tokeni ko\'rsatilmagan'

    url = f'https://api.telegram.org/bot{token.strip()}/setChatMenuButton'

    # Ensure URL is HTTPS for Telegram
    target_url = web_app_url
    if not target_url or not target_url.startswith('https://'):
        from .tunnel import get_public_https_base_url
        base = get_public_https_base_url()
        sub_part = target_url.replace('http://127.0.0.1:8000', '').replace('http://localhost:8000', '') if target_url else ''
        target_url = f"{base}{sub_part}" if sub_part else f"{base}/"

    payload = {
        'menu_button': {
            'type': 'web_app',
            'text': button_text or "Do'kon",
            'web_app': {'url': target_url}
        }
    }

    try:
        res = requests.post(url, json=payload, timeout=7)
        data = res.json()
        if data.get('ok'):
            return True, "Telegram WebApp menyu tugmasi muvaffaqiyatli sozlandi!"
        return False, data.get('description', 'Telegram API xatoligi')
    except Exception as e:
        return False, str(e)


def process_telegram_update(store, update):
    """Process incoming Telegram update (message, command, callback query)"""
    token = (store.telegram_bot_token or '').strip()
    if not token:
        return False

    callback_query = update.get('callback_query')
    message = update.get('message') or update.get('edited_message') or {}

    web_app_url = get_store_webapp_url(store)
    btn_name = store.telegram_button_name or "Do'kon"

    if callback_query:
        msg_obj = callback_query.get('message') or {}
        chat_id = msg_obj.get('chat', {}).get('id')
        data = callback_query.get('data') or ''
        cq_id = callback_query.get('id')

        try:
            requests.post(f'https://api.telegram.org/bot{token}/answerCallbackQuery', json={'callback_query_id': cq_id}, timeout=3)
        except Exception:
            pass

        if data == 'about':
            desc = store.description_uz or store.about_us_uz or store.seo_description or "Do'konimizga xush kelibsiz!"
            hours = store.working_hours or "Dushanba - Yakshanba: 10:00 - 23:59"
            addr = store.address or "Toshkent sh."
            ph = store.phone or "+998"
            about_text = (
                f"🏪 <b>{store.name}</b>\n\n"
                f"{desc}\n\n"
                f"🕒 <b>Ish vaqti:</b> {hours}\n"
                f"📍 <b>Manzil:</b> {addr}\n"
                f"📞 <b>Telefon:</b> {ph}"
            )
            send_telegram_notification(store, about_text, chat_id=chat_id)
            return True
        elif data == 'contact':
            contact_text = (
                f"📞 <b>Biz bilan bog'lanish:</b>\n\n"
                f"Do'kon: <b>{store.name}</b>\n"
                f"Telefon: <b>{store.phone or '+998'}</b>\n"
                f"Telegram bot: @{store.telegram_bot_username or 'admin'}"
            )
            send_telegram_notification(store, contact_text, chat_id=chat_id)
            return True
        elif data == 'my_orders':
            orders = store.orders.order_by('-created_at')[:5]
            if not orders.exists():
                send_telegram_notification(store, "📦 Sizda hali buyurtmalar mavjud emas.", chat_id=chat_id)
            else:
                lines = ["📦 <b>Oxirgi buyurtmalaringiz:</b>\n"]
                for o in orders:
                    lines.append(f"• <b>#{o.order_number}</b> ({o.get_status_display()}) — {int(o.total_amount):,} UZS")
                send_telegram_notification(store, "\n".join(lines), chat_id=chat_id)
            return True
        elif data.startswith('set_lang_'):
            lang_code = data.replace('set_lang_', '')
            lang_names = {'uz': "O'zbek tili", 'ru': "Русский язык", 'en': "English"}
            selected = lang_names.get(lang_code, "Tanlandi")
            send_telegram_notification(store, f"✅ Til muvaffaqiyatli tanlandi: <b>{selected}</b>", chat_id=chat_id)
            return True

    if not message:
        return False

    chat = message.get('chat') or {}
    chat_id = chat.get('id')
    from_user = message.get('from') or {}
    user_first_name = from_user.get('first_name', 'Xaridor')
    text = (message.get('text') or '').strip()

    if not chat_id:
        return False

    # Auto-bind merchant chat ID if not set
    if not store.telegram_chat_id:
        store.telegram_chat_id = str(chat_id)
        store.save(update_fields=['telegram_chat_id'])

    if text.startswith('/start') or text.startswith('/menu') or text.lower() in ("do'kon", "menyu"):
        welcome_template = store.telegram_welcome_message or "Assalomu alaykum {user}! {bot} botiga xush kelibsiz! 🍷\n\nQuyidagi tugma orqali katalogimizni ko'rishingiz va buyurtma berishingiz mumkin:"
        welcome_text = welcome_template.replace('{user}', user_first_name).replace('{bot}', store.name)

        # 1. Inline Buttons (with WebApp)
        inline_keyboard = [
            [
                {'text': f"🛍 {btn_name} (Katalog)", 'web_app': {'url': web_app_url}}
            ],
            [
                {'text': "📦 Buyurtmalarim", 'callback_data': 'my_orders'},
                {'text': "ℹ️ Biz haqimizda", 'callback_data': 'about'}
            ],
            [
                {'text': "📞 Aloqa", 'callback_data': 'contact'}
            ]
        ]

        # 2. Permanent Reply Keyboard (RoboSell Video vtoroy_01.jpg)
        reply_keyboard = {
            'keyboard': [
                [
                    {'text': f"{btn_name} 🛍", 'web_app': {'url': web_app_url}}
                ],
                [
                    {'text': "🌐 Tilni o'zgartirish"},
                    {'text': "💬 Chat"}
                ]
            ],
            'resize_keyboard': True
        }

        send_telegram_notification(store, welcome_text, reply_markup=reply_keyboard, chat_id=chat_id)
        return True

    elif text == "🌐 Tilni o'zgartirish":
        lang_text = "Iltimos, o'zingizga qulay tilni tanlang:\nПожалуйста, выберите удобный язык:"
        lang_keyboard = {
            'inline_keyboard': [
                [
                    {'text': "🇺🇿 O'zbekcha", 'callback_data': 'set_lang_uz'},
                    {'text': "🇷🇺 Русский", 'callback_data': 'set_lang_ru'},
                    {'text': "🇬🇧 English", 'callback_data': 'set_lang_en'}
                ]
            ]
        }
        send_telegram_notification(store, lang_text, reply_markup=lang_keyboard, chat_id=chat_id)
        return True

    elif text == "💬 Chat":
        chat_msg = (
            f"💬 <b>Do'kon ma'muriyati bilan chat:</b>\n\n"
            f"Savollaringiz yoki takliflaringiz bo'lsa, xabaringizni to'g'ridan-to'g'ri shu yerga yozib qoldiring. Tez orada operator javob beradi!"
        )
        send_telegram_notification(store, chat_msg, chat_id=chat_id)
        return True

    elif text in ('/id', '/chatid', '/myid'):
        id_msg = (
            f"Sizning Telegram Chat ID raqamingiz: <code>{chat_id}</code>\n\n"
            f"Ushbu raqamni StoreBox boshqaruv panelidagi 'Telegram Chat ID' maydoniga kiritishingiz mumkin."
        )
        send_telegram_notification(store, id_msg, chat_id=chat_id)
        return True

    elif text in ('/about', 'Biz haqimizda'):
        desc = store.description_uz or store.about_us_uz or store.seo_description or "Do'konimizga xush kelibsiz!"
        hours = store.working_hours or "Dushanba - Yakshanba: 10:00 - 23:59"
        addr = store.address or "Toshkent sh."
        ph = store.phone or "+998"
        about_text = (
            f"🏪 <b>{store.name}</b>\n\n"
            f"{desc}\n\n"
            f"🕒 <b>Ish vaqti:</b> {hours}\n"
            f"📍 <b>Manzil:</b> {addr}\n"
            f"📞 <b>Telefon:</b> {ph}"
        )
        send_telegram_notification(store, about_text, chat_id=chat_id)
        return True

    elif text in ('/contact', 'Aloqa'):
        contact_text = (
            f"📞 <b>Aloqa ma'lumotlari:</b>\n\n"
            f"Do'kon: <b>{store.name}</b>\n"
            f"Telefon: <b>{store.phone or '+998'}</b>\n"
            f"Telegram bot: @{store.telegram_bot_username or 'bot'}"
        )
        send_telegram_notification(store, contact_text, chat_id=chat_id)
        return True

    # Contact sharing handler
    contact = message.get('contact')
    if contact:
        phone_num = (contact.get('phone_number') or '').strip()
        if phone_num:
            if not phone_num.startswith('+'):
                phone_num = '+' + phone_num
            from apps.orders.models import Customer
            from django.db.models import Q
            clean_p = phone_num.replace(' ', '').replace('+', '').strip()
            cust = Customer.objects.filter(store=store).filter(
                Q(phone__icontains=clean_p) | Q(phone__icontains=phone_num)
            ).first()
            if not cust:
                cust = Customer.objects.create(
                    store=store,
                    name=user_first_name,
                    phone=phone_num,
                    telegram_chat_id=str(chat_id)
                )
            else:
                cust.telegram_chat_id = str(chat_id)
                cust.save(update_fields=['telegram_chat_id'])
            send_telegram_notification(store, f"✅ Rahmat! Telefon raqamingiz ({phone_num}) saqlandi.", chat_id=chat_id)
            return True

    # General incoming text message from customer -> save to ChatMessage
    if text:
        from apps.orders.models import Customer, Order, ChatMessage
        from django.db.models import Q

        cust = Customer.objects.filter(store=store, telegram_chat_id=str(chat_id)).first()
        if not cust:
            ord_obj = Order.objects.filter(store=store, telegram_user_id=chat_id).order_by('-created_at').first()
            if ord_obj:
                cust = Customer.objects.filter(store=store, phone=ord_obj.customer_phone).first()
                if cust:
                    cust.telegram_chat_id = str(chat_id)
                    cust.save(update_fields=['telegram_chat_id'])

        if not cust and store.telegram_chat_id == str(chat_id):
            cust = Customer.objects.filter(store=store).order_by('-created_at').first()
            if cust:
                cust.telegram_chat_id = str(chat_id)
                cust.save(update_fields=['telegram_chat_id'])

        cust_phone = cust.phone if cust else f"+998 (TG:{chat_id})"
        cust_name = cust.name if cust else user_first_name

        ChatMessage.objects.create(
            store=store,
            customer_phone=cust_phone,
            customer_name=cust_name,
            telegram_chat_id=str(chat_id),
            sender=ChatMessage.Senders.CUSTOMER,
            message=text,
            is_read=False
        )

        ack_text = "✅ <b>Xabaringiz do'kon ma'muriyatiga yetkazildi!</b>\nOperator tez orada javob beradi."
        send_telegram_notification(store, ack_text, chat_id=chat_id)
        return True

    return False


def send_telegram_welcome(token, chat_id, welcome_text, web_app_url):
    """Legacy helper for sending welcome message with button"""
    if not token or not chat_id:
        return False
    keyboard = [
        [
            {'text': "🛍 Do'konga kirish (Katalog)", 'url': web_app_url}
        ]
    ]
    url = f'https://api.telegram.org/bot{token.strip()}/sendMessage'
    payload = {
        'chat_id': str(chat_id).strip(),
        'text': welcome_text,
        'parse_mode': 'HTML',
        'reply_markup': {'inline_keyboard': keyboard}
    }
    try:
        res = requests.post(url, json=payload, timeout=7)
        return res.json().get('ok', False)
    except Exception:
        return False

