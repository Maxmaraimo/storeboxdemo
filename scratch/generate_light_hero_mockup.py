import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_font(size, bold=False):
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                idx = 1 if bold and fp.endswith(".ttc") else 0
                return ImageFont.truetype(fp, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(fp, size)
                except Exception:
                    pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def draw_gradient_background(img, color_top, color_bottom):
    w, h = img.size
    draw = ImageDraw.Draw(img)
    r1, g1, b1 = color_top
    r2, g2, b2 = color_bottom
    for y in range(h):
        ratio = y / float(h)
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

# 1. HERO DASHBOARD DESKTOP (1920 x 1080) — AUTHENTIC LIGHT STOREBOX CABINET
def generate_hero_dashboard_desktop():
    w, h = 1920, 1080
    img = Image.new("RGBA", (w, h), (8, 4, 23, 255))
    draw_gradient_background(img, (13, 7, 38), (8, 4, 23))

    # Ambient deep violet glows
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([w//2 - 500, -150, w//2 + 500, 450], fill=(124, 58, 237, 50))
    glow_draw.ellipse([150, 250, 750, 850], fill=(79, 70, 229, 35))
    glow_draw.ellipse([w - 700, 150, w - 100, 750], fill=(168, 85, 247, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    img.alpha_composite(glow)

    draw = ImageDraw.Draw(img)

    # Hairline perspective grid on background
    for x in range(0, w, 60):
        draw.line([(x, 650), (int(w/2 + (x - w/2) * 2.2), h)], fill=(124, 58, 237, 16), width=1)
    for y in range(650, h, 45):
        draw.line([(0, y), (w, y)], fill=(124, 58, 237, 18), width=1)

    frame_x, frame_y = 120, 70
    frame_w, frame_h = 1680, 940
    
    # Outer frame with light specular hairline border
    draw_rounded_rect(draw, [frame_x, frame_y, frame_x + frame_w, frame_y + frame_h], 24, fill=(248, 250, 252), outline=(255, 255, 255, 70), width=2)

    # Mac OS Window Titlebar
    titlebar_h = 52
    draw_rounded_rect(draw, [frame_x, frame_y, frame_x + frame_w, frame_y + titlebar_h], 24, fill=(255, 255, 255))
    draw.rectangle([frame_x, frame_y + 24, frame_x + frame_w, frame_y + titlebar_h], fill=(255, 255, 255))
    draw.line([(frame_x, frame_y + titlebar_h), (frame_x + frame_w, frame_y + titlebar_h)], fill=(226, 232, 240), width=1)

    # Traffic lights
    draw.ellipse([frame_x + 22, frame_y + 19, frame_x + 34, frame_y + 31], fill=(255, 95, 87))
    draw.ellipse([frame_x + 42, frame_y + 19, frame_x + 54, frame_y + 31], fill=(254, 188, 46))
    draw.ellipse([frame_x + 62, frame_y + 19, frame_x + 74, frame_y + 31], fill=(40, 200, 64))

    f_bold_15 = get_font(15, bold=True)
    f_reg_13 = get_font(13)
    f_bold_13 = get_font(13, bold=True)
    f_bold_11 = get_font(11, bold=True)
    f_reg_11 = get_font(11)
    f_bold_20 = get_font(20, bold=True)
    f_bold_18 = get_font(18, bold=True)

    # Titlebar centered URL pill
    draw_rounded_rect(draw, [frame_x + frame_w//2 - 220, frame_y + 10, frame_x + frame_w//2 + 220, frame_y + 40], 15, fill=(241, 245, 249), outline=(226, 232, 240), width=1)
    draw.text((frame_x + frame_w//2 - 180, frame_y + 16), "https://shop-655.storebox.uz/dashboard/design", font=f_reg_13, fill=(100, 116, 139))
    draw.ellipse([frame_x + frame_w//2 - 198, frame_y + 21, frame_x + frame_w//2 - 190, frame_y + 29], fill=(16, 185, 129))

    # Right side titlebar status
    draw_rounded_rect(draw, [frame_x + frame_w - 200, frame_y + 12, frame_x + frame_w - 20, frame_y + 38], 13, fill=(243, 232, 255))
    draw.text((frame_x + frame_w - 185, frame_y + 17), "• Jonli rejim (StoreBox)", font=f_bold_11, fill=(124, 58, 237))

    # Sidebar parameters (LIGHT SIDEBAR AS IN REAL PLATFORM)
    sb_w = 280
    sb_x = frame_x
    sb_y = frame_y + titlebar_h
    sb_h = frame_h - titlebar_h

    draw.rectangle([sb_x, sb_y, sb_x + sb_w, sb_y + sb_h], fill=(255, 255, 255))
    draw.line([(sb_x + sb_w, sb_y), (sb_x + sb_w, sb_y + sb_h)], fill=(226, 232, 240), width=1)

    # Logo in sidebar
    draw_rounded_rect(draw, [sb_x + 20, sb_y + 20, sb_x + 56, sb_y + 56], 12, fill=(124, 58, 237))
    draw.text((sb_x + 30, sb_y + 27), "S", font=f_bold_20, fill=(255, 255, 255))
    draw.text((sb_x + 68, sb_y + 24), "StoreBox", font=f_bold_15, fill=(15, 23, 42))
    draw.text((sb_x + 68, sb_y + 42), "PLATFORM 2.0", font=f_bold_11, fill=(100, 116, 139))
    draw_rounded_rect(draw, [sb_x + 180, sb_y + 24, sb_x + 225, sb_y + 42], 9, fill=(243, 232, 255))
    draw.text((sb_x + 192, sb_y + 27), "PRO", font=f_bold_11, fill=(124, 58, 237))

    # Store selector card in sidebar
    draw_rounded_rect(draw, [sb_x + 16, sb_y + 70, sb_x + sb_w - 16, sb_y + 124], 12, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    draw_rounded_rect(draw, [sb_x + 26, sb_y + 80, sb_x + 60, sb_y + 114], 8, fill=(15, 23, 42))
    draw.text((sb_x + 38, sb_y + 88), "T", font=f_bold_15, fill=(255, 255, 255))
    draw.text((sb_x + 70, sb_y + 82), "Test", font=f_bold_13, fill=(15, 23, 42))
    draw.text((sb_x + 70, sb_y + 100), "shop-655.storebox.uz", font=f_reg_11, fill=(100, 116, 139))

    # Menu items in sidebar
    nav_items = [
        ("Boshqaruv paneli", False, None),
        ("Buyurtmalar", False, "12"),
        ("Mijozlar", False, None),
        ("Chat", False, "4"),
        ("Mahsulotlar", False, None),
        ("Kategoriyalar", False, None),
        ("Marketing", False, None),
        ("Dizayn & AI", True, "AI"),
        ("Telegram bot", False, None),
        ("Sozlamalar", False, None),
    ]

    cur_y = sb_y + 140
    for title, is_active, badge in nav_items:
        if is_active:
            draw_rounded_rect(draw, [sb_x + 14, cur_y, sb_x + sb_w - 14, cur_y + 40], 10, fill=(243, 232, 255))
            draw.text((sb_x + 32, cur_y + 12), title, font=f_bold_13, fill=(124, 58, 237))
            draw_rounded_rect(draw, [sb_x + sb_w - 55, cur_y + 10, sb_x + sb_w - 25, cur_y + 30], 8, fill=(124, 58, 237))
            draw.text((sb_x + sb_w - 47, cur_y + 12), badge, font=f_bold_11, fill=(255, 255, 255))
        else:
            draw.text((sb_x + 32, cur_y + 12), title, font=f_reg_13, fill=(71, 85, 105))
            if badge:
                draw_rounded_rect(draw, [sb_x + sb_w - 55, cur_y + 10, sb_x + sb_w - 25, cur_y + 30], 8, fill=(241, 245, 249))
                draw.text((sb_x + sb_w - 47, cur_y + 12), badge, font=f_bold_11, fill=(100, 116, 139))
        cur_y += 46

    # MAIN CONTENT WORKSPACE (LIGHT BACKGROUND #F8FAFC)
    mc_x = sb_x + sb_w + 24
    mc_y = sb_y + 18
    mc_w = frame_w - sb_w - 48

    # Workspace top bar
    draw_rounded_rect(draw, [mc_x, mc_y, mc_x + 220, mc_y + 36], 18, fill=(241, 245, 249), outline=(226, 232, 240))
    draw.ellipse([mc_x + 14, mc_y + 14, mc_x + 22, mc_y + 22], fill=(16, 185, 129))
    draw.text((mc_x + 30, mc_y + 10), "shop-655.storebox.uz", font=f_bold_11, fill=(51, 65, 85))

    draw_rounded_rect(draw, [mc_x + mc_w - 180, mc_y, mc_x + mc_w, mc_y + 36], 18, fill=(255, 255, 255), outline=(226, 232, 240))
    draw.text((mc_x + mc_w - 165, mc_y + 10), "O'zbekcha", font=f_bold_11, fill=(71, 85, 105))
    draw.ellipse([mc_x + mc_w - 40, mc_y + 6, mc_x + mc_w - 16, mc_y + 30], fill=(124, 58, 237))
    draw.text((mc_x + mc_w - 34, mc_y + 10), "01", font=f_bold_11, fill=(255, 255, 255))

    # LEFT COLUMN: Real Design Studio / Platform Settings
    col1_x = mc_x
    col1_y = mc_y + 50
    col1_w = 760

    # Card 1: Store Name and Logo Card
    draw_rounded_rect(draw, [col1_x, col1_y, col1_x + col1_w, col1_y + 130], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((col1_x + 20, col1_y + 16), "Do'kon nomi va Logotipi", font=f_bold_15, fill=(15, 23, 42))
    draw.text((col1_x + col1_w - 190, col1_y + 18), "https://shop-655.storebox.uz", font=f_reg_11, fill=(148, 163, 184))

    # Logo box
    draw_rounded_rect(draw, [col1_x + 20, col1_y + 48, col1_x + 100, col1_y + 112], 12, fill=(15, 23, 42))
    draw.text((col1_x + 36, col1_y + 68), "PRIME", font=f_bold_13, fill=(52, 211, 153))
    
    # Store name input
    draw_rounded_rect(draw, [col1_x + 120, col1_y + 60, col1_x + 480, col1_y + 100], 10, fill=(248, 250, 252), outline=(203, 213, 225), width=1)
    draw.text((col1_x + 136, col1_y + 72), "StoreBox Demo Restoran", font=f_bold_13, fill=(15, 23, 42))
    draw_rounded_rect(draw, [col1_x + 500, col1_y + 60, col1_x + 620, col1_y + 100], 10, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
    draw.text((col1_x + 524, col1_y + 72), "Yuklash", font=f_bold_11, fill=(51, 65, 85))

    # Card 2: AI Design Studio Card (Deep purple card inside light dashboard, matching video!)
    ai_y = col1_y + 148
    draw_rounded_rect(draw, [col1_x, ai_y, col1_x + col1_w, ai_y + 270], 20, fill=(20, 14, 46), outline=(124, 58, 237, 120), width=1)
    draw.text((col1_x + 24, ai_y + 20), "Sun'iy intellekt (AI) Dizayn Studio", font=f_bold_18, fill=(255, 255, 255))
    draw.text((col1_x + 24, ai_y + 46), "Biznes yo'nalishingizni tanlang:", font=f_reg_13, fill=(196, 181, 253))
    draw_rounded_rect(draw, [col1_x + col1_w - 100, ai_y + 18, col1_x + col1_w - 24, ai_y + 44], 10, fill=(124, 58, 237))
    draw.text((col1_x + col1_w - 86, ai_y + 24), "AI PRO", font=f_bold_11, fill=(255, 255, 255))

    # Niche buttons
    niches = [
        ("Restoran & Kafe", True),
        ("Gullar & Sovg'a", False),
        ("Elektronika", False),
        ("Kiyim & Poyafzal", False),
        ("Oziq-ovqat", False),
        ("Qahvaxona", False),
    ]
    nx, ny = col1_x + 24, ai_y + 76
    for name, sel in niches:
        nw = 160
        if sel:
            draw_rounded_rect(draw, [nx, ny, nx + nw, ny + 38], 10, fill=(255, 255, 255))
            draw.text((nx + 18, ny + 11), name, font=f_bold_13, fill=(124, 58, 237))
        else:
            draw_rounded_rect(draw, [nx, ny, nx + nw, ny + 38], 10, fill=(40, 30, 80), outline=(80, 60, 140))
            draw.text((nx + 18, ny + 11), name, font=f_reg_13, fill=(216, 180, 254))
        nx += nw + 12
        if nx > col1_x + col1_w - 160:
            nx = col1_x + 24
            ny += 48

    # AI Prompt input & CTA
    prompt_y = ai_y + 180
    draw_rounded_rect(draw, [col1_x + 24, prompt_y, col1_x + col1_w - 150, prompt_y + 44], 12, fill=(14, 10, 32), outline=(80, 60, 140))
    draw.text((col1_x + 40, prompt_y + 13), "Restoran menyusi va taomlar rasmlarini avtomatik generatsiya qilish...", font=f_reg_13, fill=(167, 139, 250))
    draw_rounded_rect(draw, [col1_x + col1_w - 138, prompt_y, col1_x + col1_w - 24, prompt_y + 44], 12, fill=(124, 58, 237))
    draw.text((col1_x + col1_w - 110, prompt_y + 13), "Qo'llash", font=f_bold_13, fill=(255, 255, 255))

    # Card 3: Banner and Live Stats
    stat_y = ai_y + 286
    draw_rounded_rect(draw, [col1_x, stat_y, col1_x + col1_w, stat_y + 160], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((col1_x + 20, stat_y + 16), "Savdo ko'rsatkichlari (Bugungi tushum)", font=f_bold_15, fill=(15, 23, 42))

    kpis = [
        ("Bugungi tushum", "14 850 000 UZS", "+28.4%", (16, 185, 129)),
        ("Buyurtmalar", "24 ta", "+4 yangi", (59, 130, 246)),
        ("O'rtacha chek", "185 000 UZS", "Stabil", (168, 85, 247)),
    ]
    kw = (col1_w - 60) // 3
    for i, (t_name, val, diff, c_col) in enumerate(kpis):
        kx = col1_x + 20 + i * (kw + 10)
        draw_rounded_rect(draw, [kx, stat_y + 46, kx + kw, stat_y + 140], 12, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
        draw.text((kx + 14, stat_y + 58), t_name, font=f_reg_11, fill=(100, 116, 139))
        draw.text((kx + 14, stat_y + 80), val, font=f_bold_15, fill=(15, 23, 42))
        draw.text((kx + 14, stat_y + 110), diff, font=f_bold_11, fill=c_col)

    # RIGHT COLUMN: REAL-TIME STOREFRONT PREVIEW (SMARTPHONE MOCKUP)
    col2_x = col1_x + col1_w + 30
    col2_y = col1_y
    col2_w = mc_w - col1_w - 30

    # Preview Header
    draw.text((col2_x + 10, col2_y), "Jonli ko'rinish (Real-time Storefront):", font=f_bold_15, fill=(15, 23, 42))
    draw_rounded_rect(draw, [col2_x + col2_w - 180, col2_y - 6, col2_x + col2_w, col2_y + 26], 14, fill=(241, 245, 249))
    draw.text((col2_x + col2_w - 160, col2_y + 2), "Mobil (iPhone)", font=f_bold_11, fill=(124, 58, 237))

    # Phone Frame Container
    phone_w, phone_h = 420, 680
    px = col2_x + (col2_w - phone_w) // 2
    py = col2_y + 40

    # Phone shadow
    p_shadow = Image.new("RGBA", (phone_w + 60, phone_h + 60), (0, 0, 0, 0))
    p_s_draw = ImageDraw.Draw(p_shadow)
    p_s_draw.rounded_rectangle([30, 30, phone_w + 30, phone_h + 30], radius=44, fill=(0, 0, 0, 80))
    p_shadow = p_shadow.filter(ImageFilter.GaussianBlur(25))
    img.alpha_composite(p_shadow, (px - 30, py - 30))

    # Phone Titanium Rim & Screen
    draw_rounded_rect(draw, [px, py, px + phone_w, py + phone_h], 44, fill=(15, 23, 42), outline=(100, 116, 139), width=3)
    draw_rounded_rect(draw, [px + 8, py + 8, px + phone_w - 8, py + phone_h - 8], 38, fill=(248, 250, 252))

    # Dynamic Island
    draw_rounded_rect(draw, [px + phone_w//2 - 60, py + 14, px + phone_w//2 + 60, py + 38], 12, fill=(0, 0, 0))

    # Storefront Header in Phone
    draw_rounded_rect(draw, [px + 8, py + 48, px + phone_w - 8, py + 96], 0, fill=(255, 255, 255))
    draw_rounded_rect(draw, [px + 20, py + 56, px + 52, py + 88], 8, fill=(15, 23, 42))
    draw.text((px + 28, py + 64), "P", font=f_bold_13, fill=(52, 211, 153))
    draw.text((px + 62, py + 62), "StoreBox Demo Restoran", font=f_bold_13, fill=(15, 23, 42))
    draw_rounded_rect(draw, [px + phone_w - 60, py + 58, px + phone_w - 20, py + 86], 8, fill=(243, 232, 255))
    draw.text((px + phone_w - 48, py + 64), "2", font=f_bold_13, fill=(124, 58, 237))

    # Storefront Promo Banner
    draw_rounded_rect(draw, [px + 18, py + 104, px + phone_w - 18, py + 230], 18, fill=(20, 14, 46))
    draw_rounded_rect(draw, [px + 30, py + 116, px + 95, py + 138], 8, fill=(239, 68, 68))
    draw.text((px + 40, py + 120), "AKSIYA", font=f_bold_11, fill=(255, 255, 255))
    draw.text((px + 30, py + 148), "StoreBox Demo Restoran", font=f_bold_18, fill=(255, 255, 255))
    draw.text((px + 30, py + 176), "Eng sara taomlar va tezkor yetkazish", font=f_reg_11, fill=(216, 180, 254))
    draw_rounded_rect(draw, [px + 30, py + 196, px + 120, py + 218], 10, fill=(52, 211, 153, 40))
    draw.text((px + 40, py + 200), "25-35 min", font=f_bold_11, fill=(52, 211, 153))

    # Storefront Categories Chips
    cats = ["Barchasi", "Fast-Fud", "Issiq taomlar", "Salatlar"]
    cx = px + 18
    for i, c in enumerate(cats):
        cw = 88
        bg = (124, 58, 237) if i == 0 else (255, 255, 255)
        tc = (255, 255, 255) if i == 0 else (51, 65, 85)
        draw_rounded_rect(draw, [cx, py + 242, cx + cw, py + 276], 16, fill=bg, outline=(226, 232, 240), width=1)
        draw.text((cx + 14, py + 252), c, font=f_bold_11, fill=tc)
        cx += cw + 8

    # Storefront Product Cards
    prod_w = (phone_w - 48) // 2
    
    # Product 1: Burger
    p1_x = px + 18
    draw_rounded_rect(draw, [p1_x, py + 290, p1_x + prod_w, py + 480], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw_rounded_rect(draw, [p1_x + 8, py + 298, p1_x + prod_w - 8, py + 390], 12, fill=(254, 243, 199))
    draw.text((p1_x + 40, py + 335), "[ BURGER ]", font=f_bold_13, fill=(180, 83, 9))
    draw_rounded_rect(draw, [p1_x + 14, py + 306, p1_x + 60, py + 326], 6, fill=(239, 68, 68))
    draw.text((p1_x + 20, py + 309), "-13%", font=f_bold_11, fill=(255, 255, 255))
    draw.text((p1_x + 12, py + 400), "Katta Burger Classic", font=f_bold_13, fill=(15, 23, 42))
    draw.text((p1_x + 12, py + 420), "Marmar mol go'shti", font=f_reg_11, fill=(148, 163, 184))
    draw.text((p1_x + 12, py + 445), "48 000 UZS", font=f_bold_15, fill=(16, 185, 129))

    # Product 2: Pizza
    p2_x = p1_x + prod_w + 12
    draw_rounded_rect(draw, [p2_x, py + 290, p2_x + prod_w, py + 480], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw_rounded_rect(draw, [p2_x + 8, py + 298, p2_x + prod_w - 8, py + 390], 12, fill=(254, 226, 226))
    draw.text((p2_x + 46, py + 335), "[ PITSA ]", font=f_bold_13, fill=(185, 28, 28))
    draw_rounded_rect(draw, [p2_x + 14, py + 306, p2_x + 60, py + 326], 6, fill=(239, 68, 68))
    draw.text((p2_x + 20, py + 309), "-13%", font=f_bold_11, fill=(255, 255, 255))
    draw.text((p2_x + 12, py + 400), "Pitsa Margarita 32sm", font=f_bold_13, fill=(15, 23, 42))
    draw.text((p2_x + 12, py + 420), "Mozzarella pishlog'i", font=f_reg_11, fill=(148, 163, 184))
    draw.text((p2_x + 12, py + 445), "65 000 UZS", font=f_bold_15, fill=(16, 185, 129))

    # Floating order toast in phone
    toast_y = py + 500
    draw_rounded_rect(draw, [px + 18, toast_y, px + phone_w - 18, toast_y + 64], 14, fill=(15, 23, 42), outline=(51, 65, 85))
    draw.ellipse([px + 30, toast_y + 20, px + 54, toast_y + 44], fill=(16, 185, 129))
    draw.text((px + 64, toast_y + 14), "Yangi buyurtma qabul qilindi!", font=f_bold_11, fill=(255, 255, 255))
    draw.text((px + 64, toast_y + 34), "+96 000 UZS (2 ta burger) • Payme", font=f_bold_11, fill=(52, 211, 153))

    out_path = os.path.join(OUTPUT_DIR, "hero-dashboard-desktop.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

# 2. HERO DASHBOARD MOBILE (800 x 1400) — AUTHENTIC LIGHT MOBILE VIEW
def generate_hero_dashboard_mobile():
    w, h = 800, 1400
    img = Image.new("RGBA", (w, h), (8, 4, 23, 255))
    draw_gradient_background(img, (13, 7, 38), (8, 4, 23))
    draw = ImageDraw.Draw(img)

    f_bold_24 = get_font(24, bold=True)
    f_bold_20 = get_font(20, bold=True)
    f_bold_18 = get_font(18, bold=True)
    f_bold_16 = get_font(16, bold=True)
    f_bold_14 = get_font(14, bold=True)
    f_reg_14 = get_font(14)
    f_bold_12 = get_font(12, bold=True)
    f_reg_12 = get_font(12)

    # Outer device container with light card styling
    draw_rounded_rect(draw, [24, 24, w - 24, h - 24], 32, fill=(248, 250, 252), outline=(255, 255, 255, 100), width=2)

    # Header
    draw_rounded_rect(draw, [40, 40, w - 40, 110], 18, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw_rounded_rect(draw, [56, 52, 98, 94], 12, fill=(124, 58, 237))
    draw.text((70, 60), "S", font=f_bold_24, fill=(255, 255, 255))
    draw.text((115, 52), "StoreBox Platform", font=f_bold_18, fill=(15, 23, 42))
    draw.text((115, 80), "shop-655.storebox.uz • Pro", font=f_reg_12, fill=(100, 116, 139))
    draw_rounded_rect(draw, [w - 150, 56, w - 60, 90], 12, fill=(243, 232, 255))
    draw.text((w - 130, 66), "Onlayn", font=f_bold_12, fill=(124, 58, 237))

    # Revenue Card
    draw_rounded_rect(draw, [40, 130, w - 40, 290], 20, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((64, 150), "Bugungi tushum (Live)", font=f_reg_14, fill=(100, 116, 139))
    draw.text((64, 180), "+14 850 000 UZS", font=f_bold_24, fill=(15, 23, 42))
    draw_rounded_rect(draw, [64, 230, 260, 268], 10, fill=(240, 253, 244))
    draw.text((76, 240), "+28.4% o'sish bugun", font=f_bold_12, fill=(16, 185, 129))

    # Micro stats grid
    m_w = (w - 100) // 2
    draw_rounded_rect(draw, [40, 310, 40 + m_w, 420], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((58, 330), "Buyurtmalar", font=f_reg_12, fill=(100, 116, 139))
    draw.text((58, 355), "24 ta", font=f_bold_20, fill=(15, 23, 42))
    draw.text((58, 388), "+4 yangi", font=f_bold_12, fill=(59, 130, 246))

    draw_rounded_rect(draw, [60 + m_w, 310, w - 40, 420], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((78 + m_w, 330), "O'rtacha chek", font=f_reg_12, fill=(100, 116, 139))
    draw.text((78 + m_w, 355), "185 000 UZS", font=f_bold_18, fill=(15, 23, 42))
    draw.text((78 + m_w, 388), "Konversiya 4.8%", font=f_bold_12, fill=(168, 85, 247))

    # Real Design Studio Niche Selector on Mobile
    draw_rounded_rect(draw, [40, 440, w - 40, 680], 20, fill=(20, 14, 46), outline=(124, 58, 237, 100), width=1)
    draw.text((64, 465), "AI Dizayn Studio — Noutbuk va Telefon", font=f_bold_18, fill=(255, 255, 255))
    draw.text((64, 495), "Do'koningiz turiga mos dizaynni tanlang:", font=f_reg_12, fill=(216, 180, 254))

    mobile_niches = ["Restoran & Kafe", "Gullar & Sovg'a", "Kiyim & Butik", "Elektronika"]
    my = 530
    for mn in mobile_niches:
        draw_rounded_rect(draw, [64, my, w - 64, my + 44], 10, fill=(35, 25, 75))
        draw.text((84, my + 14), mn, font=f_bold_14, fill=(255, 255, 255))
        my += 54

    # Recent Orders
    draw.text((44, 720), "So'nggi kelib tushgan buyurtmalar", font=f_bold_20, fill=(15, 23, 42))

    orders = [
        ("RB-89241", "Sarvarbek E.", "107 000 UZS", "Kuryer yo'lda", (16, 185, 129)),
        ("RB-89242", "Dilnoza K.", "248 500 UZS", "Yangi buyurtma", (59, 130, 246)),
        ("RB-89243", "Azizbek R.", "65 000 UZS", "Oshxonada", (245, 158, 11)),
        ("RB-89244", "Malika A.", "320 000 UZS", "Yetkazildi", (100, 116, 139)),
    ]

    oy = 760
    for oid, name, amount, st, col in orders:
        draw_rounded_rect(draw, [40, oy, w - 40, oy + 86], 16, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
        draw.text((60, oy + 18), f"#{oid} • {name}", font=f_bold_14, fill=(15, 23, 42))
        draw.text((60, oy + 48), amount, font=f_bold_16, fill=(16, 185, 129))

        draw_rounded_rect(draw, [w - 180, oy + 26, w - 56, oy + 58], 10, fill=(col[0], col[1], col[2], 25))
        draw.text((w - 165, oy + 34), st, font=f_bold_12, fill=col)
        oy += 100

    draw_rounded_rect(draw, [40, h - 110, w - 40, h - 45], 18, fill=(124, 58, 237))
    draw.text((w//2 - 130, h - 85), "+ Yangi buyurtma kiritish", font=f_bold_16, fill=(255, 255, 255))

    out_path = os.path.join(OUTPUT_DIR, "hero-dashboard-mobile.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

if __name__ == "__main__":
    generate_hero_dashboard_desktop()
    generate_hero_dashboard_mobile()
