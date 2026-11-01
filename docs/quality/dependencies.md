# Dependency Compatibility Record

One row per package changed or left below latest (FR-038). A review date is required for anything below latest.

| Package | Start | Final | Node 26 | Action | Reason below latest | Review date |
|---------|-------|-------|---------|--------|---------------------|-------------|
| next | 13.2.4 | 16.4.3 | Yes | Major upgrade; pages router kept | | |
| react, react-dom | 18.2.0 | 19.3.1 | Yes | Major upgrade | | |
| @types/react, @types/react-dom | 18.0.31, 18.0.11 | 19.3.0 | Yes | Match React | | |
| eslint-config-next | 13.2.4 | 16.4.3 | Yes | Matches Next.js; flat config | | |
| eslint | 8.37.0 | 10.14.0 | Yes | Major upgrade; `lint` now runs ESLint directly | | |
| eslint-config-prettier | 8.8.0 | 10.1.8 | Yes | Major upgrade | | |
| eslint-plugin-prettier | 4.2.1 | 5.5.7 | Yes | Major upgrade | | |
| prettier | 2.8.7 | 3.9.10 | Yes | Major upgrade | | |
| husky | 8.0.3 | 9.1.7 | Yes | Major upgrade | | |
| lint-staged | 13.2.0 | 17.6.0 | Yes | Major upgrade | | |
| typescript | 5.0.2 | 6.0.3 | Yes | Major upgrade | Latest is 7.0.2; `typescript-eslint` 8.72, used by eslint-config-next, requires below 6.1 | 2026-12-31 |
| @types/node | 18.15.11 | 26.6.6 | Yes | Matches Node 26 | | |
| axios | 1.3.4 | 1.21.0 | Yes | Security upgrade | | |
| moment | 2.29.4 | 2.31.0 | Yes | Minor upgrade | | |
| sass | 1.60.0 | 1.107.1 | Yes | Minor upgrade | | |
| momentjs | 2.0.0 | Removed | n/a | Deprecated and never imported | | |
| wechat-jssdk | 5.0.8 | Removed | n/a | Replaced by loading WeChat's script in `WeChatService` | | |
| mongoose (through wechat-jssdk) | 5.11.7 | Removed | n/a | Left with wechat-jssdk; resolution dropped | | |
| form-data (through axios) | 4.0.4 | 4.0.6 | Yes | Resolution dropped; axios needs a fixed version itself | | |
| jweixin (WeChat script, not a package) | 1.4.0 | 1.4.0 | n/a | Same file wechat-jssdk loaded | 1.6.0 exists; moving needs a test in the real WeChat app | 2026-12-31 |
