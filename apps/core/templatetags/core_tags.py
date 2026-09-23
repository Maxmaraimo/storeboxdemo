from django import template
from apps.core.translations import (
    get_order_status_label,
    get_delivery_method_label,
    get_payment_method_label,
    get_payment_status_label,
    get_order_source_label,
    get_unit_label,
)

register = template.Library()


@register.filter(name='localized_name')
def localized_name(obj, lang='uz'):
    """
    Returns the localized name of a Product, Category, Branch, etc.
    based on the current active language ('uz', 'ru', 'en').
    """
    if not obj:
        return ''
    if hasattr(obj, 'get_name') and callable(obj.get_name):
        return obj.get_name(lang)

    lang = (lang or 'uz').lower().strip()
    if lang == 'ru' and getattr(obj, 'name_ru', None):
        return obj.name_ru
    elif lang == 'en' and getattr(obj, 'name_en', None):
        return obj.name_en
    return getattr(obj, 'name_uz', None) or getattr(obj, 'name_ru', None) or getattr(obj, 'name_en', None) or getattr(obj, 'name', '') or str(obj)


@register.filter(name='localized_desc')
def localized_desc(obj, lang='uz'):
    """
    Returns the localized description of a Product.
    """
    if not obj:
        return ''
    if hasattr(obj, 'get_description') and callable(obj.get_description):
        return obj.get_description(lang)

    lang = (lang or 'uz').lower().strip()
    if lang == 'ru' and getattr(obj, 'description_ru', None):
        return obj.description_ru
    elif lang == 'en' and getattr(obj, 'description_en', None):
        return obj.description_en
    return getattr(obj, 'description_uz', None) or getattr(obj, 'description_ru', None) or getattr(obj, 'description_en', None) or ''


@register.filter(name='order_status_label')
def order_status_label_filter(code, lang='uz'):
    return get_order_status_label(code, lang)


@register.filter(name='delivery_label')
def delivery_label_filter(code, lang='uz'):
    return get_delivery_method_label(code, lang)


@register.filter(name='payment_label')
def payment_label_filter(code, lang='uz'):
    return get_payment_method_label(code, lang)


@register.filter(name='payment_status_label')
def payment_status_label_filter(code, lang='uz'):
    return get_payment_status_label(code, lang)


@register.filter(name='source_label')
def source_label_filter(code, lang='uz'):
    return get_order_source_label(code, lang)


@register.filter(name='unit_label')
def unit_label_filter(code, lang='uz'):
    return get_unit_label(code, lang)
