"""Offline OmniVoice adapter for the reviewed 0.2.1 API; package code is trusted.

API: k2-fsa/OmniVoice@08be0b4ccbac3e13e374e86fbfead4b4cac343e2
Python socket denial is defense in depth, not operating-system isolation.
"""
import contextlib
import json
import os
import pathlib
import re
import sys
import wave

MAX_REQUEST_BYTES = 65536
RESOURCE_FILES = (
    "config.json", "model.safetensors", "tokenizer.json",
    "tokenizer_config.json", "chat_template.jinja",
    "audio_tokenizer/config.json", "audio_tokenizer/model.safetensors",
    "audio_tokenizer/preprocessor_config.json",
)


def deny_network(event, _args):
    if event in {"socket.connect", "socket.getaddrinfo", "socket.gethostbyname",
                 "socket.gethostbyaddr", "socket.sendto", "socket.bind"}:
        raise RuntimeError("Network access is disabled for this local media worker")


sys.addaudithook(deny_network)
for key in ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE", "HF_DATASETS_OFFLINE",
            "HF_HUB_DISABLE_TELEMETRY", "DO_NOT_TRACK"):
    os.environ[key] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate field")
        result[key] = value
    return result


def local_path(value, directory=False):
    if not isinstance(value, str) or not value or len(value) > 4096 or any(ord(c) < 32 for c in value):
        raise ValueError("invalid path")
    path = pathlib.Path(value)
    if not path.is_absolute() or path.is_symlink():
        raise ValueError("invalid path")
    if directory and not path.is_dir():
        raise ValueError("missing directory")
    return path


def resource(root, name):
    path = root
    for part in pathlib.PurePosixPath(name).parts:
        path = path / part
        if path.is_symlink():
            raise ValueError("linked resource")
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError("missing resource")
    with path.open("rb") as handle:
        if handle.read(128).startswith(b"version https://git-lfs.github.com/spec/v1"):
            raise ValueError("unmaterialized resource")
    return path


def main():
    if len(sys.argv) != 1:
        raise ValueError("unexpected arguments")
    raw = sys.stdin.buffer.read(MAX_REQUEST_BYTES + 1)
    if len(raw) > MAX_REQUEST_BYTES:
        raise ValueError("request exceeds limit")
    request = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_object)
    expected = {"version", "packageRoot", "weightsDirectory", "device", "text",
                "reference", "referenceText", "output", "maximumBytes"}
    if not isinstance(request, dict) or set(request) != expected or type(request["version"]) is not int or request["version"] != 1:
        raise ValueError("invalid request")
    if request["device"] not in {"cpu", "cuda", "mps", "xpu"}:
        raise ValueError("invalid device")
    for key in ("text", "referenceText"):
        value = request[key]
        if not isinstance(value, str) or not value.strip() or len(value) > 4096 or "\0" in value:
            raise ValueError("invalid text")
    limit = request["maximumBytes"]
    if type(limit) is not int or not 1024 <= limit <= 268435456:
        raise ValueError("invalid limit")
    package_root = local_path(request["packageRoot"], True)
    weights = local_path(request["weightsDirectory"], True)
    resource(package_root, "omnivoice/__init__.py")
    resource(package_root, "omnivoice/models/omnivoice.py")
    for name in RESOURCE_FILES:
        resource(weights, name)
    reference = local_path(request["reference"])
    output = local_path(request["output"])
    stage = pathlib.Path.cwd().resolve()
    if reference.parent.resolve() != stage or output.parent.resolve() != stage or output.name != "output.wav":
        raise ValueError("path outside stage")
    if not reference.is_file() or output.exists() or not output.parent.is_dir():
        raise ValueError("invalid files")
    with wave.open(str(reference), "rb") as recording:
        if recording.getnchannels() != 1 or recording.getframerate() != 24000 or recording.getsampwidth() != 2:
            raise ValueError("reference is not normalized")
        if not 1 <= recording.getnframes() <= 30 * 24000:
            raise ValueError("reference duration exceeds limit")
        frames = recording.getnframes()
        if len(recording.readframes(frames)) != frames * 2:
            raise ValueError("truncated reference")
    sys.path.insert(0, str(package_root))
    # Third-party imports/generation may print source text or diagnostics. Keep the
    # wire channel exclusive and only publish static failure diagnostics.
    with open(os.devnull, "w", encoding="utf-8") as discard:
        with contextlib.redirect_stdout(discard), contextlib.redirect_stderr(discard):
            import numpy as np
            import torch
            import soundfile as sf
            import omnivoice
            if pathlib.Path(omnivoice.__file__).resolve().parent != (package_root / "omnivoice").resolve():
                raise ValueError("wrong package")
            dtype = torch.float16 if request["device"] in {"cuda", "xpu"} else torch.float32
            with torch.inference_mode():
                model = omnivoice.OmniVoice.from_pretrained(
                    str(weights), device_map=request["device"], dtype=dtype,
                    local_files_only=True, load_asr=False, trust_remote_code=False,
                    attn_implementation="sdpa",
                )
                if type(model.sampling_rate) is not int or model.sampling_rate != 24000:
                    raise ValueError("unexpected sample rate")
                audios = model.generate(
                    text=request["text"], ref_audio=str(reference),
                    ref_text=request["referenceText"], normalize_text=False, preprocess_prompt=False,
                )
                if not isinstance(audios, list) or len(audios) != 1:
                    raise ValueError("unexpected batch")
                audio = audios[0]
                if not isinstance(audio, np.ndarray) or audio.ndim != 1 or audio.size == 0 or audio.dtype.kind != "f":
                    raise ValueError("invalid audio")
                if audio.size * 2 + 4096 > limit or not np.isfinite(audio).all():
                    raise ValueError("invalid audio extent")
                frame_count = int(audio.size)
                with output.open("xb") as handle:
                    sf.write(handle, audio, model.sampling_rate, format="WAV", subtype="PCM_16")
            version = getattr(omnivoice, "__version__", None)
    if output.is_symlink() or not output.is_file() or not 44 < output.stat().st_size <= limit:
        raise ValueError("invalid output")
    with wave.open(str(output), "rb") as produced:
        if produced.getnchannels() != 1 or produced.getframerate() != 24000 or produced.getsampwidth() != 2 or produced.getnframes() != frame_count:
            raise ValueError("inconsistent output")
        if len(produced.readframes(frame_count)) != frame_count * 2:
            raise ValueError("truncated output")
    if not isinstance(version, str) or version == "0.0.0" or re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9.+_-]{0,63}", version) is None:
        version = None
    print(json.dumps({"version": 1, "sampleRate": 24000, "channels": 1,
                      "frames": frame_count, "network": "python-sockets-disabled",
                      "method": "from_pretrained-local", "packageVersion": version}))


try:
    main()
except Exception:
    print("Local OmniVoice synthesis failed; verify the configured package, complete local resources, reference transcript and device.", file=sys.stderr)
    sys.exit(1)