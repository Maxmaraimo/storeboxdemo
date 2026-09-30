import logging
import random
import re
from datetime import timedelta
import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

CACHE_TOKEN_KEY = "eskiz_jwt_token"
CACHE_TOKEN_TIMEOUT = 25 * 24 * 3600  # 25 days (Eskiz tokens expire after 30 days)
CODE_EXPIRATION_MINUTES = 5
RESEND_COOLDOWN_SECONDS = 60
HOURLY_ATTEMPT_LIMIT = 6


ESKIZ_APPROVED_TEMPLATE_ID = 92326
ESKIZ_APPROVED_TEMPLATE_TEXT = "StoreBox internet-magazinlar platformasiga kirish uchun tasdiqlash kodi: {code}"


def normalize_phone_number(raw_phone: str) -> str:
    """Normalize any phone input into +998XXXXXXXXX format."""
    digits = re.sub(r"\D", "", raw_phone or "")
    if len(digits) == 9:
        digits = "998" + digits
    elif len(digits) == 10 and digits.startswith("8"):
        digits = "998" + digits[1:]
    elif len(digits) == 12 and digits.startswith("998"):
        pass
    return f"+{digits}" if digits else ""


def format_for_eskiz(phone: str) -> str:
    """
    Eskiz expects phone strictly as digits without leading '+' or whitespace (e.g. 998953580709).
    """
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 9:
        digits = "998" + digits
    elif len(digits) == 10 and digits.startswith("8"):
        digits = "998" + digits[1:]
    elif len(digits) == 11 and digits.startswith("8"):
        digits = "998" + digits[2:]
    return digits


