import hashlib
import time
import logging
from decimal import Decimal
from abc import ABC, abstractmethod
from django.db import transaction
from apps.orders.models import Order
from apps.payments.models import StorePaymentSetting, PaymentTransaction
from apps.telegram_bot.services import send_telegram_notification, format_order_telegram_message

logger = logging.getLogger(__name__)


class BasePaymentProvider(ABC):
    """Abstract base class for all payment gateways in StoreBox."""

    def __init__(self, store):
        self.store = store
        self.settings = getattr(store, 'payment_settings', None)

    @abstractmethod
    def generate_payment_url(self, order, return_url: str = None) -> str:
        """Generate redirect URL for customer to complete payment."""
        pass

    @abstractmethod
    def verify_signature(self, payload: dict) -> bool:
        """Verify webhook payload signature."""
        pass

    @abstractmethod
    def process_prepare(self, payload: dict) -> dict:
        """Handle preparation / reservation step if provider supports 2-phase commit."""
        pass

    @abstractmethod
    def process_complete(self, payload: dict) -> dict:
        """Handle final payment completion webhook."""
        pass


class ClickProvider(BasePaymentProvider):
    """Click Merchant API provider (Uzcard / Humo / Visa)."""

    def generate_payment_url(self, order, return_url: str = None) -> str:
        service_id = self.settings.click_service_id if self.settings else 'TEST_SERVICE_ID'
        merchant_id = self.settings.click_merchant_id if self.settings else 'TEST_MERCHANT_ID'
        amount = f"{order.total_amount:.2f}"
        return_param = f"&return_url={return_url}" if return_url else ""
        return f"https://my.click.uz/services/pay?service_id={service_id}&merchant_id={merchant_id}&amount={amount}&transaction_param={order.order_number}{return_param}"

    def verify_signature(self, payload: dict) -> bool:
        secret_key = self.settings.click_secret_key if self.settings else 'TEST_SECRET_KEY'
        if not secret_key or secret_key == 'TEST_SECRET_KEY':
            return True  # Sandbox mode
        click_trans_id = payload.get('click_trans_id', '')
        service_id = payload.get('service_id', '')
        merchant_trans_id = payload.get('merchant_trans_id', '')
        amount = payload.get('amount', '')
        action = payload.get('action', '')
        sign_time = payload.get('sign_time', '')
        merchant_prepare_id = payload.get('merchant_prepare_id', '')
        sign_string = payload.get('sign_string', '')

        check_str = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{merchant_prepare_id}{amount}{action}{sign_time}"
        expected = hashlib.md5(check_str.encode('utf-8')).hexdigest()
        return expected.lower() == sign_string.lower()

    def process_prepare(self, payload: dict) -> dict:
        click_trans_id = payload.get('click_trans_id')
        merchant_trans_id = payload.get('merchant_trans_id')
        amount = Decimal(str(payload.get('amount', 0)))

        try:
            order = Order.objects.get(order_number=merchant_trans_id)
        except Order.DoesNotExist:
            return {'error': -5, 'error_note': 'Order not found'}

        if amount != order.total_amount:
            return {'error': -2, 'error_note': 'Incorrect amount'}

        if order.payment_status == Order.PaymentStatuses.PAID:
            return {'error': -4, 'error_note': 'Already paid'}

        PaymentTransaction.objects.update_or_create(
            order=order,
            provider=PaymentTransaction.Providers.CLICK,
            defaults={
                'store': order.store,
                'transaction_id': str(click_trans_id),
                'amount': amount,
                'state': PaymentTransaction.States.PREPARED,
                'raw_payload': payload
            }
        )

        return {
            'click_trans_id': click_trans_id,
            'merchant_trans_id': merchant_trans_id,
            'merchant_prepare_id': order.id,
            'error': 0,
            'error_note': 'Success'
        }

    def process_complete(self, payload: dict) -> dict:
        click_trans_id = payload.get('click_trans_id')
        merchant_trans_id = payload.get('merchant_trans_id')
        error = payload.get('error', 0)

        try:
            order = Order.objects.select_for_update().get(order_number=merchant_trans_id)
        except Order.DoesNotExist:
            return {'error': -5, 'error_note': 'Order not found'}

        if int(error or 0) < 0:
            order.payment_status = Order.PaymentStatuses.FAILED
            order.save(update_fields=['payment_status', 'updated_at'])
            return {'error': -9, 'error_note': 'Cancelled by Click'}

        # Idempotency check: if already completed, return success
        if order.payment_status == Order.PaymentStatuses.PAID:
            return {
                'click_trans_id': click_trans_id,
                'merchant_trans_id': merchant_trans_id,
                'merchant_confirm_id': order.id,
                'error': 0,
                'error_note': 'Already processed'
            }

        with transaction.atomic():
            order.payment_status = Order.PaymentStatuses.PAID
            order.payment_method = Order.PaymentMethods.CLICK
            order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

            PaymentTransaction.objects.filter(
                order=order, provider=PaymentTransaction.Providers.CLICK
            ).update(
                state=PaymentTransaction.States.COMPLETED,
                raw_payload=payload
            )

        # Notify merchant
        tg_text = format_order_telegram_message(order)
        send_telegram_notification(order.store, tg_text)

        return {
            'click_trans_id': click_trans_id,
            'merchant_trans_id': merchant_trans_id,
            'merchant_confirm_id': order.id,
            'error': 0,
            'error_note': 'Success'
        }


