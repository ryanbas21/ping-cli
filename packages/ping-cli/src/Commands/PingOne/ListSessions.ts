import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as EffectString from "effect/String"
import { PingOneValidationError } from "../../Errors.js"
import { listPingOneUserSessions } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required argument
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional limit
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)

/**
 * Command to list user sessions in PingOne.
 *
 * @since 0.0.1
 */
export const listSessions = Command.make(
  "list_sessions",
  {
    userId,
    environmentId,
    pingoneToken,
    limit
  },
  ({ userId, environmentId, pingoneToken, limit }) =>
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

      // Build optional parameters
      const limitParam = limit._tag === "Some" ? limit.value : undefined

      // Make API call to list sessions
      const response = yield* listPingOneUserSessions({
        envId,
        token,
        userId,
        limit: limitParam
      })

      // Display results
      const sessions = response._embedded.sessions
      const count = response.count ?? sessions.length

      yield* Console.log(`Found ${count} session(s) for user ${userId}`)
      yield* Console.log("")

      for (const session of sessions) {
        yield* Console.log(`Session ID: ${session.id}`)
        yield* Console.log(`  Created At: ${session.createdAt}`)
        if (session.expiresAt) {
          yield* Console.log(`  Expires At: ${session.expiresAt}`)
        }
        if (session.lastUsedAt) {
          yield* Console.log(`  Last Used: ${session.lastUsedAt}`)
        }
        if (session.application) {
          yield* Console.log(`  Application ID: ${session.application.id}`)
          if (session.application.name) {
            yield* Console.log(`  Application Name: ${session.application.name}`)
          }
        }
        yield* Console.log("")
      }

      // Show pagination info if available
      if (response._links?.next) {
        yield* Console.log("More results available. Use --limit to adjust page size.")
      }

      if (count === 0) {
        yield* Console.log("No active sessions found for this user.")
      }
    })
)
