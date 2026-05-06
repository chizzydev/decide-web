# Decide Web Current Phase

## Role of this repo

For the current Decide phase, the website is the public source of truth for new acquisition-facing product surfaces.

Backend truth lands first in `C:\Users\HP\decide-api`, then the website turns that into:

- search-friendly pages
- stronger product discovery
- trust-building verdict surfaces
- retention entry points that later inform mobile adaptation

## Current Wave 1 truth

The following Wave 1 website work is already live in code:

- stronger market-led homepage with live market pulse and start-path sections
- the homepage market-pulse cards now also surface compact support, repair, and resale cues so first-time visitors see long-term ownership context before entering deeper product pages
- homepage showcase discovery is now curated more intelligently too: it no longer depends only on the raw featured ordering, and instead pulls a broader cross-brand starting mix so one brand does not dominate the homepage, compare entry, and used-checker suggestions by accident
- the main acquisition routes now also have stronger search/share metadata: deals, daily deals, budget guides, compare landings, verdict pages, and used-phone guides all publish cleaner titles, descriptions, canonical paths, and Open Graph/Twitter metadata instead of relying on the weaker root defaults alone
- those same high-intent acquisition routes now also render JSON-LD structured data, so deals, budget lanes, compare landings, verdict pages, and used-phone guides are more legible to search engines beyond plain title/description metadata
- `Browse` and brand pages now surface earlier price-movement and quick-take cues
- `Browse` now also has stronger decision depth above the grid: it surfaces value, support, and entry-price highlights from the current result set plus a direct compare-next path instead of behaving like filters and cards alone
- brand pages now go deeper than filtered browse alone: each brand route now surfaces lineup highlights, brand-specific live movers, and direct compare-ready pairs inside the same lineup so the page behaves more like a real brand decision hub
- homepage featured cards, browse cards, and brand cards now also surface direct compare-next links into likely nearby alternatives, so early discovery flows can move into real head-to-head pages without sending users back through a generic compare entry
- those same discovery cards now also have stronger save continuity: after saving from a shared phone card, the user gets an immediate watchlist follow-through prompt instead of a silent heart toggle with no clear next step
- homepage featured discovery, Browse, and brand pages now also teach the shortlist loop explicitly through a shared panel, so users are told how to move from saving likely finalists into Watchlist and Compare instead of having to infer that flow from scattered controls
- phone detail now includes price-history, verdict teasers, ownership signals, used-phone trust links, a `Decide first` retailer hierarchy, stronger route-level metadata, product/breadcrumb structured data for search/share clarity, and direct compare-next paths into likely alternatives
- `Deals` exists as a real acquisition surface:
  - `/deals`
  - `/deals/today`
  - `/deals/under/100k`
  - `/deals/under/200k`
  - `/deals/under/300k`
  - `/deals/under/500k`
  - deal cards now carry long-term ownership cues too, so support runway, repair reality, and resale confidence show up before the buyer leaves the decision flow for a retailer
  - deal cards now also expose richer Decide-owned next steps tied to the actual rendered phone set: each card links into `Still worth it`, and when another sensible live counterpart exists it can jump straight into a canonical compare page instead of only offering a generic compare entry
  - deal cards now also have an explicit watchlist move, so a live drop can be saved directly into Watchlist from the deal surface instead of forcing the user to detour through phone detail before starting the save -> alert -> compare loop
  - deal cards now also expose a direct alert move, so timing-sensitive buyers can protect a live drop from the deal surface itself instead of treating alerts as a later separate step
  - the broader deals stack now teaches that same retention loop at the page level too: `/deals`, `/deals/today`, and the budget routes all point users back into Watchlist, Alerts, and Compare so retention is not hidden only inside the individual cards
- dedicated verdict pages now exist:
  - `/buy-now-or-wait/[slug]`
  - `/worth-it/[slug]`
- compare is now crawlable and shareable:
  - `/compare`
  - `/compare/[leftSlug]/vs/[rightSlug]`
  - compare now also exposes a dedicated long-term ownership section, so support runway, repair reality, and resale confidence sit alongside specs and scores instead of staying buried in separate verdict pages
  - the compare entry route now also uses that curated showcase mix for its starter pairs, so the page does not over-index whichever single brand happens to dominate the raw featured list
- used-phone trust layer is live:
  - `/used/[slug]`
  - `/used/checker`
  - used-checker model cards now also link directly into `Still worth it`, and when another sensible featured-phone counterpart exists they can jump straight into a canonical compare page instead of acting like isolated guide entries
  - the used-checker route now also uses the same curated showcase mix, so its model-specific guide suggestions are not accidentally biased toward one featured brand lane
