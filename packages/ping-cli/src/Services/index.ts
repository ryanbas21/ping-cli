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

export { CacheService, CacheServiceLive, type ResourceType } from "./CacheService.js"

export { CredentialService, CredentialServiceLive } from "./CredentialService.js"

export { HttpClientWithRetry } from "./HttpClientWithRetry.js"

export { OAuthService, OAuthServiceLive } from "./OAuthService.js"

export { RetryService, RetryServiceLive } from "./RetryService.js"
