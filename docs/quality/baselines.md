# Performance Baselines and Results

Lighthouse default mobile profile unless noted (FR-014, FR-015).

| Journey | Profile | Before | After | Date |
|---------|---------|--------|-------|------|
| Home page, performance score | Lighthouse mobile, production | 100 | | 2026-11-02 |
| Home page, Largest Contentful Paint | Lighthouse mobile, production | 1.1 s | | 2026-11-02 |
| Short test article, performance score | Lighthouse mobile, production | 99 | | 2026-11-02 |
| Short test article, Largest Contentful Paint | Lighthouse mobile, production | 1.0 s | | 2026-11-02 |
| Short test article, Largest Contentful Paint as observed, no throttling | Lighthouse trace, production | 1.4 s | | 2026-11-02 |
| Short test article, HTML document | Lighthouse network record, production | 1.2 s | | 2026-11-02 |
| Test article with video, performance score | Lighthouse mobile, production | 96 | | 2026-11-02 |
| Test article with video, Largest Contentful Paint | Lighthouse mobile, production | 2.6 s | | 2026-11-02 |
| Test article with video, Largest Contentful Paint as observed, no throttling | Lighthouse trace, production | 1.4 s | | 2026-11-02 |
| Test article with video, HTML document | Lighthouse network record, production | 1.0 s | | 2026-11-02 |

## Production baseline, 2026-11-02

Conditions: measured from an Australian home connection on one Mac, whose speed was not measured. Server location and WeChat users in China differ, so these figures do not describe a visit from China. Google Translate and YouTube, which these pages load, may also behave differently there.

Method: `npx lighthouse@13.6.0` with headless Chrome, `--only-categories=performance --skip-audits=bf-cache`, and the default simulated mobile throttling of 150 ms round trip, 1.6 Mbps and 4x CPU slowdown. Each figure is the median of 3 sequential runs, taken per metric. Skipping `bf-cache` stops Lighthouse reloading the page.

| Metric | Home | Short test article | Test article with video |
|--------|------|--------------------|-------------------------|
| Page | `/` | `/item/390458fa-2dbc-4669-ba7d-0c67a18f8750` | `/item/de84c6dc-5a0e-4859-a1c9-3de7b19c16cb` |
| Content | Static "404" page | 13 characters, no images | 2 videos, comments on |
| Score, each run | 98, 100, 100 | 99, 99, 99 | 80, 98, 96 |
| First Contentful Paint | 0.9 s | 1.0 s | 0.9 s |
| Largest Contentful Paint | 1.1 s | 1.0 s | 2.6 s |
| Largest Contentful Paint, each run | 2.4, 0.9, 1.1 s | 1.1, 0.9, 1.0 s | 4.9, 1.9, 2.6 s |
| Speed Index | 1.0 s | 2.8 s | 3.0 s |
| Total Blocking Time | 0 ms | 25 ms | 0 ms |
| Cumulative Layout Shift | 0 | 0.072 | 0.018 |
| Total transfer | 141 KB | 362 KB | 1,541 KB |
| HTML document, each run | 523, 194, 147 ms | 1,231, 1,102, 1,415 ms | 1,034, 1,025, 1,176 ms |

Read the simulated article figures with care. The short article's simulated paint of 1.0 s is earlier than its own document arrived without throttling, so Lighthouse is under-counting the server's wait here. The observed figures and the document times are the safer ones to compare after tuning.

Findings:

- An article's document takes about 1.1 s, against about 0.2 s for the static home page and a median of 0.17 s for the API's article route alone. What fills the gap inside the server render was not measured.
- The video article transfers 1,070 KB of script, mostly YouTube's player, which loads with the page, not on tap.
- One recent public article holds 7 images totalling 18.1 MB, one of them 16.1 MB, by `HEAD` request only.

## Not measured

- Lighthouse on a customer's article. Each load of `/item/<id>` adds 1 to that article's `noOfVisits`, because the server render asks for `isVisit=1`, and no flag avoids it. This run used only the test company's articles to leave customer statistics alone, so the short article is not typical content.
- A real load of a large article, including the image-heavy one above.
- SC-005's 90% of visits, which 3 runs cannot show.
- The company page. The reader has no such page: its list sits in the article footer, and the API's baseline covers that list.

The 6 article loads added 3 to each test article's `noOfVisits`, from 4 to 7 and from 47 to 50.
