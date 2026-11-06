"""Social share images (1200x630) for blog posts, drawn with Pillow.

Each card shows the topic, the post title, my name and photo, the date and reading
time, with the post's cover fading in on the right, in the site's colours and fonts.
tools/build_blog.py calls render() for every post and only redraws a card when
something on it changes (tracked in blog/media/og/manifest.json).

Bangla titles use Hind Siliguri and need Pillow built with Raqm for correct
shaping (the Linux wheels used by the GitHub Action have it). Without Raqm a
Bangla title is skipped, so the post falls back to its cover image.
"""

import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

VERSION = "og-3"  # bump to redraw every card after changing the design
W, H = 1200, 630
ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
AVATAR = ROOT / "assets" / "img" / "avatar.webp"
NIGHT = (11, 5, 36)
LIME = (212, 255, 36)
WHITE = (255, 255, 255)
MUTED = (201, 195, 245)
V300 = (180, 173, 255)
RAQM = features.check("raqm")
BANGLA = re.compile(r"[ঀ-৿]")


def _sora(size, weight):
    f = ImageFont.truetype(str(FONTS / "sora.woff"), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def _mono(size, weight=600):
    f = ImageFont.truetype(str(FONTS / "jetbrains-mono.woff"), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def _title_font(size, bangla):
    if bangla:
        return ImageFont.truetype(str(FONTS / "HindSiliguri-Bold.ttf"), size,
                                  layout_engine=ImageFont.Layout.RAQM)
    return _sora(size, 700)


def _wrap(draw, text, font, width):
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = (line + " " + w).strip()
        if draw.textlength(trial, font=font) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def _background(cover):
    img = Image.new("RGB", (W, H), NIGHT)
    if cover and Path(cover).exists():
        c = Image.open(cover).convert("RGB")
        # Right side of the cover, where the illustration sits, scaled to the card height
        cw, ch = c.size
        crop = c.crop((int(cw * 0.36), 0, cw, ch))
        scale = H / crop.height
        crop = crop.resize((int(crop.width * scale), H), Image.LANCZOS)
        x0 = W - crop.width
        fade = Image.new("L", crop.size, 255)
        fd = ImageDraw.Draw(fade)
        ramp = int(crop.width * 0.55)
        for x in range(ramp):
            fd.line([(x, 0), (x, H)], fill=int(255 * (x / ramp) ** 1.6))
        img.paste(crop, (x0, 0), fade)
    # Violet glow behind the text, like the site hero
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-260, -200, 760, 640), fill=(77, 19, 238, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    base = img.convert("RGBA")
    base.alpha_composite(glow)
    # Darken the left so the title always reads
    shade = Image.new("L", (W, H), 0)
    sd = ImageDraw.Draw(shade)
    for x in range(W):
        if x < 470:
            a = 228
        elif x < 880:
            a = int(228 * (1 - (x - 470) / 410) ** 1.5)
        else:
            a = 0
        sd.line([(x, 0), (x, H)], fill=a)
    for y in range(H - 150, H):  # soft band along the bottom for the byline and address
        t = (y - (H - 150)) / 150
        row = shade.crop((0, y, W, y + 1))
        row = row.point(lambda v, t=t: max(v, int(210 * t ** 1.3)))
        shade.paste(row, (0, y))
    dark = Image.new("RGBA", (W, H), NIGHT + (0,))
    dark.putalpha(shade)
    base.alpha_composite(dark)
    return base


def _avatar(size):
    a = Image.open(AVATAR).convert("RGB").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    a.putalpha(mask.resize((size, size), Image.LANCZOS))
    return a


def draw_card(title, label, meta, cover, out):
    bangla = bool(BANGLA.search(title))
    if bangla and not RAQM:
        return False
    img = _background(cover)
    d = ImageDraw.Draw(img)

    # Topic pill
    pf = _mono(17, 700)
    text = label.upper()
    tw = d.textlength(text, font=pf) + len(text) * 1.5
    pill = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle((60, 54, 60 + 48 + tw, 96), radius=21, fill=(255, 255, 255, 18), outline=(255, 255, 255, 60), width=2)
    img.alpha_composite(pill)
    d.ellipse((76, 69, 88, 81), fill=LIME)
    x = 100
    for ch in text:
        d.text((x, 64), ch, font=pf, fill=(233, 231, 255))
        x += d.textlength(ch, font=pf) + 1.5

    # Title: largest size that fits in four lines
    max_w, top, bottom = 570, 132, 470
    for size in range(68, 34, -2):
        font = _title_font(size, bangla)
        lines = _wrap(d, title, font, max_w)
        lh = int(size * (1.32 if bangla else 1.12))
        if len(lines) <= 4 and len(lines) * lh <= bottom - top:
            break
    y = top + max(0, ((bottom - top) - len(lines) * lh) // 2 - 10)
    d.rectangle((62, y - 22, 126, y - 16), fill=LIME)
    for line in lines:
        d.text((60, y), line, font=font, fill=WHITE)
        y += lh

    # Byline
    av = _avatar(60)
    img.alpha_composite(av, (60, 516))
    d.text((138, 518), "Abdullah Al Fahim", font=_sora(25, 600), fill=WHITE)
    d.text((138, 554), meta, font=_mono(18, 500), fill=MUTED)
    # Site address in a dark pill, top right, so it stays readable over any cover
    url = "abdullah-al-faahim.github.io/blog"
    uf = _mono(16, 600)
    uw = d.textlength(url, font=uf)
    tag = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(tag).rounded_rectangle((W - 60 - uw - 36, 54, W - 60, 96), radius=21, fill=NIGHT + (215,), outline=(255, 255, 255, 50), width=2)
    img.alpha_composite(tag)
    d.text((W - 60 - uw - 18, 65), url, font=uf, fill=V300)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out, "JPEG", quality=88, optimize=True, progressive=True)
    return True


def _digest(*parts):
    h = hashlib.sha1(VERSION.encode())
    for p in parts:
        if isinstance(p, Path):
            h.update(p.read_bytes() if p.exists() else b"-")
        else:
            h.update(str(p).encode("utf-8"))
        h.update(b"\0")
    return h.hexdigest()


def render(cards, out_dir):
    """cards: list of dicts with key, title, label, meta, cover (path or None).
    Returns {key: filename} for every card that has an image."""
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception:
        manifest = {}
    done, keep = {}, set()
    for c in cards:
        name = f'{c["key"]}.jpg'
        digest = _digest(c["title"], c["label"], c["meta"], Path(c["cover"]) if c["cover"] else "-", AVATAR)
        out = out_dir / name
        if manifest.get(c["key"]) == digest and out.exists():
            done[c["key"]] = name
        elif draw_card(c["title"], c["label"], c["meta"], c["cover"], out):
            manifest[c["key"]] = digest
            done[c["key"]] = name
        elif out.exists():
            done[c["key"]] = name  # keep the last good card (e.g. Bangla title without Raqm)
        keep.add(name)
    # Remove cards for posts that no longer exist
    for f in out_dir.glob("*.jpg"):
        if f.name not in keep:
            f.unlink()
            manifest.pop(f.stem, None)
    manifest = {k: v for k, v in manifest.items() if f"{k}.jpg" in keep}
    manifest_path.write_text(json.dumps(manifest, indent=1, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
    return done
