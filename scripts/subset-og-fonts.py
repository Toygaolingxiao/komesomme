#!/usr/bin/env python3
"""Subset the OG/share-card fonts to the characters the images can render.

The four image surfaces that use loadOgFonts() (share card + library /
collections / pair OG images) only ever render text that comes from this
repository: catalogue data, editorial data, and literal strings in the
renderer components. The full Noto faces are ~6.5 MB together, and loading
them is what made first-time card generation take ~20 s.

This script collects every character from those sources, subsets both
faces to exactly that set (plus a small explicit symbol set), and writes
the results to public/share/fonts/subset/. loadOgFonts() reads the
subsets; the full faces stay in public/share/fonts/ as the source for
re-running this script.

Re-run after adding brands / collections / pairing pages whose names use
characters the site has never printed before:

    pip install fonttools   # once
    python3 scripts/subset-og-fonts.py

The vitest coverage check (src/lib/og/fonts.coverage.test.ts) fails if a
rendered string uses a character the committed subsets do not contain, so
a forgotten re-run shows up in CI rather than as tofu boxes in production.
"""

import glob
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CORPUS_PATTERNS = [
    "src/data/**/*",
    "src/lib/**/*",
    "src/components/matrix/**/*",
    "src/app/library/[id]/opengraph-image.tsx",
    "src/app/collections/[slug]/opengraph-image.tsx",
    "src/app/pair/[dish]/opengraph-image.tsx",
    "src/app/icon.tsx",
    "src/app/apple-icon.tsx",
]
TEXT_EXTS = {".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt"}

EXTRA_CHARS = "".join(chr(c) for c in range(0x20, 0x7F)) + (
    "　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥…‥"
    "‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋－±×÷＝≠＜＞≦≧∞∴♂♀"
    "°′″℃¥＄¢£％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓"
    "０１２３４５６７８９"
    "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"
    "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
)

FONTS = [
    ("public/share/fonts/NotoSansJP-500.ttf", "public/share/fonts/subset/NotoSansJP-500.ttf"),
    ("public/share/fonts/NotoSerifJP-700.ttf", "public/share/fonts/subset/NotoSerifJP-700.ttf"),
]


def collect_corpus():
    chars = set(EXTRA_CHARS)
    for pattern in CORPUS_PATTERNS:
        for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
            if os.path.isfile(path) and os.path.splitext(path)[1] in TEXT_EXTS:
                with open(path, encoding="utf-8", errors="ignore") as fh:
                    chars.update(fh.read())
    return {c for c in chars if c.isprintable()}


def main():
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        print("fonttools is required: pip install fonttools", file=sys.stderr)
        return 1

    corpus = collect_corpus()
    print(f"corpus: {len(corpus)} unique characters")

    for src_rel, out_rel in FONTS:
        src = os.path.join(ROOT, src_rel)
        out = os.path.join(ROOT, out_rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)

        full_cmap = TTFont(src).getBestCmap()
        missing_from_full = sorted(c for c in corpus if ord(c) not in full_cmap)
        if missing_from_full:
            print(
                f"  note: {len(missing_from_full)} corpus characters are not in "
                f"{os.path.basename(src)} at all (pre-existing): "
                + "".join(missing_from_full[:20])
            )
        usable = "".join(sorted(c for c in corpus if ord(c) in full_cmap))

        text_file = out + ".chars.txt"
        with open(text_file, "w", encoding="utf-8") as fh:
            fh.write(usable)
        try:
            proc = subprocess.run(
                [
                    sys.executable, "-m", "fontTools.subset", src,
                    f"--text-file={text_file}",
                    f"--output-file={out}",
                    "--layout-features=*",
                    "--notdef-glyph",
                    "--notdef-outline",
                    "--recommended-glyphs",
                ],
                capture_output=True, text=True,
            )
            if proc.returncode != 0:
                print(proc.stdout)
                print(proc.stderr, file=sys.stderr)
                return 1
        finally:
            os.unlink(text_file)

        sub_cmap = TTFont(out).getBestCmap()
        still_missing = [c for c in usable if ord(c) not in sub_cmap]
        if still_missing:
            print(f"  ERROR: subset lost {len(still_missing)} characters", file=sys.stderr)
            return 1
        before = os.path.getsize(src)
        after = os.path.getsize(out)
        print(
            f"  {os.path.basename(src)}: {before:,} -> {after:,} bytes "
            f"({after / before:.1%} of full), {len(sub_cmap)} glyphs covered"
        )

    print("done. Commit the files under public/share/fonts/subset/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
