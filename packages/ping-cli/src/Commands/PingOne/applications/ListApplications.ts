/**
 * Command to list PingOne applications with optional filtering and pagination.
 *
 * @since 0.0.1
 */
import { Command, Options } from "@effect/cli"
import { Array, Effect } from "effect"
import * as Console from "effect/Console"
import { listApplications } from "../../../HttpClient/ApplicationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

const limit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional)
const filter = Options.text("filter").pipe(Options.optional)

/**
 * Command to list PingOne applications with optional filtering and pagination.
 *
 * @since 0.0.1
 */
export const listApplicationsCommand = Command.make(
  "list_applications",
  {
    environmentId,
    pingoneToken,
    limit,
    filter
  },
  ({ environmentId, pingoneToken, limit, filter }) =>
    Effect.gen(function*() {
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      const limitParam = limit._tag === "Some" ? limit.value : undefined
      const filterParam = filter._tag === "Some" ? filter.value : undefined

      return yield* listApplications({
        envId,
        token,
        limit: limitParam,
        filter: filterParam
      }).pipe(
        Effect.flatMap((response) => {
          const applications = response._embedded.applications
          const count = response.count || applications.length

          return Console.log(
            `Found ${count} application(s):

${
              Array.join(
                Array.map(
                  applications,
                  (application, index) =>
                    `${index + 1}. ${application.name} (${application.id})${
                      application.description ?
                        `
   Description: ${application.description}` :
                        ""
                    }
   Type: ${application.type}
   Protocol: ${application.protocol}
   Enabled: ${application.enabled}`
                ),
                "\n\n"
              )
            }`
          )
        }),
        Effect.catchAll((error) => Console.error(`Failed to list applications: ${error._tag}`))
      )
    })
)
