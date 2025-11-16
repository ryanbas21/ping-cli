/**
 * Service composition for retry logic and caching in ping-cli.
 *
 * This module provides Effect-ts service layers for:
 * - Retry logic with exponential backoff
 * - Per-resource caching with automatic invalidation
 *
 * ## Usage Pattern (Opt-in)
 *
 * Commands can opt-in to retry and/or caching by providing service layers:
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { readPingOneUser } from "./HttpClient/PingOneClient.js"
 * import { RetryServiceLive } from "./Services/index.js"
 *
 * // Add retry logic to a command
 * const program = readPingOneUser({ envId, token, userId }).pipe(
 *   Effect.provide(RetryServiceLive)
 * )
 * ```
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { readPingOneUser } from "./HttpClient/PingOneClient.js"
 * import { EnhancedHttpClientLive } from "./Services/index.js"
 *
 * // Add both retry and caching
 * const program = readPingOneUser({ envId, token, userId }).pipe(
 *   Effect.provide(EnhancedHttpClientLive)
 * )
 * ```
 *
 * @since 0.0.1
 * @module Services
 */

export { CacheService, CacheServiceLive, type ResourceType } from "./CacheService.js"

export { CredentialService, CredentialServiceLive } from "./CredentialService.js"

export { HttpClientWithRetry } from "./HttpClientWithRetry.js"

export { OAuthService, OAuthServiceLive } from "./OAuthService.js"

export { RetryService, RetryServiceLive } from "./RetryService.js"
