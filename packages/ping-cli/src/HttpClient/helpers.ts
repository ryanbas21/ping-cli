/**
 * HTTP Client Helper Utilities
 *
 * Provides reusable utilities for making HTTP requests with standard
 * error handling, schema validation, and retry logic.
 *
 * @since 0.0.2
 */
import type { HttpClientError, HttpClientRequest, HttpClientResponse as HttpClientResponseType } from "@effect/platform"
import { HttpClient, HttpClientResponse } from "@effect/platform"
import type { ParseResult, Schema } from "effect"
import { Effect } from "effect"
import { PingOneApiError } from "../Errors.js"
import { CacheService, RetryService } from "../Services/index.js"

/**
 * Executes an HTTP request with standard error handling and schema validation.
 *
 * This helper encapsulates the common pattern of:
 * 1. Executing an HTTP request via HttpClient
 * 2. Checking response status (2xx = success)
 * 3. Parsing response body with a schema
 * 4. Applying retry logic
 *
 * @param request - The HTTP request to execute
 * @param responseSchema - Schema to validate and parse the response body
 * @returns Effect that yields the parsed response or fails with PingOneApiError
 *
 * @since 0.0.2
 * @category HTTP Helpers
 */
export const executeRequest = <A, I, R>(
  request: HttpClientRequest.HttpClientRequest,
  responseSchema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  PingOneApiError | HttpClientError.HttpClientError | ParseResult.ParseError,
  HttpClient.HttpClient | RetryService | R
> =>
  RetryService.pipe(
    Effect.flatMap((retry) =>
      retry.retryableRequest(
        HttpClient.HttpClient.pipe(
          Effect.flatMap((client) => client.execute(request)),
          Effect.flatMap((response) =>
            Effect.if(response.status >= 200 && response.status < 300, {
              onTrue: () => HttpClientResponse.schemaBodyJson(responseSchema)(response),
              onFalse: () =>
                Effect.fail(
                  new PingOneApiError({
                    status: response.status,
                    message: `PingOne API request failed with status ${response.status}`
                  })
                )
            })
          )
        )
      )
    )
  )

/**
 * Executes a cached HTTP request with standard error handling and schema validation.
 *
 * Similar to executeRequest but integrates with CacheService for GET request caching.
 * Cache behavior:
 * - GET requests: Cached with 5-minute TTL
 * - POST/PUT/PATCH/DELETE: Bypass cache and trigger invalidation
 *
 * @param request - The HTTP request to execute
 * @param responseSchema - Schema to validate and parse the response body
 * @returns Effect that yields the parsed response (possibly from cache)
 *
 * @since 0.0.2
 * @category HTTP Helpers
 */
export const executeCachedRequest = <A, I, R>(
  request: HttpClientRequest.HttpClientRequest,
  responseSchema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  PingOneApiError | HttpClientError.HttpClientError | ParseResult.ParseError,
  HttpClient.HttpClient | RetryService | CacheService | R
> =>
  Effect.gen(function*() {
    const cache = yield* CacheService

    const compute = executeRequest(request, responseSchema)

    return yield* cache.getCached(request, compute)
  })

/**
 * Executes an HTTP request without response body parsing.
 *
 * Useful for DELETE operations or endpoints that return no content (204).
 * Only checks status code and returns the raw response.
 *
 * @param request - The HTTP request to execute
 * @returns Effect that yields the raw HttpClientResponse
 *
 * @since 0.0.2
 * @category HTTP Helpers
 */
export const executeVoidRequest = (
  request: HttpClientRequest.HttpClientRequest
): Effect.Effect<
  HttpClientResponseType.HttpClientResponse,
  PingOneApiError | HttpClientError.HttpClientError,
  HttpClient.HttpClient | RetryService
> =>
  RetryService.pipe(
    Effect.flatMap((retry) =>
      retry.retryableRequest(
        HttpClient.HttpClient.pipe(
          Effect.flatMap((client) => client.execute(request)),
          Effect.flatMap((response) =>
            Effect.if(response.status >= 200 && response.status < 300, {
              onTrue: () => Effect.succeed(response),
              onFalse: () =>
                Effect.fail(
                  new PingOneApiError({
                    status: response.status,
                    message: `PingOne API request failed with status ${response.status}`
                  })
                )
            })
          )
        )
      )
    )
  )
