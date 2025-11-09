import { Args, Command } from "@effect/cli"
import type { Schema } from "effect"
import { Config, Effect, Option, Predicate, Redacted } from "effect"
import * as Console from "effect/Console"
import { invokeJsSdkWorkflow } from "../HttpClient/HttpClient.js"
import type { PingPublishWorkflow } from "../HttpClient/schemas.js"

const tag = Args.text({ name: "dist-tag" }).pipe(Args.optional)
const ref = Args.text({ name: "git-ref" }).pipe(Args.optional)
const branch = Args.text({ name: "branch" }).pipe(Args.optional)
const prerelease = Args.text({ name: "prerelease" }).pipe(Args.optional)
const access = Args.text({ name: "npm-access" }).pipe(Args.optional)
const ghToken = Args.redacted({ name: "gh-token" }).pipe(Args.optional)

export const RunPublish = Command.make(
  "RunPublish",
  { ghToken, tag, ref, branch, prerelease, access },
  ({ ghToken, tag, ref, branch, prerelease, access }) =>
    Effect.gen(function*() {
      const token = yield* Effect.if(
        Option.isSome(ghToken) && ghToken.pipe(Option.getOrUndefined, Predicate.isTruthy),
        {
          onTrue: () => Effect.succeed(ghToken.pipe(Option.getOrThrow, Redacted.value)),
          onFalse: () => Config.redacted("GH_TOKEN").pipe(Config.map(Redacted.value))
        }
      )

      const inputs: Record<string, string> = {}

      if (Option.isSome(ref)) inputs.ref = ref.value
      if (Option.isSome(tag)) inputs.tag = tag.value
      if (Option.isSome(branch)) inputs.branch = branch.value
      if (Option.isSome(prerelease)) inputs.prerelease = prerelease.value
      if (Option.isSome(access)) inputs.access = access.value

      const payload = { inputs }

      return yield* invokeJsSdkWorkflow<Schema.Schema.Type<typeof PingPublishWorkflow>>({
        ghToken: token,
        workflowId: "publish.yml",
        payload
      }).pipe(
        Effect.flatMap((response) => Console.log(`Workflow dispatched successfully. Status: ${response.status}`)),
        Effect.catchAll((error) => Console.error(`Failed to dispatch workflow: ${error}`))
      )
    })
)
