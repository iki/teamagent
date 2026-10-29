<!-- conversation: e7ebce01df43465da93fae4344dff29864fef803e76be52438a454d9d1fc9ed3 -->

Date: 2026-10-04T22:49:30.550Z
Session: 01a1057a-5094-7063-9553-be5107e5adc2
Turn: 01a10857-3f0b-7e92-b6d0-b6de9a27bd99
Agent: codex
Model: gpt-6-astra
Reasoning level: ultra

Public transcript only. Recognized credentials and requested literal redactions are replaced with [redacted] markers.

## Prompt

- add import system support for external document extractors
  - xberg (best quality, fast, very active development), marker (best quality, slow), mineru, docling, openpdfloader
  - allow configuration of different sets of cli options for each
  - add benchmark for extractors (use different sets of options) and measure quality (% of important information extracted) and speed
    - document the benchmark + results
    - add results as comments to recommended extractors and sets of their options in the extractors config file


## Response

Added Xberg, Marker, MinerU, Docling and OpenDataLoader PDF across CLI, MCP, library API and agent bindings.

- [Configuration](../../extractors.config.ts): 12 profiles with measured recommendations.
- [Benchmark results](../benchmarks/extractors-results.md): 144 attempts, 142 successes, two Marker timeouts. On this corpus, Xberg was fastest for digital PDFs; Marker had the highest scan-anchor recall.

Passed: **163 tests**, architecture/type/lint checks, desktop acceptance, release build and packaged OCR import/sync.

On this Windows setup, use **Ctrl+Break** to gracefully cancel Aube-launched commands.

## Processing Log

I’ll add configurable extractor profiles, check which tools are available here, and benchmark option sets against the existing PDF evidence. I’ll record measured quality and speed in the report and beside the recommended profiles.

I’m using the installed Aube, C12, Effect and memory skills for this extension. Each extractor will have named option profiles, and benchmark results will distinguish the tool version and settings used.

All five extractors are already installed, and this machine has an RTX 5090 Laptop GPU. I also confirmed that “openpdfloader” refers to OpenDataLoader PDF. I’m checking the installed CLI flags now so the profiles match these versions.

The existing PDFs test layout fidelity, but the built-in parser already recovers all 113 annotated facts from them. I’m adding a separate scanned-document set with English, Czech and table values so the benchmark can also measure OCR quality. The agent skill will include how to select and inspect extractor profiles.

The import adapter and CLI/MCP selection are implemented and tested. The benchmark now covers 141 annotated facts across the reference PDFs and a separate scanned-document set. I’m checking model setup and output formats before starting the timed comparisons.

The first full check found a Git-import test failure while model preparation was running. I’m investigating it before timing the extractors. Review also caught a configuration gap: explicitly selected image and EPUB converters need to run before the built-in format handlers; I’m fixing that dispatch path.

All five tools now have working local models, and the first xberg OCR smoke test converted the two-page scan in about three seconds. Marker exposed a Windows cleanup issue that can interrupt its parent process; I’m isolating extractor processes before the benchmark so one tool cannot stop the whole run.

The Windows desktop checks passed, including the real WebView2 workflow. Extractor launches now use isolated process groups, and the installed memory skill has been updated with profile-selection guidance. I’m finishing the final smoke check and repository gate before collecting results.

The repository gate now passes all 140 tests. I’m starting the timed comparison with the built-in converter, xberg and OpenDataLoader. Marker’s helper processes stay alive by default, so it needs a small Windows launcher that closes those helpers after each run; its measurements will follow once that is verified.

The first 60 conversions completed successfully. On the five reference PDFs, the built-in converter recovered all 113 annotated facts; xberg recovered 106 and ran much faster. Xberg’s OCR profile recovered 17 of 28 facts from the scan. I’m checking the missed evidence before recommending settings, including whether Markdown formatting affected any scores.

The reference-document audit found that xberg retained all seven “missing” facts: the matcher had rejected escaped Markdown punctuation and harmless equation spacing. I’m fixing those scoring cases and will rerun the comparison, preserving the original results. The missing Czech scan text is a real extraction loss, so that score will remain a separate finding.

Marker’s launcher now closes its persistent helpers after each invocation; tests cover success, failure and cancellation. Its fast profile passed the real import path. I’m checking the balanced profile after a fix for Windows releasing file handles late, then the full comparison can run without shared model processes affecting the timings.

