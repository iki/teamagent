"""Freeze a synthetic image-only OCR lane before running any extractor.

No random state, timestamps, hidden PDF text or source-specific OCR hints are used.
Pillow 12.3.0 and the exact recorded Arial font files define the raster source.
"""

import argparse
import hashlib
import io
import json
import platform
import time
from pathlib import Path

import PIL
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def create_fixture(directory, regular_font, bold_font):
    directory.mkdir(parents=True, exist_ok=False)
    if PIL.__version__ != "12.3.0":
        raise RuntimeError("The frozen synthetic lane requires Pillow 12.3.0")
    regular = ImageFont.truetype(str(regular_font), 39)
    bold = ImageFont.truetype(str(bold_font), 47)
    small = ImageFont.truetype(str(regular_font), 30)
    pages = []

    def page(title, subtitle):
        image = Image.new("RGB", (1654, 2339), "white")
        draw = ImageDraw.Draw(image)
        draw.text((100, 120), title, font=bold, fill="black")
        draw.text((100, 190), subtitle, font=small, fill="black")
        draw.line((100, 255, 1554, 255), fill="black", width=2)
        pages.append(image)
        return draw

    def line(draw, y, value, font=regular):
        if draw.textbbox((100, y), value, font=font)[2] > 1554:
            raise RuntimeError("Fixture line exceeds the page's text area")
        draw.text((100, y), value, font=font, fill="black")

    english = page("BOREALIS FIELD LAB", "Synthetic benchmark invoice - no real transaction")
    for y, text in [
        (330, "Invoice reference: BRL-2049-071"),
        (400, "Customer: Borealis Field Lab"),
        (470, "Issue date: 2026-09-18"),
        (540, "Payment deadline: 2026-10-18"),
    ]:
        line(english, y, text)
    columns = [100, 620, 870, 1190, 1554]
    rows = [700, 800, 900, 1000]
    for x in columns:
        english.line((x, rows[0], x, rows[-1]), fill="black", width=2)
    for y in rows:
        english.line((columns[0], y, columns[-1], y), fill="black", width=2)
    for y, cells in [
        (730, ["Material", "Quantity", "Unit EUR", "Total EUR"]),
        (830, ["Cobalt", "12", "148.50", "1782.00"]),
        (930, ["Quartz", "3", "72.25", "216.75"]),
    ]:
        for x, value in zip(columns, cells):
            english.text((x + 18, y), value, font=small, fill="black")
    for y, text in [
        (1090, "Invoice total: 1998.75 EUR"),
        (1230, "Approval policy"),
        (1320, "A missing signature keeps the shipment pending."),
        (1390, "A payment receipt does not authorize a refund."),
        (1530, "Storage range: -12 to -4 degrees Celsius."),
        (1600, "The sensor alarm threshold is 0.75 percent."),
    ]:
        line(english, y, text)
    line(english, 2160, "Page 1 of 2 | Image-only source | 200 DPI", small)

    czech = page("ZPRÁVA O VÝZKUMU", "Syntetický dokument pro ověření českého OCR")
    for y, text in [
        (330, "Číslo záznamu: CZ-731-2026"),
        (420, "Místo měření: Žďár nad Sázavou"),
        (510, "Datum měření: 23. září 2026"),
        (650, "Naměřená teplota byla 18,6 stupně Celsia."),
        (740, "Relativní vlhkost dosáhla 42,5 procenta."),
        (880, "Kontrolní vzorek obsahoval 7,25 miligramu soli."),
        (970, "Povolená odchylka je nejvýše 0,15 miligramu."),
        (1110, "Výsledek musí potvrdit dva nezávislí hodnotitelé."),
        (1200, "Chybějící podpis znamená, že měření není schváleno."),
        (1340, "Soubor měření se jmenuje voda_září_2026.csv."),
        (1430, "Původní záznam se při opravě nesmí přepsat."),
    ]:
        line(czech, y, text)
    line(czech, 2160, "Strana 2 ze 2 | Pouze rastrový obraz | 200 DPI", small)

    fixed_time = time.gmtime(946684800)

    def pdf_bytes():
        stream = io.BytesIO()
        pages[0].save(
            stream, format="PDF", save_all=True, append_images=pages[1:],
            dpi=(200, 200), quality=95, subsampling=0,
            title="Teamagent frozen synthetic OCR fixture v1", author="Teamagent",
            creator="scanned-fixture.py", producer="Pillow 12.3.0",
            creationDate=fixed_time, modDate=fixed_time,
        )
        return stream.getvalue()

    pdf = pdf_bytes()
    if pdf != pdf_bytes():
        raise RuntimeError("Synthetic PDF generation was not byte-deterministic")
    reader = PdfReader(io.BytesIO(pdf))
    if len(reader.pages) != 2 or any((page.extract_text() or "").strip() for page in reader.pages):
        raise RuntimeError("The scanned fixture must contain two image-only pages")
    pdf_path = directory / "synthetic-scanned-en-cs.pdf"
    pdf_path.write_bytes(pdf)
    for index, page in enumerate(reader.pages):
        images = list(page.images)
        if len(images) != 1:
            raise RuntimeError("Each fixture page must contain one raster image")
        # Review exactly the raster decoded from the final PDF, including JPEG compression.
        with Image.open(io.BytesIO(images[0].data)) as decoded:
            decoded.save(directory / f"page-{index + 1}.png")

    source_id = "synthetic-scanned-en-cs"
    gold = [
        ("invoice-identity", 1, "ocr-english", ["Invoice reference: BRL-2049-071", "Customer: Borealis Field Lab"]),
        ("invoice-dates", 1, "ocr-dates", ["Issue date: 2026-09-18", "Payment deadline: 2026-10-18"]),
        ("table-values", 1, "ocr-table-values", ["Cobalt", "12", "148.50", "1782.00", "Quartz", "3", "72.25", "216.75"]),
        ("invoice-total", 1, "ocr-numeric", ["Invoice total: 1998.75 EUR"]),
        ("negative-policy", 1, "ocr-english", ["A missing signature keeps the shipment pending.", "A payment receipt does not authorize a refund."]),
        ("sensor-limits", 1, "ocr-numeric", ["Storage range: -12 to -4 degrees Celsius.", "The sensor alarm threshold is 0.75 percent."]),
        ("czech-identity", 2, "ocr-czech", ["Číslo záznamu: CZ-731-2026", "Místo měření: Žďár nad Sázavou", "Datum měření: 23. září 2026"]),
        ("czech-environment", 2, "ocr-czech-numeric", ["Naměřená teplota byla 18,6 stupně Celsia.", "Relativní vlhkost dosáhla 42,5 procenta."]),
        ("czech-mass", 2, "ocr-czech-numeric", ["Kontrolní vzorek obsahoval 7,25 miligramu soli.", "Povolená odchylka je nejvýše 0,15 miligramu."]),
        ("czech-policy", 2, "ocr-czech", ["Výsledek musí potvrdit dva nezávislí hodnotitelé.", "Chybějící podpis znamená, že měření není schváleno."]),
        ("czech-provenance", 2, "ocr-czech", ["Soubor měření se jmenuje voda_září_2026.csv.", "Původní záznam se při opravě nesmí přepsat."]),
    ]
    manifest = {
        "version": 1,
        "lane": "synthetic-scanned",
        "generator": {
            "path": "app/benchmark/extractors/scanned-fixture.py",
            "sha256": sha256(Path(__file__).read_bytes()),
            "python": platform.python_version(), "pillow": PIL.__version__,
            "regularFontSha256": sha256(regular_font.read_bytes()),
            "boldFontSha256": sha256(bold_font.read_bytes()),
            "dpi": 200, "imageSize": [1654, 2339], "seed": None,
            "pdfMetadataTime": "2000-01-01T00:00:00Z", "pdfHiddenTextCharacters": 0,
        },
        "sources": [{
            "id": source_id,
            "path": "data/extractor-benchmarks/fixtures/synthetic-scanned-en-cs.pdf",
            "sha256": sha256(pdf), "bytes": len(pdf), "pages": 2,
            "origin": "Repository-owned deterministic synthetic fixture", "license": "Repository test fixture",
        }],
        "cases": [{
            "id": f"scan-{identifier}", "split": "dev", "repo": source_id, "category": category,
            "query": f"Recover the synthetic {identifier} evidence.",
            "evidence": [{"path": source_id, "page": page, "contains": anchors}],
            "answerFacts": [], "rationale": "Frozen controlled raster source; table values do not test cell associations.",
            "answerable": True,
        } for identifier, page, category, anchors in gold],
    }
    (directory / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"path": str(pdf_path), "sha256": sha256(pdf), "pages": 2, "anchors": sum(len(anchors) for _, _, _, anchors in gold)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--regular-font", type=Path, default=Path("C:/Windows/Fonts/arial.ttf"))
    parser.add_argument("--bold-font", type=Path, default=Path("C:/Windows/Fonts/arialbd.ttf"))
    arguments = parser.parse_args()
    create_fixture(arguments.output.resolve(), arguments.regular_font, arguments.bold_font)
