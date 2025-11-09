import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { PingOneValidationError } from "../../../Errors.js"
import { updateGroup } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const groupId = Args.text({ name: "groupId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional update fields
const name = Options.text("name").pipe(Options.optional)
const description = Options.text("description").pipe(Options.optional)
const userFilter = Options.text("user-filter").pipe(Options.optional)
const externalId = Options.text("external-id").pipe(Options.optional)

/**
 * Command to update a PingOne group.
 *
 * @since 0.0.1
 */
export const updateGroupCommand = Command.make(
  "update_group",
  {
    groupId,
    environmentId,
    pingoneToken,
    name,
    description,
    userFilter,
    externalId
  },
  ({ groupId, environmentId, pingoneToken, name, description, userFilter, externalId }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build group data object (at least one field must be provided)
      const groupData: {
        name?: string
        description?: string
        userFilter?: string
        externalId?: string
      } = {}

      // Add optional name
      if (name._tag === "Some") {
        groupData.name = name.value
      }

      // Add optional description
      if (description._tag === "Some") {
        groupData.description = description.value
      }

      // Add optional user filter
      if (userFilter._tag === "Some") {
        groupData.userFilter = userFilter.value
      }

      // Add optional external ID
      if (externalId._tag === "Some") {
        groupData.externalId = externalId.value
      }

      // Validate that at least one field is provided
      if (Object.keys(groupData).length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "groupData",
            message: "At least one field must be provided for update (name, description, user-filter, or external-id)"
          })
        )
      }

      // Update the group
      return yield* updateGroup({
        envId,
        token,
        groupId,
        groupData
      }).pipe(
        Effect.flatMap((group) =>
          Console.log(
            `Group updated successfully!\nID: ${group.id}\nName: ${group.name}${
              group.description ? `\nDescription: ${group.description}` : ""
            }`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to update group: ${error}`))
      )
    })
)
