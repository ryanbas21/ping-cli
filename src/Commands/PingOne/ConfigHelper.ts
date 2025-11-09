import { Config, Effect, Predicate, Redacted } from "effect"
import { PingOneAuthError } from "../../Errors"

/**
 * Gets PingOne environment ID from CLI option or environment variable
 * Priority: CLI option > PINGONE_ENV_ID env var
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
                cause:
                  "No PingOne environment ID provided. Set PINGONE_ENV_ID env var or use --environment-id"
              })
            )
          )
        )
    }
  )

/**
 * Gets PingOne access token from CLI option or environment variable
 * Priority: CLI option > PINGONE_TOKEN env var
 */
export const getToken = (cliOption: { readonly _tag: "Some"; readonly value: Redacted.Redacted<string> } | { readonly _tag: "None" }) =>
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
            cause:
              "No PingOne token provided. Set PINGONE_TOKEN env var or use --pingone-token"
          })
        )
      )
    )
  })
