import os
import math
import uuid
import logging
from io import BytesIO
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from django.conf import settings

logger = logging.getLogger(__name__)


def create_linear_gradient(width: int, height: int, start_color: tuple, end_color: tuple, vertical: bool = True) -> Image.Image:
    """Creates a smooth linear gradient image."""
    base = Image.new("RGBA", (width, height), start_color)
    top = Image.new("RGBA", (width, height), end_color)
    mask = Image.new("L", (width, height))
    mask_data = []

    for y in range(height):
        for x in range(width):
            ratio = (y / height) if vertical else (x / width)
            mask_data.append(int(255 * ratio))

    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base


def create_radial_studio_background(width: int, height: int, center_color: tuple, edge_color: tuple) -> Image.Image:
    """Creates a realistic e-commerce studio backdrop with soft spotlight."""
    img = Image.new("RGBA", (width, height), edge_color)
    draw = ImageDraw.Draw(img)
    cx, cy = width // 2, int(height * 0.42)
    max_radius = int(math.hypot(width // 2, height // 2) * 1.1)

    # Layered concentric circles with alpha for smooth spotlight
    steps = 40
    for i in range(steps, 0, -1):
        r = int(max_radius * (i / steps))
        factor = 1.0 - (i / steps)
        # Interpolate center to edge
        cur_color = (
            int(center_color[0] * factor + edge_color[0] * (1 - factor)),
            int(center_color[1] * factor + edge_color[1] * (1 - factor)),
            int(center_color[2] * factor + edge_color[2] * (1 - factor)),
            255
        )
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=cur_color)

    # Soft blur for seamless studio lighting
    return img.filter(ImageFilter.GaussianBlur(radius=18))


def draw_product_mockup(draw: ImageDraw.ImageDraw, category_type: str, cx: int, cy: int, base_color: tuple):
    """Draws a refined vector product silhouette/mockup with studio shading."""
    cat = (category_type or "").lower()

    if any(k in cat for k in ["худи", "свитшот", "кофта", "одежд", "hoodie", "sweatshirt", "streetwear"]):
        # Draw Hoodie silhouette with hood, shoulders, pocket
        # Shoulders & body
        body_box = [cx - 160, cy - 80, cx + 160, cy + 220]
        draw.rounded_rectangle(body_box, radius=40, fill=base_color, outline=(base_color[0]-25, base_color[1]-25, base_color[2]-25, 255), width=4)
        # Hood
        hood_box = [cx - 95, cy - 190, cx + 95, cy - 50]
        draw.ellipse(hood_box, fill=base_color, outline=(base_color[0]-35, base_color[1]-35, base_color[2]-35, 255), width=5)
        # Inner collar
        draw.ellipse([cx - 45, cy - 110, cx + 45, cy - 40], fill=(base_color[0]-40, base_color[1]-40, base_color[2]-40, 255))
        # Kangaroo pocket
        draw.rounded_rectangle([cx - 90, cy + 80, cx + 90, cy + 180], radius=15, fill=(base_color[0]+15, base_color[1]+15, base_color[2]+15, 255), outline=(base_color[0]-20, base_color[1]-20, base_color[2]-20, 255), width=3)
        # Draw cords
        draw.line([cx - 25, cy - 45, cx - 35, cy + 30], fill=(220, 220, 220, 255), width=4)
        draw.line([cx + 25, cy - 45, cx + 35, cy + 30], fill=(220, 220, 220, 255), width=4)

    elif any(k in cat for k in ["футболк", "майка", "t-shirt", "tee"]):
        # T-Shirt
        draw.rounded_rectangle([cx - 140, cy - 70, cx + 140, cy + 200], radius=25, fill=base_color)
        # Sleeves
        draw.polygon([(cx - 140, cy - 70), (cx - 220, cy - 10), (cx - 190, cy + 50), (cx - 140, cy + 10)], fill=base_color)
        draw.polygon([(cx + 140, cy - 70), (cx + 220, cy - 10), (cx + 190, cy + 50), (cx + 140, cy + 10)], fill=base_color)
        # Collar curve
        draw.ellipse([cx - 50, cy - 90, cx + 50, cy - 50], fill=(240, 240, 245, 255))

    elif any(k in cat for k in ["обув", "кроссовк", "кед", "shoes", "sneakers"]):
        # Sneaker profile
        shoe_pts = [
            (cx - 200, cy + 100), (cx - 160, cy + 20), (cx - 80, cy - 40),
            (cx + 40, cy - 20), (cx + 160, cy + 70), (cx + 210, cy + 120),
            (cx + 190, cy + 150), (cx - 190, cy + 150)
        ]
        draw.polygon(shoe_pts, fill=base_color)
        # Sole (thick modern sneaker sole)
        draw.rounded_rectangle([cx - 210, cy + 130, cx + 220, cy + 175], radius=15, fill=(245, 245, 250, 255), outline=(200, 200, 210, 255), width=3)

    elif any(k in cat for k in ["бургер", "пицц", "еда", "ресторан", "burger", "food"]):
        # Gourmet Burger mockup
        # Top bun
        draw.pieslice([cx - 150, cy - 140, cx + 150, cy + 40], start=180, end=360, fill=(215, 145, 65, 255))
        # Sesame seeds
        for sx, sy in [(-80, -70), (-30, -90), (40, -80), (80, -60), (0, -60)]:
            draw.ellipse([cx + sx - 5, cy + sy - 3, cx + sx + 5, cy + sy + 3], fill=(255, 240, 210, 255))
        # Patty
        draw.rounded_rectangle([cx - 145, cy - 10, cx + 145, cy + 45], radius=18, fill=(85, 45, 25, 255))
        # Cheese layer
        draw.polygon([(cx - 140, cy), (cx + 140, cy), (cx + 110, cy + 35), (cx - 120, cy + 30)], fill=(255, 195, 30, 255))
        # Bottom bun
        draw.rounded_rectangle([cx - 140, cy + 45, cx + 140, cy + 105], radius=22, fill=(215, 145, 65, 255))

    elif any(k in cat for k in ["кофе", "напит", "чай", "coffee", "drink"]):
        # Minimalist Coffee Cup / Tumbler
        cup_pts = [(cx - 95, cy - 130), (cx + 95, cy - 130), (cx + 70, cy + 140), (cx - 70, cy + 140)]
        draw.polygon(cup_pts, fill=base_color)
        # Cup lid
        draw.rounded_rectangle([cx - 105, cy - 160, cx + 105, cy - 125], radius=10, fill=(40, 40, 45, 255))
        # Heat sleeve
        sleeve_pts = [(cx - 88, cy - 30), (cx + 88, cy - 30), (cx + 78, cy + 60), (cx - 78, cy + 60)]
        draw.polygon(sleeve_pts, fill=(195, 145, 100, 255))

    else:
        # Luxury e-commerce packaging box / product stand
        box = [cx - 130, cy - 120, cx + 130, cy + 130]
        draw.rounded_rectangle(box, radius=28, fill=base_color, outline=(base_color[0]-30, base_color[1]-30, base_color[2]-30, 255), width=5)
        # Inner badge / accent ribbon
        draw.line([cx - 130, cy, cx + 130, cy], fill=(255, 255, 255, 180), width=4)
        draw.ellipse([cx - 40, cy - 40, cx + 40, cy + 40], fill=(255, 255, 255, 230))
        draw.ellipse([cx - 28, cy - 28, cx + 28, cy + 28], fill=base_color)


def generate_studio_product_image(
    product_name: str,
    category_name: str = "",
    price: float = None,
    store_name: str = "StoreBox",
    theme: str = "dark_luxury"
) -> str:
    """
    Generates a 1024x1024 realistic e-commerce product visual artwork
    and saves to media/products/ directory.
    Returns relative media URL.
    """
    width, height = 1024, 1024

    if theme == "dark_luxury":
        bg = create_radial_studio_background(width, height, center_color=(45, 48, 58), edge_color=(14, 15, 18))
        pedestal_color = (28, 30, 36, 255)
        card_bg = (24, 25, 30, 230)
        text_primary = (255, 255, 255, 255)
        text_secondary = (160, 165, 180, 255)
        mockup_color = (32, 34, 40, 255)
        accent_color = (139, 92, 246, 255) # violet
    else:
        bg = create_radial_studio_background(width, height, center_color=(250, 252, 255), edge_color=(225, 230, 238))
        pedestal_color = (235, 240, 248, 255)
        card_bg = (255, 255, 255, 240)
        text_primary = (18, 20, 28, 255)
        text_secondary = (100, 105, 120, 255)
        mockup_color = (50, 52, 62, 255)
        accent_color = (99, 102, 241, 255)

    draw = ImageDraw.Draw(bg)

    # 1. Studio Pedestal with soft ambient drop shadow
    ped_cx, ped_cy = width // 2, 720
    ped_rx, ped_ry = 320, 95

    # Ground shadow
    shadow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.ellipse([ped_cx - ped_rx - 40, ped_cy - ped_ry + 15, ped_cx + ped_rx + 40, ped_cy + ped_ry + 75], fill=(0, 0, 0, 90))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=25))
    bg.paste(shadow_layer, (0, 0), shadow_layer)

    # Pedestal Top & Side
    draw.rounded_rectangle([ped_cx - ped_rx, ped_cy, ped_cx + ped_rx, ped_cy + 70], radius=35, fill=pedestal_color)
    draw.ellipse([ped_cx - ped_rx, ped_cy - ped_ry, ped_cx + ped_rx, ped_cy + ped_ry], fill=pedestal_color, outline=(accent_color[0], accent_color[1], accent_color[2], 120), width=3)

    # 2. Main Product Mockup
    prod_cx, prod_cy = width // 2, 480
    draw_product_mockup(draw, f"{product_name} {category_name}", prod_cx, prod_cy, mockup_color)

    # 3. Top Header Bar (Store Branding)
    draw.rounded_rectangle([50, 45, width - 50, 115], radius=22, fill=card_bg, outline=(255, 255, 255, 30), width=1)
    draw.text((80, 65), f"STOREBOX STUDIO  •  {store_name.upper()}", fill=text_secondary)
    draw.text((width - 240, 65), "AI GENERATED", fill=accent_color)

    # 4. Bottom Info Plaque (Product Title, Category, Price)
    plaque_box = [60, 830, width - 60, 960]
    draw.rounded_rectangle(plaque_box, radius=28, fill=card_bg, outline=(255, 255, 255, 40), width=1)

    # Product Name
    name_display = product_name[:36] + ("..." if len(product_name) > 36 else "")
    draw.text((100, 855), name_display, fill=text_primary)
    
    # Category tag
    sub_tag = f"Категория: {category_name or 'Каталог'}  |  100% Премиум качество"
    draw.text((100, 905), sub_tag, fill=text_secondary)

    # Price Badge
    if price and price > 0:
        price_str = f"{int(price):,} UZS"
        badge_w = 230
        badge_box = [width - 100 - badge_w, 860, width - 100, 930]
        draw.rounded_rectangle(badge_box, radius=18, fill=accent_color)
        draw.text((width - 100 - badge_w + 30, 880), price_str, fill=(255, 255, 255, 255))

    # Save to media/products
    rel_path = f"products/studio_gen_{uuid.uuid4().hex[:8]}.png"
    abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    bg.save(abs_path, format="PNG", quality=95)

    return f"{settings.MEDIA_URL}{rel_path}"


