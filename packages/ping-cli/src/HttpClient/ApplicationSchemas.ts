import { Schema } from "effect"

/**
 * Schema for Application in PingOne
 *
 * @since 0.0.1
 */
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

/**
 * Type inferred from ApplicationSchema
 *
 * @since 0.0.1
 */
export type Application = typeof ApplicationSchema.Type

/**
 * Schema for embedded applications in list response
 *
 * @since 0.0.1
 */
export const ApplicationsEmbeddedSchema = Schema.Struct({
  applications: Schema.Array(ApplicationSchema)
})

/**
 * Schema for list applications response
 *
 * @since 0.0.1
 */
export const ListApplicationsResponseSchema = Schema.Struct({
  _embedded: ApplicationsEmbeddedSchema,
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Type for list applications response
 *
 * @since 0.0.1
 */
export type ListApplicationsResponse = typeof ListApplicationsResponseSchema.Type

/**
 * Schema for create application request
 *
 * @since 0.0.1
 */
export const CreateApplicationRequestSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean),
  type: Schema.String,
  protocol: Schema.String
})

/**
 * Type for create application request
 *
 * @since 0.0.1
 */
export type CreateApplicationRequest = typeof CreateApplicationRequestSchema.Type

/**
 * Schema for update application request
 *
 * @since 0.0.1
 */
export const UpdateApplicationRequestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean)
})

/**
 * Type for update application request
 *
 * @since 0.0.1
 */
export type UpdateApplicationRequest = typeof UpdateApplicationRequestSchema.Type
