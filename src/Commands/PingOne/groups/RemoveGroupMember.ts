import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { removeGroupMember } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

export const removeGroupMemberCommand = Command.make(
  "remove_member",
  {
    groupId,
    userId,
    environmentId,
    pingoneToken
  },
  ({ groupId, userId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Remove member from group
      return yield* removeGroupMember({
        envId,
        token,
        groupId,
        userId
      }).pipe(
        Effect.flatMap(() => Console.log(`User ${userId} removed from group ${groupId} successfully!`)),
        Effect.catchAll((error) => Console.error(`Failed to remove member from group: ${error}`))
      )
    })
)
