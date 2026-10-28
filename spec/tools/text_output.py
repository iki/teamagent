"""UTF-8/LF output for repository-owned research text, never raw source snapshots."""
from pathlib import Path
import sys


def normalize_lf(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def write_utf8_lf(path: Path, text: str) -> None:
    """Normalize before encoding; callers hashing generated text must hash these bytes."""
    path.write_text(normalize_lf(text), encoding="utf-8", newline="\n")


def configure_output() -> None:
    """Configure CLI streams explicitly so Windows adds no CR and preserves Unicode."""
    sys.stdout.reconfigure(encoding="utf-8", newline="\n")
    sys.stderr.reconfigure(encoding="utf-8", newline="\n")
