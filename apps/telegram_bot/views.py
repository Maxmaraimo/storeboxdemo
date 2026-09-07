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
            from apps.telegram_bot.services import process_telegram_update
            process_telegram_update(store, data)
            return JsonResponse({'status': 'ok'})
        except Exception as e:
            logger.error(f"Error handling webhook for {subdomain}: {e}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return HttpResponse("Telegram Webhook Endpoint Active.")
