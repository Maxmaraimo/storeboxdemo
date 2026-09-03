import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from apps.stores.models import Store
from apps.telegram_bot.services import send_telegram_welcome, setup_bot_menu_button

logger = logging.getLogger(__name__)


@csrf_exempt
def telegram_webhook_view(request, subdomain):
    store = Store.objects.filter(subdomain=subdomain, is_active=True).first()
    if not store or not store.telegram_bot_token:
        return JsonResponse({'status': 'ignored', 'reason': 'store or token not found'}, status=404)

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            message = data.get('message') or data.get('channel_post') or {}
            chat = message.get('chat') or {}
            chat_id = chat.get('id')
            text = (message.get('text') or '').strip()

            storefront_url = f"http://127.0.0.1:8000/store/{store.subdomain}/"
            welcome_text = store.telegram_welcome_message or f"Assalomu alaykum! {store.name} do'konimizga xush kelibsiz. Quyidagi tugma orqali xarid qilishingiz mumkin."

            if chat_id and (text.startswith('/start') or not text):
                send_telegram_welcome(store.telegram_bot_token, chat_id, welcome_text, storefront_url)

            return JsonResponse({'status': 'ok'})
        except Exception as e:
            logger.error(f"Error handling webhook for {subdomain}: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return HttpResponse("Telegram Webhook Endpoint Active.")
