import { Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { listPingOneUsers } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional filtering and pagination
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)
const filter = Options.text("filter").pipe(Options.optional)

/**
 * Command to list users from PingOne with optional filtering and pagination.
 *
 * @since 0.0.1
 */
export const listUsers = Command.make(
  "list_users",
  {
    environmentId,
    pingoneToken,
    limit,
    filter
  },
  ({ environmentId, pingoneToken, limit, filter }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build optional parameters
      const limitParam = limit._tag === "Some" ? limit.value : undefined
      const filterParam = filter._tag === "Some" ? filter.value : undefined

      // Make API call to list users
      const response = yield* listPingOneUsers({
        envId,
        token,
        limit: limitParam,
        filter: filterParam
      })

      // Display results
      const users = response._embedded.users
      const count = response.count ?? users.length

      yield* Console.log(`Found ${count} user(s)`)
      yield* Console.log("")

      for (const user of users) {
        yield* Console.log(`ID: ${user.id}`)
        yield* Console.log(`  Username: ${user.username}`)
        yield* Console.log(`  Email: ${user.email}`)
        yield* Console.log(`  Enabled: ${user.enabled}`)
        yield* Console.log(`  Status: ${user.lifecycle.status}`)
        if (user.name?.given || user.name?.family) {
          yield* Console.log(
            `  Name: ${user.name.given ?? ""} ${user.name.family ?? ""}`.trim()
          )
        }
        if (user.department) {
          yield* Console.log(`  Department: ${user.department}`)
        }
        yield* Console.log(`  Created: ${user.createdAt}`)
        yield* Console.log("")
      }

      // Show pagination info if available
      if (response._links?.next) {
        yield* Console.log("More results available. Use --limit to adjust page size.")
      }
    })
)
