import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { readGroup } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional query parameters
const expand = Options.text("expand").pipe(Options.optional)

/**
 * Command to read/retrieve a PingOne group by ID.
 *
 * @since 0.0.1
 */
export const readGroupCommand = Command.make(
  "read_group",
  {
    groupId,
    environmentId,
    pingoneToken,
    expand
  },
  ({ groupId, environmentId, pingoneToken, expand }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build optional expand parameter
      const expandParam = expand._tag === "Some" ? expand.value : undefined

      // Read the group
      return yield* readGroup({
        envId,
        token,
        groupId,
        expand: expandParam
      }).pipe(
        Effect.flatMap((group) =>
          Console.log(
            `Group Details:\nID: ${group.id}\nName: ${group.name}${
              group.description ? `\nDescription: ${group.description}` : ""
            }\nCustom: ${group.custom}\nCreated: ${group.createdAt}\nUpdated: ${group.updatedAt}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to read group: ${error}`))
      )
    })
)
