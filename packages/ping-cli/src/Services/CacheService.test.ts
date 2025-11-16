import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { CacheService, CacheServiceLive } from "./CacheService.js"

describe("CacheService", () => {
  describe("getCached", () => {
    it.effect("should cache GET requests", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-456").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "user-456", name: "Test User" }
        })

        // First call should execute compute
        const result1 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.id, "user-456")

        // Second call should return cached value without executing compute
        const result2 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1) // Still 1 - didn't execute again
        assert.strictEqual(result2.id, "user-456")
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should not cache POST requests", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.post("https://api.pingone.com/v1/environments/env-123/users").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "user-new", name: "New User" }
        })

        // First call should execute compute
        const result1 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.id, "user-new")

        // Second call should also execute compute (POST not cached)
        const result2 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 2) // Executed again
        assert.strictEqual(result2.id, "user-new")
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should not cache PUT requests", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.put("https://api.pingone.com/v1/environments/env-123/users/user-456").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "user-456", name: "Updated User" }
        })

        // First call
        yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)

        // Second call should execute again (PUT not cached)
        yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 2)
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should not cache PATCH requests", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.patch("https://api.pingone.com/v1/environments/env-123/users/user-456").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "user-456", name: "Patched User" }
        })

        yield* cache.getCached(request, compute)
        yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 2) // Both executed
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should invalidate cache on DELETE requests", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        // First, cache a GET request
        const getRequest = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-456").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let getCallCount = 0
        const getCompute = Effect.sync(() => {
          getCallCount++
          return { id: "user-456", name: "Test User" }
        })

        // Cache the GET request
        yield* cache.getCached(getRequest, getCompute)
        assert.strictEqual(getCallCount, 1)

        // Verify it's cached
        yield* cache.getCached(getRequest, getCompute)
        assert.strictEqual(getCallCount, 1) // Still 1 - from cache

        // Now DELETE the same resource (should invalidate cache)
        const deleteRequest = HttpClientRequest.del("https://api.pingone.com/v1/environments/env-123/users/user-456")
          .pipe(
            HttpClientRequest.bearerToken("test-token")
          )

        yield* cache.getCached(deleteRequest, Effect.void)

        // Next GET should re-execute compute (cache was invalidated)
        yield* cache.getCached(getRequest, getCompute)
        assert.strictEqual(getCallCount, 2) // Executed again after invalidation
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should maintain separate caches for different resource types", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        // Cache a user
        const userRequest = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-123")
          .pipe(
            HttpClientRequest.bearerToken("test-token")
          )

        let userCallCount = 0
        const userCompute = Effect.sync(() => {
          userCallCount++
          return { id: "user-123", type: "user" }
        })

        // Cache a group
        const groupRequest = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/groups/group-456")
          .pipe(
            HttpClientRequest.bearerToken("test-token")
          )

        let groupCallCount = 0
        const groupCompute = Effect.sync(() => {
          groupCallCount++
          return { id: "group-456", type: "group" }
        })

        // Cache both
        yield* cache.getCached(userRequest, userCompute)
        yield* cache.getCached(groupRequest, groupCompute)
        assert.strictEqual(userCallCount, 1)
        assert.strictEqual(groupCallCount, 1)

        // Verify both are cached
        yield* cache.getCached(userRequest, userCompute)
        yield* cache.getCached(groupRequest, groupCompute)
        assert.strictEqual(userCallCount, 1) // Still cached
        assert.strictEqual(groupCallCount, 1) // Still cached
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should maintain separate caches per authentication token", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const url = "https://api.pingone.com/v1/environments/env-123/users/user-123"

        // Request with token 1
        const request1 = HttpClientRequest.get(url).pipe(
          HttpClientRequest.bearerToken("token-1")
        )

        // Request with token 2 (same URL, different auth)
        const request2 = HttpClientRequest.get(url).pipe(
          HttpClientRequest.bearerToken("token-2")
        )

        let callCount1 = 0
        const compute1 = Effect.sync(() => {
          callCount1++
          return { id: "user-123", token: "token-1" }
        })

        let callCount2 = 0
        const compute2 = Effect.sync(() => {
          callCount2++
          return { id: "user-123", token: "token-2" }
        })

        // Cache with token 1
        const result1a = yield* cache.getCached(request1, compute1)
        assert.strictEqual(callCount1, 1)
        assert.strictEqual(result1a.token, "token-1")

        // Cache with token 2 (should execute, different cache key)
        const result2a = yield* cache.getCached(request2, compute2)
        assert.strictEqual(callCount2, 1)
        assert.strictEqual(result2a.token, "token-2")

        // Verify both are cached independently
        yield* cache.getCached(request1, compute1)
        yield* cache.getCached(request2, compute2)
        assert.strictEqual(callCount1, 1) // Still cached
        assert.strictEqual(callCount2, 1) // Still cached
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should bypass cache for unrecognized resource types", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        // URL with no recognized resource type
        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/unknown-resource").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "unknown", type: "unknown" }
        })

        // First call
        yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)

        // Second call should also execute (unrecognized resource not cached)
        yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 2)
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should cache populations separately", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/populations/pop-789")
          .pipe(
            HttpClientRequest.bearerToken("test-token")
          )

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "pop-789", name: "Test Population" }
        })

        // First call should execute and cache
        const result1 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.id, "pop-789")

        // Second call should use cache
        const result2 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1) // Still 1 - from cache
        assert.strictEqual(result2.id, "pop-789")
      }).pipe(Effect.provide(CacheServiceLive)))
  })

  describe("invalidate", () => {
    it.effect("should invalidate specific resource cache entries", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        // Cache two different users
        const request1 = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-1").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        const request2 = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-2").pipe(
          HttpClientRequest.bearerToken("test-token")
        )

        let callCount1 = 0
        const compute1 = Effect.sync(() => {
          callCount1++
          return { id: "user-1" }
        })

        let callCount2 = 0
        const compute2 = Effect.sync(() => {
          callCount2++
          return { id: "user-2" }
        })

        // Cache both users
        yield* cache.getCached(request1, compute1)
        yield* cache.getCached(request2, compute2)
        assert.strictEqual(callCount1, 1)
        assert.strictEqual(callCount2, 1)

        // Invalidate user-1's cache
        yield* cache.invalidate("users", "/environments/env-123/users/user-1")

        // user-1 should re-execute, user-2 should still be cached
        yield* cache.getCached(request1, compute1)
        yield* cache.getCached(request2, compute2)
        assert.strictEqual(callCount1, 2) // Re-executed
        assert.strictEqual(callCount2, 1) // Still cached
      }).pipe(Effect.provide(CacheServiceLive)))
  })

  describe("Schema Validation", () => {
    const UserSchema = Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      email: Schema.String
    })

    it.effect("should validate cached values with schema", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-123")
          .pipe(HttpClientRequest.bearerToken("test-token"))

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "user-123", name: "Test User", email: "test@example.com" }
        })

        // First call with schema - should compute and cache
        const result1 = yield* cache.getCached(request, compute, UserSchema)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.id, "user-123")
        assert.strictEqual(result1.name, "Test User")

        // Second call with schema - should return validated cached value
        const result2 = yield* cache.getCached(request, compute, UserSchema)
        assert.strictEqual(callCount, 1) // Still 1 - from cache
        assert.strictEqual(result2.id, "user-123")
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should recompute when cached value fails schema validation", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-123")
          .pipe(HttpClientRequest.bearerToken("test-token"))

        let callCount = 0

        // First compute returns invalid data (missing email field)
        const invalidCompute = Effect.sync(() => {
          callCount++
          return { id: "user-123", name: "Test User" }
        })

        // Second compute returns valid data
        const validCompute = Effect.sync(() => {
          callCount++
          return { id: "user-123", name: "Test User", email: "test@example.com" }
        })

        // First call without schema - caches invalid data
        const result1 = yield* cache.getCached(request, invalidCompute)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.id, "user-123")

        // Second call WITH schema - should detect invalid cached data and recompute
        const result2 = yield* cache.getCached(request, validCompute, UserSchema)
        assert.strictEqual(callCount, 2) // Recomputed because validation failed
        assert.strictEqual(result2.id, "user-123")
        assert.strictEqual(result2.email, "test@example.com")
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should invalidate cache entry on validation failure", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-123")
          .pipe(HttpClientRequest.bearerToken("test-token"))

        // First, cache invalid data (without schema)
        let callCount = 0
        const invalidCompute = Effect.sync(() => {
          callCount++
          return { id: "user-123", name: "Test User" } // Missing email
        })

        yield* cache.getCached(request, invalidCompute)
        assert.strictEqual(callCount, 1)

        // Try to retrieve with schema (should fail validation and recompute)
        const validCompute = Effect.sync(() => {
          callCount++
          return { id: "user-123", name: "Test User", email: "test@example.com" }
        })

        const result = yield* cache.getCached(request, validCompute, UserSchema)
        assert.strictEqual(callCount, 2) // Recomputed
        assert.strictEqual(result.email, "test@example.com")

        // Verify new valid data is now cached
        yield* cache.getCached(request, validCompute, UserSchema)
        assert.strictEqual(callCount, 2) // Still 2 - using cached valid data
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should work without schema for backward compatibility", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-123")
          .pipe(HttpClientRequest.bearerToken("test-token"))

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return { id: "user-123", arbitrary: "data", canBe: "anything" }
        })

        // Works without schema (legacy behavior)
        const result1 = yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.id, "user-123")

        // Still cached without schema
        yield* cache.getCached(request, compute)
        assert.strictEqual(callCount, 1)
      }).pipe(Effect.provide(CacheServiceLive)))

    it.effect("should handle complex nested schemas", () =>
      Effect.gen(function*() {
        const cache = yield* CacheService

        const AddressSchema = Schema.Struct({
          street: Schema.String,
          city: Schema.String,
          country: Schema.String
        })

        const ComplexUserSchema = Schema.Struct({
          id: Schema.String,
          name: Schema.String,
          email: Schema.String,
          address: AddressSchema,
          tags: Schema.Array(Schema.String)
        })

        const request = HttpClientRequest.get("https://api.pingone.com/v1/environments/env-123/users/user-456")
          .pipe(HttpClientRequest.bearerToken("test-token"))

        let callCount = 0
        const compute = Effect.sync(() => {
          callCount++
          return {
            id: "user-456",
            name: "Complex User",
            email: "complex@example.com",
            address: {
              street: "123 Main St",
              city: "Test City",
              country: "US"
            },
            tags: ["admin", "verified"]
          }
        })

        // Cache with complex schema
        const result1 = yield* cache.getCached(request, compute, ComplexUserSchema)
        assert.strictEqual(callCount, 1)
        assert.strictEqual(result1.address.city, "Test City")
        assert.strictEqual(result1.tags.length, 2)

        // Verify cached with validation
        const result2 = yield* cache.getCached(request, compute, ComplexUserSchema)
        assert.strictEqual(callCount, 1) // From cache
        assert.strictEqual(result2.address.city, "Test City")
      }).pipe(Effect.provide(CacheServiceLive)))
  })
})
