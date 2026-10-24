from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
OG_VISUAL = BRAND / "og-bg-monogram.png"

FONT_BOLD = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_REGULAR = "/System/Library/Fonts/HelveticaNeue.ttc"


def font(size, index=0):
    return ImageFont.truetype(FONT_BOLD if index == 1 else FONT_REGULAR, size=size, index=index)


def rounded_rectangle(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def create_icon(path, size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Gradient background
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for yy in range(size):
        t = yy / max(1, size - 1)
        color = (
            int(109 * (1 - t) + 53 * t),
            int(93 * (1 - t) + 211 * t),
            int(247 * (1 - t) + 154 * t),
            255,
        )
        gd.line((0, yy, size, yy), fill=color)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, size, size), radius=int(size * 0.25), fill=255)
    img.alpha_composite(Image.composite(grad, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask))

    # Checkerboard reveal
    tile = max(6, size // 12)
    for row in range(0, size, tile):
        for col in range(0, size, tile):
            if ((row // tile) + (col // tile)) % 2 == 0:
                color = (248, 250, 252, 225)
            else:
                color = (229, 231, 235, 225)
            if col > size * 0.46 or row < size * 0.18:
                d.rectangle((col, row, col + tile, row + tile), fill=color)

    # BG monogram
    text = "BG"
    text_font = font(int(size * 0.42), 1)
    box = d.textbbox((0, 0), text, font=text_font)
    tx = (size - (box[2] - box[0])) / 2
    ty = (size - (box[3] - box[1])) / 2 - size * 0.02
    d.text(
        (tx, ty),
        text,
        fill=(255, 255, 255, 255),
        font=text_font,
        stroke_width=max(1, size // 80),
        stroke_fill=(17, 24, 39, 185),
    )

    # Small sparkle/cut indicator
    star = [
        (size * 0.76, size * 0.12),
        (size * 0.80, size * 0.23),
        (size * 0.91, size * 0.27),
        (size * 0.80, size * 0.31),
        (size * 0.76, size * 0.42),
        (size * 0.72, size * 0.31),
        (size * 0.61, size * 0.27),
        (size * 0.72, size * 0.23),
    ]
    d.polygon(star, fill=(255, 255, 255, 240))
    img.save(path)


def cover_crop(img, width, height):
    scale = max(width / img.width, height / img.height)
    resized = img.resize((int(img.width * scale), int(img.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def create_og():
    width, height = 1200, 630
    base = cover_crop(Image.open(OG_VISUAL).convert("RGB"), width, height).convert("RGBA")
    od = ImageDraw.Draw(base)
    create_icon(PUBLIC / "icon-512.png", 512)

    # Light text panel on right for deterministic readability.
    panel = Image.new("RGBA", (520, 390), (255, 255, 255, 218))
    panel = panel.filter(ImageFilter.GaussianBlur(0.2))
    base.alpha_composite(panel, (620, 120))
    rounded_rectangle(od, (620, 120, 1140, 510), 30, (255, 255, 255, 232), (229, 231, 235, 255), 2)

    # Brand mark
    mark = Image.open(PUBLIC / "icon-512.png").resize((76, 76), Image.Resampling.LANCZOS)
    base.alpha_composite(mark, (660, 160))
    od.text((755, 162), "Image BG", fill=(17, 24, 39), font=font(42, 1))
    od.text((755, 208), "Remover", fill=(75, 85, 99), font=font(34, 1))

    od.text((660, 290), "Remove backgrounds", fill=(17, 24, 39), font=font(43, 1))
    od.text((660, 344), "in seconds", fill=(17, 24, 39), font=font(43, 1))
    od.text((662, 410), "Transparent PNGs for products and APIs", fill=(75, 85, 99), font=font(22))

    rounded_rectangle(od, (660, 452, 905, 504), 16, (99, 91, 255, 255))
    od.text((687, 466), "Try 3 free removals", fill=(255, 255, 255), font=font(22, 1))

    base.convert("RGB").save(PUBLIC / "og-image.png", quality=94)


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    create_icon(PUBLIC / "icon-192.png", 192)
    create_icon(PUBLIC / "icon-512.png", 512)
    create_icon(PUBLIC / "apple-touch-icon.png", 180)
    create_og()


if __name__ == "__main__":
    main()
