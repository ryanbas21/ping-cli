import { Config, Effect, Predicate, Redacted } from "effect"
import { PingOneAuthError } from "../../Errors.js"

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
 * Gets PingOne environment ID from CLI option or environment variable.
 * Priority: CLI option > PINGONE_ENV_ID env var
 *
 * @since 0.0.1
 */
export const getEnvironmentId = (cliOption: string) =>
  Effect.if(
    Predicate.isTruthy(cliOption) && cliOption.trim().length > 0,
    {
      onTrue: () => Effect.succeed(cliOption),
      onFalse: () =>
        Config.string("PINGONE_ENV_ID").pipe(
          Effect.catchAll(() =>
            Effect.fail(
              new PingOneAuthError({
                message: "No PingOne environment ID provided",
                cause: "Set PINGONE_ENV_ID environment variable or use --environment-id flag",
                context: {
                  accessTokenProvided: false
                }
              })
            )
          )
        )
    }
  )

/**
 * Gets PingOne OAuth 2.0 access token from CLI option or environment variable.
 * Priority: CLI option > PINGONE_TOKEN env var
 *
 * The access token should be obtained from the PingOne Management API and have
 * appropriate scopes for the operations you intend to perform.
 *
 * @since 0.0.1
 */
export const getToken = (
  cliOption: { readonly _tag: "Some"; readonly value: Redacted.Redacted<string> } | { readonly _tag: "None" }
) =>
  Effect.gen(function*() {
    // Check if CLI option was provided
    if (cliOption._tag === "Some") {
      const tokenValue = Redacted.value(cliOption.value)
      if (Predicate.isTruthy(tokenValue)) {
        return tokenValue
      }
    }

    // Fall back to environment variable
    return yield* Config.string("PINGONE_TOKEN").pipe(
      Effect.catchAll(() =>
        Effect.fail(
          new PingOneAuthError({
            message: "No PingOne OAuth 2.0 access token provided",
            cause:
              "Set PINGONE_TOKEN environment variable with your OAuth 2.0 access token from PingOne Management API, or use --pingone-token flag",
            context: {
              accessTokenProvided: false
            }
          })
        )
      )
    )
  })
