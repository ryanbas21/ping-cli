/**
 * OAuth 2.0 Client for PingOne Token Endpoint
 *
 * Provides functions for obtaining and refreshing OAuth access tokens
 * using the client credentials grant flow.
 *
 * @internal
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
import * as Encoding from "effect/Encoding"
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
    const base64Credentials = Encoding.encodeBase64(credentials)

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
 * @param expiresAt - Unix timestamp (milliseconds) when token expires
 * @param bufferSeconds - Buffer time before expiration to trigger refresh (defaults to 300 seconds)
 * @returns True if token is still valid, false if expired or about to expire
 *
 * @since 0.0.3
 * @category utilities
 */
export const isTokenValid = (expiresAt: number, bufferSeconds?: number): boolean => {
  const now = DateTime.toEpochMillis(DateTime.unsafeNow())
  const effectiveBuffer = bufferSeconds ?? 300
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
 * @since 0.0.3
 * @category utilities
 */
export const calculateExpirationTimestamp = (expiresIn: number): number =>
  DateTime.toEpochMillis(
    DateTime.add(DateTime.unsafeNow(), { millis: Duration.toMillis(Duration.seconds(expiresIn)) })
  )
