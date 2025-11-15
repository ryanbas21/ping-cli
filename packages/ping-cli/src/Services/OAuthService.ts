/**
 * OAuth Service
 *
 * Orchestrates OAuth client credentials flow with automatic token refresh.
 * Manages token lifecycle including acquisition, caching, and expiration.
 *
 * @since 0.0.3
 */
import * as HttpClient from "@effect/platform/HttpClient"
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as HttpClientResponse from "@effect/platform/HttpClientResponse"
import * as Config from "effect/Config"
import * as Context from "effect/Context"
import * as DateTime from "effect/DateTime"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Ref from "effect/Ref"
import { OAuthFlowError } from "../Errors.js"
import { OAuthErrorResponse, OAuthTokenResponse, type StoredCredentials } from "../HttpClient/OAuthSchemas.js"
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
 * Validates an OAuth access token by checking expiration.
 *
 * @param expiresAt - Unix timestamp (milliseconds) when token expires
 * @param bufferSeconds - Buffer time before expiration to trigger refresh
 * @returns Effect yielding true if token is still valid, false if expired or about to expire
 */
const isTokenValid = (expiresAt: number, bufferSeconds?: number): Effect.Effect<boolean> =>
  Effect.gen(function*() {
    const now = DateTime.toEpochMillis(DateTime.unsafeNow())
    const effectiveBuffer = bufferSeconds ??
      (yield* Config.number("PINGONE_TOKEN_BUFFER_SECONDS").pipe(
        Effect.catchAll(() => Effect.succeed(300))
      ))
    const bufferMillis = Duration.toMillis(Duration.seconds(effectiveBuffer))
    return expiresAt - now > bufferMillis
  })

/**
 * Calculates the expiration timestamp for an OAuth token.
 *
 * @param expiresIn - Seconds until token expiration (from OAuth response)
 * @returns Unix timestamp (milliseconds) when token will expire
 */
const calculateExpirationTimestamp = (expiresIn: number): number =>
  DateTime.toEpochMillis(
    DateTime.add(DateTime.unsafeNow(), { millis: Duration.toMillis(Duration.seconds(expiresIn)) })
  )

/**
 * Live implementation of OAuthService.
 *
 * Provides OAuth token management with in-memory caching and automatic refresh.
 * Yields HttpClient and CredentialService dependencies during Layer construction.
 * All service methods return Effects with no requirements (R = never).
 *
 * @since 0.0.3
 */
export const OAuthServiceLive = Layer.effect(
  OAuthService,
  Effect.gen(function*() {
    // Yield all dependencies during Layer construction
    const credentialService = yield* CredentialService
    const httpClient = yield* HttpClient.HttpClient
    const tokenCache = yield* Ref.make<CachedAccessToken | undefined>(undefined)

    /**
     * Exchanges client credentials for an OAuth access token.
     * Uses the captured httpClient from Layer construction.
     */
    const exchangeCredentialsForToken = (params: {
      readonly clientId: string
      readonly clientSecret: string
      readonly tokenEndpoint: string
    }): Effect.Effect<OAuthTokenResponse, OAuthFlowError> =>
      Effect.gen(function*() {
        const credentials = `${params.clientId}:${params.clientSecret}`
        const base64Credentials = Buffer.from(credentials).toString("base64")

        const request = HttpClientRequest.post(params.tokenEndpoint).pipe(
          HttpClientRequest.bodyText("grant_type=client_credentials"),
          HttpClientRequest.setHeader("Content-Type", "application/x-www-form-urlencoded"),
          HttpClientRequest.setHeader("Accept", "application/json"),
          HttpClientRequest.setHeader("Authorization", `Basic ${base64Credentials}`)
        )

        const response = yield* httpClient.execute(request).pipe(
          Effect.mapError((error) =>
            new OAuthFlowError({
              message: "Failed to execute token request",
              cause: String(error),
              step: "token_exchange"
            })
          )
        )

        if (response.status >= 200 && response.status < 300) {
          return yield* HttpClientResponse.schemaBodyJson(OAuthTokenResponse)(response).pipe(
            Effect.mapError(
              (error) =>
                new OAuthFlowError({
                  message: "Failed to parse token response",
                  cause: String(error),
                  step: "token_exchange"
                })
            )
          )
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
     * Acquires a new access token using stored credentials.
     */
    const acquireNewToken = (
      credentials: StoredCredentials
    ): Effect.Effect<CachedAccessToken, OAuthFlowError> =>
      Effect.gen(function*() {
        const tokenResponse = yield* exchangeCredentialsForToken({
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          tokenEndpoint: credentials.tokenEndpoint
        })

        const expiresAt = calculateExpirationTimestamp(tokenResponse.expires_in)

        return new CachedAccessToken({
          accessToken: tokenResponse.access_token,
          expiresAt
        })
      })

    // Return service implementation with all methods having R = never
    return OAuthService.of({
      getAccessToken: () =>
        Effect.gen(function*() {
          const cachedToken = yield* Ref.get(tokenCache)
          if (cachedToken) {
            const valid = yield* isTokenValid(cachedToken.expiresAt)
            if (valid) {
              return cachedToken.accessToken
            }
          }

          const credentials = yield* credentialService.retrieve().pipe(
            Effect.mapError(
              (error) =>
                new OAuthFlowError({
                  message: "Failed to retrieve credentials",
                  cause: error.message,
                  step: "credential_retrieval"
                })
            )
          )

          const newToken = yield* acquireNewToken(credentials)
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
                step: "credential_storage"
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
                step: "credential_retrieval"
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
                  step: "credential_deletion"
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
            ? yield* isTokenValid(cachedToken.expiresAt)
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