A third xberg option set preserves the Czech text that its default OCR path discarded. I’ve added it to the comparison, bringing the matrix to 12 profiles. The report will distinguish measured anchor recovery from manually checked formatting differences, so a missing period is not presented as a missing fact.

All 144 tests now pass, and every extractor has passed a real import smoke test. I’m starting the full matrix: 12 option sets, six PDFs, and two fresh conversions per document—144 measured runs. The settings and scoring rules are now frozen for this comparison.

The fresh run confirms that all three xberg profiles recover 113/113 reference anchors. Switching OCR output to text improved the scan from 17/28 to 24/28 anchors, with both conversions taking about 1.2 seconds. The longer MinerU, Docling and Marker runs are next.

The six fast profiles have completed both passes, with identical output on repeat runs. OpenDataLoader’s only missed reference anchor is retained as “15pp” instead of “15 pp”; the audit records that formatting difference. MinerU is now processing the reference documents.

MinerU’s text-only profile recovered 111/113 reference anchors. Its two misses involve a split word and a table label separated from its value. Its OCR-enabled profile is still running. I’m also checking image handling: some tools embed images inside Markdown, while others return separate files.

The comparison has completed 93 of 144 runs without conversion failures. MinerU’s OCR profile is slower, and some of its math output uses LaTeX or spaced digits that the strict scorer does not treat as equivalent. Those cases will be explained alongside the quality table.

MinerU’s OCR profile recovered 27/28 scan anchors in about 18 seconds; the remaining mismatch is a Czech character. That gives us a measured speed/quality trade-off against xberg’s 24/28 in about 1.2 seconds. Docling’s two configurations are now running.

Docling’s text profile converted the 33-page design document in about 56 seconds, with a similar repeat time. Its results will include the same startup and validation costs as the faster tools. I’m keeping the source files and settings fixed through the remaining runs.

The real Docling output exposed an image-link bug: images were retained, but its Markdown still pointed to temporary files that had been deleted. I’m preserving the completed measurements and stopping this pass to fix the links. The final comparison will run against the corrected adapter.

The interrupted pass retained 102 completed measurements. The frozen quality checks stay unchanged; the rerun will measure the repaired adapter, including image links that remain usable after temporary files are removed.



The scan results already show why option sets matter: Xberg’s text OCR mode retained substantially more Czech content than its default OCR mode. MinerU’s basic mode recovered still more on this fixture, at a higher runtime. I’m keeping both the scores and the missing-text audit so formatting differences aren’t presented as lost facts.



The fix now matches image references only to validated extractor output files. It also gives images beside a nested Markdown file precedence over identically named files elsewhere. Regression tests and a real Docling conversion will verify both cases before the full rerun.



The new regression tests pass, including encoded file URLs, duplicate image names and references outside the output folder. I’m checking the fix against Docling itself, then running the repository checks before restarting the comparison.



The real Docling check passed: its image link resolves to the saved asset after cleanup, with no temporary paths or unresolved-image warnings. The full verification gate is running now. The next pass covers all 12 option profiles, six PDFs and two fresh conversions per case.



All 148 tests passed, along with type and lint checks. The corrected benchmark is running sequentially now. I’ll use its results for the configuration recommendations and preserve the earlier measurements separately.



The six faster profiles have completed all 72 conversions successfully. Their results match the earlier quality findings: Xberg retained all annotated digital-PDF information; its text OCR option recovered 24 of 28 scan anchors. MinerU, Docling and Marker are next.



The report will show digital-text recovery and OCR recovery separately, alongside successful-run counts and conversion time. It will also flag formatting misses—for example, OpenDataLoader preserved “15pp” where the frozen quotation says “15 pp.”



MinerU’s text-only profile has finished successfully. Its scan output contains page images but no searchable OCR text, so the report records zero text recovery while distinguishing those embedded images from separately saved image files.



MinerU’s OCR-enabled profile is processing the larger PDFs now. Each measurement includes startup, model loading, conversion and cleanup; downloads are excluded. The final timings will therefore describe fresh CLI invocations, not a persistent inference service.



The report now documents the corpus, scoring limits, hardware and reproduction command. It also preserves why the earlier run was stopped, so the final recommendations won’t mix measurements from different adapter versions.



The longer MinerU runs remain successful. The Czech reference PDF also completed in both invocations. I’m retaining per-document timings so large research PDFs and the small scan don’t collapse into a misleading single speed figure.



