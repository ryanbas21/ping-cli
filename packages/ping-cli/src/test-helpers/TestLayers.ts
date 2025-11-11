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
import { StoredCredentials } from "../HttpClient/OAuthSchemas.js"
import { CacheService, OAuthService, RetryService } from "../Services/index.js"

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
 * Mock OAuthService that returns a test access token
 *
 * @since 0.0.3
 */
export const MockOAuthServiceLive = Layer.succeed(
  OAuthService,
  OAuthService.of({
    getAccessToken: () => Effect.succeed("test-oauth-token"),
    storeCredentials: () => Effect.void,
    getCredentials: () =>
      Effect.succeed(
        new StoredCredentials({
          clientId: "test-client-id",
          clientSecret: "test-client-secret",
          environmentId: "test-env-id",
          tokenEndpoint: "https://auth.pingone.com/test-env-id/as/token"
        })
      ),
    clearAuth: () => Effect.void,
    getAuthStatus: () =>
      Effect.succeed({
        hasCredentials: true,
        hasValidToken: true,
        clientId: "test-client-id",
        environmentId: "test-env-id",
        tokenExpiresAt: Date.now() + 3600000
      })
  })
)

/**
 * Combined mock services layer for testing
 */
export const MockServicesLive = Layer.mergeAll(
  MockRetryServiceLive,
  MockCacheServiceLive,
  MockOAuthServiceLive
)
