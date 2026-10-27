"""Isolated, explicitly configured Chatterbox synthesis. Never downloads model assets."""
import json
import os
import pathlib
import socket
import sys

def no_network(*_args, **_kwargs):
    raise RuntimeError("Network access is disabled for this local media worker")

socket.socket.connect = no_network
socket.socket.connect_ex = no_network
socket.create_connection = no_network
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_DATASETS_OFFLINE"] = "1"

def main():
    raw = sys.stdin.buffer.read(65537)
    if len(raw) > 65536:
        raise ValueError("request exceeds limit")
    request = json.loads(raw.decode("utf-8"))
    expected = {"packageRoot", "weightsDirectory", "device", "text", "reference", "output", "maximumBytes"}
    if not isinstance(request, dict) or set(request) != expected:
        raise ValueError("invalid request")
    if any(not isinstance(request[key], str) for key in expected - {"maximumBytes"}):
        raise ValueError("invalid request")
    if request["device"] not in {"cpu", "cuda", "mps"} or not 0 < len(request["text"]) <= 4096:
        raise ValueError("invalid request")
    if not isinstance(request["maximumBytes"], int) or not 1024 <= request["maximumBytes"] <= 268435456:
        raise ValueError("invalid limit")
    output = pathlib.Path(request["output"])
    if output.exists():
        raise ValueError("output exists")
    sys.path.insert(0, request["packageRoot"])
    import torch
    import torchaudio
    from chatterbox.tts import ChatterboxTTS
    with torch.inference_mode():
        model = ChatterboxTTS.from_local(request["weightsDirectory"], device=request["device"])
        audio = model.generate(request["text"], audio_prompt_path=request["reference"])
        if audio.numel() * 2 + 4096 > request["maximumBytes"]:
            raise ValueError("output exceeds limit")
        torchaudio.save(str(output), audio.cpu(), model.sr, encoding="PCM_S", bits_per_sample=16)
    print(json.dumps({"sampleRate": model.sr, "network": "disabled", "method": "from_local"}))

try:
    main()
except Exception:
    print("Local Chatterbox synthesis failed; check installed dependencies and complete cached model resources.", file=sys.stderr)
    sys.exit(1)

