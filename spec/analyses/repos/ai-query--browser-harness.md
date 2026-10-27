# browser-harness: change evidence

Source: [browser-harness](https://github.com/browser-use/browser-harness) · [Analysis](../../projects/ai-query--browser-harness.md) · [memory](../../memory.md), [import-generation](../../import-generation.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `afbcc381b963040c19627d788e40c7e7663171ee`; commit date: 2026-09-07T13:13:31-07:00; review date: unknown; observed SHA: `4ced8e0087d2d45ea2d08c00cb62449b2d94a90e`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/browser-use/browser-harness/compare/afbcc381b963040c19627d788e40c7e7663171ee...4ced8e0087d2d45ea2d08c00cb62449b2d94a90e). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits (truncated)

- [4ced8e0087d2](https://github.com/browser-use/browser-harness/commit/4ced8e0087d2d45ea2d08c00cb62449b2d94a90e) 2026-10-24T20:12:38-07:00: Merge pull request #946 from browser-use/skills/ulta-2xx
- [1cc5536b70be](https://github.com/browser-use/browser-harness/commit/1cc5536b70befffebd7d8b1ce236a6e7c7b37324) 2026-10-24T20:11:18-07:00: Domain skills (Ulta): only 2xx is success; 3xx such as 304 raises instead of returning an empty body
- [1b0b05c86dee](https://github.com/browser-use/browser-harness/commit/1b0b05c86dee91e1c6774277ea813450e2ca6202) 2026-10-24T20:05:54-07:00: Merge pull request #945 from browser-use/skills/review-fixes-628
- [1e21fb0a7adc](https://github.com/browser-use/browser-harness/commit/1e21fb0a7adc52ac08d12337a64372fc6c5f71f7) 2026-10-24T20:01:56-07:00: Domain skills: Agoda sold-out detection scoped to the room grid, Dice count_matched only without a page-mismatch reason, Poshmark masks 1-prefixed US numbers
- [51e246ad98b6](https://github.com/browser-use/browser-harness/commit/51e246ad98b6329f2fd06de6f6db17b2c44de61c) 2026-10-24T19:48:56-07:00: Domain skills: review fixes from website#628 (Ulta request deadline, Dice no false 'complete', Poshmark intl phone mask + path guard, Agoda sold-out hotels)
- [7b04aec92730](https://github.com/browser-use/browser-harness/commit/7b04aec92730107ebe525f69fc5b6604571b1504) 2026-10-24T19:29:01-07:00: Merge pull request #944 from browser-use/skills/field-tested-batch-3
- [8b6996b5cb3e](https://github.com/browser-use/browser-harness/commit/8b6996b5cb3ec76adeb0b295aabe5136995ffa5d) 2026-10-24T19:23:43-07:00: Domain skills: second review round (challenge bodies, same-id redirects, chunked deadline reads, completeness checks, ID-only Poshmark URLs)
- [783423c458a6](https://github.com/browser-use/browser-harness/commit/783423c458a653ec80b214000bd78c22256ff386) 2026-10-24T19:02:54-07:00: Domain skills: review fixes (explicit partial status at caps, challenge detection, field validation, one 120 s retry deadline, no query splitting past site caps)
- [4efa65cfdc5e](https://github.com/browser-use/browser-harness/commit/4efa65cfdc5ede9973c5d0bb380f080e9c1cd35d) 2026-10-24T18:38:48-07:00: Domain skills: 8 field-tested sites (Sephora, Ulta, Agoda, Dice, Poshmark, BBB, Twitch, Trulia)
- [6d1c39adbcba](https://github.com/browser-use/browser-harness/commit/6d1c39adbcba5599a35182a19bcfbb0859e50abb) 2026-10-23T16:20:44-07:00: Merge pull request #940 from browser-use/skills/rt-pacing-prose
- [e258d054dcb3](https://github.com/browser-use/browser-harness/commit/e258d054dcb3c6e46c1c4757f1fac24b7c3e7877) 2026-10-23T16:19:03-07:00: Domain skills (Rotten Tomatoes): pacing note matches the code (403 and exhausted 429 stop the run)
- [683a3b9c1f82](https://github.com/browser-use/browser-harness/commit/683a3b9c1f82648ae110626f3219dc659d2dacc8) 2026-10-23T16:13:55-07:00: Merge pull request #939 from browser-use/skills/review-fixes-614
- [ef6dde610a7c](https://github.com/browser-use/browser-harness/commit/ef6dde610a7c8c6d33563295ee725a1375979c95) 2026-10-23T16:12:30-07:00: Domain skills (Google Play): ignore empty or fragment JSON-LD urls, resolve against the origin
- [bb4f593d746b](https://github.com/browser-use/browser-harness/commit/bb4f593d746b3f85919764d079e1361c03868f29) 2026-10-23T16:07:53-07:00: Domain skills: review fixes (Shopify 400 handling, Rotten Tomatoes pacing, Google Play id matching)
- [0c8557a068e6](https://github.com/browser-use/browser-harness/commit/0c8557a068e629e2ee0a5f7bfced62cd6d623dc6) 2026-10-23T15:55:15-07:00: Merge pull request #937 from browser-use/skills/field-tested-batch-1
- [559a8d58e846](https://github.com/browser-use/browser-harness/commit/559a8d58e846407c176b9b721f371928679c807c) 2026-10-23T15:53:34-07:00: Domain skills (Target): back-off message only for a 435, plain error for other fulfillment statuses
- [26395b2ee6d2](https://github.com/browser-use/browser-harness/commit/26395b2ee6d29ee20834b5283338df6d030e7041) 2026-10-23T15:50:03-07:00: Domain skills: reject half-loaded Best Buy cards, safe Target tab cleanup, back-off message on fulfillment blocks
- [c74711b9ccb5](https://github.com/browser-use/browser-harness/commit/c74711b9ccb5c98d50bb5a4694af935b499a148b) 2026-10-23T14:59:35-07:00: Domain skills: confirm navigation before reading, one 120 s retry deadline, never report partial crawls as complete (Best Buy, Redfin, Target)
- [e7830b44900a](https://github.com/browser-use/browser-harness/commit/e7830b44900a713f991f4d0f3018724e99bef28e) 2026-10-23T14:27:06-07:00: Domain skills: no-evasion policy, robots.txt-allowed paths only, last review fixes
- [ea0d03e3cb08](https://github.com/browser-use/browser-harness/commit/ea0d03e3cb0830fdfb7fa3b9ddb10f1d86f2f675) 2026-10-23T13:34:32-07:00: Merge pull request #938 from browser-use/skills/field-tested-batch-2
- [553051c4a125](https://github.com/browser-use/browser-harness/commit/553051c4a125bab1401059d2f7e8fa4a7681d388) 2026-10-23T13:32:20-07:00: Domain skills (Rotten Tomatoes): stop the enrichment loop on a 403 or exhausted 429
- [e02752c40a53](https://github.com/browser-use/browser-harness/commit/e02752c40a5342ef695410f2ae2e6651564b0ec3) 2026-10-23T13:27:34-07:00: Domain skills: align retry prose with code, mark partial Upwork runs, cite Apple's Search API docs
- [12e6c6ddf770](https://github.com/browser-use/browser-harness/commit/12e6c6ddf770a5ea37629d05e220795c526fcc61) 2026-10-23T13:14:27-07:00: Domain skills: review fixes, no-evasion policy, robots.txt-allowed paths only
- [ca3ed91d3f28](https://github.com/browser-use/browser-harness/commit/ca3ed91d3f28ee9d3dedde40120b3d34a59405ab) 2026-10-23T12:39:53-07:00: Domain skills: 13 field-tested sites (Realtor.com, Home Depot, Costco, Wayfair, AliExpress, Temu, Upwork, Google Play, App Store, Apartments.com, Rotten Tomatoes, Bing, Rightmove)
- [3685de8e6821](https://github.com/browser-use/browser-harness/commit/3685de8e68216d0b3a4a1c79a9ab82d3d6345d5e) 2026-10-23T12:23:54-07:00: Domain skills: fix review findings (retries instead of silent partial data, nav checks, truthful UAs, opt-in foreground)
- [b39c30643381](https://github.com/browser-use/browser-harness/commit/b39c30643381d46011c18afe8e910981cfd3b5fd) 2026-10-23T12:00:59-07:00: Domain skills: Google Maps, Yelp, TripAdvisor, Shopify storefronts, Google Scholar, Redfin, Target, Best Buy
- [c6a941287424](https://github.com/browser-use/browser-harness/commit/c6a941287424f32e2d20c7b7b892c8493f46808d) 2026-10-17T10:59:00-07:00: Merge pull request #919 from browser-use/docs/readme-compare-cursor
- [b4f04fb47ca1](https://github.com/browser-use/browser-harness/commit/b4f04fb47ca141d40e8934dbd4ff0347027f72c4) 2026-10-17T10:52:35-07:00: README: tighten eval claims, fix competitor facts, add agent-browser and ChatGPT rows
- [d4bb96b422a4](https://github.com/browser-use/browser-harness/commit/d4bb96b422a4d80db6363a2da9ff6680a1773058) 2026-10-17T10:45:11-07:00: README: define browser harness, compare to Playwright MCP/CLI, DevTools MCP, Claude in Chrome, add Cursor config
- [a6426f846fc5](https://github.com/browser-use/browser-harness/commit/a6426f846fc59d16f38cf66f79176bc7793c16b6) 2026-10-14T18:52:09-07:00: Merge pull request #914 from browser-use/readme-first-paragraph
- [5c60636efa3b](https://github.com/browser-use/browser-harness/commit/5c60636efa3b806b85f1ed54d06d610d74441288) 2026-10-14T18:38:21-07:00: README: first paragraph names Claude Code, Codex and Cursor
- [dbf0e4f3a37e](https://github.com/browser-use/browser-harness/commit/dbf0e4f3a37ebc31aaeaf9d378ab1760b5776c15) 2026-10-08T23:16:16-07:00: Merge pull request #595 from bianjiefilm/feishu-docx-scraping

## Changed paths

- M: `README.md`
- A: `agent-workspace/domain-skills/admin/microsoft-365.md`
- A: `agent-workspace/domain-skills/agoda/scraping.md`
- A: `agent-workspace/domain-skills/airbnb/monthly-search.md`
- A: `agent-workspace/domain-skills/aliexpress/scraping.md`
- A: `agent-workspace/domain-skills/amazon/order-history.md`
- A: `agent-workspace/domain-skills/ap/namecheap.md`
- A: `agent-workspace/domain-skills/apartments-com/scraping.md`
- A: `agent-workspace/domain-skills/apollo/search-and-lists.md`
- A: `agent-workspace/domain-skills/app/apollo.md`
- A: `agent-workspace/domain-skills/app/smartlead.md`
- A: `agent-workspace/domain-skills/apple-app-store/scraping.md`
- A: `agent-workspace/domain-skills/bbb/scraping.md`
- A: `agent-workspace/domain-skills/best-buy/scraping.md`
- A: `agent-workspace/domain-skills/bilbasen/search.md`
- A: `agent-workspace/domain-skills/booking/frontier-checkout.md`
- A: `agent-workspace/domain-skills/claude/custom-connectors.md`
- A: `agent-workspace/domain-skills/claude/skills.md`
- A: `agent-workspace/domain-skills/costco/scraping.md`
- A: `agent-workspace/domain-skills/dashboard/stripe.md`
- A: `agent-workspace/domain-skills/dice/scraping.md`
- A: `agent-workspace/domain-skills/docs/google-sheets.md`
- A: `agent-workspace/domain-skills/doordash/search-and-product-pages.md`
- M: `agent-workspace/domain-skills/ebay/scraping.md`
- A: `agent-workspace/domain-skills/expedia/api.md`
- A: `agent-workspace/domain-skills/expedia/flights-search.md`
- A: `agent-workspace/domain-skills/feishu/docx-scraping.md`
- A: `agent-workspace/domain-skills/figma/comments.md`
- A: `agent-workspace/domain-skills/flighthub/flights-search.md`
- A: `agent-workspace/domain-skills/flyfrontier/checkout.md`
- A: `agent-workspace/domain-skills/frontier/checkout.md`
- A: `agent-workspace/domain-skills/furnishedfinder/search.md`
- A: `agent-workspace/domain-skills/gemini/spark-skills.md`
- A: `agent-workspace/domain-skills/google-maps/scraping.md`
- A: `agent-workspace/domain-skills/google-play/scraping.md`
- A: `agent-workspace/domain-skills/google-sheets/writing-cells.md`
- A: `agent-workspace/domain-skills/google/flights-multi-city.md`
- A: `agent-workspace/domain-skills/home-depot/scraping.md`
- A: `agent-workspace/domain-skills/iherb/product-labels.md`
- A: `agent-workspace/domain-skills/jetblue/checkout.md`
- A: `agent-workspace/domain-skills/loom/read-recording.md`
- A: `agent-workspace/domain-skills/lulu/account-currency.md`
- A: `agent-workspace/domain-skills/mermaid/render.md`
- A: `agent-workspace/domain-skills/microsoft-365/domain-setup.md`
- A: `agent-workspace/domain-skills/namecheap/advanced-dns.md`
- A: `agent-workspace/domain-skills/nordic/product-labels.md`
- A: `agent-workspace/domain-skills/ods/fact-sheets.md`
- A: `agent-workspace/domain-skills/outlook/webmail-compose.md`
- A: `agent-workspace/domain-skills/partsouq/vin-lookup.md`
- A: `agent-workspace/domain-skills/poshmark/scraping.md`
- A: `agent-workspace/domain-skills/realtor-com/scraping.md`
- A: `agent-workspace/domain-skills/redfin/scraping.md`
- A: `agent-workspace/domain-skills/rightmove/scraping.md`
- A: `agent-workspace/domain-skills/rotten-tomatoes/scraping.md`
- A: `agent-workspace/domain-skills/sephora/scraping.md`
- A: `agent-workspace/domain-skills/shopify-storefronts/scraping.md`
- A: `agent-workspace/domain-skills/slack/files.md`
- A: `agent-workspace/domain-skills/smartlead/mailbox-warmup.md`
- A: `agent-workspace/domain-skills/stripe/account-sandboxes.md`
- A: `agent-workspace/domain-skills/supabase/dashboard.md`
- A: `agent-workspace/domain-skills/target/scraping.md`
- A: `agent-workspace/domain-skills/thorne/product-labels.md`
- A: `agent-workspace/domain-skills/tripadvisor/scraping.md`
- A: `agent-workspace/domain-skills/trulia/scraping.md`
- A: `agent-workspace/domain-skills/twitch/scraping.md`
- A: `agent-workspace/domain-skills/ulta/scraping.md`
- A: `agent-workspace/domain-skills/upwork/scraping.md`
- A: `agent-workspace/domain-skills/vercel/archive-and-audit.md`
- A: `agent-workspace/domain-skills/vercel/observability.md`
- M: `agent-workspace/domain-skills/walmart/scraping.md`
- A: `agent-workspace/domain-skills/youtube/playback.md`
- M: `agent-workspace/domain-skills/zillow/scraping.md`
