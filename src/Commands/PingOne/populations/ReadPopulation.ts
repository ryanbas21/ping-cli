import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { readPopulation } from "../../../HttpClient/PopulationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const populationId = Args.text({ name: "populationId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

export const readPopulationCommand = Command.make(
  "read_population",
  {
    populationId,
    environmentId,
    pingoneToken
  },
  ({ populationId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Read the population
      return yield* readPopulation({
        envId,
        token,
        populationId
      }).pipe(
        Effect.flatMap((population) =>
          Console.log(
            `Population Details:\nID: ${population.id}\nName: ${population.name}${
              population.description ? `\nDescription: ${population.description}` : ""
            }\nDefault: ${population.default}${
              population.passwordPolicy ? `\nPassword Policy ID: ${population.passwordPolicy.id}` : ""
            }`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to read population: ${error}`))
      )
    })
)
