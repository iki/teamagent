"""Read-only identity for the provisioned Python runtime and converter environment."""
import hashlib
import importlib.metadata
import json
import os
import pathlib
import sys
import sysconfig
import time


def record_unexecuted_launcher_alias(path, base_root, selected, digest, platform=os.name):
    """Bind the reviewed Windows convenience alias without following a foreign target."""
    if platform != "nt" or path.parent != base_root or path.name != "python3.exe" or path in selected:
        return False
    target = os.readlink(path)
    if len(target) > 32768:
        raise RuntimeError("Python launcher alias target exceeds bound")
    digest.update(json.dumps(["unexecuted-base-launcher-alias", target], ensure_ascii=True).encode())
    return True


def file_content_identity(path, before):
    """Hash every provisioned file, including source and compiled bytecode, without a stat shortcut."""
    if before.st_size > 256 * 1024 ** 2:
        raise RuntimeError("Python prerequisite exceeds file bound")
    content = hashlib.sha256()
    with path.open("rb") as source:
        size = 0
        while chunk := source.read(1024 * 1024):
            size += len(chunk)
            if size > 256 * 1024 ** 2:
                raise RuntimeError("Python prerequisite grew beyond bound")
            content.update(chunk)
    after = path.stat()
    if (before.st_size, before.st_mode, before.st_mtime_ns, before.st_ctime_ns) != (after.st_size, after.st_mode, after.st_mtime_ns, after.st_ctime_ns) or size != before.st_size:
        raise RuntimeError("Python prerequisite changed during inspection")
    return content.hexdigest()


def check_bytecode_mode():
    if not sys.dont_write_bytecode or sys.pycache_prefix is not None:
        raise RuntimeError("Python probe requires read-only provisioned bytecode and no external prefix")


def fingerprint():
    check_bytecode_mode()
    started = time.monotonic()
    paths = sysconfig.get_paths()
    roots = {}
    for role in ("stdlib", "platstdlib", "purelib", "platlib"):
        roots.setdefault(pathlib.Path(paths[role]).resolve(), role)
    if os.name == "nt":
        runtime_dlls = pathlib.Path(sys.base_prefix) / "DLLs"
        if runtime_dlls.is_dir():
            roots.setdefault(runtime_dlls.resolve(), "runtime-dlls")
        # Windows also places installation roots on sys.path. Bind their complete
        # provisioned contents, rather than authorizing unmeasured top-level modules.
        roots.setdefault(pathlib.Path(sys.base_prefix).resolve(), "runtime-root")
        roots.setdefault(pathlib.Path(sys.prefix).resolve(), "environment-root")
    if any(root == pathlib.Path(root.anchor) for root in roots):
        raise RuntimeError("Python installation root is too broad")
    helper_directory = pathlib.Path(__file__).resolve().parent
    runtime_archive = pathlib.Path(sys.base_prefix) / ("python" + str(sys.version_info.major) + str(sys.version_info.minor) + ".zip")
    for entry in sys.path:
        if not entry:
            raise RuntimeError("Unreviewed implicit Python import root")
        path = pathlib.Path(entry).resolve()
        if not path.exists():
            continue
        if path == helper_directory or path == runtime_archive.resolve():
            continue
        if not any(path == root or root in path.parents for root in roots):
            raise RuntimeError("Unreviewed external Python import root")
    # The host selected this trusted provisioned interpreter. No paths from input
    # documents or environment configuration are executed by this helper.
    digest = hashlib.sha256()
    files = 0
    total = 0
    seen = set()
    selected = {pathlib.Path(sys.executable).absolute(), pathlib.Path(getattr(sys, "_base_executable", sys.executable)).absolute()}
    def record(path, label):
        nonlocal files, total
        if path in seen:
            return
        seen.add(path)
        files += 1
        before = path.stat()
        total += before.st_size
        if files > 100000 or total > 4 * 1024 ** 3 or before.st_size > 256 * 1024 ** 2 or time.monotonic() - started > 50:
            raise RuntimeError("Python prerequisite inventory bound exceeded")
        content = file_content_identity(path, before)
        digest.update((json.dumps([label, before.st_mode & 0o777, content], ensure_ascii=True, separators=(",", ":")) + "\n").encode())
    for root, role in roots.items():
        for directory, names, filenames in os.walk(root, followlinks=False):
            current = pathlib.Path(directory)
            if len(current.relative_to(root).parts) > 32:
                raise RuntimeError("Python prerequisite depth bound exceeded")
            for name in names:
                path = current / name
                if path.is_symlink() or path.is_junction():
                    raise RuntimeError("Unreviewed Python prerequisite directory link")
            names.sort()
            for name in sorted(filenames):
                path = current / name
                if path.is_symlink():
                    if record_unexecuted_launcher_alias(path, pathlib.Path(sys.base_prefix).resolve(), selected, digest):
                        continue
                    raise RuntimeError("Unreviewed Python prerequisite file link")
                record(path, role + "/" + path.relative_to(root).as_posix())
    record(pathlib.Path(sys.executable).resolve(), "interpreter")
    base_executable = pathlib.Path(getattr(sys, "_base_executable", sys.executable)).resolve()
    record(base_executable, "base-interpreter")
    if runtime_archive.is_file():
        record(runtime_archive.resolve(), "runtime-archive")
    if os.name == "nt":
        for path in sorted(pathlib.Path(sys.base_prefix).glob("*.dll")):
            record(path, "runtime/" + path.name)
    else:
        library = sysconfig.get_config_var("LDLIBRARY")
        libdir = sysconfig.get_config_var("LIBDIR")
        if library and libdir and (pathlib.Path(libdir) / library).is_file():
            record((pathlib.Path(libdir) / library).resolve(), "runtime-library")
    distributions = sorted((item.metadata["Name"], item.version) for item in importlib.metadata.distributions())
    digest.update(json.dumps([sys.version, sys.implementation.cache_tag, distributions], sort_keys=True).encode())
    return {"version": 1, "sha256": digest.hexdigest(), "files": files, "bytes": total}


if __name__ == "__main__":
    try:
        check_bytecode_mode()
        # Capability checks do not replace byte identity, and never install anything.
        import markitdown
        import bs4
        sys.stdout.buffer.write((json.dumps(fingerprint(), separators=(",", ":")) + "\n").encode("utf-8"))
    except Exception as error:
        reason = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        sys.stderr.buffer.write(("Python prerequisite integrity could not be established: " + reason + ". No cached success is valid.\n").encode("utf-8"))
        sys.exit(1)
