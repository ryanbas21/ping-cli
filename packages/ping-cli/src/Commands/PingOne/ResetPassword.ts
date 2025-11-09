import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { PingOneValidationError } from "../../Errors.js"
import { resetPingOneUserPassword } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const email = Args.text({ name: "email" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to initiate a password reset flow (admin-initiated) in PingOne.
 *
 * This is an administrator-initiated password reset. PingOne will send a reset
 * code/link to the specified email address. For self-service password recovery,
 * use the recover_password command instead.
 *
 * @since 0.0.1
 */
export const resetPassword = Command.make(
  "reset_password",
  {
    email,
    environmentId,
    pingoneToken
  },
  ({ email, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "email",
            message: `Invalid email format: ${email}`
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build reset data object
      const resetData = { email }

      // Make API call to reset password
      const response = yield* resetPingOneUserPassword({
        envId,
        token,
        resetData
      })

      // Display success message
      yield* Console.log("Password reset initiated successfully!")
      yield* Console.log(`Reset ID: ${response.id}`)
      yield* Console.log(`Status: ${response.status}`)
      yield* Console.log(`A password reset link has been sent to ${email}`)
    })
)
