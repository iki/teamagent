"""Tokenizer-only regression checks; no model inference or reference imports."""

from pathlib import Path
import runpy
import unittest

PREPARER = runpy.run_path(str(Path(__file__).with_name("short-passages.py")))


class ShortPassagesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tokenizer = PREPARER["load_tokenizer"]()

    def assert_windows(self, body):
        header = "Source: fixture/example.ts\n"
        parent = {"id": "parent", "sourceId": "fixture", "path": "example.ts", "lineStart": 7,
                  "lineEnd": 7+body.count("\n"), "text": header+body}
        cases = [{"id": "unread-label", "split": "holdout", "query": "Opaque to the preparer"}]
        result = PREPARER["prepare"]({"format": "teamagent-memory-benchmark-v1", "createdAt": "fixture",
                                      "passages": [parent], "cases": cases}, self.tokenizer)
        children = result["passages"]
        self.assertEqual(result["cases"], cases)
        self.assertEqual(children[0]["parentCharacterStart"], 0)
        self.assertEqual(children[-1]["parentCharacterEnd"], len(body))
        self.assertGreater(len(children), 1)
        covered = 0
        for row in children:
            self.assertLessEqual(row["parentCharacterStart"], covered)
            covered = row["parentCharacterEnd"]
            self.assertLessEqual(row["tokens"], 256)
            self.assertLessEqual(row["overlapTokens"], 32)
            self.assertEqual(row["text"], header+body[row["parentCharacterStart"]:row["parentCharacterEnd"]])
            self.assertEqual(row["lineStart"], 7+body.count("\n", 0, row["parentCharacterStart"]))
            self.assertEqual(row["lineEnd"], 7+body.count("\n", 0, row["parentCharacterEnd"]-1))
            row["text"].encode("utf-8", errors="strict")
        self.assertEqual(len({row["id"] for row in children}), len(children))

    def test_unicode_document_windows_preserve_every_character_and_source_line(self):
        self.assert_windows("\n".join(f"Line {n}: Žluťoučký kůň 🦊 describes cancellation and capabilityEvidence." for n in range(30)))

    def test_long_code_line_windows_preserve_identifier_text_and_do_not_invent_lines(self):
        self.assert_windows("return prepareToolCall(beforeToolCall(argumentValidation)); "*45)


if __name__ == "__main__":
    unittest.main()
