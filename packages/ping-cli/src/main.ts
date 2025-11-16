#!/usr/bin/env node
import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
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

/**
 * Application entry point for the PingOne CLI.
 *
 * Sets up the Effect Layer composition with all required services and starts the CLI.
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
