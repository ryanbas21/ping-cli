---
"p1-cli": minor
---

**BREAKING CHANGE (pre-1.0)**: CacheService now requires schema validation for all cached values

CacheService.getCached() now requires a schema parameter for improved type safety:

- **BREAKING**: Schema parameter is now required (was optional)
- Validates all cached data at runtime to ensure type correctness
- Automatically invalidates and recomputes corrupted cache entries
- Protects against cache corruption and API version mismatches
- Eliminates unsafe type assertions (removed `as A` cast)

**Note**: This is a breaking change in a pre-1.0 package. Per semver, breaking changes in pre-1.0 versions are acceptable as minor releases.

**Migration Guide:**

```typescript
// Before (schema was optional):
cache.getCached(request, compute)

// After (schema is required):
cache.getCached(request, compute, responseSchema)

// For arbitrary data, use Schema.Unknown:
cache.getCached(request, compute, Schema.Unknown)
```

Additional improvements:

- CredentialService: Added explicit scrypt parameters (N=16384, r=8, p=1, maxmem=32MB) for improved security
- Enhanced CacheService documentation with required schema validation
- Updated all examples to include schema parameter
