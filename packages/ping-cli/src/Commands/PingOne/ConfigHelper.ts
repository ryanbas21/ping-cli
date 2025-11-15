import { Config, Effect, Predicate, Redacted } from "effect"
import { PingOneAuthError } from "../../Errors.js"
import { OAuthService } from "../../Services/index.js"

/**
 * Default PingOne API base URL.
 *
 * @since 0.0.1
 */
export const DEFAULT_PINGONE_API_URL = "https://api.pingone.com/v1"

/**
 * Gets PingOne API base URL from environment variable or uses default.
 * Priority: PINGONE_API_URL env var > default (https://api.pingone.com/v1)
 *
 * This allows using different PingOne regions or environments:
 * - North America: https://api.pingone.com/v1 (default)
 * - Europe: https://api.pingone.eu/v1
 * - Asia Pacific: https://api.pingone.asia/v1
 * - Canada: https://api.pingone.ca/v1
 *
 * @since 0.0.1
 */
export const getApiBaseUrl = () =>
  Config.string("PINGONE_API_URL").pipe(
    Effect.catchAll(() => Effect.succeed(DEFAULT_PINGONE_API_URL))
  )

/**
 * Gets PingOne environment ID from CLI option, environment variable, or OAuth service.
 * Priority: CLI option > PINGONE_ENV_ID env var > OAuth service (stored credentials)
 *
 * The environment ID can be:
 * 1. Provided directly via --environment-id flag
 * 2. Set via PINGONE_ENV_ID environment variable
 * 3. Automatically obtained from stored credentials (after running 'p1-cli auth login')
 *
 * @since 0.0.1
 */
export const getEnvironmentId = (cliOption: string) =>
  Effect.gen(function*() {
    // Check if CLI option was provided
    if (Predicate.isTruthy(cliOption) && cliOption.trim().length > 0) {
      return cliOption
    }

    // Fall back to PINGONE_ENV_ID environment variable
    const envId = yield* Config.string("PINGONE_ENV_ID").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    )

    if (envId) {
      return envId
    }

    // Fall back to OAuth service (uses stored credentials)
    const oauthService = yield* OAuthService
    const credentials = yield* oauthService.getCredentials().pipe(
      Effect.catchAll(() =>
        Effect.fail(
          new PingOneAuthError({
            message: "No PingOne environment ID provided",
            cause:
              "Run 'p1-cli auth login' to configure OAuth credentials, or set PINGONE_ENV_ID environment variable, or use --environment-id flag",
            context: {
              accessTokenProvided: false
            }
          })
        )
      )
    )

    return credentials.environmentId
  })

/**
 * Gets PingOne OAuth 2.0 access token from CLI option, environment variable, or OAuth service.
 * Priority: CLI option > PINGONE_TOKEN env var > OAuth service (stored credentials)
 *
 * The access token can be:
 * 1. Provided directly via --pingone-token flag (for backward compatibility)
 * 2. Set via PINGONE_TOKEN environment variable (for CI/CD pipelines)
 * 3. Automatically obtained via OAuth client credentials flow using stored credentials
 *
 * For the OAuth flow, use `p1-cli auth login` to store your client credentials first.
 *
 * @since 0.0.1
 */
export const getToken = (
  cliOption: { readonly _tag: "Some"; readonly value: Redacted.Redacted<string> } | { readonly _tag: "None" }
) =>
  Effect.gen(function*() {
    // Check if CLI option was provided (direct token)
    if (cliOption._tag === "Some") {
      const tokenValue = Redacted.value(cliOption.value)
      if (Predicate.isTruthy(tokenValue)) {
        return tokenValue
      }
    }

    // Fall back to PINGONE_TOKEN environment variable
    const envToken = yield* Config.string("PINGONE_TOKEN").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    )

    if (envToken) {
      return envToken
    }

    // Fall back to OAuth service (uses stored credentials)
    const oauthService = yield* OAuthService
    return yield* oauthService.getAccessToken().pipe(
      Effect.catchAll(() =>
        Effect.fail(
          new PingOneAuthError({
            message: "No PingOne authentication configured",
            cause:
              "Run 'p1-cli auth login' to configure OAuth credentials, or set PINGONE_TOKEN environment variable, or use --pingone-token flag",
            context: {
              accessTokenProvided: false
            }
          })
        )
      )
    )
  })
