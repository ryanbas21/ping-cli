import { Schema } from "effect"

export const ApplicationSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  enabled: Schema.Boolean,
  type: Schema.String,
  protocol: Schema.String,
  createdAt: Schema.optional(Schema.String),
  updatedAt: Schema.optional(Schema.String)
})

export type Application = typeof ApplicationSchema.Type

export const ApplicationsEmbeddedSchema = Schema.Struct({
  applications: Schema.Array(ApplicationSchema)
})

export const ListApplicationsResponseSchema = Schema.Struct({
  _embedded: ApplicationsEmbeddedSchema,
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

export type ListApplicationsResponse = typeof ListApplicationsResponseSchema.Type

export const CreateApplicationRequestSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean),
  type: Schema.String,
  protocol: Schema.String
})

export type CreateApplicationRequest = typeof CreateApplicationRequestSchema.Type

export const UpdateApplicationRequestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean)
})

export type UpdateApplicationRequest = typeof UpdateApplicationRequestSchema.Type
