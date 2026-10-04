"""Generate small deterministic document fixtures using the pinned converter environment."""
import base64
import pathlib
import sys
import zipfile
from openpyxl import Workbook
from openpyxl.drawing.image import Image
from pptx import Presentation
from pptx.util import Inches
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, NumberObject, DecodedStreamObject

root = pathlib.Path(sys.argv[1])
png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
(root / "pixel.png").write_bytes(png)

content_types = '''<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'''
rels = '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
document = '''<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:t>Document alpha evidence.</w:t></w:r></w:p></w:body></w:document>'''
with zipfile.ZipFile(root / "sample.docx", "w") as archive:
    archive.writestr("[Content_Types].xml", content_types)
    archive.writestr("_rels/.rels", rels)
    archive.writestr("word/document.xml", document)
    archive.writestr("word/media/image1.png", png)

workbook = Workbook()
sheet = workbook.active
sheet["A1"] = "Spreadsheet evidence"
sheet["B1"] = "Value"
sheet["A2"] = "Revenue"
sheet["B2"] = 42
sheet.add_image(Image(root / "pixel.png"), "D1")
workbook.save(root / "sample.xlsx")

presentation = Presentation()
slide = presentation.slides.add_slide(presentation.slide_layouts[5])
slide.shapes.title.text = "Slide evidence beta"
slide.shapes.add_picture(str(root / "pixel.png"), Inches(1), Inches(1))
presentation.save(root / "sample.pptx")

writer = PdfWriter()
page = writer.add_blank_page(width=300, height=200)
font = DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica")})
picture = DecodedStreamObject()
picture.set_data(bytes([255, 0, 0]))
picture.update({NameObject("/Type"): NameObject("/XObject"), NameObject("/Subtype"): NameObject("/Image"), NameObject("/Width"): NumberObject(1), NameObject("/Height"): NumberObject(1), NameObject("/ColorSpace"): NameObject("/DeviceRGB"), NameObject("/BitsPerComponent"): NumberObject(8)})
page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)}), NameObject("/XObject"): DictionaryObject({NameObject("/Im1"): writer._add_object(picture)})})
stream = DecodedStreamObject()
stream.set_data(b"BT /F1 14 Tf 20 150 Td (PDF evidence gamma) Tj ET q 20 0 0 20 20 80 cm /Im1 Do Q")
page[NameObject("/Contents")] = writer._add_object(stream)
with (root / "sample.pdf").open("wb") as handle:
    writer.write(handle)

with zipfile.ZipFile(root / "unsafe.docx", "w") as archive:
    archive.writestr("../escape.txt", "untrusted")
    archive.writestr("word/document.xml", document)
