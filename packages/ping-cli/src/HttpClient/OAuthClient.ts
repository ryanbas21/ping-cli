/**
 * OAuth 2.0 Client for PingOne Token Endpoint
 *
 * Provides functions for obtaining and refreshing OAuth access tokens
 * using the client credentials grant flow.
 *
 * @since 0.0.3
 */
import type { HttpClientError } from "@effect/platform"
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import type { ParseResult } from "effect"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as Number from "effect/Number"
import * as Option from "effect/Option"
import { OAuthFlowError } from "../Errors.js"
import { OAuthErrorResponse, OAuthTokenResponse } from "./OAuthSchemas.js"

/**
 * Builds the PingOne OAuth token endpoint URL for a given environment.
 *
 * PingOne uses regional auth endpoints:
 * - North America: auth.pingone.com
 * - Europe: auth.pingone.eu
 * - Asia Pacific: auth.pingone.asia
 * - Canada: auth.pingone.ca
 *
 * @param environmentId - PingOne environment ID
 * @param region - PingOne region (defaults to "com" for North America)
 * @returns The OAuth token endpoint URL
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect"
 *
 * const endpoint = buildTokenEndpoint("env-abc123", "com")
 * // Returns: "https://auth.pingone.com/env-abc123/as/token"
 * ```
 *
 * @since 0.0.3
 * @category constructors
 */
export const buildTokenEndpoint = (environmentId: string, region = "com"): string =>
  `https://auth.pingone.${region}/${environmentId}/as/token`

/**
 * Exchanges client credentials for an OAuth access token.
 *
 * Performs the OAuth 2.0 client credentials grant flow:
 * 1. Sends client_id and client_secret to PingOne token endpoint
 * 2. Receives access_token with expiration time
 * 3. Returns token response or fails with OAuthFlowError
 *
 * @param params - OAuth client credentials parameters
 * @returns Effect yielding OAuthTokenResponse or failing with OAuthFlowError
 *
 * @example
 * ```ts
 * import * as Effect from "effect/Effect"
 *
 * const program = Effect.gen(function* () {
 *   const tokenResponse = yield* exchangeCredentialsForToken({
 *     clientId: "abc123-client-id",
 *     clientSecret: "xyz789-secret",
 *     tokenEndpoint: "https://auth.pingone.com/env-123/as/token"
 *   })
 *
 *   console.log("Access token expires in:", tokenResponse.expires_in, "seconds")
 *   return tokenResponse.access_token
 * })
 * ```
 *
 * @since 0.0.3
 * @category requests
 */
export const exchangeCredentialsForToken = (params: {
  readonly clientId: string
  readonly clientSecret: string
  readonly tokenEndpoint: string
}): Effect.Effect<
  OAuthTokenResponse,
  OAuthFlowError | HttpClientError.HttpClientError | ParseResult.ParseError,
  HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    // Use Basic Authentication (Authorization header) instead of body parameters
    // This is required for PingOne Canada and some other regions
    const credentials = `${params.clientId}:${params.clientSecret}`
    const base64Credentials = Buffer.from(credentials).toString("base64")

    const request = HttpClientRequest.post(params.tokenEndpoint).pipe(
      HttpClientRequest.bodyText("grant_type=client_credentials"),
      HttpClientRequest.setHeader("Content-Type", "application/x-www-form-urlencoded"),
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Authorization", `Basic ${base64Credentials}`)
    )

    const client = yield* HttpClient.HttpClient
    const response = yield* client.execute(request)

    if (response.status >= 200 && response.status < 300) {
      return yield* HttpClientResponse.schemaBodyJson(OAuthTokenResponse)(response)
    }

    const errorResponse = yield* HttpClientResponse.schemaBodyJson(OAuthErrorResponse)(response).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          new OAuthErrorResponse({
            error: "unknown_error",
            error_description: `HTTP ${response.status}`
          })
        )
      )
    )

    return yield* Effect.fail(
      new OAuthFlowError({
        message: "Failed to exchange client credentials for access token",
        cause: errorResponse.error_description ?? errorResponse.error,
        step: "token_exchange",
        context: {
          clientId: params.clientId,
          tokenEndpoint: params.tokenEndpoint
        }
      })
    )
  })

/**
 * Validates an OAuth access token by checking expiration.
 *
 * Determines if a cached token is still valid or needs refresh.
 * Tokens are considered expired if less than the configured buffer time remains.
 *
 * The buffer time can be configured via the `PINGONE_TOKEN_BUFFER_SECONDS` environment variable.
 * Defaults to 300 seconds (5 minutes) if not set.
 *
 * @param expiresAt - Unix timestamp (milliseconds) when token expires
 * @param bufferSeconds - Buffer time before expiration to trigger refresh (defaults to PINGONE_TOKEN_BUFFER_SECONDS env var or 300 seconds)
 * @returns True if token is still valid, false if expired or about to expire
 *
 * @example
 * ```ts
 * const now = DateTime.unsafeNow()
 * const tokenExpiresAt = DateTime.toEpochMillis(DateTime.add(now, { hours: 1 }))
 * const isValid = isTokenValid(tokenExpiresAt)
 * // Returns: true
 *
 * const aboutToExpire = DateTime.toEpochMillis(DateTime.add(now, { minutes: 2 }))
 * const stillValid = isTokenValid(aboutToExpire)
 * // Returns: false (less than configured buffer)
 *
 * // With custom buffer via environment variable
 * // PINGONE_TOKEN_BUFFER_SECONDS=60 p1-cli auth status
 * // Uses 60 second buffer instead of default 300 seconds
 * ```
 *
 * @since 0.0.3
 * @category utilities
 */
export const isTokenValid = (expiresAt: number, bufferSeconds?: number): boolean => {
  const now = DateTime.toEpochMillis(DateTime.unsafeNow())
  const effectiveBuffer = bufferSeconds ??
    (process.env.PINGONE_TOKEN_BUFFER_SECONDS
      ? Function.pipe(
        process.env.PINGONE_TOKEN_BUFFER_SECONDS,
        Number.parse,
        Option.getOrElse(() => 300)
      )
      : 300)
  const bufferMillis = Duration.toMillis(Duration.seconds(effectiveBuffer))
  return expiresAt - now > bufferMillis
}

/**
 * Calculates the expiration timestamp for an OAuth token.
 *
 * Converts the expires_in value from token response to an absolute
 * Unix timestamp for easier expiration checking.
 *
 * @param expiresIn - Seconds until token expiration (from OAuth response)
 * @returns Unix timestamp (milliseconds) when token will expire
 *
 * @example
 * ```ts
 * const tokenResponse = {
 *   access_token: "...",
 *   token_type: "Bearer",
 *   expires_in: 3600
 * }
 *
 * const expiresAt = calculateExpirationTimestamp(tokenResponse.expires_in)
 * console.log("Token expires at:", DateTime.unsafeMake(expiresAt))
 * ```
 *
 * @since 0.0.3
 * @category utilities
 */
export const calculateExpirationTimestamp = (expiresIn: number): number =>
  DateTime.toEpochMillis(
    DateTime.add(DateTime.unsafeNow(), { millis: Duration.toMillis(Duration.seconds(expiresIn)) })
  )
