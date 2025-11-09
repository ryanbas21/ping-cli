import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { PingOneValidationError } from "../../Errors.js"
import { revokePingOneUserSession } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const userId = Args.text({ name: "userId" })
const sessionId = Args.text({ name: "sessionId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to revoke a user session in PingOne.
 *
 * @since 0.0.1
 */
export const revokeSession = Command.make(
  "revoke_session",
  {
    userId,
    sessionId,
    environmentId,
    pingoneToken
  },
  ({ userId, sessionId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Validate userId is not empty
      if (userId.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "userId",
            message: "User ID cannot be empty"
          })
        )
      }

      // Validate sessionId is not empty
      if (sessionId.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "sessionId",
            message: "Session ID cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Make API call to revoke session
      const response = yield* revokePingOneUserSession({
        envId,
        token,
        userId,
        sessionId
      })

      // Display success message
      yield* Console.log("Session revoked successfully!")
      yield* Console.log(`Session ID: ${response.id}`)
      yield* Console.log(`Status: ${response.status}`)
    })
)
