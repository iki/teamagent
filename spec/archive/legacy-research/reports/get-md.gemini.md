I will begin by reading the instructions in `./.prompt.md` and the content of `get-md.xml` to understand the task.
I have analyzed the initial part of the `get-md.xml` file, which includes the project's structure, documentation, and some configuration files. I will now read the next 2000 lines of the file to examine the source code and implementation details, which will help me address the remaining points of the analysis.
I have examined the CLI, model management, and LLM conversion logic, providing me with a clear understanding of the project's core architecture. To complete my analysis, I will now read the remaining lines of the `get-md.xml` file, focusing on the main library entry point, metadata extraction, HTML optimization, and URL fetching components.
This analysis is based on the repository export for `@nanocollective/get-md`, a high-performance HTML-to-Markdown converter.

### 1. Project Name and Description
**Project Name**: get-md (@nanocollective/get-md)

**Description**:
get-md is a high-performance Node.js library and CLI tool designed to convert HTML or URLs into clean, structured Markdown. It is specifically optimized for Large Language Model (LLM) consumption, ensuring that the resulting output is free from noise like advertisements, navigation bars, and social media widgets. By leveraging industry-standard tools like Turndown and Mozilla Readability, it achieves sub-100ms conversion speeds for standard tasks.

The project stands out by offering an optional, local AI-powered conversion mode. Using a specialized **ReaderLM-v2** model via `node-llama-cpp`, it can perform semantic conversion that preserves complex structures more accurately than traditional heuristic-based methods. This dual-engine approach allows users to choose between the lightning speed of Turndown and the high fidelity of LLM-based processing.

Built with transparency and community in mind by the **Nano Collective**, get-md is a versatile solution that prioritizes local execution and privacy. It fully supports React Native and various Node.js environments, making it an ideal choice for developers building AI agents, RAG systems, or content processing pipelines that need to ingest web data reliably without relying on external cloud APIs.

---

### 2. Supported Platforms/Deployments + Requirements
- **Node.js**: Versions 18 and above (verified in `package.json` and `docs/getting-started/installation.md`).
- **React Native**: Supported via `happy-dom-without-node` and `cheerio/slim` for cross-platform DOM parsing (`docs/guides/react-native.md`).
- **CLI**: Cross-platform (Windows, macOS, Linux) via the `getmd` command.
- **Hardware Requirements (LLM Mode)**:
    - ~1GB disk space for the GGUF model file.
    - 2-4GB RAM during inference (8GB+ system recommended).
- **Hardware Requirements (Standard Mode)**: Minimal; suitable for low-power environments and edge devices.

---

### 3. Supported Connectors
- **HTTP/HTTPS (URLs)**: Built-in `fetchUrl` utility for direct web content ingestion (`src/utils/url-fetcher.ts`).
- **Standard Input (stdin)**: CLI supports piping content from other terminal tools (`src/cli.ts`).
- **Local File System**: Direct file reading for HTML processing (`src/cli.ts`).

---

### 4. Supported Models/Agents
- **Standard Heuristic Engine**: Combination of **Turndown** for formatting and **Mozilla Readability** for content extraction (`src/parsers/markdown-parser.ts`).
- **AI Model**: **ReaderLM-v2** (GGUF format). Optimized for HTML-to-Markdown tasks (`src/converters/llm-manager.ts`).
- **Inference Engine**: **node-llama-cpp** for local GGUF execution, requiring no API keys or internet connection once the model is downloaded (`src/converters/llm-converter.ts`).

---

### 5. Top 5 Use Cases
1. **RAG (Retrieval-Augmented Generation)**: Ingesting web pages into vector databases for high-quality AI search results.
2. **AI Agent Perception**: Providing clean, noise-free Markdown to agents browsing the web to reduce token usage and improve comprehension.
3. **Documentation Migration**: Converting legacy HTML-based documentation into modern Markdown for static site generators.
4. **Web Content Archiving**: Saving articles and blog posts in a human-readable, future-proof format.
5. **SEO & Content Analysis**: Extracting structured metadata and clean body text from batches of URLs for marketing or research.

---

