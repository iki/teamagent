"""Offline boundaries for portable external citation verification."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

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
        self.temporary = tempfile.TemporaryDirectory(prefix="teamagent-citation-fixture-")
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
                                    input=data, capture_output=True, timeout=10, env=external_sources.git_environment())
            self.assertEqual(result.returncode, 0, "Local fixture Git must succeed")
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
            result = subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(target)], capture_output=True, timeout=10)
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
    unittest.main()
