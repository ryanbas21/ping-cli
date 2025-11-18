/**
 * Verify user command for PingOne CLI
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Predicate from "effect/Predicate"
import * as EffectString from "effect/String"
import { PingOneAuthError } from "../../Errors.js"
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
      if (!Predicate.isTruthy(userId) || pipe(userId, EffectString.trim, EffectString.isEmpty)) {
        return yield* Effect.fail(
          new PingOneAuthError({
            message: "User ID cannot be empty",
            cause: "User ID cannot be empty",
            context: { accessTokenProvided: false }
          })
        )
      }

      // Validate verification code is not empty
      if (
        !Predicate.isTruthy(verificationCode) ||
        pipe(verificationCode, EffectString.trim, EffectString.isEmpty)
      ) {
        return yield* Effect.fail(
          new PingOneAuthError({
            message: "Verification code cannot be empty",
            cause: "Verification code cannot be empty",
            context: { accessTokenProvided: false }
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
