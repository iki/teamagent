"""Run real MemPalace/Chroma APIs against frozen common benchmark passages.

Reference code is loaded only from the reviewed sibling checkout after commit and
clean-tree checks. No corpus text is executed. Network is denied during measurement.
"""

import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
REFERENCE = ROOT.parent / "ai-agents-mem" / "mempalace"
COMMIT = "43122aefb8ed58e9fa4e1953e15ce70026339ec2"
MODEL = ROOT / ".cache" / "benchmark-models" / "all-MiniLM-L6-v2"
MODEL_SHA256 = "4f148ba8ae9c2c7fbee4af2b132db8d06c6a6545b47fc83bbb98c3d22b8393e6"
TOKENIZER_SHA256 = "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0"


def git(*args):
    return subprocess.check_output(["git", "-c", f"safe.directory={REFERENCE.as_posix()}",
                                    "-C", str(REFERENCE), *args], text=True, timeout=30,
                                   creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0).strip()


def validate_input(data):
    if not isinstance(data, dict) or data.get("repeat") != 3:
        raise ValueError("Expected benchmark input with three warm repetitions")
    for key, maximum in (("passages", 20000), ("queries", 1000)):
        rows = data.get(key)
        if not isinstance(rows, list) or not 0 < len(rows) <= maximum:
            raise ValueError(f"Invalid {key} count")
        ids = set()
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not row["id"]:
                raise ValueError(f"Invalid {key} ID")
            if row["id"] in ids:
                raise ValueError(f"Duplicate {key} ID")
            ids.add(row["id"])
            text = row.get("text" if key == "passages" else "query")
            if not isinstance(text, str) or not 0 < len(text) <= 4000:
                raise ValueError(f"Invalid {key} text")
    if not isinstance(data.get("outputDirectory"), str):
        raise ValueError("Missing output directory")
    destination = Path(data["outputDirectory"]).resolve(strict=True)
    if not destination.is_relative_to(ROOT):
        raise ValueError("Output directory must be inside workspace")
    return destination


def network_guard(event, _args):
    if event in {"socket.connect", "socket.getaddrinfo", "socket.sendto"}:
        raise RuntimeError("Network forbidden during local benchmark")


def peak_rss_bytes():
    if sys.platform == "win32":
        import ctypes
        from ctypes import wintypes
        class MemoryCounters(ctypes.Structure):
            _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD)] + [
                (name, ctypes.c_size_t) for name in ["PeakWorkingSetSize", "WorkingSetSize",
                "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage",
                "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage"]]
        counters = MemoryCounters()
        counters.cb = ctypes.sizeof(counters)
        function = ctypes.WinDLL("kernel32", use_last_error=True).K32GetProcessMemoryInfo
        function.argtypes = [wintypes.HANDLE, ctypes.POINTER(MemoryCounters), wintypes.DWORD]
        function.restype = wintypes.BOOL
        if not function(wintypes.HANDLE(-1), ctypes.byref(counters), counters.cb):
            raise ctypes.WinError(ctypes.get_last_error())
        return counters.PeakWorkingSetSize
    import resource
    value = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return value if sys.platform == "darwin" else value * 1024


def check_hits(hits, ids):
    output, seen = [], set()
    for hit in hits:
        if not isinstance(hit, dict) or hit.get("id") not in ids:
            raise ValueError("Reference returned unknown passage")
        if not isinstance(hit.get("score"), (int, float)) or not math.isfinite(hit["score"]):
            raise ValueError("Reference returned non-finite score")
        if hit["id"] not in seen:
            seen.add(hit["id"])
            output.append(hit)
    return output[:10]


def measure(name, mode, search, queries, ids, ingest_ms, setup_ms):
    results = []
    # The first repetition is observed initial-query latency; OS/model caches are
    # not flushed. Three subsequent repetitions are explicitly warm measurements.
    for query in queries:
        runs = []
        for _ in range(4):
            began = time.perf_counter()
            try:
                hits = check_hits(search(query["query"]), ids)
                runs.append({"elapsedMs": (time.perf_counter()-began)*1000, "hits": hits})
            except Exception as error:
                runs.append({"elapsedMs": (time.perf_counter()-began)*1000, "hits": [],
                             "error": f"{type(error).__name__}: {str(error)[:1500]}"})
        results.append({"id": query["id"], "runs": runs})
    return {"system": name, "mode": mode, "ingestMs": ingest_ms, "setupMs": setup_ms, "queries": results}


