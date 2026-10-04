"""Bounded, offline document conversion. Original bytes are owned by the Bun host."""
import base64
import hashlib
import io
import json
import mimetypes
import pathlib
import re
import sys
import warnings
import zipfile
from urllib.parse import urljoin, urlparse

MAX_FILE = 16 * 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024
MAX_IMAGES = 128
PARSER = "teamagent-import/1;markitdown/0.1.8;pypdf/6.11.0;markdown-it/4.0.0"


def deny_external_effect(event, args):
    if event in ("socket.connect", "socket.connect_ex", "socket.bind", "subprocess.Popen", "os.system", "os.posix_spawn"):
        raise PermissionError("Document conversion cannot access network or launch programs")


sys.addaudithook(deny_external_effect)
warnings.simplefilter("error", ResourceWarning)


def preflight_archive(data):
    if not data.startswith(b"PK"):
        return
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        members = archive.infolist()
        if len(members) > 4096:
            raise ValueError("Archive entry limit exceeded")
        total = 0
        for member in members:
            path = pathlib.PurePosixPath(member.filename.replace("\\", "/"))
            if path.is_absolute() or ".." in path.parts or ":" in member.filename or "\x00" in member.filename:
                raise ValueError("Unsafe archive path")
            if member.flag_bits & 1 or (member.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Encrypted archive members and symbolic links are unsupported")
            total += member.file_size
            if member.file_size > MAX_FILE or total > MAX_TOTAL or member.file_size > max(1, member.compress_size) * 1000:
                raise ValueError("Archive expansion limit exceeded")


def convert(path, media_type, base_url):
    from bs4 import BeautifulSoup
    from markitdown.converters import HtmlConverter, DocxConverter, PdfConverter, PptxConverter, XlsxConverter
    from markitdown import StreamInfo
    from importlib.metadata import version
    if version("markitdown") != "0.1.8" or version("pypdf") != "6.11.0":
        raise ValueError("Converter package version differs from the pinned contract")
    data = pathlib.Path(path).read_bytes()
    if len(data) > MAX_FILE:
        raise ValueError("Document byte limit exceeded")
    preflight_archive(data)
    images = []
    links = []
    diagnostics = []
    image_total = 0

    def add_image(raw, name, mime=None):
        nonlocal image_total
        if len(raw) > MAX_FILE or image_total + len(raw) > MAX_TOTAL or len(images) >= MAX_IMAGES:
            raise ValueError("Extracted image limit exceeded")
        extension = pathlib.PurePosixPath(name).suffix.lower()
        if not re.fullmatch(r"\.[a-z0-9]{1,8}", extension):
            extension = mimetypes.guess_extension(mime or "") or ".bin"
        image_name = hashlib.sha256(raw).hexdigest() + extension
        existing = next((item for item in images if item["name"] == image_name), None)
        if existing is None:
            image_total += len(raw)
            images.append({"name": image_name, "mediaType": mime or mimetypes.guess_type(name)[0] or "application/octet-stream", "base64": base64.b64encode(raw).decode("ascii")})
        return "assets/" + image_name

    extension = pathlib.Path(path).suffix.lower()
    stream = io.BytesIO(data)
    info = StreamInfo(extension=extension, mimetype=media_type)
    if media_type == "text/markdown":
        from markdown_it import MarkdownIt
        if version("markdown-it-py") != "4.0.0":
            raise ValueError("Markdown parser differs from pinned contract")
        data = MarkdownIt("commonmark", {"html": False}).render(data.decode("utf-8")).encode("utf-8")
        media_type = "text/html"
    if media_type == "text/html":
        soup = BeautifulSoup(data, "html.parser")
        for element in soup(["script", "style", "iframe", "object", "embed", "form", "base", "link", "meta"]):
            element.decompose()
        for anchor in soup.find_all("a", href=True):
            target = urljoin(base_url, str(anchor["href"]))
            if urlparse(target).scheme in ("http", "https"):
                anchor["href"] = target
            else:
                del anchor["href"]
        for element in soup.find_all("img"):
            source = str(element.get("src", ""))
            if not source:
                diagnostics.append("HTML image without a static src was not retrieved")
                element.replace_with(str(element.get("alt", "")))
                continue
            if source.startswith("data:image/"):
                match = re.fullmatch(r"data:(image/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)", source)
                if match:
                    reference = add_image(base64.b64decode(match[2], validate=False), "embedded", match[1])
                    element["src"] = reference
                    continue
            target = urljoin(base_url, source)
            if urlparse(target).scheme not in ("http", "https", "file"):
                diagnostics.append("HTML image with unsupported scheme was not retrieved")
                element.replace_with(str(element.get("alt", "")))
                continue
            if len(links) >= MAX_IMAGES:
                raise ValueError("HTML image limit exceeded")
            reference = "assets/pending-" + hashlib.sha256(target.encode()).hexdigest()
            links.append({"url": target, "reference": reference})
            element["src"] = reference
            for attribute in ("srcset", "onerror", "onload"):
                element.attrs.pop(attribute, None)
        markdown = HtmlConverter().convert_string(str(soup)).markdown
    elif extension == ".docx":
        markdown = DocxConverter().convert(stream, info).markdown
    elif media_type == "application/pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise ValueError("Encrypted PDF conversion is unsupported")
        if len(reader.pages) > 200:
            raise ValueError("PDF page limit exceeded")
        markdown = PdfConverter().convert(stream, info).markdown
        for number, page in enumerate(reader.pages):
            try:
                for item in page.images:
                    reference = add_image(item.data, item.name)
                    markdown += f"\n\n![Page {number + 1} image]({reference})"
            except (ValueError, KeyError, NotImplementedError):
                diagnostics.append(f"PDF page {number + 1} has an image that could not be decoded")
        diagnostics.append("PDF layout, vector artwork and OCR are not reconstructed; original PDF retained")
    elif extension == ".pptx":
        markdown = PptxConverter().convert(stream, info).markdown
        diagnostics.append("Slide layout and speaker timing are not reconstructed; original presentation retained")
    elif extension == ".xlsx":
        markdown = XlsxConverter().convert(stream, info).markdown
        diagnostics.append("Spreadsheet formulas are not recalculated; stored values and original workbook retained")
    else:
        raise ValueError("Document format is not supported by the selected converter")

    # Office parsers can inline image bytes. Replace those with content-addressed assets.
    def replace_inline(match):
        return add_image(base64.b64decode(match[2]), "embedded", match[1])
    markdown = re.sub(r"data:(image/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)", replace_inline, markdown)
    if extension in (".docx", ".pptx", ".xlsx"):
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for member in archive.infolist():
                if re.match(r"^(word|ppt|xl)/media/[^/]+$", member.filename) and not member.is_dir():
                    reference = add_image(archive.read(member), member.filename)
                    if reference not in markdown:
                        markdown += f"\n\n![Document image]({reference})"
    if len(markdown.encode("utf-8")) > MAX_FILE:
        raise ValueError("Markdown output limit exceeded")
    if not markdown.strip():
        diagnostics.append("No extractable text; OCR is not enabled")
    return {"markdown": markdown, "images": images, "links": links, "warnings": diagnostics, "parserVersion": PARSER}


if __name__ == "__main__":
    try:
        if len(sys.argv) == 2 and sys.argv[1] == "doctor":
            from importlib.metadata import version
            packages = {name: version(name) for name in ("markitdown", "pypdf", "markdown-it-py", "mammoth", "pdfminer.six", "pdfplumber", "python-pptx", "openpyxl")}
            print(json.dumps({"python": sys.version.split()[0], "packages": packages}))
        else:
            with warnings.catch_warnings(record=True) as captured:
                result = convert(sys.argv[1], sys.argv[2], sys.argv[3])
                if captured:
                    result["warnings"].append(f"Converter reported {len(captured)} parser warnings; review extracted content")
                print(json.dumps(result, ensure_ascii=True))
    except Exception:
        # Never echo input paths, document text, embedded credentials or parser tracebacks.
        print(json.dumps({"error": "Document conversion failed or exceeded its limits"}))
        sys.exit(1)