def remove_and_studio_composite(image_path_or_bytes: any, studio_style: str = "clean_white") -> str:
    """
    Removes background using rembg and places the cutout onto a
    pristine e-commerce studio background with soft drop shadow.
    """
    from .services_ai import remove_image_background

    cutout_bytes = remove_image_background(image_path_or_bytes)
    cutout = Image.open(BytesIO(cutout_bytes)).convert("RGBA")

    # Target canvas 1024x1024
    width, height = 1024, 1024

    if studio_style == "dark_studio":
        canvas = create_radial_studio_background(width, height, center_color=(50, 54, 65), edge_color=(15, 16, 20))
    elif studio_style == "warm_minimal":
        canvas = create_radial_studio_background(width, height, center_color=(255, 250, 245), edge_color=(235, 225, 215))
    else: # clean_white studio
        canvas = create_radial_studio_background(width, height, center_color=(255, 255, 255), edge_color=(238, 241, 246))

    # Scale cutout to fit inside 700x700
    cutout.thumbnail((720, 720), Image.Resampling.LANCZOS)
    cw, ch = cutout.size

    # Position at center
    px = (width - cw) // 2
    py = int((height - ch) * 0.45)

    # Create soft realistic drop shadow for the cutout
    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    shadow_bottom = py + ch
    s_draw.ellipse([px + 30, shadow_bottom - 20, px + cw - 30, shadow_bottom + 45], fill=(0, 0, 0, 75))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))

    canvas.paste(shadow, (0, 0), shadow)
    canvas.paste(cutout, (px, py), cutout)

    rel_path = f"products/studio_enhanced_{uuid.uuid4().hex[:8]}.png"
    abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    canvas.save(abs_path, format="PNG", quality=95)

    return f"{settings.MEDIA_URL}{rel_path}"
