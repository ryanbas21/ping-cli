/**
 * Command for removing a user from a PingOne group.
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { removeGroupMember } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })
const userId = Args.text({ name: "userId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to remove a user from a PingOne group.
 *
 * @since 0.0.1
 */
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
      yield* removeGroupMember({
        envId,
        token,
        groupId,
        userId
      })
      yield* Console.log(`User ${userId} removed from group ${groupId} successfully!`)
    })
)
