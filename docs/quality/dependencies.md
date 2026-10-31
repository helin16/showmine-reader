# Dependency Compatibility Record

One row per package changed or left below latest (FR-038). A review date is required for anything below latest.

| Package | Start | Final | Node 26 | Action | Reason below latest | Review date |
|---------|-------|-------|---------|--------|---------------------|-------------|
| next | 13.2.4 | 15.5.28 | Yes | Security upgrade (FR-039); 16 follows in Stage D | Smallest fixed version; latest comes after coverage | 2026-12-31 |
| eslint-config-next | 13.2.4 | 15.5.28 | Yes | Matches Next.js | As above | 2026-12-31 |
| eslint | 8.37.0 | 8.57.1 | Yes | Needed by eslint-config-next 15 | Major upgrade waits for Stage D | 2026-12-31 |
| mongoose (through wechat-jssdk) | 5.11.7 | 5.13.x | n/a | Resolution pin | Reviewed: never connected by this code. Removed with wechat-jssdk | 2026-12-31 |
