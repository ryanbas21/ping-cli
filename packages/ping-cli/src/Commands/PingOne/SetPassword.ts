/**
 * Set password command for PingOne CLI
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import { Effect, Redacted } from "effect"
import * as Console from "effect/Console"
import * as EffectString from "effect/String"
import { PingOneValidationError } from "../../Errors.js"
import { setPingOneUserPassword } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const userId = Args.text({ name: "userId" })
const password = Args.redacted({ name: "password" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional flag to force password change on next login
const forceChange = Options.boolean("force-change").pipe(Options.withDefault(false))

/**
 * Command to set a user's password in PingOne.
 *
 * @since 0.0.1
 */
export const setPassword = Command.make(
  "set_password",
  {
    userId,
    password,
    environmentId,
    pingoneToken,
    forceChange
  },
  ({ userId, password, environmentId, pingoneToken, forceChange }) =>
    Effect.gen(function*() {
      // Validate userId is not empty
      if (EffectString.isEmpty(EffectString.trim(userId))) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "userId",
            message: "User ID cannot be empty"
          })
        )
      }

      // Validate password strength (basic validation)
      const passwordValue = Redacted.value(password)
      if (passwordValue.length < 8) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "password",
            message: "Password must be at least 8 characters long"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build password data object
      const passwordData: { value: string; forceChange?: boolean } = {
        value: passwordValue,
        ...(forceChange && { forceChange })
      }

      // Make API call to set password
      yield* setPingOneUserPassword({
        envId,
        token,
        userId,
        passwordData
      })

      // Display success message
      yield* Console.log(`Password set successfully for user ${userId}`)

      if (forceChange) {
        yield* Console.log("User will be required to change password on next login")
      }
    })
)
