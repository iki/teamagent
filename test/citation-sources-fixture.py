"""Offline boundaries for portable external citation verification."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "spec/tools"))
previous_prefix = sys.pycache_prefix
try:
    # -I ignores the scheduler environment; keep direct fixture runs off source caches too.
    with tempfile.TemporaryDirectory(prefix="teamagent-citation-bytecode-") as bytecode:
        sys.pycache_prefix = bytecode
        import external_sources
        import validate
finally:
    sys.pycache_prefix = previous_prefix


class CitationSources(unittest.TestCase):
    def setUp(self):
        # The bare cache adds a full hash path; retain Windows path headroom under owned workers.
        self.temporary = tempfile.TemporaryDirectory(prefix="cite-")
        self.base = Path(self.temporary.name).resolve()
        self.root = self.base / "project"
        (self.root / "spec/data").mkdir(parents=True)
        for name in ["inventory", "coverage"]:
            (self.root / f"spec/data/{name}.json").write_text("[]", encoding="utf-8")
        self.source = {"url": "https://github.com/example/fixture", "revisions": ["1" * 40]}
        self.save_registry()

    def tearDown(self):
        self.temporary.cleanup()

    def save_registry(self, data=None):
        data = data if data is not None else {"format": external_sources.FORMAT, "sources": [self.source]}
        (self.root / "spec/data/external-source-pins.json").write_text(json.dumps(data), encoding="utf-8")

    def make_repo(self):
        source = external_sources.registry(self.root)[0]
        repo = self.root / source["location"]
        repo.mkdir(parents=True)
        def git(*args, data=None):
            result = subprocess.run(["git", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
                                     "-c", "core.hooksPath=" + os.devnull, "-C", str(repo), *args],
                                    input=data, capture_output=True, timeout=10, env=external_sources.git_environment(),
                                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            diagnostic = result.stderr[:2048].decode("utf-8", "replace").replace(str(self.base), "<fixture>")
            diagnostic = diagnostic.replace(self.base.as_posix(), "<fixture>").replace("\r\n", "\n").replace("\r", "\n")
            self.assertEqual(result.returncode, 0, f"Local fixture Git {args[0]} failed: {diagnostic}")
            return result.stdout.decode().strip()
        git("init", "--bare", "--quiet")
        git("remote", "add", "origin", self.source["url"])
        blob = git("hash-object", "-w", "--stdin", data=b"first line\nsecond line\n")
        tree = git("mktree", data=f"100644 blob {blob}\tREADME.md\n".encode())
        sha = git("commit-tree", tree, data=b"fixture\n")
        self.source["revisions"] = [sha]
        self.save_registry()
        (self.root / "spec/review.md").write_text(
            f"[source]({self.source['url']}/blob/{sha}/README.md#L1-L2)\n", encoding="utf-8")
        return repo, sha, git

    def test_registry_rejects_unsafe_urls_mutable_refs_duplicates_and_extra_paths(self):
        for url in ["http://github.com/a/b", "https://user:secret@github.com/a/b", "https://github.com.evil/a/b",
                    "https://github.com/a/../b", "https://github.com/a/b?q=secret", "https://github.com/a/b#fragment"]:
            self.save_registry({"format": external_sources.FORMAT, "sources": [{"url": url, "revisions": ["1" * 40]}]})
            with self.assertRaises(ValueError): external_sources.registry(self.root)
        for entries in [[{**self.source, "revisions": ["main"]}], [self.source, self.source],
                        [{**self.source, "location": "../escape"}], [{**self.source, "revisions": ["1" * 40, "1" * 40]}]]:
            self.save_registry({"format": external_sources.FORMAT, "sources": entries})
            with self.assertRaises(ValueError): external_sources.registry(self.root)

    def test_exact_commit_and_lines_are_verified_offline(self):
        self.make_repo()
        result = validate.validate(self.root)
        self.assertEqual(result["issues"], [])
        self.assertEqual(result["uniquePinnedBlobsChecked"], 1)
        self.assertEqual(result["blobs"][0]["lines"], 2)
        self.assertEqual(result["unmappedExternalSourceLinks"], [])
        path = self.root / "spec/review.md"
        path.write_text(path.read_text().replace("#L1-L2", "#L1-L3"), encoding="utf-8")
        self.assertTrue(any("invalid pinned lines" in issue for issue in validate.validate(self.root)["issues"]))

    @unittest.skipUnless(os.name == "nt", "Native console inspection requires Windows")
    def test_git_readers_launch_a_real_child_without_a_console(self):
        # Preserve each reader's actual launch options, replacing only the local Git probe.
        # A native child report covers process behavior as well as the flag contract.
        real_run = subprocess.run
        probe = [sys.executable, "-I", "-B", "-c",
                 "import ctypes,json; kernel=ctypes.WinDLL('kernel32',use_last_error=True); "
                 "kernel.GetConsoleWindow.restype=ctypes.c_void_p; "
                 "print(json.dumps({'hasConsole':bool(kernel.GetConsoleWindow())}))"]

        def launch_probe(command, **options):
            self.assertEqual(command[0], "git")
            self.assertTrue(options.get("creationflags", 0) & subprocess.CREATE_NO_WINDOW)
            return real_run(probe, **options)

        with patch.object(subprocess, "run", side_effect=launch_probe):
            for reader in (external_sources.read_git, validate.git):
                with self.subTest(reader=reader.__module__):
                    result = reader(self.root, "--version")
                    self.assertEqual(result.returncode, 0)
                    self.assertEqual(json.loads(result.stdout), {"hasConsole": False})

    def test_missing_pin_does_not_fetch_or_substitute_head(self):
        self.make_repo()
        self.source["revisions"] = ["2" * 40]
        self.save_registry()
        (self.root / "spec/review.md").write_text(f"[missing]({self.source['url']}/blob/{'2' * 40}/README.md)", encoding="utf-8")
        result = validate.validate(self.root)
        self.assertEqual(result["uniquePinnedBlobsChecked"], 0)
        self.assertTrue(any("commit is unavailable" in issue for issue in result["issues"]))

    def test_origin_mismatch_and_local_config_override_fail_closed(self):
        repo, _, git = self.make_repo()
        git("remote", "set-url", "origin", "https://github.com/other/fixture")
        self.assertTrue(any("origin does not match" in issue for issue in validate.validate(self.root)["issues"]))
        git("remote", "set-url", "origin", self.source["url"])
        git("config", "url.https://example.invalid/.insteadOf", "https://github.com/")
        self.assertTrue(any("unsupported configuration" in issue for issue in validate.validate(self.root)["issues"]))

    def test_junction_or_symlink_cannot_move_cache_outside_project(self):
        source = external_sources.registry(self.root)[0]
        target = self.base / "outside"
        target.mkdir()
        (target / "keep").write_text("untouched", encoding="utf-8")
        link = self.root / source["location"]
        link.parent.mkdir(parents=True)
        if os.name == "nt":
            result = subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(target)], capture_output=True, timeout=10,
                                    creationflags=subprocess.CREATE_NO_WINDOW)
            self.assertEqual(result.returncode, 0, "Fixture directory junction must be created")
        else:
            link.symlink_to(target, target_is_directory=True)
        try:
            with self.assertRaisesRegex(ValueError, "escapes project"):
                external_sources.registry(self.root)
        finally:
            if os.name == "nt": os.rmdir(link)
            else: link.unlink()
        self.assertEqual((target / "keep").read_text(), "untouched")


if __name__ == "__main__":
    external_sources.configure_output()
    unittest.main()
