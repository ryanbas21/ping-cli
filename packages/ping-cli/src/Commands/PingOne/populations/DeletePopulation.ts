import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { deletePopulation } from "../../../HttpClient/PopulationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required arguments
const populationId = Args.text({ name: "populationId" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to delete a PingOne population by ID.
 *
 * @since 0.0.1
 */
export const deletePopulationCommand = Command.make(
  "delete_population",
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

      // Delete the population
      return yield* deletePopulation({
        envId,
        token,
        populationId
      }).pipe(
        Effect.flatMap(() => Console.log(`Population ${populationId} deleted successfully!`)),
        Effect.catchAll((error) => Console.error(`Failed to delete population: ${error._tag}`))
      )
    })
)
