/**
 * Disable MFA command for PingOne CLI
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as EffectString from "effect/String"
import { PingOneValidationError } from "../../Errors.js"
import { updatePingOneUserMfa } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required argument
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to disable MFA for a user in PingOne.
 *
 * @since 0.0.1
 */
export const disableMfa = Command.make(
  "disable_mfa",
  {
    userId,
    environmentId,
    pingoneToken
  },
  ({ userId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Validate userId is not empty
      if (Function.pipe(userId, EffectString.trim, EffectString.isEmpty)) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "userId",
            message: "User ID cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Make API call to disable MFA
      const response = yield* updatePingOneUserMfa({
        envId,
        token,
        userId,
        mfaEnabled: false
      })

      // Display success message
      yield* Console.log("MFA disabled successfully!")
      yield* Console.log(`User ID: ${response.id}`)
      yield* Console.log(`MFA Enabled: ${response.mfaEnabled}`)
      yield* Console.log(`Updated At: ${response.updatedAt}`)
    })
)