class EskizSMSService:
    """Robust Eskiz.uz SMS Gateway Integration with token caching, auto-refresh, and detailed logging."""

    def __init__(self):
        self.api_url = getattr(settings, "ESKIZ_API_URL", "https://notify.eskiz.uz/api").rstrip("/")
        self.email = getattr(settings, "ESKIZ_EMAIL", "filtobex3@gmail.com")
        self.password = getattr(settings, "ESKIZ_PASSWORD", "MbPlBKpGyqCeg2W6wcqZdkqiq6Nvv8ojnc7nHaIh")
        self.sender_from = getattr(settings, "ESKIZ_FROM", "4546")
        self.test_mode = getattr(settings, "ESKIZ_TEST_MODE", False)

    def get_token(self, force_refresh: bool = False) -> str | None:
        """Fetch cached token or login to Eskiz API to retrieve a fresh Bearer token."""
        if not force_refresh:
            cached = cache.get(CACHE_TOKEN_KEY)
            if cached:
                return cached

        login_url = f"{self.api_url}/auth/login"
        payload = {"email": self.email, "password": self.password}
        print(f"[ESKIZ AUTH] Requesting Bearer token from {login_url} for user {self.email}...", flush=True)

        try:
            resp = requests.post(login_url, data=payload, timeout=8)
            print(f"[ESKIZ AUTH RESPONSE] HTTP {resp.status_code}: {resp.text}", flush=True)
            data = resp.json() if resp.text else {}
            if resp.status_code == 200 and "data" in data and "token" in data["data"]:
                token = data["data"]["token"]
                cache.set(CACHE_TOKEN_KEY, token, timeout=CACHE_TOKEN_TIMEOUT)
                logger.info("Successfully authenticated with Eskiz.uz SMS Gateway")
                print(f"[ESKIZ AUTH SUCCESS] Token successfully cached for {CACHE_TOKEN_TIMEOUT}s", flush=True)
                return token
            else:
                err_msg = f"Eskiz authentication failed: {resp.status_code} - {data.get('message', resp.text)}"
                logger.error(err_msg)
                print(f"[ESKIZ AUTH ERROR] {err_msg}", flush=True)
        except Exception as e:
            err_msg = f"Eskiz connection error during login: {e}"
            logger.error(err_msg)
            print(f"[ESKIZ AUTH EXCEPTION] {err_msg}", flush=True)

        return None

    def send_sms(self, phone: str, message: str, template_id: int | None = ESKIZ_APPROVED_TEMPLATE_ID) -> dict:
        """
        Send an SMS via Eskiz.uz gateway with auto token refresh on 401.
        Logs every request and exact response from Eskiz.
        """
        clean_phone = format_for_eskiz(phone)
        if not clean_phone or len(clean_phone) != 12:
            err = f"Telefon raqami noto'g'ri: {phone} (kutilgan: 998XXXXXXXXX)"
            logger.error(f"[ESKIZ ERROR] {err}")
            print(f"[ESKIZ ERROR] {err}", flush=True)
            return {"success": False, "error": err}

        token = self.get_token()
        send_url = f"{self.api_url}/message/sms/send"
        payload = {
            "mobile_phone": clean_phone,
            "message": message,
            "from": self.sender_from,
        }
        if template_id:
            payload["template_id"] = template_id

        print(f"[ESKIZ SEND REQUEST] URL: {send_url} | Phone: {clean_phone} | From: {self.sender_from} | Template: {template_id} | Message: '{message}'", flush=True)

        # 1. Attempt sending with token if available
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            try:
                resp = requests.post(send_url, data=payload, headers=headers, timeout=10)
                print(f"[ESKIZ SEND RESPONSE] HTTP {resp.status_code}: {resp.text}", flush=True)

                if resp.status_code == 200:
                    res_data = resp.json() if resp.text else {}
                    logger.info(f"SMS successfully sent to {clean_phone} via Eskiz: {res_data}")
                    print(f"[ESKIZ SUCCESS] SMS delivered/queued for {clean_phone}: {res_data}", flush=True)
                    return {"success": True, "status": "sent", "data": res_data}

                elif resp.status_code == 401:
                    # Token expired -> refresh and retry once
                    print(f"[ESKIZ TOKEN EXPIRED] 401 received. Refreshing token...", flush=True)
                    cache.delete(CACHE_TOKEN_KEY)
                    token = self.get_token(force_refresh=True)
                    if token:
                        headers = {"Authorization": f"Bearer {token}"}
                        resp = requests.post(send_url, data=payload, headers=headers, timeout=10)
                        print(f"[ESKIZ RETRY RESPONSE] HTTP {resp.status_code}: {resp.text}", flush=True)
                        if resp.status_code == 200:
                            res_data = resp.json() if resp.text else {}
                            logger.info(f"SMS successfully sent to {clean_phone} after token refresh: {res_data}")
                            print(f"[ESKIZ SUCCESS] SMS delivered after refresh for {clean_phone}: {res_data}", flush=True)
                            return {"success": True, "status": "sent", "data": res_data}

                # Extract human-readable error from Eskiz response
                err_detail = resp.text
                try:
                    res_json = resp.json()
                    err_detail = res_json.get('message') or res_json.get('error') or resp.text
                except Exception:
                    pass

                logger.error(f"[ESKIZ SEND FAILED] HTTP {resp.status_code}: {err_detail}")
                print(f"[ESKIZ SEND FAILED] HTTP {resp.status_code}: {err_detail}", flush=True)

                if not self.test_mode:
                    return {
                        "success": False,
                        "error": f"Eskiz xatoligi: {err_detail}",
                        "status_code": resp.status_code
                    }

            except Exception as e:
                err_msg = f"Eskiz SMS send request error: {e}"
                logger.error(f"[ESKIZ EXCEPTION] {err_msg}")
                print(f"[ESKIZ EXCEPTION] {err_msg}", flush=True)
                if not self.test_mode:
                    return {"success": False, "error": err_msg}

        # 2. Fallback in TEST MODE only (e.g. during automated CI/tests)
        if self.test_mode:
            print(f"[ESKIZ TEST MODE SIMULATION] Delivered to: {clean_phone} | Message: {message}", flush=True)
            return {
                "success": True,
                "status": "sent",
                "test_mode": True,
                "message": "SMS yuborildi (Test rejim)",
            }

        return {
            "success": False,
            "error": "Eskiz SMS serveri bilan ulanib bo'lmadi",
        }


# Singleton service instance
sms_service = EskizSMSService()


def send_sms_via_eskiz(phone: str, code: str) -> dict:
    """Send verification code via Eskiz API using approved template 92326."""
    message = ESKIZ_APPROVED_TEMPLATE_TEXT.format(code=code)
    return sms_service.send_sms(phone=phone, message=message, template_id=ESKIZ_APPROVED_TEMPLATE_ID)


