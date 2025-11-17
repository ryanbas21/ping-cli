/**
 * HTTP Client Helper Utilities
 *
 * Provides reusable utilities for making HTTP requests with standard
 * error handling and schema validation.
 *
 * **Architecture Note:**
 * - Retry logic is added via HttpClientWithRetry wrapper layer at app entry point
 * - Caching uses CacheService directly (cannot be done at HttpClient layer due to schema requirement)
 * - All helpers only require HttpClient.HttpClient (+ CacheService for cached requests)
 *
 * @internal
 * @since 0.0.2
 */
import type { HttpClientError, HttpClientRequest, HttpClientResponse as HttpClientResponseType } from "@effect/platform"
import { HttpClient, HttpClientResponse } from "@effect/platform"
import type { ParseResult, Schema } from "effect"
import * as Effect from "effect/Effect"
import { PingOneApiError } from "../Errors.js"
import { CacheService } from "../Services/CacheService.js"

/**
 * Executes an HTTP request with standard error handling and schema validation.
 *
 * This helper encapsulates the common pattern of:
 * 1. Executing an HTTP request via HttpClient
 * 2. Checking response status (2xx = success)
 * 3. Parsing response body with a schema
 *
 * **Cross-Cutting Concerns:**
 * Retry logic and caching are handled by wrapper layers, not in this helper.
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
  HttpClient.HttpClient | R
> =>
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

/**
 * Executes a cached HTTP request with standard error handling and schema validation.
 *
 * **Caching Strategy:**
 * - Wraps the HTTP request execution with CacheService
 * - GET requests are cached with 5-minute TTL
 * - Mutations (POST/PUT/PATCH/DELETE) bypass cache and trigger invalidation
 * - Cached values are validated with the provided schema
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
  HttpClient.HttpClient | CacheService | R
> =>
  CacheService.pipe(
    Effect.flatMap((cache) =>
      cache.getCached(
        request,
        executeRequest(request, responseSchema),
        responseSchema
      )
    )
  )

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
  HttpClient.HttpClient
> =>
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
