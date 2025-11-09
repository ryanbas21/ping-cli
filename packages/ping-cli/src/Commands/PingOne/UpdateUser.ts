import { Args, Command, Options } from "@effect/cli"
import { Effect, Predicate } from "effect"
import * as Console from "effect/Console"
import { PingOneAuthError, PingOneValidationError } from "../../Errors.js"
import { updatePingOneUser } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const userId = Args.text({ name: "userId" })
const jsonData = Args.text({ name: "jsonData" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to update a PingOne user with new data.
 *
 * @since 0.0.1
 */
export const updateUser = Command.make(
  "update_user",
  {
    userId,
    jsonData,
    environmentId,
    pingoneToken
  },
  ({
    userId,
    jsonData,
    environmentId,
    pingoneToken
  }) =>
    Effect.gen(function*() {
      // Validate userId is not empty
      if (!Predicate.isTruthy(userId) || userId.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneAuthError({
            message: "User ID cannot be empty",
            cause: "User ID cannot be empty",
            context: { accessTokenProvided: false }
          })
        )
      }

      // Parse JSON data
      const userData = yield* Effect.try({
        try: () => JSON.parse(jsonData) as Record<string, unknown>,
        catch: (error) =>
          new PingOneValidationError({
            field: "jsonData",
            message: `Invalid JSON format: ${String(error)}`
          })
      })

      // Validate that at least one field is provided for update
      if (Object.keys(userData).length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "jsonData",
            message: "At least one field must be provided for update"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Update the user
      return yield* updatePingOneUser({
        envId,
        token,
        userId,
        userData
      }).pipe(
        Effect.flatMap((user) =>
          Console.log(
            `User updated successfully!
ID: ${user.id}
Username: ${user.username ?? "N/A"}
Email: ${user.email ?? "N/A"}
Enabled: ${user.enabled}
Lifecycle Status: ${user.lifecycle.status}
Updated: ${user.updatedAt}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to update user: ${error._tag}`))
      )
    })
)
