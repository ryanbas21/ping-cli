import type * as Schema from "effect/Schema"
import type { GitHubDispatchSchema } from "./schemas.js"

export interface WorkflowPayloads<S extends Schema.Schema.Type<typeof GitHubDispatchSchema>> {
  workflowId: string
  ghToken: string
  payload: S
}
