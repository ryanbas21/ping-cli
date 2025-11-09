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

export { RetryService, RetryServiceLive } from "./RetryService.js"

import { Layer } from "effect"
import { CacheServiceLive } from "./CacheService.js"
import { RetryServiceLive } from "./RetryService.js"

/**
 * Combined layer providing both retry logic and caching.
 *
 * This is a convenience layer that merges RetryServiceLive and CacheServiceLive.
 * Commands can use this to get both services at once.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { readPingOneUser } from "./HttpClient/PingOneClient.js"
 * import { EnhancedHttpClientLive } from "./Services/index.js"
 *
 * const program = readPingOneUser({ envId, token, userId }).pipe(
 *   Effect.provide(EnhancedHttpClientLive)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const EnhancedHttpClientLive = Layer.merge(
  RetryServiceLive,
  CacheServiceLive
)
