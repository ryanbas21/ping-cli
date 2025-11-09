/**
 * Test Helper Layers
 *
 * Provides mock service layers for testing HTTP client functions.
 * These layers provide no-op implementations of services to satisfy
 * layer dependencies without actual retry or caching behavior.
 *
 * @since 0.0.1
 */
import { Effect, Layer } from "effect"
import { CacheService, RetryService } from "../Services/index.js"

/**
 * Mock RetryService that passes through requests without retry logic
 */
export const MockRetryServiceLive = Layer.succeed(
  RetryService,
  RetryService.of({
    retryableRequest: <A, E, R>(effect: Effect.Effect<A, E, R>) => effect
  })
)

/**
 * Mock CacheService that passes through requests without caching
 */
export const MockCacheServiceLive = Layer.succeed(
  CacheService,
  CacheService.of({
    getCached: <A, E, R>(
      _request: unknown,
      compute: Effect.Effect<A, E, R>
    ) => compute,
    invalidate: (_resourceType: unknown, _urlPath: string) => Effect.void
  })
)

/**
 * Combined mock services layer for testing
 */
export const MockServicesLive = Layer.mergeAll(
  MockRetryServiceLive,
  MockCacheServiceLive
)