### 6. Top 20 Features
1. **Sub-100ms Conversion**: Lightning-fast heuristic processing (`README.md`).
2. **LLM Optimization**: Specialized formatting for AI consumption (`src/optimizers/llm-formatter.ts`).
3. **Readability Extraction**: Automated noise removal using Mozilla’s engine (`src/parsers/markdown-parser.ts`).
4. **Metadata Scraper**: Automatic extraction of title, author, date, and site name (`src/extractors/metadata-extractor.ts`).
5. **YAML Frontmatter**: Metadata inclusion at the top of the file (`src/parsers/markdown-parser.ts`).
6. **Local AI Conversion**: Semantic conversion via local ReaderLM-v2 (`src/converters/llm-converter.ts`).
7. **Model Lifecycle Management**: CLI commands to download, check, and remove models (`src/cli.ts`).
8. **Aggressive Cleanup**: Selective removal of ads, popups, and cookie notices (`src/optimizers/html-cleaner.ts`).
9. **Universal DOM support**: Uses `happy-dom-without-node` for React Native parity (`docs/guides/react-native.md`).
10. **Configuration Files**: Support for `.getmdrc` or `get-md.config.json` (`src/utils/config-loader.ts`).
11. **Comparison Mode**: Evaluate Turndown vs. LLM output side-by-side (`src/cli.ts`).
12. **Heading Repair**: Automated normalization of heading hierarchies (`src/optimizers/structure-enhancer.ts`).
13. **Content Filtering**: Toggle images, links, and tables via flags (`src/parsers/markdown-parser.ts`).
14. **Word Count & Reading Time**: Statistical analysis of the output (`src/parsers/markdown-parser.ts`).
15. **Code Block Normalization**: Extracts clean code from data attributes (e.g., GitHub snippets) (`src/parsers/markdown-parser.ts`).
16. **Base URL Resolution**: Fixes relative links and image paths (`src/optimizers/html-cleaner.ts`).
17. **GFM Support**: Full support for GitHub Flavored Markdown (`src/parsers/markdown-parser.ts`).
18. **Zero-Key Standard Mode**: Works out-of-the-box without any API keys (`src/index.ts`).
19. **Progressive Preprocessing**: Enhances HTML structure before AI inference (`src/optimizers/structure-enhancer.ts`).
20. **Redirect Handling**: Configurable behavior for web fetching (`src/utils/url-fetcher.ts`).

---

### 7. Top 20 Smart Patterns
1. **Fallback Logic**: Reverting to Turndown if LLM conversion fails (`src/parsers/markdown-parser.ts`).
2. **Unified Event Bus**: Single callback interface for all async operations (`src/types.ts`).
3. **Data-Attribute Priority**: Extracting "clean" code from hidden data attributes (`src/parsers/markdown-parser.ts`).
4. **Pseudo-Heading Conversion**: Turning styled `div` tags into semantic `h3` tags (`src/optimizers/structure-enhancer.ts`).
5. **Noise Score Filtering**: Element removal based on text length and keyword density (`src/optimizers/html-cleaner.ts`).
6. **Hierarchy Repair**: Adjusting heading levels to ensure a logical sequence (`src/optimizers/structure-enhancer.ts`).
7. **Isolated DOM Parsing**: Safe HTML processing in a non-browser environment (`src/parsers/markdown-parser.ts`).
8. **Config Precedence**: CLI > Config File > Defaults pattern (`src/utils/config-loader.ts`).
9. **Dual-Path API**: Sync path for speed, Async path for content extraction/LLM (`src/index.ts`).
10. **Attribute Stripping**: Reducing token count by removing unnecessary HTML attributes (`src/optimizers/html-cleaner.ts`).
11. **Link Flattening**: Converting reference-style links to inline for LLMs (`src/optimizers/llm-formatter.ts`).
12. **Code Block Spacing**: Ensuring distinct boundaries for code in the final output (`src/parsers/markdown-parser.ts`).
13. **Reading Time Heuristics**: Standardized 250 wpm calculation (`src/parsers/markdown-parser.ts`).
14. **Content Validation**: Pre-flight `hasContent` check to avoid processing empty pages (`src/utils/validators.ts`).
15. **Local-First Inference**: Privacy-centric design via `node-llama-cpp` (`src/converters/llm-converter.ts`).
16. **Custom GFM Rules**: Optimized Turndown rules for complex elements (`src/parsers/markdown-parser.ts`).
17. **Base URL Injection**: Propagating source URLs for relative path fixing (`src/index.ts`).
18. **Type-Safe Options**: Strict TypeScript interfaces for all configurations (`src/types.ts`).
19. **Async Post-processing**: Finalizing markdown after conversion for consistency (`src/parsers/markdown-parser.ts`).
20. **Mirror Management**: Automated switching between model sources (`src/converters/llm-manager.ts`).

