import * as Schema from "effect/Schema"

export const PingCIWorkflow = Schema.Struct({
  ref: Schema.String,
  inputs: Schema.Struct({
    baseUrl: Schema.String
  })
})

export const PingPublishWorkflow = Schema.Struct({
  inputs: Schema.Struct({
    ref: Schema.optional(Schema.String),
    tag: Schema.optional(Schema.String),
    branch: Schema.optional(Schema.String),
    prerelease: Schema.optional(Schema.String),
    access: Schema.optional(Schema.String)
  })
})

export const GitHubDispatchSchema = Schema.Union(PingCIWorkflow, PingPublishWorkflow)
