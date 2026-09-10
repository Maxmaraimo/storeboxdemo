from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from apps.stores.models import Store
from apps.core.landing_translations import get_landing_translations, LANDING_TRANSLATIONS
import json


def landing_view(request):
    """Главная страница платформы StoreBox (Аналог RoboSell для Узбекистана)"""
    # If the request arrived on a store subdomain, route directly to that store!
    if getattr(request, 'store', None):
        from apps.storefront.views import storefront_home_view
        return storefront_home_view(request)

    # Get sample demo stores
    demo_stores = Store.objects.filter(is_active=True)[:4]
    
    query_lang = request.GET.get('lang')
    if query_lang in ['uz', 'ru', 'en']:
        lang = query_lang
        request.session['lang'] = lang
        request.session['_language'] = lang
    else:
        lang = request.session.get('lang') or request.COOKIES.get('storebox_lang') or request.COOKIES.get('django_language') or getattr(request, 'language', 'uz')
    
    if lang not in ['uz', 'ru', 'en']:
        lang = 'uz'

    t = get_landing_translations(lang)

    response = render(request, 'core/landing.html', {
        'demo_stores': demo_stores,
        'lang': lang,
        't': t,
        'all_translations_json': json.dumps(LANDING_TRANSLATIONS),
    })
    response.set_cookie('storebox_lang', lang, max_age=365*24*60*60, samesite='Lax')
    return response


def switch_language_view(request, lang):
    lang = (lang or '').lower().strip()
    if lang in ['uz', 'ru', 'en']:
        request.session['lang'] = lang
        request.session['_language'] = lang
        from django.utils import translation
        translation.activate(lang)

    next_url = request.GET.get('next') or request.META.get('HTTP_REFERER') or '/dashboard/'
    if '#' in next_url:
        next_url = next_url.split('#')[0]
    if not next_url.strip():
        next_url = '/dashboard/'

    response = redirect(next_url)
    if lang in ['uz', 'ru', 'en']:
        response.set_cookie('django_language', lang, max_age=365*24*60*60, samesite='Lax')
        response.set_cookie('storebox_lang', lang, max_age=365*24*60*60, samesite='Lax')
    return response


@csrf_exempt
def lead_inquiry_api(request):
    """
    Real backend handler for landing page consultation requests.
    Validates name, company, phone (+998), saves to LeadInquiry model,
    and returns localized success or error message.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    lang = request.session.get('lang') or request.COOKIES.get('storebox_lang') or 'uz'
    if lang not in ['uz', 'ru', 'en']:
        lang = 'uz'
    t = get_landing_translations(lang)

    # Parse POST data (support JSON or form-encoded)
    if request.content_type == 'application/json':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            data = {}
    else:
        data = request.POST

    name = str(data.get('name', '')).strip()
    company = str(data.get('company', '')).strip()
    phone = str(data.get('phone', '')).strip()
    message = str(data.get('message', '')).strip()

    # Validation
    if not name or len(name) < 2:
        err_msg = {
            'uz': "Iltimos, ismingizni to'liq kiriting.",
            'ru': "Пожалуйста, укажите ваше имя.",
            'en': "Please provide your full name."
        }.get(lang, "Ismingizni kiriting")
        return JsonResponse({'success': False, 'error': err_msg}, status=400)

    # Phone normalization and check
    clean_digits = ''.join(c for c in phone if c.isdigit())
    if len(clean_digits) < 9:
        err_msg = {
            'uz': "Iltimos, to'g'ri telefon raqamingizni kiriting (+998 XX XXX XX XX).",
            'ru': "Пожалуйста, введите корректный номер телефона (+998 XX XXX XX XX).",
            'en': "Please enter a valid phone number (+998 XX XXX XX XX)."
        }.get(lang, "Telefon raqamini kiriting")
        return JsonResponse({'success': False, 'error': err_msg}, status=400)

    # Format phone cleanly if Uzbekistan standard
    if len(clean_digits) == 9:
        formatted_phone = f"+998{clean_digits}"
    elif len(clean_digits) == 12 and clean_digits.startswith('998'):
        formatted_phone = f"+{clean_digits}"
    else:
        formatted_phone = phone

    from apps.core.models import LeadInquiry
    lead = LeadInquiry.objects.create(
        name=name,
        company=company,
        phone=formatted_phone,
        message=message,
        source='landing_consultation'
    )

    success_msg = t.get('contact_success_msg') or "Rahmat! Xabaringiz qabul qilindi. Mutaxassisimiz tez orada siz bilan bog'lanadi."

    return JsonResponse({
        'success': True,
        'lead_id': lead.id,
        'message': success_msg
    })