class PaymeProvider(BasePaymentProvider):
    """Payme Merchant JSON-RPC 2.0 provider."""

    def generate_payment_url(self, order, return_url: str = None) -> str:
        import base64
        merchant_id = self.settings.payme_merchant_id if self.settings else 'TEST_PAYME_ID'
        amount_tiyin = int(order.total_amount * 100)
        params_str = f"m={merchant_id};ac.order_number={order.order_number};a={amount_tiyin}"
        if return_url:
            params_str += f";c={return_url}"
        encoded = base64.b64encode(params_str.encode('utf-8')).decode('utf-8')
        return f"https://checkout.paycom.uz/{encoded}"

    def verify_signature(self, payload: dict) -> bool:
        return True

    def process_prepare(self, payload: dict) -> dict:
        return {}

    def process_complete(self, payload: dict) -> dict:
        return {}


class UzumPayProvider(BasePaymentProvider):
    """Uzum Pay merchant provider."""

    def generate_payment_url(self, order, return_url: str = None) -> str:
        merchant_id = self.settings.uzum_merchant_id if self.settings else 'TEST_UZUM_ID'
        if not merchant_id or str(merchant_id).startswith('TEST_'):
            return f"/payments/simulate/{order.order_number}/?gateway=UZUM"
        return f"https://www.uzumpay.uz/pay?merchant={merchant_id}&order={order.order_number}&amount={order.total_amount}"

    def verify_signature(self, payload: dict) -> bool:
        return True

    def process_prepare(self, payload: dict) -> dict:
        return {}

    def process_complete(self, payload: dict) -> dict:
        return {}


