/**
 * Create user command for PingOne CLI
 *
 * @since 0.0.1
 */
import { Args, Command, Options } from "@effect/cli"
import * as Array from "effect/Array"
import * as Config from "effect/Config"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Function from "effect/Function"
import * as Predicate from "effect/Predicate"
import * as EffectString from "effect/String"
import { PingOneAuthError, PingOneValidationError } from "../../Errors.js"
import { createPingOneUser } from "../../HttpClient/PingOneClient.js"
import { getEnvironmentId, getToken } from "./ConfigHelper.js"

// Required arguments
const username = Args.text({ name: "username" })
const email = Args.text({ name: "email" })

// Required options with environment variable fallback
const environmentId = Options.text("environment-id").pipe(Options.withAlias("e"), Options.optional)
const populationId = Options.text("population-id").pipe(Options.withAlias("p"))
const pingoneToken = Options.redacted("pingone-token").pipe(Options.withAlias("t"), Options.optional)

// Optional user data
const givenName = Options.text("given-name").pipe(Options.optional)
const familyName = Options.text("family-name").pipe(Options.optional)
const department = Options.text("department").pipe(Options.optional)
const locales = Options.text("locales").pipe(Options.optional)

/**
 * Command to create a new PingOne user.
 *
 * @since 0.0.1
 */
export const createUser = Command.make(
  "create_user",
  {
    username,
    email,
    environmentId,
    populationId,
    pingoneToken,
    givenName,
    familyName,
    department,
    locales
  },
  ({
    username,
    email,
    environmentId,
    populationId,
    pingoneToken,
    givenName,
    familyName,
    department,
    locales
  }) =>
    Effect.gen(function*() {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "email",
            message: `Invalid email format: ${email}`
          })
        )
      }

      // Validate username is not empty
      if (Function.pipe(username, EffectString.trim, EffectString.isEmpty)) {
        return yield* Effect.fail(
          new PingOneValidationError({
            field: "username",
            message: "Username cannot be empty"
          })
        )
      }

      // Get environment ID and token using helpers
      const envId = yield* getEnvironmentId(environmentId)
      const token = yield* getToken(pingoneToken)

      // Get population ID from config hierarchy (CLI option > env var)
      const popId = yield* Effect.if(
        Predicate.isTruthy(populationId) && !Function.pipe(populationId, EffectString.trim, EffectString.isEmpty),
        {
          onTrue: () => Effect.succeed(populationId),
          onFalse: () =>
            Config.string("PINGONE_POPULATION_ID").pipe(
              Effect.catchAll(() =>
                Effect.fail(
                  new PingOneAuthError({
                    message:
                      "No PingOne population ID provided. Set PINGONE_POPULATION_ID env var or use --population-id",
                    cause:
                      "No PingOne population ID provided. Set PINGONE_POPULATION_ID env var or use --population-id",
                    context: { accessTokenProvided: false }
                  })
                )
              )
            )
        }
      )

      // Build user data object
      const userData: {
        username: string
        email: string
        population: { id: string }
        name?: { given?: string; family?: string }
        department?: string
        locales?: Array<string>
      } = {
        username,
        email,
        population: {
          id: popId
        }
      }

      // Add optional name fields
      if (givenName._tag === "Some" || familyName._tag === "Some") {
        userData.name = {
          given: givenName._tag === "Some" ? givenName.value : undefined,
          family: familyName._tag === "Some" ? familyName.value : undefined
        }
      }

      // Add optional department
      if (department._tag === "Some") {
        userData.department = department.value
      }

      // Add optional locales (comma-separated string to array)
      if (locales._tag === "Some") {
        userData.locales = Function.pipe(
          locales.value.split(","),
          Array.map(EffectString.trim)
        )
      }

      // Create the user
      return yield* createPingOneUser({
        envId,
        token,
        userData
      }).pipe(
        Effect.flatMap((user) =>
          Console.log(
            `User created successfully!\nID: ${user.id}\nUsername: ${user.username}\nEmail: ${user.email}`
          )
        ),
        Effect.catchAll((error) => Console.error(`Failed to create user: ${error._tag}`))
      )
    })
)
