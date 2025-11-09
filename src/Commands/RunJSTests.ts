import { Args, Command } from "@effect/cli"
import { Config, Effect, Predicate, Redacted } from "effect"
import * as Console from "effect/Console"
import type * as Schema from "effect/Schema"
import { NoGithubToken } from "../Errors"
import { invokeJsSdkWorkflow } from "../HttpClient/HttpClient.js"
import type { PingCIWorkflow } from "../HttpClient/schemas.js"

const baseUrl = Args.text({ name: "tenantUrl" })
const ghToken = Args.redacted({ name: "GH_TOKEN" })
const ref = Args.text({ name: "ref" })
const workflowId = Args.text({ name: "workflowId" })

/**
 * Command to trigger the CI workflow for running JS SDK tests.
 *
 * @since 0.0.1
 */
export const runJSTests = Command.make(
  "RunJSTests",
  { baseUrl, ghToken, ref, workflowId },
  ({ ghToken, baseUrl, ref, workflowId }) =>
    Effect.gen(function*() {
      // Validate baseUrl is a valid URL
      yield* Effect.try({
        try: () => new URL(baseUrl),
        catch: () => new Error(`Invalid tenant URL: ${baseUrl}`)
      })

      // Validate ref is not empty
      yield* Effect.if(ref.trim().length === 0, {
        onTrue: () => Effect.fail(new Error("Git ref cannot be empty")),
        onFalse: () => Effect.succeed(undefined)
      })

      // Validate workflowId is not empty
      yield* Effect.if(workflowId.trim().length === 0, {
        onTrue: () => Effect.fail(new Error("Workflow ID cannot be empty")),
        onFalse: () => Effect.succeed(undefined)
      })
      /**
       * If we have a GH_TOKEN environment variable, use that
       * otherwise, we should look if we passed in a `ghToken`
       * via a cli argument. If we did not, then we fail.
       */
      const token = yield* Config.redacted("GH_TOKEN").pipe(
        Config.withDefault(ghToken),
        Config.map(Redacted.value)
      )

      return yield* Effect.if(Predicate.isTruthy(token), {
        onTrue: () =>
          invokeJsSdkWorkflow<Schema.Schema.Type<typeof PingCIWorkflow>>({
            ghToken: token,
            workflowId: "CI.yml",
            payload: { inputs: { baseUrl }, ref }
          }).pipe(
            Effect.flatMap((response) => Console.log(`Workflow dispatched successfully. Status: ${response.status}`)),
            Effect.catchAll((error) => Console.error(`Failed to dispatch workflow: ${error._tag}`))
          ),
        onFalse: () =>
          Effect.fail(
            new NoGithubToken({
              cause:
                "No Github token provided. Please provide a GH_TOKEN either in your environment, or through a CLI argument."
            })
          )
      })
    })
)

/**
 * CLI runner for the RunJSTests command.
 *
 * @since 0.0.1
 */
export const cli = Command.run(runJSTests, {
  name: "JS SDK Cli",
  version: "v0.0.1"
})
