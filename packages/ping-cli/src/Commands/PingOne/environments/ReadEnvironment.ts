/**
 * Command for reading/retrieving a PingOne environment by ID.
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Console from "effect/Console"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import { readEnvironment } from "../../../HttpClient/EnvironmentClient.js"
import { getToken } from "../ConfigHelper.js"

// Required arguments
const environmentId = Args.text({ name: "environmentId" })

// Required options
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

/**
 * Command to read/retrieve a PingOne environment by ID.
 *
 * @since 0.0.2
 */
export const readEnvironmentCommand = Command.make(
  "read_environment",
  {
    environmentId,
    pingoneToken
  },
  ({ environmentId, pingoneToken }) =>
    Effect.gen(function*() {
      // Get token using helper
      const token = yield* getToken(pingoneToken)

      // Read the environment
      return yield* readEnvironment({
        token,
        environmentId
      }).pipe(
        Effect.flatMap((env) => {
          const createdAt = DateTime.formatIso(env.createdAt)
          const updatedAt = DateTime.formatIso(env.updatedAt)
          return Console.log(
            `Environment Details:\nID: ${env.id}\nName: ${env.name}${
              env.description ? `\nDescription: ${env.description}` : ""
            }\nType: ${env.type}\nRegion: ${env.region}\nLicense: ${env.license.name} (${env.license.id})\nCreated: ${createdAt}\nUpdated: ${updatedAt}`
          )
        }),
        Effect.catchAll((error) => {
          const errorMsg = `Failed to read environment ${environmentId}: ${error._tag}`
          const statusMsg = "status" in error ? ` (HTTP ${error.status})` : ""
          const detailMsg = "message" in error ? `\n  Details: ${error.message}` : ""
          return Console.error(`${errorMsg}${statusMsg}${detailMsg}`)
        })
      )
    })
)
