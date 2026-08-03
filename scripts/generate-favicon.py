#!/usr/bin/env python3
"""Derive public/favicon.ico from the built app icon.

Why this exists at all: modern browsers use the `<link rel="icon">` that Next emits from
src/app/icon.tsx and never ask for /favicon.ico. But plenty of things still probe the root
path blindly — feed readers, link unfurlers, older Safari, search-console tooling — and a
404 there is a small, permanent papercut.

Why it reads the BUILT icon instead of drawing its own: the mark is defined once, in
src/lib/icon-mark.tsx. A script that redrew it here would be a second definition, and the
two would drift the first time the design changed. Source of truth is the render.

Source is out/apple-icon (180x180) rather than out/icon (32x32) so the 48px entry is
downsampled from a larger original instead of upscaled from a smaller one.

Run after a build, then rebuild so the .ico is copied into out/:

    npm run build && python3 scripts/generate-favicon.py && npm run build

Only needed when the mark changes; the .ico is committed. Requires Pillow, which is a
local tool rather than a project dependency — nothing in `npm run build` calls this.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip3 install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "out" / "apple-icon"
TARGET = ROOT / "public" / "favicon.ico"

# 48 is what Windows/Edge reach for, 32 the common retina tab, 16 the classic slot.
SIZES = [(48, 48), (32, 32), (16, 16)]


def main() -> None:
    if not SOURCE.exists():
        sys.exit(f"{SOURCE} not found — run `npm run build` first.")

    src = Image.open(SOURCE).convert("RGBA")
    if src.size != (180, 180):
        print(f"warning: expected a 180x180 source, got {src.size}", file=sys.stderr)

    # Resize explicitly with LANCZOS. Pillow's ICO writer will resize for us, but it does not
    # promise a particular filter, and a nearest-neighbour 180->16 turns the glyph to gravel.
    frames = [src.resize(size, Image.LANCZOS) for size in SIZES]

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(TARGET, format="ICO", sizes=SIZES, append_images=frames[1:])
    print(f"wrote {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size} bytes) {SIZES}")


if __name__ == "__main__":
    main()