The importer now exposes the same profile selection through the CLI, library API and MCP installation bindings. The compiled-app check after this benchmark will verify that the recommended profile also works from the packaged executable.



The option comparison is a calibration benchmark, not a held-out accuracy test: the extra Xberg text-OCR profile was added after inspecting the scan’s losses. I’m making that explicit in the report so its recommendation stays tied to the evidence.



MinerU basic recovered 27 of 28 scan anchors in about 18 seconds. Its remaining miss is a Czech character substitution. Docling has begun the corrected run; its first full reference PDF converted successfully.



Docling’s first repeated pair confirms the repair on a full PDF: both outputs have identical Markdown and image hashes, valid saved-image links and no warnings. Text recovery is unchanged.



The current results support separate choices for fast digital-text extraction and OCR. I’m waiting for Docling’s OCR and Marker’s two modes before selecting the scan-quality recommendation.



Docling’s first two repeated PDFs are complete. The audit is checking exact quotation misses as well as output stability, so preserved values split across table cells won’t be described simply as missing information.



The corrected run has reached 104 completed conversions without errors. Docling’s remaining digital documents and scan are next, followed by its OCR mode and both Marker modes.



The completed Docling pairs remain stable. I’m also preparing the final packaged-CLI check: import the scan with the recommended profile, read the saved OCR text and images, then confirm an unchanged sync preserves the version.



Docling’s fast mode recovered 111 of 113 digital-PDF anchors. Both misses are word-spacing artifacts; the database and financial anchors were all recovered. Its completed repeated outputs are stable and have no image warnings.



Docling’s text-only mode has also converted the scan successfully. Its OCR-enabled mode is next. Empty searchable text from a text-only setting remains a valid zero-recovery result, distinct from a failed conversion.



Nine of the 12 profiles are complete, including all 108 requested conversions for those profiles. Docling OCR and the two Marker profiles remain; final checks and recommendation comments will follow their results.



Each profile’s command, options and declared version contribute to import provenance. Changing the selected option set can create a new source version, and a failed conversion preserves the previous successful version. Those behaviors are covered by the passing tests.



Docling OCR’s first pair is stable, with valid image links and the same single table-spacing miss as its fast mode. It took about 81–82 seconds per invocation on that PDF; the scan result will show what the OCR cost adds.



Docling OCR is still processing the research PDF. The benchmark is running without parallel tests or builds; each completed measurement is saved immediately, including any timeout or failure.



Docling OCR completed the 30-page research PDF in about 113 seconds. The slower model-based profiles are the remaining part of the run; their recorded outputs will determine whether the extra time improves recovery.



Docling OCR’s research-PDF repetition also completed successfully. The report will retain both timings and compare their output hashes and recovered anchors, rather than treating a successful exit alone as equivalent output.



Docling OCR’s first three document pairs are byte-stable, with no stale image links or new information losses identified by the audit. I’ve also started an independent read-only review of the API, CLI, MCP and configuration wiring while the remaining conversions run.



Docling OCR recovered all annotated database-transaction evidence in both runs. The independent integration review has found no issue so far with explicit configuration, MCP profile binding or failure handling.



The review found two integration gaps: interrupting a normal CLI import could leave its extractor running, and mixed-format imports recorded the selected profile without fully identifying builtin conversion. I’ll fix and regression-test both after the timed pass finishes; neither affects the current direct-conversion measurements.



The two follow-up fixes are scoped: CLI interruption will wait for extractor cleanup, and provenance will record the actual parsers used while preserving old stored versions. Their regression tests are planned; the timed converter code remains unchanged.



Docling OCR recovered 27 of 28 scan anchors in about 42.5 seconds—the same score as MinerU basic, with the same Czech-name spelling mismatch. All annotated table, numeric, policy and filename content survived. Only the two Marker profiles remain.



Marker’s fast mode completed its first repeated PDF in about 38 seconds per invocation. The benchmark is now in its final 24 conversions; the remaining scan results will complete the quality-versus-time comparison.



The Marker audit found additional formatting misses: two mathematical statements survived but use italicized symbols, and one table word is fragmented. The report will keep the frozen scores and explain those cases without changing the matcher again.



Marker fast mode has completed both Czech-PDF runs successfully. The provenance fix will also account for parser upgrades during sync, so an unchanged source cannot hide a changed builtin fallback converter.



Marker fast mode has reached the final digital PDF without errors. The planned sync regression will also reject an “unchanged” result if it alters recorded extraction provenance, while still allowing freshness timestamps to update.



