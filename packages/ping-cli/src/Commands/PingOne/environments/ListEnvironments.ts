import { Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { listEnvironments } from "../../../HttpClient/EnvironmentClient.js"
import { getToken } from "../ConfigHelper.js"

// Required options
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional query parameters
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)
const filter = Options.text("filter").pipe(Options.optional)

/**
 * Command to list PingOne environments with optional filtering and pagination.
 *
 * @since 0.0.2
 */
export const listEnvironmentsCommand = Command.make(
  "list_environments",
  {
    pingoneToken,
    limit,
    filter
  },
  ({ pingoneToken, limit, filter }) =>
    Effect.gen(function*() {
      // Get token using helper
      const token = yield* getToken(pingoneToken)

      // Build optional parameters
      const limitParam = limit._tag === "Some" ? limit.value : undefined
      const filterParam = filter._tag === "Some" ? filter.value : undefined

      // List environments
      return yield* listEnvironments({
        token,
        limit: limitParam,
        filter: filterParam
      }).pipe(
        Effect.flatMap((response) => {
          const environments = response._embedded.environments

          return Console.log(
            `Found ${environments.length} environment(s):\n\n${
              environments
                .map(
                  (env, index) =>
                    `${index + 1}. ${env.name} (${env.id})${
                      env.description ? `\n   Description: ${env.description}` : ""
                    }\n   Type: ${env.type}\n   Region: ${env.region}\n   License: ${env.license.name}`
                )
                .join("\n\n")
            }`
          )
        }),
        Effect.catchAll((error) => {
          const errorMsg = `Failed to list environments: ${error._tag}`
          const statusMsg = "status" in error ? ` (HTTP ${error.status})` : ""
          const detailMsg = "message" in error ? `\n  Details: ${error.message}` : ""
          return Console.error(`${errorMsg}${statusMsg}${detailMsg}`)
        })
      )
    })
)
