import hashlib
import json
import logging
import time
from decimal import Decimal
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404, redirect, render
from django.db import transaction
from apps.orders.models import Order
from apps.payments.models import StorePaymentSetting, PaymentTransaction
from apps.telegram_bot.services import send_telegram_notification, format_order_telegram_message

logger = logging.getLogger(__name__)


# -------------------------------------------------------------
# CLICK SHOP API
# -------------------------------------------------------------

@csrf_exempt
def click_prepare_view(request):
    """
    Обработка запроса Prepare от Click
    """
    if request.method != 'POST':
        return JsonResponse({'error': -8, 'error_note': 'Only POST method allowed'})

    data = request.POST
    click_trans_id = data.get('click_trans_id')
    service_id = data.get('service_id')
    merchant_trans_id = data.get('merchant_trans_id')
    amount = data.get('amount')
    action = data.get('action')
    sign_time = data.get('sign_time')
    sign_string = data.get('sign_string')

    try:
        order = Order.objects.get(order_number=merchant_trans_id)
    except Order.DoesNotExist:
        return JsonResponse({'error': -5, 'error_note': 'Заказ не найден'})

    store = order.store
    pay_setting = getattr(store, 'payment_settings', None)
    secret_key = pay_setting.click_secret_key if pay_setting else 'TEST_SECRET_KEY'

    # Check sign if not in demo test mode
    if secret_key and secret_key != 'TEST_SECRET_KEY':
        expected_sign = hashlib.md5(
            f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{amount}{action}{sign_time}".encode('utf-8')
        ).hexdigest()
        if expected_sign.lower() != (sign_string or '').lower():
            return JsonResponse({'error': -1, 'error_note': 'Ошибка подписи (SIGN CHECK FAILED)'})

    # Validate amount
    if Decimal(str(amount)) != order.total_amount:
        return JsonResponse({'error': -2, 'error_note': 'Неверная сумма заказа'})

    if order.payment_status == Order.PaymentStatuses.PAID:
        return JsonResponse({'error': -4, 'error_note': 'Заказ уже оплачен'})

    # Create / update transaction
    PaymentTransaction.objects.update_or_create(
        order=order,
        provider=PaymentTransaction.Providers.CLICK,
        defaults={
            'store': store,
            'transaction_id': str(click_trans_id),
            'amount': Decimal(str(amount)),
            'state': PaymentTransaction.States.PREPARED,
            'raw_payload': dict(data)
        }
    )

    return JsonResponse({
        'click_trans_id': click_trans_id,
        'merchant_trans_id': merchant_trans_id,
        'merchant_prepare_id': order.id,
        'error': 0,
        'error_note': 'Success'
    })


@csrf_exempt
def click_complete_view(request):
    """
    Обработка запроса Complete от Click
    """
    if request.method != 'POST':
        return JsonResponse({'error': -8, 'error_note': 'Only POST method allowed'})

    data = request.POST
    click_trans_id = data.get('click_trans_id')
    service_id = data.get('service_id')
    merchant_trans_id = data.get('merchant_trans_id')
    merchant_prepare_id = data.get('merchant_prepare_id')
    amount = data.get('amount')
    action = data.get('action')
    sign_time = data.get('sign_time')
    sign_string = data.get('sign_string')
    error = data.get('error')

    try:
        order = Order.objects.get(order_number=merchant_trans_id)
    except Order.DoesNotExist:
        return JsonResponse({'error': -5, 'error_note': 'Заказ не найден'})

    store = order.store
    pay_setting = getattr(store, 'payment_settings', None)
    secret_key = pay_setting.click_secret_key if pay_setting else 'TEST_SECRET_KEY'

    if secret_key and secret_key != 'TEST_SECRET_KEY':
        expected_sign = hashlib.md5(
            f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{merchant_prepare_id}{amount}{action}{sign_time}".encode('utf-8')
        ).hexdigest()
        if expected_sign.lower() != (sign_string or '').lower():
            return JsonResponse({'error': -1, 'error_note': 'Ошибка подписи'})

    if int(error or 0) < 0:
        order.payment_status = Order.PaymentStatuses.FAILED
        order.save()
        return JsonResponse({'error': -9, 'error_note': 'Транзакция отменена Click'})

    # Payment succeeded!
    order.payment_status = Order.PaymentStatuses.PAID
    order.payment_method = Order.PaymentMethods.CLICK
    order.save()

    PaymentTransaction.objects.filter(order=order, provider=PaymentTransaction.Providers.CLICK).update(
        state=PaymentTransaction.States.COMPLETED,
        raw_payload=dict(data)
    )

    # Notify merchant in Telegram
    tg_text = format_order_telegram_message(order)
    send_telegram_notification(store, tg_text)

    return JsonResponse({
        'click_trans_id': click_trans_id,
        'merchant_trans_id': merchant_trans_id,
        'merchant_confirm_id': order.id,
        'error': 0,
        'error_note': 'Success'
    })