Marker fast mode finished with 110 of 113 digital anchors and no OCR text on the scan, as configured. Its repeated outputs were identical. Marker balanced is the final profile now running.



The final profile is still running. I’m taking a limited read-only GPU observation to clarify whether Marker’s configured Vulkan backend actually uses the NVIDIA device; configuration alone isn’t enough to claim acceleration.



The GPU snapshot found the benchmark-owned Marker inference process on the RTX 5090, with its process ancestry verified. It confirms GPU association; per-process memory and the exact layer-offload count remain unmeasured. I’m recording that distinction in the report.



Marker balanced is taking several minutes on the 33-page document. The configured 20-minute limit per document remains in place. I’m keeping this slower mode in the comparison because its quality result is part of the requested benchmark.



The first balanced-mode conversion is still running. The other 11 profiles are complete and preserved. Their results already establish the faster alternatives; Marker’s remaining measurements will show whether its additional cost improves this corpus’s recovery.



The completed measurements show a clear speed gap on these PDFs: Xberg native processed all five digital documents in 1.81 seconds; the tested model-based profiles took roughly 64–394 seconds. Those totals include startup and cleanup and apply only to this host and corpus.



Marker balanced’s first document completed in 455 seconds, recovering 21 of 22 anchors—the same anchor count as its fast mode on that PDF. The audit will check the remaining miss, and the fresh repetition is now running.



The balanced-mode audit found a structural improvement on the first PDF: it repaired a split table row and removed a stray control character. The remaining internal hyphen still misses the exact quotation, so the report will describe the improvement alongside the unchanged score.



The report also separates retained image assets from searchable text. A profile can save page images yet recover no OCR text, or recover the annotated text without exporting separate images; those are different capabilities.



The balanced-mode repetition is still within its configured limit. I’m preserving the full run rather than substituting a shorter document, so the final comparison uses the same source bytes for every option set.



Marker balanced’s first pair is complete and byte-identical, including its repaired table structure and remaining hyphenated word. That improvement was reproducible across the two invocations.



The final profile is now processing the research PDF. The results tables are prepared for the saved measurements, including separate quality, document timings, image counts and repeat stability.



The research-PDF conversion is still running within the limit. No extractor failures have been reported in the corrected pass. The remaining implementation work is limited to the two reviewed integration fixes and final verification.



The reported times cover document conversion through the import adapter. They exclude memory indexing and database publication, which are separate costs. I’m making that boundary explicit in the results.



The matrix covers 106 source pages per profile and two invocations per document: 144 conversions in total. Marker balanced is the only unfinished profile; all completed measurements remain available individually.



The remaining conversion is computationally slow, with no failure reported. I’m keeping the run intact and will attach the measured quality and time to each recommended option set once it completes.



The saved results and configuration will identify the exact tested versions, options and hardware. I’ll recommend profiles for the observed use cases—digital text, faster OCR and higher scan recall—without presenting one corpus as a universal ranking.



There are 134 completed conversions, all successful so far. Marker balanced is still working on the research PDF. I’m also extending the interruption review to the benchmark command itself, since it launches the same detached extractor processes.



The interruption review uncovered one subtlety in the installed Effect version: cancelling an asynchronous effect signals its work but does not automatically wait for cleanup. The fix will explicitly wait for process termination and temporary-file removal before returning.



The benchmark is still active on Marker’s research-PDF conversion. Completed results are unchanged. After the last measurements, the lifecycle and provenance fixes can proceed in parallel, followed by the full checks and packaged-app verification.



Marker balanced hit the 20-minute limit on the research PDF. That run has no quality score or output credited, and no fallback was used. The benchmark is continuing with the planned repetition and remaining documents; the report will show the incomplete coverage explicitly.



The benchmark has completed 135 conversions so far; one Marker run reached the 20-minute limit. I’ve preserved the exact code used for the measurements and am preparing the reliability fixes while the remaining conversions run. Testing will wait until the timing measurements finish.


The completed profiles show a clear tradeoff: Xberg recovered all annotated digital-PDF information fastest, while MinerU’s basic OCR recovered more of the scanned-page anchors. I’m recording those results separately so the recommendations distinguish digital documents from scans.


The result comments now identify the measured strengths and limits beside each option profile. The report also distinguishes missing information from equivalent formatting—some mathematical and table entries preserve the facts but fail the strict quotation match.


