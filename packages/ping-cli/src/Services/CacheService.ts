import type * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Array from "effect/Array"
import * as Cache from "effect/Cache"
import * as Context from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as Hash from "effect/Hash"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import * as EffectString from "effect/String"

/**
 * Resource types that can be cached.
 *
 * @since 0.0.1
 */
export type ResourceType = "users" | "groups" | "applications" | "populations"

/**
 * Service that provides per-resource caching for HTTP requests.
 *
 * Each resource type (users, groups, applications, populations) has its own
 * cache instance with independent TTL and capacity settings.
 *
 * @since 0.0.1
 */
export interface CacheService {
  /**
   * Gets a cached value or computes it if not present.
   *
   * Only caches GET requests. Other HTTP methods bypass the cache.
   * Cache invalidation occurs on POST/PUT/PATCH/DELETE to the same resource.
   *
   * When a schema is provided, cached values are validated at runtime to ensure
   * type safety. If validation fails, the cache entry is treated as a miss and
   * the value is recomputed.
   *
   * @param request - The HTTP request to cache
   * @param compute - The Effect to compute if cache miss occurs
   * @param schema - Optional schema to validate cached values for type safety
   * @returns The cached or computed result
   *
   * @since 0.0.1
   */
  readonly getCached: <A, E, R>(
    request: HttpClientRequest.HttpClientRequest,
    compute: Effect.Effect<A, E, R>,
    schema?: Schema.Schema<A, any, never>
  ) => Effect.Effect<A, E, R>

  /**
   * Invalidates cache entries for a specific resource type and path.
   *
   * Called automatically on mutating operations (POST/PUT/PATCH/DELETE).
   *
   * @param resourceType - The resource type to invalidate
   * @param urlPath - The URL path to invalidate
   * @returns Effect that completes when invalidation is done
   *
   * @since 0.0.1
   */
  readonly invalidate: (
    resourceType: ResourceType,
    urlPath: string
  ) => Effect.Effect<void>
}

/**
 * Context tag for CacheService.
 *
 * @since 0.0.1
 */
export const CacheService = Context.GenericTag<CacheService>("@services/CacheService")

/**
 * Extracts the resource type from a URL path.
 *
 * @param urlPath - The URL path to analyze
 * @returns The resource type or undefined if not recognized
 *
 * @example
 * extractResourceType("/v1/environments/abc/users/123") // => "users"
 * extractResourceType("/v1/environments/abc/groups") // => "groups"
 *
 * @since 0.0.1
 */
const extractResourceType = (urlPath: string): ResourceType | undefined => {
  if (urlPath.includes("/users")) return "users"
  if (urlPath.includes("/groups")) return "groups"
  if (urlPath.includes("/applications")) return "applications"
  if (urlPath.includes("/populations")) return "populations"
  return undefined
}

/**
 * Generates a cache key from an HTTP request.
 *
 * The cache key combines:
 * - URL path (without host)
 * - HTTP method
 * - Authorization header hash (to separate caches per auth token)
 *
 * @param request - The HTTP request
 * @returns A unique cache key string
 *
 * @since 0.0.1
 */
const generateCacheKey = (request: HttpClientRequest.HttpClientRequest): string => {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // Extract authorization token and hash it
  const authHeader = request.headers.authorization ?? ""
  const authHash = Hash.string(authHeader)

  return `${method}:${path}:${authHash}`
}

/**
 * Determines if an HTTP method should be cached.
 *
 * Only GET requests are cached. Mutating operations (POST/PUT/PATCH/DELETE)
 * bypass the cache and trigger invalidation.
 *
 * @param method - The HTTP method
 * @returns true if the method should be cached
 *
 * @since 0.0.1
 */
const isCacheable = (method: string): boolean => {
  return Function.pipe(method, EffectString.toUpperCase) === "GET"
}

/**
 * Determines if an HTTP method should trigger cache invalidation.
 *
 * @param method - The HTTP method
 * @returns true if the method should invalidate cache
 *
 * @since 0.0.1
 */
const shouldInvalidate = (method: string): boolean => {
  const upper = Function.pipe(method, EffectString.toUpperCase)
  return upper === "POST" || upper === "PUT" || upper === "PATCH" || upper === "DELETE"
}

/**
 * Type representing cached response data.
 *
 * @since 0.0.1
 */
type CachedResponse = unknown

/**
 * Type representing a cache instance for a specific resource type.
 *
 * @since 0.0.1
 */
type ResourceCache = Cache.Cache<string, CachedResponse, never>

/**
 * Validates a cached value using a schema.
 *
 * If validation succeeds, returns the typed value.
 * If validation fails, returns None to indicate cache miss.
 *
 * This provides runtime type safety for cached values, protecting against:
 * - Cache corruption
 * - Version mismatches
 * - Type changes in the codebase
 *
 * @internal
 */
