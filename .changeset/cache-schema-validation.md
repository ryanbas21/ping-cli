---
"p1-cli": patch
---

Add runtime schema validation to CacheService for improved type safety

CacheService now supports optional schema validation for cached values:
- Validates cached data at runtime to ensure type correctness
- Automatically invalidates and recomputes corrupted cache entries
- Protects against cache corruption and API version mismatches
- Maintains backward compatibility (schema parameter is optional)

Updated README documentation:
- Fixed license from ISC to MIT to match package.json
- Enhanced CacheService documentation with schema validation details
- Improved executeCachedRequest documentation
