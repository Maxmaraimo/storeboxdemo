import hashlib
import json
import logging
import time
from decimal import Decimal
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404, redirect
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
