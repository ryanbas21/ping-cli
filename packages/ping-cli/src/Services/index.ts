/**
 * Service layer exports for the PingOne CLI.
 *
 * This module provides Effect-ts service layers for:
 * - **HttpClientWithRetry**: Wrapper layer that adds automatic retry logic to HttpClient
 * - **CacheService**: Response caching with schema validation (used in helpers)
 * - **RetryService**: Retry logic service (used internally by HttpClientWithRetry)
 * - **CredentialService**: Secure credential storage
 * - **OAuthService**: OAuth token management
 *
 * ## Architecture
 *
 * Retry logic is applied via the wrapper layer pattern at app entry point:
 * - HttpClientWithRetry wraps HttpClient.execute with retry logic
 * - All HTTP requests automatically get retry behavior
 * - No need to yield RetryService in application code
 *
 * Caching is applied via helper functions (requires schema validation):
 * - Use `executeCachedRequest` helper for cached operations
 * - Use `executeRequest` helper for non-cached operations
 *
 * @internal
 * @since 0.0.1
 * @module Services
 */

export {
  /**
   * Context tag for CacheService.
   *
   * Provides response caching with schema validation for PingOne API requests.
   * Each resource type (users, groups, applications, populations) has its own
   * cache instance with independent TTL and capacity settings.
   *
   * @since 0.0.1
   * @category services
   */
  CacheService,
  /**
   * Live implementation of CacheService.
   *
   * Creates separate cache instances for each resource type with:
   * - TTL: 5 minutes
   * - Capacity: 100 entries per resource type
   *
   * @since 0.0.1
   * @category layers
   */
  CacheServiceLive,
  /**
   * Resource types that can be cached.
   *
   * Supported types: "users" | "groups" | "applications" | "populations"
   *
   * @since 0.0.1
   * @category models
   */
  type ResourceType
} from "./CacheService.js"

export {
  /**
   * Context tag for CredentialService.
   *
   * Provides secure credential storage across multiple platforms.
   * Supports keychain, encrypted file fallback, and environment variables.
   *
   * @since 0.0.3
   * @category services
   */
  CredentialService,
  /**
   * Live implementation of CredentialService.
   *
   * Provides secure credential storage with automatic fallback:
   * 1. Environment variables (read-only)
   * 2. System keychain (preferred for storage)
   * 3. Encrypted file (fallback)
   *
   * @since 0.0.3
   * @category layers
   */
  CredentialServiceLive
} from "./CredentialService.js"

export {
  /**
   * Wrapper layer that adds retry logic to HttpClient.
   *
   * Wraps HttpClient.execute to apply automatic retry logic for transient failures.
   * This is a cross-cutting concern applied via the wrapper layer pattern.
   *
   * @since 0.3.0
   * @category layers
   */
  HttpClientWithRetry
} from "./HttpClientWithRetry.js"

export {
  /**
   * Context tag for OAuthService.
   *
   * Orchestrates OAuth client credentials flow with automatic token refresh.
   * Manages token lifecycle including acquisition, caching, and expiration.
   *
   * @since 0.0.3
   * @category services
   */
  OAuthService,
  /**
   * Live implementation of OAuthService.
   *
   * Provides OAuth token management with in-memory caching and automatic refresh.
   *
   * @since 0.0.3
   * @category layers
   */
  OAuthServiceLive
} from "./OAuthService.js"

export {
  /**
   * Context tag for RetryService.
   *
   * Provides retry logic for HTTP requests with exponential backoff.
   * Retries transient errors (network failures, rate limits, server errors).
   *
   * @since 0.0.1
   * @category services
   */
  RetryService,
  /**
   * Live implementation of RetryService.
   *
   * Provides retry logic with exponential backoff and Retry-After header support.
   *
   * @since 0.0.1
   * @category layers
   */
  RetryServiceLive
} from "./RetryService.js"
