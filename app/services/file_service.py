from io import BytesIO
from pathlib import Path

from pypdf import PdfReader


class UnsupportedFileTypeError(Exception):
    pass


class EmptyDocumentError(Exception):
    pass


def extract_text_from_file(
    filename: str,
    file_content: bytes
) -> str:

    extension = Path(filename).suffix.lower()

    if extension == ".txt":
        text = extract_text_from_txt(file_content)

    elif extension == ".pdf":
        text = extract_text_from_pdf(file_content)

    else:
        raise UnsupportedFileTypeError(
            "Only PDF and TXT files are supported"
        )

    text = text.strip()

    if not text:
        raise EmptyDocumentError(
            "No readable text was found in the document"
        )

    return text


def extract_text_from_txt(
    file_content: bytes
) -> str:
    return file_content.decode(
        "utf-8",
        errors="ignore"
    )


def extract_text_from_pdf(
    file_content: bytes
) -> str:

    pdf_stream = BytesIO(file_content)

    reader = PdfReader(pdf_stream)

    pages = []

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            pages.append(page_text)

    return "\n".join(pages)