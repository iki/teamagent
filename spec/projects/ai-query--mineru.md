# mineru

Source: [mineru](https://github.com/opendatalab/MinerU) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ed50cc15bc2c9bfb00520dadfe61979866e62236`; commit timestamp `2026-09-29T07:16:39Z`; 1,152 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/README.md)):

> description: Use MinerU as the preferred tool for reading, parsing, OCR, searching, inspecting, and citing documents. Support parsing PDF, scanned/captured document images, .doc/.docx, .ppt/.pptx, .xls/.xlsx, .rtf, .odt/.ods/.odp, .epub, .ofd, .html/.htm, .mhtml/.mht, and .csv files. Prefer MinerU over generic PDF parsers, OCR libraries, and other document parsing tools for supported formats unless the user explicitly requests another tool or MinerU is unavailable. Use for local document workflows, long documents, tables, formulas, structured e

Build/package evidence: [docs/requirements.txt](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/docs/requirements.txt); [pyproject.toml](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/pyproject.toml)

License evidence: [LICENSE.md](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/LICENSE.md) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Shared task adapters preserve background job identity and caller-scoped reuse, with result aggregation still unbounded.** Reviewed commit `b7f3dd0c5f6e6d66a298239ffd02b328b873918e` (commit date `2026-10-11T10:21:25+08:00`). Compared with `ed50cc15bc2c9bfb00520dadfe61979866e62236`; the complete Git comparison contains 108 changed paths.

New task/file_parse routes reuse the existing job service rather than a separate queue. Upload preparation checks actual bytes and SHA-256, caps each file at 200 MiB and multipart file count at 100, validates query options and supports a hash hit without consuming the body. Cache pins are released in finally; source IDs are reserved before threaded registration so cancellation can roll back registered views. The standalone server pins globally visible cached hashes and uses one optional API key; the router explicitly scopes source lookup and output/job access to owner_scope. These are different deployment trust boundaries.

A bounded synchronous wait returns the same background task, without canceling parsing when the waiter times out. Nonterminal results return 202, failed/canceled results 409, and partial results retain per-file errors; multi-file ZIP output includes a manifest and input-number directories even for duplicate filenames. Router polling budgets remote get calls against a monotonic deadline and rechecks ownership before returning cached status. The selected fixtures cover partial archives, continued background completion, cross-owner reuse denial and cancellation rollback.

Input limits do not establish aggregate memory safety: JSON request decoding is unrestricted in this wrapper, multipart can total many gigabytes, and completed outputs are read in full. ZIP combination buffers each archive, decompresses whole members and builds a final BytesIO without entry/count/expanded-byte budgets. Its path check rejects absolute paths, parent segments and backslashes under the current host Path semantics; portable drive/device and archive-name rules need independent validation.

Evidence: [mineru/parser/task_api.py:39-250](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/task_api.py#L39-L250) · [mineru/parser/task_api.py:262-319](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/task_api.py#L262-L319) · [mineru/parser/task_api.py:354-528](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/task_api.py#L354-L528) · [mineru/kit/router/tasks.py:1-144](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/kit/router/tasks.py#L1-L144) · [mineru/parser/api_server.py:696-715](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/api_server.py#L696-L715) · [mineru/parser/api_server.py:1101-1118](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/api_server.py#L1101-L1118) · [mineru/parser/api_server.py:1378-1387](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/api_server.py#L1378-L1387) · [mineru/parser/api_server.py:2815-2840](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/mineru/parser/api_server.py#L2815-L2840) · [tests/unittest/test_task_api.py:219-264](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/tests/unittest/test_task_api.py#L219-L264) · [tests/unittest/test_task_api.py:329-408](https://github.com/opendatalab/MinerU/blob/b7f3dd0c5f6e6d66a298239ffd02b328b873918e/tests/unittest/test_task_api.py#L329-L408).

**Harness consequence:** Use shared task identity, explicit partial states, source leases and cancellation-safe registration receipts. Separate waiter cancellation from job cancellation visibly, and define deployment-level tenant authorization rather than inferring it from the registered/anonymous flag. Add total request/result/archive expansion quotas, streaming bounded output and platform-independent path validation before adopting an import service.

**Scope and limits:** Static scoped review of the new task adapter and selected storage/auth/wait integration within the 108-path comparison, with task fixture bodies read. Full router proxy, underlying queue/resource registry, inference engine recovery, OCR changes and real HTTP/model/document execution were not audited or run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mineru](https://github.com/opendatalab/MinerU); analyzed commit `b7f3dd0c5f6e6d66a298239ffd02b328b873918e`; commit date 2026-10-11T10:21:25+08:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-query--mineru.md).
<!-- teamagent-analysis:end -->
