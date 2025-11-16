#!/usr/bin/env node
import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { config } from "dotenv"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { PingCli } from "./PingCommand.js"
import {
  CacheServiceLive,
  CredentialServiceLive,
  HttpClientWithRetry,
  OAuthServiceLive,
  RetryServiceLive
} from "./Services/index.js"

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

/**
 * Layer Composition using Wrapper Pattern.
 *
 * **Architecture:**
 * We use a wrapper layer to add retry logic to HttpClient.
 * Caching cannot be done at the HttpClient layer because it requires schema validation.
 *
 * **Layer Stack:**
 * 1. Base: NodeHttpClient.layer
 * 2. Retry: HttpClientWithRetry wraps base with retry logic
 *
 * **Caching:**
 * Caching is handled by CacheService in the executeCachedRequest helper function,
 * after schema validation of the response body.
 *
 * **Benefits:**
 * - HttpClient consumers only depend on HttpClient.HttpClient
 * - Retry is automatic for all HTTP requests
 * - Caching is opt-in via executeCachedRequest helper
 * - Clean separation of concerns
 */

// Compose HttpClient wrapper: Base -> Retry
const httpClientLayer = HttpClientWithRetry.pipe(
  Layer.provide(
    Layer.mergeAll(
      NodeHttpClient.layer,
      RetryServiceLive
    )
  )
)

/**
 * OAuth Service Layer composition.
 *
 * OAuthService requires HttpClient and CredentialService.
 * HttpClient now includes retry and caching via wrapper layers.
 */
const oauthLayer = OAuthServiceLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      httpClientLayer,
      CredentialServiceLive
    )
  )
)

/**
 * Final application layer composition.
 *
 * Provides all services needed by CLI commands:
 * - HttpClient (with retry and caching)
 * - NodeContext (Node.js runtime)
 * - OAuthService (for auth commands)
 * - CredentialService (for credential storage)
 * - RetryService (for explicit retry control)
 * - CacheService (for explicit cache control)
 */
const layers = Layer.mergeAll(
  httpClientLayer,
  NodeContext.layer,
  oauthLayer,
  CredentialServiceLive,
  RetryServiceLive,
  CacheServiceLive
)

PingCli(process.argv).pipe(Effect.provide(layers), NodeRuntime.runMain)
