import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { addGroupMember } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

export const addGroupMemberCommand = Command.make(
  "add_member",
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

      // Add member to group
      return yield* addGroupMember({
        envId,
        token,
        groupId,
        userId
      }).pipe(
        Effect.flatMap(() => Console.log(`User ${userId} added to group ${groupId} successfully!`)),
        Effect.catchAll((error) => Console.error(`Failed to add member to group: ${error}`))
      )
    })
)