def main():
    if len(sys.argv) != 3:
        raise ValueError("Expected input.json output.json")
    raw = Path(sys.argv[1]).read_bytes()
    if len(raw) > 64*1024*1024:
        raise ValueError("Input exceeds 64 MiB")
    data = json.loads(raw)
    destination = validate_input(data)
    if git("rev-parse", "HEAD") != COMMIT or git("status", "--porcelain"):
        raise ValueError("Reference source changed; review and repin")
    setup_started = time.perf_counter()
    os.environ.update({"ANONYMIZED_TELEMETRY": "False", "OTEL_SDK_DISABLED": "true",
                       "MEMPALACE_CONFIG_DIR": str(destination / "mempalace-config"),
                       "MEMPALACE_EMBEDDING_MODEL": "minilm", "MEMPALACE_EMBEDDING_DEVICE": "cpu",
                       "MEMPALACE_BACKEND": "chroma", "MEMPALACE_LANG": "en",
                       "HF_HUB_OFFLINE": "1", "HF_HUB_DISABLE_TELEMETRY": "1"})
    sys.path.insert(0, str(REFERENCE))
    from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
    ONNXMiniLM_L6_V2.DOWNLOAD_PATH = MODEL
    if not (MODEL / "onnx" / "model.onnx").is_file():
        raise ValueError("Model missing; run setup.py explicitly before benchmarking")
    for filename, expected in (("model.onnx", MODEL_SHA256), ("tokenizer.json", TOKENIZER_SHA256)):
        with (MODEL / "onnx" / filename).open("rb") as file:
            if hashlib.file_digest(file, "sha256").hexdigest() != expected:
                raise ValueError(f"Pinned model file changed: {filename}")
    from tokenizers import Tokenizer
    tokenizer = Tokenizer.from_file(str(MODEL / "onnx" / "tokenizer.json"))
    tokenizer.no_truncation()
    tokenizer.no_padding()
    token_lengths = [len(tokenizer.encode(row["text"]).ids) for row in data["passages"]]
    from mempalace.palace import get_collection
    from mempalace.backends import get_backend
    from mempalace.searcher import search_memories
    sys.addaudithook(network_guard)
    palace = destination / "mempalace"
    palace.mkdir()
    collection = get_collection(str(palace), create=True)
    setup_ms = (time.perf_counter()-setup_started)*1000
    began = time.perf_counter()
    passages = data["passages"]
    for offset in range(0, len(passages), 64):
        batch = passages[offset:offset+64]
        collection.add(documents=[row["text"] for row in batch],
                       ids=[row["id"] for row in batch],
                       metadatas=[{"source_file": row["id"], "wing": "benchmark", "room": "common",
                                   "created_at": "2000-01-01T00:00:00", "chunk_index": 0} for row in batch])
        print(f"Indexed {min(offset+64,len(passages))}/{len(passages)} common passages", file=sys.stderr)
    ingest_ms = (time.perf_counter()-began)*1000
    ids = {row["id"] for row in passages}

    def hybrid(query):
        result = search_memories(query, str(palace), n_results=10, candidate_strategy="union", lang="en")
        if result.get("error"):
            raise RuntimeError(json.dumps(result))
        # Upstream hybrid ranking is authoritative; the public response exposes
        # component scores rather than the combined score, so report rank score.
        return [{"id": row["drawer_id"], "score": 1/(rank+1)} for rank,row in enumerate(result["results"])]

    def lexical(query):
        result = search_memories(query, str(palace), n_results=10, vector_disabled=True, lang="en")
        if result.get("error"):
            raise RuntimeError(json.dumps(result))
        return [{"id": row["drawer_id"], "score": row.get("bm25_score", 1/(rank+1))} for rank,row in enumerate(result["results"])]

    def dense(query):
        result = collection.query(query_texts=[query], n_results=min(10,len(passages)), include=["distances"])
        return [{"id": item, "score": 1-distance} for item,distance in zip(result["ids"][0],result["distances"][0])]

    systems = [measure("mempalace-hybrid", "MemPalace search_memories, union lexical/vector candidates, English stopwords, no derived closets", hybrid, data["queries"], ids, ingest_ms, setup_ms),
               measure("mempalace-lexical", "MemPalace search_memories vector_disabled SQLite BM25 ablation", lexical, data["queries"], ids, ingest_ms, setup_ms),
               measure("chroma-dense", "Chroma HNSW cosine + MemPalace MiniLM encoder; shared upstream collection substrate baseline", dense, data["queries"], ids, ingest_ms, setup_ms)]
    get_backend("chroma").close_palace(str(palace))
    stats = {"commit": COMMIT, "license": "MIT", "python": sys.version, "passages": len(passages),
             "packages": {name: importlib.metadata.version(name) for name in ["chromadb","onnxruntime","numpy","tokenizers"]},
             "model": "all-MiniLM-L6-v2", "modelSha256": MODEL_SHA256,
             "device": "CPUExecutionProvider", "dimension": 384, "networkDeniedDuringMeasurement": True,
             "encoderTokenLimit": 256, "truncatedPassages": sum(length > 256 for length in token_lengths),
             "maxPassageTokens": max(token_lengths),
             "sharedIngestAcrossThreeModes": True, "ingestIncludesDocumentEmbedding": True,
             "peakRssBytes": peak_rss_bytes(),
             "peakRssScope": "joint Python worker process across three modes, shared index and encoder",
             "diskMeasuredAfterClose": True,
             "setupIncludesWitnessEmbedding": True, "initialPassIsNotOSCold": True,
             "warmRepetitions": 3, "diskBytes": sum(p.stat().st_size for p in palace.rglob("*") if p.is_file())}
    with Path(sys.argv[2]).open("x", encoding="utf-8") as file:
        json.dump({"inputSha256": hashlib.sha256(raw).hexdigest(), "systems": systems, "stats": stats}, file, indent=2)
        file.write("\n")


if __name__ == "__main__":
    main()