def send_checkout_sms_code(phone: str) -> dict:
    """Generate and send 4-digit SMS verification code for checkout flow with rate limiting."""
    from apps.accounts.models import SMSVerification

    normalized_phone = normalize_phone_number(phone)
    if not normalized_phone or len(normalized_phone) < 12:
        return {"success": False, "error": "Iltimos, to'liq telefon raqamini kiriting (+998 ...)"}

    now = timezone.now()

    # 1. Anti-spam: 60-second cooldown check
    recent = SMSVerification.objects.filter(
        phone_number=normalized_phone,
        created_at__gte=now - timedelta(seconds=RESEND_COOLDOWN_SECONDS),
    ).order_by("-created_at").first()

    if recent:
        elapsed = (now - recent.created_at).total_seconds()
        remaining = max(1, int(RESEND_COOLDOWN_SECONDS - elapsed))
        return {
            "success": False,
            "cooldown": remaining,
            "error": f"Kodni qayta so'rash uchun {remaining} soniya kuting",
        }

    # 2. Generate random 4-digit code
    code = f"{random.randint(1000, 9999)}"
    expires_at = now + timedelta(minutes=CODE_EXPIRATION_MINUTES)

    # 3. Update or create SMSVerification record (overwriting old code/time as requested)
    SMSVerification.objects.update_or_create(
        phone_number=normalized_phone,
        defaults={
            "code": code,
            "is_verified": False,
            "created_at": now,
            "expires_at": expires_at,
            "attempts": 0,
        }
    )

    # 4. Dispatch via Eskiz API with approved template 92326
    res = send_sms_via_eskiz(normalized_phone, code)

    if not res.get("success"):
        return {
            "success": False,
            "error": res.get("error", "SMS yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."),
            "eskiz_res": res,
        }

    return {
        "success": True,
        "cooldown": RESEND_COOLDOWN_SECONDS,
        "phone": normalized_phone,
        "message": "Tasdiqlash kodi telefoningizga SMS orqali yuborildi",
        "eskiz_res": res,
    }


def verify_checkout_sms_code(phone: str, code: str) -> tuple[bool, str]:
    """Verify input code against SMSVerification records for checkout."""
    from apps.accounts.models import SMSVerification

    normalized_phone = normalize_phone_number(phone)
    clean_code = (code or "").strip()

    if not normalized_phone:
        return False, "Telefon raqami kiritilmagan"
    if not clean_code or len(clean_code) < 4:
        return False, "4 xonali tasdiqlash kodini to'liq kiriting"

    now = timezone.now()
    record = SMSVerification.objects.filter(phone_number=normalized_phone).order_by("-created_at").first()

    if not record:
        return False, "Tasdiqlash kodi topilmadi. Yangi kod so'rang."

    if record.is_expired():
        return False, "Tasdiqlash kodi muddati o'tgan. Yangi kod so'rang."

    # If code was already verified recently within valid expiration window
    if record.is_verified and record.code == clean_code:
        return True, "Kod muvaffaqiyatli tasdiqlangan"

    if record.attempts >= 5:
        return False, "Ushbu kod uchun urinishlar soni tugadi. Yangi kod so'rang."

    if record.code != clean_code:
        record.attempts += 1
        record.save(update_fields=["attempts"])
        remaining_attempts = max(0, 5 - record.attempts)
        return False, f"Tasdiqlash kodi noto'g'ri. Qolgan urinishlar: {remaining_attempts}"

    record.is_verified = True
    record.save(update_fields=["is_verified"])
    return True, "Kod muvaffaqiyatli tasdiqlandi"


def get_or_create_customer_user(phone: str, name: str = ""):
    """Seamlessly retrieve or create a customer User account and return user."""
    from apps.accounts.models import User
    import uuid
    from django.db.models import Q

    normalized_phone = normalize_phone_number(phone)
    clean_digits = format_for_eskiz(normalized_phone)

    # 1. Try finding existing user by phone
    user = User.objects.filter(phone=normalized_phone).first()
    if not user and clean_digits:
        user = User.objects.filter(Q(phone=clean_digits) | Q(username=f"cust_{clean_digits}")).first()

    if not user:
        # Generate unique username
        username = f"cust_{clean_digits}" if clean_digits else f"cust_{uuid.uuid4().hex[:8]}"
        base_username = username
        idx = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{idx}"
            idx += 1

        user = User.objects.create_user(
            username=username,
            phone=normalized_phone,
            role=User.Roles.CUSTOMER,
            first_name=name or "Xaridor",
        )
        user.set_unusable_password()
        user.save()
    elif name and not user.first_name:
        user.first_name = name
        user.save(update_fields=["first_name"])

    return user


