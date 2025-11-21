/**
 * Command for creating a new PingOne group.
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import { Effect, Predicate } from "effect"
import * as Console from "effect/Console"
import * as EffectString from "effect/String"
import { PingOneValidationError } from "../../../Errors.js"
import { createGroup } from "../../../HttpClient/GroupClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const name = Args.text({ name: "name" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional group data
const description = Options.text("description").pipe(Options.optional)
const populationId = Options.text("population-id").pipe(Options.withAlias("p"), Options.optional)
const userFilter = Options.text("user-filter").pipe(Options.optional)
const externalId = Options.text("external-id").pipe(Options.optional)

/**
 * Command to create a new PingOne group.
 *
 * @since 0.0.1
 */
export const createGroupCommand = Command.make(
  "create_group",
  {
    name,
    environmentId,
    pingoneToken,
    description,
    populationId,
    userFilter,
    externalId
  },
  ({ name, environmentId, pingoneToken, description, populationId, userFilter, externalId }) =>
    Effect.gen(function*() {
      // Validate name is not empty
      if (EffectString.isEmpty(EffectString.trim(name))) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "name",
            message: "Group name cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build group data object
      const groupData: {
        name: string
        description?: string
        population?: { id: string }
        userFilter?: string
        externalId?: string
      } = {
        name
      }

      // Add optional description
      if (description._tag === "Some") {
        groupData.description = description.value
      }

      // Add optional population
      if (populationId._tag === "Some" && Predicate.isTruthy(populationId.value)) {
        groupData.population = { id: populationId.value }
      }

      // Add optional user filter
      if (userFilter._tag === "Some") {
        groupData.userFilter = userFilter.value
      }

      // Add optional external ID
      if (externalId._tag === "Some") {
        groupData.externalId = externalId.value
      }

      // Create the group
      const group = yield* createGroup({
        envId,
        token,
        groupData
      })
      yield* Console.log(
        `Group created successfully!\nID: ${group.id}\nName: ${group.name}${
          group.description ? `\nDescription: ${group.description}` : ""
        }`
      )
    })
)
