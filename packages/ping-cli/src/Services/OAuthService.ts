/**
 * OAuth Service
 *
 * Orchestrates OAuth client credentials flow with automatic token refresh.
 * Manages token lifecycle including acquisition, caching, and expiration.
 *
 * @since 0.0.3
 */
import { HttpClient } from "@effect/platform"
import { Context, Effect, Layer, Ref } from "effect"
import { OAuthFlowError } from "../Errors.js"
import { calculateExpirationTimestamp, exchangeCredentialsForToken, isTokenValid } from "../HttpClient/OAuthClient.js"
import type { StoredCredentials } from "../HttpClient/OAuthSchemas.js"
import { CachedAccessToken } from "../HttpClient/OAuthSchemas.js"
import { CredentialService } from "./CredentialService.js"

/**
 * OAuth service interface.
 *
 * Provides high-level OAuth operations with automatic token management.
 *
 * @since 0.0.3
 */
export interface OAuthService {
  /**
   * Gets a valid access token, refreshing if necessary.
   *
   * Flow:
   * 1. Check if cached token exists and is valid
   * 2. If valid, return cached token
   * 3. If expired or missing, acquire new token from credentials
   * 4. Cache new token with expiration
   *
   * @returns Effect yielding access token string or failing with OAuthFlowError
   *
   * @since 0.0.3
   */
  readonly getAccessToken: () => Effect.Effect<string, OAuthFlowError>

  /**
   * Stores OAuth client credentials securely.
   *
   * @param credentials - OAuth credentials to store
   * @returns Effect that succeeds with void or fails with CredentialStorageError
   *
   * @since 0.0.3
   */
  readonly storeCredentials: (
    credentials: StoredCredentials
  ) => Effect.Effect<void, OAuthFlowError>

  /**
   * Retrieves stored OAuth credentials.
   *
   * @returns Effect yielding stored credentials or failing with CredentialStorageError
   *
   * @since 0.0.3
   */
  readonly getCredentials: () => Effect.Effect<StoredCredentials, OAuthFlowError>

  /**
   * Clears all OAuth state (credentials and cached tokens).
   *
   * @returns Effect that succeeds with void
   *
   * @since 0.0.3
   */
  readonly clearAuth: () => Effect.Effect<void, OAuthFlowError>

  /**
   * Gets current authentication status.
   *
   * Returns information about:
   * - Whether credentials are stored
   * - Whether a valid token is cached
   * - Token expiration time
   *
   * @returns Effect yielding authentication status
   *
   * @since 0.0.3
   */
  readonly getAuthStatus: () => Effect.Effect<
    {
      readonly hasCredentials: boolean
      readonly hasValidToken: boolean
      readonly tokenExpiresAt?: number
      readonly clientId?: string
      readonly environmentId?: string
    },
    OAuthFlowError
  >
}

/**
 * Context tag for OAuthService.
 *
 * @since 0.0.3
 */
export const OAuthService = Context.GenericTag<OAuthService>("@services/OAuthService")

/**
 * Acquires a new access token using stored credentials.
 *
 * @param credentials - OAuth credentials
 * @returns Effect yielding cached access token or failing with OAuthFlowError
 */
const acquireNewToken = (
  credentials: StoredCredentials
): Effect.Effect<CachedAccessToken, OAuthFlowError, HttpClient.HttpClient> =>
  Effect.gen(function*() {
    const tokenResponse = yield* exchangeCredentialsForToken({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      tokenEndpoint: credentials.tokenEndpoint
    }).pipe(
      Effect.mapError(
        (error) =>
          new OAuthFlowError({
            message: "Failed to acquire access token",
            cause: error._tag === "OAuthFlowError" ? error.cause : String(error),
            step: "token_exchange"
          })
      )
    )

    const expiresAt = calculateExpirationTimestamp(tokenResponse.expires_in)

    return new CachedAccessToken({
      accessToken: tokenResponse.access_token,
      expiresAt
    })
  })

/**
 * Live implementation of OAuthService.
 *
 * Provides OAuth token management with in-memory caching and automatic refresh.
 * Requires HttpClient and CredentialService dependencies.
 *
 * @since 0.0.3
 */
export const OAuthServiceLive = Layer.effect(
  OAuthService,
  Effect.gen(function*() {
    const credentialService = yield* CredentialService
    const httpClient = yield* HttpClient.HttpClient
    const tokenCache = yield* Ref.make<CachedAccessToken | undefined>(undefined)

    return OAuthService.of({
      getAccessToken: () =>
        Effect.gen(function*() {
          // Check if we have a valid cached token
          const cachedToken = yield* Ref.get(tokenCache)
          if (cachedToken && isTokenValid(cachedToken.expiresAt)) {
            return cachedToken.accessToken
          }

          // Need to acquire new token
          const credentials = yield* credentialService.retrieve().pipe(
            Effect.mapError(
              (error) =>
                new OAuthFlowError({
                  message: "Failed to retrieve credentials",
                  cause: error.message,
                  step: "token_exchange"
                })
            )
          )

          const newToken = yield* acquireNewToken(credentials).pipe(
            Effect.provide(Layer.succeed(HttpClient.HttpClient, httpClient))
          )

          // Cache the new token
          yield* Ref.set(tokenCache, newToken)

          return newToken.accessToken
        }),

      storeCredentials: (credentials: StoredCredentials) =>
        credentialService.store(credentials).pipe(
          Effect.mapError(
            (error) =>
              new OAuthFlowError({
                message: "Failed to store credentials",
                cause: error.message,
                step: "token_exchange"
              })
          )
        ),

      getCredentials: () =>
        credentialService.retrieve().pipe(
          Effect.mapError(
            (error) =>
              new OAuthFlowError({
                message: "Failed to retrieve credentials",
                cause: error.message,
                step: "token_exchange"
              })
          )
        ),

      clearAuth: () =>
        Effect.gen(function*() {
          yield* credentialService.delete().pipe(
            Effect.mapError(
              (error) =>
                new OAuthFlowError({
                  message: "Failed to delete credentials",
                  cause: error.message,
                  step: "token_exchange"
                })
            )
          )
          yield* Ref.set(tokenCache, undefined)
        }),

      getAuthStatus: () =>
        Effect.gen(function*() {
          const cachedToken = yield* Ref.get(tokenCache)

          const credentials = yield* credentialService.retrieve().pipe(
            Effect.option
          )

          if (credentials._tag === "None") {
            return {
              hasCredentials: false,
              hasValidToken: false
            }
          }

          const hasValidToken = cachedToken
            ? isTokenValid(cachedToken.expiresAt)
            : false

          return {
            hasCredentials: true,
            hasValidToken,
            tokenExpiresAt: cachedToken?.expiresAt,
            clientId: credentials.value.clientId,
            environmentId: credentials.value.environmentId
          }
        })
    })
  })
)
