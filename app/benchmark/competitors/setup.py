"""Prepare the exact local MiniLM model used by the reference benchmark."""

import hashlib
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
CACHE = ROOT / ".cache" / "benchmark-models" / "all-MiniLM-L6-v2"
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["OTEL_SDK_DISABLED"] = "true"

from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2


def main():
    started = time.perf_counter()
    ONNXMiniLM_L6_V2.DOWNLOAD_PATH = CACHE
    model = ONNXMiniLM_L6_V2(preferred_providers=["CPUExecutionProvider"])
    vectors = model(["Local benchmark setup witness."])
    files = []
    for path in sorted(CACHE.rglob("*")):
        if path.is_file():
            files.append({"path": path.relative_to(CACHE).as_posix(),
                          "bytes": path.stat().st_size,
                          "sha256": hashlib.file_digest(path.open("rb"), "sha256").hexdigest()})
    result = {"model": model.MODEL_NAME, "url": model.MODEL_DOWNLOAD_URL,
              "archiveSha256": model._MODEL_SHA256, "dimension": len(vectors[0]),
              "device": "CPUExecutionProvider", "setupAndWitnessMs": (time.perf_counter()-started)*1000,
              "files": files, "python": sys.version}
    destination = CACHE.parent / "setup.json"
    destination.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(result))


if __name__ == "__main__":
    main()
