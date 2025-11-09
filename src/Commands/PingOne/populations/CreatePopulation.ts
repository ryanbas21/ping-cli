import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { PingOneValidationError } from "../../../Errors.js"
import { createPopulation } from "../../../HttpClient/PopulationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const name = Args.text({ name: "name" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional population data
const description = Options.text("description").pipe(Options.optional)

export const createPopulationCommand = Command.make(
  "create_population",
  {
    name,
    environmentId,
    pingoneToken,
    description
  },
  ({ name, environmentId, pingoneToken, description }) =>
    Effect.gen(function*() {
      // Validate name is not empty
      if (name.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "name",
            message: "Population name cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build population data object
      const populationData: {
        name: string
        description?: string
      } = { name }

      // Add optional description
      if (description._tag === "Some") {
        populationData.description = description.value
      }

      // Create the population
      return yield* createPopulation({
        envId,
        token,
        populationData
      }).pipe(
        Effect.flatMap((population) =>
          Console.log(
            `Population created successfully!\nID: ${population.id}\nName: ${population.name}${
              population.description ? `\nDescription: ${population.description}` : ""
            }\nDefault: ${population.default}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to create population: ${error}`))
      )
    })
)
