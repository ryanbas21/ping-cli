import { HttpClientRequest } from "@effect/platform"
import { HttpClient } from "@effect/platform/HttpClient"
import type { Schema } from "effect"
import { Effect } from "effect"
import { WorkflowDispatchError } from "../Errors"
import { GitHubDispatchSchema } from "./schemas"
import type { WorkflowPayloads } from "./types"

export const invokeJsSdkWorkflow = <S extends Schema.Schema.Type<typeof GitHubDispatchSchema>>(
  { workflowId, ghToken, payload }: WorkflowPayloads<S>
) =>
  HttpClientRequest.post(
    `https://api.github.com/repos/ForgeRock/ping-javascript-sdk/actions/workflows/${workflowId}/dispatches`
  )
    .pipe(
      HttpClientRequest.bearerToken(ghToken),
      HttpClientRequest.accept("application/vnd.github+json"),
      HttpClientRequest.setHeader("X-GitHub-Api-Version", "2022-11-28"),
      HttpClientRequest.schemaBodyJson(GitHubDispatchSchema)(payload),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new WorkflowDispatchError({
                status: response.status,
                message: `GitHub API request failed with status ${response.status}`
              })
            )
        })
      )
    )
