import { Args, Command, Options } from "@effect/cli"
import { Effect, Predicate } from "effect"
import * as Console from "effect/Console"
import { PingOneAuthError } from "../../Errors"
import { deletePingOneUser } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required argument
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

export const deleteUser = Command.make(
  "delete_user",
  {
    userId,
    environmentId,
    pingoneToken
  },
  ({
    userId,
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

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Delete the user
      return yield* deletePingOneUser({
        envId,
        token,
        userId
      }).pipe(
        Effect.flatMap(() => Console.log(`User ${userId} deleted successfully!`)),
        Effect.catchAll((error) => Console.error(`Failed to delete user: ${error}`))
      )
    })
)