- retention layer is visible on the website too:
  - `/saved` now behaves as a watchlist hub
  - `/alerts` now highlights uncovered watchlist items
  - saved watchlist cards can now create a price alert directly without sending the user back through phone detail first
  - alert suggestion cards on `/alerts` now use that same inline alert flow, so uncovered watchlist phones can be protected from the retention surfaces themselves
  - the inline alert triggers now use a dedicated primary variant instead of conflicting utility overrides, so they stay visibly clickable without hover-only styling bugs
  - watchlist-facing summary tiles are now computed from the live saved items on the page, and the unprotected count is labeled explicitly as `Unprotected saved` to avoid confusion after alert deletion
  - watchlist cards and alert-suggestion cards now also surface a dedicated `Decide next move` panel, so those retention pages guide buyers into the right verdict, used-guide, compare, or timing action instead of behaving like passive storage
  - the watchlist now also surfaces compare-ready pairs from the saved phones themselves, so users can jump straight into head-to-head decisions from retention instead of manually reconstructing finalists later
  - individual watchlist cards and uncovered alert-suggestion cards now also expose a direct compare action whenever there is another sensible shortlist counterpart available, so users do not have to hunt for the separate compare-pairs section before acting
  - active alert cards on `/alerts` now surface current tracked price, target gap, and a dedicated `Decide next move` panel instead of staying as thin target rows
  - `/alerts` now also surfaces compare-ready pairs from the phones already covered by active alerts, so the retention layer can feed straight into canonical head-to-head pages once protected phones start looking like finalists

## Current operational truth

- production build is healthy: `npm run build` passes
- the web dev server should currently be run in webpack mode through `npm run dev`
- this repo intentionally uses `next dev --webpack` because Turbopack was hanging on `Compiling / ...` during local development on this machine
- website backend-session refresh now keeps the current session in place on a transient refresh miss while the refresh token is still valid, instead of clearing the whole session immediately
- admin client auth misses now send the user back through `/login` with a session-expired message instead of surfacing a raw runtime error overlay
- `/phones` now keeps the raw typed browse query while the field is focused and hides the navbar search on that route so two search boxes do not compete over the same browse intent
- phone cards with no trusted retail price but live Jiji context now point users more clearly to the details page for used-market pricing/context
- the admin Jiji queue now pushes never-synced phones ahead of recently retried no-result phones and shows the last sync state on each row, so `Sync all shown` can keep moving through fresh phones instead of recycling the same dead ends immediately
- website Google sign-in now explicitly reopens the account chooser on login/register so a failed or denied attempt does not keep silently replaying the same Gmail
- the `/assistant` route now suppresses the broader website chrome on the focused assistant flow, so narrow/mobile-width views do not stack the global navbar and the internal assistant shell on top of each other
- the `/assistant` AI Agent now derives brand understanding from the active catalog with a maintainable alias layer, so Oppo, Vivo, Redmi/Xiaomi, iPhone/Apple, Pixel/Google, Tecno typo handling, and future active brands can be understood without depending on one stale hardcoded list
- the AI Agent now parses Nigerian budget language more reliably (`350k`, `350 K`, comma amounts, around/close-to/between), understands intent signals like camera, gaming, battery, student, cheapest, and minimum RAM, and falls back to closest useful options instead of failing silently when exact brand/budget matches are unavailable
- AI Agent analyze/compare ambiguity is now a clean assistant candidate-picking state instead of a raw API error, and choosing a candidate preserves the original action such as analyze, price lookup, or compare
- AI Agent comparison now understands natural comparison phrasing beyond `vs`, including `compare X and Y`, `which is better X or Y`, and `X compared to Y`, while preserving normal recommendation phrases that use `and` for priorities
- AI Agent compare presentations now expose the tracked configuration/variant context and render comparison details as mobile-first stacked cards on narrow screens, with the desktop table kept for wider layouts
- AI Agent suggested next actions now render as real navigable controls instead of passive bullet text, so users can move directly from an answer into phone detail, compare, browse alternatives, or price context
- the mobile account menu anchor in the website navbar is now positioned relative to its trigger instead of floating from the wider header box
- phone detail and other phone-backed surfaces now receive normalized note/support copy from the API, so older catalog text with broken `â€` punctuation no longer leaks through to buyers
- the `Analyze` result flow now drives stronger decision exits too: the strongest alternative becomes a dedicated showdown card, alternatives expose richer verdict links, and the result surface pushes users more directly into compare and verdict pages instead of leaving them in a softer recommendation loop
- the root website metadata and budget-guide source strings were also cleaned up, so broken dash and currency encoding no longer leaks into the app-level metadata baseline
- a shared structured-data helper now exists too, so future acquisition routes can publish JSON-LD without hand-rolled duplicated scripts in each page
- a shared related-compare helper now exists too, so market and featured-phone surfaces can derive sensible compare counterparts from the actual rendered phones instead of hard-coding generic compare links
- Wave 1 website continuity is now strong enough to stop polishing as the default habit; the next serious wave should focus on catalog fidelity and commerce data quality instead of more small link-flow tweaks

## Current implementation map

The website is now mostly working across the approved feature families:

- `Price Intelligence Engine`
  - status: substantially implemented on the public web
  - website role now: present cleaner current-store truth, stronger variant continuity, and clearer freshness/provenance
