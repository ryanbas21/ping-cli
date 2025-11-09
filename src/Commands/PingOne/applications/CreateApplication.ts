import { Args, Command, Options } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { PingOneValidationError } from "../../../Errors.js"
import { createApplication } from "../../../HttpClient/ApplicationClient.js"
import { getEnvironmentId, getToken } from "../ConfigHelper.js"

const name = Args.text({ name: "name" })

const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)
const description = Options.text("description").pipe(Options.optional)
const type = Options.text("type").pipe(Options.withDefault("WEB_APP"))
const protocol = Options.text("protocol").pipe(Options.withDefault("OPENID_CONNECT"))
const enabled = Options.boolean("enabled").pipe(Options.withDefault(true))

export const createApplicationCommand = Command.make(
  "create_application",
  {
    name,
    environmentId,
    pingoneToken,
    description,
    type,
    protocol,
    enabled
  },
  ({ name, environmentId, pingoneToken, description, type, protocol, enabled }) =>
    Effect.gen(function*() {
      if (name.trim().length === 0) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "name",
            message: "Application name cannot be empty"
          })
        )
      }

      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      const applicationData: {
        name: string
        description?: string
        type: string
        protocol: string
        enabled?: boolean
      } = { name, type, protocol }

      if (description._tag === "Some") {
        applicationData.description = description.value
      }

      applicationData.enabled = enabled

      return yield* createApplication({ envId, token, applicationData }).pipe(
        Effect.flatMap((application) =>
          Console.log(
            `Application created successfully!\nID: ${application.id}\nName: ${application.name}${
              application.description ? `\nDescription: ${application.description}` : ""
            }\nType: ${application.type}\nProtocol: ${application.protocol}\nEnabled: ${application.enabled}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to create application: ${error}`))
      )
    })
)
