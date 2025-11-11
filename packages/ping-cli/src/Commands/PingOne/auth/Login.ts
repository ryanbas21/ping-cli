/**
 * Auth Login Command
 *
 * Stores OAuth client credentials securely for subsequent CLI operations.
 * Supports wizard mode for interactive credential entry.
 *
 * @since 0.0.3
 */
import { Command, Options } from "@effect/cli"
import { Effect, Redacted } from "effect"
import * as Console from "effect/Console"
import { buildTokenEndpoint } from "../../../HttpClient/OAuthClient.js"
import { StoredCredentials } from "../../../HttpClient/OAuthSchemas.js"
import { OAuthService } from "../../../Services/index.js"

// OAuth client credentials
const clientId = Options.text("client-id").pipe(
  Options.withDescription("OAuth client ID from PingOne Worker Application")
)

const clientSecret = Options.redacted("client-secret").pipe(
  Options.withDescription("OAuth client secret from PingOne Worker Application")
)

const environmentId = Options.text("environment-id").pipe(
  Options.withAlias("e"),
  Options.withDescription("PingOne environment ID")
)

const region = Options.text("region").pipe(
  Options.withDefault("com"),
  Options.optional,
  Options.withDescription(
    "PingOne region (com, eu, asia, ca). Defaults to 'com' for North America"
  )
)

/**
 * Auth login command.
 *
 * Stores OAuth client credentials securely in the system keychain
 * (or encrypted file as fallback). Credentials are used for all
 * subsequent CLI operations.
 *
 * Usage:
 * ```bash
 * # Direct entry
 * p1-cli auth login --client-id=abc --client-secret=xyz --environment-id=env-123
 *
 * # Wizard mode (interactive prompts)
 * p1-cli auth login --wizard
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

      // Build token endpoint based on region
      const regionValue = region._tag === "Some" ? region.value : "com"
      const tokenEndpoint = buildTokenEndpoint(environmentId, regionValue)

      // Extract client secret from Redacted type
      const clientSecretValue = Redacted.value(clientSecret)

      // Create credentials object
      const credentials = new StoredCredentials({
        clientId,
        clientSecret: clientSecretValue,
        environmentId,
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
          `✓ Credentials stored securely for environment: ${environmentId}`
        )
        yield* Console.log(
          `✓ Region: ${regionValue === "com" ? "North America" : regionValue}`
        )
      }
    })
)
