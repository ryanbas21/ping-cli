/**
 * HTTP Client Wrapper with Retry Logic
 *
 * Wraps the base HttpClient to add automatic retry logic for transient failures.
 * This is a cross-cutting concern applied via the wrapper layer pattern.
 *
 * @since 0.3.0
 */
import * as HttpClient from "@effect/platform/HttpClient"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { RetryService } from "./RetryService.js"

/**
 * Wrapper layer that adds retry logic to HttpClient.
 *
 * Wraps the execute method to apply RetryService logic to all HTTP requests.
 * The wrapper requires both the underlying HttpClient and RetryService,
 * then provides a new HttpClient with retry built-in.
 *
 * **Composability:**
 * This layer can be composed with other wrappers (e.g., caching, metrics).
 *
 * **Usage:**
 * ```typescript
 * const AppLayer = Layer.provide(
 *   HttpClientWithRetry,
 *   Layer.mergeAll(NodeHttpClient.layer, RetryServiceLive)
 * )
 * ```
 *
 * @since 0.3.0
 */
export const HttpClientWithRetry = Layer.effect(
  HttpClient.HttpClient,
  Effect.gen(function*() {
    // Yield dependencies during Layer construction
    const underlying = yield* HttpClient.HttpClient
    const retry = yield* RetryService

    // Return wrapped HttpClient with retry logic
    return HttpClient.make((request) => retry.retryableRequest(underlying.execute(request)))
  })
)