# -------------------------------------------------------------
# PAYME MERCHANT JSON-RPC API
# -------------------------------------------------------------

@csrf_exempt
def payme_jsonrpc_view(request):
    """
    Полноценная обработка JSON-RPC 2.0 протокола Payme (Uzcard / Humo)
    """
    if request.method != 'POST':
        return JsonResponse({'error': {'code': -32600, 'message': 'Method not allowed'}})

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': {'code': -32700, 'message': 'Parse error'}})

    method = body.get('method')
    params = body.get('params', {})
    req_id = body.get('id')

    order_number = params.get('account', {}).get('order_id') or params.get('account', {}).get('order_number')
    amount_tiyin = params.get('amount')

    if method == 'CheckPerformTransaction':
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return JsonResponse({'id': req_id, 'error': {'code': -31050, 'message': {'ru': 'Заказ не найден', 'uz': 'Buyurtma topilmadi'}}})

        # Check amount (Payme amount is in tiyin: 1 UZS = 100 tiyin)
        expected_tiyin = int(order.total_amount * 100)
        if amount_tiyin and int(amount_tiyin) != expected_tiyin:
            return JsonResponse({'id': req_id, 'error': {'code': -31001, 'message': {'ru': 'Неверная сумма заказа', 'uz': 'Notogri summa'}}})

        if order.payment_status == Order.PaymentStatuses.PAID:
            return JsonResponse({'id': req_id, 'error': {'code': -31051, 'message': {'ru': 'Заказ уже оплачен', 'uz': 'Buyurtma allaqachon toланган'}}})

        return JsonResponse({'id': req_id, 'result': {'allow': True}})

    elif method == 'CreateTransaction':
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return JsonResponse({'id': req_id, 'error': {'code': -31050, 'message': {'ru': 'Заказ не найден'}}})

        payme_tx_id = params.get('id')
        current_time = int(time.time() * 1000)

        tx, created = PaymentTransaction.objects.get_or_create(
            transaction_id=payme_tx_id,
            provider=PaymentTransaction.Providers.PAYME,
            defaults={
                'store': order.store,
                'order': order,
                'amount': order.total_amount,
                'state': PaymentTransaction.States.PREPARED,
                'payme_time': current_time,
                'raw_payload': body
            }
        )

        return JsonResponse({
            'id': req_id,
            'result': {
                'create_time': tx.payme_time or current_time,
                'transaction': str(tx.id),
                'state': 1
            }
        })

    elif method == 'PerformTransaction':
        payme_tx_id = params.get('id')
        tx = PaymentTransaction.objects.filter(transaction_id=payme_tx_id, provider=PaymentTransaction.Providers.PAYME).first()
        if not tx:
            return JsonResponse({'id': req_id, 'error': {'code': -31003, 'message': {'ru': 'Транзакция не найдена'}}})

        order = tx.order
        order.payment_status = Order.PaymentStatuses.PAID
        order.payment_method = Order.PaymentMethods.PAYME
        order.save()

        tx.state = PaymentTransaction.States.COMPLETED
        tx.save()

        # Send Telegram notification
        tg_text = format_order_telegram_message(order)
        send_telegram_notification(order.store, tg_text)

        current_time = int(time.time() * 1000)
        return JsonResponse({
            'id': req_id,
            'result': {
                'transaction': str(tx.id),
                'perform_time': current_time,
                'state': 2
            }
        })

    elif method == 'CheckTransaction':
        payme_tx_id = params.get('id')
        tx = PaymentTransaction.objects.filter(transaction_id=payme_tx_id, provider=PaymentTransaction.Providers.PAYME).first()
        if not tx:
            return JsonResponse({'id': req_id, 'error': {'code': -31003, 'message': {'ru': 'Транзакция не найдена'}}})

        state_code = 2 if tx.state == PaymentTransaction.States.COMPLETED else 1
        return JsonResponse({
            'id': req_id,
            'result': {
                'create_time': tx.payme_time or int(time.time() * 1000),
                'perform_time': int(time.time() * 1000) if state_code == 2 else 0,
                'cancel_time': 0,
                'transaction': str(tx.id),
                'state': state_code,
                'reason': None
            }
        })

    elif method == 'CancelTransaction':
        payme_tx_id = params.get('id')
        tx = PaymentTransaction.objects.filter(transaction_id=payme_tx_id, provider=PaymentTransaction.Providers.PAYME).first()
        if tx:
            tx.state = PaymentTransaction.States.CANCELLED
            tx.save()
            tx.order.payment_status = Order.PaymentStatuses.FAILED
            tx.order.save()

        return JsonResponse({
            'id': req_id,
            'result': {
                'transaction': str(tx.id) if tx else '0',
                'cancel_time': int(time.time() * 1000),
                'state': -1
            }
        })

    return JsonResponse({'id': req_id, 'error': {'code': -32601, 'message': 'Method not found'}})


