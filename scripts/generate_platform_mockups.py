"""
Generate high-fidelity presentation images and device mockups for StoreBox Platform.
Follows STOREBOX_REDESIGN_TZ.md Section 14 requirements:
1. hero-dashboard-desktop.png
2. hero-dashboard-mobile.png
3. storefront-product-mobile.png
4. restaurant-mobile.png
5. chat-showcase.png
6. design-studio-showcase.png
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Font loading helper
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

# 1. HERO DASHBOARD DESKTOP (1920 x 1080)
def generate_hero_dashboard_desktop():
    w, h = 1920, 1080
    img = Image.new("RGBA", (w, h), (7, 5, 25, 255))
    draw_gradient_background(img, (11, 8, 35), (7, 5, 25))

    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([w//2 - 400, -100, w//2 + 400, 500], fill=(124, 58, 237, 45))
    glow_draw.ellipse([200, 300, 700, 800], fill=(79, 70, 229, 30))
    glow_draw.ellipse([w - 600, 200, w - 100, 700], fill=(167, 139, 250, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img.alpha_composite(glow)

    draw = ImageDraw.Draw(img)

    for x in range(0, w, 60):
        draw.line([(x, 700), (int(w/2 + (x - w/2) * 2.2), h)], fill=(124, 58, 237, 18), width=1)
    for y in range(700, h, 40):
        draw.line([(0, y), (w, y)], fill=(124, 58, 237, 20), width=1)

    frame_x, frame_y = 160, 90
    frame_w, frame_h = 1600, 920
    draw_rounded_rect(draw, [frame_x, frame_y, frame_x + frame_w, frame_y + frame_h], 28, fill=(18, 14, 40, 250), outline=(124, 58, 237, 90), width=2)

    draw_rounded_rect(draw, [frame_x, frame_y, frame_x + frame_w, frame_y + 54], 28, fill=(24, 18, 52, 255))
    draw.rectangle([frame_x, frame_y + 30, frame_x + frame_w, frame_y + 54], fill=(24, 18, 52, 255))
    draw.line([(frame_x, frame_y + 54), (frame_x + frame_w, frame_y + 54)], fill=(40, 30, 80), width=1)

    draw.ellipse([frame_x + 24, frame_y + 20, frame_x + 36, frame_y + 32], fill=(255, 95, 87))
    draw.ellipse([frame_x + 44, frame_y + 20, frame_x + 56, frame_y + 32], fill=(254, 188, 46))
    draw.ellipse([frame_x + 64, frame_y + 20, frame_x + 76, frame_y + 32], fill=(40, 200, 64))

    f_bold_16 = get_font(16, bold=True)
    f_reg_14 = get_font(14)
    f_bold_22 = get_font(22, bold=True)
    f_reg_12 = get_font(12)
    f_bold_12 = get_font(12, bold=True)

    draw.text((frame_x + 100, frame_y + 17), "StoreBox 2.0 — Do'kon Boshqaruv Paneli", font=f_bold_16, fill=(240, 240, 255))
    draw.text((frame_x + frame_w - 240, frame_y + 18), "• Jonli rejim: 0.0.0.0:8000", font=f_bold_12, fill=(52, 211, 153))

    sb_w = 300
    sb_x = frame_x
    sb_y = frame_y + 55
    sb_h = frame_h - 55

    draw.rectangle([sb_x, sb_y, sb_x + sb_w, sb_y + sb_h], fill=(14, 10, 32))
    draw.line([(sb_x + sb_w, sb_y), (sb_x + sb_w, sb_y + sb_h)], fill=(40, 30, 80), width=1)

    draw_rounded_rect(draw, [sb_x + 16, sb_y + 20, sb_x + sb_w - 16, sb_y + 70], 14, fill=(28, 20, 60), outline=(124, 58, 237, 80), width=1)
    draw.ellipse([sb_x + 28, sb_y + 30, sb_x + 58, sb_y + 60], fill=(124, 58, 237))
    draw.text((sb_x + 37, sb_y + 35), "S", font=f_bold_16, fill=(255, 255, 255))
    draw.text((sb_x + 70, sb_y + 28), "StoreBox Demo", font=get_font(14, bold=True), fill=(255, 255, 255))
    draw.text((sb_x + 70, sb_y + 48), "storebox.uz • Pro tarif", font=f_reg_12, fill=(160, 160, 190))

    nav_items = [
        ("Boshqaruv paneli", True, "📊"),
        ("Buyurtmalar", False, "🛍️", "7"),
        ("Mahsulotlar", False, "📦", "186"),
        ("Kategoriyalar", False, "🗂️"),
        ("Mijozlar bazasi", False, "👥", "94"),
        ("Mijozlar bilan chat", False, "💬", "Yangi"),
        ("Marketing & Aksiya", False, "🚀"),
        ("Dizayn & AI Studiya", False, "🎨"),
        ("Sozlamalar", False, "⚙️"),
    ]
    cur_y = sb_y + 90
    for item in nav_items:
        title = item[0]
        is_active = item[1]
        icon = item[2]
        badge = item[3] if len(item) > 3 else None

        if is_active:
            draw_rounded_rect(draw, [sb_x + 16, cur_y, sb_x + sb_w - 16, cur_y + 42], 12, fill=(124, 58, 237, 220))
            text_color = (255, 255, 255)
        else:
            text_color = (180, 180, 210)

        draw.text((sb_x + 30, cur_y + 11), f"{icon}  {title}", font=get_font(14, bold=True), fill=text_color)
        if badge:
            badge_bg = (16, 185, 129) if badge == "7" or badge == "Yangi" else (45, 35, 90)
            draw_rounded_rect(draw, [sb_x + sb_w - 65, cur_y + 10, sb_x + sb_w - 26, cur_y + 32], 10, fill=badge_bg)
            draw.text((sb_x + sb_w - 55, cur_y + 13), badge, font=f_bold_12, fill=(255, 255, 255))
        cur_y += 48

    mc_x = sb_x + sb_w + 30
    mc_y = sb_y + 25
    mc_w = frame_w - sb_w - 60

    kpis = [
        ("Bugungi tushum", "14 850 000 UZS", "+28.4% o'sish", (16, 185, 129), (34, 197, 94, 25)),
        ("Faol buyurtmalar", "24 ta", "+4 yangi", (59, 130, 246), (59, 130, 246, 25)),
        ("O'rtacha chek", "185 000 UZS", "Stabil", (168, 85, 247), (168, 85, 247, 25)),
        ("Konversiya", "4.8%", "+1.2% o'sish", (245, 158, 11), (245, 158, 11, 25)),
    ]
    kpi_w = (mc_w - 45) // 4
    for i, (title, val, change, col, bg_col) in enumerate(kpis):
        kx = mc_x + i * (kpi_w + 15)
        draw_rounded_rect(draw, [kx, mc_y, kx + kpi_w, mc_y + 110], 18, fill=(24, 18, 52), outline=(50, 40, 95), width=1)
        draw.text((kx + 18, mc_y + 16), title, font=f_reg_14, fill=(170, 170, 205))
        draw.text((kx + 18, mc_y + 40), val, font=f_bold_22, fill=(255, 255, 255))
        draw_rounded_rect(draw, [kx + 18, mc_y + 74, kx + 120, mc_y + 98], 8, fill=bg_col)
        draw.text((kx + 26, mc_y + 77), change, font=f_bold_12, fill=col)

    chart_y = mc_y + 130
    chart_h = 320
    draw_rounded_rect(draw, [mc_x, chart_y, mc_x + mc_w, chart_y + chart_h], 20, fill=(22, 16, 48), outline=(45, 35, 90), width=1)

    draw.text((mc_x + 24, chart_y + 20), "Savdo ko'rsatkichlari dinamikasi (Haftalik daromad)", font=f_bold_16, fill=(255, 255, 255))
    draw.text((mc_x + mc_w - 180, chart_y + 22), "Jami: 94 200 000 UZS", font=get_font(14, bold=True), fill=(167, 139, 250))

    cx0, cy0 = mc_x + 50, chart_y + 70
    cw, ch = mc_w - 100, 200
    points = [
        (0.0, 0.35), (0.16, 0.45), (0.33, 0.30), (0.50, 0.65), (0.66, 0.55), (0.83, 0.85), (1.0, 0.78)
    ]
    days = ["Dsh", "Ssh", "Chr", "Pay", "Jum", "Shan", "Yak"]

    for i, day in enumerate(days):
        gx = int(cx0 + (i / 6.0) * cw)
        draw.line([(gx, cy0), (gx, cy0 + ch)], fill=(40, 30, 80), width=1)
        draw.text((gx - 12, cy0 + ch + 12), day, font=f_bold_12, fill=(150, 150, 180))

    curve_pixel_points = []
    for px_ratio, py_ratio in points:
        px = int(cx0 + px_ratio * cw)
        py = int(cy0 + ch - py_ratio * ch)
        curve_pixel_points.append((px, py))

    for i in range(len(curve_pixel_points) - 1):
        p1 = curve_pixel_points[i]
        p2 = curve_pixel_points[i+1]
        draw.line([p1, p2], fill=(124, 58, 237), width=4)
        draw.ellipse([p1[0]-6, p1[1]-6, p1[0]+6, p1[1]+6], fill=(255, 255, 255), outline=(124, 58, 237), width=3)
    last_p = curve_pixel_points[-1]
    draw.ellipse([last_p[0]-6, last_p[1]-6, last_p[0]+6, last_p[1]+6], fill=(255, 255, 255), outline=(124, 58, 237), width=3)

    tbl_y = chart_y + chart_h + 20
    tbl_h = 340
    draw_rounded_rect(draw, [mc_x, tbl_y, mc_x + mc_w, tbl_y + tbl_h], 20, fill=(22, 16, 48), outline=(45, 35, 90), width=1)

    draw.text((mc_x + 24, tbl_y + 18), "So'nggi kelib tushgan buyurtmalar", font=f_bold_16, fill=(255, 255, 255))
    draw_rounded_rect(draw, [mc_x + mc_w - 140, tbl_y + 14, mc_x + mc_w - 20, tbl_y + 44], 10, fill=(124, 58, 237))
    draw.text((mc_x + mc_w - 128, tbl_y + 20), "+ Yangi buyurtma", font=f_bold_12, fill=(255, 255, 255))

    orders = [
        ("#RB-89241", "Sarvarbek E. (Toshkent)", "2x Big Burger, 1x Fri, 2x Cola", "107 000 UZS", "Kuryer yo'lda", (16, 185, 129)),
        ("#RB-89242", "Dilnoza K. (Samarqand)", "1x Pitsa Margarita, 1x Chizkeyk", "248 500 UZS", "Yangi buyurtma", (59, 130, 246)),
        ("#RB-89243", "Azizbek R. (Buxoro)", "3x Tandir Somsa, 1x Ko'k choy", "65 000 UZS", "Oshxonada tayyorlanmoqda", (245, 158, 11)),
        ("#RB-89244", "Malika A. (Farg'ona)", "1x Sushi Set Filadelfiya 32 dona", "320 000 UZS", "Yetkazib berildi", (148, 163, 184)),
    ]

    row_y = tbl_y + 60
    draw.line([(mc_x + 20, row_y), (mc_x + mc_w - 20, row_y)], fill=(40, 30, 80), width=1)
    draw.text((mc_x + 24, row_y + 10), "Buyurtma ID", font=f_bold_12, fill=(140, 140, 175))
    draw.text((mc_x + 170, row_y + 10), "Mijoz", font=f_bold_12, fill=(140, 140, 175))
    draw.text((mc_x + 450, row_y + 10), "Tarkibi", font=f_bold_12, fill=(140, 140, 175))
    draw.text((mc_x + 850, row_y + 10), "Summa", font=f_bold_12, fill=(140, 140, 175))
    draw.text((mc_x + 1050, row_y + 10), "Holat", font=f_bold_12, fill=(140, 140, 175))

    row_y += 38
    for oid, cust, items, price, status, st_col in orders:
        draw.line([(mc_x + 20, row_y), (mc_x + mc_w - 20, row_y)], fill=(32, 24, 65), width=1)
        draw.text((mc_x + 24, row_y + 16), oid, font=get_font(14, bold=True), fill=(167, 139, 250))
        draw.text((mc_x + 170, row_y + 16), cust, font=get_font(14, bold=True), fill=(255, 255, 255))
        draw.text((mc_x + 450, row_y + 17), items, font=f_reg_14, fill=(190, 190, 220))
        draw.text((mc_x + 850, row_y + 16), price, font=get_font(14, bold=True), fill=(52, 211, 153))

        draw_rounded_rect(draw, [mc_x + 1045, row_y + 11, mc_x + 1220, row_y + 38], 10, fill=(st_col[0], st_col[1], st_col[2], 30))
        draw.text((mc_x + 1060, row_y + 16), status, font=f_bold_12, fill=st_col)
        row_y += 58

    out_path = os.path.join(OUTPUT_DIR, "hero-dashboard-desktop.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

# 2. HERO DASHBOARD MOBILE (800 x 1400)
def generate_hero_dashboard_mobile():
    w, h = 800, 1400
    img = Image.new("RGBA", (w, h), (14, 10, 32, 255))
    draw_gradient_background(img, (20, 14, 46), (10, 6, 26))
    draw = ImageDraw.Draw(img)

    f_bold_24 = get_font(24, bold=True)
    f_bold_20 = get_font(20, bold=True)
    f_bold_18 = get_font(18, bold=True)
    f_bold_16 = get_font(16, bold=True)
    f_bold_14 = get_font(14, bold=True)
    f_reg_14 = get_font(14)
    f_bold_12 = get_font(12, bold=True)
    f_reg_12 = get_font(12)

    draw_rounded_rect(draw, [24, 24, w - 24, 80], 20, fill=(28, 20, 60), outline=(124, 58, 237, 80), width=1)
    draw.ellipse([40, 35, 76, 71], fill=(124, 58, 237))
    draw.text((51, 42), "S", font=f_bold_18, fill=(255, 255, 255))
    draw.text((90, 36), "StoreBox Dashboard", font=f_bold_18, fill=(255, 255, 255))
    draw.text((90, 58), "Online do'kon • Pro tarif", font=f_reg_12, fill=(160, 160, 190))

    draw_rounded_rect(draw, [24, 100, w - 24, 260], 24, fill=(28, 20, 65), outline=(124, 58, 237, 100), width=1)
    draw.text((44, 120), "Bugungi sof tushum", font=f_reg_14, fill=(180, 180, 210))
    draw.text((44, 150), "14 850 000 UZS", font=f_bold_24, fill=(255, 255, 255))

    draw_rounded_rect(draw, [44, 200, 240, 235], 10, fill=(16, 185, 129, 40))
    draw.text((56, 208), "+28.4% kechagiga nisbatan", font=f_bold_12, fill=(52, 211, 153))

    m_w = (w - 60) // 2
    draw_rounded_rect(draw, [24, 280, 24 + m_w, 390], 20, fill=(22, 16, 50), outline=(50, 40, 95), width=1)
    draw.text((40, 300), "Faol buyurtmalar", font=f_reg_12, fill=(160, 160, 190))
    draw.text((40, 330), "24 ta", font=f_bold_20, fill=(255, 255, 255))
    draw.text((40, 362), "+4 yangi bugun", font=f_bold_12, fill=(59, 130, 246))

    draw_rounded_rect(draw, [36 + m_w, 280, w - 24, 390], 20, fill=(22, 16, 50), outline=(50, 40, 95), width=1)
    draw.text((52 + m_w, 300), "O'rtacha chek", font=f_reg_12, fill=(160, 160, 190))
    draw.text((52 + m_w, 330), "185 000 UZS", font=f_bold_18, fill=(255, 255, 255))
    draw.text((52 + m_w, 362), "Konversiya 4.8%", font=f_bold_12, fill=(168, 85, 247))

    draw.text((28, 420), "So'nggi jonli buyurtmalar", font=f_bold_20, fill=(255, 255, 255))

    orders = [
        ("RB-89241", "Sarvarbek E.", "107 000 UZS", "Kuryer yo'lda", (16, 185, 129)),
        ("RB-89242", "Dilnoza K.", "248 500 UZS", "Yangi buyurtma", (59, 130, 246)),
        ("RB-89243", "Azizbek R.", "65 000 UZS", "Tayyorlanmoqda", (245, 158, 11)),
        ("RB-89244", "Malika A.", "320 000 UZS", "Yetkazildi", (148, 163, 184)),
        ("RB-89245", "Jahongir U.", "89 000 UZS", "Yangi buyurtma", (59, 130, 246)),
        ("RB-89246", "Nodirbek T.", "175 000 UZS", "Kuryer yo'lda", (16, 185, 129)),
    ]

    oy = 460
    for oid, name, amount, st, col in orders:
        draw_rounded_rect(draw, [24, oy, w - 24, oy + 88], 18, fill=(22, 16, 50), outline=(45, 35, 90), width=1)
        draw.text((42, oy + 18), f"#{oid}", font=f_bold_14, fill=(167, 139, 250))
        draw.text((150, oy + 18), name, font=f_bold_16, fill=(255, 255, 255))
        draw.text((42, oy + 48), amount, font=f_bold_16, fill=(52, 211, 153))

        draw_rounded_rect(draw, [w - 180, oy + 28, w - 40, oy + 60], 10, fill=(col[0], col[1], col[2], 40))
        draw.text((w - 165, oy + 36), st, font=f_bold_12, fill=col)
        oy += 102

    draw_rounded_rect(draw, [24, h - 110, w - 24, h - 35], 20, fill=(124, 58, 237))
    draw.text((w//2 - 130, h - 82), "+ Yangi buyurtma ochish", font=f_bold_16, fill=(255, 255, 255))

    out_path = os.path.join(OUTPUT_DIR, "hero-dashboard-mobile.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

# 3. STOREFRONT PRODUCT MOBILE (800 x 1600)
def generate_storefront_product_mobile():
    w, h = 800, 1600
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    f_bold_24 = get_font(24, bold=True)
    f_bold_20 = get_font(20, bold=True)
    f_bold_18 = get_font(18, bold=True)
    f_bold_16 = get_font(16, bold=True)
    f_bold_14 = get_font(14, bold=True)
    f_bold_12 = get_font(12, bold=True)
    f_reg_14 = get_font(14)
    f_reg_12 = get_font(12)

    draw.rectangle([0, 0, w, 80], fill=(255, 255, 255))
    draw.line([(0, 80), (w, 80)], fill=(226, 232, 240), width=1)
    draw.text((36, 28), "←", font=f_bold_24, fill=(15, 23, 42))
    draw.text((100, 30), "StoreBox Do'kon", font=f_bold_18, fill=(15, 23, 42))
    draw.text((w - 90, 30), "❤️", font=f_bold_20, fill=(225, 29, 72))
    draw.text((w - 50, 30), "🛒", font=f_bold_20, fill=(15, 23, 42))

    draw_rounded_rect(draw, [24, 104, w - 24, 620], 28, fill=(241, 245, 249), outline=(226, 232, 240), width=1)
    draw.ellipse([180, 200, 620, 520], fill=(221, 214, 254))
    draw.text((w//2 - 70, 310), "👟", font=get_font(120), fill=(124, 58, 237))

    draw_rounded_rect(draw, [44, 124, 150, 164], 12, fill=(225, 29, 72))
    draw.text((56, 134), "-14% AKSIYA", font=f_bold_12, fill=(255, 255, 255))

    draw_rounded_rect(draw, [w - 200, 124, w - 44, 164], 12, fill=(209, 250, 229))
    draw.text((w - 186, 135), "Omborda: 18 dona", font=f_bold_12, fill=(5, 150, 105))

    draw.text((28, 650), "Nike Air Max 270 React Premium", font=f_bold_24, fill=(15, 23, 42))
    draw.text((28, 690), "⭐⭐⭐⭐⭐  4.9 (128 sharh) • Artikul: #SB-9018", font=f_reg_14, fill=(100, 116, 139))

    draw.text((28, 730), "1 250 000 UZS", font=f_bold_24, fill=(124, 58, 237))
    draw.text((280, 736), "1 450 000 UZS", font=f_bold_16, fill=(148, 163, 184))
    draw.line([(280, 747), (410, 747)], fill=(148, 163, 184), width=2)

    draw.text((28, 800), "O'lchamni tanlang (EU):", font=f_bold_16, fill=(15, 23, 42))
    sizes = ["40", "41", "42 (Faol)", "43", "44"]
    sx = 28
    for s in sizes:
        is_sel = "Faol" in s
        sw = 120 if is_sel else 80
        fill_col = (124, 58, 237) if is_sel else (255, 255, 255)
        txt_col = (255, 255, 255) if is_sel else (15, 23, 42)
        out_col = (124, 58, 237) if is_sel else (203, 213, 225)
        draw_rounded_rect(draw, [sx, 835, sx + sw, 885], 14, fill=fill_col, outline=out_col, width=2 if is_sel else 1)
        draw.text((sx + 20, 850), s.replace(" (Faol)", ""), font=f_bold_14, fill=txt_col)
        sx += sw + 16

    draw.text((28, 920), "Rangni tanlang:", font=f_bold_16, fill=(15, 23, 42))
    colors = [((15, 23, 42), "Qora"), ((255, 255, 255), "Oq"), ((59, 130, 246), "Moviy")]
    cx = 28
    for col, cname in colors:
        draw_rounded_rect(draw, [cx, 955, cx + 130, 1005], 14, fill=(255, 255, 255), outline=(203, 213, 225), width=1)
        draw.ellipse([cx + 12, 967, cx + 36, 991], fill=col, outline=(148, 163, 184), width=1)
        draw.text((cx + 46, 970), cname, font=f_bold_14, fill=(15, 23, 42))
        cx += 146

    draw_rounded_rect(draw, [24, 1030, w - 24, 1160], 20, fill=(241, 245, 249), outline=(226, 232, 240), width=1)
    draw.text((44, 1050), "🚚  O'zbekiston bo'ylab tezkor yetkazib berish (1-2 kun)", font=f_bold_14, fill=(15, 23, 42))
    draw.text((44, 1085), "💳  Click, Payme, Uzum Pay va Naqd to'lov qabul qilinadi", font=f_bold_14, fill=(15, 23, 42))
    draw.text((44, 1120), "🔄  14 kun ichida bepul almashtirish va kafolat", font=f_bold_14, fill=(15, 23, 42))

    draw.text((28, 1190), "Mahsulot haqida ma'lumot", font=f_bold_18, fill=(15, 23, 42))
    desc1 = "Nike Air Max 270 kundalik kiyish uchun maxsus ishlab chiqilgan bo'lib,"
    desc2 = "har qadamda yumshoq amortizatsiya va maksimal qulaylikni ta'minlaydi."
    desc3 = "Nafas oluvchi to'rli material oyoqni qizib ketishdan saqlaydi."
    draw.text((28, 1225), desc1, font=f_reg_14, fill=(71, 85, 105))
    draw.text((28, 1250), desc2, font=f_reg_14, fill=(71, 85, 105))
    draw.text((28, 1275), desc3, font=f_reg_14, fill=(71, 85, 105))

    draw.rectangle([0, h - 140, w, h], fill=(255, 255, 255))
    draw.line([(0, h - 140), (w, h - 140)], fill=(226, 232, 240), width=1)

    draw_rounded_rect(draw, [24, h - 110, 160, h - 45], 16, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
    draw.text((48, h - 92), "-", font=f_bold_24, fill=(15, 23, 42))
    draw.text((88, h - 90), "1", font=f_bold_20, fill=(15, 23, 42))
    draw.text((128, h - 92), "+", font=f_bold_24, fill=(15, 23, 42))

    draw_rounded_rect(draw, [180, h - 110, w - 24, h - 45], 16, fill=(124, 58, 237))
    draw.text((w//2 - 100, h - 88), "Savatga qo'shish • 1 250 000 UZS", font=f_bold_16, fill=(255, 255, 255))

    out_path = os.path.join(OUTPUT_DIR, "storefront-product-mobile.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

# 4. RESTAURANT STOREFRONT MOBILE (800 x 1600)
def generate_restaurant_mobile():
    w, h = 800, 1600
    img = Image.new("RGBA", (w, h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    f_bold_24 = get_font(24, bold=True)
    f_bold_20 = get_font(20, bold=True)
    f_bold_18 = get_font(18, bold=True)
    f_bold_16 = get_font(16, bold=True)
    f_bold_14 = get_font(14, bold=True)
    f_bold_12 = get_font(12, bold=True)
    f_reg_14 = get_font(14)
    f_reg_12 = get_font(12)

    draw.rectangle([0, 0, w, 80], fill=(255, 255, 255))
    draw.line([(0, 80), (w, 80)], fill=(226, 232, 240), width=1)
    draw.text((28, 28), "🍔 StoreBox Burger & Restoran", font=f_bold_20, fill=(15, 23, 42))
    draw_rounded_rect(draw, [w - 140, 22, w - 28, 58], 18, fill=(209, 250, 229))
    draw.text((w - 122, 32), "● Ochiq", font=f_bold_12, fill=(5, 150, 105))

    draw.text((28, 95), "📍 Boburshoh dahasi, 111  •  ⭐ 4.9 (240+ sharh)", font=f_reg_14, fill=(100, 116, 139))

    draw_rounded_rect(draw, [24, 130, w - 24, 380], 24, fill=(24, 18, 52), outline=(124, 58, 237, 60), width=1)
    draw_rounded_rect(draw, [44, 150, 190, 185], 10, fill=(225, 29, 72))
    draw.text((58, 158), "MAXSUS KOMBO", font=f_bold_12, fill=(255, 255, 255))

    draw.text((44, 205), "Big Burger + Fri + Cola Set", font=f_bold_24, fill=(255, 255, 255))
    draw.text((44, 245), "Atigi 49 000 UZS  (Eski narxi: 65 000)", font=f_reg_14, fill=(221, 214, 254))

    draw_rounded_rect(draw, [44, 295, 240, 345], 14, fill=(255, 255, 255))
    draw.text((64, 310), "Buyurtma berish →", font=f_bold_14, fill=(76, 29, 149))

    draw_rounded_rect(draw, [24, 405, w - 24, 485], 18, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((44, 425), "⏱️  Yetkazib berish: 25-40 daqiqa", font=f_bold_14, fill=(15, 23, 42))
    draw.text((44, 452), "🛵  120 000 UZS dan ortiq buyurtmalarga bepul yetkazish", font=f_reg_12, fill=(100, 116, 139))
    draw.text((w - 180, 435), "📦 Olib ketish", font=f_bold_14, fill=(124, 58, 237))

    cats = ["🍽️ Barchasi", "🍔 Burgerlar", "🍕 Pitsalar", "🥗 Salatlar", "🥤 Ichimlik"]
    cx = 24
    for i, c in enumerate(cats):
        is_sel = i == 0
        cw = 130 if i == 0 else 115
        fill_col = (124, 58, 237) if is_sel else (255, 255, 255)
        txt_col = (255, 255, 255) if is_sel else (15, 23, 42)
        draw_rounded_rect(draw, [cx, 510, cx + cw, 555], 14, fill=fill_col, outline=(203, 213, 225) if not is_sel else (124, 58, 237), width=1)
        draw.text((cx + 16, 523), c, font=f_bold_14, fill=txt_col)
        cx += cw + 12

    dishes = [
        ("Double Cheeseburger Classic", "Ikkitalik marmar mol go'shti, erigan cheddar pishloq", "42 000 UZS", "🍔", "-10%"),
        ("Pitsa Margarita 32sm", "Haqiqiy italyancha mozzarella, pomidor va rayhon", "65 000 UZS", "🍕", "Xit"),
        ("Sezar salati tovuq bilan", "Qovurilgan tovuq filesi, aysberg, parmezan va sous", "38 000 UZS", "🥗", None),
        ("Katta Lavash Standart", "Shirador mol go'shti, chipslar, mayin pomidor va bodring", "34 000 UZS", "🌯", "Top"),
        ("Qarsildoq Fri kartoshkasi", "Maxsus sous bilan tillarang fri porsiyasi", "16 000 UZS", "🍟", None),
    ]

    dy = 580
    for name, desc, price, icon, badge in dishes:
        draw_rounded_rect(draw, [24, dy, w - 24, dy + 140], 20, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
        draw_rounded_rect(draw, [40, dy + 15, 150, dy + 125], 16, fill=(241, 245, 249))
        draw.text((70, dy + 40), icon, font=get_font(48), fill=(124, 58, 237))

        if badge:
            draw_rounded_rect(draw, [40, dy + 15, 95, dy + 40], 8, fill=(225, 29, 72))
            draw.text((48, dy + 20), badge, font=f_bold_12, fill=(255, 255, 255))

        draw.text((170, dy + 22), name, font=f_bold_16, fill=(15, 23, 42))
        draw.text((170, dy + 52), desc[:48] + ("..." if len(desc)>48 else ""), font=f_reg_12, fill=(100, 116, 139))
        draw.text((170, dy + 88), price, font=f_bold_18, fill=(124, 58, 237))

        draw_rounded_rect(draw, [w - 80, dy + 80, w - 40, dy + 120], 12, fill=(124, 58, 237))
        draw.text((w - 68, dy + 86), "+", font=f_bold_20, fill=(255, 255, 255))
        dy += 158

    draw_rounded_rect(draw, [24, h - 110, w - 24, h - 35], 20, fill=(124, 58, 237))
    draw.text((48, h - 82), "2 ta taom tanlandi • Savat", font=f_bold_16, fill=(255, 255, 255))
    draw.text((w - 210, h - 82), "107 000 UZS  →", font=f_bold_16, fill=(255, 255, 255))

    out_path = os.path.join(OUTPUT_DIR, "restaurant-mobile.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

# 5. CHAT SHOWCASE (1600 x 900)
def generate_chat_showcase():
    w, h = 1600, 900
    img = Image.new("RGBA", (w, h), (14, 10, 32, 255))
    draw_gradient_background(img, (20, 14, 46), (10, 6, 26))
    draw = ImageDraw.Draw(img)

    f_bold_22 = get_font(22, bold=True)
    f_bold_18 = get_font(18, bold=True)
    f_bold_16 = get_font(16, bold=True)
    f_bold_14 = get_font(14, bold=True)
    f_reg_14 = get_font(14)
    f_bold_12 = get_font(12, bold=True)
    f_reg_12 = get_font(12)

    draw.text((w//2 - 240, 50), "StoreBox Jonli Mijozlar Chati", font=f_bold_22, fill=(255, 255, 255))
    draw.text((w//2 - 320, 85), "Telegram va Veb-sayt xabarlari bitta tezkor kassa darchasida", font=f_reg_14, fill=(167, 139, 250))

    dw_x, dw_y, dw_w, dw_h = 80, 150, 940, 680
    draw_rounded_rect(draw, [dw_x, dw_y, dw_x + dw_w, dw_y + dw_h], 24, fill=(22, 16, 48), outline=(124, 58, 237, 80), width=1)

    draw.rectangle([dw_x, dw_y, dw_x + dw_w, dw_y + 60], fill=(28, 20, 60))
    draw.text((dw_x + 30, dw_y + 18), "💬  Mijozlar bilan onlayn muloqot", font=f_bold_18, fill=(255, 255, 255))
    draw_rounded_rect(draw, [dw_x + dw_w - 180, dw_y + 14, dw_x + dw_w - 24, dw_y + 46], 10, fill=(16, 185, 129, 30))
    draw.text((dw_x + dw_w - 165, dw_y + 22), "● 12 ta yangi xabar", font=f_bold_12, fill=(52, 211, 153))

    cs_w = 320
    draw.rectangle([dw_x, dw_y + 60, dw_x + cs_w, dw_y + dw_h], fill=(18, 13, 38))
    draw.line([(dw_x + cs_w, dw_y + 60), (dw_x + cs_w, dw_y + dw_h)], fill=(40, 30, 80), width=1)

    dialogs = [
        ("Sarvarbek Ergashev", "Buyurtmam qachon yetkaziladi?", "14:22", True, "2"),
        ("Dilnoza Karimova", "Rahmat, pitsa juda mazali ekan!", "13:50", False, None),
        ("Azizbek Rahmonov", "Manzilni o'zgartirsam bo'ladimi?", "12:15", False, None),
        ("Malika Aliyeva", "Yetkazib berish bepulmi?", "11:04", False, None),
        ("Jahongir Usmonov", "Chekni yubordingizmi?", "10:30", False, None),
    ]
    dy = dw_y + 70
    for name, last_msg, time, active, unread in dialogs:
        bg = (124, 58, 237, 60) if active else (0, 0, 0, 0)
        draw_rounded_rect(draw, [dw_x + 12, dy, dw_x + cs_w - 12, dy + 68], 14, fill=bg)
        draw.ellipse([dw_x + 24, dy + 14, dw_x + 64, dy + 54], fill=(124, 58, 237) if active else (50, 40, 90))
        draw.text((dw_x + 36, dy + 22), name[0], font=f_bold_16, fill=(255, 255, 255))
        draw.text((dw_x + 76, dy + 16), name, font=f_bold_14, fill=(255, 255, 255))
        draw.text((dw_x + 76, dy + 40), last_msg[:24] + "...", font=f_reg_12, fill=(160, 160, 190))
        draw.text((dw_x + cs_w - 55, dy + 18), time, font=f_reg_12, fill=(140, 140, 170))
        if unread:
            draw_rounded_rect(draw, [dw_x + cs_w - 45, dy + 38, dw_x + cs_w - 25, dy + 58], 10, fill=(124, 58, 237))
            draw.text((dw_x + cs_w - 38, dy + 41), unread, font=f_bold_12, fill=(255, 255, 255))
        dy += 76

    cm_x = dw_x + cs_w + 24
    cm_y = dw_y + 80

    draw_rounded_rect(draw, [cm_x, cm_y, cm_x + 380, cm_y + 70], 18, fill=(35, 25, 75))
    draw.text((cm_x + 18, cm_y + 14), "Assalomu alaykum! #RB-89241 raqamli", font=f_reg_14, fill=(240, 240, 255))
    draw.text((cm_x + 18, cm_y + 36), "buyurtmam kuryerga topshirildimi?", font=f_reg_14, fill=(240, 240, 255))
    draw.text((cm_x + 320, cm_y + 44), "14:20", font=f_reg_12, fill=(160, 160, 190))

    my_y = cm_y + 90
    draw_rounded_rect(draw, [cm_x + 140, my_y, cm_x + 560, my_y + 85], 18, fill=(124, 58, 237))
    draw.text((cm_x + 160, my_y + 14), "Va alaykum assalom, Sarvarbek!", font=f_bold_14, fill=(255, 255, 255))
    draw.text((cm_x + 160, my_y + 36), "Ha, kuryerimiz 10 daqiqa oldin yo'lga chiqdi.", font=f_reg_14, fill=(255, 255, 255))
    draw.text((cm_x + 160, my_y + 58), "Taxminiy yetib borish vaqti: 14:35.", font=f_reg_14, fill=(255, 255, 255))
    draw.text((cm_x + 510, my_y + 60), "14:21 ✓✓", font=f_bold_12, fill=(200, 240, 220))

    c2_y = my_y + 105
    draw_rounded_rect(draw, [cm_x, c2_y, cm_x + 320, c2_y + 50], 18, fill=(35, 25, 75))
    draw.text((cm_x + 18, c2_y + 14), "Juda tez, katta rahmat! Kutib qolaman.", font=f_reg_14, fill=(240, 240, 255))
    draw.text((cm_x + 260, c2_y + 24), "14:22", font=f_reg_12, fill=(160, 160, 190))

    draw_rounded_rect(draw, [cm_x, dw_y + dw_h - 70, dw_x + dw_w - 90, dw_y + dw_h - 20], 14, fill=(16, 12, 36), outline=(50, 40, 95), width=1)
    draw.text((cm_x + 20, dw_y + dw_h - 52), "Javob yozing...", font=f_reg_14, fill=(120, 120, 150))
    draw_rounded_rect(draw, [dw_x + dw_w - 75, dw_y + dw_h - 70, dw_x + dw_w - 25, dw_y + dw_h - 20], 14, fill=(124, 58, 237))
    draw.text((dw_x + dw_w - 60, dw_y + dw_h - 55), "➤", font=f_bold_18, fill=(255, 255, 255))

    p_x, p_y, p_w, p_h = 1070, 160, 450, 660
    draw_rounded_rect(draw, [p_x, p_y, p_x + p_w, p_y + p_h], 36, fill=(12, 9, 28), outline=(124, 58, 237, 100), width=2)
    draw_rounded_rect(draw, [p_x + 16, p_y + 16, p_x + p_w - 16, p_y + p_h - 16], 28, fill=(24, 18, 52))

    draw.rectangle([p_x + 16, p_y + 16, p_x + p_w - 16, p_y + 75], fill=(32, 24, 68))
    draw.text((p_x + 36, p_y + 35), "StoreBox Yordam & Kassa", font=f_bold_16, fill=(255, 255, 255))
    draw.text((p_x + 36, p_y + 55), "● Do'kon onlayn javob bermoqda", font=f_bold_12, fill=(52, 211, 153))

    draw_rounded_rect(draw, [p_x + 40, p_y + 100, p_x + 380, p_y + 160], 16, fill=(124, 58, 237))
    draw.text((p_x + 56, p_y + 115), "Assalomu alaykum! #RB-89241", font=f_reg_14, fill=(255, 255, 255))
    draw.text((p_x + 56, p_y + 135), "buyurtmam kuryerga topshirildimi?", font=f_reg_14, fill=(255, 255, 255))

    draw_rounded_rect(draw, [p_x + 40, p_y + 180, p_x + 400, p_y + 280], 16, fill=(40, 30, 80))
    draw.text((p_x + 56, p_y + 195), "Va alaykum assalom, Sarvarbek!", font=f_bold_14, fill=(255, 255, 255))
    draw.text((p_x + 56, p_y + 220), "Kuryerimiz 10 daqiqa oldin yo'lga chiqdi.", font=f_reg_14, fill=(255, 255, 255))
    draw.text((p_x + 56, p_y + 245), "Taxminiy vaqt: 14:35.", font=f_reg_14, fill=(255, 255, 255))

    draw_rounded_rect(draw, [p_x + 120, p_y + 300, p_x + 400, p_y + 355], 16, fill=(124, 58, 237))
    draw.text((p_x + 140, p_y + 315), "Juda tez, katta rahmat!", font=f_reg_14, fill=(255, 255, 255))

    out_path = os.path.join(OUTPUT_DIR, "chat-showcase.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

# 6. DESIGN STUDIO SHOWCASE (1600 x 900)
def generate_design_studio_showcase():
    w, h = 1600, 900
    img = Image.new("RGBA", (w, h), (14, 10, 32, 255))
    draw_gradient_background(img, (20, 14, 46), (10, 6, 26))
    draw = ImageDraw.Draw(img)

    f_bold_22 = get_font(22, bold=True)
    f_bold_18 = get_font(18, bold=True)
    f_bold_16 = get_font(16, bold=True)
    f_bold_14 = get_font(14, bold=True)
    f_reg_14 = get_font(14)
    f_bold_12 = get_font(12, bold=True)
    f_reg_12 = get_font(12)

    draw.text((w//2 - 260, 45), "StoreBox Dizayn & Vizual Studiya", font=f_bold_22, fill=(255, 255, 255))
    draw.text((w//2 - 340, 80), "Do'koningiz uslubini, ranglarini va bannerlarini real vaqtda boshqaring", font=f_reg_14, fill=(167, 139, 250))

    sw_x, sw_y, sw_w, sw_h = 80, 140, 1440, 700
    draw_rounded_rect(draw, [sw_x, sw_y, sw_x + sw_w, sw_y + sw_h], 24, fill=(22, 16, 48), outline=(124, 58, 237, 80), width=1)

    lp_w = 520
    draw.rectangle([sw_x, sw_y, sw_x + lp_w, sw_y + sw_h], fill=(18, 13, 38))
    draw.line([(sw_x + lp_w, sw_y), (sw_x + lp_w, sw_y + sw_h)], fill=(40, 30, 80), width=1)

    draw.text((sw_x + 30, sw_y + 24), "🎨 Dizayn sozlamalari", font=f_bold_18, fill=(255, 255, 255))

    draw.text((sw_x + 30, sw_y + 70), "1. Vitrina shabloni:", font=f_bold_14, fill=(255, 255, 255))
    templates = [
        ("Restoran & Kafe", True, "🍔"),
        ("Universal do'kon", False, "🛍️"),
        ("Vizual butik", False, "✨")
    ]
    ty = sw_y + 100
    for tname, is_sel, ico in templates:
        fill_col = (124, 58, 237) if is_sel else (28, 20, 60)
        draw_rounded_rect(draw, [sw_x + 30, ty, sw_x + lp_w - 30, ty + 50], 14, fill=fill_col, outline=(124, 58, 237) if is_sel else (50, 40, 95), width=2 if is_sel else 1)
        draw.text((sw_x + 50, ty + 15), f"{ico}  {tname}", font=f_bold_14, fill=(255, 255, 255))
        if is_sel:
            draw.text((sw_x + lp_w - 70, ty + 16), "✓ Faol", font=f_bold_12, fill=(255, 255, 255))
        ty += 60

    draw.text((sw_x + 30, ty + 15), "2. Asosiy brend rangi:", font=f_bold_14, fill=(255, 255, 255))
    colors = [(124, 58, 237), (79, 70, 229), (37, 99, 235), (13, 148, 136), (16, 185, 129), (225, 29, 72), (234, 88, 12)]
    cx = sw_x + 30
    cy = ty + 45
    for i, col in enumerate(colors):
        draw.ellipse([cx, cy, cx + 44, cy + 44], fill=col)
        if i == 0:
            draw.ellipse([cx + 14, cy + 14, cx + 30, cy + 30], fill=(255, 255, 255))
        cx += 56

    by = cy + 70
    draw.text((sw_x + 30, by), "3. Reklama bannerlari (3 ta faol):", font=f_bold_14, fill=(255, 255, 255))
    banners_list = [
        ("Kombo Menyu: Big Burger + Fri", "30 daqiqada yetkazib berish"),
        ("Pitsa Margarita 2+1 Aksiya", "Uchinchisi sovg'a tariqasida"),
        ("120 000 UZS dan bepul kuryer", "Shahar bo'ylab tezkor xizmat"),
    ]
    b_item_y = by + 30
    for b_title, b_sub in banners_list:
        draw_rounded_rect(draw, [sw_x + 30, b_item_y, sw_x + lp_w - 30, b_item_y + 54], 12, fill=(28, 20, 60), outline=(50, 40, 95), width=1)
        draw.text((sw_x + 48, b_item_y + 10), b_title, font=f_bold_12, fill=(255, 255, 255))
        draw.text((sw_x + 48, b_item_y + 30), b_sub, font=f_reg_12, fill=(160, 160, 190))
        draw.text((sw_x + lp_w - 65, b_item_y + 18), "☰", font=f_bold_16, fill=(124, 58, 237))
        b_item_y += 62

    draw_rounded_rect(draw, [sw_x + 30, sw_y + sw_h - 75, sw_x + lp_w - 30, sw_y + sw_h - 25], 16, fill=(16, 185, 129))
    draw.text((sw_x + lp_w//2 - 100, sw_y + sw_h - 55), "✓ O'zgarishlarni qo'llash", font=f_bold_16, fill=(255, 255, 255))

    rp_x = sw_x + lp_w + 40
    rp_y = sw_y + 40
    rp_w = sw_w - lp_w - 80
    rp_h = sw_h - 80

    draw_rounded_rect(draw, [rp_x, rp_y, rp_x + rp_w, rp_y + rp_h], 20, fill=(248, 250, 252))
    draw_rounded_rect(draw, [rp_x, rp_y, rp_x + rp_w, rp_y + 50], 20, fill=(255, 255, 255))
    draw.line([(rp_x, rp_y + 50), (rp_x + rp_w, rp_y + 50)], fill=(226, 232, 240), width=1)

    draw.text((rp_x + 24, rp_y + 16), "🖥️ Jonli vitrina (Restoran shabloni)", font=f_bold_14, fill=(15, 23, 42))
    draw_rounded_rect(draw, [rp_x + rp_w - 180, rp_y + 10, rp_x + rp_w - 20, rp_y + 40], 10, fill=(209, 250, 229))
    draw.text((rp_x + rp_w - 165, rp_y + 18), "● Saqlangan & Faol", font=f_bold_12, fill=(5, 150, 105))

    draw_rounded_rect(draw, [rp_x + 24, rp_y + 70, rp_x + rp_w - 24, rp_y + 220], 18, fill=(76, 29, 149))
    draw.text((rp_x + 44, rp_y + 95), "Maxsus Kombo Menyu", font=f_bold_22, fill=(255, 255, 255))
    draw.text((rp_x + 44, rp_y + 130), "Big Burger + Qarsildoq Fri + Sovuq Cola", font=f_reg_14, fill=(221, 214, 254))
    draw.text((rp_x + 44, rp_y + 165), "Atigi 49 000 UZS", font=f_bold_18, fill=(255, 255, 255))

    preview_dishes = [
        ("Double Cheeseburger", "42 000 UZS", "🍔"),
        ("Pitsa Margarita", "65 000 UZS", "🍕"),
        ("Sezar salati tovuq bilan", "38 000 UZS", "🥗"),
        ("Maxsus Tandir Somsa", "12 000 UZS", "🥟"),
    ]
    pdy = rp_y + 240
    pdw = (rp_w - 60) // 2
    for i, (pname, pprice, pico) in enumerate(preview_dishes):
        px = rp_x + 24 + (i % 2) * (pdw + 12)
        py = pdy + (i // 2) * 110
        draw_rounded_rect(draw, [px, py, px + pdw, py + 95], 14, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
        draw.text((px + 16, py + 18), f"{pico}  {pname}", font=f_bold_14, fill=(15, 23, 42))
        draw.text((px + 16, py + 50), pprice, font=f_bold_16, fill=(124, 58, 237))
        draw_rounded_rect(draw, [px + pdw - 50, py + 45, px + pdw - 16, py + 75], 8, fill=(124, 58, 237))
        draw.text((px + pdw - 38, py + 50), "+", font=f_bold_16, fill=(255, 255, 255))

    out_path = os.path.join(OUTPUT_DIR, "design-studio-showcase.png")
    img.save(out_path, "PNG", quality=95)
    print(f"Generated: {out_path}")

if __name__ == "__main__":
    generate_hero_dashboard_desktop()
    generate_hero_dashboard_mobile()
    generate_storefront_product_mobile()
    generate_restaurant_mobile()
    generate_chat_showcase()
    generate_design_studio_showcase()
    print("All 6 presentation mockups successfully created!")
