/**
 * Recover password command for PingOne CLI
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { PingOneValidationError } from "../../Errors.js"
import { recoverPingOneUserPassword } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const email = Args.text({ name: "email" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to initiate a password recovery flow (self-service) in PingOne.
 *
 * This is a self-service password recovery flow that users can initiate themselves.
 * PingOne will send a recovery code/link to the specified email address.
 * For administrator-initiated password resets, use the reset_password command instead.
 *
 * @since 0.0.1
 */
export const recoverPassword = Command.make(
  "recover_password",
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

      // Make API call to recover password
      const response = yield* recoverPingOneUserPassword({
        envId,
        token,
        resetData
      })

      // Display success message
      yield* Console.log("Password recovery initiated successfully!")
      yield* Console.log(`Recovery ID: ${response.id}`)
      yield* Console.log(`Status: ${response.status}`)
      yield* Console.log(`A password recovery link has been sent to ${email}`)
    })
)
