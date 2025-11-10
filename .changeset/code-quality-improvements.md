---
"p1-cli": patch
---

Code quality improvements: Remove type assertions and eliminate HTTP duplication

**CacheService Type Safety:**
- Removed all 6 instances of `as unknown` type assertions
- Properly typed cache with generic `CachedResponse` type
- Full type safety throughout cache implementation

**HTTP Request Helpers:**
- Created reusable helpers in `src/HttpClient/helpers.ts`:
  - `executeRequest`: Standard HTTP requests with schema validation
  - `executeCachedRequest`: GET requests with automatic caching
  - `executeVoidRequest`: DELETE/POST operations returning void
- Helpers use proper Effect combinators (`Effect.flatMap`, `Effect.if`) and pipe composition
- Centralized error handling and retry logic

**Client Refactoring:**
Refactored all HTTP client files to use the new helpers:
- **PingOneClient.ts**: 851 → 628 lines (223 lines saved, 26.2% reduction)
- **GroupClient.ts**: 436 → 302 lines (134 lines saved, 30.7% reduction)
- **ApplicationClient.ts**: 283 → 194 lines (89 lines saved, 31.4% reduction)
- **PopulationClient.ts**: 283 → 194 lines (89 lines saved, 31.4% reduction)

**Total Impact:**
- **535 lines of duplicated code eliminated** across 4 client files
- **Average 30% reduction** in client file size
- All 166 tests passing
- Zero new linting errors introduced
- Improved maintainability and consistency