const validateCachedValue = <A>(
  value: unknown,
  schema: Schema.Schema<A, any, never>
): Effect.Effect<Option.Option<A>, never> =>
  Schema.decodeUnknown(schema)(value).pipe(
    Effect.map(Option.some),
    Effect.catchAll(() => Effect.succeed(Option.none()))
  )

/**
 * Live implementation of CacheService.
 *
 * Creates separate cache instances for each resource type with:
 * - TTL: 5 minutes
 * - Capacity: 100 entries per resource type
 *
 * @since 0.0.1
 */
export const CacheServiceLive = Layer.effect(
  CacheService,
  Effect.gen(function*() {
    // Lookup function that returns a placeholder - actual values are set via cache.set()
    const lookup = (_key: string): Effect.Effect<CachedResponse, never, never> =>
      Effect.succeed<CachedResponse>(undefined)

    // Create separate cache instances for each resource type
    const usersCache = yield* Cache.make<string, CachedResponse, never>({
      capacity: 100,
      timeToLive: Duration.minutes(5),
      lookup
    })

    const groupsCache = yield* Cache.make<string, CachedResponse, never>({
      capacity: 100,
      timeToLive: Duration.minutes(5),
      lookup
    })

    const applicationsCache = yield* Cache.make<string, CachedResponse, never>({
      capacity: 100,
      timeToLive: Duration.minutes(5),
      lookup
    })

    const populationsCache = yield* Cache.make<string, CachedResponse, never>({
      capacity: 100,
      timeToLive: Duration.minutes(5),
      lookup
    })

    /**
     * Gets the appropriate cache instance for a resource type.
     */
    const getCacheForResource = (resourceType: ResourceType): ResourceCache => {
      switch (resourceType) {
        case "users":
          return usersCache
        case "groups":
          return groupsCache
        case "applications":
          return applicationsCache
        case "populations":
          return populationsCache
      }
    }

    return CacheService.of({
      getCached: <A, E, R>(
        request: HttpClientRequest.HttpClientRequest,
        compute: Effect.Effect<A, E, R>,
        schema?: Schema.Schema<A, any, never>
      ) => {
        const url = new URL(request.url)
        const resourceType = extractResourceType(url.pathname)

        // If resource type not recognized, bypass cache
        if (resourceType === undefined) {
          return compute
        }

        // If method is mutating, invalidate cache and bypass
        if (shouldInvalidate(request.method)) {
          const cache = getCacheForResource(resourceType)
          const url = new URL(request.url)

          return Effect.gen(function*() {
            // Invalidate all cache entries that match this URL path
            // This ensures GET requests are invalidated when DELETE/PUT/PATCH occurs
            const keys = yield* cache.keys
            const matchingKeys = Array.filter(keys, (key) => key.includes(url.pathname))

            yield* Effect.forEach(matchingKeys, (key) => cache.invalidate(key), {
              concurrency: "unbounded"
            })

            return yield* compute
          })
        }

        // If not cacheable (non-GET), bypass cache
        if (!isCacheable(request.method)) {
          return compute
        }

        // GET request - use cache
        const cache = getCacheForResource(resourceType)
        const cacheKey = generateCacheKey(request)

        return Effect.gen(function*() {
          // Check cache
          const cached = yield* cache.get(cacheKey).pipe(Effect.option)

          // Cache miss - compute, store, and return
          if (cached._tag === "None" || cached.value === undefined) {
            const result = yield* compute
            yield* cache.set(cacheKey, result)
            return result
          }

          // If schema provided, validate cached value
          if (schema !== undefined) {
            const validated = yield* validateCachedValue(cached.value, schema)

            if (validated._tag === "None") {
              // Validation failed - treat as cache miss
              // Invalidate corrupted entry
              yield* cache.invalidate(cacheKey)
              // Compute fresh value
              const result = yield* compute
              yield* cache.set(cacheKey, result)
              return result
            }

            // Validation succeeded - return validated value
            return validated.value
          }

          // No schema - use legacy behavior (unsafe but backward compatible)
          // SAFETY: When no schema is provided, we rely on cache key uniqueness
          // and the assumption that the same key always stores/retrieves the same type A
          return cached.value as A
        })
      },

      invalidate: (resourceType, urlPath) => {
        const cache = getCacheForResource(resourceType)

        return Effect.gen(function*() {
          // Invalidate all keys that match the URL path pattern
          const keys = yield* cache.keys
          const matchingKeys = keys.filter((key) => key.includes(urlPath))

          yield* Effect.forEach(matchingKeys, (key) => cache.invalidate(key), {
            concurrency: "unbounded"
          })
        })
      }
    })
  })
)
