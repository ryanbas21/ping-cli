/**
 * Auth Login Command
 *
 * Stores OAuth client credentials securely for subsequent CLI operations.
 * Supports CLI flags, environment variables, and interactive prompts.
 *
 * @since 0.0.3
 */
import { Command, Options, Prompt } from "@effect/cli"
import { Config, Effect, Option, Redacted } from "effect"
import * as Console from "effect/Console"
import { buildTokenEndpoint } from "../../../HttpClient/OAuthClient.js"
import { StoredCredentials } from "../../../HttpClient/OAuthSchemas.js"
import { OAuthService } from "../../../Services/index.js"

// OAuth client credentials - all optional to support env vars and prompts
const clientId = Options.text("client-id").pipe(
  Options.withDescription("OAuth client ID from PingOne Worker Application"),
  Options.optional
)

const clientSecret = Options.redacted("client-secret").pipe(
  Options.withDescription("OAuth client secret from PingOne Worker Application"),
  Options.optional
)

const environmentId = Options.text("environment-id").pipe(
  Options.withAlias("e"),
  Options.withDescription("PingOne environment ID"),
  Options.optional
)

const region = Options.choice("region", ["com", "eu", "asia", "ca"]).pipe(
  Options.optional,
  Options.withDescription(
    "PingOne region: com (North America), eu (Europe), asia (Asia Pacific), ca (Canada). Defaults to 'com'"
  )
)

/**
 * Resolves region from CLI option or environment variable.
 * Priority: CLI option > PINGONE_AUTH_REGION env var > default ("com")
 */
const resolveRegion = (cliOption: Option.Option<"com" | "eu" | "asia" | "ca">) =>
  Effect.gen(function*() {
    if (Option.isSome(cliOption)) {
      return cliOption.value
    }

    const envValue = yield* Config.string("PINGONE_AUTH_REGION").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    )

    if (envValue && (envValue === "com" || envValue === "eu" || envValue === "asia" || envValue === "ca")) {
      return envValue
    }

    return "com" as const
  })

/**
 * Resolves client ID from CLI option, environment variable, or interactive prompt.
 * Priority: CLI option > PINGONE_CLIENT_ID env var > interactive prompt
 */
const resolveClientId = (cliOption: Option.Option<string>) =>
  Effect.gen(function*() {
    if (Option.isSome(cliOption)) {
      return cliOption.value
    }

    const envValue = yield* Config.string("PINGONE_CLIENT_ID").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    )

    if (envValue) {
      return envValue
    }

    return yield* Prompt.text({
      message: "Enter your PingOne OAuth client ID:",
      validate: (value) => value.trim().length > 0 ? Effect.succeed(value) : Effect.fail("Client ID cannot be empty")
    }).pipe(Prompt.run)
  })

/**
 * Resolves client secret from CLI option, environment variable, or interactive prompt.
 * Priority: CLI option > PINGONE_CLIENT_SECRET env var > interactive prompt
 *
 * Returns a plain string (unwraps Redacted values from CLI options).
 */
const resolveClientSecret = (cliOption: Option.Option<Redacted.Redacted<string>>) =>
  Effect.gen(function*() {
    if (Option.isSome(cliOption)) {
      return Redacted.value(cliOption.value)
    }

    const envValue = yield* Config.string("PINGONE_CLIENT_SECRET").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    )

    if (envValue) {
      return envValue
    }

    return yield* Prompt.password({
      message: "Enter your PingOne OAuth client secret:"
    }).pipe(Prompt.run)
  })

/**
 * Resolves environment ID from CLI option, environment variable, or interactive prompt.
 * Priority: CLI option > PINGONE_ENV_ID env var > interactive prompt
 */
const resolveEnvironmentId = (cliOption: Option.Option<string>) =>
  Effect.gen(function*() {
    if (Option.isSome(cliOption)) {
      return cliOption.value
    }

    const envValue = yield* Config.string("PINGONE_ENV_ID").pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    )

    if (envValue) {
      return envValue
    }

    return yield* Prompt.text({
      message: "Enter your PingOne environment ID:",
      validate: (value) =>
        value.trim().length > 0 ? Effect.succeed(value) : Effect.fail("Environment ID cannot be empty")
    }).pipe(Prompt.run)
  })

/**
 * Auth login command.
 *
 * Stores OAuth client credentials securely in the system keychain
 * (or encrypted file as fallback). Credentials are used for all
 * subsequent CLI operations.
 *
 * Usage:
 * ```bash
 * # Direct entry with all flags
 * p1-cli auth login --client-id=abc --client-secret=xyz --environment-id=env-123 --region=com
 *
 * # Using environment variables
 * export PINGONE_CLIENT_ID=abc
 * export PINGONE_CLIENT_SECRET=xyz
 * export PINGONE_ENV_ID=env-123
 * export PINGONE_AUTH_REGION=eu  # Optional, defaults to "com"
 * p1-cli auth login
 *
 * # Interactive prompts (CLI will prompt for missing values)
 * p1-cli auth login
 *
 * # Mix of flags, env vars, and prompts
 * export PINGONE_CLIENT_ID=abc
 * export PINGONE_AUTH_REGION=asia
 * p1-cli auth login --client-secret=xyz
 * # Will prompt for environment-id, use asia region from env var
 * ```
 *
 * @since 0.0.3
 */
export const login = Command.make(
  "login",
  {
    clientId,
    clientSecret,
    environmentId,
    region
  },
  ({ clientId, clientSecret, environmentId, region }) =>
    Effect.gen(function*() {
      const oauthService = yield* OAuthService

      // Resolve credentials with fallback: CLI args > env vars > prompts
      const resolvedClientId = yield* resolveClientId(clientId)
      const resolvedClientSecretRaw = yield* resolveClientSecret(clientSecret)
      const resolvedEnvironmentId = yield* resolveEnvironmentId(environmentId)
      const resolvedRegion = yield* resolveRegion(region)

      // Ensure client secret is unwrapped (Prompt.password may return Redacted<string>)
      const resolvedClientSecret: string = typeof resolvedClientSecretRaw === "string" ?
        resolvedClientSecretRaw :
        Redacted.value(resolvedClientSecretRaw)

      // Build token endpoint based on region
      const tokenEndpoint = buildTokenEndpoint(resolvedEnvironmentId, resolvedRegion)

      // Create credentials object
      const credentials = new StoredCredentials({
        clientId: resolvedClientId,
        clientSecret: resolvedClientSecret,
        environmentId: resolvedEnvironmentId,
        tokenEndpoint
      })

      // Store credentials
      yield* oauthService.storeCredentials(credentials)

      // Verify we can obtain a token
      yield* Console.log("Verifying credentials...")
      const accessToken = yield* oauthService.getAccessToken()

      if (accessToken) {
        yield* Console.log("✓ Successfully authenticated!")
        yield* Console.log(
          `✓ Credentials stored securely for environment: ${resolvedEnvironmentId}`
        )
        const regionName = resolvedRegion === "com" ?
          "North America" :
          resolvedRegion === "eu" ?
          "Europe" :
          resolvedRegion === "asia" ?
          "Asia Pacific" :
          "Canada"
        yield* Console.log(`✓ Region: ${regionName} (${resolvedRegion})`)
      }
    })
)
