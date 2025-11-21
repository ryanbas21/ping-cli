/**
 * CLI command for listing all PingOne populations with optional filtering and pagination support.
 *
 * @since 0.0.1
 */

import { Command, Options } from "@effect/cli"
import { Array, Effect } from "effect"
import * as Console from "effect/Console"
import { listPopulations } from "../../../HttpClient/PopulationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional query parameters
const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)
const filter = Options.text("filter").pipe(Options.optional)

/**
 * Command to list PingOne populations with optional filtering and pagination.
 *
 * @since 0.0.1
 */
export const listPopulationsCommand = Command.make(
  "list_populations",
  {
    environmentId,
    pingoneToken,
    limit,
    filter
  },
  ({ environmentId, pingoneToken, limit, filter }) =>
    Effect.gen(function*() {
      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Build optional parameters
      const limitParam = limit._tag === "Some" ? limit.value : undefined
      const filterParam = filter._tag === "Some" ? filter.value : undefined

      // List populations
      const response = yield* listPopulations({
        envId,
        token,
        limit: limitParam,
        filter: filterParam
      })
      const populations = response._embedded.populations
      const count = response.count || populations.length

      yield* Console.log(
        `Found ${count} population(s):\n\n${
          Array.join(
            Array.map(
              populations,
              (population, index) =>
                `${index + 1}. ${population.name} (${population.id})${
                  population.description ?
                    `
   Description: ${population.description}` :
                    ""
                }`
            ),
            "\n\n"
          )
        }`
      )
    })
)
