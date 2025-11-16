import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { deleteGroup } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to delete a PingOne group by ID.
 *
 * @since 0.0.1
 */
export const deleteGroupCommand = Command.make(
  "delete_group",
  {
    groupId,
    environmentId,
    pingoneToken
  },
  ({ groupId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Delete the group
      return yield* deleteGroup({
        envId,
        token,
        groupId
      }).pipe(
        Effect.flatMap(() => Console.log(`Group ${groupId} deleted successfully!`)),
        Effect.catchAll((error) => Console.error(`Failed to delete group: ${error._tag}`))
      )
    })
)
