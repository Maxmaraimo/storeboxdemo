import os
import hashlib
import json
from decimal import Decimal
from django.conf import settings
from PIL import Image

def render_custom_burger_image(custom_options):
    """
    Renders a realistic photorealistic composite image of the custom assembled burger
    based on the ingredients chosen in the burger constructor.
    Returns the relative URL to the saved media image (e.g. '/media/orders/custom_burgers/burger_<hash>.png').
    """
    if not custom_options:
        return ''

    # Normalize options
    bun_info = custom_options.get('bun')
    bun_name = ''
    if isinstance(bun_info, dict):
        bun_name = (bun_info.get('name') or '').lower()
    elif isinstance(bun_info, str):
        bun_name = bun_info.lower()

    summary_text = (custom_options.get('summary') or '').lower()
    if not bun_name and summary_text:
        bun_name = summary_text

    if 'без булки' in bun_name or 'салат' in bun_name or 'leaves' in bun_name or 'salat' in bun_name:
        bun_type = 'lettuce'
    elif 'черн' in bun_name or 'black' in bun_name or 'qora' in bun_name:
        bun_type = 'black'
    else:
        bun_type = 'sesame'

    # Extract patties count
    patties_data = custom_options.get('patties')
    if isinstance(patties_data, dict) and len(patties_data) > 0:
        patties_count = sum(int(v or 0) for v in patties_data.values())
    elif isinstance(patties_data, list) and len(patties_data) > 0:
        patties_count = sum(int(item.get('count', 1)) for item in patties_data if isinstance(item, dict))
    elif summary_text:
        if 'тройн' in summary_text or '3× котлет' in summary_text or '3 котлет' in summary_text:
            patties_count = 3
        elif 'двойн' in summary_text or '2× котлет' in summary_text or '2 котлет' in summary_text or summary_text.count('котлет') >= 2:
            patties_count = 2
        elif 'котлет' in summary_text or 'beyond' in summary_text or 'beef' in summary_text or 'говяж' in summary_text:
            patties_count = 1
        else:
            patties_count = 1
    else:
        patties_count = 1
    patties_count = max(0, min(3, patties_count))

    # Extract cheeses count
    cheeses_data = custom_options.get('cheeses')
    if isinstance(cheeses_data, dict) and len(cheeses_data) > 0:
        cheeses_count = sum(int(v or 0) for v in cheeses_data.values())
    elif isinstance(cheeses_data, list) and len(cheeses_data) > 0:
        cheeses_count = sum(int(item.get('count', 1)) for item in cheeses_data if isinstance(item, dict))
    elif summary_text:
        has_cheese_in_summary = any(k in summary_text for k in ['сыр', 'чеддер', 'моцарелла', 'дорблю', 'cheese', 'cheddar'])
        cheeses_count = 1 if has_cheese_in_summary else 0
    else:
        cheeses_count = 0
    has_cheese = cheeses_count > 0 or any(k in summary_text for k in ['сыр', 'чеддер', 'моцарелла', 'дорблю', 'cheese'])

    # Extract toppings
    toppings_data = custom_options.get('toppings') or []
    topping_names = []
    if isinstance(toppings_data, list):
        for item in toppings_data:
            if isinstance(item, dict):
                topping_names.append((item.get('name') or '').lower())
            elif isinstance(item, str):
                topping_names.append(item.lower())

    all_text = ' '.join(topping_names) + ' ' + summary_text

    has_egg = 'яйц' in all_text or 'tuxum' in all_text or 'egg' in all_text
    has_onions = 'лук' in all_text or 'piyoz' in all_text or 'халапеньо' in all_text or 'xalapeno' in all_text or 'jalapeno' in all_text
    has_pickles = 'огур' in all_text or 'bodring' in all_text or 'pickle' in all_text

    # Extract sauces
    sauces_data = custom_options.get('sauces') or []
    if isinstance(sauces_data, dict):
        sauces_count = sum(int(v or 0) for v in sauces_data.values())
    elif isinstance(sauces_data, list):
        sauces_count = len(sauces_data)
    else:
        sauces_count = 0
    has_sauce = sauces_count > 0 or 'соус' in all_text or 'bbq' in all_text

    # Deterministic hash for filename based on the visual recipe
    recipe_key = f"{bun_type}_{patties_count}_{has_cheese}_{has_egg}_{has_onions}_{has_sauce}_{has_pickles}"
    file_hash = hashlib.md5(recipe_key.encode()).hexdigest()[:12]
    filename = f"burger_{recipe_key}_{file_hash}.png"

    media_folder = os.path.join(settings.MEDIA_ROOT, 'orders', 'custom_burgers')
    os.makedirs(media_folder, exist_ok=True)
    full_path = os.path.join(media_folder, filename)
    relative_url = f"{settings.MEDIA_URL}orders/custom_burgers/{filename}"

    if os.path.exists(full_path):
        return relative_url

    base_assets_dir = os.path.join(settings.BASE_DIR, 'static', 'images', 'constructor')

    def load_layer(layer_filename, target_w):
        asset_path = os.path.join(base_assets_dir, layer_filename)
        if not os.path.exists(asset_path):
            return None
        im = Image.open(asset_path).convert('RGBA')
        target_h = int(target_w * (im.height / im.width))
        return im.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # 1. Bottom bun (heel)
    if bun_type == 'lettuce':
        bot = load_layer('lettuce_wrap_bottom_real.png', 480)
    elif bun_type == 'black':
        bot = load_layer('bun_black_bottom_real.png', 440)
    else:
        bot = load_layer('bun_bottom_real.png', 440)

    # 2. Pickles
    pickles = load_layer('pickles_real.png', 390) if has_pickles else None

    # 3. Patties
    patties = []
    for _ in range(patties_count):
        patties.append(load_layer('patty_cheese_real.png' if has_cheese else 'patty_plain_real.png', 450))

    # 4. Center toppings
    sauce = load_layer('sauce_real.png', 380) if has_sauce else None
    onions = load_layer('onions_real.png', 370) if has_onions else None
    egg = load_layer('egg_real.png', 400) if has_egg else None

    # 5. Lettuce & Tomatoes (skip separate leaf if bun is lettuce wrap)
    lettuce = load_layer('lettuce_tomato_real.png', 460) if bun_type != 'lettuce' else None

    # 6. Top bun (crown)
    if bun_type == 'lettuce':
        top = load_layer('lettuce_wrap_top_real.png', 470)
    elif bun_type == 'black':
        top = load_layer('bun_black_top_real.png', 450)
    else:
        top = load_layer('bun_top_real.png', 450)

    canvas_w = 540
    canvas_h = 540
    elements = []
    cur_y = 420

    if bot:
        bot_y = cur_y - bot.height + 30
        elements.append((bot, bot_y, 10))

    cur_patty_base = cur_y - 45
    if pickles:
        elements.append((pickles, cur_patty_base - 10, 15))

    if len(patties) == 0:
        cur_stack_y = cur_patty_base - 10
    else:
        for idx in reversed(range(len(patties))):
            p_img = patties[idx]
            p_y = cur_patty_base - (len(patties) - 1 - idx) * 85 - (p_img.height - 70)
            elements.append((p_img, p_y, 20 + idx))
        cur_stack_y = cur_patty_base - (len(patties) - 1) * 85 - (patties[0].height - 110)

    if sauce:
        elements.append((sauce, cur_stack_y - 20, 30))
    if onions:
        elements.append((onions, cur_stack_y - 35, 32))
    if egg:
        elements.append((egg, cur_stack_y - 45, 34))

    if lettuce:
        lettuce_y = cur_stack_y - 65
        elements.append((lettuce, lettuce_y, 40))
        top_y = lettuce_y - top.height + 70 if top else cur_stack_y - 120
    else:
        top_y = cur_stack_y - (top.height if top else 100) + 75

    if top:
        elements.append((top, top_y, 50))

    elements.sort(key=lambda x: x[2])
    min_y = min(y for _, y, _ in elements)
    max_y = max(y + img.height for img, y, _ in elements)
    h_span = max_y - min_y
    y_shift = (canvas_h - h_span) // 2 - min_y

    canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    for img, y, _ in elements:
        x = (canvas_w - img.width) // 2
        canvas.alpha_composite(img, (x, y + y_shift))

    canvas.save(full_path, format='PNG')
    return relative_url
