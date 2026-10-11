import hashlib
import json
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "public" / "images"
OUTPUT_ROOT = SOURCE_ROOT / "optimized"
MANIFEST_PATH = ROOT / "src" / "config" / "generatedImageVariants.json"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
TARGET_WIDTHS = (160, 320, 480, 800, 1200, 1600)


def encoded_path(path):
    return "/".join(quote(part, safe="-_.~") for part in path.parts)


def optimize_image(path):
    relative_path = path.relative_to(SOURCE_ROOT)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    with Image.open(path) as original:
        image = ImageOps.exif_transpose(original)
        width, height = image.size
        widths = sorted({min(target, width) for target in TARGET_WIDTHS} | {width})
        sources = {}

        for output_width in widths:
            output_height = round(height * output_width / width)
            resized = image if output_width == width else image.resize(
                (output_width, output_height),
                Image.Resampling.LANCZOS,
            )
            output_name = f"{path.stem}-{digest}-{output_width}.webp"
            output_path = OUTPUT_ROOT / digest / relative_path.parent / output_name
            output_path.parent.mkdir(parents=True, exist_ok=True)
            if not output_path.exists():
                resized.save(output_path, "WEBP", quality=86, method=6)

            public_path = relative_path.parent / output_name
            sources[output_width] = f"/images/optimized/{digest}/{encoded_path(public_path)}"

        return f"/images/{encoded_path(relative_path)}", {
            "width": width,
            "height": height,
            "widths": widths,
            "sources": sources,
        }


def main():
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for path in sorted(SOURCE_ROOT.rglob("*")):
        if not path.is_file() or OUTPUT_ROOT in path.parents:
            continue
        if path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        source, variants = optimize_image(path)
        manifest[source] = variants

    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Optimized {len(manifest)} images into responsive WebP variants.")


if __name__ == "__main__":
    main()