class MulticardProvider(BasePaymentProvider):
    """
    Multicard Gateway Provider (https://docs.multicard.uz).
    Supports:
      1. Invoice creation with redirect to checkout_url (Uzcard, Humo, Visa, Mastercard, PaymeGo, ClickPass).
      2. Direct card payment on storefront with OTP confirmation (SMS verification).
      3. Automatic Webhook / Callback status synchronization.
    """
    BASE_URL_DEV = "https://dev-mesh.multicard.uz"
    BASE_URL_PROD = "https://mesh.multicard.uz"

    def __init__(self, store):
        super().__init__(store)
        self.app_id = (self.settings.multicard_app_id if self.settings else None) or 'rhmt_test'
        self.secret = (self.settings.multicard_secret if self.settings else None) or 'Pw18axeBFo8V7NamKHXX'
        self.store_id = (self.settings.multicard_store_id if self.settings else None) or '6'
        self.test_mode = self.settings.multicard_test_mode if self.settings else True
        self.base_url = self.BASE_URL_DEV if self.test_mode else self.BASE_URL_PROD

    def get_auth_token(self) -> str:
        """Fetch and cache JWT bearer token from /auth endpoint."""
        from django.core.cache import cache
        import requests

        cache_key = f"multicard_jwt_token_{self.app_id}"
        cached_token = cache.get(cache_key)
        if cached_token:
            return cached_token

        url = f"{self.base_url}/auth"
        try:
            resp = requests.post(
                url,
                json={"application_id": self.app_id, "secret": self.secret},
                headers={"Content-Type": "application/json"},
                timeout=8
            )
            if resp.status_code == 200:
                data = resp.json()
                token = data.get('token')
                if token:
                    # Token usually valid for 24h, cache for 1 hour safely
                    cache.set(cache_key, token, timeout=3600)
                    return token
            logger.error("Multicard auth failed: %s %s", resp.status_code, resp.text)
        except Exception as exc:
            logger.warning("Multicard auth request error: %s", exc)

        return ""

    def build_ofd(self, order) -> list:
        """Build fiscal OFD payload for order items and delivery."""
        ofd_items = []
        for item in order.items.all():
            unit_price_tiyin = int(Decimal(str(item.unit_price)) * 100)
            qty = int(item.quantity)
            total_tiyin = int(Decimal(str(item.total_price)) * 100)

            # Determine mxik / package code
            mxik = getattr(item.product, 'mxik_code', '') or '06401004002000000'
            package_code = getattr(item.product, 'package_code', '') or '1506113'

            ofd_items.append({
                "qty": qty,
                "price": unit_price_tiyin,
                "total": total_tiyin,
                "mxik": str(mxik),
                "package_code": str(package_code),
                "name": (item.product_name or 'Товар')[:200]
            })

        deliv_fee = getattr(order, 'delivery_fee', None)
        if deliv_fee and Decimal(str(deliv_fee)) > 0:
            deliv_tiyin = int(Decimal(str(deliv_fee)) * 100)
            ofd_items.append({
                "qty": 1,
                "price": deliv_tiyin,
                "total": deliv_tiyin,
                "mxik": "04902001001000000",
                "package_code": "1506113",
                "name": "Доставка курьером"
            })

        return ofd_items

    def create_invoice(self, order, return_url: str = None, callback_url: str = None) -> dict:
        """Create invoice via POST /payment/invoice."""
        import requests

        token = self.get_auth_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        store_id_val = int(self.store_id) if str(self.store_id).isdigit() else self.store_id
        amount_tiyin = int(Decimal(str(order.total_amount)) * 100)

        payload = {
            "store_id": store_id_val,
            "amount": amount_tiyin,
            "invoice_id": str(order.order_number),
            "lang": "ru",
            "return_url": return_url or f"/order/{order.order_number}/success/?paid=1",
            "callback_url": callback_url or "/payments/multicard/callback/",
            "ofd": self.build_ofd(order)
        }

        try:
            url = f"{self.base_url}/payment/invoice"
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code in [200, 201]:
                res_json = resp.json()
                data = res_json.get('data', {}) if isinstance(res_json, dict) else {}
                uuid = data.get('uuid', '')
                checkout_url = data.get('checkout_url', '')

                PaymentTransaction.objects.update_or_create(
                    order=order,
                    provider=PaymentTransaction.Providers.MULTICARD,
                    defaults={
                        'store': order.store,
                        'transaction_id': str(uuid or order.order_number),
                        'amount': order.total_amount,
                        'state': PaymentTransaction.States.INIT,
                        'raw_payload': data or res_json
                    }
                )

                return {
                    'success': True,
                    'checkout_url': checkout_url,
                    'uuid': uuid,
                    'short_link': data.get('short_link', '')
                }
            else:
                logger.error("Multicard invoice error %s: %s", resp.status_code, resp.text)
                return {'success': False, 'error': resp.text}
        except Exception as exc:
            logger.warning("Multicard invoice exception: %s", exc)
            return {'success': False, 'error': str(exc)}

    def generate_payment_url(self, order, return_url: str = None) -> str:
        """Returns customer redirect URL for payment."""
        res = self.create_invoice(order, return_url=return_url)
        if res.get('success') and res.get('checkout_url'):
            return res['checkout_url']
        # Graceful fallback: storefront direct card payment page
        return f"/order/{order.order_number}/pay-multicard/"

    def create_card_payment(self, order, pan: str, expiry: str, client_ip: str = "127.0.0.1", user_agent: str = "StoreBox", callback_url: str = None) -> dict:
        """
        Initiate direct card payment via POST /payment.
        pan: Card PAN (16 digits)
        expiry: MM/YY or YYMM (converted to YYMM)
        """
        import re
        import requests

        clean_pan = re.sub(r'\D', '', str(pan))

        # Normalize expiry to YYMM
        exp_clean = re.sub(r'\D', '', str(expiry))
        if len(exp_clean) == 4:
            # Check if input was MMYY (e.g. 0628) vs YYMM (2806)
            # In uzbek cards, usually entered as MM/YY, e.g. 06/28 -> month=06, year=28 -> yymm=2806
            if str(expiry).find('/') != -1:
                parts = str(expiry).split('/')
                exp_clean = f"{parts[1].strip()[-2:]}{parts[0].strip().zfill(2)}"
            elif int(exp_clean[:2]) <= 12 and int(exp_clean[2:]) > 12:
                # MMYY format: convert to YYMM
                exp_clean = f"{exp_clean[2:]}{exp_clean[:2]}"

        token = self.get_auth_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        store_id_val = int(self.store_id) if str(self.store_id).isdigit() else self.store_id
        amount_tiyin = int(Decimal(str(order.total_amount)) * 100)

        payload = {
            "card": {
                "pan": clean_pan,
                "expiry": exp_clean
            },
            "amount": amount_tiyin,
            "store_id": store_id_val,
            "invoice_id": str(order.order_number),
            "callback_url": callback_url or "/payments/multicard/callback/",
            "device_details": {
                "ip": client_ip or "127.0.0.1",
                "user_agent": (user_agent or "StoreBox Browser")[:250]
            },
            "ofd": self.build_ofd(order)
        }

        try:
            url = f"{self.base_url}/payment"
            resp = requests.post(url, json=payload, headers=headers, timeout=12)
            res_json = resp.json() if resp.content else {}
            if resp.status_code in [200, 201] and res_json.get('success'):
                data = res_json.get('data', {})
                uuid = data.get('uuid') or ''
                status = data.get('status') or 'draft'
                otp_hash = data.get('otp_hash')

                PaymentTransaction.objects.update_or_create(
                    order=order,
                    provider=PaymentTransaction.Providers.MULTICARD,
                    defaults={
                        'store': order.store,
                        'transaction_id': str(uuid),
                        'amount': order.total_amount,
                        'state': PaymentTransaction.States.PREPARED,
                        'raw_payload': data
                    }
                )

                return {
                    'success': True,
                    'uuid': uuid,
                    'status': status,
                    'otp_hash': otp_hash,
                    'requires_otp': bool(status != 'success')
                }
            else:
                err_msg = res_json.get('error', {}).get('details') or res_json.get('message') or resp.text
                return {'success': False, 'error': err_msg}
        except Exception as exc:
            logger.warning("Multicard card payment exc: %s", exc)
            return {'success': False, 'error': str(exc)}

    def confirm_card_payment(self, payment_uuid: str, otp: str, order=None) -> dict:
        """Confirm card payment with OTP via PUT /payment/{uuid}."""
        import requests

        token = self.get_auth_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{self.base_url}/payment/{payment_uuid}"
        payload = {
            "otp": str(otp).strip(),
            "debit_available": False
        }

        try:
            resp = requests.put(url, json=payload, headers=headers, timeout=12)
            res_json = resp.json() if resp.content else {}
            if resp.status_code in [200, 201] and res_json.get('success'):
                data = res_json.get('data', {})
                status = data.get('status')

                # If status is successful, finalize order
                if status == 'success':
                    # Locate order if not provided
                    if not order:
                        trans = PaymentTransaction.objects.filter(
                            transaction_id=str(payment_uuid),
                            provider=PaymentTransaction.Providers.MULTICARD
                        ).select_related('order', 'store').first()
                        if trans:
                            order = trans.order

                    if order:
                        with transaction.atomic():
                            order.payment_status = Order.PaymentStatuses.PAID
                            order.payment_method = Order.PaymentMethods.MULTICARD
                            order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

                            PaymentTransaction.objects.filter(
                                order=order,
                                provider=PaymentTransaction.Providers.MULTICARD
                            ).update(
                                state=PaymentTransaction.States.COMPLETED,
                                raw_payload=data
                            )

                        tg_text = format_order_telegram_message(order)
                        send_telegram_notification(order.store, tg_text)

                return {'success': True, 'data': data, 'status': status}
            else:
                err_msg = res_json.get('error', {}).get('details') or res_json.get('message') or resp.text
                return {'success': False, 'error': err_msg}
        except Exception as exc:
            logger.warning("Multicard confirm OTP exc: %s", exc)
            return {'success': False, 'error': str(exc)}

    def verify_signature(self, payload: dict) -> bool:
        """Verify callback signature."""
        if self.test_mode:
            return True

        sign = (payload.get('sign') or '').lower()
        if not sign:
            return False

        secret = self.secret or ''
        store_id = str(payload.get('store_id', ''))
        invoice_id = str(payload.get('invoice_id', ''))
        amount = str(payload.get('amount', ''))
        uuid = str(payload.get('uuid', ''))

        # Check MD5 success callback: {store_id}{invoice_id}{amount}{secret}
        md5_1 = hashlib.md5(f"{store_id}{invoice_id}{amount}{secret}".encode()).hexdigest().lower()
        if sign == md5_1:
            return True

        # Check MD5 webhook: {uuid}{amount}{secret}
        md5_2 = hashlib.md5(f"{uuid}{amount}{secret}".encode()).hexdigest().lower()
        if sign == md5_2:
            return True

        # Check SHA1 webhook: {uuid}{invoice_id}{amount}{secret}
        sha1_val = hashlib.sha1(f"{uuid}{invoice_id}{amount}{secret}".encode()).hexdigest().lower()
        if sign == sha1_val:
            return True

        return False

    def process_prepare(self, payload: dict) -> dict:
        return {}

    def process_complete(self, payload: dict) -> dict:
        """Process callback from Multicard."""
        invoice_id = payload.get('invoice_id')
        status = (payload.get('status') or '').lower()
        uuid = payload.get('uuid') or ''

        try:
            order = Order.objects.select_for_update().get(order_number=invoice_id)
        except Order.DoesNotExist:
            return {'success': False, 'message': 'Заказ не найден'}

        if status in ['success', 'paid']:
            with transaction.atomic():
                order.payment_status = Order.PaymentStatuses.PAID
                order.payment_method = Order.PaymentMethods.MULTICARD
                order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

                PaymentTransaction.objects.update_or_create(
                    order=order,
                    provider=PaymentTransaction.Providers.MULTICARD,
                    defaults={
                        'store': order.store,
                        'transaction_id': str(uuid or order.order_number),
                        'amount': order.total_amount,
                        'state': PaymentTransaction.States.COMPLETED,
                        'raw_payload': payload
                    }
                )

            tg_text = format_order_telegram_message(order)
            send_telegram_notification(order.store, tg_text)
            return {'success': True}

        elif status in ['error', 'failed', 'canceled']:
            order.payment_status = Order.PaymentStatuses.FAILED
            order.save(update_fields=['payment_status', 'updated_at'])
            return {'success': True}

        return {'success': True}


class PaymentService:
    """Factory and orchestrator for all payment providers in StoreBox."""

    PROVIDERS = {
        'CLICK': ClickProvider,
        'PAYME': PaymeProvider,
        'UZUM': UzumPayProvider,
        'MULTICARD': MulticardProvider,
    }

    @classmethod
    def get_provider(cls, store, provider_code: str) -> BasePaymentProvider:
        code = (provider_code or '').upper().strip()
        provider_cls = cls.PROVIDERS.get(code)
        if not provider_cls:
            raise ValueError(f"Unsupported payment provider: {provider_code}")
        return provider_cls(store)

    @classmethod
    def get_payment_url(cls, order, provider_code: str, return_url: str = None) -> str:
        provider = cls.get_provider(order.store, provider_code)
        return provider.generate_payment_url(order, return_url)