The cleanup fix is ready for testing. It keeps an interrupted command alive until its extractor processes and temporary files are cleaned up, and makes an interrupted benchmark stop without inventing a result for the unfinished conversion.


The provenance fix is also ready: a mixed folder will record which converters actually handled its files, including builtin conversion for formats outside an external profile’s scope. Tests are prepared to check that older stored versions remain readable.


Marker’s second attempt on the long research PDF is still running near its time limit. Both outcomes will remain in the report; a timed-out conversion counts as incomplete coverage and gets no extraction-quality score.


The remaining work is the final Marker cases and verification of the assembled changes. The compatibility and interruption tests are prepared; I’m keeping test and build activity out of the timed benchmark runs.


Marker completed the Czech document in about 144 seconds and is repeating it now. Both attempts on the 30-page research paper timed out. The report will show those failures alongside quality on the documents it completes.


Marker recovered all 19 annotated anchors in the Czech PDF. Its repeat is still running; the next cases cover database transactions, financial tables and image-only scans.


The Czech repeat produced identical Markdown and the same quality score. Marker is now processing the database paper. The recommendation remains corpus-specific: the current results don’t establish a universal best extractor.


An independent check confirmed that the configuration comments match the completed measurements, including percentages, times and run counts. Marker’s database-paper conversion is still running; no tests or builds are competing with it.


The report will distinguish completed-corpus latency from time spent on failed attempts. Marker’s timeouts therefore won’t appear as successful conversion times or disappear from its coverage totals.


Marker completed the database paper in about 333 seconds and has started its repeat. The remaining cases will show whether its additional processing recovers more of the financial-table and scanned-page evidence.


The audit found a limitation worth preserving: Marker recovered every annotated database-paper anchor, but split an unannotated API name across table cells. I’ve added that example to explain why 100% anchor recall does not certify complete extraction fidelity.


The database-paper repeat finished in about 265 seconds, versus 333 seconds initially. Both timings will remain visible. Marker has moved on to the financial tables; the scan is the final document after that.


The database repeat produced different Markdown, although its anchor scores and all image hashes matched the first run. I’m inspecting the text differences and will report output stability separately from the quality score.


Marker completed the financial document in about 217 seconds and recovered all 26 annotated anchors. Three conversions remain: its financial repeat and two scan runs. The database-output differences include changed citation text, so I’ve documented them as more than formatting variation.


The financial repeat is still running. The report and configuration comments are prepared; once the scan pair finishes, I’ll finalize the totals and run the full checks, desktop build and packaged CLI smoke test.


Marker recovered all 28 annotated scan anchors in about 124 seconds—the highest scan recall in this comparison. MinerU and Docling recovered 27/28, and Xberg’s text-OCR profile recovered 24/28 much faster. Only Marker’s scan repeat remains.


The benchmark is complete: 144 attempts, with 142 successful conversions and two Marker timeouts. I’m now finalizing the result tables and running the prepared reliability tests, full repository checks and desktop verification.


The focused tests passed, including real Windows interruption cleanup, mixed-format provenance and CLI/MCP behavior. The full gate caught a TypeScript narrowing issue in the benchmark’s interruption wrapper; I’m fixing that before rerunning the checks.


The architecture checks caught a shared cleanup helper placed in the wrong layer. I’m moving it into the import adapter while keeping the boundary rule intact. The recommended profile options and archived benchmark hashes have also been verified against the measured run.


The full run exposed a Windows interruption problem that wasn’t present in the focused run: the Ctrl+C cases stalled while Ctrl+Break passed. I’m checking the launch environment and cleanup path before continuing. The other 161 tests passed.


The failure came from an inherited Windows setting that made the test’s new console ignore Ctrl+C. Resetting that setting in the test setup restored all eight interruption tests under Aube. I’m rerunning the full gate and separately checking interruption through the actual Aube CLI launch path.


All 163 tests now pass, along with strict type, lint and architecture checks. The actual launcher check found one Windows caveat: Aube suppresses Ctrl+C here, while Ctrl+Break cancels and cleans up correctly. I’m documenting that and verifying the desktop build next.


The desktop tests and actual WebView2 workflow passed, and the release build is complete. I’m now checking the packaged CLI by importing the scanned fixture, reading its OCR text and images, and syncing it again to verify that an unchanged source keeps its version.


The final review gate and packaged OCR smoke test passed. The report now includes all measurements, recommendations, timeout accounting and the audit of information omitted or changed outside the scored anchors. I’m saving the final verification record and conversation log.

