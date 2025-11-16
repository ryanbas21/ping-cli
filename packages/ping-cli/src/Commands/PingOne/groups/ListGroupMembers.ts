import { Args, Command, Options } from "@effect/cli"
import { Array, Effect } from "effect"
import * as Console from "effect/Console"
import { listGroupMembers } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional query parameters
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)

/**
 * Command to list members of a PingOne group.
 *
 * @since 0.0.1
 */
export const listGroupMembersCommand = Command.make(
  "list_members",
  {
    groupId,
    environmentId,
    pingoneToken,
    limit
  },
  ({ groupId, environmentId, pingoneToken, limit }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build optional limit parameter
      const limitParam = limit._tag === "Some" ? limit.value : undefined

      // List group members
      return yield* listGroupMembers({
        envId,
        token,
        groupId,
        limit: limitParam
      }).pipe(
        Effect.flatMap((response) => {
          const members = response._embedded.users
          const count = response.count || members.length

          return Console.log(
            `Found ${count} member(s) in group ${groupId}:

${
              Array.join(
                Array.map(members, (user, index) => `${index + 1}. User ID: ${user.id}`),
                "\n"
              )
            }`
          )
        }),
        Effect.catchAll((error) => Console.error(`Failed to list group members: ${error._tag}`))
      )
    })
)