def send_verification_sms(phone: str, purpose: str = "MERCHANT_REGISTER") -> dict:
    """Generate and dispatch a 4-digit verification code with anti-spam rate limiting."""
    from apps.accounts.models import PhoneVerification

    normalized_phone = normalize_phone_number(phone)
    if not normalized_phone or len(normalized_phone) < 12:
        return {"success": False, "error": "Iltimos, to'liq telefon raqamini kiriting (+998 ...)"}

    now = timezone.now()

    # 1. Anti-spam: 60-second cooldown check
    recent = PhoneVerification.objects.filter(
        phone=normalized_phone,
        purpose=purpose,
        created_at__gte=now - timedelta(seconds=RESEND_COOLDOWN_SECONDS),
    ).order_by("-created_at").first()

    if recent:
        elapsed = (now - recent.created_at).total_seconds()
        remaining = max(1, int(RESEND_COOLDOWN_SECONDS - elapsed))
        return {
            "success": False,
            "cooldown": remaining,
            "error": f"Kodni qayta so'rash uchun {remaining} soniya kuting",
        }

    # 2. Hourly rate limit check
    hourly_count = PhoneVerification.objects.filter(
        phone=normalized_phone,
        created_at__gte=now - timedelta(hours=1),
    ).count()

    if hourly_count >= HOURLY_ATTEMPT_LIMIT:
        return {
            "success": False,
            "error": "Ushbu raqamga juda ko'p SMS so'raldi. Iltimos, keyinroq qayta urinib ko'ring.",
        }

    # 3. Generate random 4-digit code
    code = f"{random.randint(1000, 9999)}"
    expires_at = now + timedelta(minutes=CODE_EXPIRATION_MINUTES)

    # 4. Save to Database
    PhoneVerification.objects.create(
        phone=normalized_phone,
        code=code,
        purpose=purpose,
        expires_at=expires_at,
    )

    # 5. Send via Eskiz SMS Gateway using approved template 92326
    message = ESKIZ_APPROVED_TEMPLATE_TEXT.format(code=code)
    res = sms_service.send_sms(normalized_phone, message, template_id=ESKIZ_APPROVED_TEMPLATE_ID)

    if not res.get("success"):
        return {
            "success": False,
            "error": res.get("error", "SMS yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."),
            "eskiz_res": res,
        }

    result = {
        "success": True,
        "cooldown": RESEND_COOLDOWN_SECONDS,
        "phone": normalized_phone,
        "message": "Tasdiqlash kodi telefoningizga SMS orqali yuborildi",
        "eskiz_res": res,
    }

    return result


def verify_sms_code(phone: str, code: str, purpose: str = "MERCHANT_REGISTER") -> tuple[bool, str]:
    """Verify input code against PhoneVerification records."""
    from apps.accounts.models import PhoneVerification

    normalized_phone = normalize_phone_number(phone)
    clean_code = (code or "").strip()

    if not normalized_phone:
        return False, "Telefon raqami kiritilmagan"
    if not clean_code or len(clean_code) < 4:
        return False, "4 xonali tasdiqlash kodini to'liq kiriting"

    now = timezone.now()

    record = PhoneVerification.objects.filter(
        phone=normalized_phone,
        purpose=purpose,
        expires_at__gte=now,
    ).order_by("-created_at").first()

    if not record:
        return False, "Kod muddati tugagan yoki mavjud emas. Yangi kod so'rang."

    if record.is_verified:
        if record.code == clean_code:
            return True, "Kod muvaffaqiyatli tasdiqlandi"
        return False, "Tasdiqlash kodi noto'g'ri"

    if record.attempts >= 5:
        return False, "Ushbu kod uchun urinishlar soni tugadi. Yangi kod so'rang."

    if record.code != clean_code:
        record.attempts += 1
        record.save(update_fields=["attempts"])
        remaining_attempts = max(0, 5 - record.attempts)
        return False, f"Tasdiqlash kodi noto'g'ri. Qolgan urinishlar: {remaining_attempts}"

    # Mark as verified
    record.is_verified = True
    record.save(update_fields=["is_verified"])
    return True, "Kod muvaffaqiyatli tasdiqlandi"
