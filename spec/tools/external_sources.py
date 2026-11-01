"""Exact public Git pins for research citations outside the managed repository census.

This internal maintenance helper never checks out or executes upstream code.
Normal validation is offline. Explicit fetches use isolated, credential-free Git
configuration, no redirects, one process at a time and bounded cache/time budgets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import time
from text_output import configure_output

FORMAT = "teamagent-external-source-pins-v1"
MAX_REGISTRY = 65536
MAX_CACHE = 512 * 1024 * 1024
MAX_REPOSITORY = 128 * 1024 * 1024
MAX_FETCH_SECONDS = 120
SAFE_CONFIG = {"core.repositoryformatversion", "core.filemode", "core.bare", "core.ignorecase",
               "core.symlinks", "core.logallrefupdates", "remote.origin.url", "remote.origin.fetch"}


def registry(root: Path):
    path = root / "spec/data/external-source-pins.json"
    if not path.exists():
        return []
    if path.stat().st_size > MAX_REGISTRY:
        raise ValueError("External source registry exceeds 64 KiB")
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(data, dict) or set(data) != {"format", "sources"} or data["format"] != FORMAT:
        raise ValueError("Invalid external source registry")
    rows = data["sources"]
    if not isinstance(rows, list) or not 1 <= len(rows) <= 32:
        raise ValueError("External registry requires 1-32 sources")
    sources, seen = [], set()
    for row in rows:
        if not isinstance(row, dict) or set(row) != {"url", "revisions"}:
            raise ValueError("Invalid external source entry")
        url, revisions = row["url"], row["revisions"]
        if not isinstance(url, str) or len(url) > 300 or not re.fullmatch(
                r"https://github\.com/[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*", url):
            raise ValueError("External sources require plain public GitHub HTTPS repository URLs")
        if url.lower().endswith(".git"):
            raise ValueError("Use the canonical repository URL without .git")
        if not isinstance(revisions, list) or not 1 <= len(revisions) <= 16 or any(
                not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha) for sha in revisions):
            raise ValueError("External sources require 1-16 full immutable GitHub commit SHAs")
        if url.lower() in seen or len(set(revisions)) != len(revisions):
            raise ValueError("Duplicate external source or revision")
        seen.add(url.lower())
        location = ".cache/research/citation-git/" + hashlib.sha256(url.lower().encode()).hexdigest()
        repo = (root / location).resolve()
        if not repo.is_relative_to(root.resolve()):
            raise ValueError("External citation cache escapes project")
        sources.append({"url": url, "revisions": revisions, "location": location})
    return sources


def git_environment():
    keep = {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "TMPDIR", "LANG", "LC_ALL"}
    env = {key: value for key, value in os.environ.items() if key.upper() in keep}
    env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
               GIT_TERMINAL_PROMPT="0", GIT_NO_LAZY_FETCH="1", GCM_INTERACTIVE="Never")
    return env


def command(repo: Path, *args: str):
    return ["git", "--no-replace-objects", "-c", "safe.directory=" + repo.as_posix(),
            "-c", "core.hooksPath=" + os.devnull, "-c", "credential.helper=", "-c", "credential.interactive=false",
            "-c", "protocol.allow=never", "-c", "protocol.https.allow=always",
            "-c", "http.followRedirects=false", "-c", "gc.auto=0", "-C", str(repo), *args]


def read_git(repo: Path, *args: str):
    result = subprocess.run(command(repo, *args), capture_output=True, timeout=30, env=git_environment(),
                            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
    if len(result.stdout) > 65536 or len(result.stderr) > 65536:
        raise ValueError("External Git diagnostic exceeds 64 KiB")
    return result


def cache_size(path: Path):
    total, count = 0, 0
    if not path.exists():
        return 0
    for base, dirs, files in os.walk(path, followlinks=False):
        for name in dirs + files:
            child = Path(base) / name
            if child.is_symlink() or child.is_junction():
                raise ValueError("External Git cache contains a link or junction")
            count += 1
            if count > 100000:
                raise ValueError("External Git cache exceeds file-count bound")
        for name in files:
            try:
                total += (Path(base) / name).stat().st_size
            except FileNotFoundError:
                # Git atomically renames temporary pack files during a fetch.
                continue
        if total > MAX_CACHE:
            return total
    return total


def check_cache(root: Path, source):
    repo = (root / source["location"]).resolve()
    if not repo.is_relative_to(root.resolve()):
        raise ValueError("External citation cache escapes project")
    if cache_size(repo) > MAX_REPOSITORY:
        raise ValueError("External Git repository exceeds 128 MiB")
    keys = read_git(repo, "config", "--local", "--name-only", "--list")
    if keys.returncode or any(key.lower() not in SAFE_CONFIG for key in keys.stdout.decode().splitlines()):
        raise ValueError("External Git cache is absent or contains unsupported configuration")
    origin = read_git(repo, "config", "--local", "--get", "remote.origin.url")
    bare = read_git(repo, "rev-parse", "--is-bare-repository")
    if origin.returncode or origin.stdout.decode().strip().lower() != source["url"].lower():
        raise ValueError("External Git cache origin does not match registered source")
    if bare.returncode or bare.stdout.strip() != b"true" or (repo / "objects/info/alternates").exists():
        raise ValueError("External citation cache must be an independent bare repository")
    return repo


def terminate(process):
    if os.name == "nt":
        subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15,
                       creationflags=subprocess.CREATE_NO_WINDOW)
    else:
        os.killpg(process.pid, signal.SIGKILL)
    process.wait(timeout=15)


def fetch_sources(root: Path):
    sources = registry(root)
    base = (root / ".cache/research/citation-git").resolve()
    if not base.is_relative_to(root.resolve()):
        raise ValueError("External citation cache escapes project")
    base.mkdir(parents=True, exist_ok=True)
    results = []
    with (base / ".fetch-lock").open("x", encoding="utf-8", newline="\n"):
        try:
            for source in sources:
                repo = root / source["location"]
                try:
                    if not repo.exists():
                        repo.mkdir()
                        for args in [("init", "--bare", "--quiet"), ("remote", "add", "origin", source["url"])]:
                            if read_git(repo, *args).returncode:
                                raise ValueError("Could not initialize external citation cache")
                    repo = check_cache(root, source)
                    for sha in source["revisions"]:
                        if read_git(repo, "cat-file", "-e", sha + "^{commit}").returncode == 0:
                            results.append({"source": source["url"], "sha": sha, "status": "already-available"})
                            continue
                        flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
                        process = subprocess.Popen(command(repo, "fetch", "--quiet", "--no-tags", "--depth=1",
                                                           "--no-write-fetch-head", source["url"], sha),
                                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                                   env=git_environment(), creationflags=flags,
                                                   start_new_session=os.name != "nt")
                        began = time.monotonic()
                        try:
                            while process.poll() is None:
                                if time.monotonic() - began > MAX_FETCH_SECONDS:
                                    raise ValueError("External Git fetch exceeded 120-second deadline")
                                if cache_size(repo) > MAX_REPOSITORY or cache_size(base) > MAX_CACHE:
                                    raise ValueError("External Git fetch exceeded cache budget")
                                time.sleep(.25)
                            if process.returncode or read_git(repo, "cat-file", "-e", sha + "^{commit}").returncode:
                                raise ValueError("Exact external commit fetch failed; no revision substitution")
                        finally:
                            if process.poll() is None:
                                terminate(process)
                        if cache_size(repo) > MAX_REPOSITORY or cache_size(base) > MAX_CACHE:
                            raise ValueError("External Git fetch exceeded cache budget")
                        if read_git(repo, "update-ref", "refs/pins/" + sha, sha).returncode:
                            raise ValueError("External commit retention failed")
                        results.append({"source": source["url"], "sha": sha, "status": "fetched"})
                except (OSError, ValueError, subprocess.TimeoutExpired):
                    results.append({"source": source["url"], "status": "failed", "reason": "Cache, exact-pin fetch or configured bound failed; no retry or substitution performed."})
        finally:
            pass
    (base / ".fetch-lock").unlink()
    return results


if __name__ == "__main__":
    configure_output()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", action="store_true", help="Explicitly fetch only registered public commit pins; no credentials, checkout, hooks or code execution")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    result = fetch_sources(root) if args.fetch else registry(root)
    print(json.dumps(result, indent=2))
    raise SystemExit(any(row.get("status") == "failed" for row in result))
