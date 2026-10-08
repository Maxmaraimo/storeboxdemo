import base64
import hashlib
import hmac
import json
import secrets
from django.conf import settings


def _derive_key(salt_bytes: bytes) -> bytes:
    """Derives a 32-byte key from Django SECRET_KEY using HMAC-SHA256."""
    secret = (getattr(settings, 'SECRET_KEY', 'default-storebox-secret-key-32b') or 'secret').encode('utf-8')
    return hmac.new(secret, salt_bytes, hashlib.sha256).digest()


def encrypt_data(data: dict | str) -> str:
    """
    Encrypts a dictionary or string payload securely using HMAC-SHA256 authenticated keystream
    with a fresh 16-byte random salt for each encryption.
    Produces a URL-safe base64 string formatted as: 'v1$<salt_hex>$<hmac_hex>$<ciphertext_hex>'.
    """
    if not data:
        return ""

    if isinstance(data, (dict, list)):
        payload_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
    else:
        payload_bytes = str(data).encode('utf-8')

    salt = secrets.token_bytes(16)
    key = _derive_key(salt)

    # Keystream generation using iterative HMAC
    keystream = bytearray()
    counter = 0
    while len(keystream) < len(payload_bytes):
        block = hmac.new(key, counter.to_bytes(4, 'big'), hashlib.sha256).digest()
        keystream.extend(block)
        counter += 1

    ciphertext = bytes(p ^ k for p, k in zip(payload_bytes, keystream[:len(payload_bytes)]))
    auth_tag = hmac.new(key, b"storebox_integrations:" + ciphertext, hashlib.sha256).hexdigest()

    return f"v1${salt.hex()}${auth_tag}${ciphertext.hex()}"


def decrypt_data(token: str) -> dict | str | None:
    """
    Decrypts an encrypted token created by `encrypt_data`.
    Verifies authenticity before decrypting.
    """
    if not token or not token.startswith("v1$"):
        return None

    try:
        parts = token.split("$")
        if len(parts) != 4:
            return None

        _, salt_hex, auth_tag, ciphertext_hex = parts
        salt = bytes.fromhex(salt_hex)
        ciphertext = bytes.fromhex(ciphertext_hex)
        key = _derive_key(salt)

        expected_tag = hmac.new(key, b"storebox_integrations:" + ciphertext, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(auth_tag, expected_tag):
            return None

        keystream = bytearray()
        counter = 0
        while len(keystream) < len(ciphertext):
            block = hmac.new(key, counter.to_bytes(4, 'big'), hashlib.sha256).digest()
            keystream.extend(block)
            counter += 1

        plaintext = bytes(c ^ k for c, k in zip(ciphertext, keystream[:len(ciphertext)]))
        raw_str = plaintext.decode('utf-8')
        try:
            return json.loads(raw_str)
        except Exception:
            return raw_str
    except Exception:
        return None


def mask_secret(secret_val: str, keep_last: int = 4) -> str:
    """
    Safely masks sensitive tokens or API keys for frontend display.
    E.g. 'sk_live_9483829482938492' -> 'sk_live_••••••••8492'
         'test_secret' -> '••••••••'
    """
    if not secret_val:
        return ""
    val = str(secret_val).strip()
    if len(val) <= 8:
        return "••••••••"

    prefix = ""
    for known in ["sk_live_", "sk_test_", "pk_live_", "pk_test_", "whsec_", "api_", "key_"]:
        if val.startswith(known):
            prefix = known
            val = val[len(known):]
            break

    if len(val) <= keep_last:
        return f"{prefix}••••••••"

    return f"{prefix}••••••••{val[-keep_last:]}"
