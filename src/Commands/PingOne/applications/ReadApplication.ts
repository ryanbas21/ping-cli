import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { readApplication } from "../../../HttpClient/ApplicationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

const applicationId = Args.text({ name: "applicationId" })

const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to read/retrieve a PingOne application by ID.
 *
 * @since 0.0.1
 */
export const readApplicationCommand = Command.make(
  "read_application",
  {
    applicationId,
    environmentId,
    pingoneToken
  },
  ({ applicationId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      return yield* readApplication({
        envId,
        token,
        applicationId
      }).pipe(
        Effect.flatMap((application) =>
          Console.log(
            `Application Details:\nID: ${application.id}\nName: ${application.name}${
              application.description ? `\nDescription: ${application.description}` : ""
            }\nType: ${application.type}\nProtocol: ${application.protocol}\nEnabled: ${application.enabled}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to read application: ${error._tag}`))
      )
    })
)
