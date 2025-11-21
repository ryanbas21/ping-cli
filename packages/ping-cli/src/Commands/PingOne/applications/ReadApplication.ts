/**
 * Command to read and display details of a PingOne application.
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { readApplication } from "../../../HttpClient/ApplicationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

const applicationId = Args.text({ name: "applicationId" })

const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
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

      const application = yield* readApplication({
        envId,
        token,
        applicationId
      })
      yield* Console.log(
        `Application Details:\nID: ${application.id}\nName: ${application.name}${
          application.description ? `\nDescription: ${application.description}` : ""
        }\nType: ${application.type}\nProtocol: ${application.protocol}\nEnabled: ${application.enabled}`
      )
    })
)