---

### 8. Top 20 Development Trends
1. **Status Badge Automation**: Heavy use of GitHub Actions to update repo health badges (`git_logs`).
2. **AI Integration Transition**: Evolution from pure heuristic to AI-powered tool (v1.1.0).
3. **Tooling Modernization**: Switching to **Biome** for sub-second linting/formatting (`CHANGELOG.md`).
4. **Universal Reactivity**: Moving towards `happy-dom-without-node` for mobile support.
5. **Model Governance**: Adding comprehensive CLI model management (path, info, removal).
6. **Evaluative UX**: Providing a `compare` flag to help users validate AI quality.
7. **Documentation-as-Code**: Push for integrated documentation sites (`docs/`).
8. **Local-First Advocacy**: Promoting "AI done right" via local execution (`README.md`).
9. **Quantization Variety**: Support for multiple model sizes (Q2, Q4, Q8).
10. **Security Auditing**: Integration of Semgrep for automated security scans (`scripts/test.sh`).
11. **Token Efficiency**: Aggressively reducing HTML noise to save context window tokens.
12. **Semantic Versioning**: Precise release notes and changelog extraction scripts.
13. **GGUF Standardization**: Settling on GGUF as the primary local model format.
14. **Zero-Dependency Core**: Keeping the base library lightweight.
15. **Static Analysis**: Using **Knip** to eliminate unused code (`scripts/test.sh`).
16. **TypeScript Strictness**: 100% strict mode and type safety (`tsconfig.json`).
17. **Community Collective Model**: Non-profit, transparent development branding.
18. **CI-driven Releases**: Automated publishing to NPM for stable and beta tags.
19. **Enhanced Error Reporting**: Unified event-based error handling.
20. **Modular Optimization**: Separate modules for cleaning, enhancing, and formatting.

---

### 9. Top 10 Advantages
1. **Extreme Speed**: Fast heuristic mode for bulk processing.
2. **Local Privacy**: No data leaves the machine during AI conversion.
3. **Superior Cleaning**: Better at removing navigation/ads than standard converters.
4. **LLM Optimized**: Markdown is formatted specifically for AI consumption.
5. **Universal Portability**: Runs on Node, CLI, and React Native.
6. **Zero API Cost**: No monthly subscriptions for cloud LLM APIs.
7. **Rich Metadata**: Extensive extraction of SEO and article metadata.
8. **Community Driven**: Open, transparent, and built by a collective.
9. **Highly Testable**: Comprehensive test suite with high coverage.
10. **Fine-Grained Control**: Extensive options for filtering and formatting.

---

### 10. Top 10 Limitations
1. **LLM Latency**: AI mode is significantly slower than standard mode (5-10s).
2. **Hardware Load**: LLM mode requires significant RAM (2-4GB).
3. **Model Download**: Initial 1GB download may be slow for some users.
4. **No LLM in React Native**: Local inference restricted to Node.js environments.
5. **No OCR**: Cannot extract text from images or PDF embeds.
6. **Heuristic Edge Cases**: May struggle with extremely unconventional HTML layouts.
7. **Single-threaded Inference**: LLM conversion can block the event loop if not managed.
8. **Dependency on Node.js 18+**: Not compatible with legacy Node environments.
9. **No Dynamic Rendering**: Requires pre-rendered HTML; cannot execute client-side JS.
10. **Disk Footprint**: Storing multiple model variants consumes gigabytes of space.

---

### 11. Top AI Skills
- **Provided**:
    1. **Semantic HTML-to-MD Transformation**: Converting complex layouts into clean, hierarchical Markdown (`src/converters/llm-converter.ts`).
    2. **Context Window Optimization**: Aggressive content filtering to maximize token efficiency (`src/optimizers/html-cleaner.ts`).
    3. **Document Structure Recovery**: Rebuilding broken heading hierarchies for semantic clarity (`src/optimizers/structure-enhancer.ts`).
    4. **Local AI Management**: Automated orchestration of local GGUF models (`src/converters/llm-manager.ts`).
    5. **Metadata Synthesis**: Autonomous identification of page attributes from unstructured HTML (`src/extractors/metadata-extractor.ts`).

