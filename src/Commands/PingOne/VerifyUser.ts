import { Args, Command, Options } from "@effect/cli"
import { Effect, Predicate } from "effect"
import * as Console from "effect/Console"
import { PingOneAuthError } from "../../Errors"
import { verifyPingOneUser } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const userId = Args.text({ name: "userId" })
const verificationCode = Args.text({ name: "verificationCode" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to verify a PingOne user with a verification code.
 *
 * @since 0.0.1
 */
export const verifyUser = Command.make(
  "verify_user",
  {
    userId,
    verificationCode,
    environmentId,
    pingoneToken
  },
  ({
    userId,
    verificationCode,
    environmentId,
    pingoneToken
  }) =>
    Effect.gen(function*() {
      // Validate userId is not empty
      if (!Predicate.isTruthy(userId) || userId.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneAuthError({
            cause: "User ID cannot be empty"
          })
        )
      }

      // Validate verification code is not empty
      if (!Predicate.isTruthy(verificationCode) || verificationCode.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneAuthError({
            cause: "Verification code cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Verify the user
      return yield* verifyPingOneUser({
        envId,
        token,
        userId,
        verificationData: {
          verificationCode
        }
      }).pipe(
        Effect.flatMap((user) =>
          Console.log(
            `User verified successfully!
ID: ${user.id}
Username: ${user.username}
Email: ${user.email}
Lifecycle Status: ${user.lifecycle.status}
Enabled: ${user.enabled}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to verify user: ${error._tag}`))
      )
    })
)