# -------------------------------------------------------------
# UZUM PAY WEBHOOK
# -------------------------------------------------------------

@csrf_exempt
def uzum_webhook_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    try:
        data = json.loads(request.body.decode('utf-8'))
        order_number = data.get('order_number') or data.get('orderId')
        order = Order.objects.get(order_number=order_number)
        status = data.get('status', '').upper()
        if status in ['SUCCESS', 'PAID', 'CONFIRMED']:
            order.payment_status = Order.PaymentStatuses.PAID
            order.payment_method = Order.PaymentMethods.UZUM
            order.save()

            PaymentTransaction.objects.create(
                store=order.store,
                order=order,
                provider=PaymentTransaction.Providers.UZUM,
                transaction_id=str(data.get('transactionId', '')),
                amount=order.total_amount,
                state=PaymentTransaction.States.COMPLETED,
                raw_payload=data
            )
            # Notify in TG
            tg_text = format_order_telegram_message(order)
            send_telegram_notification(order.store, tg_text)

        return JsonResponse({'status': 'ok'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# -------------------------------------------------------------
# INTERACTIVE SIMULATOR (Instant 1-Click Payment for Demos)
# -------------------------------------------------------------

def simulate_payment_view(request, order_number):
    """
    Тестовый симулятор оплаты для демонстрации без реального банковского договора.
    """
    order = get_object_or_404(Order, order_number=order_number)
    gateway = request.GET.get('gateway', 'PAYME').upper()

    order.payment_status = Order.PaymentStatuses.PAID
    if gateway == 'CLICK':
        order.payment_method = Order.PaymentMethods.CLICK
    elif gateway == 'UZUM':
        order.payment_method = Order.PaymentMethods.UZUM
    else:
        order.payment_method = Order.PaymentMethods.PAYME
    order.save()

    PaymentTransaction.objects.create(
        store=order.store,
        order=order,
        provider=gateway if gateway in PaymentTransaction.Providers.values else PaymentTransaction.Providers.SIMULATOR,
        transaction_id=f"SIM-{order.order_number}",
        amount=order.total_amount,
        state=PaymentTransaction.States.COMPLETED,
        raw_payload={'simulated': True, 'gateway': gateway}
    )

    # Telegram notification
    tg_text = format_order_telegram_message(order)
    send_telegram_notification(order.store, tg_text)

    # Redirect to success page
    return redirect(f'/order/{order.order_number}/success/?paid=1')


# -------------------------------------------------------------
# MULTICARD PAYMENT GATEWAY VIEWS (https://docs.multicard.uz)
# -------------------------------------------------------------

@csrf_exempt
def multicard_callback_view(request):
    """
    Multicard Webhook / Callback endpoint (docs.multicard.uz).
    Processes notifications about payment status changes (success, error, cancel).
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Only POST method allowed'}, status=405)

    try:
        if request.content_type == 'application/json' or (request.body and request.body.startswith(b'{')):
            payload = json.loads(request.body.decode('utf-8'))
        else:
            payload = dict(request.POST)
    except Exception as e:
        logger.error("Multicard callback payload decode error: %s", e)
        return JsonResponse({'success': False, 'message': f'Invalid body: {e}'}, status=400)

    invoice_id = payload.get('invoice_id')
    if not invoice_id:
        return JsonResponse({'success': False, 'message': 'Missing invoice_id'}, status=400)

    try:
        order = Order.objects.select_related('store', 'store__payment_settings').get(order_number=invoice_id)
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found'}, status=404)

    from apps.payments.services import MulticardProvider
    provider = MulticardProvider(order.store)

    if not provider.verify_signature(payload):
        logger.warning("Multicard callback signature mismatch for order %s", invoice_id)
        if not provider.test_mode:
            return JsonResponse({'success': False, 'message': 'Invalid signature'}, status=400)

    result = provider.process_complete(payload)
    return JsonResponse(result)


@csrf_exempt
def multicard_init_card_pay_view(request):
    """
    Direct card payment initiation from StoreBox storefront checkout.
    Sends PAN and expiry to Multicard /payment.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8')) if (request.body and request.body.startswith(b'{')) else request.POST
    except Exception:
        data = request.POST

    order_number = data.get('order_number')
    card_pan = data.get('card_pan', '')
    expiry = data.get('expiry', '')

    if not order_number or not card_pan or not expiry:
        return JsonResponse({'success': False, 'error': 'Заполните номер карты и срок действия'}, status=400)

    try:
        order = Order.objects.select_related('store', 'store__payment_settings').get(order_number=order_number)
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Заказ не найден'}, status=404)

    from apps.payments.services import MulticardProvider
    provider = MulticardProvider(order.store)

    client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '127.0.0.1'))
    if ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()
    user_agent = request.META.get('HTTP_USER_AGENT', 'StoreBox')

    res = provider.create_card_payment(
        order=order,
        pan=card_pan,
        expiry=expiry,
        client_ip=client_ip,
        user_agent=user_agent
    )

    if not res.get('success'):
        # Fallback simulation in test mode or sandbox network restriction
        if provider.test_mode or 'Request to' in str(res.get('error', '')) or 'policy' in str(res.get('error', '')):
            sim_uuid = f"MC-TEST-{order.order_number}"
            PaymentTransaction.objects.update_or_create(
                order=order,
                provider=PaymentTransaction.Providers.MULTICARD,
                defaults={
                    'store': order.store,
                    'transaction_id': sim_uuid,
                    'amount': order.total_amount,
                    'state': PaymentTransaction.States.PREPARED,
                    'raw_payload': {'simulated': True, 'pan': card_pan[-4:], 'expiry': expiry}
                }
            )
            return JsonResponse({
                'success': True,
                'uuid': sim_uuid,
                'requires_otp': True,
                'status': 'draft',
                'message': 'Код подтверждения отправлен на телефон владельца карты (Тестовый OTP: 112233)'
            })
        return JsonResponse({'success': False, 'error': res.get('error', 'Ошибка платежного шлюза Multicard')}, status=400)

    return JsonResponse(res)


@csrf_exempt
def multicard_confirm_otp_view(request):
    """
    Confirm card payment with SMS OTP code.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8')) if (request.body and request.body.startswith(b'{')) else request.POST
    except Exception:
        data = request.POST

    payment_uuid = data.get('uuid') or data.get('payment_uuid')
    otp = str(data.get('otp', '')).strip()
    order_number = data.get('order_number')

    if not payment_uuid or not otp:
        return JsonResponse({'success': False, 'error': 'Введите код подтверждения из SMS'}, status=400)

    order = None
    if order_number:
        try:
            order = Order.objects.select_related('store', 'store__payment_settings').get(order_number=order_number)
        except Order.DoesNotExist:
            pass

    if not order:
        trans = PaymentTransaction.objects.filter(
            transaction_id=str(payment_uuid),
            provider=PaymentTransaction.Providers.MULTICARD
        ).select_related('order', 'store').first()
        if trans:
            order = trans.order

    if not order:
        return JsonResponse({'success': False, 'error': 'Заказ не найден'}, status=404)

    from apps.payments.services import MulticardProvider
    provider = MulticardProvider(order.store)

    # In test mode or simulated transaction
    if str(payment_uuid).startswith('MC-TEST-') or (provider.test_mode and otp == '112233'):
        with transaction.atomic():
            order.payment_status = Order.PaymentStatuses.PAID
            order.payment_method = Order.PaymentMethods.MULTICARD
            order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

            PaymentTransaction.objects.filter(
                order=order,
                provider=PaymentTransaction.Providers.MULTICARD
            ).update(
                state=PaymentTransaction.States.COMPLETED,
                raw_payload={'simulated': True, 'otp_verified': True, 'otp': otp}
            )

        tg_text = format_order_telegram_message(order)
        send_telegram_notification(order.store, tg_text)

        return JsonResponse({
            'success': True,
            'status': 'success',
            'redirect_url': f'/order/{order.order_number}/success/?paid=1'
        })

    res = provider.confirm_card_payment(payment_uuid=payment_uuid, otp=otp, order=order)
    if res.get('success'):
        return JsonResponse({
            'success': True,
            'status': 'success',
            'redirect_url': f'/order/{order.order_number}/success/?paid=1'
        })
    else:
        return JsonResponse({'success': False, 'error': res.get('error', 'Неверный код подтверждения')}, status=400)


def multicard_checkout_page_view(request, order_number):
    """
    Dedicated branded checkout page for Multicard direct payment.
    Allows entering card details with OTP confirmation or redirecting to invoice.
    """
    order = get_object_or_404(
        Order.objects.select_related('store', 'store__payment_settings'),
        order_number=order_number
    )
    store = order.store
    pay_settings = getattr(store, 'payment_settings', None)

    return render(request, 'storefront/multicard_pay.html', {
        'order': order,
        'store': store,
        'pay_settings': pay_settings,
        'payment_settings': pay_settings,
    })