- `Purchase Verdict Engine`
  - status: implemented
  - website role now: keep verdict continuity strong across discovery, detail, and compare loops
- `Indexable Comparison Landing Pages`
  - status: implemented
  - website role now: keep compare configuration-aware and easier to distribute/share cleanly
- `Watchlist + Smart Alerts`
  - status: implemented in meaningful form
  - website role now: keep saved/alerts flows aligned to tracked configuration truth
- `Used Phone Trust Layer`
  - status: implemented in lite form
  - website role now: deepen model coverage without bloating the current public experience
- `Longevity / Support / Resale Signals`
  - status: implemented as shared intelligence
  - website role now: keep those signals reused consistently across more decision surfaces

The bigger website/backend Wave 2 workstreams underneath that are now:

- `Variant & Store Truth Layer`
- `Image Reliability & Asset Sourcing`
- `Operator Quality & Catalog Exception Layer`
- `Catalog Authority & Coverage Layer`

One worthwhile website-facing extension after those truth layers are steadier is:

- `Compare Distribution & Sharing`
  - first: copy-link / native-share polish around canonical compare URLs
  - next: stronger Open Graph / social-share presentation
  - later: downloadable compare snapshot/card if the public compare truth is stable enough to deserve export

## Priority Order Right Now

To stay efficient and stop circling, website work should now follow this order:

1. `Catalog Authority & Canonical Truth Follow-Through`
   - reflect the cleaned backend catalog accurately on public surfaces
   - keep resolving live drift, duplicate leftovers, and weak lineup truth instead of masking them in the UI
   - reason: wrong phone identity poisons every public page no matter how polished the UI is
2. `Variant & Store Truth Follow-Through`
   - keep making current-price, freshness, and tracked-variant truth clearer across public surfaces
   - keep surfacing exact configuration context honestly instead of flattening it away
   - reason: this is the biggest buyer-trust layer behind deals, compare, detail, saved, and alerts
3. `Image Reliability & Asset Stability`
   - keep reducing fallback and weak-image cases as backend image truth improves
   - reason: public trust drops quickly when a product page has the wrong or unstable image
4. `Public Configuration Continuity`
   - tighten compare, phone detail, watchlist, and alerts so the same tracked configuration survives the whole journey
   - reason: this becomes much more valuable once catalog/store/image truth is steadier
5. `Operator-Led Cleanup Consumption`
   - let the admin quality backlog drive the next real fixes instead of adding new frontend operator chrome by default
   - reason: we already have meaningful cleanup controls, so the bigger need is to use them against the real backlog
6. `Compare Distribution Extras`
   - downloadable compare cards and further sharing polish come after the truth layers above feel stable enough to distribute confidently
7. `Mobile Inheritance`
   - mobile should inherit the stronger web/backend truth later, not drive current website priorities

## What Not To Default To

These are not the right default next moves unless a higher-priority lane clearly needs them:

- more generic visual polish on already-healthy surfaces
- more admin UX plumbing for its own sake
- frontend-only hiding rules for backend/catalog truth problems
- share/export extras ahead of catalog/store/image reliability
- speculative content additions without stronger catalog authority behind them

## Working Execution Rule

When choosing the next chunk, use this rule:

- take the highest-priority unfinished lane above
- pick the smallest slice that materially improves public trust or catalog truth
- finish that slice cleanly before moving down the list
- only move to a lower lane when the higher one is blocked or already healthy enough for now

## Local run commands

### Development

```powershell
cd C:\Users\HP\decide-web
npm run dev
```

### Production validation

```powershell
cd C:\Users\HP\decide-web
npm run build
```

## Required local env

The repo currently expects `.env.local` to include at least:

- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=...`
- Google auth client values as already configured for the web app

## Current working rules

- keep touched website surfaces polished on both mobile-web and desktop
- use the website as the source of truth for new acquisition-facing product surfaces
- do not let retailer exits visually outrank Decide-owned guidance
- keep teal, white, and dark ink as the primary visual language
- when responsiveness is questionable, prefer structured section stacks over brittle wrap-heavy layouts

## Recommended next wave

The next website/backend wave should now shift away from link-flow polishing and into deeper catalog truth:

- variant-aware phones and prices (`128GB`, `256GB`, RAM/storage combinations)
- stronger image coverage and stable cached image sourcing
- better featured/admin curation controls so showcase surfaces stay intentionally mixed
- price/store normalization that makes compare and verdict pages more commercially trustworthy

## Wave 2 progress

The first real Wave 2 slice is now in:

- the admin phone catalogue now exposes ranked showcase control through `showcase_priority`
- the add-phone form also supports initial featured + showcase setup instead of leaving new catalogue entries to a later hidden DB tweak
- this gives homepage and other starter surfaces a durable curation control before the broader variant/image/store-normalization work lands
- the next catalog-fidelity slice is now in code too:
  - phone detail can now show tracked variants, not just flat store prices
  - the top tracked-price module now carries variant labels when a price belongs to a specific RAM/storage combination
  - the admin sync/price-management screen now shows variant labels on saved price rows and test-and-save results, so catalogue operations can see which variant a store price belongs to
  - current public discovery surfaces remain stable because homepage, browse, deals, and compare still consume the same top-level price shape while the richer variant layer sits behind phone detail and admin first
  - phone-detail price history is now variant-aware too: the chart uses a selected tracked variant instead of silently flattening all configurations together, and the history card now exposes direct variant switching for phones that have multiple tracked RAM/storage combinations
- the next image-fidelity slice is now in code too:
  - the admin phones image tab now uses a real image-health audit instead of only a missing-image list
  - admins can now see localized, remote-only, fallback, missing-local-file, and missing states separately
  - remote-only images now have a direct `Localize` action, so stable local caching can be fixed without forcing a fresh re-scrape first
- the next store-normalization slice is now in code too:
  - public `current price` surfaces now use normalized current store offers instead of leaking the cheapest historical row per store into phone detail, compare, browse, and recommendation-driven pricing
  - the shared price module now labels that truth more honestly as `best current` rather than `lowest`, and its freshness stamp is now derived from the actually freshest tracked store check instead of whichever store happened to be cheapest
- the next operational Wave 2 slice is now in code too:
  - admin phones now opens on a dedicated `Quality` tab that turns Wave 2 into one control surface instead of scattered fixes
  - that quality view now summarizes showcase ranking gaps, price coverage/freshness gaps, variant-binding gaps, and image-health attention in one place
  - each attention lane now lets an admin jump straight into catalogue or images work instead of mentally stitching together several separate tabs first
- the first public-facing slice of the next wave is now in code too:
  - phone detail no longer leaves variant-aware truth mostly behind the chart; the selected tracked variant now drives the main price module itself
  - buyers can now switch the active tracked configuration from the price area, and the older variant list now correctly becomes `other tracked variants` instead of duplicating the active configuration
  - the detail-page alert baseline now also follows the selected variant price, so the page behaves more like one coherent configuration-aware product surface
- the next public-facing slice of that same wave is now in code too:
  - compare no longer silently falls back to a flat phone-level price story after phone detail became configuration-aware
  - each side of the compare now picks a focused tracked configuration, and the compare card plus spec rows keep price, RAM, and storage aligned to that same tracked variant
  - compare still does not expose full per-side variant switching yet, but it now tells the truth about which tracked configuration it is currently pricing and links back to the relevant detail configuration cleanly
- the next retention follow-through slice is now in code too:
  - watchlist and alerts now carry that same focused tracked configuration into saved and alert-driven decision surfaces instead of falling back to a flatter phone-wide price story
  - the current tracked price on those pages now follows the focused tracked configuration where variant prices exist, and cards now surface the active tracked configuration explicitly
  - compare actions on saved and alerts now explain which tracked configurations the head-to-head is starting from, and direct `View phone` links now land on the relevant configuration-aware detail state when Decide knows it
- the next alert-fidelity slice is now in code too:
  - phone detail, watchlist cards, and alert-suggestion cards now create alerts against the active tracked configuration when Decide has one instead of silently defaulting every alert back to the phone model overall
  - the alert modal now tells buyers when they are protecting a specific tracked RAM/storage configuration, and the success state reflects that same scoped configuration truth
  - active alert cards now use alert-scoped current price and freshness data when Decide has it, so alert management no longer falls back to a flatter phone-wide price read
  - optimistic protected/unprotected state on `/saved` and `/alerts` now only changes when the created or deleted alert actually matches that watchlist item's focused tracked configuration, or is intentionally model-wide
- the next alert follow-through slice is now in code too:
  - active alerts now carry their own phone slug, so `/alerts` can always open the right Decide phone page even when watchlist context is missing
  - alert-driven detail links now open the tracked configuration itself when the alert is variant-bound, instead of dropping buyers onto the generic model page
  - triggered alert emails now use that same exact tracked-configuration Decide URL, so the click from inbox to product page stays configuration-aware end to end
- the next compare follow-through slice is now in code too:
  - saved and alerts compare actions no longer jump into a slug-only head-to-head that has to guess the tracked configurations again
  - compare URLs from retention surfaces now carry `left_variant_id` and `right_variant_id`, so the head-to-head starts from the same tracked configurations the buyer was already evaluating
  - both the canonical compare page and the compare builder now preserve that configuration context as users move between shareable compare pages and the builder flow
- the next discovery/tray compare slice is now in code too:
  - the compare tray can now store tracked configuration context when Decide actually knows it, instead of always flattening tray entries back to phone-only compare
  - phone-detail now has a configuration-aware compare-tray button, so the selected tracked variant can flow into the tray and later into compare without being lost
  - homepage, browse, brand, and phone-detail compare suggestions now carry inferred tracked-configuration context when current-price rows reveal a real variant, while assistant-style paths that do not yet know a configuration still stay honestly model-level
- the last assistant/deals compare-context slice is now in code too:
  - assistant recommendation results now consume variant-aware price rows cleanly on the web side, so adding a recommended phone to the compare tray can preserve inferred tracked configuration where the recommendation payload already exposes it
  - deals radar items now carry tracked variant metadata from the backend instead of staying flat model-only drop cards
  - deal cards now use that richer truth for compare links, `View phone`, and alert creation, so live-drop flows can stay configuration-aware when Decide has an exact tracked variant behind the drop
- the public finalist-loop QA pass is now clean enough to treat as a real checkpoint:
  - live localhost checks succeeded on variant-aware phone detail, canonical compare with variant params, deals, and assistant route health
  - the one aborted `Invoke-WebRequest` read against phone detail did not reproduce under `curl`, so it currently looks like transient dev-server streaming flakiness rather than a product regression
  - this means the public compare-context loop is holding across detail -> compare -> deals at the route-health level, and the next move can be a new serious slice instead of more emergency patching
- the next catalog-operations slice is now in code too:
  - the admin `Quality` tab no longer stops at passive spotlight lists; each Wave 2 attention lane now has an operator action directly where the issue shows up
  - showcase attention can now normalize featured priorities into one consistent ranked order, variant attention can backfill default variants for active phones still missing them, and image attention can localize the current remote-only set in batch
  - the quality dashboard now also has a targeted `Refresh attention set` action for the real missing/stale price lane instead of only a broad full-catalog price sync trigger
  - image attention now has a direct `Repopulate fallbacks` action too, because the current live catalogue pressure is mostly in fallback images rather than remote-only image URLs
  - the `Quality` tab now also exposes a top-level `Run recommended cleanup` flow that sequences the safe Wave 2 actions in the right order from one operator button
  - the quality dashboard now also reflects truthful targeted-price remediation outcomes: transport-level scraper failures show up as failed attention items instead of looking like successful cleanup, and the pricing lane no longer quietly destroys current-price truth during bad fetch runs
  - the first real cleanup pass has already normalized all featured showcase priorities and confirmed the variants lane is healthy; the remaining live pressure is now mostly 106 missing-current-price cases, 4 stale-current-price cases, and 119 fallback-image cases
- the next catalog-exception slice is now in code too:
  - the admin `Catalogue` tab now exposes explicit operator controls for two stubborn Wave 2 lanes: price-tracking exceptions and manual image overrides
  - operators can now exclude phones from automated missing/stale current-price attention when Jumia and Slot do not realistically carry them, and store a note explaining why the phone was taken out of the pricing lane
  - operators can also set a manual image override URL plus a note when automation only finds accessories or placeholder imagery, and the same manual override truth now shows up on the `Images` tab and in the image audit summary
  - the `Quality` tab remediation banner now distinguishes clean success from mixed-result cleanup runs, so successful execution with unresolved catalog pressure is shown honestly as a warning instead of pretending the lane is fully healthy
- the next operator-speed follow-through is now in code too:
  - the `Catalogue` tab now has fast filters for all phones, price exceptions, manual overrides, and featured phones, so operators can work the stubborn Wave 2 lanes without searching blind
  - phones already excluded from pricing or pinned to a manual image can now be reversed directly from their catalogue row with `Rejoin pricing lane` and `Clear override` actions
  - the quick `Exclude from pricing lane` action now writes a default audit note automatically, so the exception lane stays explainable instead of silently flipping a boolean
  - the `Images` tab now supports one-click `Pin current image` for remote-only images that are good enough to keep, which is much faster than opening the catalogue editor and copying the same URL by hand
- the next long-term image-override follow-through is now in code too:
  - the `Catalogue` operator panel now has a real local image upload control for stubborn phones, so operators no longer have to manually copy file paths into the manual override field
  - uploads accept JPG, PNG, or WEBP files up to 6MB, store the file under `C:\Users\HP\decide-web\public\images\phones`, and automatically fill the phone's `manual_image_url` with the new stable local asset path
  - the old manual URL field still stays available for edge cases, but the preferred long-term fix is now `upload -> auto-link -> optional note`, which is much safer than relying on temporary remote URLs or hand-built paths
- the next Wave 2 operator-queue slice is now in code too:
  - the `Quality` tab now shows a guided operator decision queue driven by backend catalog-health truth instead of forcing operators to infer the next human actions from summary cards alone
  - the queue prioritizes stubborn missing-price, stale-price, image-stability, and showcase-ranking cases and gives each one a recommended next move such as `Exclude from pricing lane`, `Localize now`, `Open uploader`, or `Rank showcase`
  - this means the post-cleanup workflow is now much more durable: the quality dashboard can act like an operational backlog for the real remaining exceptions instead of only a reporting surface
- the next admin-clarity follow-through is now in code too:
  - catalogue lane filters now behave like real views instead of hidden search combinations, so clicking `Price exceptions`, `Manual overrides`, or `Featured` clears the old search and shows that lane cleanly by default
  - the catalogue summary now reports counts against the active lane first, and when search is still active it tells the operator explicitly that the lane is being narrowed and offers a one-click clear path
  - this removes the confusing state where excluded phones or manual overrides could seem to disappear unless the operator remembered the last injected search term
- the next catalogue-plumbing slice is now in code too:
  - `/assistant` and `/phones` no longer depend on the old hardcoded Android brand shortlist for selection/filter UX; both now read the active Android brand list from backend truth and sort it in a curated Nigeria-first order, which makes Oppo and Nokia first-class immediately and lets Vivo appear naturally once it is added to the live catalog
  - `/brands/[brand]` and `/phones` now request a high discovery limit instead of inheriting the API default `20`, so brand and browse surfaces no longer silently hide large parts of the catalog unless the operator already knows the exact phone name to search
  - the website now has a shared `brandCatalog` helper carrying both the curated Android brand priority order and the discovery-page fetch limit, so future catalog growth does not reintroduce the same drift on a different page
- the next catalog-authority backend slice is now in code too:
  - the backend seed now has a first real Vivo lane, corrected Xiaomi/Redmi Note 15 family coverage, and a more trustworthy Nokia core lineup, which means the website’s earlier brand/filter plumbing now has a stronger catalog base to consume
  - the silent same-slug seed overwrites for the duplicate OnePlus and Itel tail rows have also been retired, reducing the risk that browse, assistant, or brand pages drift because a later legacy addendum quietly replaced an earlier canonical phone row
  - this does not yet finish the full user-facing catalog authority job on the website: the next serious pass still needs to turn the cleaned backend base into a broader verified lineup review across remaining brands, then revisit store visibility and spec accuracy from that stronger source of truth

- the next catalog-authority backend follow-through is now in code too:
  - the backend seed base behind browse, brand pages, and assistant now has a cleaner Google/OnePlus/itel truth layer: official older Pixels are now present canonically, later Pixel duplicates are retired, OnePlus Nord CE3 / CE4 Lite are closer to official product truth, and the biggest itel overstatements have been corrected
  - the same integrity pass also removed the last active duplicate slug currently detected in the seed (`infinix-note-50x-5g`), so the website is no longer at risk of consuming one canonical phone that is silently overwritten by another active row sharing its slug
  - this still does not finish the user-facing catalog authority job: the next serious pass remains a broader verified lineup review across the remaining brands, followed by surface-level checks for store visibility, spec accuracy, and any ranking/discovery weirdness that survives the cleaner seed base
- the next catalog-authority backend repair sweep is now in too:
  - the backend seed survived a real Samsung integrity repair during this pass, and the repaired section now keeps only the unique `Galaxy S25 Edge` addendum while the corrected canonical Samsung rows remain the ones discovery surfaces should trust
  - the newer Tecno Spark / Pova authority rows introduced in the previous pass are now complete enough for backend truth consumption, rather than leaving the website exposed to half-filled catalog objects that would fail the API build
  - Xiaomi/Redmi and Google metadata gaps on the newly corrected rows were also normalized, so the website now sits on a cleaner backend catalog base before the remaining brand-by-brand authority sweep continues
  - `npm run build` is green again in both `C:\Users\HP\decide-api` and `C:\Users\HP\decide-web`, so this repair pass is a clean carry-forward point instead of a half-repaired seed state
- the next realme authority backend slice is now in too:
  - the backend catalog now has the missing official realme number-series bridge from `12+ 5G` through `14 Pro+ 5G`, so browse, assistant, and brand surfaces are no longer forced to reason over such a thin slice of realme's current lineup
  - those new rows intentionally keep `seed_prices` empty so the website still waits for live store truth from Jumia/Slot rather than inheriting invented static launch prices
  - this keeps the current website follow-through priority unchanged: continue the remaining backend brand sweeps first, then come back and QA how the richer catalog actually changes discovery/recommendation behavior
- the next oppo authority backend slice is now in too:
  - the backend catalog behind browse, assistant, and brand pages now has a much cleaner Oppo truth layer, especially across the A-series and Reno naming/radio reality where several older rows had been blending 4G and 5G identities
  - the base `Find X8` flagship is also now present alongside `Find X8 Pro`, so the website is no longer underrepresenting Oppo's premium flagship family entirely
  - this was still a backend-truth pass rather than a website-UX pass, so the next website-facing follow-through remains the same: finish more brand sweeps first, then QA how the richer Oppo/realme catalog changes discovery and recommendation behavior
- the next Apple / Nokia / OnePlus authority follow-through is now in too:
  - the backend catalog feeding browse, assistant, compare, and brand pages now includes the missing `iPhone 16 Plus` / `iPhone 16 Pro` rows, a broader official Nokia/HMD backbone (`C31`, `G11`, `X30 5G`), and a cleaner `OnePlus 15R` truth layer where the old seed had drifted into a made-up camera story
  - several newer Apple rows are now materially closer to official truth too: `iPhone 16e`, `iPhone Air`, `iPhone 17`, `iPhone 17 Pro`, `iPhone 17 Pro Max`, and `iPhone 17e` all had concrete spec or buyer-guidance corrections in the seed during this pass
  - this remains a backend-truth slice first, so the next website-facing follow-through is still the same: keep finishing the remaining catalog-authority sweeps, then QA the user-facing discovery and recommendation surfaces against that richer and less speculative catalog base
- the next Samsung / Tecno / Infinix authority backend follow-through is now in too:
  - the backend catalog feeding browse, assistant, compare, and brand pages now has materially cleaner Samsung A-series naming/radio truth: `A25`, `A26`, `A34`, `A35`, `A36`, `A54`, `A55`, and `A56` now reflect the official 5G identity instead of the earlier mixed 4G/5G drift, and `Galaxy S24+` no longer understates its display resolution
  - Tecno's weakest speculative backend rows are no longer carrying discovery: `Pop 9` now matches the official low-end 4G product, `Pop 10` no longer mislabels Android 15 as Go Edition, `Camon 50` / `Camon 50 Pro` are materially closer to official 4G truth, and the separate official `Camon 50 Pro 5G` now exists as its own catalog row
  - Infinix's current backend truth is also healthier for public surfaces: `Hot 50` no longer claims the wrong chipset, `Note 30 VIP` now reflects its official 5G / 108MP identity, and `Note 50 Pro+` now carries the proper `5G` naming
  - this is still a backend-truth slice rather than the final completeness sweep: the next user-facing follow-through should keep finishing the remaining catalog-authority gaps, especially the weaker recent Infinix branches, before we do the deeper frontend QA on the richer catalog
- the next recent-Infinix authority backend follow-through is now in too:
  - the backend catalog behind browse, assistant, compare, and brand pages now includes an official `Hot 50 5G` row instead of forcing that phone family to collapse back into the 4G `Hot 50` truth
  - `Note 50S 5G+` is now materially closer to official Infinix truth too: the catalog now reflects the `5G+` naming, 5200mAh battery, NFC, 4K recording, Gorilla Glass 5, and IP64 instead of the older weaker placeholder story
  - `Note 50 Pro+ 5G` also now reflects the stronger premium official payload story, including Dimensity 8350 Ultimate, 100W wired charging, 50W wireless charging, and IP64
  - `Note 50X 5G` still remains in the catalog as a live lineup row, but it is now called out more honestly as the one recent Note 50 extension whose equivalent public spec payload is still harder to pin down than the others
- the final backend seed-completeness pass is now in too:
  - the website's catalog source now has materially stronger 2022-to-2025 continuity across Samsung and OnePlus, including the older missing `S22` family, `Z Flip 4` / `Z Fold 4`, `A23 5G`, `A53 5G`, and the missing OnePlus `10 Pro` / `10T` / `Nord 2T 5G` / `Nord CE 2 Lite 5G` / `Nord 3 5G`
  - Xiaomi/Redmi discovery truth is also cleaner now: the catalog behind browse and assistant now contains the missing `Redmi 13C 5G`, `Redmi Note 12 5G`, `Redmi Note 13 5G`, `Redmi Note 14 5G`, `Xiaomi 12T`, `Xiaomi 12T Pro`, and `Xiaomi 13 Lite`, while the existing plain `Redmi Note 12` / `13` / `14` rows no longer quietly carry 5G-only chipset identities
  - Oppo, realme, and vivo now have broader official-lineup coverage for website discovery too, including `Oppo A60`, `Reno11 5G`, `Reno11 F 5G`, `Realme 12 5G`, `12 Pro 5G`, `13 5G`, `13+ 5G`, `vivo V29`, `Y03`, `V40e`, `X100`, and `X100 Pro`
  - both `C:\Users\HP\decide-api` and `C:\Users\HP\decide-web` remained green on `npm run build`, and the seed integrity check still reports no active duplicate phone slugs after this sweep
- the compact price-surface follow-through is now in too:
  - compact price cards no longer hide Slot truth unless the range is dramatic; the shared `PriceDisplay` component can now surface the tracked current stores directly while still keeping the best-current price as the headline
  - browse/brand/featured `PhoneCard` surfaces, compare header cards, and the mini tracked-variant cards on phone detail now opt into that richer compact store summary, so Jumia and Slot are both visible when Decide has current prices for both
  - `C:\Users\HP\decide-web` stayed green on `npm run build` after this website-facing pass
- the first compare distribution follow-through is now in too:
  - the shared compare result header now supports direct `Copy compare link` and native share behavior, so both the builder-driven compare result and the canonical compare page have an immediate distribution action instead of relying only on manual URL copying
  - the share target now follows the canonical compare URL with tracked variant params when Decide knows them, so copied/shared links reopen the same focused configuration context instead of dropping people onto a flatter compare state
  - compare landing pages now also publish a dedicated dynamic social card instead of the generic site OG image, so WhatsApp/X/Facebook/Telegram shares can show the actual two-phone matchup, focused variant labels, and best-current price context
  - compare pages now also support a lightweight browser-downloaded SVG snapshot, so the comparison can be exported locally even before the public site is live
- the next compare distribution follow-through is now in too:
  - `/compare` now behaves more cleanly as the builder/start surface, while actual head-to-head results normalize straight onto the canonical `/compare/[leftSlug]/vs/[rightSlug]` URL instead of living on a query-string builder result page too
  - this keeps shared links, browser refreshes, social previews, and revisit flows converged on one distribution-friendly compare URL instead of splitting truth between the builder and the canonical landing
- the next public price-trust follow-through is now in too:
  - the shared price module no longer hides freshness truth behind tooltips alone; current-price surfaces now mark tracked prices as `Fresh`, `Aging`, or `Stale` based on the latest tracked store check
  - phone detail and compare pricing now explain that those badges are trust signals, so buyers can tell when Decide has checked recently enough versus when they should treat the number as context and recheck before acting
- the next image-operator truth follow-through is now in too:
  - the admin `Images` tab now shows whether image repopulation has trusted live Jumia/Slot product pages to retry from or is falling back to lower-confidence search discovery only
  - image-audit rows now also expose a direct `Open source page` link when Decide knows the underlying product page, which makes it much easier to verify suspicious images before pinning or overriding them
- the next operator-backlog cleanup slice is now in too:
  - the admin `Quality` tab now surfaces phones that still carry valid legacy non-tracked price rows, such as old seeded `konga` entries, instead of leaving that cleanup hidden only inside `/admin/sync`
  - operators can now delete those legacy rows directly from the quality spotlight and operator queue, which keeps the admin backlog aligned to the real tracked-store truth Decide now uses publicly
- the next catalog-authority follow-through is now in too:
  - inactive brands are now treated more like real public suppressions than partial UI toggles; once a brand is turned off, it drops out of backend discovery/recommendation reads, deals radar, tracked price sync targets, and active watchlist/alert reads instead of only disappearing from brand lists
  - the admin Brands page now explains that scope clearly, so operators can turn weak catalog lanes off with more confidence instead of relying on hidden frontend-only exceptions
- the next lineup/spec authority sweep is now in too:
  - the website no longer carries a special frontend-only Nokia hide; backend `brands.is_active` is now the only source of truth, so reactivating Nokia from admin will make it show up naturally again
  - the Xiaomi Note 15 family catalog block was also tightened so the 4G/5G split is less contradictory, the Redmi Note 15 Pro row no longer claims 5G with a Helio chipset, and the family now carries the stronger six-year security runway now shown in the current authority pass
- the next catalog-drift operator sweep is now in too:
  - the admin `Quality` tab now shows active phones that still exist in the live DB but are missing from the current canonical seed source, so the `seeded` versus total active-phone gap is visible instead of being buried in seed logs
  - that lane is intentionally review-first, not a blind bulk wipe: operators can find the phone in Catalogue or deactivate it one by one if it is just an old leftover row rather than a deliberate manual exception
  - the same `Quality` surface now also exposes canonical seed phones that are missing from the active live catalog, with single-phone and batch restore actions instead of depending on a separate `seed:catalog` ritual
- the Operator Cleanup Throughput lane now has a focused queue pass too:
  - the admin `Quality` operator queue can now be filtered by catalog, pricing, image, and showcase lanes, so cleanup work no longer requires scanning the whole mixed backlog every time
  - the same queue now shows per-lane counts and a `Run next safe quick fix` action that only applies low-risk repairs like legacy price deletion, slug repair, seed resync, variant backfill, current-price binding repair, and image localization/repair
  - merge, deactivate, price-exclusion, manual-upload, and showcase-ranking decisions remain review-first, which keeps operator throughput faster without turning judgment-heavy cleanup into unsafe bulk automation
  - the queue now also shows only the highest-priority next move per phone, with any lower-priority residual lanes kept behind that card, so post-action refreshes stop feeling like the same phone is endlessly repeating across several cleanup recommendations at once
  - cleanup actions now also report real before/after lane movement after refresh, so operators can see whether price attention, legacy leftovers, canonical drift, image attention, or queue pressure actually shrank instead of inferring it from a generic success toast

## Carry-forward prompt

Use this if a future chat needs to continue the website phase:

```text
We are continuing Decide website work in C:\Users\HP\decide-web.

Read these first:
- C:\Users\HP\decide-web\docs\current-phase.md
- C:\Users\HP\decide-web\docs\dev-troubleshooting.md
- C:\Users\HP\dm\docs\final-execution-guide.md
- C:\Users\HP\dm\docs\wave-1-implementation-plan.md
- C:\Users\HP\dm\docs\phase-status.md

Important rules:
- website is the source of truth for the current acquisition-facing phase
- backend truth lands first, then website surfaces adapt it
- touched surfaces must be polished on both mobile-web and desktop
- do not regress the Decide-first trust hierarchy on prices, verdicts, and store exits
```