---

### 12. Data Inputs, Outputs, and Storage Overview
- **Inputs**: HTML strings, web URLs, local files, and stdin streams (`src/index.ts`, `src/cli.ts`).
- **Outputs**: Markdown strings, JSON metadata objects, and conversion statistics (`src/index.ts`).
- **Storage**:
    - **Models**: Local GGUF files stored in `~/.get-md/models/` (`src/converters/llm-manager.ts`).
    - **Configuration**: JSON config files (`.getmdrc`) in CWD or Home directory (`src/utils/config-loader.ts`).

---

### 13. Detailed Architecture Review
1. **Entry Point (`src/index.ts`)**: The high-level API orchestrating the entire lifecycle.
2. **Markdown Parser (`src/parsers/markdown-parser.ts`)**: The central engine that coordinates preprocessing, conversion, and post-processing.
3. **Metadata Extractor (`src/extractors/metadata-extractor.ts`)**: Uses Cheerio to scrape meta tags and structured data.
4. **HTML Cleaner (`src/optimizers/html-cleaner.ts`)**: Heuristic-based noise reduction module.
5. **Structure Enhancer (`src/optimizers/structure-enhancer.ts`)**: Normalizes HTML hierarchy before it hits the converter.
6. **LLM Converter (`src/converters/llm-converter.ts`)**: Bridge to `node-llama-cpp` for AI-powered processing.
7. **LLM Manager (`src/converters/llm-manager.ts`)**: Handles local model availability and downloads.
8. **URL Fetcher (`src/utils/url-fetcher.ts`)**: Wrapper for network requests with timeout and redirect logic.
9. **Config Loader (`src/utils/config-loader.ts`)**: Merges defaults, file-based configs, and runtime options.
10. **LLM Formatter (`src/optimizers/llm-formatter.ts`)**: Final post-processing pass to "sharpen" markdown for AI ingestion.

---

### 14. Architecture Graph
```mermaid
graph TD
    CLI[CLI: getmd] -->|HTML/URL| MP[MarkdownParser]
    SDK[SDK: convertToMarkdown] -->|HTML/URL| MP
    MP --> ME[MetadataExtractor]
    MP --> PH[Preprocessing: Cleaner & Enhancer]
    PH --> DM[Decision: LLM vs Heuristic]
    DM -->|Heuristic| TS[Turndown + GFM]
    DM -->|LLM| LC[LLMConverter]
    LC --> LLC[node-llama-cpp]
    LLC --> Model[(ReaderLM-v2 GGUF)]
    MP --> POST[Post-processing: LLM Formatter]
    POST --> RES[MarkdownResult: MD + Meta + Stats]
    LM[LLMManager] -->|Download/Check| Model
    MP -.-> LM
```

---

### 15. Maturity, Stability, Security, Performance Review
- **Maturity**: **Moderate-High**. Transition to v1.2.0 shows a stable API and refined feature set.
- **Stability**: **High**. Extensive automated tests (`src/**/*.spec.ts`) and manual checklists (`MANUAL_TESTING.md`) ensure reliability.
- **Security**: **Strong**. Focus on local execution avoids data egress. Regular security audits and Semgrep scans protect the supply chain.
- **Performance**: **Excellent**. Sub-100ms speeds for standard mode and optimized inference for LLM mode.

---

### 16. Tests, CI, Documentation, AI Skills Review
- **Tests**: 100% TypeScript coverage with AVA; clear separation of unit and integration (LLM) tests.
- **CI**: Automated GitHub Actions for releases, linting, and badge updates.
- **Documentation**: Professional-grade docs site and comprehensive in-repo guides.
- **AI Skills**: Excellent provision of data-preprocessing skills for the AI ecosystem.

---

