import { Args, Command, Options } from "@effect/cli"
import { Effect, Predicate } from "effect"
import * as Console from "effect/Console"
import { PingOneAuthError } from "../../Errors"
import { readPingOneUser } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required argument
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to read/retrieve a PingOne user by ID.
 *
 * @since 0.0.1
 */
export const readUser = Command.make(
  "read_user",
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

      // Read the user
      return yield* readPingOneUser({
        envId,
        token,
        userId
      }).pipe(
        Effect.flatMap((user) =>
          Console.log(
            `User found!
ID: ${user.id}
Username: ${user.username}
Email: ${user.email}
Enabled: ${user.enabled}
MFA Enabled: ${user.mfaEnabled}
Lifecycle Status: ${user.lifecycle.status}
Created: ${user.createdAt}
Updated: ${user.updatedAt}
Population ID: ${user.population.id}
Environment ID: ${user.environment.id}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to read user: ${error._tag}`))
      )
    })
)
