#!/usr/bin/env node
import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { config } from "dotenv"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { PingCli } from "./PingCommand.js"
import { CacheServiceLive, RetryServiceLive } from "./Services/index.js"

// Load .env file into process.env
config()

/**
 * Base layers for the CLI application.
 *
 * Provides:
 * - NodeHttpClient.layer: HTTP client for making API requests
 * - NodeContext.layer: Node.js runtime context
 *
 * ## Optional Service Layers
 *
 * Commands can opt-in to additional service layers for retry and caching:
 *
 * ### Adding Retry Logic Globally
 * To add retry logic to all commands, import and merge RetryServiceLive:
 *
 * ```ts
 * import { RetryServiceLive } from "./Services/index.js"
 *
 * const layers = Layer.merge(
 *   NodeHttpClient.layer,
 *   NodeContext.layer,
 *   RetryServiceLive
 * )
 * ```
 *
 * ### Adding Caching Globally
 * To add caching to all commands, import and merge CacheServiceLive:
 *
 * ```ts
 * import { CacheServiceLive } from "./Services/index.js"
 *
 * const layers = Layer.merge(
 *   NodeHttpClient.layer,
 *   NodeContext.layer,
 *   CacheServiceLive
 * )
 * ```
 *
 * ### Adding Both Retry and Caching
 * Use the combined EnhancedHttpClientLive layer:
 *
 * ```ts
 * import { EnhancedHttpClientLive } from "./Services/index.js"
 *
 * const layers = Layer.merge(
 *   NodeHttpClient.layer,
 *   NodeContext.layer,
 *   EnhancedHttpClientLive
 * )
 * ```
 *
 * ### Per-Command Opt-in (Recommended)
 * Individual commands can opt-in by providing the layer when executing:
 *
 * ```ts
 * // In a command file
 * import { RetryServiceLive } from "../Services/index.js"
 *
 * const program = readPingOneUser({ ... }).pipe(
 *   Effect.provide(RetryServiceLive)
 * )
 * ```
 *
 * @since 0.0.1
 */
const layers = Layer.mergeAll(
  NodeHttpClient.layer,
  NodeContext.layer,
  RetryServiceLive,
  CacheServiceLive
)

PingCli(process.argv).pipe(Effect.provide(layers), NodeRuntime.runMain)