### 17. Top 20 Possible Improvements or Fixes
1. **Playwright Integration**: Support for JS-rendered pages in `src/utils/url-fetcher.ts`.
2. **Parallel Processing**: Batch URL conversion in `src/cli.ts`.
3. **Incremental Downloads**: Resumable model downloads in `src/converters/llm-manager.ts`.
4. **Model Plugin System**: Allow users to swap `ReaderLM-v2` for other GGUF models.
5. **Web Playground**: A browser-based UI for testing.
6. **Cloudflare Worker Port**: Port heuristic mode to the edge.
7. **Local Cache**: Cache fetched URLs in `~/.get-md/cache`.
8. **Proxy Support**: For fetching restricted content.
9. **OCR Engine**: Optional integration for image-to-text.
10. **Export to JSONL**: Direct export for LLM fine-tuning datasets.
11. **Streaming Support**: Stream markdown output as it’s generated by LLM.
12. **Custom CSS Selectors**: For targeted content extraction in `src/optimizers/html-cleaner.ts`.
13. **Language Detection**: Automatic lang detection for non-tagged HTML.
14. **Markdown-to-HTML**: Reverse conversion for full round-trip support.
15. **Telemetry (Optional)**: Anonymous usage stats for community feedback.
16. **GUI Desktop App**: For non-technical users.
17. **Refined Table Extraction**: Better handling of deeply nested or spanned tables.
18. **Equation Support**: MathJax/LaTeX to Markdown conversion.
19. **Content Diffing**: Compare changes between versions of the same URL.
20. **Self-Correction**: Agents verifying their own MD output for broken links.

---

### 18. Reuse for Agent Swarm (Debate & Plan)
1. **`LLMConverter`**: Reusable for running debate models locally.
2. **`MetadataExtractor`**: Helping agents identify source reliability.
3. **`HTMLCleaner`**: Stripping noise before agents "read" evidence.
4. **`StructureEnhancer`**: Standardizing agent input structure.
5. **`LLMManager`**: Orchestrating different models for different swarm roles.
6. **`ConfigLoader`**: Managing swarm-wide configuration.
7. **`MarkdownParser`**: Canonical communication format between agents.
8. **`LLMFormatter`**: Optimizing inter-agent prompts.
9. **`UrlFetcher`**: Research module for fact-checking agents.
10. **`LLMEventCallback`**: Pattern for swarm status monitoring.

---

### 19. Reuse for Shared Knowledge Base (Multi-User)
1. **YAML Frontmatter Logic**: Handling graph node metadata consistently.
2. **`extractMetadata`**: Autonomous tagging for a shared graph.
3. **`hasContent`**: Filtering low-quality entries in a multi-user system.
4. **`cleanHTML`**: Sanitizing shared knowledge before storage.
5. **`calculateMarkdownStats`**: Tracking system growth and density.
6. **`postProcess` Formatting**: Ensuring all user contributions follow one style.
7. **`LLMManager`**: Managing the knowledge retrieval model.
8. **`.getmdrc` Pattern**: Per-user local preference management.
9. **Unified Types**: Shared data structures for graph nodes.
10. **AVA Test Pattern**: Validating the integrity of the shared graph.

---

### 20. Reuse for Own Hardware / Messenger / Voice
1. **`node-llama-cpp` Core**: The engine for local voice/messenger agents.
2. **GGUF Support**: Compact model distribution for home servers.
3. **`handleDownloadModel`**: UI pattern for remote deployment of agents.
4. **`formatBytes` / `cli-progress`**: Patterns for status updates over low-bandwidth messengers.
5. **`MarkdownResult`**: Ideal format for text-to-speech engine input.
6. **`LLMEvent`**: Real-time feedback for long-running home automation tasks.
7. **`aggressiveCleanup`**: Reducing data overhead for mobile messenger delivery.
8. **`isLoaded` / `unload`**: Pattern for managing memory on home hardware.
9. **`baseUrl` resolution**: Ensuring links sent to messengers are clickable and correct.
10. **`setupLLMRules`**: Custom rules for messenger-optimized formatting.

---

### 21. Reuse for Team Agents (Cooperative Workflows)
1. **`LLMConverter.convert`**: The fundamental "Task Executor" unit.
2. **`LLMEventCallback`**: The mechanism for human-agent synchronization.
3. **`MarkdownParser.convertAsync`**: Foundation for asynchronous handoffs.
4. **`mergeConfigWithOptions`**: Pattern for merging human directives with agent logic.
5. **`extractMetadata`**: Agents identifying human intent from document headings.
6. **`LLMFallbackStartEvent`**: Agents signaling for human intervention.
7. **`finalizeConversion`**: A pattern for agent output validation/QA.
8. **`GFM rules`**: Enforcing shared documentation standards across a team.
9. **`normalizeOptions`**: Standardizing team-wide agent behaviors.
10. **`promptYesNo`**: Simple CLI pattern for human-in-the-loop approvals.
