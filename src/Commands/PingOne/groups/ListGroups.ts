import { Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { listGroups } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional query parameters
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)
const filter = Options.text("filter").pipe(Options.optional)
const expand = Options.text("expand").pipe(Options.optional)

/**
 * Command to list PingOne groups with optional filtering, expansion, and pagination.
 *
 * @since 0.0.1
 */
export const listGroupsCommand = Command.make(
  "list_groups",
  {
    environmentId,
    pingoneToken,
    limit,
    filter,
    expand
  },
  ({ environmentId, pingoneToken, limit, filter, expand }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build optional parameters
      const limitParam = limit._tag === "Some" ? limit.value : undefined
      const filterParam = filter._tag === "Some" ? filter.value : undefined
      const expandParam = expand._tag === "Some" ? expand.value : undefined

      // List groups
      return yield* listGroups({
        envId,
        token,
        limit: limitParam,
        filter: filterParam,
        expand: expandParam
      }).pipe(
        Effect.flatMap((response) => {
          const groups = response._embedded.groups
          const count = response.count || groups.length

          return Console.log(
            `Found ${count} group(s):\n\n${
              groups
                .map(
                  (group, index) =>
                    `${index + 1}. ${group.name} (${group.id})${
                      group.description ? `\n   Description: ${group.description}` : ""
                    }\n   Custom: ${group.custom}`
                )
                .join("\n\n")
            }`
          )
        }),
        Effect.catchAll((error) => Console.error(`Failed to list groups: ${error._tag}`))
      )
    })
)
