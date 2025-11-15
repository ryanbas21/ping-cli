import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { deleteApplication } from "../../../HttpClient/ApplicationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

const applicationId = Args.text({ name: "applicationId" })

const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to delete a PingOne application by ID.
 *
 * @since 0.0.1
 */
export const deleteApplicationCommand = Command.make(
  "delete_application",
  {
    applicationId,
    environmentId,
    pingoneToken
  },
  ({ applicationId, environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      return yield* deleteApplication({
        envId,
        token,
        applicationId
      }).pipe(
        Effect.flatMap(() => Console.log(`Application ${applicationId} deleted successfully!`)),
        Effect.catchAll((error) => Console.error(`Failed to delete application: ${error._tag}`))
      )
    })
)
