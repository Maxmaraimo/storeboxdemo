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
        return f"https://www.uzumpay.uz/pay?merchant={merchant_id}&order={order.order_number}&amount={order.total_amount}"

    def verify_signature(self, payload: dict) -> bool:
        return True

    def process_prepare(self, payload: dict) -> dict:
        return {}

    def process_complete(self, payload: dict) -> dict:
        return {}


class PaymentService:
    """Factory and orchestrator for all payment providers in StoreBox."""

    PROVIDERS = {
        'CLICK': ClickProvider,
        'PAYME': PaymeProvider,
        'UZUM': UzumPayProvider,
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
