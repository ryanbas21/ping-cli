/**
 * CLI command for updating an existing PingOne population with optional name and description fields.
 *
 * @since 0.0.1
 */

import { Args, Command, Options } from "@effect/cli"
import { Effect, Record } from "effect"
import * as Console from "effect/Console"
import { PingOneValidationError } from "../../../Errors.js"
import { updatePopulation } from "../../../HttpClient/PopulationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const populationId = Args.text({ name: "populationId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional update fields
const name = Options.text("name").pipe(Options.optional)
const description = Options.text("description").pipe(Options.optional)

/**
 * Command to update a PingOne population.
 *
 * @since 0.0.1
 */
export const updatePopulationCommand = Command.make(
  "update_population",
  {
    populationId,
    environmentId,
    pingoneToken,
    name,
    description
  },
  ({ populationId, environmentId, pingoneToken, name, description }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build population data object with provided fields
      const populationData: {
        name?: string
        description?: string
      } = {}

      if (name._tag === "Some") {
        populationData.name = name.value
      }

      if (description._tag === "Some") {
        populationData.description = description.value
      }

      // Validate that at least one field is provided
      if (Record.size(populationData as Record<string, unknown>) === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "populationData",
            message: "At least one field must be provided for update"
          })
        )
      }

      // Update the population
      return yield* updatePopulation({
        envId,
        token,
        populationId,
        populationData
      }).pipe(
        Effect.flatMap((population) =>
          Console.log(
            `Population updated successfully!\nID: ${population.id}\nName: ${population.name}${
              population.description ? `\nDescription: ${population.description}` : ""
            }`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to update population: ${error._tag}`))
      )
    })
)
