"""Produce a token-budget sensitivity corpus without using queries or gold labels.

Every window includes the original source header and at most 256 MiniLM tokens,
including special tokens. Splits use the actual tokenizer's Unicode character
offsets. This prepares input only; it does not run retrieval or an embedding model.
"""

import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
TOKENIZER = ROOT / ".cache/benchmark-models/all-MiniLM-L6-v2/onnx/tokenizer.json"
TOKENIZER_SHA256 = "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0"
LIMIT = 256
OVERLAP = 32


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load_tokenizer():
    if digest(TOKENIZER.read_bytes()) != TOKENIZER_SHA256:
        raise ValueError("Pinned MiniLM tokenizer changed")
    from tokenizers import Tokenizer
    tokenizer = Tokenizer.from_file(str(TOKENIZER))
    tokenizer.no_truncation()
    tokenizer.no_padding()
    return tokenizer


def split_passage(passage, tokenizer):
    for key in ("id", "sourceId", "path", "text"):
        if not isinstance(passage.get(key), str) or not passage[key]:
            raise ValueError(f"Invalid passage {key}")
    if len(passage["text"]) > 4000:
        raise ValueError("Parent passage exceeds bound")
    if type(passage.get("lineStart")) is not int or type(passage.get("lineEnd")) is not int:
        raise ValueError("Invalid source line metadata")
    if not 1 <= passage["lineStart"] <= passage["lineEnd"]:
        raise ValueError("Reversed source line range")
    header = f"Source: {passage['sourceId']}/{passage['path']}\n"
    if not passage["text"].startswith(header):
        raise ValueError("Passage lacks its declared source header")
    body = passage["text"][len(header):]
    body.encode("utf-8", errors="strict")
    if len(tokenizer.encode(header).ids) > LIMIT-8:
        raise ValueError("Source header leaves insufficient body token budget")
    start, previous_end = 0, 0
    while start < len(body):
        remaining = header + body[start:]
        encoded = tokenizer.encode(remaining)
        if len(encoded.ids) <= LIMIT:
            end = len(body)
        else:
            # Index 0 is CLS; reserve the final slot for SEP. Offsets are Python
            # Unicode character positions, not UTF-8 bytes or UTF-16 code units.
            offset = encoded.offsets[LIMIT-2][1]
            end = start + offset - len(header)
            # Retain whitespace between the last accepted and next token.
            while end < len(body) and body[end].isspace():
                end += 1
        if end <= start:
            raise ValueError("Tokenizer produced a non-progressing window")
        text = header + body[start:end]
        current = tokenizer.encode(text)
        # Cutting a WordPiece can change its tokenization. Narrow using observed
        # character boundaries until the *complete repeated-header input* fits.
        while len(current.ids) > LIMIT:
            boundaries = sorted({e for s,e in current.offsets if e > len(header)})
            if len(boundaries) < 2:
                raise ValueError("Cannot form a bounded tokenizer window")
            end = start + boundaries[-2] - len(header)
            text = header + body[start:end]
            current = tokenizer.encode(text)
        overlap_tokens = len(tokenizer.encode(body[start:previous_end], add_special_tokens=False).ids) if start < previous_end else 0
        if overlap_tokens > OVERLAP:
            raise ValueError("Overlap exceeds token budget")
        line_start = passage["lineStart"] + body.count("\n", 0, start)
        line_end = passage["lineStart"] + body.count("\n", 0, max(start, end-1))
        if line_end > passage["lineEnd"]:
            raise ValueError("Parent source line range cannot support exact child lines")
        identity = f"{passage['id']}\0{start}\0{end}".encode("utf-8")
        yield {"id": digest(identity)[:32], "sourceId": passage["sourceId"], "path": passage["path"],
               "lineStart": line_start, "lineEnd": line_end, "text": text,
               "parentPassageId": passage["id"], "parentCharacterStart": start,
               "parentCharacterEnd": end, "tokens": len(current.ids), "overlapTokens": overlap_tokens}
        if end == len(body):
            break
        offsets = [(s-len(header),e-len(header)) for s,e in current.offsets if s >= len(header) and e > s]
        overlap_starts = sorted({start+s for s,_ in offsets[-OVERLAP:]})
        next_start = end
        for candidate in overlap_starts:
            if candidate > start and len(tokenizer.encode(body[candidate:end], add_special_tokens=False).ids) <= OVERLAP:
                next_start = candidate
                break
        previous_end, start = end, next_start


def prepare(data, tokenizer):
    if not isinstance(data, dict) or data.get("format") != "teamagent-memory-benchmark-v1":
        raise ValueError("Unknown corpus format")
    parents = data.get("passages")
    if not isinstance(parents, list) or not 0 < len(parents) <= 20000:
        raise ValueError("Invalid parent passage count")
    if not isinstance(data.get("cases"), list):
        raise ValueError("Cases must be preserved as a list")
    passages, identities, seen = [], set(), set()
    dropped_duplicates, parent_tokens = 0, []
    for parent in parents:
        if not isinstance(parent, dict):
            raise ValueError("Passage must be an object")
        if parent.get("id") in identities:
            raise ValueError("Duplicate parent passage ID")
        identities.add(parent.get("id"))
        parent_tokens.append(len(tokenizer.encode(parent["text"]).ids))
        for child in split_passage(parent, tokenizer):
            # Parent-relative character boundaries are exact even for a source
            # line longer than the original chunk size. Do not infer unknown
            # source byte columns from line-only parent metadata.
            key = (child["parentPassageId"], child["parentCharacterStart"], child["parentCharacterEnd"])
            if key in seen:
                dropped_duplicates += 1
                continue
            seen.add(key)
            passages.append(child)
            if len(passages) > 20000:
                raise ValueError("Short corpus exceeds the adapter passage limit")
    stats = {"method": "actual MiniLM tokenizer offsets; repeated source header; no query/label use",
             "tokenizerSha256": TOKENIZER_SHA256, "tokenLimitIncludingSpecialTokensAndHeader": LIMIT,
             "maximumBodyOverlapTokens": OVERLAP, "parentPassages": len(parents), "passages": len(passages),
             "parentTruncatedPassages": sum(n > LIMIT for n in parent_tokens),
             "parentMaximumTokens": max(parent_tokens), "maximumTokens": max(p["tokens"] for p in passages),
             "maximumObservedOverlapTokens": max(p["overlapTokens"] for p in passages),
             "deduplicatedIdenticalParentBoundaries": dropped_duplicates,
             "lineMapping": "parent lineStart plus Unicode body newline counts; original parent line metadata retained as authority"}
    return {**data, "passages": passages, "sensitivity": stats}


def main():
    if len(sys.argv) != 3:
        raise ValueError("Expected corpus.json corpus-short.json")
    source, destination = Path(sys.argv[1]), Path(sys.argv[2]).resolve()
    if not destination.is_relative_to(ROOT):
        raise ValueError("Output must remain inside the workspace")
    if source.stat().st_size > 64*1024*1024:
        raise ValueError("Input corpus exceeds 64 MiB")
    raw = source.read_bytes()
    result = prepare(json.loads(raw), load_tokenizer())
    result["sensitivity"]["inputSha256"] = digest(raw)
    with destination.open("x", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)
        file.write("\n")
    print(json.dumps(result["sensitivity"]))


if __name__ == "__main__":
    main()
